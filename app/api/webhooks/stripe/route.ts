// /app/api/webhooks/stripe/route.ts
// Stripe Webhook Handler - CR AudioViz AI
// Handles subscription events, payment success, credit provisioning

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe webhook secret for verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Credit amounts per tier
const TIER_CREDITS: Record<string, number> = {
  starter: 500,
  pro: 2000,
  business: 10000
};

// Yearly bonus credits
const YEARLY_BONUS: Record<string, number> = {
  starter: 100,
  pro: 500,
  business: 2000
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    // In production, verify the webhook signature
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    event = JSON.parse(body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.user_id;
  const mode = session.mode; // 'subscription' or 'payment'
  
  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  if (mode === 'payment') {
    // One-time credit purchase
    const credits = parseInt(session.metadata?.credits || '0');
    if (credits > 0) {
      await provisionCredits(userId, credits, 'credit_purchase', session.id);
    }
  }

  // Log analytics event
  await logAnalyticsEvent(userId, 'checkout_completed', {
    mode,
    amount: session.amount_total,
    currency: session.currency
  });
}

async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const tier = subscription.metadata?.tier || 'starter';
  const interval = subscription.items.data[0]?.plan?.interval || 'month';
  
  // Calculate period end
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Upsert subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    tier,
    status: subscription.status,
    interval,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end
  }, { onConflict: 'user_id' });

  // Update user profile
  await supabase
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);

  // Provision initial credits
  let credits = TIER_CREDITS[tier] || 500;
  if (interval === 'year') {
    credits += YEARLY_BONUS[tier] || 0;
  }
  
  await provisionCredits(userId, credits, 'subscription_start', subscription.id);
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const tier = subscription.metadata?.tier || 'starter';

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user profile tier
  await supabase
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade user to free tier
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('id', userId);

  // Log event
  await logAnalyticsEvent(userId, 'subscription_cancelled', {
    subscription_id: subscription.id
  });
}

async function handleInvoicePaid(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Get subscription to find user
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, tier, interval')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub) return;

  // Provision monthly credits for renewal
  let credits = TIER_CREDITS[sub.tier] || 500;
  if (sub.interval === 'year') {
    credits += YEARLY_BONUS[sub.tier] || 0;
  }

  await provisionCredits(sub.user_id, credits, 'subscription_renewal', invoice.id);

  // Record payment
  await supabase.from('payments').insert({
    user_id: sub.user_id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    type: 'subscription'
  });
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub) return;

  // Log failed payment
  await supabase.from('payments').insert({
    user_id: sub.user_id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    type: 'subscription'
  });

  // TODO: Send email notification about failed payment
}

async function handlePaymentSucceeded(paymentIntent: any) {
  const userId = paymentIntent.metadata?.user_id;
  const credits = parseInt(paymentIntent.metadata?.credits || '0');

  if (userId && credits > 0) {
    await provisionCredits(userId, credits, 'credit_purchase', paymentIntent.id);
  }
}

async function provisionCredits(
  userId: string,
  amount: number,
  source: string,
  referenceId: string
) {
  // Insert credit ledger entry
  await supabase.from('credits_ledger').insert({
    user_id: userId,
    amount,
    type: 'credit',
    source,
    reference_id: referenceId,
    expires_at: null // Credits never expire on paid plans
  });

  // Update user's credit balance using RPC
  await supabase.rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: amount
  });

  // Log analytics
  await logAnalyticsEvent(userId, 'credits_provisioned', {
    amount,
    source,
    reference_id: referenceId
  });
}

async function logAnalyticsEvent(userId: string, eventName: string, properties: any) {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    properties,
    timestamp: new Date().toISOString()
  });
}
