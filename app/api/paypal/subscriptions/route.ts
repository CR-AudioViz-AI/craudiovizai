// app/api/paypal/subscriptions/route.ts
// PayPal Subscriptions API - Create and Manage
// Timestamp: Dec 11, 2025 9:53 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paypalClient } from '@/lib/paypal/client';
import { PAYPAL_PLANS } from '@/lib/paypal/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, planId, userId, subscriptionId } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://craudiovizai.com';

    // CANCEL subscription
    if (action === 'cancel' && subscriptionId) {
      await paypalClient.cancelSubscription(subscriptionId, 'Customer requested cancellation');
      
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

      return NextResponse.json({ success: true, message: 'Subscription canceled' });
    }

    // SUSPEND subscription
    if (action === 'suspend' && subscriptionId) {
      await paypalClient.suspendSubscription(subscriptionId);
      
      await supabase
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('paypal_subscription_id', subscriptionId);

      return NextResponse.json({ success: true, message: 'Subscription suspended' });
    }

    // ACTIVATE subscription
    if (action === 'activate' && subscriptionId) {
      await paypalClient.activateSubscription(subscriptionId);
      
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('paypal_subscription_id', subscriptionId);

      return NextResponse.json({ success: true, message: 'Subscription activated' });
    }

    // CREATE new subscription
    const plan = PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS];
    
    if (!plan || !plan.paypalPlanId) {
      return NextResponse.json(
        { error: 'Invalid plan or PayPal plan not configured' },
        { status: 400 }
      );
    }

    const subscription = await paypalClient.createSubscription({
      planId: plan.paypalPlanId,
      customId: `sub_${planId}_${userId}`,
      returnUrl: `${baseUrl}/dashboard/billing?subscription=success`,
      cancelUrl: `${baseUrl}/dashboard/billing?subscription=canceled`,
    });

    // Record pending subscription
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      provider: 'paypal',
      paypal_subscription_id: subscription.id,
      status: 'pending',
      metadata: { plan_name: plan.name, credits_per_month: plan.credits },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      approvalUrl: (subscription as any).links?.find((l: any) => l.rel === 'approve')?.href,
    });

  } catch (error) {
    console.error('PayPal subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PayPal subscription failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    const subscription = await paypalClient.getSubscription(subscriptionId);
    
    return NextResponse.json({
      success: true,
      subscription,
    });

  } catch (error) {
    console.error('PayPal subscription fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
