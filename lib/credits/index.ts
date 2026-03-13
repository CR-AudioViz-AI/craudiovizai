// lib/credits/index.ts
// CR AudioViz AI — CreditsOS Canonical Service
// Friday, March 13, 2026
// Implements Master Bible v2.3.1 pricing model exactly.
// This is the single source of truth for all credit operations.
// SERVER-SIDE ONLY. Never import from client components.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('[CreditsOS] Supabase credentials not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ── Bible v2.3.1 Subscription Plans ──────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  free: {
    name:                  'Free',
    price_monthly:         0,
    price_annual_monthly:  0,
    credits_monthly:       500,
    credits_expire:        true,
    credits_expire_days:   30,
  },
  creative_pro: {
    name:                  'Creative Pro',
    price_monthly:         29,
    price_annual_monthly:  24.17,   // 12 months for price of 10
    credits_monthly:       3500,
    credits_expire:        false,   // paid credits NEVER expire
    credits_expire_days:   null,
  },
  business_elite: {
    name:                  'Business Elite',
    price_monthly:         79,
    price_annual_monthly:  65.83,
    credits_monthly:       10000,
    credits_expire:        false,
    credits_expire_days:   null,
  },
  enterprise: {
    name:                  'Enterprise',
    price_monthly:         299,
    price_annual_monthly:  249.17,
    credits_monthly:       45000,
    credits_expire:        false,
    credits_expire_days:   null,
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

// ── Credit Packs (one-time, NEVER expire) ────────────────────────────────────
export const CREDIT_PACKS = {
  small:  { credits: 5000,  price: 50,  label: '5K Credits'  },
  medium: { credits: 15000, price: 135, label: '15K Credits' },
  large:  { credits: 50000, price: 400, label: '50K Credits' },
} as const

export type CreditPackId = keyof typeof CREDIT_PACKS

// ── AI Model Multipliers ──────────────────────────────────────────────────────
export const MODEL_MULTIPLIERS = {
  auto:     1,   // cheapest available model
  standard: 2,   // balanced
  premium:  5,   // GPT-4o / Claude Opus / Gemini Ultra
} as const

export type ModelTier = keyof typeof MODEL_MULTIPLIERS

// ── Marketplace Split ─────────────────────────────────────────────────────────
export const MARKETPLACE_SPLIT = { creator_pct: 70, platform_pct: 30 } as const

// ── Admin emails (unlimited credits, never deducted) ─────────────────────────
const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'cindy@craudiovizai.com',
  'admin@craudiovizai.com',
]

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CreditBalance {
  userId: string
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  planId: PlanId
  subscriptionActive: boolean
  nextRefreshAt: string | null
}

export interface SpendResult  { success: boolean; newBalance?: number; error?: string; transactionId?: string }
export interface GrantResult  { success: boolean; newBalance?: number; error?: string }
export interface RefundResult { success: boolean; newBalance?: number; error?: string }

// ── Admin check ───────────────────────────────────────────────────────────────
export async function isAdminUser(userId: string): Promise<boolean> {
  const sb = getSupabase()
  const { data: profile } = await sb
    .from('profiles')
    .select('is_admin, email')
    .eq('id', userId)
    .single()

  if (!profile) return false
  if (profile.is_admin) return true
  if (profile.email && ADMIN_EMAILS.includes((profile.email as string).toLowerCase())) return true

  const { data: authUser } = await sb.auth.admin.getUserById(userId)
  if (authUser?.user?.email && ADMIN_EMAILS.includes(authUser.user.email.toLowerCase())) return true
  return false
}

// ── Get balance ───────────────────────────────────────────────────────────────
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  if (await isAdminUser(userId)) {
    return { userId, balance: 999999999, lifetimeEarned: 0, lifetimeSpent: 0,
             planId: 'enterprise', subscriptionActive: true, nextRefreshAt: null }
  }
  const sb = getSupabase()
  const { data } = await sb
    .from('user_credits')
    .select('balance, lifetime_earned, lifetime_spent, plan_id, subscription_active, next_refresh_at')
    .eq('user_id', userId)
    .single()

  if (!data) return null
  return {
    userId,
    balance:            data.balance            as number,
    lifetimeEarned:     (data.lifetime_earned   as number) ?? 0,
    lifetimeSpent:      (data.lifetime_spent    as number) ?? 0,
    planId:             (data.plan_id           as PlanId) ?? 'free',
    subscriptionActive: (data.subscription_active as boolean) ?? false,
    nextRefreshAt:      (data.next_refresh_at   as string) ?? null,
  }
}

