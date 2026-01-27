// /api/payments/paypal/create-order/route.ts
// PayPal Order Creation API - CR AudioViz AI
// One-time payments and subscription billing
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildNoRefundMetadata
} from '@/lib/payments/no-refund-policy';

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
// CREDIT PACKAGES
// =============================================================================

const CREDIT_PRODUCTS: Record<string, { credits: number; price: number; name: string }> = {
  credits_100: { credits: 100, price: 5.00, name: '100 Javari Credits' },
  credits_500: { credits: 550, price: 20.00, name: '500 + 50 Bonus Credits' },
  credits_1000: { credits: 1150, price: 35.00, name: '1,000 + 150 Bonus Credits' },
  credits_5000: { credits: 6000, price: 150.00, name: '5,000 + 1,000 Bonus Credits' },
  credits_10000: { credits: 12500, price: 250.00, name: '10,000 + 2,500 Bonus Credits' }
};

// =============================================================================
// SUBSCRIPTION TIERS
// =============================================================================

const SUBSCRIPTION_TIERS: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 9.00, yearly: 90.00, name: 'Starter Plan' },
  pro: { monthly: 29.00, yearly: 290.00, name: 'Pro Plan' },
  business: { monthly: 99.00, yearly: 990.00, name: 'Business Plan' }
};

// =============================================================================
// CREATE ORDER (One-time payment)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, amount, productId, tierId, billingCycle, userId, credits } = body;

    const accessToken = await getPayPalAccessToken();

    // Calculate amount based on product or tier
    let orderAmount = amount;
    let description = 'Javari Credits';
    let finalCredits = credits;

    if (productId && CREDIT_PRODUCTS[productId]) {
      const product = CREDIT_PRODUCTS[productId];
      orderAmount = product.price;
      description = product.name;
      finalCredits = product.credits;
    } else if (tierId && SUBSCRIPTION_TIERS[tierId]) {
      const tier = SUBSCRIPTION_TIERS[tierId];
      orderAmount = billingCycle === 'yearly' ? tier.yearly : tier.monthly;
      description = `${tier.name} - ${billingCycle}`;
    }

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: orderAmount.toFixed(2)
          },
          description,
          custom_id: JSON.stringify({
            userId,
            productId,
            tierId,
            billingCycle,
            credits: finalCredits,
            ...buildNoRefundMetadata()
          })
        }],
        application_context: {
          brand_name: 'Javari by CR AudioViz AI',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${BASE_URL}/api/payments/paypal/capture?success=true`,
          cancel_url: `${BASE_URL}/pricing?cancelled=true`
        }
      })
    });

    const order = await orderResponse.json();

    if (order.error) {
      throw new Error(order.error.message || 'PayPal order creation failed');
    }

    // Find approval URL
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      status: order.status
    });

  } catch (error: any) {
    console.error('PayPal order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
