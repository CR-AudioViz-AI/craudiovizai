// app/api/javari/autonomy/route.ts
// Javari Autonomy Execution Loop
// POST /api/javari/autonomy  → runs one bounded execution cycle
//
// Architecture: each POST invocation processes up to maxTasksPerRun queued tasks,
// stores results, and queues follow-up tasks. State persists in Supabase between
// invocations — no Lambda needs to stay alive. Trigger via cron, UI run-loop button,
// or manual POST. This is safe for serverless — no while(true) inside a Lambda.
//
// Safety limits (enforced before any execution):
//   - maxTasksPerRun   = 10   hard cap per invocation
//   - maxCostPerRun    = $0.10 (10 cents) — accumulated cost ceiling
//   - invocationTimeoutMs = 50s (leaves 10s buffer below Vercel's 60s limit)
//
// Billing: re-uses the same getUserBillingContext + debitCredits from team/route.ts.
//   Every task drawn from the queue costs 1 credit. Free users blocked.
//   Admin bypass (Roy + Cindy) skips all billing checks.
//
// Approval: high-risk tools are NEVER auto-approved in autonomy mode.
//   The route inspects each task plan for high-risk roles and skips them,
//   recording a 'pending_approval' status in the task queue row.
//   A human must approve those tasks manually via the approval modal.
//
// Created: April 24, 2026

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'
import { getAuthUser }               from '@/lib/auth'
import { shouldChargeCredits }       from '@/lib/supabase'
import { validateExecutionPlan, buildExecutionGraph } from '@/lib/javari/team/execution-contract'
import { executePlan }               from '@/lib/javari/team/execution-engine'
import type { TaskResult }           from '@/lib/javari/team/execution-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────────
// Safety constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TASKS_PER_RUN     = 10
const MAX_COST_PER_RUN      = 0.10        // USD — hard stop when exceeded
const INVOCATION_TIMEOUT_MS = 50_000      // 50s — buffer below Vercel's Lambda limit
const CREDITS_PER_TASK      = 1
const TABLE_QUEUE           = 'javari_autonomy_tasks'

// Roles that map to high-risk tools — never auto-approved in autonomy mode
const HIGH_RISK_ROLES       = new Set(['deployer', 'builder'])

// ─────────────────────────────────────────────────────────────────────────────
// Queue row type
// ─────────────────────────────────────────────────────────────────────────────

interface QueueTask {
  id:           string
  plan:         unknown          // full ExecutionPlan JSON
  status:       'pending' | 'running' | 'complete' | 'failed' | 'pending_approval' | 'skipped'
  priority:     number           // lower = higher priority
  cost_used:    number
  error:        string | null
  created_at:   string
  updated_at:   string
  parent_id:    string | null    // references the task that generated this follow-up
  user_id:      string
}

// ─────────────────────────────────────────────────────────────────────────────
// Response types
// ─────────────────────────────────────────────────────────────────────────────

interface CycleResult {
  tasks_processed:  number
  tasks_succeeded:  number
  tasks_failed:     number
  tasks_skipped:    number       // high-risk, pending approval
  follow_ups_queued: number
  total_cost:       number
  stopped_reason:   'no_tasks' | 'max_tasks' | 'max_cost' | 'timeout' | 'abort'
  execution_ids:    string[]
}

interface ErrorResponse {
  error:  string
  status: 'failed'
}

function errorResponse(message: string, httpStatus: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message, status: 'failed' as const }, { status: httpStatus })
}

// ─────────────────────────────────────────────────────────────────────────────
// getNextTask
// Claims the highest-priority pending task for this user atomically.
// Uses Supabase row-level update to prevent double-claiming across concurrent
// invocations. Returns null if no tasks are pending.
// ─────────────────────────────────────────────────────────────────────────────

async function getNextTask(userId: string): Promise<QueueTask | null> {
  // Select the next pending task
  const { data: candidates } = await supabaseAdmin
    .from(TABLE_QUEUE)
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)

  if (!candidates || candidates.length === 0) return null

  const taskId = (candidates[0] as { id: string }).id

  // Atomically claim it by updating status to 'running'
  const { data: claimed, error } = await supabaseAdmin
    .from(TABLE_QUEUE)
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('status', 'pending')   // optimistic lock — only succeeds if still pending
    .select('*')
    .single()

  if (error || !claimed) return null   // another invocation claimed it first

  return claimed as QueueTask
}

