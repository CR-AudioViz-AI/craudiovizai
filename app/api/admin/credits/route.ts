// app/api/admin/credits/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Admin UI observability — read-only credit ledger data.
// CALLED BY: /admin dashboard page (browser, admin users only).
// AUTOMATION: Use /api/internal/exec?action=list_ledger for server-side ops.
// NOTE: Admin UI routes stay open to authenticated admin browsers.
//       BILLING_EXEC_MODE=internal_only logs a warning but does not block.
// ─────────────────────────────────────────────────────────────────────────────
// Auth: Bearer token from Authorization header, ADMIN_EMAILS allowlist.
// Updated: April 22, 2026 — exec layer observability

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

const ROUTE_PATH = '/api/admin/credits'

// ── Admin auth ────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'admin@craudiovizai.com',
]

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function verifyAdmin(
  req: NextRequest,
): Promise<{ error?: NextResponse }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token    = authHeader.slice(7)
  const supabase = db()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  }

  if (!ADMIN_EMAILS.includes(user.email ?? '')) {
    return { error: NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 }) }
  }

  return {}
}

// ── Exec-layer observability ──────────────────────────────────────────────────
function logDirectAccess(method: string) {
  const execMode = process.env.BILLING_EXEC_MODE ?? 'standard'
  console.warn('DIRECT BILLING ROUTE ACCESS', {
    path:     ROUTE_PATH,
    method,
    exec_mode: execMode,
    note:     'Admin UI route — browser access expected. Automation: /api/internal/exec',
  })
}

// ── GET /api/admin/credits ────────────────────────────────────────────────────
// Query params:
//   user_id — filter to a specific user
//   type    — 'grant' | 'usage' | 'refund' (default all)
//   limit   — rows per page (default 50, max 500)
//   since   — ISO timestamp lower bound on created_at
export async function GET(req: NextRequest) {
  const { error } = await verifyAdmin(req)
  if (error) return error

  logDirectAccess('GET')

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') ?? undefined
  const type   = searchParams.get('type')    ?? undefined
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 500)
  const since  = searchParams.get('since')   ?? undefined

  const supabase = db()

  try {
    // ── Raw ledger rows ───────────────────────────────────────────────────────
    let query = supabase
      .from('usage_ledger')
      .select('id, user_id, feature, usage_count, stripe_event_id, metadata, created_at')
      .eq('feature', 'credits')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) query = query.eq('user_id', userId)
    if (type)   query = query.eq('metadata->>type', type)
    if (since)  query = query.gte('created_at', since)

    const { data: rows, error: ledgerErr } = await query
    if (ledgerErr) throw new Error(ledgerErr.message)

    // ── Group by user_id → total credits ─────────────────────────────────────
    const totals: Record<string, {
      user_id:        string
      total_credits:  number
      grants:         number
      usages:         number
      refunds:        number
      last_activity:  string
    }> = {}

    for (const row of rows ?? []) {
      const uid = row.user_id
      if (!totals[uid]) {
        totals[uid] = {
          user_id:       uid,
          total_credits: 0,
          grants:        0,
          usages:        0,
          refunds:       0,
          last_activity: row.created_at,
        }
      }
      const entry = totals[uid]
      entry.total_credits += row.usage_count ?? 0

      const rowType = row.metadata?.type as string | undefined
      if (rowType === 'grant')  entry.grants++
      if (rowType === 'usage')  entry.usages++
      if (rowType === 'refund') entry.refunds++

      if (row.created_at > entry.last_activity) {
        entry.last_activity = row.created_at
      }
    }

    const summary = Object.values(totals).sort(
      (a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    )

    return NextResponse.json({
      ok:           true,
      row_count:    rows?.length ?? 0,
      user_count:   summary.length,
      filters: {
        user_id: userId ?? null,
        type:    type   ?? 'all',
        since:   since  ?? null,
      },
      summary,
      rows,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/credits] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
