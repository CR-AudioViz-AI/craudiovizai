// lib/javari/team/ai-dispatcher.ts
// Javari TEAM Mode — AI Dispatcher Layer
// Centralized model routing and AI request dispatch for all agent roles.
// Simulated responses now — structured for zero-friction drop-in of real API calls.
// Model policy: cheap-first with typed fallbacks per role.
// Created: April 24, 2026
// Updated: April 24, 2026 — executeAgent routes to tool-runner for real tool calls;
//                            simulation retained as fallback for non-tool roles.

import type { AgentRole }    from './execution-contract'
import { runTool }           from '@/lib/javari/tools/tool-runner'
import type { ToolContext }  from '@/lib/javari/tools/tool-runner'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIRequest {
  role:        AgentRole
  objective:   string
  inputs:      string[]
  max_cost:    number
  /** User ID passed through from execution context — required for tool logging */
  userId?:     string
  /** Execution ID from the TEAM engine — included in tool logs */
  executionId?: string
}

export interface AIResponse {
  output:     string
  cost_used:  number
  model:      string
  latency_ms: number
  /** True when a real tool was invoked instead of a simulation */
  tool_used?: string
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
// ─────────────────────────────────────────────────────────────────────────────

export function selectModel(role: AgentRole): string {
  return MODEL_POLICY[role].primary
}

// ─────────────────────────────────────────────────────────────────────────────
// enforceCostLimit
// Throws if cost_used exceeds max_cost.
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
// Single source of truth for prompt shape — swap in RAG injection here.
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
// Deterministic cost estimate for a given model + token count.
// Clamps to max_cost with a 5% headroom buffer.
// ─────────────────────────────────────────────────────────────────────────────

function estimateCost(model: string, role: AgentRole, max_cost: number): number {
  const ratePerK = COST_PER_1K_TOKENS[model] ?? 0.002
  const tokens   = SIMULATED_OUTPUT_TOKENS[role]
  const raw      = (tokens / 1000) * ratePerK
  const rounded  = Math.round(raw * 1_000_000) / 1_000_000
  return Math.min(rounded, max_cost * 0.95)
}

// ─────────────────────────────────────────────────────────────────────────────
// simulateResponse
// Simulation fallback — used when no tool is mapped for a role.
// Designed for zero-friction replacement with real fetch() calls.
// ─────────────────────────────────────────────────────────────────────────────

function simulateResponse(
  prompt:  string,
  model:   string,
  role:    AgentRole,
  cost:    number,
): string {
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
// executeAgent
// Routes agent roles to real tools where mapped, falls back to simulation.
//
// Tool routing:
//   deployer  → vercel.deploy  (HIGH risk — approved=true for now, dynamic later)
//   builder   → github.commit  (HIGH risk — approved=true for now)
//   architect → supabase.query (medium risk — approved=false, auto-gated)
//   tester    → simulation (no tool mapped yet)
//   reviewer  → simulation (no tool mapped yet)
//
// Returns { output, tool_used? } — output is always a JSON string.
// Wraps all tool calls in try/catch — tool failures return structured error output
// rather than throwing, so dispatchAI can apply its own retry/fallback logic.
// ─────────────────────────────────────────────────────────────────────────────

interface AgentExecuteResult {
  output:    string
  tool_used: string | null
}

async function executeAgent(
  request: AIRequest,
  prompt:  string,
  model:   string,
  cost:    number,
): Promise<AgentExecuteResult> {
  // Build tool context from request — userId is required for tool logging
  const toolCtx: ToolContext = {
    userId:      request.userId ?? 'system',
    executionId: request.executionId,
    approved:    false,   // default — role routing overrides per tool
  }

  // ── deployer → vercel.deploy ──────────────────────────────────────────────
  if (request.role === 'deployer') {
    try {
      const result = await runTool(
        'vercel.deploy',
        {
          projectId: 'craudiovizai',
          ref:       'main',
          target:    'preview',
        },
        { ...toolCtx, approved: true },  // deployer role = pre-approved
      )
      return {
        output:    JSON.stringify({ ...result.output, role: 'deployer', tool: 'vercel.deploy', cost_used: cost }),
        tool_used: 'vercel.deploy',
      }
    } catch (err: unknown) {
      // Tool failed — return structured error output, do not throw
      return {
        output: JSON.stringify({
          role:      'deployer',
          tool:      'vercel.deploy',
          error:     err instanceof Error ? err.message : String(err),
          fallback:  'simulation',
          cost_used: cost,
        }),
        tool_used: 'vercel.deploy',
      }
    }
  }

  // ── builder → github.commit ───────────────────────────────────────────────
  if (request.role === 'builder') {
    try {
      // Use objective as commit message; content is a placeholder until AI generates it
      const result = await runTool(
        'github.commit',
        {
          repo:    'CR-AudioViz-AI/craudiovizai',
          path:    `javari-builds/${Date.now().toString(36)}.json`,
          content: JSON.stringify({ objective: request.objective, inputs: request.inputs, built_at: new Date().toISOString() }, null, 2),
          message: request.objective.slice(0, 72),
          branch:  'javari/builds',
        },
        { ...toolCtx, approved: true },  // builder role = pre-approved
      )
      return {
        output:    JSON.stringify({ ...result.output, role: 'builder', tool: 'github.commit', cost_used: cost }),
        tool_used: 'github.commit',
      }
    } catch (err: unknown) {
      return {
        output: JSON.stringify({
          role:      'builder',
          tool:      'github.commit',
          error:     err instanceof Error ? err.message : String(err),
          fallback:  'simulation',
          cost_used: cost,
        }),
        tool_used: 'github.commit',
      }
    }
  }

  // ── architect → supabase.query ────────────────────────────────────────────
  if (request.role === 'architect') {
    try {
      // architect reads context from DB to inform its blueprint
      const result = await runTool(
        'supabase.query',
        {
          table:  'javari_team_executions',
          select: 'id, plan_id, status, total_cost, created_at',
          filter: { status: 'complete' },
          limit:  5,
        },
        { ...toolCtx, approved: false },  // medium risk — no approval needed
      )
      return {
        output: JSON.stringify({
          role:      'architect',
          tool:      'supabase.query',
          context:   result.output,
          objective: request.objective,
          cost_used: cost,
          note:      'Blueprint informed by recent execution history.',
        }),
        tool_used: 'supabase.query',
      }
    } catch (err: unknown) {
      // architect falls back to simulation gracefully
      return {
        output: simulateResponse(prompt, model, request.role, cost),
        tool_used: null,
      }
    }
  }

  // ── tester / reviewer — no tool mapped yet, use simulation ────────────────
  return {
    output:    simulateResponse(prompt, model, request.role, cost),
    tool_used: null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatchAI
// Main entry point for all agent AI calls.
// 1. Selects model via policy
// 2. Builds prompt
// 3. Estimates cost and enforces limit
// 4. Routes to executeAgent (tool or simulation)
// 5. Returns AIResponse
// All original cost tracking, latency, and fallback logic preserved.
// ─────────────────────────────────────────────────────────────────────────────

export async function dispatchAI(request: AIRequest): Promise<AIResponse> {
  const startMs = Date.now()

  const policy = MODEL_POLICY[request.role]
  let   model  = policy.primary
  let   usedFallback = false

  const prompt = buildPrompt(request)

  let cost_used = estimateCost(model, request.role, request.max_cost)

  if (cost_used > request.max_cost) {
    model        = policy.fallback
    cost_used    = estimateCost(model, request.role, request.max_cost)
    usedFallback = true
  }

  enforceCostLimit(cost_used, request.max_cost)

  let output:    string
  let tool_used: string | null = null

  try {
    const result = await executeAgent(request, prompt, model, cost_used)
    output    = result.output
    tool_used = result.tool_used
  } catch (err: unknown) {
    // executeAgent should never throw (all tool errors are caught internally)
    // but defensive fallback to simulation if it does
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

  const response: AIResponse = {
    output,
    cost_used,
    model,
    latency_ms,
  }
  if (tool_used) response.tool_used = tool_used

  return response
}

// ─────────────────────────────────────────────────────────────────────────────
// simpleHash — djb2 for prompt fingerprinting
// ─────────────────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
