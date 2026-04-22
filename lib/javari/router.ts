// lib/javari/router.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Javari AI intent router — classifies requests and dispatches.
// DO NOT CALL DIRECTLY from client components — import and use route() or
//   dispatchBillingIntent() from server-side context only.
// BILLING: All billing intents route to /api/internal/exec (no browser token).
// AI:      All generation intents return a model tier for the caller to invoke.
// COST LAW: gpt-4o-mini (free) → claude-haiku (low) → claude-sonnet (moderate)
// Updated: April 22, 2026 — billing intent routing to internal exec layer
// ─────────────────────────────────────────────────────────────────────────────

export type BillingIntent =
  | 'grant_credits'
  | 'deduct_credits'
  | 'get_balance'
  | 'list_ledger'
  | 'get_user'
  | 'replay_webhook'
  | 'health_check'

export type AIIntent =
  | 'chat'
  | 'forge'
  | 'team'
  | 'image'
  | 'audio'
  | 'code'

export type RouterIntent = BillingIntent | AIIntent | 'unknown'

// ── Intent classification ─────────────────────────────────────────────────────
const BILLING_KEYWORDS: Record<BillingIntent, string[]> = {
  grant_credits:    ['grant', 'add credits', 'give credits', 'top up', 'topup', 'credit grant'],
  deduct_credits:   ['deduct', 'remove credits', 'charge credits', 'consume credits'],
  get_balance:      ['balance', 'how many credits', 'credit count', 'check credits'],
  list_ledger:      ['ledger', 'credit history', 'transaction history', 'credit log'],
  get_user:         ['user info', 'user profile', 'lookup user', 'find user', 'user details'],
  replay_webhook:   ['replay', 'retry webhook', 'reprocess event', 'replay event'],
  health_check:     ['health', 'ping', 'status check', 'is running'],
}

export function classifyIntent(input: string): RouterIntent {
  const lower = input.toLowerCase()
  for (const [intent, keywords] of Object.entries(BILLING_KEYWORDS) as [BillingIntent, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) return intent
  }
  return 'unknown'
}

// ── Exec layer client ─────────────────────────────────────────────────────────
// All billing operations route through /api/internal/exec.
// Uses INTERNAL_API_SECRET — never requires a browser JWT.

export interface ExecParams {
  action:   string
  userId?:  string
  credits?: number
  eventId?: string
  email?:   string
  limit?:   number
  note?:    string
}

export interface ExecResult {
  ok:         boolean
  action:     string
  error?:     string
  [key: string]: unknown
}

export async function callExec(
  params:  ExecParams,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://craudiovizai.com',
): Promise<ExecResult> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) throw new Error('INTERNAL_API_SECRET not configured')

  // Build query string — filter out undefined values
  const qs = new URLSearchParams()
  qs.set('secret', secret)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }

  const url = `${baseUrl}/api/internal/exec?${qs.toString()}`

  const res  = await fetch(url, { method: 'GET' })
  const json = await res.json() as ExecResult

  console.log('JAVARI_ROUTER exec', {
    action:  params.action,
    ok:      json.ok,
    status:  res.status,
  })

  return json
}

// ── Billing intent dispatch ───────────────────────────────────────────────────
// Maps a parsed billing intent + extracted params to an exec action.
// Called by Javari AI when it identifies a billing-related request.

export async function dispatchBillingIntent(
  intent:  BillingIntent,
  params:  Omit<ExecParams, 'action'>,
  baseUrl?: string,
): Promise<ExecResult> {
  const actionMap: Record<BillingIntent, string> = {
    grant_credits:  'grant_credits',
    deduct_credits: 'credit_deduct',
    get_balance:    'get_balance',
    list_ledger:    'list_ledger',
    get_user:       'get_user',
    replay_webhook: 'replay_webhook',
    health_check:   'health',
  }

  const action = actionMap[intent]
  console.log('JAVARI_ROUTER dispatch_billing', { intent, action, userId: params.userId?.slice(0, 8) })
  return callExec({ action, ...params }, baseUrl)
}

// ── Model tier selection for AI intents ───────────────────────────────────────
// COST LAW: Free → Low (5x) → Moderate (4x) → Expensive (3x)
// Never escalate without exhausting the lower tier first.

export type ModelTier = 'gpt-4o-mini' | 'claude-haiku' | 'claude-sonnet'

const AI_INTENT_TIERS: Record<AIIntent, ModelTier> = {
  chat:  'gpt-4o-mini',
  forge: 'gpt-4o-mini',
  team:  'gpt-4o-mini',
  image: 'gpt-4o-mini',
  audio: 'gpt-4o-mini',
  code:  'claude-haiku',   // code tasks benefit from Haiku's reasoning
}

export function selectModel(intent: AIIntent): ModelTier {
  return AI_INTENT_TIERS[intent] ?? 'gpt-4o-mini'
}

// ── Main router ───────────────────────────────────────────────────────────────
// Entry point for all Javari requests. Returns either:
//   { type: 'billing', result: ExecResult }  — billing op executed server-side
//   { type: 'ai', model: ModelTier }          — AI model selected for generation

export async function route(
  input:    string,
  context?: { userId?: string; baseUrl?: string },
): Promise<
  | { type: 'billing'; intent: BillingIntent; result: ExecResult }
  | { type: 'ai'; intent: AIIntent | 'unknown'; model: ModelTier }
> {
  const intent = classifyIntent(input)

  // Billing intent — execute immediately via internal exec layer
  if (intent !== 'unknown' && intent in BILLING_KEYWORDS) {
    const billingIntent = intent as BillingIntent
    const result = await dispatchBillingIntent(
      billingIntent,
      { userId: context?.userId, note: `javari_router: ${input.slice(0, 60)}` },
      context?.baseUrl,
    )
    return { type: 'billing', intent: billingIntent, result }
  }

  // AI intent — select model tier
  const aiIntent = intent as AIIntent | 'unknown'
  const model    = selectModel(aiIntent === 'unknown' ? 'chat' : aiIntent)
  console.log('JAVARI_ROUTER ai_dispatch', { intent: aiIntent, model })
  return { type: 'ai', intent: aiIntent, model }
}
