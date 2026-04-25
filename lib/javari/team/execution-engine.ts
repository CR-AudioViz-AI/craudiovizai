// lib/javari/team/execution-engine.ts
// Javari TEAM Mode — Multi-Agent Execution Engine
// Consumes an ExecutionGraph from execution-contract.ts and runs tasks in
// topological order with maximum parallelism where dependencies allow.
// Stub runners simulate execution — AI dispatch wired in next layer.
// Created: April 24, 2026
// Updated: April 24, 2026 — persistence wired: createExecution, saveTaskResult, finalizeExecution
// Updated: April 24, 2026 — ExecutionHooks interface + executePlanStreaming wrapper for SSE
// Updated: April 24, 2026 — abort signal via Supabase status flag (serverless-safe kill switch)

import type {
  ExecutionGraph,
  TaskNode,
} from './execution-contract'

import {
  createExecution,
  saveTaskResult,
  finalizeExecution,
} from './execution-store'

import { supabaseAdmin } from '@/lib/supabase'

import type { ExecutionPlan } from './execution-contract'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskResultStatus = 'complete' | 'failed'

export interface TaskResult {
  task_id:      string
  status:       TaskResultStatus
  output?:      string
  error?:       string
  cost_used:    number
  started_at:   string
  completed_at: string
}

export interface ExecutionContext {
  plan_id:      string
  execution_id: string          // Supabase UUID — added for persistence
  results:      Map<string, TaskResult>
  total_cost:   number
}

// ─────────────────────────────────────────────────────────────────────────────
// ExecutionHooks
// Optional lifecycle callbacks injected into executePlan.
// Called synchronously inside the batch loop — callers must not throw.
// Used by executePlanStreaming to emit SSE events as tasks fire.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutionHooks {
  /** Called immediately before a task is dispatched to its runner */
  onTaskStart?:    (task: TaskNode) => void
  /** Called immediately after a task settles (success or cascade-fail) */
  onTaskComplete?: (result: TaskResult) => void
  /** Called when the engine throws a fatal error (deadlock, DB failure, abort) */
  onEngineError?:  (error: Error) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Abort signal
//
// Architecture note: Vercel serverless functions do NOT share module-level
// memory across invocations. A simple in-process Map would not work because
// the abort POST arrives in a different Lambda than the running SSE stream.
//
// Solution: abortExecution() writes status='aborting' to the Supabase
// executions row. The engine polls this flag before each task batch via
// checkAborted(). The poll adds one DB read per batch — acceptable latency
// (typically <5ms) and no Redis dependency.
// ─────────────────────────────────────────────────────────────────────────────

// Exported — called by the abort API route
export async function abortExecution(execution_id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('javari_team_executions')
    .update({ status: 'aborting' })
    .eq('id', execution_id)

  if (error) {
    throw new Error(
      `abortExecution failed for "${execution_id}": ${error.message} (code: ${error.code})`
    )
  }
}

