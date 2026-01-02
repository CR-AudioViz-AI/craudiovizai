// Stripe Webhook Handler - Subscription Events
// Timestamp: January 1, 2026 - 3:35 PM EST

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_CREDITS = {
  creator: 1000,
  pro: 5000
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const userId = subscription.metadata.user_id
          const planId = subscription.metadata.plan_id as 'creator' | 'pro'
          
          if (userId && planId) {
            // Create subscription record
            await supabase.from('subscriptions').insert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              plan_id: planId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end
            })
            
            // Add monthly credits
            const credits = PLAN_CREDITS[planId] || 1000
            await supabase.rpc('add_user_credits', {
              p_user_id: userId,
              p_credits: credits
            })
            
            // Update user subscription status
            await supabase.from('users').update({
              subscription_tier: planId,
              subscription_status: 'active'
            }).eq('id', userId)
            
            console.log(`Subscription created for user ${userId}, plan: ${planId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id
        
        if (userId) {
          await supabase.from('subscriptions').update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          }).eq('stripe_subscription_id', subscription.id)
          
          await supabase.from('users').update({
            subscription_status: subscription.status
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id
        
        if (userId) {
          await supabase.from('subscriptions').update({
            status: 'canceled',
            canceled_at: new Date().toISOString()
          }).eq('stripe_subscription_id', subscription.id)
          
          await supabase.from('users').update({
            subscription_tier: 'free',
            subscription_status: 'canceled'
          }).eq('id', userId)
          
          console.log(`Subscription canceled for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Monthly credit refresh for recurring payments
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          const userId = subscription.metadata.user_id
          const planId = subscription.metadata.plan_id as 'creator' | 'pro'
          
          if (userId && planId) {
            const credits = PLAN_CREDITS[planId] || 1000
            await supabase.rpc('add_user_credits', {
              p_user_id: userId,
              p_credits: credits
            })
            console.log(`Monthly credits refreshed for user ${userId}: ${credits}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.error(`Payment failed for invoice ${invoice.id}`)
        // Could send notification to user here
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
