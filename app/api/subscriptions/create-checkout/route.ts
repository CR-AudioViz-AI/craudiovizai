// Stripe Subscription API - Annual Plans
// Timestamp: January 1, 2026 - 3:00 PM EST

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLANS = {
  creator: {
    name: 'Creator Annual',
    priceId: process.env.STRIPE_CREATOR_PRICE_ID || 'price_creator_annual',
    credits: 1000,
    features: ['full_library', 'audiobooks', 'downloads', 'conversion_discount_50']
  },
  pro: {
    name: 'Pro Annual', 
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_annual',
    credits: 5000,
    features: ['full_library', 'audiobooks', 'downloads', 'source_files', 'commercial_license', 'api_access', 'conversion_discount_75', 'white_label']
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = PLANS[planId as keyof typeof PLANS]

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json({ 
        error: 'You already have an active subscription',
        currentPlan: existingSub.plan_id
      }, { status: 400 })
    }

    let stripeCustomerId: string

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (userData?.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email || userData?.email,
        metadata: { user_id: user.id }
      })
      stripeCustomerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id, plan_id: planId }
      },
      success_url: process.env.NEXT_PUBLIC_APP_URL + '/apps/javari-library/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/apps/javari-library/subscribe',
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (error: any) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subscription) {
      return NextResponse.json({ hasSubscription: false, plan: null, status: 'none' })
    }

    return NextResponse.json({
      hasSubscription: subscription.status === 'active',
      plan: subscription.plan_id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