// ─────────────────────────────────────────────────────────────────────────────
// storeResult
// Updates the queue row with the outcome of execution.
// ─────────────────────────────────────────────────────────────────────────────

async function storeResult(
  taskId:     string,
  status:     QueueTask['status'],
  costUsed:   number,
  error?:     string,
): Promise<void> {
  await supabaseAdmin
    .from(TABLE_QUEUE)
    .update({
      status,
      cost_used:  costUsed,
      error:      error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
}

// ─────────────────────────────────────────────────────────────────────────────
// generateFollowUps
// Inspects task results to decide what to queue next.
// Currently: if a task partially succeeded, queue retries for failed sub-tasks.
// Replace with AI-generated follow-up logic when real model dispatch is wired.
// ─────────────────────────────────────────────────────────────────────────────

function generateFollowUps(
  results:    TaskResult[],
  parentId:   string,
  userId:     string,
  parentPlan: unknown,
): unknown[] {
  const failed = results.filter(r => r.status === 'failed' && !r.error?.includes('aborted'))
  if (failed.length === 0) return []

  // Generate one follow-up plan per failed task (simple retry with error context)
  return failed.map(f => ({
    user_id:    userId,
    parent_id:  parentId,
    priority:   5,           // medium priority follow-ups
    status:     'pending',
    cost_used:  0,
    error:      null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    plan: JSON.stringify({
      plan_id:   `followup-${f.task_id}-${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
      total_estimated_cost: 0.002,
      tasks: [{
        id:           `${f.task_id}-followup`,
        role:         f.task_id.includes('architect') ? 'architect'
                    : f.task_id.includes('builder')   ? 'builder'
                    : f.task_id.includes('reviewer')  ? 'reviewer'
                    : f.task_id.includes('deployer')  ? 'deployer'
                    : 'architect',   // default to architect for unknown roles
        objective:    `Retry after failure: ${(f.error ?? 'unknown error').slice(0, 200)}`,
        inputs:       [],
        outputs:      [],
        dependencies: [],
        model:        'gpt-4o-mini',
        max_cost:     0.002,
        status:       'pending',
      }],
      // Reference to parent for context
      _parent_plan: parentPlan,
    }),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// queueTasks
// Inserts follow-up tasks into the queue. Non-fatal if it fails.
// ─────────────────────────────────────────────────────────────────────────────

async function queueTasks(tasks: unknown[]): Promise<number> {
  if (tasks.length === 0) return 0
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_QUEUE)
      .insert(tasks)
      .select('id')
    if (error) {
      console.error('[autonomy] queueTasks failed:', error.message)
      return 0
    }
    return (data as unknown[]).length
  } catch (err) {
    console.error('[autonomy] queueTasks threw:', err)
    return 0
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// debitCredit
// Deducts CREDITS_PER_TASK from the user's balance via Supabase RPC.
// Non-fatal on error — logs but does not block execution.
// ─────────────────────────────────────────────────────────────────────────────

async function debitCredit(userId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('decrement_user_credits', {
      p_user_id: userId,
      p_amount:  CREDITS_PER_TASK,
    })
    if (error) console.error(`[autonomy] debitCredit failed for ${userId}: ${error.message}`)
  } catch (err) {
    console.error('[autonomy] debitCredit threw:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/javari/autonomy
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  const cycleStart = Date.now()

  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const authUser = await getAuthUser(req)
  if (!authUser) return errorResponse('Authentication required', 401)

  const email        = authUser.email ?? ''
  const adminBypass  = !shouldChargeCredits(email)

  // ── 2. Billing gate — Free users blocked ──────────────────────────────────
  if (!adminBypass) {
    const { data: subData } = await supabaseAdmin
      .from('subscriptions')
      .select('subscription_plans(slug)')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const tier = (subData as unknown as { subscription_plans?: { slug?: string } } | null)
      ?.subscription_plans?.slug ?? 'free'

    if (tier === 'free') {
      return errorResponse('Autonomy mode requires Pro plan or higher', 403)
    }

    // Credit balance check — need at least 1 credit to start
    const { data: creditData } = await supabaseAdmin
      .from('user_credits')
      .select('balance')
      .eq('user_id', authUser.id)
      .single()

    const balance = (creditData as { balance?: number } | null)?.balance ?? 0
    if (balance < CREDITS_PER_TASK) {
      return errorResponse(`Insufficient credits (balance: ${balance})`, 403)
    }
  }

  // ── 3. Parse optional body config ─────────────────────────────────────────
  let maxTasksPerRun = MAX_TASKS_PER_RUN
  let maxCostPerRun  = MAX_COST_PER_RUN

  try {
    const text = await req.text()
    if (text?.trim()) {
      const body = JSON.parse(text) as Record<string, unknown>
      if (typeof body.maxTasksPerRun === 'number') {
        maxTasksPerRun = Math.min(body.maxTasksPerRun, MAX_TASKS_PER_RUN)
      }
      if (typeof body.maxCostPerRun === 'number') {
        maxCostPerRun = Math.min(body.maxCostPerRun, MAX_COST_PER_RUN)
      }
    }
  } catch { /* empty body or invalid JSON — use defaults */ }

  // ── 4. Execution cycle ─────────────────────────────────────────────────────
  const cycleResult: CycleResult = {
    tasks_processed:   0,
    tasks_succeeded:   0,
    tasks_failed:      0,
    tasks_skipped:     0,
    follow_ups_queued: 0,
    total_cost:        0,
    stopped_reason:    'no_tasks',
    execution_ids:     [],
  }

  while (true) {
    // ── Timeout guard ────────────────────────────────────────────────────────
    if (Date.now() - cycleStart > INVOCATION_TIMEOUT_MS) {
      cycleResult.stopped_reason = 'timeout'
      break
    }

    // ── Task limit ────────────────────────────────────────────────────────────
    if (cycleResult.tasks_processed >= maxTasksPerRun) {
      cycleResult.stopped_reason = 'max_tasks'
      break
    }

    // ── Cost limit ────────────────────────────────────────────────────────────
    if (cycleResult.total_cost >= maxCostPerRun) {
      cycleResult.stopped_reason = 'max_cost'
      break
    }

    // ── Get next task ─────────────────────────────────────────────────────────
    const queueTask = await getNextTask(authUser.id)
    if (!queueTask) {
      cycleResult.stopped_reason = 'no_tasks'
      break
    }

    cycleResult.tasks_processed++

    // ── Parse plan from queue row ─────────────────────────────────────────────
    let planRaw: unknown
    try {
      planRaw = typeof queueTask.plan === 'string'
        ? JSON.parse(queueTask.plan)
        : queueTask.plan
    } catch {
      await storeResult(queueTask.id, 'failed', 0, 'Invalid plan JSON in queue row')
      cycleResult.tasks_failed++
      continue
    }

    // ── Validate plan ─────────────────────────────────────────────────────────
    let plan: ReturnType<typeof validateExecutionPlan>
    let graph: ReturnType<typeof buildExecutionGraph>
    try {
      plan  = validateExecutionPlan(planRaw)
      graph = buildExecutionGraph(plan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await storeResult(queueTask.id, 'failed', 0, `Plan validation failed: ${msg}`)
      cycleResult.tasks_failed++
      continue
    }

    // ── High-risk approval gate — skip and mark pending_approval ─────────────
    const highRiskTasks = plan.tasks.filter(t => HIGH_RISK_ROLES.has(t.role))
    if (highRiskTasks.length > 0) {
      const roleList = highRiskTasks.map(t => t.role).join(', ')
      await storeResult(
        queueTask.id,
        'pending_approval',
        0,
        `Contains high-risk tools (${roleList}) — manual approval required`
      )
      cycleResult.tasks_skipped++
      continue
    }

    // ── Credit check per task ─────────────────────────────────────────────────
    if (!adminBypass) {
      const { data: cd } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', authUser.id)
        .single()
      const bal = (cd as { balance?: number } | null)?.balance ?? 0
      if (bal < CREDITS_PER_TASK) {
        await storeResult(queueTask.id, 'failed', 0, 'Insufficient credits')
        cycleResult.stopped_reason = 'abort'
        break
      }
      await debitCredit(authUser.id)
    }

    // ── Execute plan ──────────────────────────────────────────────────────────
    let context: Awaited<ReturnType<typeof executePlan>>
    try {
      context = await executePlan(graph, plan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await storeResult(queueTask.id, 'failed', 0, `Engine error: ${msg}`)
      cycleResult.tasks_failed++
      continue
    }

    // ── Store result ──────────────────────────────────────────────────────────
    const resultsArray: TaskResult[] = graph.executionOrder
      .map(id => context.results.get(id))
      .filter((r): r is TaskResult => r !== undefined)

    const allSucceeded = resultsArray.every(r => r.status === 'complete')
    const finalStatus  = allSucceeded ? 'complete' : 'failed'

    await storeResult(queueTask.id, finalStatus, context.total_cost)
    cycleResult.execution_ids.push(context.execution_id)
    cycleResult.total_cost = Math.round(
      (cycleResult.total_cost + context.total_cost) * 1_000_000
    ) / 1_000_000

    if (allSucceeded) {
      cycleResult.tasks_succeeded++
    } else {
      cycleResult.tasks_failed++
    }

    // ── Generate and queue follow-ups ─────────────────────────────────────────
    const followUps = generateFollowUps(resultsArray, queueTask.id, authUser.id, planRaw)
    const queued    = await queueTasks(followUps)
    cycleResult.follow_ups_queued += queued
  }

  return NextResponse.json(cycleResult, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/javari/autonomy
// Returns queue status for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  const authUser = await getAuthUser(req)
  if (!authUser) return errorResponse('Authentication required', 401)

  const { data, error } = await supabaseAdmin
    .from(TABLE_QUEUE)
    .select('id, status, priority, cost_used, error, created_at, updated_at, parent_id')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return errorResponse(`Failed to fetch queue: ${error.message}`, 500)

  const rows = (data ?? []) as Partial<QueueTask>[]
  const counts = {
    pending:          rows.filter(r => r.status === 'pending').length,
    running:          rows.filter(r => r.status === 'running').length,
    complete:         rows.filter(r => r.status === 'complete').length,
    failed:           rows.filter(r => r.status === 'failed').length,
    pending_approval: rows.filter(r => r.status === 'pending_approval').length,
  }

  return NextResponse.json({ tasks: rows, counts }, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL migration reference (run in Supabase SQL editor on kteobfyferrukqeolofj)
// ─────────────────────────────────────────────────────────────────────────────
//
// create table if not exists javari_autonomy_tasks (
//   id           uuid primary key default gen_random_uuid(),
//   user_id      uuid not null references auth.users(id) on delete cascade,
//   parent_id    uuid references javari_autonomy_tasks(id) on delete set null,
//   plan         jsonb not null,
//   status       text not null default 'pending'
//                check (status in ('pending','running','complete','failed','pending_approval','skipped')),
//   priority     integer not null default 5,
//   cost_used    numeric not null default 0,
//   error        text,
//   created_at   timestamptz not null default now(),
//   updated_at   timestamptz not null default now()
// );
//
// create index if not exists idx_autonomy_tasks_user_status
//   on javari_autonomy_tasks(user_id, status, priority, created_at);
//
// create trigger update_autonomy_tasks_updated_at
//   before update on javari_autonomy_tasks
//   for each row execute function update_updated_at_column();
//
// -- Optional: seed an initial task for testing
// -- insert into javari_autonomy_tasks (user_id, plan, priority) values (
// --   '<your-user-uuid>',
// --   '{"plan_id":"auto-001","created_at":"now","total_estimated_cost":0.001,"tasks":[{"id":"t1","role":"architect","objective":"Audit the platform and identify top 3 improvements","inputs":[],"outputs":["audit"],"dependencies":[],"model":"gpt-4o-mini","max_cost":0.001,"status":"pending"}]}',
// --   1
// -- );
