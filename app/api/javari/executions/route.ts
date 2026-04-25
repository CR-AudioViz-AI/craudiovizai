// app/api/javari/executions/route.ts
// Javari TEAM — Execution Command Center API
// GET /api/javari/executions          → last 50 executions (list)
// GET /api/javari/executions?id=uuid  → single execution + all tasks
// Read-only. Does not modify execution state.
// Created: April 24, 2026

import { NextResponse } from 'next/server'
import { supabaseAdmin }  from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Table names — must stay in sync with execution-store.ts
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_EXECUTIONS      = 'javari_team_executions'
const TABLE_EXECUTION_TASKS = 'javari_team_execution_tasks'
const LIST_LIMIT            = 50

// ─────────────────────────────────────────────────────────────────────────────
// Row types (read shapes — subset of what the store writes)
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/javari/executions
// Without ?id: returns last 50 executions ordered by created_at desc
// With ?id=uuid: returns that execution + all its tasks
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<NextResponse<ListResponse | DetailResponse | ErrorResponse>> {
  const url = new URL(req.url)
  const id  = url.searchParams.get('id')?.trim()

  // ── Detail mode: ?id=<uuid> ───────────────────────────────────────────────
  if (id !== null && id !== undefined) {
    if (!id) {
      return errorResponse('id parameter must not be empty', 400)
    }

    // Fetch execution row
    const { data: execution, error: execError } = await supabaseAdmin
      .from(TABLE_EXECUTIONS)
      .select('*')
      .eq('id', id)
      .single()

    if (execError) {
      return errorResponse(
        `Failed to fetch execution: ${execError.message} (code: ${execError.code})`,
        500
      )
    }

    if (!execution) {
      return errorResponse(`Execution not found: ${id}`, 404)
    }

    // Fetch all tasks for this execution, ordered by completed_at
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from(TABLE_EXECUTION_TASKS)
      .select('*')
      .eq('execution_id', id)
      .order('completed_at', { ascending: true })

    if (tasksError) {
      return errorResponse(
        `Failed to fetch execution tasks: ${tasksError.message} (code: ${tasksError.code})`,
        500
      )
    }

    return NextResponse.json<DetailResponse>(
      {
        execution: execution as ExecutionRow,
        tasks:     (tasks ?? []) as ExecutionTaskRow[],
      },
      { status: 200 }
    )
  }

  // ── List mode: no ?id ─────────────────────────────────────────────────────
  const { data: executions, error: listError } = await supabaseAdmin
    .from(TABLE_EXECUTIONS)
    .select('id, plan_id, status, total_cost, created_at, finalized_at')
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT)

  if (listError) {
    return errorResponse(
      `Failed to fetch executions: ${listError.message} (code: ${listError.code})`,
      500
    )
  }

  const rows = (executions ?? []) as ExecutionRow[]

  return NextResponse.json<ListResponse>(
    { executions: rows, count: rows.length },
    { status: 200 }
  )
}
