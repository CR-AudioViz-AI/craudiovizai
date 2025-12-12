// lib/paypal/config.ts
// PayPal Configuration for CR AudioViz AI
// Timestamp: Dec 11, 2025 9:50 PM EST

export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com',
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
};

export const PAYPAL_PLANS = {
  starter: {
    name: 'Starter Plan',
    price: 9.99,
    credits: 100,
    paypalPlanId: process.env.PAYPAL_STARTER_PLAN_ID,
  },
  pro: {
    name: 'Pro Plan', 
    price: 29.99,
    credits: 500,
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID,
  },
  premium: {
    name: 'Premium Plan',
    price: 99.99,
    credits: 2000,
    paypalPlanId: process.env.PAYPAL_PREMIUM_PLAN_ID,
  },
};

export const CREDIT_PACKS = {
  small: { credits: 50, price: 4.99 },
  medium: { credits: 150, price: 12.99 },
  large: { credits: 500, price: 39.99 },
  xl: { credits: 1200, price: 89.99 },
};

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
  }>;
  payer?: {
    email_address: string;
    payer_id: string;
    name?: {
      given_name: string;
      surname: string;
    };
  };
}

export interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  subscriber: {
    email_address: string;
    payer_id: string;
  };
  billing_info: {
    next_billing_time: string;
    cycle_executions: Array<{
      tenure_type: string;
      total_cycles: number;
    }>;
  };
}
