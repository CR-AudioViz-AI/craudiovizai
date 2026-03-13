// app/api/compliance/rights/route.ts
// CR AudioViz AI — ComplianceOS: Data Subject Rights (GDPR/CCPA)
// Friday, March 13, 2026
// Requires auth session.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import { submitDataSubjectRequest }  from '@/lib/compliance'
import { z }                         from 'zod'

const DSRSchema = z.object({
  requestType: z.enum(['access', 'deletion', 'portability', 'correction', 'restriction', 'objection']),
  description: z.string().max(2000).optional(),
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
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = DSRSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    const result = await submitDataSubjectRequest({
      userId:      user.id,
      email:       user.email,
      requestType: parsed.data.requestType,
      description: parsed.data.description,
      ipAddress,
    })

    return NextResponse.json({
      success:                 true,
      caseNumber:              result.caseNumber,
      estimatedCompletionDays: result.estimatedCompletionDays,
      message:                 `Your ${parsed.data.requestType} request has been received (Case: ${result.caseNumber}). We will respond within ${result.estimatedCompletionDays} days.`,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ComplianceOS] POST /api/compliance/rights:', message)
    return NextResponse.json({ error: 'Failed to submit data subject request' }, { status: 500 })
  }
}
