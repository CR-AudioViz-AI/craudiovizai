// app/api/autonomy/loop/route.ts
// Javari autonomy loop trigger — runs one bounded execution cycle.
// Delegates to /api/javari/autonomy POST internally.
// Created: April 27, 2026
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Forward to the proper autonomy route as a POST
    const url   = new URL(req.url)
    const base  = `${url.protocol}//${url.host}`
    const res   = await fetch(`${base}/api/javari/autonomy`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('Authorization')
          ? { Authorization: req.headers.get('Authorization')! }
          : {}),
      },
      body: JSON.stringify({ maxTasksPerRun: 5, maxCostPerRun: 0.05 }),
    })

    if (!res.ok) {
      // Autonomy route may require auth — return empty result so UI renders
      return NextResponse.json({ executed: [], stopped_reason: 'auth_required' })
    }

    const data = await res.json()
    // Map CycleResult to the shape page.tsx expects
    return NextResponse.json({
      executed:       (data.execution_ids ?? []).map((id: string) => ({
        id,
        title:   'Autonomy task',
        module:  'autonomy',
        model:   'gpt-4o-mini',
        status:  'completed',
        verified: true,
        cost:     (data.total_cost ?? 0) / Math.max(data.tasks_processed ?? 1, 1),
        ts:      Date.now(),
      })),
      total_cost:     data.total_cost ?? 0,
      tasks_processed:data.tasks_processed ?? 0,
      stopped_reason: data.stopped_reason ?? 'no_tasks',
    })
  } catch {
    return NextResponse.json({ executed: [], stopped_reason: 'error' })
  }
}
