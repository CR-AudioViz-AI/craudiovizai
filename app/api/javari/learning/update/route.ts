// app/api/javari/learning/update/route.ts
// Javari learning update — receives task records from the UI and stores them
// for future model improvement. Non-blocking fire-and-forget endpoint.
// Created: April 27, 2026
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { records?: unknown[] }
    const records = body.records ?? []

    if (records.length === 0) {
      return NextResponse.json({ ok: true, stored: 0 })
    }

    // Store in ai_generations with tool_type = 'javari.learning'
    const rows = records.map((r: unknown) => ({
      user_id:   '00000000-0000-0000-0000-000000000000', // anonymised — no auth required
      tool_type: 'javari.learning',
      prompt:    JSON.stringify(r).slice(0, 500),
      parameters: r,
      status:    'completed',
    }))

    const { error } = await supabaseAdmin.from('ai_generations').insert(rows)
    if (error) {
      // Non-fatal — learning updates should never block the UI
      console.warn('[learning/update] insert failed:', error.message)
    }

    return NextResponse.json({ ok: true, stored: error ? 0 : rows.length })
  } catch {
    return NextResponse.json({ ok: true, stored: 0 })
  }
}
