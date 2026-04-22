// app/api/internal/exec/route.ts
// Internal server-to-server execution endpoint.
// Secured by INTERNAL_API_SECRET — never expose this key publicly.
// Allows Claude, cron jobs, and multi-AI systems to execute privileged
// operations without browser tokens or user JWTs.
//
// AUTH:
//   GET  — ?secret=<INTERNAL_API_SECRET>  (Vercel MCP / Claude automation)
//   POST — X-Internal-Secret: <INTERNAL_API_SECRET> header (programmatic)
//
// SUPPORTED ACTIONS:
//   grant_credits   — insert positive usage_ledger row
//   get_balance     — return net credit balance for a user
//   list_ledger     — return last N ledger rows for a user
//   replay_webhook  — re-trigger a billing_event by stripe_event_id
//   get_user        — return profile + subscription + credit summary
//   credit_deduct   — insert negative usage_ledger row (floor-protected)
//   health          — liveness check
//
// Updated: April 22, 2026 — expanded from 4 ops to full automation surface

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// ── Supabase service role client ──────────────────────────────────────────────
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Stripe client ─────────────────────────────────────────────────────────────
function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

// ── Auth: GET uses ?secret= query param, POST uses X-Internal-Secret header ──
function verifyInternal(req: NextRequest): boolean {
  // POST path
  const header = req.headers.get('x-internal-secret')
  if (header) return header === process.env.INTERNAL_API_SECRET

  // GET path
  const param = req.nextUrl.searchParams.get('secret')
  return !!param && param === process.env.INTERNAL_API_SECRET
}

// ── Credit balance helper ─────────────────────────────────────────────────────
async function getBalance(supabase: ReturnType<typeof db>, userId: string) {
  const { data: rows, error } = await supabase
    .from('usage_ledger')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature', 'credits')
  if (error) throw new Error(`balance query failed: ${error.message}`)
  return (rows ?? []).reduce((s, r) => s + (r.usage_count ?? 0), 0)
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function handleGrantCredits(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { userId, credits: creditsStr, note } = params
  const credits = parseInt(creditsStr ?? '', 10)

  if (!userId) throw new Error('userId is required')
  if (isNaN(credits) || credits <= 0 || credits > 1_000_000)
    throw new Error('credits must be a positive integer (max 1,000,000)')

  const balance_before = await getBalance(supabase, userId)

  const { error } = await supabase.from('usage_ledger').insert({
    user_id:     userId,
    feature:     'credits',
    usage_count: credits,
    metadata: {
      type:   'grant',
      source: 'internal_exec',
      note:   note ?? null,
    },
  })
  if (error) throw new Error(error.message)

  const balance_after = balance_before + credits
  console.log('INTERNAL_EXEC grant_credits', { userId, credits, balance_before, balance_after })

  return {
    ok:             true,
    action:         'grant_credits',
    userId,
    granted:        credits,
    balance_before,
    balance_after,
  }
}

async function handleGetBalance(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { userId } = params
  if (!userId) throw new Error('userId is required')

  const balance = await getBalance(supabase, userId)
  console.log('INTERNAL_EXEC get_balance', { userId, balance })

  return { ok: true, action: 'get_balance', userId, balance }
}

async function handleListLedger(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { userId, limit: limitStr, feature } = params
  if (!userId) throw new Error('userId is required')
  const limit = Math.min(parseInt(limitStr ?? '20', 10), 200)

  let query = supabase
    .from('usage_ledger')
    .select('id, user_id, feature, usage_count, stripe_event_id, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (feature) query = query.eq('feature', feature)

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)

  const balance = (rows ?? [])
    .filter(r => r.feature === 'credits')
    .reduce((s, r) => s + (r.usage_count ?? 0), 0)

  console.log('INTERNAL_EXEC list_ledger', { userId, rows: rows?.length, balance })
  return { ok: true, action: 'list_ledger', userId, balance, count: rows?.length ?? 0, rows }
}

async function handleReplayWebhook(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { eventId } = params
  if (!eventId) throw new Error('eventId (Stripe event ID) is required')

  // 1. Look up the billing_event
  const { data: billingEvent, error: beErr } = await supabase
    .from('billing_events')
    .select('id, stripe_event_id, event_type, processed, payload, created_at')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (beErr) throw new Error(beErr.message)
  if (!billingEvent) throw new Error(`No billing_event found for stripe_event_id: ${eventId}`)

  // 2. Reset processed flag so webhook handler will re-process it
  const { error: resetErr } = await supabase
    .from('billing_events')
    .update({ processed: false })
    .eq('stripe_event_id', eventId)

  if (resetErr) throw new Error(`Failed to reset billing_event: ${resetErr.message}`)

  // 3. Trigger Stripe retry (test mode only — live mode doesn't support retry API)
  let stripeRetryResult: string = 'skipped'
  try {
    const s = stripe()
    await s.events.retrieve(eventId) // verify event exists in Stripe
    // Note: Stripe retry API only works in test mode
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      // @ts-expect-error — retry is not in all SDK type versions
      await (s.events as unknown as { retry: (id: string) => Promise<unknown> }).retry?.(eventId)
      stripeRetryResult = 'triggered'
    } else {
      stripeRetryResult = 'live_mode_manual_only'
    }
  } catch {
    stripeRetryResult = 'stripe_retry_unavailable'
  }

  console.log('INTERNAL_EXEC replay_webhook', {
    eventId,
    event_type: billingEvent.event_type,
    was_processed: billingEvent.processed,
    stripe_retry: stripeRetryResult,
  })

  return {
    ok:           true,
    action:       'replay_webhook',
    eventId,
    event_type:   billingEvent.event_type,
    was_processed: billingEvent.processed,
    reset_to:     false,
    stripe_retry: stripeRetryResult,
    message:      'billing_event.processed reset to false — webhook handler will re-process on next delivery',
  }
}

