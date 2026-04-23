// app/api/javari/execute/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Javari execution endpoint — wires lib/javari/router.ts into a live API call.
// Accepts natural-language input, classifies intent, dispatches automatically:
//   billing intent    → executes via /api/internal/exec (no browser token)
//   AI intent         → returns selected model + intent for caller to invoke
//   multi_ai_plan     → returns team plan + cost for caller approval
//
// Auth: X-Internal-Secret header OR public (if JAVARI_EXECUTE_PUBLIC=true).
//   Default: requires X-Internal-Secret — server-to-server only.
//   To allow Javari frontend to call: set JAVARI_EXECUTE_PUBLIC=true in Vercel.
//
// POST { input, context?, mode? }
//   input:   natural language command (e.g. "check balance for user abc")
//   mode:    'auto' (default) | 'team'
//   context: {
//     userId?,      — target user for billing ops
//     teamConfig?,  — required when mode === 'team'
//     baseUrl?
//   }
//
// Updated: April 23, 2026 — mode param, teamConfig, multi_ai_plan response
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import {
  route,
  type BillingIntent,
  type AIIntent,
  type ExecResult,
  type ModelTier,
  type TeamConfig,
  type MultiAIPlan,
  type ExecutionMode,
  type RouteContext,
} from '@/lib/javari/router'

export const dynamic    = 'force-dynamic'
export const runtime    = 'nodejs'
export const maxDuration = 30

// ── Auth ──────────────────────────────────────────────────────────────────────
// Requires X-Internal-Secret by default.
// Set JAVARI_EXECUTE_PUBLIC=true to allow unauthenticated calls (for Javari UI).
function isAuthorized(req: NextRequest): boolean {
  const isPublic = process.env.JAVARI_EXECUTE_PUBLIC === 'true'
  if (isPublic) return true

  const secret = req.headers.get('x-internal-secret')
  return !!secret && secret === process.env.INTERNAL_API_SECRET
}

// ── Response shapes ───────────────────────────────────────────────────────────
interface BillingResponse {
  ok:         boolean
  type:       'billing'
  intent:     BillingIntent
  executed:   boolean
  result:     ExecResult
  input_echo: string
  mode:       'auto'
  ts:         string
}

interface AIResponse {
  ok:         boolean
  type:       'ai'
  intent:     AIIntent | 'unknown'
  model:      ModelTier
  executed:   boolean   // always false — AI intents return model selection only
  message:    string
  input_echo: string
  mode:       'auto'
  ts:         string
}

interface TeamPlanResponse {
  ok:                boolean
  type:              'team'
  intent:            AIIntent | 'unknown'
  plan:              MultiAIPlan
  requires_approval: true
  input_echo:        string
  mode:              'team'
  ts:                string
}

// ── POST /api/javari/execute ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let input:   string
  let context: RouteContext | undefined
  let mode:    ExecutionMode

  try {
    const body = await req.json() as {
      input?:   unknown
      context?: unknown
      mode?:    unknown
    }

    if (!body.input || typeof body.input !== 'string' || body.input.trim() === '') {
      return NextResponse.json(
        { error: 'input is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // mode defaults to 'auto' — backward compatible with all existing callers
    const rawMode = body.mode
    if (rawMode !== undefined && rawMode !== 'auto' && rawMode !== 'team') {
      return NextResponse.json(
        { error: "mode must be 'auto' or 'team'" },
        { status: 400 }
      )
    }
    mode  = (rawMode as ExecutionMode) ?? 'auto'
    input = body.input.trim()

    // Build RouteContext — include teamConfig when present
    if (typeof body.context === 'object' && body.context !== null) {
      const raw = body.context as Record<string, unknown>
      context = {
        userId:     typeof raw.userId     === 'string' ? raw.userId     : undefined,
        baseUrl:    typeof raw.baseUrl    === 'string' ? raw.baseUrl    : undefined,
        teamConfig: typeof raw.teamConfig === 'object' && raw.teamConfig !== null
          ? raw.teamConfig as TeamConfig
          : undefined,
      }
    }

  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Guard: team mode requires teamConfig
  if (mode === 'team' && !context?.teamConfig) {
    return NextResponse.json(
      { error: "mode 'team' requires context.teamConfig to be set" },
      { status: 400 }
    )
  }

  const ts = new Date().toISOString()

  try {
    const routeResult = await route(input, context, mode)

    // Log every execution with mode + type + intent
    console.log('JAVARI EXECUTE MODE', {
      mode,
      intent: routeResult.intent,
      type:   routeResult.type,
    })

    // ── Billing intent — already executed by route() ──────────────────────────
    if (routeResult.type === 'billing') {
      const response: BillingResponse = {
        ok:         routeResult.result.ok,
        type:       'billing',
        intent:     routeResult.intent,
        executed:   true,
        result:     routeResult.result,
        input_echo: input.slice(0, 120),
        mode:       'auto',
        ts,
      }

      console.log('JAVARI EXECUTE', {
        type:   'billing',
        intent: routeResult.intent,
        ok:     routeResult.result.ok,
        userId: context?.userId?.slice(0, 8),
        input:  input.slice(0, 60),
      })

      return NextResponse.json(response)
    }

    // ── Multi-AI team plan — return for approval, do NOT execute ─────────────
    if (routeResult.type === 'multi_ai_plan') {
      const response: TeamPlanResponse = {
        ok:                true,
        type:              'team',
        intent:            routeResult.intent,
        plan:              routeResult.plan,
        requires_approval: true,
        input_echo:        input.slice(0, 120),
        mode:              'team',
        ts,
      }

      console.log('JAVARI EXECUTE', {
        type:           'team',
        intent:         routeResult.intent,
        role_count:     routeResult.plan.role_count,
        estimated_cost: routeResult.plan.estimated_cost,
        input:          input.slice(0, 60),
      })

      return NextResponse.json(response)
    }

    // ── AI intent — return model selection, no execution yet ─────────────────
    const response: AIResponse = {
      ok:         true,
      type:       'ai',
      intent:     routeResult.intent,
      model:      routeResult.model,
      executed:   false,
      message:    `Intent classified as "${routeResult.intent}". ` +
                  `Selected model: ${routeResult.model}. ` +
                  `Call /api/javari/chat with model=${routeResult.model} to execute.`,
      input_echo: input.slice(0, 120),
      mode:       'auto',
      ts,
    }

    console.log('JAVARI EXECUTE', {
      type:   'ai',
      intent: routeResult.intent,
      model:  routeResult.model,
      input:  input.slice(0, 60),
    })

    return NextResponse.json(response)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[javari/execute] error:', {
      mode,
      input: input.slice(0, 60),
      error: msg,
    })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