// ── Check (non-destructive) ───────────────────────────────────────────────────
export async function checkCredits(userId: string, amount: number): Promise<boolean> {
  if (await isAdminUser(userId)) return true
  const bal = await getCreditBalance(userId)
  return bal !== null && bal.balance >= amount
}

// ── Spend ─────────────────────────────────────────────────────────────────────
export async function spendCredits(
  userId: string,
  amount: number,
  operation: string,
  appId: string,
  metadata?: Record<string, unknown>
): Promise<SpendResult> {
  if (await isAdminUser(userId)) return { success: true, newBalance: 999999999 }
  if (amount <= 0) return { success: false, error: 'Invalid credit amount' }

  const sb = getSupabase()
  const { data: c } = await sb
    .from('user_credits')
    .select('balance, lifetime_spent')
    .eq('user_id', userId)
    .single()

  if (!c) return { success: false, error: 'User credits not found' }
  if ((c.balance as number) < amount) return { success: false, error: 'Insufficient credits' }

  const newBalance        = (c.balance        as number) - amount
  const newLifetimeSpent  = ((c.lifetime_spent as number) ?? 0) + amount

  const { error: ue } = await sb
    .from('user_credits')
    .update({ balance: newBalance, lifetime_spent: newLifetimeSpent, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (ue) return { success: false, error: `Credits update failed: ${ue.message}` }

  const { data: tx } = await sb
    .from('credit_transactions')
    .insert({ user_id: userId, amount: -amount, transaction_type: 'spend',
              app_id: appId, operation, description: `${appId}: ${operation}`,
              metadata: metadata ?? {}, created_at: new Date().toISOString() })
    .select('id')
    .single()

  return { success: true, newBalance, transactionId: tx?.id as string | undefined }
}

// ── Refund (automatic on platform error — Henderson Standard customer policy) ─
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  appId: string,
  originalTransactionId?: string
): Promise<RefundResult> {
  const sb = getSupabase()
  const { data: c } = await sb
    .from('user_credits')
    .select('balance, lifetime_earned')
    .eq('user_id', userId)
    .single()

  if (!c) return { success: false, error: 'User credits not found' }

  const newBalance       = (c.balance        as number) + amount
  const newLifetimeEarned = ((c.lifetime_earned as number) ?? 0) + amount

  await sb.from('user_credits')
    .update({ balance: newBalance, lifetime_earned: newLifetimeEarned, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  await sb.from('credit_transactions').insert({
    user_id: userId, amount, transaction_type: 'refund', app_id: appId,
    operation: 'refund', description: `Refund: ${reason}`,
    metadata: { reason, originalTransactionId: originalTransactionId ?? null },
    created_at: new Date().toISOString(),
  })
  return { success: true, newBalance }
}

// ── Grant (subscription refresh, pack purchase, bonus) ────────────────────────
export async function grantCredits(
  userId: string,
  amount: number,
  source: 'subscription_refresh' | 'pack_purchase' | 'bonus' | 'referral' | 'admin_grant',
  metadata?: Record<string, unknown>
): Promise<GrantResult> {
  const sb = getSupabase()
  const { data: c } = await sb
    .from('user_credits')
    .select('balance, lifetime_earned')
    .eq('user_id', userId)
    .single()

  const txPayload = {
    user_id: userId, amount, transaction_type: source,
    app_id: 'platform', operation: source,
    description: `Credits granted: ${source}`, metadata: metadata ?? {},
    created_at: new Date().toISOString(),
  }

  if (!c) {
    await sb.from('user_credits').insert({
      user_id: userId, balance: amount, lifetime_earned: amount,
      lifetime_spent: 0, plan_id: 'free', subscription_active: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    await sb.from('credit_transactions').insert(txPayload)
    return { success: true, newBalance: amount }
  }

  const newBalance        = (c.balance        as number) + amount
  const newLifetimeEarned = ((c.lifetime_earned as number) ?? 0) + amount
  await sb.from('user_credits')
    .update({ balance: newBalance, lifetime_earned: newLifetimeEarned, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  await sb.from('credit_transactions').insert(txPayload)
  return { success: true, newBalance }
}

// ── Compute cost with model multiplier ───────────────────────────────────────
export function computeCreditCost(base: number, tier: ModelTier = 'auto'): number {
  return Math.ceil(base * MODEL_MULTIPLIERS[tier])
}
