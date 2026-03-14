// lib/javari/model-router.ts
// Javari AI Multi-Model Router
// Reads catalog + config, selects cheapest valid model per task
// Falls back free → low → mid → high automatically
// Cost guardrails enforced per request and per day
// Date: March 13, 2026 | Henderson Standard
// TODO: when core ecosystem live, load config from craudiovizai.com platform vault

import ROUTER_CONFIG from './model-router.json'
import MODEL_CATALOG from '../../data/openrouter-models.json'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type TaskType =
  | 'planning' | 'coding' | 'validation' | 'analysis' | 'chat'
  | 'vision' | 'web_search' | 'reasoning' | 'multilingual'
  | 'creative' | 'rag' | 'media_recommendations'

export type Tier = 'free' | 'low' | 'mid' | 'high'

export interface ModelRecord {
  model_id: string
  name: string
  tier: Tier
  priority: number
  price_input: number
  price_output: number
  price_avg_per_m: number
  context_length: number
  capabilities: string[]
  description: string
}

export interface RoutingRequest {
  task_type: TaskType
  prompt: string
  max_tokens?: number
  require_vision?: boolean
  require_web_search?: boolean
  user_tier?: 'free' | 'basic' | 'pro' | 'enterprise'
  force_model?: string       // Override — use exactly this model
  force_max_tier?: Tier      // Override — cap at this tier
}

