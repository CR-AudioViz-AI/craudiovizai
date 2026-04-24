// lib/javari/team/execution-engine.ts
// Javari TEAM Mode — Multi-Agent Execution Engine
// Consumes an ExecutionGraph from execution-contract.ts and runs tasks in
// topological order with maximum parallelism where dependencies allow.
// Stub runners simulate execution — AI dispatch wired in next layer.
// Created: April 24, 2026

import type {
  ExecutionGraph,
  TaskNode,
} from './execution-contract'

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
  plan_id:    string
  results:    Map<string, TaskResult>
  total_cost: number
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
  // Architect: decompose objective into an execution blueprint
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
  // Builder: implement the plan artifacts
  return {
    output: JSON.stringify({
      role:       'builder',
      task_id:    task.id,
      artifacts:  task.outputs.map(o => ({ name: o, status: 'generated' })),
      inputs_used: task.inputs,
      model_used:  task.model,
      note:        'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.9, task.max_cost),
  }
}

async function runTester(task: TaskNode): Promise<StubResult> {
  // Tester: validate artifacts from builder
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
  // Reviewer: audit outputs for correctness and safety
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
  // Deployer: ship artifacts to target environment
  return {
    output: JSON.stringify({
      role:       'deployer',
      task_id:    task.id,
      deployed:   task.inputs,
      environment: 'preview',
      sha:        `stub-${task.id}-${Date.now().toString(36)}`,
      model_used: task.model,
      note:       'Stub — AI dispatch pending',
    }),
    cost_used: Math.min(task.max_cost * 0.5, task.max_cost),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTask
// Dispatches a single task to its role-specific runner.
// Records timestamps, handles errors, returns a complete TaskResult.
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
// executePlan
// Executes all tasks in the graph using the topological order from the
// contract layer, running independent tasks in parallel via Promise.all.
//
// Concurrency model:
//   - Tasks are processed level by level in topological order.
//   - Within each level, tasks whose dependencies are all complete run in
//     parallel via Promise.all.
//   - A task is skipped (marked failed) if any of its dependencies failed.
//   - total_cost accumulates after each task regardless of status.
// ─────────────────────────────────────────────────────────────────────────────

export async function executePlan(graph: ExecutionGraph): Promise<ExecutionContext> {
  const { executionOrder, taskMap } = graph

  // Derive plan_id from the first task's id prefix — the contract layer
  // owns plan_id, but the engine receives only the graph. We reconstruct
  // a stable identifier from the ordered task list.
  const plan_id = `exec-${executionOrder[0] ?? 'empty'}-${Date.now().toString(36)}`

  const context: ExecutionContext = {
    plan_id,
    results:    new Map<string, TaskResult>(),
    total_cost: 0,
  }

  // Process tasks in topological order, but batch independent tasks together
  // for parallel execution.
  //
  // Strategy: scan executionOrder left to right. Accumulate tasks into a
  // "ready batch" as long as all their dependencies have already completed
  // successfully. Flush the batch via Promise.all, then continue.
  //
  // This produces the maximum parallelism the dependency graph allows while
  // preserving correctness — no task fires before its dependencies resolve.

  // Track which tasks have been dispatched to avoid double-dispatch
  const dispatched = new Set<string>()

  // We iterate until all tasks are dispatched
  let remaining = [...executionOrder]

  while (remaining.length > 0) {
    // Collect all tasks that are ready to run right now
    const readyBatch: TaskNode[] = []
    const stillPending: string[] = []

    for (const taskId of remaining) {
      const task = taskMap.get(taskId)
      if (!task) {
        // Should never happen — graph was validated — but defensive
        stillPending.push(taskId)
        continue
      }

      // Check if all dependencies have completed (success or recorded failure)
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
      // No progress possible — dependency deadlock (should be impossible after
      // cycle detection, but we guard against it defensively)
      const blocked = stillPending.join(', ')
      throw new Error(
        `executePlan: no tasks became ready — possible unresolved dependency deadlock. Blocked tasks: [${blocked}]`
      )
    }

    // Execute all ready tasks in parallel
    const batchResults = await Promise.all(
      readyBatch.map(async (task): Promise<TaskResult> => {
        // If any dependency failed, cascade-fail this task without running it
        const failedDep = task.dependencies.find(dep => {
          const depResult = context.results.get(dep)
          return depResult?.status === 'failed'
        })

        if (failedDep !== undefined) {
          const now = new Date().toISOString()
          return {
            task_id:      task.id,
            status:       'failed',
            error:        `Skipped: dependency "${failedDep}" failed`,
            cost_used:    0,
            started_at:   now,
            completed_at: now,
          }
        }

        return executeTask(task, context)
      })
    )

    // Commit batch results to context
    for (const result of batchResults) {
      context.results.set(result.task_id, result)
      context.total_cost = roundCost(context.total_cost + result.cost_used)
    }

    remaining = stillPending
  }

  return context
}

// ─────────────────────────────────────────────────────────────────────────────
// roundCost — prevent IEEE 754 float accumulation drift
// ─────────────────────────────────────────────────────────────────────────────

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
