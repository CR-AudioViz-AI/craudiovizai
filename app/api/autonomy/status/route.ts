// app/api/autonomy/status/route.ts
// Javari autonomy status — returns canonical system status for the UI header strip.
// Non-fatal: if the DB tables don't exist yet, returns safe defaults.
// Created: April 27, 2026
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Total planned modules (static canonical count)
    const total = 55

    // Completed executions count
    const { count: completed } = await supabaseAdmin
      .from('javari_team_executions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'complete')

    // Pending autonomy tasks
    const { count: pending } = await supabaseAdmin
      .from('javari_autonomy_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const verified = completed ?? 0
    const pct = Math.round((verified / total) * 100)

    return NextResponse.json({
      ok: true,
      canonical: {
        total,
        completed: completed ?? 0,
        verified,
        pending:   pending ?? 0,
        pct:       Math.min(pct, 100),
        phase:     1,
        mode:      'BUILD',
      },
    })
  } catch {
    // DB tables not yet migrated — return safe defaults so UI renders
    return NextResponse.json({
      ok: true,
      canonical: {
        total: 55, completed: 0, verified: 0, pending: 0, pct: 0, phase: 1, mode: 'BUILD',
      },
    })
  }
}
