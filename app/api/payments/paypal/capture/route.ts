// /api/payments/paypal/capture/route.ts
// PayPal Payment Capture API - CR AudioViz AI
// Handles return from PayPal and provisions credits/subscriptions
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://craudiovizai.com';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// =============================================================================
// PAYPAL AUTH
// =============================================================================

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// =============================================================================
// TIER CREDITS
// =============================================================================

const TIER_CREDITS: Record<string, { monthly: number; yearly: number; yearlyBonus: number }> = {
  starter: { monthly: 500, yearly: 500, yearlyBonus: 100 },
  pro: { monthly: 2000, yearly: 2000, yearlyBonus: 500 },
  business: { monthly: 10000, yearly: 10000, yearlyBonus: 2000 }
};

// =============================================================================
// CAPTURE PAYMENT
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // PayPal order ID
    const success = searchParams.get('success');

    if (!success || !token) {
      return NextResponse.redirect(`${BASE_URL}/pricing?error=cancelled`);
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.redirect(`${BASE_URL}/checkout/error?reason=capture_failed`);
    }

    // Extract custom data
    const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    let orderData: any = {};
    
    try {
      orderData = JSON.parse(customId || '{}');
    } catch (e) {
      console.error('Failed to parse custom_id:', customId);
    }

    const { userId, productId, tierId, billingCycle, credits } = orderData;
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const amountPaid = parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Provision based on purchase type
    if (credits && userId) {
      // Credit purchase
      await supabase.from('credits_ledger').insert({
        user_id: userId,
        amount: credits,
        transaction_type: 'credit',
        source: 'purchase_paypal',
        reference_id: captureId,
        description: `Purchased ${credits.toLocaleString()} credits via PayPal`,
        expires_at: null
      });

      // Update balance
      await supabase.rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: credits
      });

      // Log analytics
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: 'credits_purchased',
        event_data: {
          amount: amountPaid,
          credits,
          provider: 'paypal',
          capture_id: captureId
        }
      });

      console.log(`PayPal: Added ${credits} credits to user ${userId}`);
    }

    if (tierId && userId) {
      // Subscription purchase
      const tierCredits = TIER_CREDITS[tierId];
      let creditsToAdd = billingCycle === 'yearly' 
        ? tierCredits.yearly + tierCredits.yearlyBonus
        : tierCredits.monthly;

      // Add subscription credits
      await supabase.from('credits_ledger').insert({
        user_id: userId,
        amount: creditsToAdd,
        transaction_type: 'credit',
        source: 'subscription_paypal',
        reference_id: captureId,
        description: `${tierId} plan - ${billingCycle} subscription via PayPal`,
        expires_at: null
      });

      await supabase.rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: creditsToAdd
      });

      // Update subscription status
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        tier: tierId,
        paypal_subscription_id: captureId,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        payment_provider: 'paypal',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

      await supabase
        .from('profiles')
        .update({
          subscription_tier: tierId,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      console.log(`PayPal: Activated ${tierId} subscription for user ${userId}`);
    }

    // Record payment
    await supabase.from('payments').insert({
      user_id: userId,
      provider: 'paypal',
      provider_payment_id: captureId,
      amount: amountPaid,
      currency: 'USD',
      status: 'completed',
      metadata: {
        order_id: token,
        product_id: productId,
        tier_id: tierId,
        billing_cycle: billingCycle,
        credits
      }
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${BASE_URL}/checkout/success?provider=paypal&order_id=${token}&credits=${credits || ''}&tier=${tierId || ''}`
    );

  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.redirect(`${BASE_URL}/checkout/error?reason=${encodeURIComponent(error.message)}`);
  }
}

