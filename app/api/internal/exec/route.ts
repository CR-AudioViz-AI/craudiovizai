// app/api/internal/exec/route.ts
// Internal server-to-server execution endpoint.
// Secured by INTERNAL_API_SECRET — never expose this key publicly.
// Allows Claude, cron jobs, and multi-AI systems to execute privileged
// operations without browser tokens.
// Updated: April 21, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function verifyInternal(req: NextRequest): boolean {
  const secret = req.headers.get('x-internal-secret')
  return !!secret && secret === process.env.INTERNAL_API_SECRET
}

// ── Supported operations ──────────────────────────────────────────────────────
type Op =
  | { op: 'credit_grant';  userId: string; credits: number; note?: string }
  | { op: 'credit_deduct'; userId: string; credits: number; note?: string }
  | { op: 'ledger_query';  userId: string }
  | { op: 'health' }

async function handle(body: Op, supabase: ReturnType<typeof db>) {
  switch (body.op) {

    case 'health':
      return { ok: true, ts: new Date().toISOString() }

    case 'credit_grant': {
      const { userId, credits, note } = body
      if (!userId || credits <= 0) throw new Error('userId required, credits must be > 0')

      const { error } = await supabase.from('usage_ledger').insert({
        user_id:     userId,
        feature:     'credits',
        usage_count: credits,
        metadata: { type: 'grant', source: 'internal_exec', note: note ?? null },
      })
      if (error) throw new Error(error.message)
      console.log('INTERNAL CREDIT GRANT', { userId, credits, note })
      return { ok: true, op: 'credit_grant', userId, granted: credits }
    }

    case 'credit_deduct': {
      const { userId, credits, note } = body
      if (!userId || credits <= 0) throw new Error('userId required, credits must be > 0')

      // Floor check
      const { data: rows } = await supabase
        .from('usage_ledger')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature', 'credits')
      const balance = (rows ?? []).reduce((s, r) => s + (r.usage_count ?? 0), 0)
      if (balance - credits < 0) {
        return { ok: false, error: 'INSUFFICIENT_CREDITS', current_balance: balance }
      }

      const { error } = await supabase.from('usage_ledger').insert({
        user_id:     userId,
        feature:     'credits',
        usage_count: -Math.abs(credits),
        metadata: { type: 'deduct', source: 'internal_exec', note: note ?? null },
      })
      if (error) throw new Error(error.message)
      console.log('INTERNAL CREDIT DEDUCT', { userId, credits, note })
      return { ok: true, op: 'credit_deduct', userId, deducted: credits }
    }

    case 'ledger_query': {
      const { userId } = body
      if (!userId) throw new Error('userId required')

      const { data: rows, error } = await supabase
        .from('usage_ledger')
        .select('usage_count, feature, metadata, created_at')
        .eq('user_id', userId)
        .eq('feature', 'credits')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw new Error(error.message)

      const balance = (rows ?? []).reduce((s, r) => s + (r.usage_count ?? 0), 0)
      return { ok: true, op: 'ledger_query', userId, balance, rows }
    }

    default:
      throw new Error(`Unknown op: ${(body as { op: string }).op}`)
  }
}

// ── POST /api/internal/exec ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!verifyInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as Op
    if (!body?.op) {
      return NextResponse.json({ error: 'op is required' }, { status: 400 })
    }

    const result = await handle(body, db())
    return NextResponse.json(result)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[internal/exec] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
