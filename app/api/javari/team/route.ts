// app/api/javari/team/route.ts
// Javari TEAM Mode — Execution API Route
// POST /api/javari/team
// Accepts a raw ExecutionPlan, validates it, builds the execution graph,
// runs the multi-agent engine, and returns the full ExecutionContext as JSON.
// Created: April 24, 2026

import { NextResponse }        from 'next/server'
import { validateExecutionPlan, buildExecutionGraph } from '@/lib/javari/team/execution-contract'
import { executePlan }         from '@/lib/javari/team/execution-engine'
import type { TaskResult }     from '@/lib/javari/team/execution-engine'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TASKS = 50

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessResponse {
  plan_id:    string
  total_cost: number
  results:    TaskResult[]
  status:     'complete' | 'partial' | 'failed'
}

interface ErrorResponse {
  error:  string
  status: 'failed'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function errorResponse(message: string, httpStatus: number): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    { error: message, status: 'failed' },
    { status: httpStatus }
  )
}

// Determine overall plan status from individual task results
function derivePlanStatus(results: TaskResult[]): 'complete' | 'partial' | 'failed' {
  if (results.length === 0)                                return 'failed'
  const total    = results.length
  const complete = results.filter(r => r.status === 'complete').length
  if (complete === total)  return 'complete'
  if (complete === 0)      return 'failed'
  return 'partial'
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/javari/team
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // ── 1. Reject empty body ───────────────────────────────────────────────────
  const contentLength = req.headers.get('content-length')
  if (contentLength === '0') {
    return errorResponse('Request body is required', 400)
  }

  // ── 2. Parse JSON — reject malformed ──────────────────────────────────────
  let body: unknown
  try {
    const text = await req.text()
    if (!text || text.trim().length === 0) {
      return errorResponse('Request body is empty', 400)
    }
    body = JSON.parse(text)
  } catch {
    return errorResponse('Invalid JSON in request body', 400)
  }

  // ── 3. Body must be an object ──────────────────────────────────────────────
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return errorResponse('Request body must be a JSON object', 400)
  }

  // ── 4. Enforce max tasks before full validation ────────────────────────────
  // Avoids running expensive Zod parse + cycle detection on absurdly large payloads.
  const rawTasks = (body as Record<string, unknown>).tasks
  if (Array.isArray(rawTasks) && rawTasks.length > MAX_TASKS) {
    return errorResponse(
      `Execution plan exceeds maximum task limit of ${MAX_TASKS} (received ${rawTasks.length})`,
      400
    )
  }

  // ── 5. Validate plan schema + cross-field integrity ───────────────────────
  let plan: ReturnType<typeof validateExecutionPlan>
  try {
    plan = validateExecutionPlan(body)
  } catch (err: unknown) {
    return errorResponse(
      err instanceof Error ? err.message : 'Execution plan validation failed',
      400
    )
  }

  // ── 6. Build execution graph (cycle detection + topological sort) ─────────
  let graph: ReturnType<typeof buildExecutionGraph>
  try {
    graph = buildExecutionGraph(plan)
  } catch (err: unknown) {
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to build execution graph',
      400
    )
  }

  // ── 7. Execute plan ────────────────────────────────────────────────────────
  let context: Awaited<ReturnType<typeof executePlan>>
  try {
    context = await executePlan(graph)
  } catch (err: unknown) {
    return errorResponse(
      err instanceof Error ? err.message : 'Execution engine error',
      500
    )
  }

  // ── 8. Serialize results — Map → Array for JSON transport ─────────────────
  // Preserve topological order in the response for deterministic output.
  const resultsArray: TaskResult[] = graph.executionOrder
    .map(id => context.results.get(id))
    .filter((r): r is TaskResult => r !== undefined)

  const status = derivePlanStatus(resultsArray)

  return NextResponse.json<SuccessResponse>(
    {
      plan_id:    context.plan_id,
      total_cost: context.total_cost,
      results:    resultsArray,
      status,
    },
    { status: 200 }
  )
}
