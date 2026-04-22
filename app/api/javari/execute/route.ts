// app/api/javari/execute/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Javari execution endpoint — wires lib/javari/router.ts into a live API call.
// Accepts natural-language input, classifies intent, dispatches automatically:
//   billing intent → executes via /api/internal/exec (no browser token needed)
//   AI intent      → returns selected model + intent for caller to invoke
//
// Auth: X-Internal-Secret header OR public (if JAVARI_EXECUTE_PUBLIC=true).
//   Default: requires X-Internal-Secret — server-to-server only.
//   To allow Javari frontend to call: set JAVARI_EXECUTE_PUBLIC=true in Vercel.
//
// POST { input, context? }
//   input:   natural language command (e.g. "check balance for user abc")
//   context: { userId?, email?, credits?, eventId?, baseUrl? }
//
// Updated: April 22, 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import {
  route,
  type BillingIntent,
  type AIIntent,
  type ExecResult,
  type ModelTier,
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
  ts:         string
}

interface AIResponse {
  ok:         boolean
  type:       'ai'
  intent:     AIIntent | 'unknown'
  model:      ModelTier
  executed:   boolean     // always false — AI intents return model selection only
  message:    string
  input_echo: string
  ts:         string
}

// ── POST /api/javari/execute ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let input: string
  let context: {
    userId?:  string
    email?:   string
    credits?: number
    eventId?: string
    limit?:   number
    note?:    string
    baseUrl?: string
  } | undefined

  try {
    const body = await req.json() as { input?: unknown; context?: unknown }

    if (!body.input || typeof body.input !== 'string' || body.input.trim() === '') {
      return NextResponse.json(
        { error: 'input is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    input   = body.input.trim()
    context = typeof body.context === 'object' && body.context !== null
      ? body.context as typeof context
      : undefined

  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const ts = new Date().toISOString()

  try {
    const routeResult = await route(input, {
      userId:  context?.userId,
      baseUrl: context?.baseUrl,
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
      input: input.slice(0, 60),
      error: msg,
    })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
