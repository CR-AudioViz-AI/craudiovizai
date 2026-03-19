// app/api/billing/checkout/route.ts
// Central billing authority — Stripe Checkout session creation.
// Moved from javari-ai. javari-ai no longer owns any billing logic.
// POST { priceId, userId, email, successUrl?, cancelUrl? }
// Returns { url } — redirect to Stripe hosted checkout.
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
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Map Stripe price IDs to plan tiers — support both env var naming conventions
const PRICE_TIERS: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID     ?? process.env.STRIPE_PRICE_PRO     ?? '']: 'pro',
  [process.env.STRIPE_CREATOR_PRICE_ID ?? process.env.STRIPE_PRICE_PREMIUM ?? '']: 'power',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { priceId, userId, email } = body as { priceId: string; userId: string; email: string }

    if (!priceId || !userId || !email) {
      return NextResponse.json({ error: 'priceId, userId, and email are required' }, { status: 400 })
    }

    const s        = stripe()
    const supabase = db()

    // Reuse existing Stripe customer if present
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id, provider_subscription_id')
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .limit(1)
      .maybeSingle()

    let customerId: string | undefined

    if (existingSub?.provider_subscription_id) {
      try {
        const sub = await s.subscriptions.retrieve(existingSub.provider_subscription_id)
        customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      } catch (_) { /* subscription may have been deleted */ }
    }

    if (!customerId) {
      const customer = await s.customers.create({ email, metadata: { userId } })
      customerId = customer.id
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://craudiovizai.com'

    const session = await s.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl ?? `${baseUrl}/account/billing?success=1`,
      cancel_url:  body.cancelUrl  ?? `${baseUrl}/pricing?canceled=1`,
      metadata:   { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
