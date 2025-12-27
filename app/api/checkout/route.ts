import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://craudiovizai.com';

// Credit packages
const PACKAGES = {
  starter: { name: 'Starter Pack', credits: 100, bonus: 0, price: 500, stripe_price: 'price_starter' },
  popular: { name: 'Popular Pack', credits: 500, bonus: 50, price: 2000, stripe_price: 'price_popular' },
  pro: { name: 'Pro Pack', credits: 1000, bonus: 150, price: 3500, stripe_price: 'price_pro' },
  enterprise: { name: 'Enterprise Pack', credits: 5000, bonus: 1000, price: 15000, stripe_price: 'price_enterprise' },
};

// Subscription plans
const PLANS = {
  starter: { name: 'Starter Plan', credits_per_month: 200, price: 999, stripe_price: 'price_starter_monthly' },
  pro: { name: 'Pro Plan', credits_per_month: 1000, price: 2999, stripe_price: 'price_pro_monthly' },
  enterprise: { name: 'Enterprise Plan', credits_per_month: 5000, price: 9999, stripe_price: 'price_enterprise_monthly' },
};

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// POST /api/checkout - Create checkout session
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json();
  const { type, package_id, plan_id, provider } = body;

  // Validate input
  if (!provider || !['stripe', 'paypal'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
  }

  if (type === 'credits') {
    const pkg = PACKAGES[package_id as keyof typeof PACKAGES];
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    if (provider === 'stripe') {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits` + (pkg.bonus > 0 ? ` + ${pkg.bonus} bonus credits` : ''),
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        }],
        metadata: {
          user_id: user.id,
          package_id,
          type: 'credits',
        },
        success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/credits?canceled=true`,
        customer_email: user.email,
      });

      return NextResponse.json({ url: session.url, session_id: session.id });
    }

    if (provider === 'paypal') {
      const accessToken = await getPayPalAccessToken();

      const order = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: (pkg.price / 100).toFixed(2),
            },
            description: pkg.name,
            custom_id: `${user.id}:CREDIT_${package_id.toUpperCase()}`,
          }],
          application_context: {
            brand_name: 'CRAIverse',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${APP_URL}/checkout/success?provider=paypal`,
            cancel_url: `${APP_URL}/credits?canceled=true`,
          },
        }),
      });

      const orderData = await order.json();
      const approveLink = orderData.links?.find((l: any) => l.rel === 'approve')?.href;

      return NextResponse.json({ url: approveLink, order_id: orderData.id });
    }
  }

  if (type === 'subscription') {
    const plan = PLANS[plan_id as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (provider === 'stripe') {
      // Get or create Stripe customer
      let customerId: string;
      
      const { data: existingSub } = await supabase
        .from('craiverse_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (existingSub?.stripe_customer_id) {
        customerId = existingSub.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.credits_per_month} credits per month`,
            },
            unit_amount: plan.price,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        metadata: {
          user_id: user.id,
          plan_id,
          type: 'subscription',
        },
        success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/pricing?canceled=true`,
      });

      return NextResponse.json({ url: session.url, session_id: session.id });
    }

    if (provider === 'paypal') {
      // PayPal subscription requires pre-created plans in PayPal dashboard
      // Return URL to PayPal subscription page
      return NextResponse.json({
        error: 'PayPal subscriptions require setup in PayPal dashboard',
        setup_url: 'https://www.paypal.com/billing/plans',
      }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
}

// GET /api/checkout - Get available packages and plans
export async function GET() {
  return NextResponse.json({
    packages: Object.entries(PACKAGES).map(([id, pkg]) => ({
      id,
      ...pkg,
      price_formatted: `$${(pkg.price / 100).toFixed(2)}`,
    })),
    plans: Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan,
      price_formatted: `$${(plan.price / 100).toFixed(2)}/mo`,
    })),
    providers: ['stripe', 'paypal'],
  });
}
