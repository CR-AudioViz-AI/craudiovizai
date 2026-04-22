// app/api/admin/payments/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Admin UI observability — read-only Stripe session data.
// CALLED BY: /admin dashboard page (browser, admin users only).
// AUTOMATION: Use /api/internal/exec for server-side admin operations.
// NOTE: Admin UI routes stay open to authenticated admin browsers.
//       BILLING_EXEC_MODE=internal_only logs a warning but does not block.
// ─────────────────────────────────────────────────────────────────────────────
// Auth: Bearer token from Authorization header, ADMIN_EMAILS allowlist.
// Updated: April 22, 2026 — exec layer observability

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

const ROUTE_PATH = '/api/admin/payments'

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

  const token   = authHeader.slice(7)
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

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2024-06-20' })
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

// ── GET /api/admin/payments ───────────────────────────────────────────────────
// Query params:
//   limit   — number of sessions to return (default 20, max 100)
//   mode    — 'payment' | 'subscription' | all (default all)
//   status  — 'complete' | 'expired' | 'open' (default 'complete')
export async function GET(req: NextRequest) {
  const { error } = await verifyAdmin(req)
  if (error) return error

  logDirectAccess('GET')

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
  const mode   = searchParams.get('mode')   ?? undefined
  const status = searchParams.get('status') ?? 'complete'

  try {
    const stripe = getStripe()

    const params: Stripe.Checkout.SessionListParams = {
      limit,
      ...(status !== 'all' && { status: status as Stripe.Checkout.SessionListParams.Status }),
    }

    const sessions = await stripe.checkout.sessions.list(params)

    const rows = sessions.data
      .filter(s => !mode || s.mode === mode)
      .map(s => ({
        id:               s.id,
        mode:             s.mode,
        status:           s.status,
        payment_status:   s.payment_status,
        amount_total:     s.amount_total,
        currency:         s.currency,
        customer_email:   s.customer_details?.email ?? null,
        created:          new Date(s.created * 1000).toISOString(),
        metadata:         s.metadata,
        success_url:      s.success_url,
        livemode:         s.livemode,
      }))

    return NextResponse.json({
      ok:      true,
      count:   rows.length,
      mode_filter:   mode ?? 'all',
      status_filter: status,
      sessions: rows,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/payments] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
