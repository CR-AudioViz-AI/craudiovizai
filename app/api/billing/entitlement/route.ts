// app/api/billing/entitlement/route.ts
// Central billing authority — feature entitlement check.
// GET ?userId=&feature=  returns gate result for a feature.
// Called by all Javari apps via fetch. Shared Supabase DB.
// Thursday, March 19, 2026
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const DAILY_LIMITS: Record<string, Record<string, number>> = {
  free:  { javari_chat: 10,  javari_forge: 5,   javari_team: 3,  default: 10 },
  pro:   { javari_chat: 500, javari_forge: 100,  javari_team: 100, default: 500 },
  power: { javari_chat: -1,  javari_forge: -1,   javari_team: -1,  default: -1 },
}

export async function GET(req: NextRequest) {
  try {
    const userId  = req.nextUrl.searchParams.get('userId')
    const feature = req.nextUrl.searchParams.get('feature') ?? 'javari_chat'

    // No userId — allow gracefully
    if (!userId) {
      const limit = DAILY_LIMITS.free[feature] ?? DAILY_LIMITS.free.default
      return NextResponse.json({ allowed: true, tier: 'free', used: 0, limit })
    }

    const supabase = db()

    // Get subscription
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('plan_tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const tier = (
      sub?.plan_tier &&
      sub.plan_tier !== 'free' &&
      sub.status === 'active' &&
      (!sub.current_period_end || sub.current_period_end > Date.now())
    ) ? sub.plan_tier : 'free'

    const tierLimits = DAILY_LIMITS[tier] ?? DAILY_LIMITS.free
    const limit      = tierLimits[feature] ?? tierLimits.default ?? 10

    // Unlimited — allow immediately
    if (limit === -1) {
      return NextResponse.json({ allowed: true, tier, used: 0, limit: -1 })
    }

    // Get today's usage
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data: usageRows } = await supabase
      .from('usage_ledger')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', todayStart.toISOString())

    const used = (usageRows ?? []).reduce((s: number, r: { usage_count: number }) => s + (r.usage_count ?? 0), 0)

    if (used >= limit) {
      const proLimit = DAILY_LIMITS.pro[feature] ?? DAILY_LIMITS.pro.default
      return NextResponse.json({
        allowed:     false,
        tier,
        used,
        limit,
        error:       'upgrade_required',
        message:     tier === 'free'
          ? `You have used all ${limit} free ${feature.replace(/_/g, ' ')} requests for today. Upgrade to Pro for up to ${proLimit}/day.`
          : `Daily limit of ${limit} reached for your ${tier} plan. Resets at midnight UTC.`,
        upgrade_url: '/pricing',
      })
    }

    return NextResponse.json({ allowed: true, tier, used, limit })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing/entitlement]', msg)
    // Fail open — never block users due to billing errors
    return NextResponse.json({ allowed: true, tier: 'free', used: 0, limit: 10, error_note: msg })
  }
}
