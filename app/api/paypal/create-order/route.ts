// /app/api/paypal/create-order/route.ts
// PayPal Create Order API - CR AudioViz AI
// Timestamp: January 1, 2026 - 6:17 PM EST

import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, returnUrl, cancelUrl, currency = 'USD' } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
          description: description || 'CR AudioViz AI Purchase',
        },
      ],
      application_context: {
        brand_name: 'CR AudioViz AI',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`,
      },
    };

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();

    if (order.id) {
      const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;
      
      return NextResponse.json({
        orderId: order.id,
        approvalUrl,
        status: order.status,
      });
    } else {
      return NextResponse.json(
        { error: order.message || 'Failed to create PayPal order' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[PayPal Create Order] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
