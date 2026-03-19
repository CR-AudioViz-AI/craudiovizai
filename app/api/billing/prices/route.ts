// app/api/billing/prices/route.ts
// Diagnostic: list active Stripe subscription prices.
// GET /api/billing/prices — returns price IDs for subscription tiers.
// ONE-TIME diagnostic — remove after price IDs are noted.
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const s = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
    const prices = await s.prices.list({ active: true, type: 'recurring', limit: 20 })
    return NextResponse.json({
      prices: prices.data.map(p => ({
        id:       p.id,
        nickname: p.nickname,
        amount:   p.unit_amount,
        currency: p.currency,
        interval: p.recurring?.interval,
        product:  typeof p.product === 'string' ? p.product : p.product?.id,
      })),
      env_keys: {
        STRIPE_PRICE_PRO:     process.env.STRIPE_PRICE_PRO     ? 'set' : 'missing',
        STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM ? 'set' : 'missing',
        STRIPE_PRO_PRICE_ID:  process.env.STRIPE_PRO_PRICE_ID  ? 'set' : 'missing',
      }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
