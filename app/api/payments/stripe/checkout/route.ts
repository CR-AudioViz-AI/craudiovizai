// /app/api/payments/stripe/checkout/route.ts
// Stripe Checkout Session Creator - CR AudioViz AI
// Creates checkout sessions for subscriptions and one-time purchases

import { NextRequest, NextResponse } from 'next/server';
import {
  NO_REFUND_POLICY,
  buildNoRefundMetadata
} from '@/lib/payments/no-refund-policy';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Price IDs for subscriptions (create these in Stripe Dashboard)
const SUBSCRIPTION_PRICES: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly'
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly'
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly'
  }
};

// Credit package prices
const CREDIT_PACKAGES: Record<string, { price: number; credits: number; priceId: string }> = {
  basic: { price: 500, credits: 100, priceId: process.env.STRIPE_PRICE_CREDITS_100 || 'price_credits_100' },
  plus: { price: 2000, credits: 550, priceId: process.env.STRIPE_PRICE_CREDITS_550 || 'price_credits_550' },
  pro: { price: 3500, credits: 1150, priceId: process.env.STRIPE_PRICE_CREDITS_1150 || 'price_credits_1150' },
  business: { price: 15000, credits: 6000, priceId: process.env.STRIPE_PRICE_CREDITS_6000 || 'price_credits_6000' },
  enterprise: { price: 25000, credits: 12500, priceId: process.env.STRIPE_PRICE_CREDITS_12500 || 'price_credits_12500' }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode, // 'subscription' or 'payment'
      tier, // 'starter', 'pro', 'business' for subscriptions
      billingCycle, // 'monthly' or 'yearly'
      packageId, // For credit purchases
      userId,
      email,
      promoCode
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://craudiovizai.com';

    let sessionParams: any = {
      payment_method_types: ['card'],
      success_url: `${baseUrl}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?cancelled=true`,
      consent_collection: {
        terms_of_service: 'required'
      },
      custom_text: {
        submit: {
          message: NO_REFUND_POLICY.CONSENT_MESSAGE
        }
      },
      metadata: {
        user_id: userId,
        ...buildNoRefundMetadata()
      },
      customer_email: email
    };

    if (mode === 'subscription') {
      // Subscription checkout
      if (!tier || !SUBSCRIPTION_PRICES[tier]) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
      const priceId = SUBSCRIPTION_PRICES[tier][cycle];

      sessionParams = {
        ...sessionParams,
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            user_id: userId,
            tier,
            ...buildNoRefundMetadata()
          }
        },
        metadata: {
          ...sessionParams.metadata,
          tier,
          billing_cycle: cycle
        }
      };

      // Add promo code if provided
      if (promoCode) {
        sessionParams.discounts = [{
          promotion_code: promoCode
        }];
      }

    } else {
      // One-time credit purchase
      if (!packageId || !CREDIT_PACKAGES[packageId]) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      const pkg = CREDIT_PACKAGES[packageId];

      sessionParams = {
        ...sessionParams,
        mode: 'payment',
        line_items: [{
          price: pkg.priceId,
          quantity: 1
        }],
        payment_intent_data: {
          metadata: {
            ...buildNoRefundMetadata()
          }
        },
        metadata: {
          ...sessionParams.metadata,
          package_id: packageId,
          credits: pkg.credits.toString()
        }
      };
    }

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(flattenObject(sessionParams))
    });

    const session = await response.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return NextResponse.json({ error: session.error.message }, { status: 400 });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// Helper to flatten nested objects for URL encoding
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}[${key}]` : key;

    if (value === null || value === undefined) {
      continue;
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          Object.assign(result, flattenObject(item, `${newKey}[${index}]`));
        } else {
          result[`${newKey}[${index}]`] = String(item);
        }
      });
    } else if (typeof value === 'object') {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}
