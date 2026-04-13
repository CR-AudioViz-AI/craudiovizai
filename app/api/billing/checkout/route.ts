// app/api/billing/checkout/route.ts
// Central billing authority — Stripe Checkout session creation.
// Supports both subscription (plan upgrades) and payment (credit pack one-time) modes.
// Updated: April 13, 2026 — env-split price IDs; STRIPE_PRICE_TEST/LIVE vars active.
//
// POST { priceId, userId, email, mode?, successUrl?, cancelUrl? }
// mode: "subscription" (default) | "payment"
// Returns { url } — redirect to Stripe hosted checkout.
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getSecret } from '@/lib/vault/getSecret'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function stripe(req: NextRequest): Promise<Stripe> {
  const host      = req.headers.get('host') || ''
  const cleanHost = host.split(':')[0]
  const isProd    = cleanHost === 'craudiovizai.com' || cleanHost === 'www.craudiovizai.com'
  const vaultKey  = isProd ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST'

  // Safety guard — hard crash if non-prod host ever resolves to LIVE key
  if (!isProd && vaultKey === 'STRIPE_SECRET_KEY_LIVE') {
    throw new Error('🚨 SAFETY VIOLATION: Preview attempting to use LIVE Stripe key')
  }

  const STRIPE_SECRET_KEY = await getSecret(vaultKey).catch(() => null)
  if (!STRIPE_SECRET_KEY) {
    throw new Error(`Stripe key missing for ${vaultKey}`)
  }

  console.log('STRIPE HARD LOCK', { host, cleanHost, isProd, vaultKey })

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
}

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Subscription price → plan tier mapping
const PRICE_TIERS: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID     ?? process.env.STRIPE_PRICE_PRO     ?? '']: 'pro',
  [process.env.STRIPE_CREATOR_PRICE_ID ?? process.env.STRIPE_PRICE_PREMIUM ?? '']: 'power',
}

// Credit pack price → credit amount mapping (for metadata on webhook)
const PACK_CREDITS: Record<string, number> = {
  'price_1SdaLR7YeQ1dZTUvX4qPsy3c':  50,    // Starter Pack  ($4.99)
  'price_1SdaLa7YeQ1dZTUvsjFZWqjB':  150,   // Creator Pack  ($12.99)
  'price_1SdaLk7YeQ1dZTUvdcDKtnTI':  525,   // Pro Pack      ($39.99)
  'price_1SdaLt7YeQ1dZTUvGhjqaNyk':  1300,  // Studio Pack   ($89.99)
}

export async function POST(req: NextRequest) {
  console.log('CHECKOUT HIT', {
    host:     req.headers.get('host'),
    origin:   req.headers.get('origin'),
    method:   req.method,
  })
  console.log('STRIPE KEY EXISTS:', !!process.env.STRIPE_SECRET_KEY,
    '| prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7) ?? 'MISSING')
  try {
    const body = await req.json()
    const {
      priceId,
      userId,
      email,
      mode       = 'subscription',
      successUrl,
      cancelUrl,
    } = body as {
      priceId:     string
      userId:      string
      email:       string
      mode?:       'subscription' | 'payment'
      successUrl?: string
      cancelUrl?:  string
    }

    if (!priceId || !userId || !email) {
      return NextResponse.json({ error: 'priceId, userId, and email are required' }, { status: 400 })
    }

    const s        = await stripe(req)
    const supabase = db()
    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://craudiovizai.com'

    // ── Resolve or create Stripe customer ─────────────────────────────────────
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
      } catch (_) { /* subscription may have expired */ }
    }

    if (!customerId) {
      const existing = await s.customers.list({ email, limit: 1 })
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const customer = await s.customers.create({ email, metadata: { userId } })
        customerId = customer.id
      }
    }

    // ── Subscription mode ──────────────────────────────────────────────────────
    if (mode === 'subscription') {
      const session = await s.checkout.sessions.create({
        customer:    customerId,
        mode:        'subscription',
        line_items:  [{ price: priceId, quantity: 1 }],
        success_url: successUrl ?? `${baseUrl}/account/billing?success=1`,
        cancel_url:  cancelUrl  ?? `${baseUrl}/pricing?canceled=1`,
        metadata:    { userId, plan_tier: PRICE_TIERS[priceId] ?? 'unknown' },
        subscription_data: { metadata: { userId } },
        allow_promotion_codes: true,
      })
      console.log('CHECKOUT SESSION CREATED', {
        mode:      'subscription',
        userId,
        priceId,
        sessionId: session.id,
        url:       session.url?.slice(0, 60) + '...',
      })
      return NextResponse.json({ url: session.url, sessionId: session.id })
    }

    // ── Payment mode — one-time credit pack purchase ───────────────────────────
    if (mode === 'payment') {
      const creditsGranted = PACK_CREDITS[priceId]
      if (!creditsGranted) {
        return NextResponse.json(
          { error: `Unknown credit pack priceId: ${priceId}` },
          { status: 400 }
        )
      }

      const session = await s.checkout.sessions.create({
        customer:    customerId,
        mode:        'payment',
        line_items:  [{ price: priceId, quantity: 1 }],
        success_url: successUrl ?? `${baseUrl}/account/credits?success=1`,
        cancel_url:  cancelUrl  ?? `${baseUrl}/pricing?canceled=1`,
        metadata: {
          userId,
          purchase_type:   'credit_pack',
          credits_granted: String(creditsGranted),
          price_id:        priceId,
        },
        payment_intent_data: {
          metadata: {
            userId,
            credits_granted: String(creditsGranted),
            price_id:        priceId,
          },
        },
      })
      console.log('CHECKOUT SESSION CREATED', {
        mode:           'payment',
        userId,
        priceId,
        creditsGranted: PACK_CREDITS[priceId],
        sessionId:      session.id,
        url:            session.url?.slice(0, 60) + '...',
      })
      return NextResponse.json({ url: session.url, sessionId: session.id })
    }

    return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('CHECKOUT ERROR FULL', {
      message: msg,
      type:    err instanceof Error ? err.constructor.name : typeof err,
      stack:   err instanceof Error ? err.stack?.split('\n').slice(0, 5).join(' | ') : undefined,
    })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
