// app/api/javari/executions/route.ts
// Javari TEAM — Execution Command Center API
// GET /api/javari/executions          → last 50 executions (list)
// GET /api/javari/executions?id=uuid  → single execution + all tasks
// POST /api/javari/executions         → { action: 'abort', execution_id } → abort running execution
// Read operations use supabaseAdmin. Abort writes status='aborting' and lets the engine poll it.
// Created: April 24, 2026
// Updated: April 24, 2026 — POST /abort endpoint added

import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { abortExecution }    from '@/lib/javari/team/execution-engine'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_EXECUTIONS      = 'javari_team_executions'
const TABLE_EXECUTION_TASKS = 'javari_team_execution_tasks'
const LIST_LIMIT            = 50

// ─────────────────────────────────────────────────────────────────────────────
// Row types (read shapes)
// ─────────────────────────────────────────────────────────────────────────────

interface ExecutionRow {
  id:           string
  plan_id:      string
  status:       string
  total_cost:   number
  created_at:   string
  finalized_at: string | null
}

interface ExecutionTaskRow {
  id:           string
  execution_id: string
  task_id:      string
  role:         string
  status:       string
  cost_used:    number
  output:       string | null
  error:        string | null
  started_at:   string
  completed_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface ListResponse {
  executions: ExecutionRow[]
  count:      number
}

interface DetailResponse {
  execution: ExecutionRow
  tasks:     ExecutionTaskRow[]
}

interface AbortResponse {
  success:      true
  execution_id: string
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

function derivePlanStatus(results: ExecutionTaskRow[]): 'complete' | 'partial' | 'failed' {
  if (results.length === 0) return 'failed'
  const total    = results.length
  const complete = results.filter(r => r.status === 'complete').length
  if (complete === total) return 'complete'
  if (complete === 0)     return 'failed'
  return 'partial'
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/javari/executions
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<NextResponse<ListResponse | DetailResponse | ErrorResponse>> {
  const url = new URL(req.url)
  const id  = url.searchParams.get('id')?.trim()

  // ── Detail mode ───────────────────────────────────────────────────────────
  if (id !== null && id !== undefined) {
    if (!id) return errorResponse('id parameter must not be empty', 400)

    const { data: execution, error: execError } = await supabaseAdmin
      .from(TABLE_EXECUTIONS)
      .select('*')
      .eq('id', id)
      .single()

    if (execError) return errorResponse(`Failed to fetch execution: ${execError.message} (code: ${execError.code})`, 500)
    if (!execution) return errorResponse(`Execution not found: ${id}`, 404)

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from(TABLE_EXECUTION_TASKS)
      .select('*')
      .eq('execution_id', id)
      .order('completed_at', { ascending: true })

    if (tasksError) return errorResponse(`Failed to fetch execution tasks: ${tasksError.message} (code: ${tasksError.code})`, 500)

    return NextResponse.json<DetailResponse>(
      { execution: execution as ExecutionRow, tasks: (tasks ?? []) as ExecutionTaskRow[] },
      { status: 200 }
    )
  }

  // ── List mode ─────────────────────────────────────────────────────────────
  const { data: executions, error: listError } = await supabaseAdmin
    .from(TABLE_EXECUTIONS)
    .select('id, plan_id, status, total_cost, created_at, finalized_at')
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT)

  if (listError) return errorResponse(`Failed to fetch executions: ${listError.message} (code: ${listError.code})`, 500)

  const rows = (executions ?? []) as ExecutionRow[]
  return NextResponse.json<ListResponse>({ executions: rows, count: rows.length }, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/javari/executions
// Body: { action: 'abort', execution_id: string }
//
// Writes status='aborting' to the execution row via abortExecution().
// The engine polls this flag before each task batch and throws on detection,
// which causes the SSE stream to emit { type: 'aborted' } and close.
//
// This approach is serverless-safe: no shared in-process memory needed.
// The abort and the execution may run in different Lambda invocations — both
// communicate via the Supabase row as the shared signal.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse<AbortResponse | ErrorResponse>> {
  let body: unknown
  try {
    const text = await req.text()
    if (!text?.trim()) return errorResponse('Request body is required', 400)
    body = JSON.parse(text)
  } catch {
    return errorResponse('Invalid JSON in request body', 400)
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return errorResponse('Request body must be a JSON object', 400)
  }

  const { action, execution_id } = body as Record<string, unknown>

  if (action !== 'abort') {
    return errorResponse(`Unknown action: "${String(action)}". Supported: "abort"`, 400)
  }

  if (typeof execution_id !== 'string' || !execution_id.trim()) {
    return errorResponse('execution_id is required and must be a non-empty string', 400)
  }

  // Verify the execution exists and is in a stoppable state
  const { data: exec, error: fetchError } = await supabaseAdmin
    .from(TABLE_EXECUTIONS)
    .select('id, status')
    .eq('id', execution_id.trim())
    .single()

  if (fetchError || !exec) {
    return errorResponse(`Execution not found: ${execution_id}`, 404)
  }

  if (!['running', 'aborting'].includes(exec.status)) {
    return errorResponse(
      `Cannot abort execution with status "${exec.status}" — only running executions can be aborted`,
      400
    )
  }

  try {
    await abortExecution(execution_id.trim())
  } catch (err: unknown) {
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to abort execution',
      500
    )
  }

  return NextResponse.json<AbortResponse>(
    { success: true, execution_id: execution_id.trim() },
    { status: 200 }
  )
}

// Suppress unused import warning — derivePlanStatus used for future dashboard
void derivePlanStatus
