// app/api/billing/usage/route.ts
// Central billing authority — usage recording and summary.
// POST { userId, feature, count? } — record usage
// GET  ?userId=&feature= — get today + month summary
// Updated: April 18, 2026 — credit floor protection (no negative balances)
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

// ── Credit floor helper ────────────────────────────────────────────────────────
// Returns the current net credit balance for a user.
// Positive = credits available. Negative = already over-debited (should not occur).
async function getNetCreditBalance(
  supabase: ReturnType<typeof db>,
  userId:   string,
): Promise<number> {
  const { data: rows, error } = await supabase
    .from('usage_ledger')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature', 'credits')

  if (error) throw new Error(`credit balance query failed: ${error.message}`)
  return (rows ?? []).reduce((sum, r) => sum + (r.usage_count ?? 0), 0)
}

export async function POST(req: NextRequest) {
  try {
    const { userId, feature, count = 1, metadata = {} } =
      await req.json() as { userId: string; feature: string; count?: number; metadata?: Record<string, unknown> }

    if (!userId || !feature) {
      return NextResponse.json({ error: 'userId and feature required' }, { status: 400 })
    }
    if (count < 1 || count > 1000) {
      return NextResponse.json({ error: 'count must be 1-1000' }, { status: 400 })
    }

    const supabase = db()

    // ── Credit floor protection ─────────────────────────────────────────────
    // For credit-feature deductions, verify the user has sufficient balance
    // before recording. Grants (positive inserts) bypass this check.
    // This endpoint records usage as POSITIVE counts (AI consumption deducts
    // from balance by adding positive usage against negative-balance accounting).
    // The balance check: currentBalance - count >= 0
    if (feature === 'credits') {
      const currentBalance = await getNetCreditBalance(supabase, userId)
      // usage_count in this route is always positive (consumption)
      // balance decreases as grants are positive and usage is also positive,
      // but net is computed as: grants (positive rows with type:grant) minus
      // usage rows. If this route inserts positive rows as usage, we need to
      // check if the current ledger SUM (which accounts for both grants and
      // deductions already written) minus this new deduction stays >= 0.
      if (currentBalance - count < 0) {
        console.warn('CREDIT FLOOR BLOCKED', {
          userId:           userId.slice(0, 8) + '…',
          attempted_change: -count,
          current_total:    currentBalance,
        })
        return NextResponse.json(
          { error: 'INSUFFICIENT_CREDITS', current_balance: Math.max(0, currentBalance) },
          { status: 402 }
        )
      }
    }

    const { error } = await supabase.from('usage_ledger').insert({
      user_id:     userId,
      feature,
      usage_count: count,
      metadata,
    })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, recorded: count })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId  = req.nextUrl.searchParams.get('userId')
    const feature = req.nextUrl.searchParams.get('feature')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase   = db()
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0)
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)

    let query = supabase
      .from('usage_ledger')
      .select('feature, usage_count, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString())

    if (feature) query = query.eq('feature', feature)

    const { data: rows, error } = await query
    if (error) throw new Error(error.message)

    const today: Record<string, number> = {}
    const month: Record<string, number> = {}
    const todayTs = todayStart.getTime()

    for (const row of rows ?? []) {
      month[row.feature] = (month[row.feature] ?? 0) + row.usage_count
      if (new Date(row.created_at).getTime() >= todayTs)
        today[row.feature] = (today[row.feature] ?? 0) + row.usage_count
    }

    return NextResponse.json({ userId, today, month, timestamp: new Date().toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
