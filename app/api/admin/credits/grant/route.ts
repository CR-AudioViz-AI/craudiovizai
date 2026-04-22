// app/api/admin/credits/grant/route.ts
// Admin credit grant — insert positive usage_ledger row for a given user.
// Auth: TWO valid paths:
//   1. Bearer <supabase-jwt> for ADMIN_EMAILS user (browser/manual)
//   2. X-Internal-Secret <INTERNAL_API_SECRET> (server-to-server / Claude automation)
// POST { userId: string, credits: number }
// Updated: April 18, 2026 — added internal secret auth path

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// ── Admin allowlist ───────────────────────────────────────────────────────────
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

// ── Auth: accepts either admin JWT or internal secret ─────────────────────────
async function verifyAuth(
  req: NextRequest,
): Promise<{ ok: boolean; source: string; error?: NextResponse }> {
  // Path 1: Internal server-to-server secret (Claude, cron, multi-AI)
  const internalSecret = req.headers.get('x-internal-secret')
  if (internalSecret) {
    if (internalSecret === process.env.INTERNAL_API_SECRET) {
      return { ok: true, source: 'internal_secret' }
    }
    return {
      ok: false,
      source: 'internal_secret',
      error: NextResponse.json({ error: 'Invalid internal secret' }, { status: 401 }),
    }
  }

  // Path 2: Admin user JWT
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      source: 'none',
      error: NextResponse.json(
        { error: 'Unauthorized — provide Bearer token or X-Internal-Secret header' },
        { status: 401 }
      ),
    }
  }

  const token    = authHeader.slice(7)
  const supabase = db()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      ok: false,
      source: 'jwt',
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    }
  }

  if (!ADMIN_EMAILS.includes(user.email ?? '')) {
    return {
      ok: false,
      source: 'jwt',
      error: NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 }),
    }
  }

  return { ok: true, source: 'admin_jwt' }
}

// ── POST /api/admin/credits/grant ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (!auth.ok) return auth.error!

  try {
    const body = await req.json() as { userId?: unknown; credits?: unknown }
    const { userId, credits } = body

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (
      credits === undefined ||
      credits === null ||
      typeof credits !== 'number' ||
      !Number.isInteger(credits) ||
      credits <= 0 ||
      credits > 1_000_000
    ) {
      return NextResponse.json(
        { error: 'credits must be a positive integer (max 1,000,000)' },
        { status: 400 }
      )
    }

    const supabase = db()

    // ── Verify user exists ──────────────────────────────────────────────────
    const { data: userRecord, error: userErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userErr) {
      console.error('[admin/credits/grant] profile lookup error:', userErr.message)
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 })
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found', userId },
        { status: 404 }
      )
    }

    // ── Insert grant row ────────────────────────────────────────────────────
    const { error: insertErr } = await supabase.from('usage_ledger').insert({
      user_id:     userId,
      feature:     'credits',
      usage_count: credits,
      metadata: {
        type:        'grant',
        source:      'admin_grant',
        auth_source: auth.source,
      },
    })

    if (insertErr) {
      console.error('[admin/credits/grant] insert error:', insertErr.message)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    console.log('ADMIN CREDIT GRANT', { userId, credits, auth_source: auth.source })

    return NextResponse.json({ ok: true, granted: credits, auth_source: auth.source })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/credits/grant] handler error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
