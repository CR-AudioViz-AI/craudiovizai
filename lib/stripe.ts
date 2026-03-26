// lib/stripe.ts
// CR AudioViz AI — Stripe client factory.
// Key source: vault (getSecret) first, process.env fallback.
// Updated: March 26, 2026 — vault-first key resolution.

import Stripe from 'stripe'
import { getSecret } from '@/lib/vault/getSecret'

/**
 * Returns an initialised Stripe client.
 * Resolves STRIPE_SECRET_KEY from vault first, falls back to process.env.
 * Must be called inside an async context.
 */
export async function getStripeClient(): Promise<Stripe> {
  const STRIPE_SECRET_KEY =
    (await getSecret('STRIPE_SECRET_KEY').catch(() => null)) ||
    process.env.STRIPE_SECRET_KEY

  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not available from vault or process.env')

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
}

/**
 * Synchronous legacy export — uses process.env only.
 * Retained for any existing callers that are not yet async.
 * Prefer getStripeClient() for all new usage.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
