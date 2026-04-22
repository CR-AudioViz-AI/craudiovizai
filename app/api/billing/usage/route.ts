// app/api/billing/usage/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: AI/feature credit consumption recording.
// CALLED BY: Javari modules, app feature gates, internal platform services.
// AUTOMATION: Use /api/internal/exec?action=credit_deduct for server-side ops.
// NOTE: This route stays open to Javari modules — do NOT gate with 403.
//       BILLING_EXEC_MODE=internal_only logs a warning but does not block,
//       because Javari apps legitimately call this directly.
// ─────────────────────────────────────────────────────────────────────────────
// POST { userId, feature, count? } — record usage
// GET  ?userId=&feature= — get today + month summary
// Updated: April 22, 2026 — exec layer observability

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ROUTE_PATH = '/api/billing/usage'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Exec-layer observability ──────────────────────────────────────────────────
// Logs when this route is called directly so we can track automation coverage.
// In internal_only mode: warns but does NOT block (Javari apps call this legitimately).
function logDirectAccess(method: string) {
  const execMode = process.env.BILLING_EXEC_MODE ?? 'standard'
  console.warn('DIRECT BILLING ROUTE ACCESS', {
    path:     ROUTE_PATH,
    method,
    exec_mode: execMode,
    note:     execMode === 'internal_only'
      ? 'Consider routing credit ops through /api/internal/exec'
      : 'standard',
  })
}

// ── Credit floor helper ────────────────────────────────────────────────────────
// Returns the current net credit balance for a user.
//   Grants  → positive usage_count rows (e.g. +150)
//   Usage   → negative usage_count rows (e.g. -10)
//   Refunds → negative usage_count rows (e.g. -50)
// Net = SUM of all rows. Positive = available balance.
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
  logDirectAccess('POST')

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

    // ── Credit direction + floor protection ─────────────────────────────────
    // Credits follow signed accounting:
    //   Grants  (webhook)  → positive rows (+N)
    //   Usage   (this fn)  → negative rows (-N)
    //   Refunds (webhook)  → negative rows (-N)
    // The floor guard: currentBalance + usage_count >= 0
    if (feature === 'credits') {
      const usage_count    = -Math.abs(count)    // always negative for deductions
      const currentBalance = await getNetCreditBalance(supabase, userId)

      // ── Floor check ────────────────────────────────────────────────────────
      if (currentBalance + usage_count < 0) {
        console.warn('CREDIT FLOOR BLOCKED', {
          userId:           userId.slice(0, 8) + '…',
          attempted_change: usage_count,
          current_total:    currentBalance,
        })
        return NextResponse.json(
          { error: 'INSUFFICIENT_CREDITS', current_balance: Math.max(0, currentBalance) },
          { status: 402 }
        )
      }

      // ── Insert negative row ────────────────────────────────────────────────
      console.log('CREDIT USAGE', {
        userId:         userId.slice(0, 8) + '…',
        deducted:       usage_count,
        balance_before: currentBalance,
      })

      const { error } = await supabase.from('usage_ledger').insert({
        user_id:     userId,
        feature:     'credits',
        usage_count,             // negative value
        metadata,
      })

      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, deducted: Math.abs(usage_count) })
    }

    // ── Non-credit features — insert as-is (positive count) ─────────────────
    const { error } = await supabase.from('usage_ledger').insert({
      user_id:     userId,
      feature,
      usage_count: count,        // positive for non-credit features
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
  logDirectAccess('GET')

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
