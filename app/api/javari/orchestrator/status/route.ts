// app/api/javari/orchestrator/status/route.ts
// CR AudioViz AI — Javari Orchestrator Status
// Friday, March 13, 2026

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Check active jobs
    const { data: jobs, error: jobsErr } = await supabase
      .from('javari_jobs')
      .select('id, task, status, priority, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check roadmap progress
    const { data: roadmap } = await supabase
      .from('javari_roadmap_progress')
      .select('phase, milestone, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    // Platform health summary
    const { data: credits } = await supabase
      .from('user_credits')
      .select('id')
      .limit(1)

    return NextResponse.json({
      orchestrator: 'online',
      timestamp:    new Date().toISOString(),
      platform: {
        supabase: 'connected',
        database: credits !== null ? 'healthy' : 'degraded',
      },
      jobs: {
        recent:  jobs ?? [],
        db_error: jobsErr?.message ?? null,
      },
      roadmap: {
        recent_progress: roadmap ?? [],
      },
      endpoints: [
        'POST /api/javari/orchestrator/run',
        'GET  /api/javari/orchestrator/status',
        'GET  /api/javari/roadmap',
        'GET  /api/javari/queue',
      ],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({
      orchestrator: 'degraded',
      error:        msg,
      timestamp:    new Date().toISOString(),
    }, { status: 200 }) // 200 — orchestrator itself is up even if DB is down
  }
}
