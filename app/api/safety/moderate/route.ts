// app/api/safety/moderate/route.ts
// CR AudioViz AI — SafetyOS: Content Moderation Gate
// Friday, March 13, 2026
// Internal endpoint — called by other platform services before publishing content.
// Requires INTERNAL_API_SECRET header for service-to-service calls,
// OR a valid user session for user-initiated checks.

import { NextRequest, NextResponse } from 'next/server'
import { moderateContent }           from '@/lib/safety'
import { z }                         from 'zod'

const ModerateSchema = z.object({
  text:        z.string().max(50000),
  userId:      z.string().uuid(),
  contentType: z.enum(['message', 'profile', 'upload', 'comment']),
  appId:       z.string().optional(),
  metadata:    z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Service-to-service auth
    const internalSecret = request.headers.get('x-internal-secret')
    const expectedSecret = process.env.INTERNAL_API_SECRET
    if (!expectedSecret || internalSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ModerateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await moderateContent(parsed.data.text, {
      userId:      parsed.data.userId,
      contentType: parsed.data.contentType,
      appId:       parsed.data.appId,
      metadata:    parsed.data.metadata,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[SafetyOS] POST /api/safety/moderate:', message)
    return NextResponse.json({ error: 'Moderation check failed' }, { status: 500 })
  }
}