// Internal — polled by executePlan before each task batch
async function checkAborted(execution_id: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('javari_team_executions')
      .select('status')
      .eq('id', execution_id)
      .single()
    return data?.status === 'aborting'
  } catch {
    // Non-fatal — if the check fails, continue execution (fail-safe over fail-stop)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub runner return shape
// ─────────────────────────────────────────────────────────────────────────────

interface StubResult {
  output:    string
  cost_used: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub Runners
// Each simulates execution for its role.
// No AI calls yet — structured output, respects max_cost, includes context.
// Replace internals with real dispatch when wiring AI layer.
// ─────────────────────────────────────────────────────────────────────────────

async function runArchitect(task: TaskNode): Promise<StubResult> {
  return {
    output: JSON.stringify({
      role:       'architect',
      task_id:    task.id,
      blueprint:  `Decomposed objective "${task.objective}" into ${task.outputs.length} output artifact(s).`,
      outputs:    task.outputs,
      model_used: task.model,
      note:       'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.8, task.max_cost),
  }
}

async function runBuilder(task: TaskNode): Promise<StubResult> {
  return {
    output: JSON.stringify({
      role:        'builder',
      task_id:     task.id,
      artifacts:   task.outputs.map(o => ({ name: o, status: 'generated' })),
      inputs_used: task.inputs,
      model_used:  task.model,
      note:        'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.9, task.max_cost),
  }
}

async function runTester(task: TaskNode): Promise<StubResult> {
  return {
    output: JSON.stringify({
      role:       'tester',
      task_id:    task.id,
      tests_run:  task.inputs.length,
      passed:     task.inputs.length,
      failed:     0,
      coverage:   '100%',
      model_used: task.model,
      note:       'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.6, task.max_cost),
  }
}

async function runReviewer(task: TaskNode): Promise<StubResult> {
  return {
    output: JSON.stringify({
      role:       'reviewer',
      task_id:    task.id,
      verdict:    'approved',
      issues:     [],
      confidence: 0.97,
      model_used: task.model,
      note:       'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.7, task.max_cost),
  }
}

async function runDeployer(task: TaskNode): Promise<StubResult> {
  return {
    output: JSON.stringify({
      role:        'deployer',
      task_id:     task.id,
      deployed:    task.inputs,
      environment: 'preview',
      sha:         `stub-${task.id}-${Date.now().toString(36)}`,
      model_used:  task.model,
      note:        'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.5, task.max_cost),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTask
// Dispatches a single task to its role-specific runner.
// Records timestamps, handles errors, returns a complete TaskResult.
// Pure — no side effects, no DB calls. Persistence is the caller's concern.
// ─────────────────────────────────────────────────────────────────────────────

export async function executeTask(
  task: TaskNode,
  _context: ExecutionContext,
): Promise<TaskResult> {
  const started_at = new Date().toISOString()

  try {
    let stub: StubResult

    switch (task.role) {
      case 'architect': stub = await runArchitect(task); break
      case 'builder':   stub = await runBuilder(task);   break
      case 'tester':    stub = await runTester(task);    break
      case 'reviewer':  stub = await runReviewer(task);  break
      case 'deployer':  stub = await runDeployer(task);  break
      default: {
        // TypeScript exhaustiveness guard — should never reach here
        const _exhaustive: never = task.role
        throw new Error(`Unknown agent role: ${String(_exhaustive)}`)
      }
    }

    // Clamp cost to declared max — runner must not exceed contract
    const cost_used = Math.min(stub.cost_used, task.max_cost)

    return {
      task_id:      task.id,
      status:       'complete',
      output:       stub.output,
      cost_used,
      started_at,
      completed_at: new Date().toISOString(),
    }
  } catch (err: unknown) {
    return {
      task_id:      task.id,
      status:       'failed',
      error:        err instanceof Error ? err.message : String(err),
      cost_used:    0,
      started_at,
      completed_at: new Date().toISOString(),
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// deriveFinalStatus
// Inspects all task results to determine the overall execution outcome.
// ─────────────────────────────────────────────────────────────────────────────

function deriveFinalStatus(
  results:  Map<string, TaskResult>,
  aborted?: boolean,
): 'complete' | 'partial' | 'failed' {
  if (aborted) return 'failed'
  const all      = [...results.values()]
  const total    = all.length
  const complete = all.filter(r => r.status === 'complete').length
  if (total === 0 || complete === 0) return 'failed'
  if (complete === total)            return 'complete'
  return 'partial'
}

// ─────────────────────────────────────────────────────────────────────────────
// executePlan
// Executes all tasks in the graph using the topological order from the
// contract layer, running independent tasks in parallel via Promise.all.
//
// Abort flow:
//   - checkAborted() is called at the top of each batch loop iteration.
//   - If the Supabase row shows status='aborting', the engine throws
//     "Execution aborted by user" which propagates to the SSE error hook,
//     emitting { type: 'error', message: 'Execution aborted by user' }.
//   - finalizeExecution() still runs in finally — row is closed out as 'failed'.
// ─────────────────────────────────────────────────────────────────────────────

export async function executePlan(
  graph: ExecutionGraph,
  plan:  ExecutionPlan,
  hooks: ExecutionHooks = {},
): Promise<ExecutionContext> {
  const { executionOrder, taskMap } = graph
  const { onTaskStart, onTaskComplete, onEngineError } = hooks

  // ── 1. Create DB record ────────────────────────────────────────────────────
  const execution_id = await createExecution(plan)

  const plan_id = plan.plan_id

  const context: ExecutionContext = {
    plan_id,
    execution_id,
    results:    new Map<string, TaskResult>(),
    total_cost: 0,
  }

  const dispatched = new Set<string>()
  let   remaining  = [...executionOrder]
  let   aborted    = false

  // ── 2. Execution loop ──────────────────────────────────────────────────────
  try {
    while (remaining.length > 0) {
      // ── Abort check — poll Supabase before each batch ──────────────────────
      if (await checkAborted(execution_id)) {
        aborted = true
        throw new Error('Execution aborted by user')
      }

      const readyBatch:   TaskNode[] = []
      const stillPending: string[]   = []

      for (const taskId of remaining) {
        const task = taskMap.get(taskId)
        if (!task) {
          stillPending.push(taskId)
          continue
        }

        const depsAllSettled = task.dependencies.every(dep =>
          context.results.has(dep)
        )

        if (depsAllSettled && !dispatched.has(taskId)) {
          readyBatch.push(task)
          dispatched.add(taskId)
        } else if (!dispatched.has(taskId)) {
          stillPending.push(taskId)
        }
      }

      if (readyBatch.length === 0 && stillPending.length > 0) {
        const blocked = stillPending.join(', ')
        throw new Error(
          `executePlan: no tasks became ready — possible unresolved dependency deadlock. Blocked tasks: [${blocked}]`
        )
      }

      // Execute all ready tasks in parallel, persist + hook each result
      const batchResults = await Promise.all(
        readyBatch.map(async (task): Promise<TaskResult> => {
          // ── Hook: task starting ──────────────────────────────────────────
          try { onTaskStart?.(task) } catch { /* hook errors never propagate */ }

          // Cascade-fail: skip if any dependency failed
          const failedDep = task.dependencies.find(dep =>
            context.results.get(dep)?.status === 'failed'
          )

          let result: TaskResult

          if (failedDep !== undefined) {
            const now = new Date().toISOString()
            result = {
              task_id:      task.id,
              status:       'failed',
              error:        `Skipped: dependency "${failedDep}" failed`,
              cost_used:    0,
              started_at:   now,
              completed_at: now,
            }
          } else {
            result = await executeTask(task, context)
          }

          // Persist — awaited, throws on DB error
          await saveTaskResult(execution_id, result, task.role)

          // ── Hook: task complete ──────────────────────────────────────────
          try { onTaskComplete?.(result) } catch { /* hook errors never propagate */ }

          return result
        })
      )

      // Commit batch to context after all saves + hooks complete
      for (const result of batchResults) {
        context.results.set(result.task_id, result)
        context.total_cost = roundCost(context.total_cost + result.cost_used)
      }

      remaining = stillPending
    }
  } catch (err: unknown) {
    // ── Hook: engine error ───────────────────────────────────────────────────
    const engineError = err instanceof Error ? err : new Error(String(err))
    try { onEngineError?.(engineError) } catch { /* never propagate */ }
    throw engineError  // re-throw so finally can still finalize
  } finally {
    // ── 3. Finalize — guaranteed regardless of outcome ────────────────────
    const finalStatus = deriveFinalStatus(context.results, aborted)
    await finalizeExecution(execution_id, finalStatus, context.total_cost)
  }

  return context
}

// ─────────────────────────────────────────────────────────────────────────────
// executePlanStreaming
// Thin wrapper around executePlan that wires a caller-supplied send function
// to the hook callbacks. The route uses this to emit SSE events without
// duplicating any engine logic.
//
// send() receives structured SSEEvent objects — the route serializes them.
// executePlanStreaming does not own the stream or the controller; it only
// drives the engine and fires send() at the right moments.
// ─────────────────────────────────────────────────────────────────────────────

export interface SSEEvent {
  type:       'start' | 'task_start' | 'task_complete' | 'task_error' | 'complete' | 'error' | 'aborted'
  plan_id?:   string
  task_id?:   string
  result?:    TaskResult
  error?:     string
  message?:   string
}

export async function executePlanStreaming(
  graph:   ExecutionGraph,
  plan:    ExecutionPlan,
  send:    (event: SSEEvent) => void,
): Promise<ExecutionContext> {
  return executePlan(graph, plan, {
    onTaskStart:    (task)   => send({ type: 'task_start',    task_id: task.id }),
    onTaskComplete: (result) => send({
      type:    result.status === 'complete' ? 'task_complete' : 'task_error',
      task_id: result.task_id,
      result,
      error:   result.error,
    }),
    onEngineError:  (err)    => send({
      type:    err.message === 'Execution aborted by user' ? 'aborted' : 'error',
      message: err.message,
    }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// roundCost — prevent IEEE 754 float accumulation drift
// ─────────────────────────────────────────────────────────────────────────────

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
