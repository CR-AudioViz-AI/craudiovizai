// app/api/paypal/webhook/route.ts
// PayPal Webhook Handler - Process all PayPal events
// Timestamp: Dec 11, 2025 9:54 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paypalClient } from '@/lib/paypal/client';
import { PAYPAL_CONFIG, PAYPAL_PLANS } from '@/lib/paypal/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature (optional but recommended for production)
    if (PAYPAL_CONFIG.webhookId) {
      const isValid = await paypalClient.verifyWebhook({
        webhookId: PAYPAL_CONFIG.webhookId,
        headers,
        body,
      });

      if (!isValid) {
        console.warn('Invalid PayPal webhook signature');
        // Continue processing in sandbox, reject in production
        if (PAYPAL_CONFIG.mode === 'live') {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`PayPal webhook received: ${eventType}`);

    // ============================================
    // ORDER EVENTS (One-time purchases)
    // ============================================
    
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      // Order approved by customer - capture it
      const orderId = resource.id;
      const captured = await paypalClient.captureOrder(orderId);
      
      // Update transaction
      await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('provider_id', orderId);
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      // Payment captured successfully
      const captureId = resource.id;
      const customId = resource.custom_id;
      
      if (customId?.startsWith('credits_')) {
        const [, packId, userId] = customId.split('_');
        const pack = { small: 50, medium: 150, large: 500, xl: 1200 }[packId] || 0;
        
        if (pack && userId) {
          // Add credits
          await supabase.rpc('add_user_credits', {
            p_user_id: userId,
            p_credits: pack,
            p_source: 'paypal_purchase',
            p_reference_id: captureId,
          });

          // Update transaction
          await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('provider_id', resource.supplementary_data?.related_ids?.order_id);
        }
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      // Refund processed
      const captureId = resource.id;
      const refundAmount = parseFloat(resource.amount?.value || '0');
      
      // Record refund
      await supabase.from('transactions').insert({
        type: 'refund',
        amount: -refundAmount,
        provider: 'paypal',
        provider_id: captureId,
        status: 'completed',
        metadata: { original_capture: captureId },
      });
    }

    // ============================================
    // SUBSCRIPTION EVENTS
    // ============================================

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = resource.id;
      const customId = resource.custom_id;
      const planId = resource.plan_id;
      
      // Parse user from custom_id
      const userId = customId?.split('_')[2];
      const planKey = customId?.split('_')[1];
      const plan = PAYPAL_PLANS[planKey as keyof typeof PAYPAL_PLANS];
      
      if (userId && plan) {
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: resource.billing_info?.next_billing_time,
          })
          .eq('paypal_subscription_id', subscriptionId);

        // Update user's plan
        await supabase
          .from('users')
          .update({
            subscription_tier: planKey,
            subscription_status: 'active',
          })
          .eq('id', userId);

        // Grant initial credits
        await supabase.rpc('add_user_credits', {
          p_user_id: userId,
          p_credits: plan.credits,
          p_source: 'subscription_activation',
          p_reference_id: subscriptionId,
        });
      }
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subscriptionId = resource.id;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

      // Get user and update their status
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (sub?.user_id) {
        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
          })
          .eq('id', sub.user_id);
      }
    }

    if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const subscriptionId = resource.id;
      
      await supabase
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('paypal_subscription_id', subscriptionId);
    }

    if (eventType === 'PAYMENT.SALE.COMPLETED') {
      // Recurring payment successful
      const subscriptionId = resource.billing_agreement_id;
      const amount = parseFloat(resource.amount?.total || '0');
      
      // Find subscription and plan
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, plan_id, metadata')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (sub) {
        const credits = sub.metadata?.credits_per_month || 0;
        
        // Add monthly credits
        await supabase.rpc('add_user_credits', {
          p_user_id: sub.user_id,
          p_credits: credits,
          p_source: 'subscription_renewal',
          p_reference_id: resource.id,
        });

        // Record payment
        await supabase.from('transactions').insert({
          user_id: sub.user_id,
          type: 'subscription_payment',
          amount: amount,
          credits: credits,
          provider: 'paypal',
          provider_id: resource.id,
          status: 'completed',
          metadata: { subscription_id: subscriptionId },
        });

        // Update subscription period
        await supabase
          .from('subscriptions')
          .update({
            current_period_start: new Date().toISOString(),
            last_payment_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);
      }
    }

    if (eventType === 'PAYMENT.SALE.DENIED' || eventType === 'PAYMENT.SALE.REFUNDED') {
      const subscriptionId = resource.billing_agreement_id;
      
      // Mark subscription as past_due or handle refund
      if (eventType === 'PAYMENT.SALE.DENIED') {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('paypal_subscription_id', subscriptionId);
      }
    }

    // Log webhook for debugging
    await supabase.from('webhook_logs').insert({
      provider: 'paypal',
      event_type: eventType,
      event_id: event.id,
      payload: event,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
