// app/api/internal/run-grant/route.ts
// One-shot credit grant runner — callable via GET for server-side automation.
// Secured by ?secret= query param matching INTERNAL_API_SECRET.
// Calls /api/internal/exec internally using the service role context.
// April 21, 2026

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

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId  = req.nextUrl.searchParams.get('userId')  ?? 'e5954192-c98f-4a6f-92ba-a86ebf607ac6'
  const credits = parseInt(req.nextUrl.searchParams.get('credits') ?? '150', 10)
  const note    = req.nextUrl.searchParams.get('note') ?? 'server-side grant via Claude automation'

  if (!userId || isNaN(credits) || credits <= 0) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  try {
    const supabase = db()

    // Verify user exists
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', userId).maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'User not found', userId }, { status: 404 })
    }

    // Get balance before
    const { data: rows } = await supabase
      .from('usage_ledger').select('usage_count')
      .eq('user_id', userId).eq('feature', 'credits')
    const balance_before = (rows ?? []).reduce((s, r) => s + (r.usage_count ?? 0), 0)

    // Insert grant
    const { error: insertErr } = await supabase.from('usage_ledger').insert({
      user_id:     userId,
      feature:     'credits',
      usage_count: credits,
      metadata: {
        type:   'grant',
        source: 'internal_run_grant',
        note,
      },
    })

    if (insertErr) throw new Error(insertErr.message)

    const balance_after = balance_before + credits

    console.log('RUN_GRANT EXECUTED', { userId, credits, balance_before, balance_after, note })

    return NextResponse.json({
      ok:             true,
      granted:        credits,
      userId,
      balance_before,
      balance_after,
      note,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[internal/run-grant] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
