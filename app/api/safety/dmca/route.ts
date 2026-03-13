// app/api/safety/dmca/route.ts
// CR AudioViz AI — SafetyOS: DMCA Notice Intake
// Friday, March 13, 2026
// Public endpoint — no auth required (DMCA must be accessible to claimants).

import { NextRequest, NextResponse } from 'next/server'
import { submitDMCANotice }          from '@/lib/safety'
import { z }                         from 'zod'

const DMCASchema = z.object({
  claimantName:   z.string().min(2).max(200),
  claimantEmail:  z.string().email(),
  copyrightWork:  z.string().min(10).max(2000),
  infringingUrl:  z.string().url(),
  statement:      z.string().min(50).max(5000),
  signature:      z.string().min(2).max(200),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = DMCASchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    const result = await submitDMCANotice(parsed.data, ipAddress)
    return NextResponse.json({
      success:    true,
      caseNumber: result.caseNumber,
      message:    'Your DMCA notice has been received. You will be contacted within 48 hours.',
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[SafetyOS] POST /api/safety/dmca:', message)
    return NextResponse.json({ error: 'Failed to process DMCA notice' }, { status: 500 })
  }
}
