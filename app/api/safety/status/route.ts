// app/api/safety/status/route.ts
// CR AudioViz AI — SafetyOS: System Status
// Friday, March 13, 2026
// Admin-only endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import { isAdminUser }               from '@/lib/credits'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await isAdminUser(user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sbAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    // Count pending safety reports
    const { count: pendingReports } = await sbAdmin
      .from('safety_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Count pending moderation events requiring human review
    const { count: pendingModeration } = await sbAdmin
      .from('moderation_events')
      .select('id', { count: 'exact', head: true })
      .eq('requires_human_review', true)

    // Count pending DMCA notices
    const { count: pendingDMCA } = await sbAdmin
      .from('dmca_notices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'received')

    return NextResponse.json({
      ok:      true,
      service: 'SafetyOS',
      version: '1.0.0',
      queues: {
        safety_reports: pendingReports ?? 0,
        moderation:     pendingModeration ?? 0,
        dmca:           pendingDMCA ?? 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[SafetyOS] GET /api/safety/status:', message)
    return NextResponse.json({ error: 'SafetyOS status check failed' }, { status: 500 })
  }
}
