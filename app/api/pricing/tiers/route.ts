/**
 * app/api/pricing/tiers/route.ts
 * CR AudioViz AI — Pricing Tiers API
 * Updated: March 21, 2026 — Aligned with TIER_CREDITS in lib/pricing/config.ts
 *
 * Tier credit allocation (NO unlimited — hard caps enforced):
 *   free:    25 credits/month  (expires, does not roll over)
 *   starter: 150 credits/month @ $9.99
 *   pro:     600 credits/month @ $29.99
 *   premium: 2,500 credits/month @ $99.99
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_CREDITS } from '@/lib/pricing/config'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// PRICING TIERS — Single source of credit values pulled from lib/pricing/config
// ─────────────────────────────────────────────────────────────────────────────
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free Forever',
    description: 'Get started with essential tools',
    price: 0,
    interval: null,
    credits_monthly: TIER_CREDITS.free,
    credits_rollover: false,   // Free credits expire on monthly reset
    features: {
      ebooks_access: 112,
      audiobook_conversions: 3,
      ai_generations: 10,
      storage_gb: 1,
      tools_access: ['basic'],
      support_level: 'community',
      api_access: false,
      white_label: false,
      priority_processing: false,
      custom_avatars: false,
      team_seats: 1,
    },
    stripe_price_id: null,
    popular: false,
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    price: 9.99,
    interval: 'month',
    credits_monthly: TIER_CREDITS.starter,   // 150
    credits_rollover: true,
    features: {
      ebooks_access: 200,
      audiobook_conversions: 25,
      ai_generations: 100,
      storage_gb: 10,
      tools_access: ['basic', 'creative'],
      support_level: 'email',
      api_access: false,
      white_label: false,
      priority_processing: false,
      custom_avatars: true,
      team_seats: 1,
    },
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID,
    popular: false,
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For creators and small businesses',
    price: 29.99,
    interval: 'month',
    credits_monthly: TIER_CREDITS.pro,       // 600
    credits_rollover: true,
    features: {
      ebooks_access: 'all',
      audiobook_conversions: 100,
      ai_generations: 500,
      storage_gb: 50,
      tools_access: ['basic', 'creative', 'professional'],
      support_level: 'priority',
      api_access: true,
      white_label: false,
      priority_processing: true,
      custom_avatars: true,
      team_seats: 3,
    },
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
    popular: true,
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For power users and growing teams',
    price: 99.99,
    interval: 'month',
    credits_monthly: TIER_CREDITS.premium,   // 2500
    credits_rollover: true,
    features: {
      ebooks_access: 'all',
      audiobook_conversions: 'all',
      ai_generations: 2000,
      storage_gb: 200,
      tools_access: ['basic', 'creative', 'professional', 'premium'],
      support_level: 'vip',
      api_access: true,
      white_label: true,
      priority_processing: true,
      custom_avatars: true,
      team_seats: 10,
    },
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
    popular: false,
  },
} as const;

export type TierId = keyof typeof PRICING_TIERS;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function canAccessFeature(tier: string, feature: string): boolean {
  const plan = PRICING_TIERS[tier as TierId];
  if (!plan) return false;

  const features = plan.features as Record<string, unknown>;
  if (!(feature in features)) return false;

  const value = features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value === 'all') return true;
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

export function hasCredits(tier: string, required: number): boolean {
  const plan = PRICING_TIERS[tier as TierId];
  if (!plan) return false;
  return plan.credits_monthly >= required;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pricing/tiers
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');
  const feature = searchParams.get('feature');

  if (tier && feature) {
    return NextResponse.json({
      tier,
      feature,
      can_access: canAccessFeature(tier, feature),
      timestamp: new Date().toISOString(),
    });
  }

  if (tier) {
    const plan = PRICING_TIERS[tier as TierId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    return NextResponse.json(plan);
  }

  const publicTiers = Object.entries(PRICING_TIERS).map(([, t]) => ({
    ...t,
    stripe_price_id: undefined,
  }));

  return NextResponse.json({ tiers: publicTiers, timestamp: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pricing/tiers
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action?: string; user_id?: string };
    const { action, user_id } = body;

    if (action === 'check_access') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, credits_balance')
        .eq('id', user_id)
        .single();

      if (error || !profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const currentTier = (profile.subscription_tier || 'free') as TierId;
      const plan = PRICING_TIERS[currentTier];

      return NextResponse.json({
        user_id,
        tier: currentTier,
        credits_balance: profile.credits_balance || 0,
        credits_monthly: plan?.credits_monthly ?? 0,
        features: plan?.features ?? {},
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'allocate_credits') {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, subscription_tier, credits_balance')
        .not('subscription_tier', 'eq', 'free');

      if (error) throw error;

      let allocated = 0;

      for (const user of users ?? []) {
        const plan = PRICING_TIERS[user.subscription_tier as TierId];
        if (!plan) continue;

        const newBalance = plan.credits_rollover
          ? (user.credits_balance || 0) + plan.credits_monthly
          : plan.credits_monthly;

        await supabase
          .from('profiles')
          .update({
            credits_balance: newBalance,
            credits_last_allocated: new Date().toISOString(),
          })
          .eq('id', user.id);

        allocated++;
      }

      return NextResponse.json({
        success: true,
        users_allocated: allocated,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
