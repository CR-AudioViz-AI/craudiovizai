// app/api/billing/webhook/route.ts
// Central billing authority — Stripe webhook handler.
// Handles: checkout.session.completed, customer.subscription.updated/deleted,
//          invoice.payment_failed
// Writes to: user_subscriptions, billing_events, usage_ledger (credits)
// Updated: April 16, 2026 — getStripe() from process.env.STRIPE_SECRET_KEY. Webhook rebuild 1776355080.
//
// IDEMPOTENCY GUARANTEE:
//   Every event is logged to billing_events with processed=false on arrival.
//   Processing only runs when processed=false. After success, set processed=true.
//   Stripe retries the same event.id → skip guard fires → no double grant.
//   This holds for both subscription grants and credit pack grants.
//
// CREDIT GRANT SOURCES:
//   subscription  → SUBSCRIPTION_CREDIT_MAP[priceId]   (monthly plan credits)
//   credit_pack   → metadata.credits_granted            (one-time pack, exact value)
//                   fallback → PACK_CREDIT_MAP[priceId]
//
// PURCHASE TYPE DETECTION:
//   session.metadata.purchase_type === "credit_pack" → pack flow
//   session.metadata.purchase_type === undefined      → subscription flow (default)
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// ── Stripe factory — reads STRIPE_SECRET_KEY from Vercel env-split ────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY

  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  console.log('STRIPE KEY PREFIX:', key.slice(0, 7))

  const isTestMode = key.startsWith('sk_test_')
  console.log('STRIPE MODE DETECTED:', isTestMode ? 'TEST' : 'LIVE')

  return new Stripe(key, {
    apiVersion: '2024-06-20',
  })
}

// ── Dynamic CORS — reflect origin if it is craudiovizai.com or any vercel.app ─
function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin  = req.headers.get('origin') || ''
  const allowed = origin.includes('craudiovizai.com') || origin.includes('.vercel.app')
  return {
    'Access-Control-Allow-Origin':      allowed ? origin : '',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':     'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 200, headers: getCorsHeaders(req) })
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
  // Test mode subscription prices
  'price_1TLpfB7WStdnOczMs3Dju7K5': 150,   // Test Starter Plan  ($9.99/mo)
  'price_1TLpfC7WStdnOczMi9sINEOz': 600,   // Test Pro Plan      ($29.99/mo)
  'price_1TLpfD7WStdnOczMFkogOrrb': 2500,  // Test Premium Plan  ($99.99/mo)
}

// ── Credit pack → exact credit grant (live + test) ───────────────────────────
const PACK_CREDIT_MAP: Record<string, number> = {
  // Live prices
  'price_1SdaLR7YeQ1dZTUvX4qPsy3c': 50,    // Starter Pack  ($4.99)
  'price_1SdaLa7YeQ1dZTUvsjFZWqjB': 150,   // Creator Pack  ($12.99)
  'price_1SdaLk7YeQ1dZTUvdcDKtnTI': 525,   // Pro Pack      ($39.99)
  'price_1SdaLt7YeQ1dZTUvGhjqaNyk': 1300,  // Studio Pack   ($89.99)
  // Test prices
  'price_1TLpfE7WStdnOczMrm2AQtU2': 50,    // Test Starter Pack  ($4.99)
  'price_1TLpfF7WStdnOczMQUAzDaOp': 150,   // Test Creator Pack  ($12.99)
  'price_1TLpfG7WStdnOczMCKHDxNfh': 525,   // Test Pro Pack      ($39.99)
  'price_1TLpfH7WStdnOczM2s4wyovQ': 1300,  // Test Studio Pack   ($89.99)
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

  console.log('[billing/webhook] CREDIT_GRANT', {
    userId:         userId.slice(0, 8) + '…',
    credits,
    source,
    priceId,
    stripeEventId:  stripeEventId.slice(0, 16) + '…',
  })
}

// ── Webhook POST handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  const supabase    = db()
  const s           = getStripe()

  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // Read webhook secret from env — must start with whsec_
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret || !secret.startsWith('whsec_')) {
    console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET missing or invalid (must start with whsec_)')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500, headers: corsHeaders })
  }

  // ── Signature verification (raw body required) ────────────────────────────
  let event: Stripe.Event
  try {
    event = s.webhooks.constructEvent(payload, signature, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/webhook] signature failed:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers: corsHeaders })
  }

  console.log('WEBHOOK RECEIVED', event.type)
  console.log('EVENT ID', event.id.slice(0, 24) + '...')

  // ── Idempotency guard ──────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .eq('processed', true)
    .maybeSingle()

  if (existing) {
    console.log(`[billing/webhook] duplicate skipped: ${event.id}`)
    return new Response(JSON.stringify({ received: true, skipped: 'duplicate' }), { status: 200 })
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

        console.log('USER ID', userId)
        console.log('PURCHASE TYPE', purchaseType ?? 'subscription')

        if (!userId) {
          console.warn('[billing/webhook] checkout.session.completed — no userId in metadata')
          break
        }

        if (purchaseType === 'credit_pack') {
          // Credit pack — use price_id from metadata or fall back to session line item
          const priceId     = session.metadata?.price_id ?? ''
          const metaCredits = parseInt(session.metadata?.credits_granted ?? '0', 10)
          const credits     = metaCredits > 0 ? metaCredits : (PACK_CREDIT_MAP[priceId] ?? 0)

          console.log('CREDIT PACK', { priceId, metaCredits, credits })

          if (credits === 0) {
            console.error('[billing/webhook] credit_pack — credits=0, priceId:', priceId)
            break
          }

          await grantCreditsToLedger(supabase, userId, credits, 'stripe_pack', priceId, event.id)
          console.log('CREDITS UPDATED', {
            source:  'stripe_pack',
            userId:  userId.slice(0, 8) + '…',
            credits,
            priceId,
            eventId: event.id.slice(0, 20) + '...',
          })
          break
        }

        // Subscription checkout
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
          console.log('CREDITS UPDATED', {
            source:    'stripe_subscription',
            userId:    userId.slice(0, 8) + '…',
            credits,
            subPriceId,
            eventId:   event.id.slice(0, 20) + '...',
          })
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

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/webhook] handler error:', { type: event.type, msg })
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders })
  }
}