export interface RoutingDecision {
  model_id: string
  model_name: string
  tier: Tier
  estimated_cost_usd: number
  max_tokens: number
  capabilities: string[]
  fallback_chain: string[]
  reason: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RouterResponse {
  content: string
  model_id: string
  model_name: string
  tier: Tier
  tokens_used?: number
  cost_usd?: number
  error?: string
}

// ─── TIER ORDER ──────────────────────────────────────────────────────────────

const TIER_ORDER: Tier[] = ['free', 'low', 'mid', 'high']

function tierIndex(t: Tier): number {
  return TIER_ORDER.indexOf(t)
}

// ─── DAILY COST TRACKER (in-memory, resets on cold start) ────────────────────
// TODO: persist to Supabase when core ecosystem is live

const dailyCostTracker = new Map<string, number>() // userId → daily spend

function getDailySpend(userId = 'global'): number {
  return dailyCostTracker.get(userId) || 0
}

function addDailySpend(userId = 'global', amount: number) {
  dailyCostTracker.set(userId, getDailySpend(userId) + amount)
}

// ─── SELECT MODEL ─────────────────────────────────────────────────────────────

export function selectModel(req: RoutingRequest, userId = 'global'): RoutingDecision {
  // Force override
  if (req.force_model) {
    const model = (MODEL_CATALOG as ModelRecord[]).find(m => m.model_id === req.force_model)
    const task = (ROUTER_CONFIG.task_routing as Record<string, typeof ROUTER_CONFIG.task_routing.chat>)[req.task_type]
    const maxTokens = req.max_tokens || task?.max_tokens || 1000
    return {
      model_id: req.force_model,
      model_name: model?.name || req.force_model,
      tier: model?.tier || 'mid',
      estimated_cost_usd: 0,
      max_tokens: maxTokens,
      capabilities: model?.capabilities || [],
      fallback_chain: [req.force_model],
      reason: 'Force-selected by caller',
    }
  }

  const task = (ROUTER_CONFIG.task_routing as Record<string, typeof ROUTER_CONFIG.task_routing.chat>)[req.task_type]
  if (!task) throw new Error(`Unknown task type: ${req.task_type}`)

  const maxTokens = req.max_tokens || task.max_tokens || 1000
  const maxTier = req.force_max_tier || task.max_tier as Tier || 'mid'
  const maxTierIdx = tierIndex(maxTier)

  // Check daily spend
  const dailySpend = getDailySpend(userId)
  if (dailySpend >= ROUTER_CONFIG.cost_guardrails.max_daily_cost_usd) {
    // Force free-only if daily limit hit
    const freeModel = (MODEL_CATALOG as ModelRecord[]).find(m =>
      m.tier === 'free' &&
      task.required_capabilities.every(c => m.capabilities.includes(c))
    )
    if (freeModel) {
      return buildDecision(freeModel, maxTokens, [], 'Daily cost limit reached — forced to free tier')
    }
    throw new Error('Daily cost limit reached and no free model available for this task')
  }

  // Build required capability set
  const requiredCaps = new Set(task.required_capabilities)
  if (req.require_vision) requiredCaps.add('vision')
  if (req.require_web_search) requiredCaps.add('web_search')

  // Filter eligible models
  const eligible = (MODEL_CATALOG as ModelRecord[]).filter(m => {
    if (tierIndex(m.tier) > maxTierIdx) return false
    if (m.price_avg_per_m < 0) return false  // exclude router/special models
    for (const cap of requiredCaps) {
      if (!m.capabilities.includes(cap)) return false
    }
    return true
  })

  if (eligible.length === 0) {
    throw new Error(`No models available for task=${req.task_type} with caps=${[...requiredCaps].join(',')} under tier=${maxTier}`)
  }

  // Try preferred models first (in order)
  const preferred = task.preferred_models as string[]
  const preferredEligible = preferred.filter(id => eligible.find(m => m.model_id === id))

  // Build fallback chain: preferred first, then cheapest eligible by tier
  const remaining = eligible
    .filter(m => !preferred.includes(m.model_id))
    .sort((a, b) => a.price_avg_per_m - b.price_avg_per_m)

  const fullChain = [
    ...preferredEligible,
    ...remaining.map(m => m.model_id),
  ]

  // Select first in chain
  const selectedId = fullChain[0]
  const selected = eligible.find(m => m.model_id === selectedId)!

  return buildDecision(selected, maxTokens, fullChain.slice(1), `Selected: cheapest valid model for ${req.task_type}`)
}

function buildDecision(
  model: ModelRecord,
  maxTokens: number,
  fallbacks: string[],
  reason: string
): RoutingDecision {
  // Estimated cost: assume avg prompt = maxTokens/2, completion = maxTokens/2
  const estimatedTokens = maxTokens
  const costUsd = (model.price_avg_per_m / 1_000_000) * estimatedTokens

  return {
    model_id: model.model_id,
    model_name: model.name,
    tier: model.tier,
    estimated_cost_usd: Math.round(costUsd * 1_000_000) / 1_000_000,
    max_tokens: maxTokens,
    capabilities: model.capabilities,
    fallback_chain: fallbacks.slice(0, 5),
    reason,
  }
}

// ─── CALL MODEL ──────────────────────────────────────────────────────────────

export async function callModel(
  decision: RoutingDecision,
  messages: ChatMessage[],
  systemPrompt?: string,
  userId = 'global',
  attempt = 0
): Promise<RouterResponse> {
  const orKey = process.env.OPENROUTER_API_KEY || ''
  if (!orKey) {
    return { content: 'OpenRouter API key not configured.', model_id: decision.model_id, model_name: decision.model_name, tier: decision.tier, error: 'No API key' }
  }

  // Enforce task cost guardrail
  if (decision.estimated_cost_usd > ROUTER_CONFIG.cost_guardrails.max_task_cost_usd) {
    if (decision.fallback_chain.length > 0) {
      const catalog = MODEL_CATALOG as ModelRecord[]
      const fallbackModel = catalog.find(m => m.model_id === decision.fallback_chain[0])
      if (fallbackModel) {
        const fallbackDecision = buildDecision(fallbackModel, decision.max_tokens, decision.fallback_chain.slice(1), 'Cost guardrail — fell back to cheaper model')
        return callModel(fallbackDecision, messages, systemPrompt, userId, attempt + 1)
      }
    }
    return { content: 'Task cost exceeds limit and no cheaper fallback found.', model_id: decision.model_id, model_name: decision.model_name, tier: decision.tier, error: 'Cost guardrail exceeded' }
  }

  const orMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ]

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://craudiovizai.com',
        'X-Title': 'Javari AI',
      },
      body: JSON.stringify({
        model: decision.model_id,
        messages: orMessages,
        max_tokens: decision.max_tokens,
        temperature: 0.65,
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(`OpenRouter ${res.status}: ${errData?.error?.message || res.statusText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    const tokensUsed = data.usage?.total_tokens || 0
    const costUsd = (decision.model_id.includes(':free') || decision.tier === 'free')
      ? 0
      : (tokensUsd(tokensUsed, decision))

    // Track daily spend
    addDailySpend(userId, costUsd)

    if (!content && decision.fallback_chain.length > 0 && attempt < 3) {
      // Empty response — try next in chain
      const catalog = MODEL_CATALOG as ModelRecord[]
      const nextModel = catalog.find(m => m.model_id === decision.fallback_chain[0])
      if (nextModel) {
        const nextDecision = buildDecision(nextModel, decision.max_tokens, decision.fallback_chain.slice(1), 'Empty response — tried next fallback')
        return callModel(nextDecision, messages, systemPrompt, userId, attempt + 1)
      }
    }

    return {
      content,
      model_id: decision.model_id,
      model_name: decision.model_name,
      tier: decision.tier,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'

    // Auto-fallback on error if attempts remain
    if (attempt < 3 && decision.fallback_chain.length > 0) {
      const catalog = MODEL_CATALOG as ModelRecord[]
      const nextModel = catalog.find(m => m.model_id === decision.fallback_chain[0])
      if (nextModel) {
        const nextDecision = buildDecision(nextModel, decision.max_tokens, decision.fallback_chain.slice(1), `Error fallback: ${msg}`)
        return callModel(nextDecision, messages, systemPrompt, userId, attempt + 1)
      }
    }

    return {
      content: 'I ran into an issue — please try again in a moment.',
      model_id: decision.model_id,
      model_name: decision.model_name,
      tier: decision.tier,
      error: msg,
    }
  }
}

function tokensUsd(tokens: number, decision: RoutingDecision): number {
  return Math.round((decision.estimated_cost_usd / decision.max_tokens) * tokens * 1_000_000) / 1_000_000
}

// ─── CONVENIENCE FUNCTION ─────────────────────────────────────────────────────

export async function route(
  task_type: TaskType,
  messages: ChatMessage[],
  systemPrompt?: string,
  options: Partial<RoutingRequest> = {},
  userId = 'global'
): Promise<RouterResponse> {
  const decision = selectModel({ task_type, prompt: messages[messages.length-1]?.content || '', ...options }, userId)
  return callModel(decision, messages, systemPrompt, userId)
}

// ─── STATUS ───────────────────────────────────────────────────────────────────

export function getRouterStatus(userId = 'global') {
  const dailySpend = getDailySpend(userId)
  const limit = ROUTER_CONFIG.cost_guardrails.max_daily_cost_usd
  return {
    daily_spend_usd: dailySpend,
    daily_limit_usd: limit,
    remaining_usd: Math.max(0, limit - dailySpend),
    at_limit: dailySpend >= limit,
    model_count: (MODEL_CATALOG as ModelRecord[]).length,
    free_models: (MODEL_CATALOG as ModelRecord[]).filter(m => m.tier === 'free').length,
  }
}
