// lib/javari/router.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Javari AI intent router — classifies requests and dispatches.
// DO NOT CALL DIRECTLY from client components — import and use route() or
//   dispatchBillingIntent() from server-side context only.
// BILLING: All billing intents route to /api/internal/exec (no browser token).
// AI:      All generation intents return a model tier for the caller to invoke.
// COST LAW: gpt-4o-mini (free) → claude-haiku (low) → claude-sonnet (moderate)
// Updated: April 22, 2026 — richer classifyIntent() with NLP param extraction
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

// ── Extracted params from natural language ────────────────────────────────────
export interface ExtractedParams {
  credits?:  number   // parsed from "give 50 credits", "add 100 credits", etc.
  eventId?:  string   // parsed from "replay evt_xxx"
  email?:    string   // parsed from "check balance for roy@..."
  userId?:   string   // parsed from UUID in input
  limit?:    number   // parsed from "show last 20"
}

// ── Classification result ─────────────────────────────────────────────────────
// intent: the matched intent string
// params: anything parseable from the natural language input
export interface ClassifyResult {
  intent: RouterIntent
  params: ExtractedParams
}

// ── Keyword index ─────────────────────────────────────────────────────────────
const BILLING_KEYWORDS: Record<BillingIntent, string[]> = {
  grant_credits:  [
    'grant', 'give', 'add credits', 'give credits', 'grant credits',
    'top up', 'topup', 'credit grant', 'credit to user', 'add to',
    'send credits', 'load credits', 'issue credits',
  ],
  deduct_credits: [
    'deduct', 'remove credits', 'subtract credits', 'charge credits',
    'consume credits', 'use credits', 'spend credits', 'take credits',
    'reduce credits', 'withdraw credits',
  ],
  get_balance:    [
    'balance', 'how many credits', 'credit count', 'check credits',
    'check balance', 'what is my balance', "what\'s my balance",
    'show balance', 'view balance', 'credits left', 'remaining credits',
    'how much credit',
  ],
  list_ledger:    [
    'ledger', 'credit history', 'transaction history', 'credit log',
    'show ledger', 'view ledger', 'credit transactions', 'show transactions',
    'recent credits',
  ],
  get_user:       [
    'user info', 'user profile', 'lookup user', 'find user', 'user details',
    'show user', 'get user', 'who is user', 'fetch user',
  ],
  replay_webhook: [
    'replay', 'retry webhook', 'reprocess event', 'replay event',
    'resend webhook', 'refire event',
  ],
  health_check:   [
    'health', 'ping', 'status check', 'is running', 'are you alive',
    'system status', 'check health',
  ],
}

// ── Param extractors ──────────────────────────────────────────────────────────

// First positive integer in the input (e.g. "give 50 credits" → 50)
function extractNumber(input: string): number | undefined {
  const match = input.match(/\b(\d{1,7})\b/)
  if (!match) return undefined
  const n = parseInt(match[1], 10)
  return isNaN(n) || n <= 0 ? undefined : n
}

// Stripe event ID (evt_...)
function extractEventId(input: string): string | undefined {
  return input.match(/\bevt_[A-Za-z0-9]{8,}\b/)?.[0]
}

// Email address
function extractEmail(input: string): string | undefined {
  return input.match(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/)?.[0]
}

// UUID (Supabase user ID format)
function extractUserId(input: string): string | undefined {
  return input.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0]
}

