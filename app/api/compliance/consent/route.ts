// app/api/compliance/consent/route.ts
// CR AudioViz AI — ComplianceOS: Record / Retrieve Consent
// Friday, March 13, 2026
// Requires auth session.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import { recordConsent, getLatestConsent, withdrawConsent, CONSENT_VERSION } from '@/lib/compliance'
import { z } from 'zod'

const ConsentSchema = z.object({
  action:   z.enum(['record', 'withdraw']),
  purposes: z.object({
    analytics:            z.boolean().optional(),
    marketing:            z.boolean().optional(),
    personalization:      z.boolean().optional(),
    third_party_sharing:  z.boolean().optional(),
  }),
  source: z.enum(['banner', 'settings', 'onboarding', 'api']).optional(),
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
    const parsed = ConsentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'

    if (parsed.data.action === 'withdraw') {
      const purposesToWithdraw = Object.entries(parsed.data.purposes)
        .filter(([, v]) => v === false)
        .map(([k]) => k) as any[]
      await withdrawConsent(user.id, purposesToWithdraw)
      return NextResponse.json({ success: true, action: 'withdrawn' })
    }

    const id = await recordConsent({
      userId:          user.id,
      purposes:        parsed.data.purposes,
      ipAddress,
      userAgent,
      consentVersion:  CONSENT_VERSION,
      source:          parsed.data.source ?? 'api',
    })
    return NextResponse.json({ success: true, consentId: id, version: CONSENT_VERSION }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ComplianceOS] POST /api/compliance/consent:', message)
    return NextResponse.json({ error: 'Failed to process consent' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const consent = await getLatestConsent(user.id)
    return NextResponse.json({
      userId:        user.id,
      consent:       consent ?? null,
      currentVersion: CONSENT_VERSION,
      upToDate:      consent?.version === CONSENT_VERSION,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ComplianceOS] GET /api/compliance/consent:', message)
    return NextResponse.json({ error: 'Failed to retrieve consent' }, { status: 500 })
  }
}
