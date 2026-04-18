// app/api/billing/checkout/route.ts
// Central billing authority — Stripe Checkout session creation.
// Supports both subscription (plan upgrades) and payment (credit pack one-time) modes.
// Updated: April 16, 2026 — getStripe() via process.env.STRIPE_SECRET_KEY. Clean rebuild #1776349322.
//
// POST { priceId, userId, email, mode?, successUrl?, cancelUrl? }
// mode: "subscription" (default) | "payment"
// Returns { url } — redirect to Stripe hosted checkout.
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

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


// ── Dynamic CORS — reflect origin if it's craudiovizai.com or any vercel.app ─
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
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Subscription price → plan tier mapping
const PRICE_TIERS: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID     ?? process.env.STRIPE_PRICE_PRO     ?? '']: 'pro',
  [process.env.STRIPE_CREATOR_PRICE_ID ?? process.env.STRIPE_PRICE_PREMIUM ?? '']: 'power',
}

// Credit pack price → credit amount mapping (live + test)
const PACK_CREDITS: Record<string, number> = {
  'price_1SdaLa7YeQ1dZTUvsjFZWqjB':  150,   // Live 150 Credit Pack  ($12.99)
  'price_1TLpfF7WStdnOczMQUAzDaOp':  150,   // Test 150 Credit Pack  ($12.99)
}

// DO NOT ADD NEW PRICE IDS WITHOUT STRIPE + CODE SYNC
const VALID_PRICE_IDS = [
  'price_1SdaLa7YeQ1dZTUvsjFZWqjB',  // live 150 Credit Pack  ($12.99)
  'price_1TLpfF7WStdnOczMQUAzDaOp',  // test 150 Credit Pack  ($12.99)
]

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
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
      return NextResponse.json({ error: 'priceId, userId, and email are required' }, { status: 400, headers: corsHeaders })
    }

    console.log('CHECKOUT REQUEST BODY', body)
    console.log('STRIPE KEY PREFIX', process.env.STRIPE_SECRET_KEY?.slice(0, 10))
    console.log('PRICE ID', priceId)

    const s        = getStripe()
    const supabase = db()
    const host      = req.headers.get('host') ?? 'craudiovizai.com'
    const protocol  = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl   = `${protocol}://${host}`

    // ── Resolve or create Stripe customer ─────────────────────────────────────────────
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

    console.log('PROD STRIPE DEBUG', {
      keyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 10),
      hasKey:    !!process.env.STRIPE_SECRET_KEY,
      priceId,
    })

    // ── Price ID validation ────────────────────────────────────────────────────────
    if (!VALID_PRICE_IDS.includes(priceId)) {
      console.error('INVALID PRICE ID ATTEMPT', priceId)
      return NextResponse.json(
        { error: 'Invalid price configuration' },
        { status: 400, headers: corsHeaders }
      )
    }

    // ── Subscription mode ──────────────────────────────────────────────────────────
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
      console.log('CHECKOUT RESPONSE', {
        url:       session.url,
        sessionId: session.id,
      })
      return NextResponse.json({ url: session.url, sessionId: session.id }, { headers: corsHeaders })
    }

    // ── Payment mode — one-time credit pack purchase ───────────────────────────────────────
    if (mode === 'payment') {
      const creditsGranted = PACK_CREDITS[priceId]
      if (!creditsGranted) {
        return NextResponse.json(
          { error: `Unknown credit pack priceId: ${priceId}` },
          { status: 400, headers: corsHeaders }
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
      console.log('CHECKOUT RESPONSE', {
        url:       session.url,
        sessionId: session.id,
      })
      return NextResponse.json({ url: session.url, sessionId: session.id }, { headers: corsHeaders })
    }

    return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400, headers: corsHeaders })

  } catch (err: unknown) {
    const msg   = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack   : undefined
    console.error('CHECKOUT ERROR FULL', {
      message: msg,
      stack,
    })
    console.error('[billing/checkout] error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: corsHeaders }
    )
  }
}
