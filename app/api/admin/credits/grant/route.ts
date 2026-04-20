// app/api/admin/credits/grant/route.ts
// Admin credit grant — insert positive usage_ledger row for a given user.
// Auth: Bearer token from Authorization header, ADMIN_EMAILS allowlist.
// POST { userId: string, credits: number }
// Updated: April 18, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

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

// ── POST /api/admin/credits/grant ─────────────────────────────────────────────
// Body: { userId: string, credits: number }
// Inserts a positive usage_ledger row — same as a Stripe grant but manual.
// Does NOT touch profiles.credits_balance — balance is computed from ledger SUM.
export async function POST(req: NextRequest) {
  const { error: authError } = await verifyAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json() as { userId?: unknown; credits?: unknown }

    // ── Input validation ────────────────────────────────────────────────────
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
    // Positive usage_count — matches grant direction from webhook handler.
    const { error: insertErr } = await supabase.from('usage_ledger').insert({
      user_id:     userId,
      feature:     'credits',
      usage_count: credits,           // positive: increases balance
      metadata: {
        type:    'grant',
        source:  'admin_grant',
      },
    })

    if (insertErr) {
      console.error('[admin/credits/grant] insert error:', insertErr.message)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    console.log('ADMIN CREDIT GRANT', { userId, credits })

    return NextResponse.json({ ok: true, granted: credits })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/credits/grant] handler error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
