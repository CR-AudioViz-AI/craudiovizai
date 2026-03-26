// app/api/billing/webhook/route.ts
// Central billing authority — Stripe webhook handler.
// Handles: checkout.session.completed, customer.subscription.updated/deleted,
//          invoice.payment_failed
// Writes to: user_subscriptions, billing_events, usage_ledger (credits)
// Updated: March 26, 2026 — vault-first STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.
//
// IDEMPOTENCY GUARANTEE:
//   Every event is logged to billing_events with processed=false on arrival.
//   Processing only runs when processed=false. After success, set processed=true.
//   Stripe retries the same event.id → skip guard fires → no double grant.
//   This holds for both subscription grants and credit pack grants.
//
// CREDIT GRANT SOURCES:
//   subscription  → CREDIT_MAP[priceId]          (monthly plan credits)
//   credit_pack   → metadata.credits_granted     (one-time pack, exact value)
//
// PURCHASE TYPE DETECTION:
//   session.metadata.purchase_type === "credit_pack" → pack flow
//   session.metadata.purchase_type === undefined      → subscription flow (default)
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getSecret } from '@/lib/vault/getSecret'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function stripe(): Promise<Stripe> {
  const STRIPE_SECRET_KEY =
    (await getSecret('STRIPE_SECRET_KEY').catch(() => null)) ||
    process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Subscription plan → monthly credit grant ──────────────────────────────────
const SUBSCRIPTION_CREDIT_MAP: Record<string, number> = {
  'price_1SdaKx7YeQ1dZTUvCeaYqKXh': 150,   // Starter Plan  ($9.99/mo)
  'price_1SdaL67YeQ1dZTUv43H6YxGq': 600,   // Pro Plan      ($29.99/mo)
  'price_1SdaLG7YeQ1dZTUvCzgdjaTp': 2500,  // Premium Plan  ($99.99/mo)
  'price_1Sk8AZ7YeQ1dZTUvwpubHpWW': 2000,  // Legacy Pro
}

// ── Credit pack → exact credit grant ─────────────────────────────────────────
const PACK_CREDIT_MAP: Record<string, number> = {
  'price_1SdaLR7YeQ1dZTUvX4qPsy3c': 50,    // Starter Pack  ($4.99)
  'price_1SdaLa7YeQ1dZTUvsjFZWqjB': 150,   // Creator Pack  ($12.99)
  'price_1SdaLk7YeQ1dZTUvdcDKtnTI': 525,   // Pro Pack      ($39.99)
  'price_1SdaLt7YeQ1dZTUvGhjqaNyk': 1300,  // Studio Pack   ($89.99)
}

// ── Subscription tier map ─────────────────────────────────────────────────────
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID     ?? process.env.STRIPE_PRICE_PRO      ?? 'unset_pro']:   'pro',
  [process.env.STRIPE_CREATOR_PRICE_ID ?? process.env.STRIPE_PRICE_PREMIUM  ?? 'unset_power']: 'power',
}

function getTier(sub: Stripe.Subscription): string {
  const priceId = sub.items.data[0]?.price?.id ?? ''
  return PRICE_TO_TIER[priceId] ?? 'pro'
}

async function upsertSubscription(
  supabase: ReturnType<typeof db>,
  userId:   string,
  sub:      Stripe.Subscription,
) {
  const tier   = getTier(sub)
  const status = sub.status === 'active'   ? 'active'
               : sub.status === 'canceled' ? 'canceled'
               : sub.status === 'past_due' ? 'past_due'
               : 'active'

  await supabase.from('user_subscriptions').upsert({
    user_id:                  userId,
    provider:                 'stripe',
    provider_subscription_id: sub.id,
    plan_tier:                tier,
    status,
    current_period_end:       (sub.current_period_end ?? 0) * 1000,
    updated_at:               new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })
}

async function grantCreditsToLedger(
  supabase:       ReturnType<typeof db>,
  userId:         string,
  credits:        number,
  source:         'stripe_subscription' | 'stripe_pack',
  priceId:        string,
  stripeEventId:  string,
): Promise<void> {
  if (credits <= 0) {
    console.warn(`[billing/webhook] grantCreditsToLedger called with credits=${credits} — skipping`)
    return
  }

  await supabase.from('usage_ledger').insert({
    user_id:     userId,
    feature:     'credits',
    usage_count: credits,
    metadata: {
      type:            'grant',
      source,
      price_id:        priceId,
      stripe_event_id: stripeEventId,
    },
  })

  console.log(`[billing/webhook] CREDIT_GRANT`, {
    userId:         userId.slice(0, 8) + '…',
    credits,
    source,
    priceId,
    stripeEventId:  stripeEventId.slice(0, 16) + '…',
  })
}

// ── Webhook POST handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = db()
  const s        = await stripe()

  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // Vault-first webhook secret with process.env fallback
  const secret =
    (await getSecret('STRIPE_WEBHOOK_SECRET').catch(() => null)) ||
    process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // ── Signature verification ─────────────────────────────────────────────────
  let event: Stripe.Event
  try {
    event = s.webhooks.constructEvent(payload, signature, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/webhook] signature failed:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Idempotency guard ──────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .eq('processed', true)
    .maybeSingle()

  if (existing) {
    console.log(`[billing/webhook] duplicate skipped: ${event.id}`)
    return NextResponse.json({ received: true, skipped: 'duplicate' })
  }

  // ── Log raw event ─────────────────────────────────────────────────────────
  await supabase.from('billing_events').upsert({
    stripe_event_id: event.id,
    event_type:      event.type,
    payload:         event.data as Record<string, unknown>,
    processed:       false,
  }, { onConflict: 'stripe_event_id' })

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session      = event.data.object as Stripe.Checkout.Session
        const userId       = session.metadata?.userId
        const purchaseType = session.metadata?.purchase_type

        if (!userId) {
          console.warn('[billing/webhook] checkout.session.completed — no userId in metadata')
          break
        }

        if (purchaseType === 'credit_pack') {
          const priceId     = session.metadata?.price_id ?? ''
          const metaCredits = parseInt(session.metadata?.credits_granted ?? '0', 10)
          const credits     = metaCredits > 0 ? metaCredits : (PACK_CREDIT_MAP[priceId] ?? 0)

          if (credits === 0) {
            console.error('[billing/webhook] credit_pack — credits=0, priceId:', priceId)
            break
          }

          await grantCreditsToLedger(supabase, userId, credits, 'stripe_pack', priceId, event.id)
          break
        }

        let subPriceId = ''
        let credits    = 0

        if (session.subscription) {
          const sub  = await s.subscriptions.retrieve(session.subscription as string)
          subPriceId = sub.items.data[0]?.price?.id ?? ''
          credits    = SUBSCRIPTION_CREDIT_MAP[subPriceId] ?? 0
          await upsertSubscription(supabase, userId, sub)
        }

        if (credits > 0) {
          await grantCreditsToLedger(supabase, userId, credits, 'stripe_subscription', subPriceId, event.id)
        } else if (session.mode === 'subscription') {
          console.warn('[billing/webhook] subscription checkout — no credit grant for priceId:', subPriceId)
        }

        break
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break
        await upsertSubscription(supabase, userId, sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break
        await supabase.from('user_subscriptions')
          .update({ status: 'canceled', plan_tier: 'free', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('provider', 'stripe')
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const userId  = (invoice.subscription_details?.metadata?.userId) as string | undefined
        if (!userId) break
        await supabase.from('user_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('provider', 'stripe')
        break
      }
    }

    await supabase.from('billing_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true, type: event.type })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/webhook] handler error:', { type: event.type, msg })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
