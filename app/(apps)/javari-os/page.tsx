// app/(apps)/javari-os/page.tsx
// Javari OS — Primary Interface v3
// Layout: fixed inset-0 z-50 | 280px sidebar + 1fr dominant chat grid
// Sidebar: Avatar identity + status + agents stacked vertically
// Main: Full-height dominant chat feed + execution log strip at bottom
// Design: Fortune 50 dark ops — deep black, cyan/purple pill toggles, slide-in animations
// Updated: April 24, 2026 — v17: execution kill switch (Stop Execution button + abort SSE event)
'use client'

import {
  useState, useRef, useEffect, useCallback
} from 'react'
import { Send, Zap, ChevronDown, RotateCcw, Terminal, Activity, Users, Cpu } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Types — identical to v2
// ─────────────────────────────────────────────────────────────────────────────
type Mode       = 'single' | 'council'
type AvState    = 'idle' | 'thinking' | 'responding' | 'executing'
type MsgRole    = 'user' | 'assistant' | 'system' | 'agent'
type Theme      = 'dark' | 'light' | 'contrast'

interface Msg {
  id:      string
  role:    MsgRole
  content: string
  agent?:  'planner' | 'builder' | 'validator'
  model?:  string
  tier?:   string
  ts:      number
  error?:  boolean
}

interface EnsembleStep {
  role:    string
  model:   string
  tier:    string
  content: string
  cost:    number
}

// TEAM execution result types — mirrors /api/javari/team response
interface TeamTaskResult {
  task_id:      string
  status:       'complete' | 'failed'
  output?:      string
  error?:       string
  cost_used:    number
  started_at:   string
  completed_at: string
}

interface TeamExecutionResult {
  plan_id:      string
  execution_id?: string
  total_cost:   number
  status:       'running' | 'complete' | 'partial' | 'failed' | 'aborted'
  results:      TeamTaskResult[]
  error?:       string
}

// Execution history types — mirrors /api/javari/executions response
interface ExecHistoryRow {
  id:           string
  plan_id:      string
  status:       string
  total_cost:   number
  created_at:   string
  finalized_at: string | null
}
interface ExecDetailTask {
  id:           string
  execution_id: string
  task_id:      string
  role:         string
  status:       string
  cost_used:    number
  output:       string | null
  error:        string | null
  started_at:   string
  completed_at: string
}
interface ExecDetailResult {
  execution: ExecHistoryRow
  tasks:     ExecDetailTask[]
}

// SSE event shapes from /api/javari/team (streaming mode)
interface SSEStartEvent    { type: 'start';         plan_id: string }
interface SSETaskStart     { type: 'task_start';    task_id: string }
interface SSETaskComplete  { type: 'task_complete'; task_id: string; result: TeamTaskResult }
interface SSETaskError     { type: 'task_error';    task_id: string; result: TeamTaskResult; error?: string }
interface SSEComplete      { type: 'complete';      plan_id: string; execution_id?: string; total_cost: number; status: 'complete' | 'partial' | 'failed'; task_count?: number }
interface SSEError         { type: 'error';         message: string }
interface SSEAborted       { type: 'aborted';       message?: string }
type SSEEvent =
  | SSEStartEvent | SSETaskStart | SSETaskComplete
  | SSETaskError  | SSEComplete  | SSEError | SSEAborted

interface ExecRow {
  id:       string
  title:    string
  module:   string
  model:    string
  status:   string
  verified: boolean
  cost:     number
  ts:       number
}

