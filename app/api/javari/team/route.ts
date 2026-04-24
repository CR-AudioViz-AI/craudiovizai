// app/api/javari/team/route.ts
// Javari TEAM Mode — Execution API Route
// POST /api/javari/team
//   Default: streams task execution as Server-Sent Events (text/event-stream)
//   ?stream=false: returns full JSON response (original behavior, preserved)
// Created: April 24, 2026
// Updated: April 24, 2026 — pass plan to executePlan; expose execution_id in response
// Updated: April 24, 2026 — SSE streaming via ReadableStream + executePlanStreaming

import { NextResponse }        from 'next/server'
import { validateExecutionPlan, buildExecutionGraph } from '@/lib/javari/team/execution-contract'
import { executePlan, executePlanStreaming } from '@/lib/javari/team/execution-engine'
import type { TaskResult, SSEEvent }        from '@/lib/javari/team/execution-engine'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TASKS = 50

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes (JSON mode)
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessResponse {
  plan_id:      string
  execution_id: string
  total_cost:   number
  results:      TaskResult[]
  status:       'complete' | 'partial' | 'failed'
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

function derivePlanStatus(results: TaskResult[]): 'complete' | 'partial' | 'failed' {
  if (results.length === 0)                                return 'failed'
  const total    = results.length
  const complete = results.filter(r => r.status === 'complete').length
  if (complete === total)  return 'complete'
  if (complete === 0)      return 'failed'
  return 'partial'
}

// Encode a single SSE frame — spec requires "data: ...\n\n"
function sseFrame(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

// ─────────────────────────────────────────────────────────────────────────────
// parseAndValidate
// Shared request parsing + validation used by both streaming and JSON paths.
// Returns { plan, graph } on success or a NextResponse error to return early.
// ─────────────────────────────────────────────────────────────────────────────

async function parseAndValidate(req: Request): Promise<
  | { ok: true;  plan: ReturnType<typeof validateExecutionPlan>; graph: ReturnType<typeof buildExecutionGraph> }
  | { ok: false; response: NextResponse<ErrorResponse> }
> {
  // Reject empty body
  const contentLength = req.headers.get('content-length')
  if (contentLength === '0') {
    return { ok: false, response: errorResponse('Request body is required', 400) }
  }

  // Parse JSON
  let body: unknown
  try {
    const text = await req.text()
    if (!text || text.trim().length === 0) {
      return { ok: false, response: errorResponse('Request body is empty', 400) }
    }
    body = JSON.parse(text)
  } catch {
    return { ok: false, response: errorResponse('Invalid JSON in request body', 400) }
  }

  // Must be an object
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, response: errorResponse('Request body must be a JSON object', 400) }
  }

  // Max tasks guard — pre-Zod
  const rawTasks = (body as Record<string, unknown>).tasks
  if (Array.isArray(rawTasks) && rawTasks.length > MAX_TASKS) {
    return {
      ok: false,
      response: errorResponse(
        `Execution plan exceeds maximum task limit of ${MAX_TASKS} (received ${rawTasks.length})`,
        400
      )
    }
  }

  // Validate plan
  let plan: ReturnType<typeof validateExecutionPlan>
  try {
    plan = validateExecutionPlan(body)
  } catch (err: unknown) {
    return {
      ok: false,
      response: errorResponse(
        err instanceof Error ? err.message : 'Execution plan validation failed',
        400
      )
    }
  }

  // Build graph
  let graph: ReturnType<typeof buildExecutionGraph>
  try {
    graph = buildExecutionGraph(plan)
  } catch (err: unknown) {
    return {
      ok: false,
      response: errorResponse(
        err instanceof Error ? err.message : 'Failed to build execution graph',
        400
      )
    }
  }

  return { ok: true, plan, graph }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/javari/team
//
// Default (streaming): returns text/event-stream.
//   Event sequence:
//     { type: "start",         plan_id }
//     { type: "task_start",    task_id }           — one per task, when it fires
//     { type: "task_complete", task_id, result }   — on success
//     { type: "task_error",    task_id, result, error } — on failure
//     { type: "error",         message }           — engine fatal (if any)
//     { type: "complete",      plan_id, execution_id, total_cost, status }
//
// JSON fallback (?stream=false):
//   Returns full ExecutionContext as JSON — original behavior preserved.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const url       = new URL(req.url)
  const streaming = url.searchParams.get('stream') !== 'false'

  // ── Parse + validate (shared) ──────────────────────────────────────────────
  const parsed = await parseAndValidate(req)
  if (!parsed.ok) return parsed.response
  const { plan, graph } = parsed

  // ── JSON mode (original behavior) ─────────────────────────────────────────
  if (!streaming) {
    let context: Awaited<ReturnType<typeof executePlan>>
    try {
      context = await executePlan(graph, plan)
    } catch (err: unknown) {
      return errorResponse(
        err instanceof Error ? err.message : 'Execution engine error',
        500
      )
    }

    const resultsArray: TaskResult[] = graph.executionOrder
      .map(id => context.results.get(id))
      .filter((r): r is TaskResult => r !== undefined)

    const status = derivePlanStatus(resultsArray)

    return NextResponse.json<SuccessResponse>(
      {
        plan_id:      context.plan_id,
        execution_id: context.execution_id,
        total_cost:   context.total_cost,
        results:      resultsArray,
        status,
      },
      { status: 200 }
    )
  }

  // ── SSE streaming mode ─────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      // Helper: encode + enqueue one SSE frame
      function send(event: SSEEvent): void {
        try {
          controller.enqueue(new TextEncoder().encode(sseFrame(event)))
        } catch {
          // Controller may already be closed if client disconnected — non-fatal
        }
      }

      try {
        // ── START event ──────────────────────────────────────────────────────
        send({ type: 'start', plan_id: plan.plan_id })

        // ── Run engine with streaming hooks ──────────────────────────────────
        const context = await executePlanStreaming(graph, plan, send)

        // ── COMPLETE event — summary ──────────────────────────────────────────
        const resultsArray: TaskResult[] = graph.executionOrder
          .map(id => context.results.get(id))
          .filter((r): r is TaskResult => r !== undefined)

        const finalStatus = derivePlanStatus(resultsArray)

        send({
          type:         'complete',
          plan_id:      context.plan_id,
          // @ts-expect-error — SSEEvent is open for extension; adding summary fields
          execution_id: context.execution_id,
          total_cost:   context.total_cost,
          status:       finalStatus,
          task_count:   resultsArray.length,
        })
      } catch (err: unknown) {
        // Engine-level error already emitted via onEngineError hook —
        // emit again here only if the hook didn't fire (e.g., pre-engine throw)
        send({
          type:    'error',
          message: err instanceof Error ? err.message : String(err),
        })
      } finally {
        // Always close — client EventSource will see stream end
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    status:  200,
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      // Prevent buffering in Vercel edge/serverless proxies
      'X-Accel-Buffering': 'no',
    },
  })
}
