// lib/javari/router.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ROLE: Javari AI intent router — classifies requests and dispatches.
// DO NOT CALL DIRECTLY from client components — import and use route() or
//   dispatchBillingIntent() from server-side context only.
// BILLING: All billing intents route to /api/internal/exec (no browser token).
// AI auto: cheapest viable model via COST LAW.
// AI team: returns multi-AI plan for user approval — does NOT execute.
// COST LAW: gpt-4o-mini (free) → claude-haiku (low) → claude-sonnet (moderate)
// Updated: April 22, 2026 — ExecutionMode: auto | team
// ─────────────────────────────────────────────────────────────────────────────

// ── Execution mode ────────────────────────────────────────────────────────────
// 'auto'  — default. classifyIntent + selectModel. Executes immediately.
// 'team'  — user-configured Multi-AI team. Returns plan + cost. Requires approval.
export type ExecutionMode = 'auto' | 'team'

// ── Team configuration ────────────────────────────────────────────────────────
// User assigns providers to roles. Any role can be omitted — unfilled roles are skipped.
export interface TeamConfig {
  architect?:  TeamProvider   // High-level planning, decomposition
  builder?:    TeamProvider   // Implementation, code generation
  tester?:     TeamProvider   // Validation, QA, adversarial testing
  reviewer?:   TeamProvider   // Final review, quality gate
  specialist?: TeamProvider   // Domain-specific (legal, medical, finance, etc.)
}

export type TeamProvider =
  | 'openai'         // gpt-4o-mini (cheapest tier)
  | 'openai-gpt4'    // gpt-4o (moderate)
  | 'claude'         // claude-haiku (low)
  | 'claude-sonnet'  // claude-sonnet-4 (moderate)
  | 'xai'            // Grok (low-moderate)
  | 'gemini'         // Gemini Flash (free tier)
  | 'llama'          // Llama via Groq (free)

// ── Provider cost table (relative units) ─────────────────────────────────────
// Calibrated to COST LAW: free=0, low=1, moderate=2, high=5.
// Update base/tier here when real API pricing is available.
const PROVIDER_COST: Record<TeamProvider, { tier: 'free' | 'low' | 'moderate' | 'high'; base: number }> = {
  'openai':        { tier: 'low',      base: 1 },
  'openai-gpt4':   { tier: 'moderate', base: 2 },
  'claude':        { tier: 'low',      base: 1 },
  'claude-sonnet': { tier: 'moderate', base: 2 },
  'xai':           { tier: 'low',      base: 1 },
  'gemini':        { tier: 'free',     base: 0 },
  'llama':         { tier: 'free',     base: 0 },
}

const TIER_MULTIPLIER: Record<'free' | 'low' | 'moderate' | 'high', number> = {
  free:     0,
  low:      1,
  moderate: 2,
  high:     5,
}

// ── Multi-AI plan result ──────────────────────────────────────────────────────
// Returned by route() when mode === 'team'. Never executes. Requires approval.
export interface MultiAIPlan {
  type:              'multi_ai_plan'
  roles:             TeamConfig
  role_count:        number
  providers:         Partial<Record<keyof TeamConfig, { provider: TeamProvider; tier: string; cost: number }>>
  estimated_cost:    number
  cost_breakdown:    string
  requires_approval: true
}

// ── calculateCost ─────────────────────────────────────────────────────────────
// Returns total relative cost + per-role breakdown for a TeamConfig.
// cost = SUM of (base * TIER_MULTIPLIER) for each filled role.
export function calculateCost(teamConfig: TeamConfig): {
  total:     number
  breakdown: Partial<Record<keyof TeamConfig, number>>
} {
  const breakdown: Partial<Record<keyof TeamConfig, number>> = {}
  let total = 0

  for (const [role, provider] of Object.entries(teamConfig) as [keyof TeamConfig, TeamProvider | undefined][]) {
    if (!provider) continue
    const entry = PROVIDER_COST[provider]
    if (!entry) continue
    const cost = entry.base * TIER_MULTIPLIER[entry.tier]
    breakdown[role] = cost
    total += cost
  }

  return { total, breakdown }
}

