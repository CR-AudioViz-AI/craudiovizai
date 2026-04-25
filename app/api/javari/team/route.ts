// app/api/javari/team/route.ts
// Javari TEAM Mode — Execution API Route
// POST /api/javari/team
//   Default: streams task execution as Server-Sent Events (text/event-stream)
//   ?stream=false: returns full JSON response (original behavior, preserved)
// Created: April 24, 2026
// Updated: April 24, 2026 — pass plan to executePlan; expose execution_id in response
// Updated: April 24, 2026 — SSE streaming via ReadableStream + executePlanStreaming
// Updated: April 24, 2026 — billing enforcement: auth gate, tier gate, credit pre-check, credit debit
// Updated: April 24, 2026 — Option A approval: pre-execution scan, 202 payload, approved flag passthrough

import { NextRequest, NextResponse } from 'next/server'
import { validateExecutionPlan, buildExecutionGraph, estimatePlanCost } from '@/lib/javari/team/execution-contract'
import type { ExecutionPlan } from '@/lib/javari/team/execution-contract'
import { executePlan, executePlanStreaming } from '@/lib/javari/team/execution-engine'
import type { TaskResult, SSEEvent }         from '@/lib/javari/team/execution-engine'
import { getAuthUser }                        from '@/lib/auth'
import { supabaseAdmin }                      from '@/lib/supabase'
import { shouldChargeCredits, ADMIN_EMAILS }  from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TASKS = 50

// Credits consumed per TEAM execution — a single credit represents one execution
// regardless of task count. Adjust per pricing tier if needed.
const CREDITS_PER_EXECUTION = 1

// Tier slugs that allow TEAM mode (must match subscription_plans.slug in DB)
const TEAM_ALLOWED_TIERS = new Set(['pro', 'business', 'enterprise'])

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

// Roles whose tool-runner mapping is high-risk
// Must stay in sync with ai-dispatcher.ts executeAgent routing
const HIGH_RISK_ROLES = new Set(['deployer', 'builder'])

// Returned as HTTP 202 when a plan contains high-risk tasks and approved=false
interface ApprovalPayload {
  status:        'requires_approval'
  tools:         ApprovalToolItem[]
  plan:          ExecutionPlan
}

interface ApprovalToolItem {
  taskId:      string
  role:        string
  description: string
  tool:        string
}

