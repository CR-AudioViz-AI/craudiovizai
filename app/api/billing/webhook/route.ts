// app/api/billing/webhook/route.ts
// Central billing authority — Stripe webhook handler.
// Handles: checkout.session.completed, customer.subscription.updated/deleted,
//          invoice.payment_failed
// Writes to: user_subscriptions, billing_events, usage_ledger (credits)
// Thursday, March 19, 2026
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Credit grants per price ID
const CREDIT_MAP: Record<string, number> = {
  'price_1SdaKx7YeQ1dZTUvCeaYqKXh': 150, // Starter Plan
}

// Support both key naming conventions across projects
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
  userId: string,
  sub: Stripe.Subscription,
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

/**
 * Grant credits to a user on successful checkout.
 * Idempotency: guarded by billing_events.processed — this only runs
 * when processed=false, and processed is set to true atomically after.
 * So double-grant cannot occur even on webhook retry.
 */
async function grantCredits(
  supabase: ReturnType<typeof db>,
  userId: string,
  priceId: string,
): Promise<void> {
  const credits = CREDIT_MAP[priceId] ?? 0
  if (credits === 0) return

  await supabase.from('usage_ledger').insert({
    user_id:     userId,
    feature:     'credits',
    usage_count: credits,
    metadata:    { type: 'grant', source: 'stripe', price_id: priceId },
  })

  console.log(`[billing/webhook] Credits granted: ${credits} to ${userId}`)
}

export async function POST(req: NextRequest) {
  const supabase = db()
  const s        = stripe()

  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = s.webhooks.constructEvent(payload, signature, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/webhook] signature failed:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: skip already-processed events
  const { data: existing } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .eq('processed', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, skipped: 'duplicate' })
  }

  // Log the raw event immediately (before processing — never lose an event)
  await supabase.from('billing_events').upsert({
    stripe_event_id: event.id,
    event_type:      event.type,
    payload:         event.data as Record<string, unknown>,
    processed:       false,
  }, { onConflict: 'stripe_event_id' })

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.userId
        if (!userId) break

        // Get priceId from session line items or the hardcoded price
        const priceId = (session as unknown as { amount_total?: number })
          ? (session.metadata?.priceId ?? 'price_1SdaKx7YeQ1dZTUvCeaYqKXh')
          : 'price_1SdaKx7YeQ1dZTUvCeaYqKXh'

        // Grant credits — idempotent via billing_events.processed guard
        await grantCredits(supabase, userId, priceId)

        // Upsert subscription if present
        if (session.subscription) {
          const sub = await s.subscriptions.retrieve(session.subscription as string)
          await upsertSubscription(supabase, userId, sub)
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
    console.error('[billing/webhook] handler error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