async function handleGetUser(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { userId, email } = params
  if (!userId && !email) throw new Error('userId or email is required')

  // 1. Resolve userId from email if needed
  let resolvedId = userId
  if (!resolvedId && email) {
    const { data: { users }, error: listErr } =
      await supabase.auth.admin.listUsers()
    if (listErr) throw new Error(listErr.message)
    const found = users.find(u => u.email === email)
    if (!found) throw new Error(`No user found with email: ${email}`)
    resolvedId = found.id
  }

  // 2. Auth user record
  const { data: { user: authUser }, error: authErr } =
    await supabase.auth.admin.getUserById(resolvedId!)
  if (authErr) throw new Error(authErr.message)

  // 3. Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedId)
    .maybeSingle()

  // 4. Subscription
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('plan_tier, status, current_period_end, provider_subscription_id')
    .eq('user_id', resolvedId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 5. Credit balance
  const balance = await getBalance(supabase, resolvedId!)

  // 6. Recent ledger (last 5)
  const { data: recentLedger } = await supabase
    .from('usage_ledger')
    .select('usage_count, feature, metadata, created_at')
    .eq('user_id', resolvedId)
    .eq('feature', 'credits')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('INTERNAL_EXEC get_user', {
    userId: resolvedId,
    email: authUser?.email,
    balance,
    plan: sub?.plan_tier ?? 'free',
  })

  return {
    ok:     true,
    action: 'get_user',
    user: {
      id:           authUser?.id,
      email:        authUser?.email,
      created_at:   authUser?.created_at,
      last_sign_in: authUser?.last_sign_in_at,
    },
    profile:        profile ?? null,
    subscription:   sub ?? null,
    credits: {
      balance,
      recent_ledger: recentLedger ?? [],
    },
  }
}

async function handleCreditDeduct(
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  const { userId, credits: creditsStr, note } = params
  const credits = parseInt(creditsStr ?? '', 10)

  if (!userId) throw new Error('userId is required')
  if (isNaN(credits) || credits <= 0) throw new Error('credits must be a positive integer')

  const balance_before = await getBalance(supabase, userId)
  if (balance_before - credits < 0) {
    return {
      ok:              false,
      action:          'credit_deduct',
      error:           'INSUFFICIENT_CREDITS',
      current_balance: balance_before,
      attempted:       credits,
    }
  }

  const { error } = await supabase.from('usage_ledger').insert({
    user_id:     userId,
    feature:     'credits',
    usage_count: -Math.abs(credits),
    metadata: {
      type:   'deduct',
      source: 'internal_exec',
      note:   note ?? null,
    },
  })
  if (error) throw new Error(error.message)

  const balance_after = balance_before - credits
  console.log('INTERNAL_EXEC credit_deduct', { userId, credits, balance_before, balance_after })

  return {
    ok:             true,
    action:         'credit_deduct',
    userId,
    deducted:       credits,
    balance_before,
    balance_after,
  }
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
async function dispatch(
  action: string,
  params: Record<string, string>,
  supabase: ReturnType<typeof db>,
) {
  switch (action) {
    case 'grant_credits':  return handleGrantCredits(params, supabase)
    case 'get_balance':    return handleGetBalance(params, supabase)
    case 'list_ledger':    return handleListLedger(params, supabase)
    case 'replay_webhook': return handleReplayWebhook(params, supabase)
    case 'get_user':       return handleGetUser(params, supabase)
    case 'credit_deduct':  return handleCreditDeduct(params, supabase)
    case 'health':         return { ok: true, action: 'health', ts: new Date().toISOString() }
    default:
      throw new Error(
        `Unknown action: "${action}". Valid: grant_credits, get_balance, list_ledger, ` +
        `replay_webhook, get_user, credit_deduct, health`
      )
  }
}

// ── GET /api/internal/exec?secret=...&action=...&... ─────────────────────────
// For Claude automation via Vercel MCP web_fetch_vercel_url
export async function GET(req: NextRequest) {
  if (!verifyInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params: Record<string, string> = {}
  req.nextUrl.searchParams.forEach((v, k) => { params[k] = v })

  const action = params.action
  if (!action) {
    return NextResponse.json({
      error: 'action is required',
      valid_actions: ['grant_credits','get_balance','list_ledger','replay_webhook','get_user','credit_deduct','health'],
    }, { status: 400 })
  }

  try {
    const result = await dispatch(action, params, db())
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[internal/exec] GET ${action} error:`, msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── POST /api/internal/exec  { action, ...params } ───────────────────────────
// For programmatic server-to-server calls with X-Internal-Secret header
export async function POST(req: NextRequest) {
  if (!verifyInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const action = (body.action ?? body.op) as string | undefined

    if (!action) {
      return NextResponse.json({
        error: 'action (or legacy op) is required',
        valid_actions: ['grant_credits','get_balance','list_ledger','replay_webhook','get_user','credit_deduct','health'],
      }, { status: 400 })
    }

    // Flatten body into string params for unified dispatch
    const params: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v !== null && v !== undefined) params[k] = String(v)
    }

    const result = await dispatch(action, params, db())
    return NextResponse.json(result)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[internal/exec] POST error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
