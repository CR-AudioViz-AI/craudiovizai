// lib/javari/team/ai-dispatcher.ts
// Javari TEAM Mode — AI Dispatcher Layer
// Centralized model routing and AI request dispatch for all agent roles.
// Simulated responses now — structured for zero-friction drop-in of real API calls.
// Model policy: cheap-first with typed fallbacks per role.
// Created: April 24, 2026

import type { AgentRole } from './execution-contract'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIRequest {
  role:       AgentRole
  objective:  string
  inputs:     string[]
  max_cost:   number
}

export interface AIResponse {
  output:     string
  cost_used:  number
  model:      string
  latency_ms: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Model routing table
// Primary model is cheap-first per COST LAW.
// Fallback is used when primary is unavailable (swap in real retry logic here).
// ─────────────────────────────────────────────────────────────────────────────

interface ModelPolicy {
  primary:  string
  fallback: string
}

const MODEL_POLICY: Record<AgentRole, ModelPolicy> = {
  architect: { primary: 'gpt-4o-mini',    fallback: 'gpt-4.1'      },
  builder:   { primary: 'deepseek-chat',  fallback: 'gpt-4o-mini'  },
  tester:    { primary: 'mistral-large',  fallback: 'gpt-4o-mini'  },
  reviewer:  { primary: 'claude-3-haiku', fallback: 'gpt-4o-mini'  },
  deployer:  { primary: 'gpt-4o-mini',   fallback: 'gpt-4o-mini'  },
}

// Approximate cost per 1K tokens (USD) — used for simulation estimates only.
// Replace with live pricing table when wiring real API calls.
const COST_PER_1K_TOKENS: Record<string, number> = {
  'gpt-4o-mini':    0.000150,
  'gpt-4.1':        0.002000,
  'deepseek-chat':  0.000140,
  'mistral-large':  0.003000,
  'claude-3-haiku': 0.000250,
}

// Simulated token output range per role — rough proxy for real call sizes
const SIMULATED_OUTPUT_TOKENS: Record<AgentRole, number> = {
  architect: 600,
  builder:   900,
  tester:    400,
  reviewer:  350,
  deployer:  200,
}

// ─────────────────────────────────────────────────────────────────────────────
// selectModel
// Returns the primary model for a given role per the routing policy.
// Fallback selection is handled inside dispatchAI after a simulated failure.
// ─────────────────────────────────────────────────────────────────────────────

export function selectModel(role: AgentRole): string {
  return MODEL_POLICY[role].primary
}

// ─────────────────────────────────────────────────────────────────────────────
// enforceCostLimit
// Throws if cost_used exceeds max_cost.
// Called after cost estimation, before committing a result.
// ─────────────────────────────────────────────────────────────────────────────

export function enforceCostLimit(cost_used: number, max_cost: number): void {
  if (cost_used > max_cost) {
    throw new Error(
      `AI dispatch cost limit exceeded: cost_used $${cost_used.toFixed(6)} > max_cost $${max_cost.toFixed(6)}`
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildPrompt
// Constructs a structured prompt string from the request.
// This is the single source of truth for prompt shape — swap in template
// library or RAG injection here when ready.
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(request: AIRequest): string {
  const inputsBlock =
    request.inputs.length > 0
      ? `\n\nINPUTS:\n${request.inputs.map((v, i) => `[${i + 1}] ${v}`).join('\n')}`
      : '\n\nINPUTS: none'

  return (
    `ROLE: ${request.role.toUpperCase()}\n` +
    `OBJECTIVE: ${request.objective}` +
    inputsBlock
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// estimateCost
// Returns a deterministic cost estimate for a given model + token count.
// Clamps to max_cost. Replace with real token count from API response later.
// ─────────────────────────────────────────────────────────────────────────────

function estimateCost(model: string, role: AgentRole, max_cost: number): number {
  const ratePerK = COST_PER_1K_TOKENS[model] ?? 0.002
  const tokens   = SIMULATED_OUTPUT_TOKENS[role]
  const raw      = (tokens / 1000) * ratePerK
  const rounded  = Math.round(raw * 1_000_000) / 1_000_000
  // Must never exceed max_cost — clamp with a 5% headroom buffer
  return Math.min(rounded, max_cost * 0.95)
}

// ─────────────────────────────────────────────────────────────────────────────
// simulateResponse
// Produces a structured simulated output for a given prompt + model.
// Designed so replacing this function with a real fetch() call requires
// zero changes to the callers — identical return shape.
// ─────────────────────────────────────────────────────────────────────────────

function simulateResponse(
  prompt:  string,
  model:   string,
  role:    AgentRole,
  cost:    number,
): string {
  // Structured output matches what a real model response would contain.
  // Downstream executor reads `output` as a string — parse as JSON if needed.
  return JSON.stringify({
    model,
    role,
    simulated:   true,
    prompt_hash: simpleHash(prompt),
    summary:     `[${model}] processed ${role} objective (${prompt.length} chars). Simulation only.`,
    cost_used:   cost,
    artifacts:   [],
    note:        'Replace simulateResponse() with real fetch() to activate AI dispatch.',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatchAI
// Main entry point for all agent AI calls.
// 1. Selects model via policy
// 2. Builds prompt
// 3. Estimates cost and enforces limit
// 4. Calls simulation (replace with real API call here)
// 5. Returns AIResponse
// ─────────────────────────────────────────────────────────────────────────────

export async function dispatchAI(request: AIRequest): Promise<AIResponse> {
  const startMs = Date.now()

  const policy = MODEL_POLICY[request.role]
  let   model  = policy.primary
  let   usedFallback = false

  // Prompt construction
  const prompt = buildPrompt(request)

  // Cost estimation against primary model
  let cost_used = estimateCost(model, request.role, request.max_cost)

  // If primary model cost exceeds budget, try fallback
  // (In real dispatch: also retry on 429/503)
  if (cost_used > request.max_cost) {
    model        = policy.fallback
    cost_used    = estimateCost(model, request.role, request.max_cost)
    usedFallback = true
  }

  // Hard enforcement — throws if still over budget after fallback
  enforceCostLimit(cost_used, request.max_cost)

  // Dispatch — simulation now, real fetch() later
  // To wire real API: replace this block with fetch() to your model endpoint.
  // The AIResponse shape is the contract — callers never change.
  let output: string
  try {
    output = simulateResponse(prompt, model, request.role, cost_used)
  } catch (err: unknown) {
    // Primary failed — try fallback (pattern preserved for real API wiring)
    if (!usedFallback) {
      model     = policy.fallback
      cost_used = estimateCost(model, request.role, request.max_cost)
      enforceCostLimit(cost_used, request.max_cost)
      output    = simulateResponse(prompt, model, request.role, cost_used)
    } else {
      throw new Error(
        `AI dispatch failed for role "${request.role}" on both primary (${policy.primary}) ` +
        `and fallback (${policy.fallback}): ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const latency_ms = Date.now() - startMs

  return {
    output,
    cost_used,
    model,
    latency_ms,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// simpleHash
// Deterministic non-cryptographic hash for prompt fingerprinting in logs.
// djb2 variant — stable across runs, no dependencies.
// ─────────────────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0 // keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0')
}
