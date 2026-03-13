// app/api/safety/report/route.ts
// CR AudioViz AI — SafetyOS: Submit Content / User Report
// Friday, March 13, 2026
// Public endpoint — requires auth session.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import { submitSafetyReport }        from '@/lib/safety'
import type { ContentCategory }      from '@/lib/safety'
import { z }                         from 'zod'

const ReportSchema = z.object({
  reportedUserId:    z.string().uuid().optional(),
  reportedContentId: z.string().uuid().optional(),
  contentType:       z.enum(['user', 'content', 'message', 'profile', 'upload']),
  category:          z.enum([
    'hate_speech', 'harassment', 'sexual_content', 'violence', 'spam',
    'misinformation', 'illegal_activity', 'self_harm', 'child_safety',
    'terrorism', 'copyright', 'privacy_violation',
  ]) as z.ZodEnum<[ContentCategory, ...ContentCategory[]]>,
  description:       z.string().min(10).max(2000),
  evidence:          z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await submitSafetyReport({
      reporterId:        user.id,
      reportedUserId:    parsed.data.reportedUserId,
      reportedContentId: parsed.data.reportedContentId,
      contentType:       parsed.data.contentType,
      category:          parsed.data.category,
      description:       parsed.data.description,
      evidence:          parsed.data.evidence,
    })

    return NextResponse.json({ success: true, reportId: result.id, status: result.status }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[SafetyOS] POST /api/safety/report:', message)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