// ── Intent types ──────────────────────────────────────────────────────────────
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
    'check balance', 'what is my balance', "what's my balance",
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

function extractNumber(input: string): number | undefined {
  const match = input.match(/\b(\d{1,7})\b/)
  if (!match) return undefined
  const n = parseInt(match[1], 10)
  return isNaN(n) || n <= 0 ? undefined : n
}

function extractEventId(input: string): string | undefined {
  return input.match(/\bevt_[A-Za-z0-9]{8,}\b/)?.[0]
}

function extractEmail(input: string): string | undefined {
  return input.match(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/)?.[0]
}

function extractUserId(input: string): string | undefined {
  return input.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0]
}

// ── classifyIntent ────────────────────────────────────────────────────────────
// Phase 1: keyword scan  Phase 2: regex NLP  Phase 3: param extraction
// Phase 4: AI keyword scan
export function classifyIntent(input: string): ClassifyResult {
  const lower  = input.toLowerCase()
  const params: ExtractedParams = {}

  // Phase 1: keyword scan
  let matched: BillingIntent | null = null
  for (const [intent, keywords] of Object.entries(BILLING_KEYWORDS) as [BillingIntent, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) { matched = intent; break }
  }

  // Phase 2: regex NLP patterns
  if (!matched) {
    if (/\b(give|add|grant|send|issue|load)\b.{0,40}\b\d+\b/.test(lower)) {
      matched = 'grant_credits'
    } else if (/\b(deduct|subtract|remove|take|reduce|charge|spend)\b.{0,40}\b\d+\b/.test(lower)) {
      matched = 'deduct_credits'
    } else if (
      /\b(credits?|balance)\b.{0,30}\b(have|has|left|remaining|do)\b/.test(lower) ||
      /\b(what|show|check|view)\b.{0,15}\b(credits?|balance)\b/.test(lower)
    ) {
      matched = 'get_balance'
    }
  }

  // Phase 3: param extraction
  const num = extractNumber(input)
  if (num !== undefined) {
    if (matched === 'grant_credits' || matched === 'deduct_credits') params.credits = num
    else if (matched === 'list_ledger') params.limit = num
  }
  const eventId = extractEventId(input); if (eventId) params.eventId = eventId
  const email   = extractEmail(input);   if (email)   params.email   = email
  const userId  = extractUserId(input);  if (userId)  params.userId  = userId

  if (matched) {
    console.log('JAVARI_ROUTER classify', { intent: matched, params, input: input.slice(0, 60) })
    return { intent: matched, params }
  }

  // Phase 4: AI intent scan
  const AI_KEYWORDS: Record<AIIntent, string[]> = {
    chat:  ['chat', 'talk', 'ask', 'question', 'tell me', 'explain', 'what is', 'how does'],
    forge: ['forge', 'create', 'build', 'generate', 'make', 'design', 'produce'],
    team:  ['team', 'collaborate', 'assign', 'delegate', 'multi-agent'],
    image: ['image', 'picture', 'photo', 'draw', 'illustrate', 'visualize'],
    audio: ['audio', 'sound', 'music', 'voice', 'speech', 'narrate'],
    code:  ['code', 'script', 'function', 'implement', 'program', 'debug', 'fix bug'],
  }
  for (const [intent, keywords] of Object.entries(AI_KEYWORDS) as [AIIntent, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) return { intent, params }
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

  console.log('JAVARI_ROUTER exec', { action: params.action, ok: json.ok, status: res.status })
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
    intent, action,
    userId:  params.userId?.slice(0, 8),
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

// ── Route context ─────────────────────────────────────────────────────────────
export interface RouteContext {
  userId?:     string
  baseUrl?:    string
  teamConfig?: TeamConfig   // required when mode === 'team'
}

// ── Route result union ────────────────────────────────────────────────────────
export type RouteResult =
  | {
      type:          'billing'
      intent:        BillingIntent
      result:        ExecResult
      mode:          'auto'
      cost_estimate: 'zero'
    }
  | {
      type:          'ai'
      intent:        AIIntent | 'unknown'
      model:         ModelTier
      mode:          'auto'
      cost_estimate: 'low' | 'moderate'
      executed:      false
    }
  | {
      type:   'multi_ai_plan'
      intent: AIIntent | 'unknown'
      plan:   MultiAIPlan
      mode:   'team'
    }

// ── route() ───────────────────────────────────────────────────────────────────
// Entry point for all Javari requests.
//
// mode = 'auto' (default — backward compatible):
//   Billing intent → executes immediately via /api/internal/exec
//   AI intent      → returns cheapest viable model, does not execute
//
// mode = 'team':
//   Requires context.teamConfig
//   Does NOT execute — returns MultiAIPlan { requires_approval: true }
//   Caller must display plan + get explicit user approval before firing agents
//
// All existing callers omitting mode default to 'auto' — zero breaking changes.
export async function route(
  input:   string,
  context?: RouteContext,
  mode:     ExecutionMode = 'auto',
): Promise<RouteResult> {

  const { intent, params: extracted } = classifyIntent(input)

  console.log('JAVARI MODE', { mode, intent, input: input.slice(0, 60) })

  // ── TEAM mode — build plan, do NOT execute ────────────────────────────────
  if (mode === 'team') {
    const teamConfig              = context?.teamConfig ?? {}
    const { total, breakdown }    = calculateCost(teamConfig)
    const roleCount               = Object.values(teamConfig).filter(Boolean).length

    // Build per-role detail
    const providers: MultiAIPlan['providers'] = {}
    for (const [role, provider] of Object.entries(teamConfig) as [keyof TeamConfig, TeamProvider | undefined][]) {
      if (!provider) continue
      const entry = PROVIDER_COST[provider]
      providers[role] = {
        provider,
        tier: entry?.tier ?? 'unknown',
        cost: (entry?.base ?? 0) * TIER_MULTIPLIER[entry?.tier ?? 'free'],
      }
    }

    // Human-readable breakdown string
    const breakdownParts = Object.entries(breakdown).map(
      ([role, cost]) => `${role}:${teamConfig[role as keyof TeamConfig]}(${cost}u)`
    )
    const costBreakdown = breakdownParts.length
      ? breakdownParts.join(' + ') + ` = ${total}u`
      : 'no roles configured — 0u'

    const plan: MultiAIPlan = {
      type:              'multi_ai_plan',
      roles:             teamConfig,
      role_count:        roleCount,
      providers,
      estimated_cost:    total,
      cost_breakdown:    costBreakdown,
      requires_approval: true,
    }

    console.log('JAVARI MODE team_plan', {
      intent,
      role_count:     roleCount,
      estimated_cost: total,
      breakdown:      costBreakdown,
    })

    return { type: 'multi_ai_plan', intent: intent as AIIntent | 'unknown', plan, mode: 'team' }
  }

  // ── AUTO mode — existing execution flow, unchanged ────────────────────────
  if (intent !== 'unknown' && intent in BILLING_KEYWORDS) {
    const billingIntent = intent as BillingIntent
    const mergedParams: Omit<ExecParams, 'action'> = {
      userId:  context?.userId ?? extracted.userId,
      credits: extracted.credits,
      eventId: extracted.eventId,
      email:   extracted.email,
      limit:   extracted.limit,
      note:    `javari_router: ${input.slice(0, 60)}`,
    }
    const result = await dispatchBillingIntent(billingIntent, mergedParams, context?.baseUrl)
    return { type: 'billing', intent: billingIntent, result, mode: 'auto', cost_estimate: 'zero' }
  }

  const aiIntent     = intent as AIIntent | 'unknown'
  const model        = selectModel(aiIntent === 'unknown' ? 'chat' : aiIntent)
  const costEstimate: 'low' | 'moderate' = model === 'claude-sonnet' ? 'moderate' : 'low'

  console.log('JAVARI_ROUTER ai_dispatch', { intent: aiIntent, model, mode: 'auto' })

  return {
    type:          'ai',
    intent:        aiIntent,
    model,
    mode:          'auto',
    cost_estimate: costEstimate,
    executed:      false,
  }
}
