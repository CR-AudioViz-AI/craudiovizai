// app/api/javari/queue/route.ts
// CR AudioViz AI — Javari Task Queue
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: jobs, error } = await supabase
      .from('javari_jobs')
      .select('*')
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: true })

    return NextResponse.json({
      queue:     jobs ?? [],
      count:     jobs?.length ?? 0,
      timestamp: new Date().toISOString(),
      note:      error ? `DB: ${error.message}` : 'live',
    })
  } catch (err: unknown) {
    return NextResponse.json({ queue: [], count: 0, timestamp: new Date().toISOString() })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isInternal = req.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET

    if (!isInternal && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { task, priority = 'normal', metadata = {} } = body

    const { data: job, error } = await supabase
      .from('javari_jobs')
      .insert({ task, priority, metadata, status: 'queued', triggered_by: user?.email ?? 'internal' })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, note: 'javari_jobs table may not exist yet' }, { status: 500 })
    }

    return NextResponse.json({ job_id: job?.id, status: 'queued', task, priority })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