interface SysStatus {
  total:       number
  completed:   number
  verified:    number
  pending:     number
  phase:       number
  mode:        string
  pct:         number
  budget:      number
  budgetSpent: number
  budgetTotal: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent config
// ─────────────────────────────────────────────────────────────────────────────
const AGENT_CFG = {
  planner:   { label: 'ARCHITECT', glyph: '◈', hue: '#a855f7' },
  builder:   { label: 'BUILDER',   glyph: '◉', hue: '#3b82f6' },
  validator: { label: 'ANALYST',   glyph: '◎', hue: '#10b981' },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Avatar — state-driven, pure CSS animated
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ state }: { state: AvState }) {
  const ringColor: Record<AvState, string> = {
    idle:       'rgba(63,63,70,0.6)',
    thinking:   'rgba(139,92,246,0.7)',
    responding: 'rgba(139,92,246,0.9)',
    executing:  'rgba(245,158,11,0.7)',
  }
  const glowColor: Record<AvState, string> = {
    idle:       'none',
    thinking:   '0 0 28px rgba(139,92,246,0.4)',
    responding: '0 0 24px rgba(139,92,246,0.3)',
    executing:  '0 0 28px rgba(245,158,11,0.35)',
  }
  const dotColor: Record<AvState, string> = {
    idle:       '#3f3f46',
    thinking:   '#a855f7',
    responding: '#10b981',
    executing:  '#f59e0b',
  }
  const stateLabel: Record<AvState, string> = {
    idle:       'STANDBY',
    thinking:   'THINKING',
    responding: 'RESPONDING',
    executing:  'EXECUTING',
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none w-full">
      {/* Portrait */}
      <div
        style={{
          position:     'relative',
          width:        '100%',
          maxWidth:     '180px',
          aspectRatio:  '3/4',
          borderRadius: '14px',
          overflow:     'hidden',
          background:   'transparent',
          border:       `2px solid ${ringColor[state]}`,
          boxShadow:    glowColor[state],
          transition:   'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/javari-portrait-v3.png"
          alt="Javari AI"
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top', display: 'block' }}
          draggable={false}
          onError={e => {
            // Portrait missing — swap to default avatar, then gradient on second fail
            const img = e.currentTarget as HTMLImageElement
            if (img.src.includes('javari-portrait')) {
              img.src = '/default-avatar.png'
              img.style.objectFit = 'cover'
            } else {
              img.style.display = 'none'
              const parent = img.parentElement
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, #3f3f46 0%, #27272a 40%, #1c1c1f 100%)'
                parent.setAttribute('data-avatar-fallback', '1')
              }
            }
          }}
        />
        {/* Status dot */}
        <div style={{
          position:         'absolute',
          bottom:           '6px',
          right:            '6px',
          width:            '10px',
          height:           '10px',
          borderRadius:     '50%',
          backgroundColor:  dotColor[state],
          border:           '1.5px solid rgba(0,0,0,0.4)',
          transition:       'background-color 0.3s ease',
          animation:        (state === 'thinking' || state === 'executing') ? 'av-blink 1.4s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* State badge */}
      <div style={{
        fontFamily:      'monospace',
        fontSize:        '11px',
        letterSpacing:   '0.2em',
        color:           state === 'idle' ? '#71717a' : state === 'thinking' ? '#a855f7' : state === 'responding' ? '#a855f7' : '#f59e0b',
        animation:       (state === 'thinking' || state === 'executing') ? 'av-blink 1.4s ease-in-out infinite' : 'none',
        transition:      'color 0.3s ease',
      }}>
        {stateLabel[state]}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar section wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SideSection({
  label, icon, accent = 'zinc', children, collapsible = false, defaultOpen = true,
}: {
  label: string
  icon?: React.ReactNode
  accent?: 'violet' | 'blue' | 'emerald' | 'amber' | 'zinc'
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const accentColor = {
    violet:  '#a855f7',
    blue:    '#3b82f6',
    emerald: '#10b981',
    amber:   '#f59e0b',
    zinc:    '#52525b',
  }[accent]

  return (
    <div className="jv-side-section" style={{ borderBottom: '1px solid var(--jv-border)', paddingBottom: '0' }}>
      <button
        onClick={() => collapsible && setOpen(v => !v)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '10px 16px',
          background:     'transparent',
          border:         'none',
          cursor:         collapsible ? 'pointer' : 'default',
          borderBottom:   '1px solid var(--jv-border)',
        }}
      >
        {icon && <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</span>}
        <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', color: accentColor, textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>
          {label}
        </span>
        {collapsible && (
          <span style={{ color: '#71717a', fontSize: '11px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        )}
      </button>
      {(!collapsible || open) && (
        <div style={{ padding: '12px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic'

export default function JavariOSPage() {
  // ── State — all v2 state preserved ────────────────────────────────────────
  const [mode,        setMode]        = useState<Mode>('single')
  const [avState,     setAvState]     = useState<AvState>('idle')
  const [messages,    setMessages]    = useState<Msg[]>([
    { id: '0', role: 'system', content: 'JAVARI OS — online', ts: Date.now() }
  ])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [modeOpen,    setModeOpen]    = useState(false)
  const [ensemble,    setEnsemble]    = useState<EnsembleStep[]>([])
  const [execRows,    setExecRows]    = useState<ExecRow[]>([])
  const [sysStatus,   setSysStatus]   = useState<SysStatus | null>(null)
  const [execPulse,   setExecPulse]   = useState(false)
  // Sidebar collapsed by default — chat owns the viewport
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Active agent: task_id currently running (cleared on complete/error)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  // Demo mode — not persisted, resets on refresh
  const [demoMode,   setDemoMode]   = useState(false)
  const [demoBanner, setDemoBanner] = useState(false)
  // Execution history
  const [executions,        setExecutions]        = useState<ExecHistoryRow[]>([])
  const [selectedExecution, setSelectedExecution] = useState<ExecDetailResult | null>(null)
  const [historyLoading,    setHistoryLoading]    = useState(false)
  // Replay confirmation banner text — clears after 3s
  const [replayMsg, setReplayMsg] = useState<string | null>(null)

  // ── TEAM execution state ───────────────────────────────────────────────────
  const [isExecuting,     setIsExecuting]     = useState(false)
  const [executionResult, setExecutionResult] = useState<TeamExecutionResult | null>(null)

  // ── Font scale — user-adjustable, persisted to localStorage ───────────────
  const [fontScale, setFontScale] = useState<number>(1)

  // ── Theme — dark / light / contrast, persisted to localStorage ───────────
  const [theme, setTheme] = useState<Theme>('dark')

  // ── Auth session ───────────────────────────────────────────────────────────
  const supabase    = createClientComponentClient()
  const [userId,    setUserId]    = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [userTier,  setUserTier]  = useState<string>('free')

  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  // ── Status polling ─────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/autonomy/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!data.ok) return
      const c = data.canonical ?? {}
      setSysStatus({
        total:       c.total     ?? 275,
        completed:   c.completed ?? 0,
        verified:    c.verified  ?? 0,
        pending:     c.pending   ?? 0,
        phase:       data.system?.active_phase ?? 2,
        mode:        data.system?.mode         ?? 'BUILD',
        pct:         c.pct_verified            ?? 0,
        budget:      data.system?.budget_left  ?? 0,
        budgetSpent: data.system?.budget_spent ?? 0,
        budgetTotal: data.system?.budget_daily ?? 1.00,
      })
      const recent: Array<Record<string,unknown>> = data.recent_executions ?? []
      if (recent.length) {
        setExecRows(recent.slice(0, 8).map((e, i) => ({
          id:       String(e.id ?? i),
          title:    String(e.id ?? 'Task').split(':').slice(-1)[0].replace(/-/g, ' '),
          module:   String(e.type ?? '—'),
          model:    String(e.model ?? ''),
          status:   String(e.status ?? 'unknown'),
          verified: Boolean(e.verification),
          cost:     Number(e.cost ?? 0),
          ts:       Date.now() - i * 30000,
        })))
      }
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    loadStatus()
    const t = setInterval(loadStatus, 15_000)
    return () => clearInterval(t)
  }, [loadStatus])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id)
        setAuthToken(session.access_token)
      }
    })
  }, [supabase])

  // Load persisted font scale on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('javari_font_scale')
      if (stored) {
        const parsed = parseFloat(stored)
        if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 1.4) {
          setFontScale(parsed)
        }
      }
    } catch { /* localStorage unavailable (SSR/private browsing) — use default */ }
  }, [])

  // Load persisted theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('javari_theme') as Theme | null
      if (stored === 'dark' || stored === 'light' || stored === 'contrast') {
        setTheme(stored)
      }
    } catch { /* non-fatal */ }
  }, [])

  // ── Send message — v2 logic preserved 100% ────────────────────────────────
  const send = useCallback(async (override?: string) => {
    const content = (override ?? input).trim()
    if (!content || loading) return
    setMessages(m => [...m, { id: Date.now().toString(), role: 'user', content, ts: Date.now() }])
    setInput('')
    setLoading(true)
    setAvState('thinking')
    setEnsemble([])

    fetch('/api/javari/learning/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer javari-cron-2025-phase2-autonomous' },
      body: JSON.stringify({
        records: [{ task_id: `chat-${Date.now()}`, task_title: content.slice(0, 100), task_source: 'javari_ui', task_type: 'chat', status: 'completed', canonical_valid: false, phase_id: '', cycle_id: `ui-${Date.now()}` }],
      }),
    }).catch(() => {})

    try {
      if (mode === 'council') {
        const teamHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (authToken) teamHeaders['Authorization'] = `Bearer ${authToken}`
        const res  = await fetch('/api/javari/team', {
          method: 'POST', headers: teamHeaders,
          body: JSON.stringify({ message: content, userId: userId ?? undefined, userTier }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        if (data.ensemble?.length) setEnsemble(data.ensemble)
        if (data.ensemble?.length) {
          const agentMsgs: Msg[] = data.ensemble.map((step: EnsembleStep) => ({
            id:      Date.now().toString() + Math.random(),
            role:    'agent' as const,
            agent:   step.role as 'planner' | 'builder' | 'validator',
            content: step.content,
            model:   step.model,
            tier:    step.tier,
            ts:      Date.now(),
          }))
          setMessages(m => [...m, ...agentMsgs])
        }
        if (data.content) {
          setAvState('responding')
          setMessages(m => [...m, {
            id: Date.now().toString(), role: 'assistant',
            content: data.content, model: data.model, ts: Date.now(),
          }])
        }
      } else {
        const chatHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (authToken) chatHeaders['Authorization'] = `Bearer ${authToken}`
        const res  = await fetch('/api/javari/chat', {
          method: 'POST', headers: chatHeaders,
          body: JSON.stringify({ message: content, history: messages.map(m => ({ role: m.role === 'agent' ? 'assistant' : m.role, content: m.content })), userId: userId ?? undefined, userTier }),
        })
        const data = await res.json()
        if (data.error || data.blocked) throw new Error(data.error ?? 'Blocked')
        setAvState('responding')
        setMessages(m => [...m, {
          id: Date.now().toString(), role: 'assistant',
          content: data.content, model: data.model, tier: data.tier, ts: Date.now(),
        }])
      }
    } catch (err: unknown) {
      setMessages(m => [...m, {
        id: Date.now().toString(), role: 'assistant', error: true,
        content: err instanceof Error ? err.message : String(err), ts: Date.now(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => setAvState('idle'), 2000)
    }
  }, [input, loading, mode, authToken, userId, userTier, messages])

  // ── Run Loop — v2 logic preserved 100% ────────────────────────────────────
  const runLoop = useCallback(async () => {
    if (avState === 'executing') return
    setAvState('executing')
    setExecPulse(true)
    try {
      const res  = await fetch('/api/autonomy/loop')
      const data = await res.json()
      if (data.executed?.length) {
        const newRows: ExecRow[] = data.executed.map((e: Record<string,unknown>, i: number) => ({
          id:       String(e.id ?? i),
          title:    String(e.title ?? 'Task'),
          module:   String(e.module ?? e.task_type ?? ''),
          model:    String(e.model ?? ''),
          status:   String(e.status ?? 'completed'),
          verified: Boolean(e.verified),
          cost:     Number(e.cost ?? 0),
          ts:       Date.now(),
        }))
        setExecRows(prev => [...newRows, ...prev].slice(0, 20))
        setMessages(m => [...m, {
          id: Date.now().toString(), role: 'system',
          content: `⚡ Loop: ${data.completed_verified ?? data.tasks_run ?? 0} tasks executed — ${data.daily_spend}`,
          ts: Date.now(),
        }])
        await loadStatus()
      }
    } catch { /* non-fatal */ }
    finally {
      setTimeout(() => { setAvState('idle'); setExecPulse(false) }, 3000)
    }
  }, [avState, loadStatus])

  const clearChat = useCallback(() => {
    setMessages([{ id: Date.now().toString(), role: 'system', content: 'Session cleared.', ts: Date.now() }])
    setEnsemble([])
  }, [])

  // ── Font scale helper — persists to localStorage ─────────────────────────
  const applyFontScale = useCallback((scale: number) => {
    setFontScale(scale)
    try { localStorage.setItem('javari_font_scale', String(scale)) } catch { /* non-fatal */ }
  }, [])

  // ── Theme helper — persists to localStorage ───────────────────────────────
  const applyTheme = useCallback((t: Theme) => {
    setTheme(t)
    try { localStorage.setItem('javari_theme', t) } catch { /* non-fatal */ }
  }, [])

  // ── TEAM SSE Event Handler ────────────────────────────────────────────────
  // Called for each SSE event as it arrives off the stream.
  // All state mutations are batched through React — no intermediate flushes needed.
  const handleStreamEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {

      case 'start':
        // Plan accepted — initialize result with empty task list + running status
        setExecutionResult({
          plan_id:    event.plan_id,
          total_cost: 0,
          status:     'running',
          results:    [],
        })
        setMessages(m => [...m, {
          id:      Date.now().toString(),
          role:    'system',
          content: `⚡ TEAM PLAN [${event.plan_id}] — STARTED`,
          ts:      Date.now(),
        }])
        break

      case 'task_start':
        // Micro-delay: 400ms so humans can perceive each step firing
        setTimeout(() => {
          setActiveTaskId(event.task_id)
          setExecRows(prev => {
            if (prev.some(r => r.id === event.task_id)) {
              // Already present — just mark running
              return prev.map(r => r.id === event.task_id ? { ...r, status: 'running' } : r)
            }
            return [{
              id:       event.task_id,
              title:    event.task_id.replace(/-/g, ' '),
              module:   'team',
              model:    '',
              status:   'running',
              verified: false,
              cost:     0,
              ts:       Date.now(),
            }, ...prev].slice(0, 20)
          })
        }, demoMode ? 800 : 400)
        break

      case 'task_complete': {
        const r = event.result
        // Micro-delay: 300ms so the transition from running → complete is perceptible
        setTimeout(() => {
          setActiveTaskId(prev => prev === r.task_id ? null : prev)
          setExecutionResult(prev => {
            if (!prev) return prev
            const existing = prev.results.findIndex(t => t.task_id === r.task_id)
            const updated  = existing >= 0
              ? prev.results.map((t, i) => i === existing ? r : t)
              : [...prev.results, r]
            return { ...prev, results: updated, total_cost: updated.reduce((s, t) => s + (t.cost_used ?? 0), 0) }
          })
          setExecRows(prev => prev.map(row =>
            row.id === r.task_id
              ? { ...row, status: 'completed', verified: true, cost: r.cost_used }
              : row
          ))
        }, demoMode ? 600 : 300)
        break
      }

      case 'task_error': {
        const r = event.result
        setTimeout(() => {
          setActiveTaskId(prev => prev === r.task_id ? null : prev)
          setExecutionResult(prev => {
            if (!prev) return prev
            const existing = prev.results.findIndex(t => t.task_id === r.task_id)
            const updated  = existing >= 0
              ? prev.results.map((t, i) => i === existing ? r : t)
              : [...prev.results, r]
            return { ...prev, results: updated }
          })
          setExecRows(prev => prev.map(row =>
            row.id === r.task_id
              ? { ...row, status: 'failed', verified: false, cost: r.cost_used }
              : row
          ))
        }, demoMode ? 600 : 300)
        break
      }

      case 'complete': {
        // Final summary — seal the result with authoritative cost + status
        setExecutionResult(prev => {
          if (!prev) return prev
          return {
            ...prev,
            plan_id:      event.plan_id ?? prev.plan_id,
            execution_id: event.execution_id,
            total_cost:   event.total_cost ?? prev.total_cost,
            status:       event.status,
          }
        })
        const cost = typeof event.total_cost === 'number' ? event.total_cost.toFixed(6) : '—'
        setMessages(m => [...m, {
          id:      Date.now().toString(),
          role:    'system',
          content: `⚡ TEAM PLAN [${event.plan_id}] — ${event.status.toUpperCase()} — ${event.task_count ?? '?'} tasks — $${cost}`,
          ts:      Date.now(),
        }])
        if (demoMode) {
          const agentN = event.task_count ?? '?'
          const costN  = typeof event.total_cost === 'number' ? event.total_cost.toFixed(6) : '0'
          setTimeout(() => {
            setMessages(m => [...m, {
              id:      Date.now().toString(),
              role:    'assistant',
              content: `Execution complete — Javari coordinated ${agentN} AI agents to deliver this result in real time. Each agent handled a distinct phase: architecture, implementation, review, and delivery. Total compute cost: $${costN}.`,
              ts:      Date.now(),
            }])
          }, 1200)
        }
        // Refresh history so sidebar shows the new execution
        loadExecutionHistory()
        break
      }

      case 'error':
        setExecutionResult(prev => prev
          ? { ...prev, status: 'failed', error: event.message }
          : { plan_id: '', total_cost: 0, status: 'failed', results: [], error: event.message }
        )
        setMessages(m => [...m, {
          id: Date.now().toString(), role: 'assistant', error: true,
          content: `TEAM execution error: ${event.message}`, ts: Date.now(),
        }])
        break

      case 'aborted':
        setExecutionResult(prev => prev
          ? { ...prev, status: 'aborted' }
          : { plan_id: '', total_cost: 0, status: 'aborted', results: [] }
        )
        setMessages(m => [...m, {
          id: Date.now().toString(), role: 'system',
          content: 'Execution stopped by user.',
          ts: Date.now(),
        }])
        setReplayMsg(null)
        break
    }
  }, [demoMode])

  // ── Execution History ────────────────────────────────────────────────────
  const loadExecutionHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/javari/executions', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setExecutions(data.executions ?? [])
    } catch { /* non-fatal — unavailable until DB migrated */ }
  }, [])

  const loadExecution = useCallback(async (id: string) => {
    setHistoryLoading(true)
    setSelectedExecution(null)
    try {
      const res = await fetch(`/api/javari/executions?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data: ExecDetailResult = await res.json()
      setSelectedExecution(data)
    } catch { /* non-fatal */ } finally { setHistoryLoading(false) }
  }, [])

  // ── Replay helpers ────────────────────────────────────────────────────────
  // Plain functions (not useCallback) — only called on user interaction,
  // never during render. Avoids circular closure chain that breaks SSR prerender.

  function replayExecution(exec: ExecDetailResult) {
    const plan = {
      plan_id:              `replay-${exec.execution.plan_id.slice(0, 20)}-${Date.now().toString(36)}`,
      created_at:           new Date().toISOString(),
      total_estimated_cost: exec.tasks.reduce((s, t) => s + Math.max(t.cost_used ?? 0, 0.001), 0),
      tasks: exec.tasks.map(t => ({
        id:           t.task_id,
        role:         t.role,
        objective:    t.output
          ? (() => { try { const p = JSON.parse(t.output!); return p.blueprint ?? p.summary ?? t.output!.slice(0, 200) } catch { return t.output!.slice(0, 200) } })()
          : t.error ?? 'Re-run task',
        inputs:       [],
        outputs:      [],
        dependencies: [],
        model:        'gpt-4o-mini',
        max_cost:     Math.max(t.cost_used ?? 0, 0.001),
        status:       'pending' as const,
      })),
    }
    setSelectedExecution(null)
    setExecutionResult(null)
    setReplayMsg(`Re-running "${exec.execution.plan_id.slice(0, 30)}"...`)
    setTimeout(() => setReplayMsg(null), 3000)
    runTeamExecution(plan)
    setSidebarOpen(true)
  }

  function editAndRun(exec: ExecDetailResult) {
    const roles   = [...new Set(exec.tasks.map(t => t.role))].join(', ')
    const summary = `Re-run: ${exec.execution.plan_id} — roles: ${roles} — ${exec.tasks.length} tasks`
    setInput(summary)
    if (textRef.current) {
      textRef.current.value = summary
      textRef.current.focus()
    }
    setSelectedExecution(null)
    setReplayMsg('Plan loaded into input — edit and press ENTER or Run with AI Team')
    setTimeout(() => setReplayMsg(null), 4000)
  }

  function retryFailed(exec: ExecDetailResult) {
    const failed = exec.tasks.filter(t => t.status === 'failed')
    if (failed.length === 0) return
    const retryPlan = {
      plan_id:              `${exec.execution.plan_id.slice(0, 28)}-retry`,
      created_at:           new Date().toISOString(),
      total_estimated_cost: failed.reduce((s, t) => s + Math.max(t.cost_used ?? 0, 0.001), 0),
      tasks: failed.map(t => ({
        id:           `${t.task_id}-retry`,
        role:         t.role,
        objective:    t.output
          ? (() => { try { const p = JSON.parse(t.output!); return p.blueprint ?? p.summary ?? t.output!.slice(0, 200) } catch { return t.output!.slice(0, 200) } })()
          : t.error ?? 'Retry task',
        inputs:       [],
        outputs:      [],
        dependencies: [],   // flat retry — no inter-task deps
        model:        'gpt-4o-mini',
        max_cost:     Math.max(t.cost_used ?? 0, 0.001),
        status:       'pending' as const,
      })),
    }
    setSelectedExecution(null)
    setExecutionResult(null)
    setReplayMsg(`Retrying ${failed.length} failed task${failed.length !== 1 ? 's' : ''}...`)
    setTimeout(() => setReplayMsg(null), 3000)
    runTeamExecution(retryPlan)
    setSidebarOpen(true)
  }

  async function stopExecution() {
    if (!executionResult?.execution_id) return
    try {
      await fetch('/api/javari/executions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'abort', execution_id: executionResult.execution_id }),
      })
      // Optimistic UI update — SSE 'aborted' event will confirm
      setReplayMsg('Stop signal sent — execution will halt after current task...')
      setTimeout(() => setReplayMsg(null), 4000)
    } catch {
      // Non-fatal — the engine will time out or complete naturally
      setReplayMsg('Stop signal failed — execution may continue')
      setTimeout(() => setReplayMsg(null), 3000)
    }
  }

  function resumeExecution(exec: ExecDetailResult) {
    const completed = exec.tasks.filter(t => t.status === 'complete')
    const failed    = exec.tasks.filter(t => t.status === 'failed')
    if (failed.length === 0) return

    // Continuation plan:
    // - Completed tasks are included as status:'complete' with cost 0
    //   so the engine records them as already done without re-running
    // - Failed tasks get -retry suffix, depend on all completed tasks,
    //   and receive completed outputs as inputs
    const completedOutputs = completed
      .map(t => {
        if (!t.output) return null
        try { const p = JSON.parse(t.output); return p.blueprint ?? p.summary ?? t.output.slice(0, 200) }
        catch { return t.output.slice(0, 200) }
      })
      .filter((v): v is string => v !== null)

    const continuationPlan = {
      plan_id:              `${exec.execution.plan_id.slice(0, 24)}-resume`,
      created_at:           new Date().toISOString(),
      total_estimated_cost: failed.reduce((s, t) => s + Math.max(t.cost_used ?? 0, 0.001), 0),
      tasks: [
        // Completed tasks — pre-seeded as done, cost 0, no deps
        ...completed.map(t => ({
          id:           t.task_id,
          role:         t.role,
          objective:    t.output
            ? (() => { try { const p = JSON.parse(t.output!); return p.blueprint ?? p.summary ?? t.output!.slice(0, 200) } catch { return t.output!.slice(0, 200) } })()
            : '',
          inputs:       [],
          outputs:      [],
          dependencies: [],
          model:        'gpt-4o-mini',
          max_cost:     0,
          status:       'complete' as const,
        })),
        // Failed tasks — depend on all completed tasks, receive their outputs as inputs
        ...failed.map(t => ({
          id:           `${t.task_id}-retry`,
          role:         t.role,
          objective:    t.error ?? t.output?.slice(0, 200) ?? 'Resume task',
          inputs:       completedOutputs,
          outputs:      [],
          dependencies: completed.map(c => c.task_id),
          model:        'gpt-4o-mini',
          max_cost:     Math.max(t.cost_used ?? 0, 0.001),
          status:       'pending' as const,
        })),
      ],
    }

    setSelectedExecution(null)
    setExecutionResult(null)
    setReplayMsg(`Resuming execution from failure — ${completed.length} task${completed.length !== 1 ? 's' : ''} carried forward...`)
    setTimeout(() => setReplayMsg(null), 4000)
    runTeamExecution(continuationPlan)
    setSidebarOpen(true)
  }

  // ── TEAM Execution — SSE streaming via ReadableStream reader ─────────────
  const runTeamExecution = useCallback(async (plan: unknown) => {
    if (isExecuting) return
    setIsExecuting(true)
    setExecutionResult(null)
    setAvState('executing')
    setExecPulse(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const res = await fetch('/api/javari/team', {
        method:  'POST',
        headers,
        body:    JSON.stringify(plan),
      })

      if (!res.ok || !res.body) {
        // Non-200 or no body — fall back to JSON error parse
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error ?? `HTTP ${res.status}`)
      }

      // ── SSE stream reader ──────────────────────────────────────────────────
      const reader  = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE frames are delimited by double-newline
        const SSE_DELIMITER = '\n\n'
        const frames = buffer.split(SSE_DELIMITER)
        // Last element is a partial frame (or empty) — keep in buffer
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const line = frame.trim()
          if (!line.startsWith('data:')) continue
          const raw = line.slice('data:'.length).trim()
          if (!raw) continue
          try {
            const evt = JSON.parse(raw) as SSEEvent
            handleStreamEvent(evt)
          } catch {
            // Malformed SSE frame — skip, don't abort stream
          }
        }
      }

      // Flush any remaining buffer content (stream ended without a final delimiter)
      const trailing = buffer.trim()
      if (trailing.startsWith('data:')) {
        const raw = trailing.slice('data:'.length).trim()
        if (raw) {
          try { handleStreamEvent(JSON.parse(raw) as SSEEvent) } catch { /* ignore */ }
        }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setExecutionResult({ plan_id: '', total_cost: 0, status: 'failed', results: [], error: msg })
      setMessages(m => [...m, {
        id: Date.now().toString(), role: 'assistant', error: true,
        content: `TEAM execution failed: ${msg}`, ts: Date.now(),
      }])
    } finally {
      setIsExecuting(false)
      setTimeout(() => { setAvState('idle'); setExecPulse(false) }, 3000)
    }
  }, [isExecuting, authToken, handleStreamEvent])

  // Demo mode — fires auto-execution after 800ms, shows banner
  useEffect(() => {
    if (!demoMode) return
    setDemoBanner(true)
    const demoPlan = {
      plan_id:              `demo-${Date.now().toString(36)}`,
      created_at:           new Date().toISOString(),
      total_estimated_cost: 0.008,
      tasks: [
        { id: 'task-architect', role: 'architect', objective: 'Design a full SaaS business plan including product, marketing, and monetization strategy', inputs: [], outputs: ['blueprint'], dependencies: [], model: 'gpt-4o-mini', max_cost: 0.002, status: 'pending' },
        { id: 'task-builder',   role: 'builder',   objective: 'Build out the detailed product and technical specification', inputs: ['blueprint'], outputs: ['product-spec'], dependencies: ['task-architect'], model: 'deepseek-chat', max_cost: 0.002, status: 'pending' },
        { id: 'task-reviewer',  role: 'reviewer',  objective: 'Review the product spec for market fit, risks, and completeness', inputs: ['product-spec'], outputs: ['review'], dependencies: ['task-builder'], model: 'claude-3-haiku', max_cost: 0.002, status: 'pending' },
        { id: 'task-deployer',  role: 'deployer',  objective: 'Prepare the final executive summary and go-to-market plan', inputs: ['product-spec', 'review'], outputs: ['executive-summary'], dependencies: ['task-reviewer'], model: 'gpt-4o-mini', max_cost: 0.002, status: 'pending' },
      ],
    }
    if (textRef.current) {
      textRef.current.value = 'Build a full SaaS business plan including product, marketing, and monetization strategy'
      setInput('Build a full SaaS business plan including product, marketing, and monetization strategy')
    }
    const t = setTimeout(() => { runTeamExecution(demoPlan) }, 800)
    return () => clearTimeout(t)
  }, [demoMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss demo banner after 5s
  useEffect(() => {
    if (!demoBanner) return
    const t = setTimeout(() => setDemoBanner(false), 5000)
    return () => clearTimeout(t)
  }, [demoBanner])

  // Load execution history on mount
  useEffect(() => { loadExecutionHistory() }, [loadExecutionHistory])

  // Primary action prompts — fill input on click
  const PRIMARY_ACTIONS: { label: string; prompt: string; icon: string }[] = [
    { label: 'Build something',       prompt: 'Build a full-stack feature: user authentication with email/password, JWT sessions, and a dashboard page.',          icon: '⚡' },
    { label: 'Analyze a business',    prompt: 'Analyze the business model, strengths, and risks of a SaaS startup targeting small business owners.',              icon: '◈' },
    { label: 'Create content',        prompt: 'Create a full content campaign: landing page copy, 3 email sequences, and 5 social posts for a product launch.',   icon: '◉' },
    { label: 'Automate a workflow',   prompt: 'Design and automate a lead capture workflow: form submission → CRM entry → welcome email → sales alert.',          icon: '◎' },
  ]
  const PROMPTS = PRIMARY_ACTIONS.map(a => a.prompt)

  // ── Theme token resolver ───────────────────────────────────────────────────
  // All theme-conditional values live here. Components read T.x — never branch
  // on `theme` inline. Adding a new theme = one new column in this object.
  const T = {
    // Root canvas
    bg:           theme === 'light' ? '#f4f4f5' : theme === 'contrast' ? '#000000' : '#050507',
    bgPanel:      theme === 'light' ? '#ffffff'  : theme === 'contrast' ? '#0a0a0a' : 'rgba(0,0,0,0.4)',
    bgHeader:     theme === 'light' ? 'rgba(255,255,255,0.95)' : theme === 'contrast' ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0.7)',
    bgInput:      theme === 'light' ? 'rgba(244,244,245,0.8)' : theme === 'contrast' ? '#000000' : 'rgba(24,24,27,0.5)',
    bgMsgUser:    theme === 'light' ? 'rgba(0,0,0,0.03)' : theme === 'contrast' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
    bgSectionHdr: theme === 'light' ? 'rgba(0,0,0,0.03)' : theme === 'contrast' ? '#000000' : 'transparent',
    bgExecHdr:    theme === 'light' ? 'rgba(0,0,0,0.04)' : theme === 'contrast' ? '#000000' : 'rgba(0,0,0,0.3)',
    // Text
    textPrimary:  theme === 'light' ? '#111111' : theme === 'contrast' ? '#ffffff'  : '#e4e4e7',
    textSecond:   theme === 'light' ? '#374151' : theme === 'contrast' ? '#f4f4f5'  : '#d4d4d8',
    textTertiary: theme === 'light' ? '#6b7280' : theme === 'contrast' ? '#e4e4e7'  : '#a1a1aa',
    textMuted:    theme === 'light' ? '#9ca3af' : theme === 'contrast' ? '#d1d5db'  : '#71717a',
    textFaint:    theme === 'light' ? '#d1d5db' : theme === 'contrast' ? '#9ca3af'  : '#52525b',
    textUser:     theme === 'light' ? '#1f2937' : theme === 'contrast' ? '#ffffff'  : '#d4d4d8',
    textSystem:   theme === 'light' ? '#9ca3af' : theme === 'contrast' ? '#9ca3af'  : '#52525b',
    textError:    '#f87171',
    // Borders
    border:       theme === 'light' ? '#e5e7eb' : theme === 'contrast' ? '#ffffff'  : '#18181b',
    borderMid:    theme === 'light' ? '#d1d5db' : theme === 'contrast' ? '#e4e4e7'  : '#27272a',
    borderStrong: theme === 'light' ? '#9ca3af' : theme === 'contrast' ? '#ffffff'  : '#3f3f46',
    // Scanlines — off in light/contrast
    scanlines:    theme === 'dark',
  } as const

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global styles ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes av-blink  { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes av-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes jv-slide-in { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes jv-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes jv-exec-in { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }

        .av-blink    { animation: av-blink 1.4s ease-in-out infinite }
        .av-spin     { animation: av-spin  3s linear infinite }
        .jv-slide-in { animation: jv-slide-in 0.3s ease forwards }
        .jv-msg-in   { animation: jv-msg-in  0.25s ease forwards }
        .jv-exec-in  { animation: jv-exec-in 0.2s ease forwards }

        /* Custom scrollbar — thin, dark */
        .jv-scroll::-webkit-scrollbar       { width: 3px }
        .jv-scroll::-webkit-scrollbar-track { background: transparent }
        .jv-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px }
        .jv-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46 }

        /* Scanlines overlay */
        .jv-scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.10) 3px,
            rgba(0,0,0,0.10) 4px
          );
          z-index: 1;
        }

        /* Sidebar nav pill active */
        .jv-pill-active-cyan  { background: rgba(6,182,212,0.15); border-color: rgba(6,182,212,0.5); color: #06b6d4 }
        .jv-pill-active-purple { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.5); color: #a855f7 }
        .jv-pill-inactive { background: rgba(24,24,27,0.6); border-color: #3f3f46; color: #71717a }
        .jv-pill-inactive:hover { border-color: #52525b; color: #a1a1aa }

        /* Exec row hover */
        .jv-exec-row:hover { background: rgba(245,158,11,0.05) }

        /* Chat message hover */
        .jv-chat-row:hover { background: rgba(255,255,255,0.02) }

        /* Running task shimmer */
        @keyframes jv-shimmer {
          0%   { background-position: -200% center }
          100% { background-position:  200% center }
        }
        .jv-running {
          background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.12) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: jv-shimmer 1.6s ease infinite;
        }

        /* Agent active glow ring */
        @keyframes jv-agent-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.0) }
          50%     { box-shadow: 0 0 0 4px rgba(245,158,11,0.25) }
        }
        .jv-agent-active {
          animation: jv-agent-pulse 1.4s ease-in-out infinite;
          border-color: rgba(245,158,11,0.55) !important;
          background: rgba(245,158,11,0.06) !important;
        }

        /* Completed row fade-in check */
        @keyframes jv-check-pop {
          0%   { transform: scale(0.5); opacity: 0 }
          70%  { transform: scale(1.2) }
          100% { transform: scale(1);   opacity: 1 }
        }
        .jv-check-pop { animation: jv-check-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards }

        /* Sidebar width transition */
        .jv-sidebar { transition: width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1) }

        /* Exec strip height transition */
        .jv-exec-strip { transition: height 0.3s cubic-bezier(0.4,0,0.2,1), min-height 0.3s cubic-bezier(0.4,0,0.2,1) }

        /* Remove heavy section dividers */
        .jv-side-section { border-bottom: none !important }
        .jv-side-section > button { border-bottom: none !important }

        /* ── Light theme overrides ─────────────────────────────────────── */
        [data-theme="light"] .jv-pill-inactive { background: rgba(0,0,0,0.04); border-color: #d1d5db; color: #6b7280 }
        [data-theme="light"] .jv-pill-inactive:hover { border-color: #9ca3af; color: #374151 }
        [data-theme="light"] .jv-pill-active-cyan  { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.6); color: #0891b2 }
        [data-theme="light"] .jv-pill-active-purple { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.6); color: #9333ea }
        [data-theme="light"] .jv-chat-row:hover { background: rgba(0,0,0,0.02) }
        [data-theme="light"] .jv-exec-row:hover { background: rgba(245,158,11,0.06) }
        [data-theme="light"] .jv-scroll::-webkit-scrollbar-thumb { background: #d1d5db }
        [data-theme="light"] .jv-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af }

        /* ── High contrast overrides ───────────────────────────────────── */
        [data-theme="contrast"] .jv-pill-inactive { background: transparent; border-color: #4b5563; color: #d1d5db }
        [data-theme="contrast"] .jv-pill-inactive:hover { border-color: #9ca3af; color: #ffffff }
        [data-theme="contrast"] .jv-pill-active-cyan  { background: rgba(6,182,212,0.2); border-color: #06b6d4; color: #67e8f9 }
        [data-theme="contrast"] .jv-pill-active-purple { background: rgba(168,85,247,0.2); border-color: #a855f7; color: #d8b4fe }
        [data-theme="contrast"] .jv-chat-row:hover { background: rgba(255,255,255,0.04) }
        [data-theme="contrast"] .jv-exec-row:hover { background: rgba(245,158,11,0.08) }
      `}</style>

      {/* ── Root — fixed inset-0 z-50 ───────────────────────────────────── */}
      <div
        className={T.scanlines ? 'jv-scanlines' : undefined}
        data-theme={theme}
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        50,
          background:    T.bg,
          color:         T.textPrimary,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          fontFamily:    'monospace',
          fontSize:      `${fontScale}rem`,
          // CSS vars consumed by SideSection and any child without T access
          '--jv-border':       T.border,
          '--jv-border-mid':   T.borderMid,
          '--jv-bg-panel':     T.bgPanel,
          '--jv-text-muted':   T.textMuted,
          '--jv-text-faint':   T.textFaint,
          '--jv-text-primary': T.textPrimary,
        } as React.CSSProperties}
        onClick={() => setModeOpen(false)}
      >

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header style={{
          flexShrink:     0,
          height:         '52px',
          minHeight:      '52px',
          display:        'flex',
          alignItems:     'center',
          padding:        '0 20px',
          gap:            '16px',
          borderBottom:   '1px solid #18181b',
          background:     T.bgHeader,
          backdropFilter: 'blur(8px)',
          zIndex:         20,
          position:       'relative',
        }}>
          {/* Logo */}
          <div style={{ flexShrink: 0, height: '36px', display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/javari-logo.png"
              alt="Javari AI"
              style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block' }}
              draggable={false}
            />
          </div>

          <div style={{ width: '1px', height: '20px', background: T.borderMid }} />

          {/* Mode pill toggle */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setMode('single')}
                className={mode === 'single' ? 'jv-pill-active-cyan' : 'jv-pill-inactive'}
                style={{
                  padding:      '5px 12px',
                  borderRadius: '20px',
                  border:       '1px solid',
                  fontSize:     '9px',
                  letterSpacing:'0.2em',
                  fontFamily:   'monospace',
                  cursor:       'pointer',
                  transition:   'all 0.2s ease',
                  fontWeight:   mode === 'single' ? 700 : 400,
                }}
              >
                ◉ SINGLE AI
              </button>
              <button
                onClick={() => setMode('council')}
                className={mode === 'council' ? 'jv-pill-active-purple' : 'jv-pill-inactive'}
                style={{
                  padding:      '5px 12px',
                  borderRadius: '20px',
                  border:       '1px solid',
                  fontSize:     '9px',
                  letterSpacing:'0.2em',
                  fontFamily:   'monospace',
                  cursor:       'pointer',
                  transition:   'all 0.2s ease',
                  fontWeight:   mode === 'council' ? 700 : 400,
                }}
              >
                ◈ AI COUNCIL
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Status strip — desktop only */}
          {sysStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
              <span style={{ color: sysStatus.mode === 'BUILD' ? '#60a5fa' : '#f59e0b', letterSpacing: '0.2em' }}>{sysStatus.mode}</span>
              <span style={{ color: T.textMuted }}>P{sysStatus.phase}</span>
              <span style={{ color: '#34d399', letterSpacing: '0.15em' }}>{sysStatus.pct}% VERIFIED</span>
              {/* Mini progress bar */}
              <div style={{ width: '60px', height: '2px', background: '#18181b', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sysStatus.pct}%`, background: 'linear-gradient(90deg,#7c3aed,#065f46)', transition: 'width 1s ease' }} />
              </div>
            </div>
          )}

          <div style={{ width: '1px', height: '20px', background: T.borderMid }} />

          {/* ── Theme control ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: T.textFaint, letterSpacing: '0.15em', marginRight: '2px', userSelect: 'none' }}>
              THEME
            </span>
            {([
              { label: '◐ DARK',     value: 'dark'     as Theme },
              { label: '○ LIGHT',    value: 'light'    as Theme },
              { label: '● CONTRAST', value: 'contrast' as Theme },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={e => { e.stopPropagation(); applyTheme(opt.value) }}
                style={{
                  padding:       '3px 8px',
                  fontFamily:    'monospace',
                  fontSize:      '10px',
                  fontWeight:    theme === opt.value ? 700 : 400,
                  color:         theme === opt.value ? T.textPrimary : T.textFaint,
                  background:    theme === opt.value ? (opt.value === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)') : 'transparent',
                  border:        `1px solid ${theme === opt.value ? T.borderStrong : T.borderMid}`,
                  borderRadius:  '5px',
                  cursor:        'pointer',
                  transition:    'all 0.15s ease',
                  letterSpacing: '0.1em',
                  whiteSpace:    'nowrap',
                }}
                onMouseEnter={e => {
                  if (theme !== opt.value) {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = T.textTertiary
                    el.style.borderColor = T.borderStrong
                  }
                }}
                onMouseLeave={e => {
                  if (theme !== opt.value) {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = T.textFaint
                    el.style.borderColor = T.borderMid
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: T.borderMid }} />

          {/* ── Font size control ───────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#52525b', letterSpacing: '0.15em', marginRight: '2px', userSelect: 'none' }}>
              SIZE
            </span>
            {([
              { label: 'A−', scale: 0.9,  title: 'Small'   },
              { label: 'A',  scale: 1.0,  title: 'Default' },
              { label: 'A+', scale: 1.1,  title: 'Large'   },
              { label: 'A⁺⁺',scale: 1.2, title: 'X-Large' },
            ] as { label: string; scale: number; title: string }[]).map(opt => (
              <button
                key={opt.scale}
                title={opt.title}
                onClick={e => { e.stopPropagation(); applyFontScale(opt.scale) }}
                style={{
                  padding:       '3px 7px',
                  fontFamily:    'monospace',
                  fontSize:      opt.scale === 0.9 ? '9px' : opt.scale === 1.0 ? '11px' : opt.scale === 1.1 ? '13px' : '14px',
                  fontWeight:    fontScale === opt.scale ? 700 : 400,
                  color:         fontScale === opt.scale ? '#e4e4e7' : '#52525b',
                  background:    fontScale === opt.scale ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border:        `1px solid ${fontScale === opt.scale ? '#71717a' : '#27272a'}`,
                  borderRadius:  '5px',
                  cursor:        'pointer',
                  transition:    'all 0.15s ease',
                  lineHeight:    1,
                }}
                onMouseEnter={e => {
                  if (fontScale !== opt.scale) {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = '#a1a1aa'
                    el.style.borderColor = '#3f3f46'
                    el.style.background  = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={e => {
                  if (fontScale !== opt.scale) {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = '#52525b'
                    el.style.borderColor = '#27272a'
                    el.style.background  = 'transparent'
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: T.borderMid }} />

          {/* Demo Mode toggle */}
          <button
            onClick={e => { e.stopPropagation(); setDemoMode(v => !v) }}
            title={demoMode ? 'Disable demo mode' : 'Enable demo mode'}
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '6px',
              padding:       '4px 10px',
              fontFamily:    'monospace',
              fontSize:      '10px',
              letterSpacing: '0.15em',
              fontWeight:    demoMode ? 700 : 400,
              color:         demoMode ? '#fbbf24' : T.textFaint,
              background:    demoMode ? 'rgba(245,158,11,0.1)' : 'transparent',
              border:        `1px solid ${demoMode ? 'rgba(251,191,36,0.5)' : T.borderMid}`,
              borderRadius:  '6px',
              cursor:        'pointer',
              transition:    'all 0.2s ease',
              flexShrink:    0,
            }}
            onMouseEnter={e => { if (!demoMode) { const el=e.currentTarget as HTMLElement; el.style.color=T.textTertiary; el.style.borderColor=T.borderStrong } }}
            onMouseLeave={e => { if (!demoMode) { const el=e.currentTarget as HTMLElement; el.style.color=T.textFaint;    el.style.borderColor=T.borderMid    } }}
          >
            <span style={{ display:'inline-block', width:'26px', height:'14px', borderRadius:'7px', background: demoMode ? '#f59e0b' : T.borderStrong, position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:'2px', left: demoMode ? '14px' : '2px', width:'10px', height:'10px', borderRadius:'50%', background:'#ffffff', transition:'left 0.18s cubic-bezier(0.4,0,0.2,1)', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
            </span>
            DEMO
          </button>

          {/* Stop Execution — visible only while executing */}
          {isExecuting && (
            <button
              onClick={stopExecution}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '6px',
                padding:       '4px 10px',
                fontFamily:    'monospace',
                fontSize:      '10px',
                letterSpacing: '0.15em',
                fontWeight:    600,
                color:         '#f87171',
                background:    'rgba(239,68,68,0.1)',
                border:        '1px solid rgba(248,113,113,0.4)',
                borderRadius:  '6px',
                cursor:        'pointer',
                transition:    'all 0.2s ease',
                flexShrink:    0,
                animation:     'av-blink 2s ease-in-out infinite',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background    = 'rgba(239,68,68,0.18)'
                el.style.borderColor   = 'rgba(248,113,113,0.7)'
                el.style.animation     = 'none'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background    = 'rgba(239,68,68,0.1)'
                el.style.borderColor   = 'rgba(248,113,113,0.4)'
                el.style.animation     = 'av-blink 2s ease-in-out infinite'
              }}
            >
              ■ STOP
            </button>
          )}

          <a
            href="/command-center"
            style={{
              fontFamily:    'monospace',
              fontSize:      '11px',
              letterSpacing: '0.2em',
              color:         T.textMuted,
              textDecoration:'none',
              padding:       '4px 10px',
              border:        `1px solid ${T.borderMid}`,
              borderRadius:  '6px',
              transition:    'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.textPrimary; (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textMuted; (e.currentTarget as HTMLElement).style.borderColor = T.borderMid }}
          >
            ⚙ ADMIN
          </a>
        </header>

        {/* ── BODY: sidebar + main ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT SIDEBAR — 280px fixed ───────────────────────────────── */}
          {/* Sidebar wrapper — controls width transition */}
          <div style={{
            flexShrink:  0,
            position:    'relative',
            width:       sidebarOpen ? '280px' : '52px',
            minWidth:    sidebarOpen ? '280px' : '52px',
            transition:  'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
            display:     'flex',
          }}>
          {/* Toggle chevron */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              position:       'absolute',
              top:            '12px',
              right:          '-13px',
              zIndex:         30,
              width:          '26px',
              height:         '26px',
              borderRadius:   '50%',
              background:     T.bgPanel,
              border:         `1px solid ${T.border}`,
              color:          T.textMuted,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '12px',
              lineHeight:     1,
              transition:     'all 0.15s ease',
              flexShrink:     0,
            }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=T.textPrimary; el.style.borderColor=T.borderStrong }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=T.textMuted; el.style.borderColor=T.border }}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>

          <aside
            className="jv-scroll"
            style={{
              width:        sidebarOpen ? '280px' : '52px',
              minWidth:     sidebarOpen ? '280px' : '52px',
              maxWidth:     sidebarOpen ? '280px' : '52px',
              borderRight:  `1px solid ${T.border}`,
              overflowY:    'auto',
              overflowX:    'hidden',
              background:   T.bgPanel,
              display:      'flex',
              flexDirection:'column',
              flexShrink:   0,
              transition:   'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* ── Collapsed icon strip ──────────────────────────────────── */}
            {!sidebarOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '50px 0 16px' }}>
                <div onClick={() => setSidebarOpen(true)} title="Javari AI" style={{ width: '28px', height: '28px', borderRadius: '50%', background: avState === 'idle' ? T.bgInput : 'rgba(139,92,246,0.2)', border: `1.5px solid ${avState === 'idle' ? T.border : 'rgba(139,92,246,0.5)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', color: avState === 'idle' ? T.textFaint : '#a855f7', transition: 'all 0.25s' }}>
                  {avState === 'executing' ? '⚡' : '◉'}
                </div>
                <div onClick={() => setSidebarOpen(true)} title="AI Agents" style={{ width: '28px', height: '28px', borderRadius: '6px', background: T.bgInput, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', color: T.textFaint }}>◈</div>
                <div onClick={() => setSidebarOpen(true)} title="Team Execute" style={{ width: '28px', height: '28px', borderRadius: '6px', background: T.bgInput, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', color: T.textFaint }}>▶</div>
              </div>
            )}
            {/* ── Sidebar expanded content ──────────────────────────────── */}
            {sidebarOpen && (<>
            {/* ── Identity section ──────────────────────────────────────── */}
            <SideSection label="IDENTITY" icon={<Cpu size={10} />} accent="violet">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Avatar state={avState} />

                {/* Status grid */}
                {sysStatus ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { k: 'PHASE',     v: `${sysStatus.phase}`,                          c: '#a1a1aa' },
                      { k: 'TASKS',     v: `${sysStatus.completed} / ${sysStatus.total}`, c: '#a1a1aa' },
                      { k: 'VERIFIED',  v: `${sysStatus.pct}%`,                           c: '#10b981' },
                      { k: 'PENDING',   v: `${sysStatus.pending}`,                        c: '#f59e0b' },
                      { k: 'SPENT',     v: `$${(sysStatus.budgetSpent ?? 0).toFixed(4)}`, c: '#f59e0b' },
                      { k: 'REMAINING', v: `$${(sysStatus.budget ?? 0).toFixed(4)}`,      c: '#10b981' },
                    ].map(row => (
                      <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', color: T.textMuted }}>{row.k}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: row.c, tabularNums: true } as React.CSSProperties}>{row.v}</span>
                      </div>
                    ))}
                    {/* Progress bar */}
                    <div style={{ height: '2px', width: '100%', background: '#18181b', borderRadius: '1px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ height: '100%', width: `${sysStatus.pct}%`, background: 'linear-gradient(90deg,#7c3aed,#1d4ed8,#10b981)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ) : (
                  <p className="av-blink" style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textMuted, letterSpacing: '0.2em', textAlign: 'center' }}>CONNECTING…</p>
                )}

                {/* Run loop button */}
                <button
                  onClick={runLoop}
                  disabled={avState === 'executing'}
                  style={{
                    width:         '100%',
                    padding:       '10px',
                    fontFamily:    'monospace',
                    fontSize:      '13px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    borderRadius:  '8px',
                    border:        '1px solid',
                    borderColor:   avState === 'executing' ? 'rgba(245,158,11,0.5)' : '#3f3f46',
                    background:    avState === 'executing' ? 'rgba(245,158,11,0.08)' : 'rgba(24,24,27,0.5)',
                    color:         avState === 'executing' ? '#f59e0b' : '#a1a1aa',
                    cursor:        avState === 'executing' ? 'wait' : 'pointer',
                    transition:    'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (avState !== 'executing') {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(139,92,246,0.6)'
                      el.style.color       = '#c084fc'
                      el.style.background  = 'rgba(139,92,246,0.10)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (avState !== 'executing') {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = '#3f3f46'
                      el.style.color       = '#a1a1aa'
                      el.style.background  = 'rgba(24,24,27,0.5)'
                    }
                  }}
                >
                  {avState === 'executing' ? '⚡ EXECUTING…' : '▶ RUN LOOP'}
                </button>
              </div>
            </SideSection>

            {/* ── AI Agents section ─────────────────────────────────────── */}
            <SideSection label="AI AGENTS" icon={<Users size={10} />} accent="emerald" collapsible defaultOpen={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(AGENT_CFG).map(([key, cfg]) => {
                  const step    = ensemble.find(s => s.role === key)
                  const waiting = loading && mode === 'council'
                  return (
                    <div
                      key={key}
                      className={[
                        waiting && !step ? 'av-blink' : '',
                        activeTaskId && activeTaskId.includes(key) ? 'jv-agent-active' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      style={{
                        padding:      '10px 12px',
                        borderRadius: '10px',
                        border:       `1px solid ${activeTaskId && activeTaskId.includes(key) ? 'rgba(245,158,11,0.55)' : step ? cfg.hue + '40' : waiting ? cfg.hue + '18' : '#18181b'}`,
                        background:   activeTaskId && activeTaskId.includes(key) ? 'rgba(245,158,11,0.06)' : step ? 'rgba(24,24,27,0.6)' : waiting ? 'rgba(24,24,27,0.2)' : 'transparent',
                        transition:   'all 0.3s ease',
                        borderStyle:  waiting && !step ? 'dashed' : 'solid',
                      }}
                    >
                      {/* Agent header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: step ? '8px' : 0 }}>
                        <span style={{ color: cfg.hue, fontSize: '14px', lineHeight: 1 }}>{cfg.glyph}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', color: step ? cfg.hue : '#71717a', flex: 1 }}>
                          {cfg.label}
                        </span>
                        {/* Status dot */}
                        <div
                          className={waiting && !step ? 'av-blink' : undefined}
                          style={{
                            width:           '6px',
                            height:          '6px',
                            borderRadius:    '50%',
                            backgroundColor: step ? '#10b981' : waiting ? cfg.hue : '#27272a',
                            opacity:         waiting && !step ? 0.5 : 1,
                          }}
                        />
                      </div>

                      {/* Content or description */}
                      {step ? (
                        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d4d4d8', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {step.content}
                        </p>
                      ) : (
                        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: activeTaskId && activeTaskId.includes(key) ? '#f59e0b' : '#71717a', letterSpacing: '0.08em', transition: 'color 0.3s' }}
                          className={activeTaskId && activeTaskId.includes(key) ? 'av-blink' : undefined}
                        >
                          {activeTaskId && activeTaskId.includes(key)
                            ? (key === 'planner'   ? 'Designing…'   :
                               key === 'builder'   ? 'Building…'    :
                               key === 'reviewer'  ? 'Reviewing…'   :
                               key === 'tester'    ? 'Testing…'     :
                               key === 'deployer'  ? 'Deploying…'   : 'Working…')
                            : (key === 'planner'   ? 'Breaks down tasks into steps' :
                               key === 'builder'   ? 'Implements the plan fully'    :
                                                     'Reviews and validates output')
                          }
                        </p>
                      )}

                      {/* Meta: model + cost + tier */}
                      {step && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
                            {step.model.split('-').slice(-2).join('-')}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b' }}>
                            ${step.cost.toFixed(5)}
                          </span>
                          {step.tier && (
                            <span style={{
                              fontFamily:    'monospace',
                              fontSize:      '9px',
                              padding:       '1px 6px',
                              borderRadius:  '4px',
                              background:    step.tier === 'free' ? 'rgba(16,185,129,0.1)' : step.tier === 'low' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                              color:         step.tier === 'free' ? '#065f46' : step.tier === 'low' ? '#1e3a5f' : '#78350f',
                            }}>
                              {step.tier.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      {waiting && !step && (
                        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: cfg.hue, opacity: 0.7, marginTop: '4px', letterSpacing: '0.15em' }}>
                          WAITING…
                        </p>
                      )}
                    </div>
                  )
                })}
                {mode === 'single' && (
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b', letterSpacing: '0.15em', textAlign: 'center', paddingTop: '4px' }}>
                    SWITCH TO COUNCIL TO ACTIVATE
                  </p>
                )}
              </div>
            </SideSection>

            {/* ── TEAM Execution section ─────────────────────────────── */}
            <SideSection label="TEAM EXECUTE" icon={<Zap size={10} />} accent="amber" collapsible defaultOpen={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Execute button */}
                <button
                  onClick={() => {
                    // Build a minimal demo plan — in production this comes from
                    // the council plan response or a user-defined workflow
                    const demoPlan = {
                      plan_id:               `ui-${Date.now().toString(36)}`,
                      created_at:            new Date().toISOString(),
                      total_estimated_cost:  0.005,
                      tasks: [
                        {
                          id:           'task-architect',
                          role:         'architect',
                          objective:    'Design the execution blueprint',
                          inputs:       [],
                          outputs:      ['blueprint'],
                          dependencies: [],
                          model:        'gpt-4o-mini',
                          max_cost:     0.001,
                          status:       'pending',
                        },
                        {
                          id:           'task-builder',
                          role:         'builder',
                          objective:    'Implement the blueprint',
                          inputs:       ['blueprint'],
                          outputs:      ['artifact'],
                          dependencies: ['task-architect'],
                          model:        'deepseek-chat',
                          max_cost:     0.002,
                          status:       'pending',
                        },
                        {
                          id:           'task-reviewer',
                          role:         'reviewer',
                          objective:    'Review and validate artifact',
                          inputs:       ['artifact'],
                          outputs:      ['review'],
                          dependencies: ['task-builder'],
                          model:        'claude-3-haiku',
                          max_cost:     0.001,
                          status:       'pending',
                        },
                      ],
                    }
                    runTeamExecution(demoPlan)
                  }}
                  disabled={isExecuting}
                  style={{
                    width:         '100%',
                    padding:       '12px',
                    fontFamily:    'monospace',
                    fontSize:      '13px',
                    fontWeight:    600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    borderRadius:  '8px',
                    border:        '1px solid',
                    borderColor:   isExecuting ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.4)',
                    background:    isExecuting ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.06)',
                    color:         isExecuting ? '#fbbf24' : '#d97706',
                    cursor:        isExecuting ? 'wait' : 'pointer',
                    transition:    'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isExecuting) {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(245,158,11,0.7)'
                      el.style.color       = '#fbbf24'
                      el.style.background  = 'rgba(245,158,11,0.12)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isExecuting) {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(245,158,11,0.4)'
                      el.style.color       = '#d97706'
                      el.style.background  = 'rgba(245,158,11,0.06)'
                    }
                  }}
                >
                  {isExecuting ? '⚡ EXECUTING WORKFLOW…' : '▶ EXECUTE TEAM PLAN'}
                </button>

                {/* Loading indicator */}
                {isExecuting && (
                  <div className="av-blink" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[0,1,2].map(i => (
                        <div key={i} className="animate-bounce" style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#f59e0b', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d97706', letterSpacing: '0.1em' }}>
                      Executing multi-agent workflow…
                    </span>
                  </div>
                )}

                {/* Execution result panel */}
                {executionResult && !isExecuting && (
                  <div style={{
                    borderRadius: '10px',
                    border:       `1px solid ${
                      executionResult.status === 'complete' ? 'rgba(52,211,153,0.3)' :
                      executionResult.status === 'partial'  ? 'rgba(251,191,36,0.3)' :
                                                              'rgba(248,113,113,0.3)'
                    }`,
                    background:   executionResult.status === 'complete' ? 'rgba(16,185,129,0.06)' :
                                  executionResult.status === 'partial'  ? 'rgba(245,158,11,0.06)' :
                                                                          'rgba(239,68,68,0.06)',
                    overflow:     'hidden',
                  }}>
                    {/* Result header */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #18181b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily:    'monospace',
                        fontSize:      '12px',
                        letterSpacing: '0.15em',
                        color:         executionResult.status === 'complete' ? '#34d399' :
                                       executionResult.status === 'partial'  ? '#fbbf24' : '#f87171',
                        fontWeight:    700,
                      }}>
                        {executionResult.status.toUpperCase()}
                      </span>
                      {executionResult.plan_id && (
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b', marginLeft: 'auto' }}>
                          {executionResult.plan_id.slice(0, 20)}
                        </span>
                      )}
                    </div>

                    {/* Cost */}
                    <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#71717a', letterSpacing: '0.1em' }}>TOTAL COST</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24', fontWeight: 700 }}>
                        ${(executionResult.total_cost ?? 0).toFixed(6)}
                      </span>
                    </div>

                    {/* Error state */}
                    {executionResult.error && (
                      <div style={{ padding: '6px 10px' }}>
                        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#f87171', lineHeight: 1.6 }}>
                          {executionResult.error}
                        </p>
                      </div>
                    )}

                    {/* Task results */}
                    {executionResult.results?.map(task => (
                      <div
                        key={task.task_id}
                        style={{
                          padding:      '7px 10px',
                          borderBottom: `1px solid ${T.border}`,
                          display:      'flex',
                          flexDirection:'column',
                          gap:          '4px',
                        }}
                      >
                        {/* Task header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize:   '10px',
                            color:      task.status === 'complete' ? '#10b981' : '#ef4444',
                            flexShrink: 0,
                          }}>
                            {task.status === 'complete' ? '✓' : '✗'}
                          </span>
                          <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textSecond, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.task_id}
                          </strong>
                          <span style={{
                            fontFamily:    'monospace',
                            fontSize:      '11px',
                            padding:       '2px 6px',
                            borderRadius:  '4px',
                            background:    task.status === 'complete' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                            color:         task.status === 'complete' ? '#34d399' : '#f87171',
                            flexShrink:    0,
                          }}>
                            {task.status.toUpperCase()}
                          </span>
                        </div>
                        {/* Cost */}
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
                          ${(task.cost_used ?? 0).toFixed(6)}
                        </div>
                        {/* Output or error */}
                        {(task.output || task.error) && (
                          <pre style={{
                            fontFamily:   'monospace',
                            fontSize:     '11px',
                            color:        task.error ? T.textError : T.textTertiary,
                            whiteSpace:   'pre-wrap',
                            wordBreak:    'break-word',
                            margin:       0,
                            maxHeight:    '80px',
                            overflow:     'hidden',
                            lineHeight:   1.5,
                          }}>
                            {task.error ?? (task.output ? task.output.slice(0, 120) + (task.output.length > 120 ? '…' : '') : '')}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SideSection>
          {/* ── Execution History section ─────────────────────────────── */}
            <SideSection label="HISTORY" icon={<Activity size={10} />} accent="zinc" collapsible defaultOpen={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {executions.length === 0 ? (
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, textAlign: 'center', padding: '8px 0', letterSpacing: '0.1em' }}>No executions yet</p>
                ) : (
                  <div className="jv-scroll" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {executions.map(exec => {
                      const isSel = selectedExecution?.execution?.id === exec.id
                      const sc    = exec.status === 'complete' ? '#34d399' : exec.status === 'failed' ? '#f87171' : exec.status === 'running' ? '#fbbf24' : T.textMuted
                      return (
                        <button
                          key={exec.id}
                          onClick={() => loadExecution(exec.id)}
                          style={{
                            width: '100%', padding: '8px 10px',
                            background: isSel ? 'rgba(255,255,255,0.06)' : 'transparent',
                            border: `1px solid ${isSel ? T.borderStrong : 'transparent'}`,
                            borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                            display: 'flex', flexDirection: 'column', gap: '3px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                          onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: sc, flexShrink: 0 }}>
                              {exec.status === 'complete' ? '✓' : exec.status === 'failed' ? '✗' : '●'}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: T.textSecond, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {exec.plan_id.slice(0, 18)}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: T.textFaint, flexShrink: 0 }}>
                              ${(exec.total_cost ?? 0).toFixed(5)}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: T.textFaint, paddingLeft: '16px' }}>
                            {new Date(exec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </SideSection>

          </>)}{/* /sidebarOpen */}
          </aside>
          </div>{/* /sidebar-wrapper */}

          {/* ── MAIN AREA — 1fr dominant ─────────────────────────────────── */}
          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── CHAT FEED — dominant, fills available height ──────────── */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

              {/* Chat header */}
              <div style={{
                flexShrink:   0,
                padding:      '0 20px',
                height:       '40px',
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                borderBottom: `1px solid ${T.border}`,
                background:   T.bgExecHdr,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.1em', color: mode === 'council' ? '#c084fc' : '#60a5fa', fontWeight: 600 }}>
                  {mode === 'council' ? 'AI Council' : 'Javari AI'}
                </span>
                <div style={{ flex: 1 }} />
                {messages.filter(m => m.role !== 'system').length > 0 && (
                  <button
                    onClick={clearChat}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', padding: '4px' }}
                    title="Clear chat"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e4e4e7' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#71717a' }}
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>

              {/* Input bar — fixed directly under chat header */}
              <div style={{
                flexShrink:   0,
                padding:      '8px 16px',
                borderBottom: `1px solid ${T.border}`,
                background:   T.bgHeader,
              }}>
                <div style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '10px',
                  background:  T.bgInput,
                  border:      `1px solid ${T.borderStrong}`,
                  borderRadius:'10px',
                  padding:     '12px 16px',
                  transition:  'border-color 0.2s',
                }}
                  onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = mode === 'council' ? 'rgba(168,85,247,0.7)' : 'rgba(59,130,246,0.7)' }}
                  onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3f3f46' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#71717a', flexShrink: 0, userSelect: 'none' }}>›</span>
                  <textarea
                    ref={textRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder={mode === 'council' ? 'QUERY COUNCIL…' : 'QUERY JAVARI…'}
                    style={{
                      flex:        1,
                      background:  'transparent',
                      border:      'none',
                      outline:     'none',
                      resize:      'none',
                      fontFamily:  'monospace',
                      fontSize:    '15px',
                      color:       '#e4e4e7',
                      minHeight:   '18px',
                      maxHeight:   '100px',
                      lineHeight:  '1.6',
                      letterSpacing: '0.03em',
                    }}
                    // @ts-expect-error — placeholder color via style
                    className="jv-textarea-placeholder"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {loading && (
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[0,1,2].map(i => (
                          <div
                            key={i}
                            className="animate-bounce"
                            style={{ width: '4px', height: '4px', borderRadius: '50%', background: mode === 'council' ? '#a855f7' : '#3b82f6', animationDelay: `${i * 0.12}s` }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || loading}
                      style={{
                        width:           '28px',
                        height:          '28px',
                        borderRadius:    '8px',
                        background:      mode === 'council' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)',
                        border:          `1px solid ${mode === 'council' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        display:         'flex',
                        alignItems:      'center',
                        justifyContent:  'center',
                        cursor:          (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                        opacity:         (!input.trim() || loading) ? 0.3 : 1,
                        transition:      'all 0.2s',
                      }}
                    >
                      <Send size={12} color={mode === 'council' ? '#a855f7' : '#3b82f6'} />
                    </button>
                  </div>
                </div>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, marginTop: '6px', letterSpacing: '0.15em' }}>
                  ENTER · SHIFT+ENTER FOR NEWLINE
                </p>
              </div>

              {/* ── Message feed ───────────────────────────────────────────── */}
              <div
                className="jv-scroll"
                style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}
              >
                {/* Demo banner */}
              {demoBanner && (
                <div style={{
                  flexShrink:   0,
                  padding:      '10px 20px',
                  background:   'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)',
                  borderBottom: `1px solid rgba(245,158,11,0.2)`,
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  animation:    'jv-msg-in 0.3s ease forwards',
                }}>
                  <span style={{ color: '#f59e0b', fontSize: '14px', flexShrink: 0 }}>⚡</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24', letterSpacing: '0.04em' }}>
                    Javari is executing a multi-agent workflow in real time
                  </span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(245,158,11,0.45)', letterSpacing: '0.2em', flexShrink: 0 }}>DEMO</span>
                </div>
              )}

              {/* Replay confirmation banner */}
              {replayMsg && (
                <div style={{
                  flexShrink:   0,
                  padding:      '10px 20px',
                  background:   'linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 100%)',
                  borderBottom: `1px solid rgba(59,130,246,0.2)`,
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  animation:    'jv-msg-in 0.25s ease forwards',
                }}>
                  <span style={{ color: '#60a5fa', fontSize: '14px', flexShrink: 0 }}>▶</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#93c5fd', letterSpacing: '0.04em' }}>
                    {replayMsg}
                  </span>
                </div>
              )}

              {/* In-flight row */}
                {loading && (
                  <div style={{
                    borderBottom: `1px solid ${T.border}`,
                    padding:      '10px 20px',
                    background:   mode === 'council' ? 'rgba(168,85,247,0.04)' : 'rgba(59,130,246,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b' }}>
                        {new Date().toISOString().replace('T', ' ').slice(0, 19)}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: mode === 'council' ? '#c084fc' : '#60a5fa', letterSpacing: '0.15em' }}>
                        — {mode === 'council' ? 'COUNCIL' : 'JAVARI'}
                      </span>
                    </div>
                    <div className="av-blink" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="animate-bounce"
                          style={{ width: '4px', height: '4px', borderRadius: '50%', background: mode === 'council' ? '#a855f7' : '#3b82f6', display: 'inline-block', animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', color: mode === 'council' ? '#c084fc' : '#60a5fa', marginLeft: '8px', letterSpacing: '0.1em' }}>
                        PROCESSING…
                      </span>
                    </div>
                  </div>
                )}

                {/* Messages — reversed (newest at top) */}
                {[...messages].reverse().map(msg => {
                  const ts = new Date(msg.ts).toISOString().replace('T', ' ').slice(0, 19)
                  const roleLabel =
                    msg.role === 'user'      ? 'YOU'       :
                    msg.role === 'system'     ? 'SYS'       :
                    msg.agent === 'planner'   ? 'ARCHITECT' :
                    msg.agent === 'builder'   ? 'BUILDER'   :
                    msg.agent === 'validator' ? 'ANALYST'   :
                    mode      === 'council'   ? 'COUNCIL'   : 'JAVARI'

                  const roleColor =
                    msg.role === 'user'      ? '#71717a'    :
                    msg.role === 'system'     ? '#3f3f46'    :
                    msg.agent === 'planner'   ? '#a855f7'    :
                    msg.agent === 'builder'   ? '#3b82f6'    :
                    msg.agent === 'validator' ? '#10b981'    :
                    msg.error                 ? '#ef4444'    :
                    mode      === 'council'   ? '#a855f7'    : '#3b82f6'

                  const textColor =
                    msg.role === 'user'   ? T.textUser    :
                    msg.role === 'system' ? T.textSystem  :
                    msg.error             ? T.textError   : T.textSecond

                  return (
                    <div
                      key={msg.id}
                      className="jv-chat-row jv-msg-in"
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        padding:      '14px 20px',
                        background:   msg.role === 'user' ? T.bgMsgUser : 'transparent',
                        transition:   'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, userSelect: 'none' }}>{ts}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: roleColor, letterSpacing: '0.15em' }}>— {roleLabel}</span>
                        {msg.model && (
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b', marginLeft: 'auto' }}>
                            {msg.model.split('-').slice(-2).join('-')}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: '14px', color: textColor, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </p>
                    </div>
                  )
                })}

                {/* ── Execution detail overlay ─────────────────────────────────── */}
                {selectedExecution && !isExecuting && (
                  <div className="jv-scroll" style={{ position: 'absolute', inset: 0, zIndex: 10, background: T.bg, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                          {selectedExecution.execution.plan_id}
                        </h2>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          {([
                            { k: 'STATUS',  v: selectedExecution.execution.status.toUpperCase(), c: selectedExecution.execution.status === 'complete' ? '#34d399' : selectedExecution.execution.status === 'failed' ? '#f87171' : '#fbbf24' },
                            { k: 'COST',    v: `$${(selectedExecution.execution.total_cost ?? 0).toFixed(6)}`, c: T.textMuted },
                            { k: 'TASKS',   v: String(selectedExecution.tasks.length), c: T.textMuted },
                            { k: 'CREATED', v: new Date(selectedExecution.execution.created_at).toLocaleString(), c: T.textFaint },
                          ] as { k: string; v: string; c: string }[]).map(item => (
                            <div key={item.k} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: T.textFaint, letterSpacing: '0.15em' }}>{item.k}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: item.c, fontWeight: 600 }}>{item.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* Retry Failed — only shown if there are failed tasks */}
                        {selectedExecution.tasks.some(t => t.status === 'failed') && (
                          <button
                            onClick={() => retryFailed(selectedExecution)}
                            disabled={isExecuting}
                            style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: isExecuting ? T.textFaint : '#f87171', background: isExecuting ? 'transparent' : 'rgba(239,68,68,0.08)', border: `1px solid ${isExecuting ? T.borderMid : 'rgba(248,113,113,0.35)'}`, borderRadius: '6px', padding: '4px 12px', cursor: isExecuting ? 'not-allowed' : 'pointer', flexShrink: 0, letterSpacing: '0.1em', transition: 'all 0.2s', opacity: isExecuting ? 0.4 : 1 }}
                            onMouseEnter={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(248,113,113,0.65)'; el.style.background='rgba(239,68,68,0.14)' } }}
                            onMouseLeave={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(248,113,113,0.35)'; el.style.background='rgba(239,68,68,0.08)' } }}
                            title={`Retry ${selectedExecution.tasks.filter(t => t.status === 'failed').length} failed task(s)`}
                          >
                            ↺ RETRY FAILED ({selectedExecution.tasks.filter(t => t.status === 'failed').length})
                          </button>
                        )}
                        {/* Resume Execution — only shown if failed tasks exist */}
                        {selectedExecution.tasks.some(t => t.status === 'failed') && selectedExecution.tasks.some(t => t.status === 'complete') && (
                          <button
                            onClick={() => resumeExecution(selectedExecution)}
                            disabled={isExecuting}
                            style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: isExecuting ? T.textFaint : '#60a5fa', background: isExecuting ? 'transparent' : 'rgba(59,130,246,0.08)', border: `1px solid ${isExecuting ? T.borderMid : 'rgba(96,165,250,0.35)'}`, borderRadius: '6px', padding: '4px 12px', cursor: isExecuting ? 'not-allowed' : 'pointer', flexShrink: 0, letterSpacing: '0.1em', transition: 'all 0.2s', opacity: isExecuting ? 0.4 : 1 }}
                            onMouseEnter={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(96,165,250,0.65)'; el.style.background='rgba(59,130,246,0.14)' } }}
                            onMouseLeave={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(96,165,250,0.35)'; el.style.background='rgba(59,130,246,0.08)' } }}
                            title={`Resume: carry forward ${selectedExecution.tasks.filter(t => t.status === 'complete').length} completed tasks, retry ${selectedExecution.tasks.filter(t => t.status === 'failed').length} failed`}
                          >
                            ⟳ RESUME ({selectedExecution.tasks.filter(t => t.status === 'complete').length}✓ + {selectedExecution.tasks.filter(t => t.status === 'failed').length}✗)
                          </button>
                        )}
                        {/* Edit & Run */}
                        <button
                          onClick={() => editAndRun(selectedExecution)}
                          disabled={isExecuting}
                          style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textMuted, background: 'none', border: `1px solid ${T.borderMid}`, borderRadius: '6px', padding: '4px 10px', cursor: isExecuting ? 'not-allowed' : 'pointer', flexShrink: 0, letterSpacing: '0.1em', transition: 'all 0.15s', opacity: isExecuting ? 0.4 : 1 }}
                          onMouseEnter={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.color=T.textPrimary; el.style.borderColor=T.borderStrong } }}
                          onMouseLeave={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.color=T.textMuted;    el.style.borderColor=T.borderMid    } }}
                          title="Load this plan into the input box for editing"
                        >✎ EDIT</button>
                        {/* Run Again */}
                        <button
                          onClick={() => replayExecution(selectedExecution)}
                          disabled={isExecuting}
                          style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: isExecuting ? T.textFaint : '#fbbf24', background: isExecuting ? 'transparent' : 'rgba(245,158,11,0.1)', border: `1px solid ${isExecuting ? T.borderMid : 'rgba(251,191,36,0.4)'}`, borderRadius: '6px', padding: '4px 12px', cursor: isExecuting ? 'not-allowed' : 'pointer', flexShrink: 0, letterSpacing: '0.1em', transition: 'all 0.2s' }}
                          onMouseEnter={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(251,191,36,0.7)'; el.style.background='rgba(245,158,11,0.18)' } }}
                          onMouseLeave={e => { if (!isExecuting) { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(251,191,36,0.4)'; el.style.background='rgba(245,158,11,0.10)' } }}
                          title="Re-execute this plan immediately"
                        >▶ RUN AGAIN</button>
                        {/* Close */}
                        <button onClick={() => setSelectedExecution(null)} style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, background: 'none', border: `1px solid ${T.borderMid}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', flexShrink: 0, letterSpacing: '0.1em', transition: 'all 0.15s' }}
                          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color=T.textPrimary; el.style.borderColor=T.borderStrong }}
                          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color=T.textFaint;    el.style.borderColor=T.borderMid    }}
                        >✕ CLOSE</button>
                      </div>
                    </div>
                    <div style={{ height: '1px', background: T.border }} />
                    {/* Task list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, letterSpacing: '0.2em' }}>TASK LOG</span>
                      {selectedExecution.tasks.length === 0 && (
                        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textFaint }}>No task records found.</p>
                      )}
                      {selectedExecution.tasks.map(task => {
                        const tc = task.status === 'complete' ? '#34d399' : task.status === 'failed' ? '#f87171' : '#fbbf24'
                        const outputText = task.error ?? (task.output
                          ? (() => { try { return JSON.stringify(JSON.parse(task.output), null, 2) } catch { return task.output } })()
                          : null)
                        return (
                          <div key={task.id} style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bgPanel, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: tc }}>{task.status === 'complete' ? '✓' : task.status === 'failed' ? '✗' : '◌'}</span>
                              <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: T.textPrimary, textTransform: 'capitalize' }}>{task.role}</strong>
                              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: T.textFaint }}>{task.task_id}</span>
                              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '10px', color: T.textFaint }}>${(task.cost_used ?? 0).toFixed(6)}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: task.status === 'complete' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: tc }}>{task.status.toUpperCase()}</span>
                              {/* Per-task retry link */}
                              {task.status === 'failed' && (
                                <button
                                  onClick={() => {
                                    const singleRetry: ExecDetailResult = {
                                      execution: selectedExecution.execution,
                                      tasks:     [task],
                                    }
                                    retryFailed(singleRetry)
                                  }}
                                  disabled={isExecuting}
                                  style={{ fontFamily: 'monospace', fontSize: '9px', color: isExecuting ? T.textFaint : '#f87171', background: 'none', border: 'none', cursor: isExecuting ? 'not-allowed' : 'pointer', padding: '0 4px', letterSpacing: '0.1em', textDecoration: 'underline', flexShrink: 0, opacity: isExecuting ? 0.4 : 1 }}
                                >
                                  retry
                                </button>
                              )}
                            </div>
                            {outputText && (
                              <pre style={{ fontFamily: 'monospace', fontSize: '11px', color: task.error ? '#f87171' : T.textTertiary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.5, maxHeight: '140px', overflow: 'auto', background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: '6px' }}>
                                {outputText}
                              </pre>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* History loading */}
                {historyLoading && !selectedExecution && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="av-blink" style={{ fontFamily: 'monospace', fontSize: '12px', color: T.textMuted, letterSpacing: '0.2em' }}>LOADING…</span>
                  </div>
                )}

                {/* ── Guided empty state ─────────────────────────────────────── */}
                {messages.filter(m => m.role !== 'system').length === 0 && !loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '28px', padding: '40px 32px', userSelect: 'none' }}>

                    {/* Heading */}
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h2 style={{
                        fontFamily:    'monospace',
                        fontSize:      '20px',
                        fontWeight:    700,
                        color:         T.textPrimary,
                        letterSpacing: '-0.01em',
                        margin:        0,
                      }}>
                        What do you want Javari to do?
                      </h2>
                      <p style={{
                        fontFamily:    'monospace',
                        fontSize:      '13px',
                        color:         T.textMuted,
                        letterSpacing: '0.02em',
                        margin:        0,
                        lineHeight:    1.5,
                        maxWidth:      '420px',
                      }}>
                        Choose a task or describe your goal. Javari will execute it using AI agents.
                      </p>
                    </div>

                    {/* 4 primary action cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '540px', width: '100%' }}>
                      {PRIMARY_ACTIONS.map(action => (
                        <button
                          key={action.label}
                          onClick={() => {
                            send(action.prompt)
                          }}
                          style={{
                            padding:       '16px 18px',
                            fontFamily:    'monospace',
                            fontSize:      '13px',
                            fontWeight:    600,
                            color:         T.textSecond,
                            background:    T.bgInput,
                            border:        `1px solid ${T.borderStrong}`,
                            borderRadius:  '10px',
                            cursor:        'pointer',
                            textAlign:     'left',
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '6px',
                            transition:    'all 0.18s ease',
                            lineHeight:    1.3,
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement
                            el.style.borderColor = mode === 'council' ? 'rgba(192,132,252,0.6)' : 'rgba(96,165,250,0.6)'
                            el.style.color       = mode === 'council' ? '#c084fc' : '#60a5fa'
                            el.style.background  = mode === 'council' ? 'rgba(192,132,252,0.07)' : 'rgba(96,165,250,0.07)'
                            el.style.transform   = 'translateY(-1px)'
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement
                            el.style.borderColor = T.borderStrong
                            el.style.color       = T.textSecond
                            el.style.background  = T.bgInput
                            el.style.transform   = 'translateY(0)'
                          }}
                        >
                          <span style={{ fontSize: '18px', lineHeight: 1 }}>{action.icon}</span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Primary CTA — Run with AI Team */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '380px' }}>
                      <button
                        onClick={() => {
                          // Build demo plan from current input or default objective
                          const objective = textRef.current?.value.trim() || 'Build and analyze the system'
                          const demoPlan = {
                            plan_id:              `ui-${Date.now().toString(36)}`,
                            created_at:           new Date().toISOString(),
                            total_estimated_cost: 0.005,
                            tasks: [
                              { id: 'task-architect', role: 'architect', objective, inputs: [], outputs: ['blueprint'], dependencies: [], model: 'gpt-4o-mini', max_cost: 0.001, status: 'pending' },
                              { id: 'task-builder',   role: 'builder',   objective: 'Implement the blueprint', inputs: ['blueprint'], outputs: ['artifact'], dependencies: ['task-architect'], model: 'deepseek-chat', max_cost: 0.002, status: 'pending' },
                              { id: 'task-reviewer',  role: 'reviewer',  objective: 'Review and validate artifact', inputs: ['artifact'], outputs: ['review'], dependencies: ['task-builder'], model: 'claude-3-haiku', max_cost: 0.001, status: 'pending' },
                            ],
                          }
                          runTeamExecution(demoPlan)
                        }}
                        disabled={isExecuting}
                        style={{
                          width:         '100%',
                          padding:       '16px 24px',
                          fontFamily:    'monospace',
                          fontSize:      '15px',
                          fontWeight:    700,
                          letterSpacing: '0.08em',
                          color:         isExecuting ? '#92400e' : '#fbbf24',
                          background:    isExecuting
                            ? 'rgba(245,158,11,0.12)'
                            : 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.10) 100%)',
                          border:        `1px solid ${isExecuting ? 'rgba(245,158,11,0.4)' : 'rgba(251,191,36,0.5)'}`,
                          borderRadius:  '12px',
                          cursor:        isExecuting ? 'wait' : 'pointer',
                          transition:    'all 0.2s ease',
                          display:       'flex',
                          alignItems:    'center',
                          justifyContent:'center',
                          gap:           '10px',
                          boxShadow:     isExecuting ? 'none' : '0 0 24px rgba(245,158,11,0.12)',
                        }}
                        onMouseEnter={e => {
                          if (!isExecuting) {
                            const el = e.currentTarget as HTMLElement
                            el.style.borderColor = 'rgba(251,191,36,0.8)'
                            el.style.boxShadow   = '0 0 32px rgba(245,158,11,0.22)'
                            el.style.transform   = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isExecuting) {
                            const el = e.currentTarget as HTMLElement
                            el.style.borderColor = 'rgba(251,191,36,0.5)'
                            el.style.boxShadow   = '0 0 24px rgba(245,158,11,0.12)'
                            el.style.transform   = 'translateY(0)'
                          }
                        }}
                      >
                        {isExecuting
                          ? <><span>⚡</span> EXECUTING TEAM PLAN…</>
                          : <><span>▶</span> RUN WITH AI TEAM</>
                        }
                      </button>
                      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, letterSpacing: '0.1em', textAlign: 'center' }}>
                        or describe a goal above · ENTER to send to Javari
                      </p>
                    </div>

                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── Step progress counter ─────────────────────────────────────── */}
            {isExecuting && executionResult && (
              <div style={{ flexShrink: 0, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: Math.max(executionResult.results.length + (activeTaskId ? 1 : 0), 3) }).map((_, i) => {
                    const done = i < executionResult.results.length
                    const active = i === executionResult.results.length && !!activeTaskId
                    return (
                      <div key={i} style={{
                        width:      done ? '20px' : '6px',
                        height:     '4px',
                        borderRadius:'2px',
                        background: done ? '#10b981' : active ? '#f59e0b' : T.borderMid,
                        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                        animation:  active ? 'av-blink 1.2s ease-in-out infinite' : 'none',
                      }} />
                    )
                  })}
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textMuted, letterSpacing: '0.08em' }}>
                  {activeTaskId
                    ? `Running step ${executionResult.results.length + 1}${' of ' + Math.max(executionResult.results.length + 1, 3)}`
                    : `${executionResult.results.length} step${executionResult.results.length !== 1 ? 's' : ''} complete`
                  }
                </span>
              </div>
            )}

            {/* ── EXECUTION LOG — height expands when active ──────────────── */}
            <div className="jv-exec-strip" style={{ flexShrink: 0, height: (execRows.length > 0 || execPulse || isExecuting) ? '180px' : '44px', minHeight: (execRows.length > 0 || execPulse || isExecuting) ? '180px' : '44px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Exec header */}
              <div style={{
                flexShrink:   0,
                padding:      '0 16px',
                height:       '44px',
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                borderTop:    `1px solid ${T.border}`,
                background:   T.bgExecHdr,
              }}>
                <Activity size={10} style={{ color: '#f59e0b' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.2em', color: '#fbbf24' }}>EXECUTION STREAM</span>
                <div
                  style={{
                    width:           '6px',
                    height:          '6px',
                    borderRadius:    '50%',
                    background:      execPulse ? '#f59e0b' : '#27272a',
                    marginLeft:      '4px',
                    animation:       execPulse ? 'av-blink 0.8s ease-in-out infinite' : 'none',
                    transition:      'background 0.3s',
                  }}
                />
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b', letterSpacing: '0.2em' }}>LIVE</span>
              </div>

              {/* Exec rows */}
              <div className="jv-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {execRows.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: '13px', color: T.textFaint, letterSpacing: '0.1em' }}>Execution will appear here in real time</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '11px', color: T.textFaint, opacity: 0.6, letterSpacing: '0.08em' }}>Run a task above or trigger the autonomy loop</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {execRows.map((row, i) => {
                      const isNew = execPulse && i < 5 && row.ts > Date.now() - 10000
                      return (
                        <div
                          key={row.id + row.ts}
                          className={[
                            'jv-exec-row',
                            i < 3 ? 'jv-exec-in' : '',
                            row.status === 'running' ? 'jv-running' : '',
                          ].filter(Boolean).join(' ')}
                          style={{
                            padding:       '7px 20px',
                            borderBottom:  `1px solid ${T.border}`,
                            display:       'flex',
                            alignItems:    'center',
                            gap:           '10px',
                            background:    row.status === 'running'
                              ? 'transparent'
                              : isNew ? 'rgba(245,158,11,0.04)' : 'transparent',
                            transition:    'background 0.4s ease',
                          }}
                        >
                          {/* Status glyph */}
                          <span
                            className={row.verified ? 'jv-check-pop' : undefined}
                            style={{
                              fontFamily: 'monospace',
                              fontSize:   '11px',
                              flexShrink: 0,
                              color:      row.verified          ? '#10b981' :
                                          row.status === 'completed' ? '#3b82f6' :
                                          row.status === 'failed'    ? '#ef4444' :
                                          row.status === 'running'   ? '#f59e0b' : '#f59e0b',
                              display:    'inline-block',
                            }}
                          >
                            {row.verified ? '✓' : row.status === 'failed' ? '✗' : row.status === 'running' ? '◌' : row.status === 'completed' ? '●' : '○'}
                          </span>

                          {/* Title */}
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: row.status === 'running' ? '#fbbf24' : T.textSecond, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize', transition: 'color 0.3s' }}>
                            {row.title}{row.status === 'running' ? '…' : ''}
                          </span>

                          {/* Module */}
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a', flexShrink: 0 }}>{row.module}</span>

                          {/* Model */}
                          {row.model && (
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#52525b', flexShrink: 0 }}>
                              {row.model.split('-').slice(-1)[0]}
                            </span>
                          )}

                          {/* Cost */}
                          {row.cost > 0 && (
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a', flexShrink: 0 }}>
                              ${row.cost.toFixed(5)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  )
}