// ── classifyIntent ────────────────────────────────────────────────────────────
// Phase 1: keyword scan (fast path — exact phrase match)
// Phase 2: regex patterns for natural language credit commands
// Phase 3: param extraction (number, eventId, email, userId)
// Phase 4: AI intent scan
export function classifyIntent(input: string): ClassifyResult {
  const lower  = input.toLowerCase()
  const params: ExtractedParams = {}

  // ── Phase 1: keyword scan ─────────────────────────────────────────────────
  let matched: BillingIntent | null = null
  for (const [intent, keywords] of Object.entries(BILLING_KEYWORDS) as [BillingIntent, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched = intent
      break
    }
  }

  // ── Phase 2: regex patterns for natural language ──────────────────────────
  if (!matched) {
    // "give Roy 50 credits", "add 100", "grant 150 credits to user X"
    if (/\b(give|add|grant|send|issue|load)\b.{0,40}\b\d+\b/.test(lower)) {
      matched = 'grant_credits'
    }
    // "deduct 10 credits", "subtract 5", "take 20 credits from user"
    else if (/\b(deduct|subtract|remove|take|reduce|charge|spend)\b.{0,40}\b\d+\b/.test(lower)) {
      matched = 'deduct_credits'
    }
    // "how many credits does X have", "what is X's balance", "show credits"
    else if (/\b(credits?|balance)\b.{0,30}\b(have|has|left|remaining|do)\b/.test(lower) ||
             /\b(what|show|check|view)\b.{0,15}\b(credits?|balance)\b/.test(lower)) {
      matched = 'get_balance'
    }
  }

  // ── Phase 3: extract params from input ───────────────────────────────────
  const num = extractNumber(input)
  if (num !== undefined) {
    if (matched === 'grant_credits' || matched === 'deduct_credits') {
      params.credits = num
    } else if (matched === 'list_ledger') {
      params.limit = num
    }
  }

  const eventId = extractEventId(input)
  if (eventId) params.eventId = eventId

  const email = extractEmail(input)
  if (email) params.email = email

  const userId = extractUserId(input)
  if (userId) params.userId = userId

  if (matched) {
    console.log('JAVARI_ROUTER classify', {
      intent: matched,
      params,
      input:  input.slice(0, 60),
    })
    return { intent: matched, params }
  }

  // ── Phase 4: AI intent scan ───────────────────────────────────────────────
  const AI_KEYWORDS: Record<AIIntent, string[]> = {
    chat:  ['chat', 'talk', 'ask', 'question', 'tell me', 'explain', 'what is', 'how does'],
    forge: ['forge', 'create', 'build', 'generate', 'make', 'design', 'produce'],
    team:  ['team', 'collaborate', 'assign', 'delegate', 'multi-agent'],
    image: ['image', 'picture', 'photo', 'draw', 'illustrate', 'visualize'],
    audio: ['audio', 'sound', 'music', 'voice', 'speech', 'narrate'],
    code:  ['code', 'script', 'function', 'implement', 'program', 'debug', 'fix bug'],
  }

  for (const [intent, keywords] of Object.entries(AI_KEYWORDS) as [AIIntent, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { intent, params }
    }
  }

  return { intent: 'unknown', params }
}

// ── Exec layer client ─────────────────────────────────────────────────────────
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

  const qs = new URLSearchParams()
  qs.set('secret', secret)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }

  const url = `${baseUrl}/api/internal/exec?${qs.toString()}`
  const res  = await fetch(url, { method: 'GET' })
  const json = await res.json() as ExecResult

  console.log('JAVARI_ROUTER exec', {
    action: params.action,
    ok:     json.ok,
    status: res.status,
  })

  return json
}

// ── Billing intent dispatch ───────────────────────────────────────────────────
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
  console.log('JAVARI_ROUTER dispatch_billing', {
    intent,
    action,
    userId: params.userId?.slice(0, 8),
    credits: params.credits,
  })
  return callExec({ action, ...params }, baseUrl)
}

// ── Model tier selection ──────────────────────────────────────────────────────
export type ModelTier = 'gpt-4o-mini' | 'claude-haiku' | 'claude-sonnet'

const AI_INTENT_TIERS: Record<AIIntent, ModelTier> = {
  chat:  'gpt-4o-mini',
  forge: 'gpt-4o-mini',
  team:  'gpt-4o-mini',
  image: 'gpt-4o-mini',
  audio: 'gpt-4o-mini',
  code:  'claude-haiku',
}

export function selectModel(intent: AIIntent): ModelTier {
  return AI_INTENT_TIERS[intent] ?? 'gpt-4o-mini'
}

// ── Main router ───────────────────────────────────────────────────────────────
// Entry point for all Javari requests. Returns either:
//   { type: 'billing', intent, result }  — billing op executed server-side
//   { type: 'ai', intent, model }        — AI model selected for generation
export async function route(
  input:    string,
  context?: { userId?: string; baseUrl?: string },
): Promise<
  | { type: 'billing'; intent: BillingIntent; result: ExecResult }
  | { type: 'ai'; intent: AIIntent | 'unknown'; model: ModelTier }
> {
  // classifyIntent now returns { intent, params } — destructure both
  const { intent, params: extracted } = classifyIntent(input)

  if (intent !== 'unknown' && intent in BILLING_KEYWORDS) {
    const billingIntent = intent as BillingIntent

    // Merge params: explicit context.userId always wins over extracted value
    const mergedParams: Omit<ExecParams, 'action'> = {
      userId:  context?.userId  ?? extracted.userId,
      credits: extracted.credits,
      eventId: extracted.eventId,
      email:   extracted.email   ?? (context?.userId ? undefined : undefined),
      limit:   extracted.limit,
      note:    `javari_router: ${input.slice(0, 60)}`,
    }

    const result = await dispatchBillingIntent(
      billingIntent,
      mergedParams,
      context?.baseUrl,
    )
    return { type: 'billing', intent: billingIntent, result }
  }

  const aiIntent = intent as AIIntent | 'unknown'
  const model    = selectModel(aiIntent === 'unknown' ? 'chat' : aiIntent)
  console.log('JAVARI_ROUTER ai_dispatch', { intent: aiIntent, model })
  return { type: 'ai', intent: aiIntent, model }
}
