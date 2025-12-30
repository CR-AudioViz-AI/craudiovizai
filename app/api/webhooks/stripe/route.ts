// /api/webhooks/stripe/route.ts
// Stripe Webhook Handler - CR AudioViz AI
// Processes payment events, provisions credits, activates subscriptions
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// =============================================================================
// SUBSCRIPTION TIER CREDITS
// =============================================================================

const TIER_CREDITS: Record<string, { monthly: number; yearly: number; yearlyBonus: number }> = {
  starter: { monthly: 500, yearly: 500, yearlyBonus: 100 },
  pro: { monthly: 2000, yearly: 2000, yearlyBonus: 500 },
  business: { monthly: 10000, yearly: 10000, yearlyBonus: 2000 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function addCredits(
  supabase: any,
  userId: string,
  amount: number,
  source: string,
  referenceId: string,
  description: string
) {
  // Add to credits ledger
  await supabase.from('credits_ledger').insert({
    user_id: userId,
    amount,
    transaction_type: 'credit',
    source,
    reference_id: referenceId,
    description,
    expires_at: null // Credits never expire on paid plans
  });

  // Update user's credit balance
  await supabase.rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: amount
  });

  // Log analytics event
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: 'credits_added',
    event_data: {
      amount,
      source,
      reference_id: referenceId
    }
  });
}

async function updateSubscription(
  supabase: any,
  userId: string,
  tierId: string,
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd: Date
) {
  // Upsert subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    tier: tierId,
    stripe_subscription_id: stripeSubscriptionId,
    status,
    current_period_end: currentPeriodEnd.toISOString(),
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });

  // Update profile
  await supabase
    .from('profiles')
    .update({
      subscription_tier: tierId,
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      // =======================================================================
      // CHECKOUT COMPLETED (one-time or subscription first payment)
      // =======================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const mode = session.metadata?.mode;

        if (!userId) {
          console.log('No userId in metadata, skipping');
          break;
        }

        // One-time credit purchase
        if (mode === 'payment' && session.metadata?.credits) {
          const credits = parseInt(session.metadata.credits);
          await addCredits(
            supabase,
            userId,
            credits,
            'purchase',
            session.id,
            `Purchased ${credits.toLocaleString()} credits`
          );
          console.log(`Added ${credits} credits to user ${userId}`);
        }

        // Subscription created - handled by customer.subscription.created
        break;
      }

      // =======================================================================
      // SUBSCRIPTION CREATED (new subscription)
      // =======================================================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const tierId = subscription.metadata?.tierId;
        const billingCycle = subscription.metadata?.billingCycle as 'monthly' | 'yearly';

        if (!userId || !tierId) {
          console.log('Missing userId or tierId in subscription metadata');
          break;
        }

        // Update subscription status
        await updateSubscription(
          supabase,
          userId,
          tierId,
          subscription.id,
          subscription.status,
          new Date(subscription.current_period_end * 1000)
        );

        // Add initial credits
        const tierCredits = TIER_CREDITS[tierId];
        if (tierCredits) {
          let credits = billingCycle === 'yearly' 
            ? tierCredits.yearly + tierCredits.yearlyBonus
            : tierCredits.monthly;

          await addCredits(
            supabase,
            userId,
            credits,
            'subscription',
            subscription.id,
            `${tierId.charAt(0).toUpperCase() + tierId.slice(1)} plan - ${billingCycle} subscription`
          );
          console.log(`Added ${credits} credits for new ${tierId} subscription`);
        }

        break;
      }

      // =======================================================================
      // SUBSCRIPTION UPDATED (plan change, renewal, etc.)
      // =======================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const tierId = subscription.metadata?.tierId;

        if (!userId) break;

        await updateSubscription(
          supabase,
          userId,
          tierId || 'unknown',
          subscription.id,
          subscription.status,
          new Date(subscription.current_period_end * 1000)
        );

        break;
      }

      // =======================================================================
      // INVOICE PAID (recurring subscription payment)
      // =======================================================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Skip if this is the first invoice (handled by subscription.created)
        if (invoice.billing_reason === 'subscription_create') break;

        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        const tierId = subscription.metadata?.tierId;
        const billingCycle = subscription.metadata?.billingCycle as 'monthly' | 'yearly';

        if (!userId || !tierId) break;

        // Add monthly credits
        const tierCredits = TIER_CREDITS[tierId];
        if (tierCredits) {
          const credits = tierCredits.monthly; // Monthly credit refresh

          await addCredits(
            supabase,
            userId,
            credits,
            'subscription_renewal',
            invoice.id,
            `Monthly credit refresh - ${tierId} plan`
          );
          console.log(`Added ${credits} monthly credits for ${tierId} renewal`);
        }

        break;
      }

      // =======================================================================
      // SUBSCRIPTION CANCELLED
      // =======================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) break;

        // Update to cancelled status
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade to free tier
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      // =======================================================================
      // PAYMENT FAILED
      // =======================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Update status to past_due
            await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', subscriptionId);

            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            // Log event for follow-up
            await supabase.from('analytics_events').insert({
              user_id: userId,
              event_name: 'payment_failed',
              event_data: {
                invoice_id: invoice.id,
                amount: invoice.amount_due,
                attempt_count: invoice.attempt_count
              }
            });

            console.log(`Payment failed for user ${userId}`);
          }
        }
        break;
      }

      // =======================================================================
      // REFUND PROCESSED
      // =======================================================================
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const refundAmount = charge.amount_refunded;

        // Get payment intent to find user
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            charge.payment_intent as string
          );
          const userId = paymentIntent.metadata?.userId;
          const credits = parseInt(paymentIntent.metadata?.credits || '0');

          if (userId && credits > 0) {
            // Deduct refunded credits
            await addCredits(
              supabase,
              userId,
              -credits,
              'refund',
              charge.id,
              `Refund - ${credits.toLocaleString()} credits removed`
            );
            console.log(`Removed ${credits} credits due to refund for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false
  }
};
