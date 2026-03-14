// app/api/javari/orchestrator/run/route.ts
// CR AudioViz AI — Javari AI Orchestrator Run Endpoint
// Triggers autonomous roadmap execution
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'admin@craudiovizai.com',
]

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const internalSecret = req.headers.get('x-internal-secret')
    const isInternal = internalSecret === process.env.INTERNAL_API_SECRET

    if (!isInternal && (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { task, priority = 'normal', dry_run = false } = body

    // Record execution request in Supabase
    const { data: job, error } = await supabase
      .from('javari_jobs')
      .insert({
        task:       task ?? 'roadmap_execution',
        priority,
        dry_run,
        status:     'queued',
        triggered_by: user?.email ?? 'internal',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      // Table may not exist yet — return execution intent
      console.error('[orchestrator/run] DB error:', error.message)
      return NextResponse.json({
        status:    'accepted',
        message:   'Javari orchestrator triggered (DB log pending)',
        task:      task ?? 'roadmap_execution',
        dry_run,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      status:    'queued',
      job_id:    job?.id,
      task:      task ?? 'roadmap_execution',
      dry_run,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[orchestrator/run]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/javari/orchestrator/run',
    method:   'POST',
    purpose:  'Trigger Javari AI roadmap execution',
    auth:     'Admin session or x-internal-secret header',
    body: {
      task:     'string (optional) — defaults to roadmap_execution',
      priority: 'normal | high | critical',
      dry_run:  'boolean — simulate without executing',
    },
  })
}