interface ErrorResponse {
  error:  string
  status: 'failed'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Scan a validated plan for tasks that will require tool approval.
// Returns the list of tool items needing approval, or empty array if none.
function scanForApprovals(plan: ExecutionPlan): ApprovalToolItem[] {
  const items: ApprovalToolItem[] = []
  const ROLE_TOOL_MAP: Record<string, string> = {
    deployer: 'vercel.deploy',
    builder:  'github.commit',
  }
  for (const task of plan.tasks) {
    if (HIGH_RISK_ROLES.has(task.role)) {
      items.push({
        taskId:      task.id,
        role:        task.role,
        description: `${task.role}: ${task.objective.slice(0, 120)}`,
        tool:        ROLE_TOOL_MAP[task.role] ?? task.role,
      })
    }
  }
  return items
}

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

function sseFrame(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

// ─────────────────────────────────────────────────────────────────────────────
// getUserBillingContext
// Resolves the authenticated user's tier + credit balance from Supabase.
// Returns null if user is not authenticated or has no billing record.
// Admin emails (Roy + Cindy) bypass all billing checks.
// ─────────────────────────────────────────────────────────────────────────────

interface BillingContext {
  userId:        string
  email:         string
  tier:          string          // subscription_plans.slug, e.g. 'free' | 'pro' | 'business' | 'enterprise'
  creditBalance: number          // user_credits.balance
  adminBypass:   boolean         // ADMIN_EMAILS bypass — no charges, no gates
}

async function getUserBillingContext(req: NextRequest): Promise<BillingContext | null> {
  const authUser = await getAuthUser(req)
  if (!authUser) return null

  const email       = authUser.email ?? ''
  const adminBypass = !shouldChargeCredits(email)

  // Fetch active subscription → plan slug
  const { data: subData } = await supabaseAdmin
    .from('subscriptions')
    .select('subscription_plans(slug)')
    .eq('user_id', authUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Cast through unknown to avoid TypeScript nested-select typing issues
  const planSlug = (subData as unknown as { subscription_plans?: { slug?: string } } | null)
    ?.subscription_plans?.slug ?? 'free'

  // Fetch credit balance
  const { data: creditData } = await supabaseAdmin
    .from('user_credits')
    .select('balance')
    .eq('user_id', authUser.id)
    .single()

  const creditBalance = (creditData as { balance?: number } | null)?.balance ?? 0

  return {
    userId:        authUser.id,
    email,
    tier:          planSlug,
    creditBalance,
    adminBypass,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// debitCredits
// Deducts CREDITS_PER_EXECUTION from the user's credit balance.
// Called after successful createExecution() — non-fatal if it fails
// (execution is already committed; debit failure is logged, not surfaced to user).
// A separate billing reconciliation job can catch missed debits.
// ─────────────────────────────────────────────────────────────────────────────

async function debitCredits(userId: string, amount: number): Promise<void> {
  // Use RPC or direct update — direct update is safe because getUserBillingContext
  // ran a pre-check and the window between check and debit is sub-second.
  const { error } = await supabaseAdmin.rpc('decrement_user_credits', {
    p_user_id: userId,
    p_amount:  amount,
  })

  if (error) {
    // Non-fatal — log but don't fail the execution. Reconcile separately.
    console.error(
      `[billing] debitCredits failed for user ${userId}: ${error.message} (code: ${error.code})`
    )
  }
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
  const contentLength = req.headers.get('content-length')
  if (contentLength === '0') {
    return { ok: false, response: errorResponse('Request body is required', 400) }
  }

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

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, response: errorResponse('Request body must be a JSON object', 400) }
  }

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
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  const url       = new URL(req.url)
  const streaming = url.searchParams.get('stream') !== 'false'

  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const billing = await getUserBillingContext(req)

  if (!billing) {
    return errorResponse('Authentication required to use TEAM execution', 401)
  }

  // ── 2. Tier gate — Free users cannot use TEAM mode ────────────────────────
  // Admin bypass skips all tier + credit checks.
  if (!billing.adminBypass) {
    if (!TEAM_ALLOWED_TIERS.has(billing.tier)) {
      return NextResponse.json(
        {
          error:    'TEAM mode requires a Pro plan or higher. Upgrade at craudiovizai.com/pricing.',
          status:   'failed',
          tier:     billing.tier,
          required: 'pro',
        },
        { status: 403 }
      )
    }

    // ── 3. Credit balance check ─────────────────────────────────────────────
    if (billing.creditBalance < CREDITS_PER_EXECUTION) {
      return NextResponse.json(
        {
          error:   `Insufficient credits. You have ${billing.creditBalance} credit${billing.creditBalance !== 1 ? 's' : ''} remaining. TEAM execution requires ${CREDITS_PER_EXECUTION}.`,
          status:  'failed',
          balance: billing.creditBalance,
          required: CREDITS_PER_EXECUTION,
        },
        { status: 403 }
      )
    }
  }

  // ── 4. Parse + validate plan ───────────────────────────────────────────────
  const parsed = await parseAndValidate(req)
  if (!parsed.ok) return parsed.response
  const { plan, graph } = parsed

  // ── 5. Pre-execution approval scan ────────────────────────────────────────
  // If the plan contains high-risk tool roles AND the caller hasn't explicitly
  // approved (req body field: approved=true), return 202 with approval payload.
  // Client shows the approval modal, then re-POSTs with approved=true to proceed.
  const approvedHeader = req.headers.get('x-javari-approved')
  let   callerApproved = approvedHeader === 'true'

  // Also check body for approved flag (set by UI re-POST)
  // We already consumed req.text() in parseAndValidate — read from plan metadata
  if ((plan as unknown as Record<string, unknown>)['approved'] === true) {
    callerApproved = true
  }

  if (!callerApproved) {
    const pendingTools = scanForApprovals(plan)
    if (pendingTools.length > 0) {
      return NextResponse.json<ApprovalPayload>(
        { status: 'requires_approval', tools: pendingTools, plan },
        { status: 202 }
      )
    }
  }

  // ── 6. Estimated cost sanity check (non-blocking warning in response) ──────
  const estimatedCost = estimatePlanCost(plan)

  // ── 7. JSON mode (original behavior) ──────────────────────────────────────
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

    // Debit credits after successful execution start (non-fatal)
    if (!billing.adminBypass) {
      await debitCredits(billing.userId, CREDITS_PER_EXECUTION)
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

  // ── 8. SSE streaming mode ──────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SSEEvent): void {
        try {
          controller.enqueue(new TextEncoder().encode(sseFrame(event)))
        } catch {
          // Client disconnected — non-fatal
        }
      }

      // Debit credits immediately when stream starts (execution has begun)
      if (!billing.adminBypass) {
        await debitCredits(billing.userId, CREDITS_PER_EXECUTION)
      }

      try {
        send({ type: 'start', plan_id: plan.plan_id })

        const context = await executePlanStreaming(graph, plan, send)

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
          estimated_cost: estimatedCost,
        })
      } catch (err: unknown) {
        send({
          type:    'error',
          message: err instanceof Error ? err.message : String(err),
        })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    status:  200,
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL function required for debitCredits (run in Supabase SQL editor)
// ─────────────────────────────────────────────────────────────────────────────
//
// create or replace function decrement_user_credits(
//   p_user_id uuid,
//   p_amount   integer
// ) returns void language plpgsql security definer as $$
// begin
//   update user_credits
//      set balance = greatest(balance - p_amount, 0),
//          lifetime_spent = lifetime_spent + p_amount,
//          updated_at = now()
//    where user_id = p_user_id;
// end;
// $$;
//
// Note: greatest(balance - amount, 0) prevents negative balances.
// The pre-check in getUserBillingContext ensures we only reach debitCredits
// when balance >= CREDITS_PER_EXECUTION. The floor is a safety net only.
