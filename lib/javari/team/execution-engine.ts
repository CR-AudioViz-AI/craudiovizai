// lib/javari/team/execution-engine.ts
// Javari TEAM Mode — Multi-Agent Execution Engine
// Consumes an ExecutionGraph from execution-contract.ts and runs tasks in
// topological order with maximum parallelism where dependencies allow.
// Stub runners simulate execution — AI dispatch wired in next layer.
// Created: April 24, 2026
// Updated: April 24, 2026 — persistence wired: createExecution, saveTaskResult, finalizeExecution

import type {
  ExecutionGraph,
  TaskNode,
} from './execution-contract'

import {
  createExecution,
  saveTaskResult,
  finalizeExecution,
} from './execution-store'

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
  results: Map<string, TaskResult>,
): 'complete' | 'partial' | 'failed' {
  const all     = [...results.values()]
  const total   = all.length
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
// Persistence contract:
//   1. createExecution() called once before any task fires — establishes
//      the DB record with status 'running'.
//   2. saveTaskResult() called for every task immediately after it settles —
//      both success and failure paths. Never skipped.
//   3. finalizeExecution() called in finally — guaranteed to run even if the
//      engine throws (deadlock guard, DB error, etc.).
//
// Concurrency model (unchanged from v1):
//   - Scan remaining tasks each pass; collect all whose deps are settled.
//   - Execute ready batch via Promise.all.
//   - Cascade-fail tasks whose dependencies failed.
//   - Accumulate total_cost after each batch.
// ─────────────────────────────────────────────────────────────────────────────

export async function executePlan(
  graph: ExecutionGraph,
  plan:  ExecutionPlan,
): Promise<ExecutionContext> {
  const { executionOrder, taskMap } = graph

  // ── 1. Create DB record — establishes execution_id before any work starts ──
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

  // ── 2. Wrap execution loop in try/finally — finalizeExecution always runs ──
  try {
    while (remaining.length > 0) {
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

      // Execute all ready tasks in parallel, persist each result immediately
      const batchResults = await Promise.all(
        readyBatch.map(async (task): Promise<TaskResult> => {
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

          // ── 3. Persist task result — awaited, throws on DB error ───────────
          await saveTaskResult(execution_id, result, task.role)

          return result
        })
      )

      // Commit batch to context after all saves complete
      for (const result of batchResults) {
        context.results.set(result.task_id, result)
        context.total_cost = roundCost(context.total_cost + result.cost_used)
      }

      remaining = stillPending
    }
  } finally {
    // ── 4. Finalize — runs regardless of success, failure, or thrown error ───
    const finalStatus = deriveFinalStatus(context.results)
    await finalizeExecution(execution_id, finalStatus, context.total_cost)
  }

  return context
}

// ─────────────────────────────────────────────────────────────────────────────
// roundCost — prevent IEEE 754 float accumulation drift
// ─────────────────────────────────────────────────────────────────────────────

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
