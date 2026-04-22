// app/api/admin/webhooks/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Admin UI observability — read-only billing_events data.
// CALLED BY: /admin dashboard page (browser, admin users only).
// AUTOMATION: Use /api/internal/exec?action=replay_webhook for server-side ops.
// NOTE: Admin UI routes stay open to authenticated admin browsers.
//       BILLING_EXEC_MODE=internal_only logs a warning but does not block.
// ─────────────────────────────────────────────────────────────────────────────
// Auth: Bearer token from Authorization header, ADMIN_EMAILS allowlist.
// Updated: April 22, 2026 — exec layer observability

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

const ROUTE_PATH = '/api/admin/webhooks'

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

// ── GET /api/admin/webhooks ───────────────────────────────────────────────────
// Query params:
//   event_type  — filter by Stripe event type (e.g. 'checkout.session.completed')
//   processed   — 'true' | 'false' | 'all' (default 'all')
//   limit       — rows to return (default 50, max 200)
//   since       — ISO timestamp lower bound on created_at
//   event_id    — look up a specific stripe_event_id
export async function GET(req: NextRequest) {
  const { error } = await verifyAdmin(req)
  if (error) return error

  logDirectAccess('GET')

  const { searchParams } = new URL(req.url)
  const eventType = searchParams.get('event_type') ?? undefined
  const processed = searchParams.get('processed')  ?? 'all'
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const since     = searchParams.get('since')      ?? undefined
  const eventId   = searchParams.get('event_id')   ?? undefined

  const supabase = db()

  try {
    let query = supabase
      .from('billing_events')
      .select('id, stripe_event_id, event_type, processed, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventType) query = query.eq('event_type', eventType)
    if (since)     query = query.gte('created_at', since)
    if (eventId)   query = query.eq('stripe_event_id', eventId)

    if (processed === 'true')  query = query.eq('processed', true)
    if (processed === 'false') query = query.eq('processed', false)

    const { data: rows, error: eventsErr } = await query
    if (eventsErr) throw new Error(eventsErr.message)

    // ── Summary stats ─────────────────────────────────────────────────────────
    const total       = rows?.length ?? 0
    const processedN  = rows?.filter(r => r.processed).length  ?? 0
    const pendingN    = rows?.filter(r => !r.processed).length ?? 0

    const byType: Record<string, number> = {}
    for (const row of rows ?? []) {
      byType[row.event_type] = (byType[row.event_type] ?? 0) + 1
    }

    return NextResponse.json({
      ok:      true,
      count:   total,
      summary: {
        processed: processedN,
        pending:   pendingN,
        by_type:   byType,
      },
      filters: {
        event_type: eventType ?? null,
        processed:  processed,
        since:      since     ?? null,
        event_id:   eventId   ?? null,
      },
      events: rows?.map(r => ({
        id:              r.id,
        stripe_event_id: r.stripe_event_id,
        event_type:      r.event_type,
        processed:       r.processed,
        created_at:      r.created_at,
      })) ?? [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/webhooks] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
