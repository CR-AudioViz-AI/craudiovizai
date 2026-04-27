// app/(apps)/javari-os/command-center/page.tsx
// Javari OS — Command Center Dashboard
// Full visibility and control over the autonomy execution loop.
// Reuses: /api/javari/autonomy (GET queue, POST cycle),
//         /api/javari/executions (GET history, POST abort),
//         /api/javari/team (POST plan execution)
// Created: April 24, 2026

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QueueTask {
  id:         string
  status:     'pending' | 'running' | 'complete' | 'failed' | 'pending_approval' | 'skipped'
  priority:   number
  cost_used:  number
  error:      string | null
  created_at: string
  updated_at: string
  parent_id:  string | null
}

interface QueueCounts {
  pending:          number
  running:          number
  complete:         number
  failed:           number
  pending_approval: number
}

interface Execution {
  id:           string
  plan_id:      string
  status:       string
  total_cost:   number
  created_at:   string
  finalized_at: string | null
}

interface CycleResult {
  tasks_processed:   number
  tasks_succeeded:   number
  tasks_failed:      number
  tasks_skipped:     number
  follow_ups_queued: number
  total_cost:        number
  stopped_reason:    string
  execution_ids:     string[]
}

interface StreamEvent {
  id:      string
  type:    string
  task_id?: string
  message?: string
  ts:      number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case 'complete':         return '#34d399'
    case 'running':          return '#fbbf24'
    case 'pending':          return '#60a5fa'
    case 'failed':           return '#f87171'
    case 'pending_approval': return '#c084fc'
    case 'skipped':          return '#71717a'
    default:                 return '#71717a'
  }
}

function statusGlyph(status: string): string {
  switch (status) {
    case 'complete':         return '✓'
    case 'running':          return '◌'
    case 'pending':          return '○'
    case 'failed':           return '✗'
    case 'pending_approval': return '⚠'
    case 'skipped':          return '—'
    default:                 return '●'
  }
}

function elapsed(iso: string): string {
  const ms  = Date.now() - new Date(iso).getTime()
  const s   = Math.floor(ms / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function Panel({ title, children, accent = '#3f3f46' }: {
  title:    string
  children: React.ReactNode
  accent?:  string
}) {
  return (
    <div style={{
      background:   'rgba(0,0,0,0.35)',
      border:       '1px solid #27272a',
      borderTop:    `2px solid ${accent}`,
      borderRadius: '10px',
      display:      'flex',
      flexDirection:'column',
      overflow:     'hidden',
    }}>
      <div style={{
        padding:     '10px 16px',
        borderBottom:'1px solid #18181b',
        background:  'rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', color: accent, fontWeight: 700 }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function Stat({ label, value, color = '#e4e4e7', sub }: {
  label: string; value: string; color?: string; sub?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#52525b', letterSpacing: '0.2em' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#52525b' }}>{sub}</span>}
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const c = statusColor(status)
  return (
    <span style={{
      fontFamily:  'monospace',
      fontSize:    '9px',
      padding:     '2px 7px',
      borderRadius:'4px',
      background:  `${c}18`,
      color:        c,
      letterSpacing:'0.1em',
      flexShrink:  0,
    }}>
      {statusGlyph(status)} {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const supabase = createClient()

  // ── State ─────────────────────────────────────────────────────────────────
  const [authToken,      setAuthToken]      = useState<string | null>(null)
  const [autonomyOn,     setAutonomyOn]     = useState(false)
  const [cycleRunning,   setCycleRunning]   = useState(false)
  const [lastCycle,      setLastCycle]      = useState<CycleResult | null>(null)
  const [sessionCost,    setSessionCost]    = useState(0)
  const [sessionTasks,   setSessionTasks]   = useState(0)
  const [credits,        setCredits]        = useState<number | null>(null)
  const [queueTasks,     setQueueTasks]     = useState<QueueTask[]>([])
  const [queueCounts,    setQueueCounts]    = useState<QueueCounts>({ pending: 0, running: 0, complete: 0, failed: 0, pending_approval: 0 })
  const [executions,     setExecutions]     = useState<Execution[]>([])
  const [streamEvents,   setStreamEvents]   = useState<StreamEvent[]>([])
  const [error,          setError]          = useState<string | null>(null)
  const [approving,      setApproving]      = useState<string | null>(null)

  const loopRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<HTMLDivElement>(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthToken(session.access_token)
    })
  }, [supabase])

  // ── Fetch queue + executions ──────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const headers: Record<string,string> = {}
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`

    try {
      const [qRes, eRes] = await Promise.all([
        fetch('/api/javari/autonomy', { headers }),
        fetch('/api/javari/executions', { headers }),
      ])
      if (qRes.ok) {
        const qData = await qRes.json()
        setQueueTasks(qData.tasks ?? [])
        setQueueCounts(qData.counts ?? { pending:0, running:0, complete:0, failed:0, pending_approval:0 })
      }
      if (eRes.ok) {
        const eData = await eRes.json()
        setExecutions((eData.executions ?? []).slice(0, 20))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch error')
    }
  }, [authToken])

  // Fetch credits
  const refreshCredits = useCallback(async () => {
    if (!authToken) return
    try {
      const res = await fetch('/api/credits/balance', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const d = await res.json()
        setCredits(d.balance ?? d.credits ?? null)
      }
    } catch { /* non-fatal */ }
  }, [authToken])

  useEffect(() => { if (authToken) { refresh(); refreshCredits() } }, [authToken, refresh, refreshCredits])

  // Periodic refresh every 8s
  useEffect(() => {
    const t = setInterval(() => { refresh(); refreshCredits() }, 8000)
    return () => clearInterval(t)
  }, [refresh, refreshCredits])

  // Auto-scroll stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [streamEvents])

  // ── Autonomy loop ─────────────────────────────────────────────────────────
  const runCycle = useCallback(async () => {
    if (cycleRunning) return
    setCycleRunning(true)
    setError(null)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      const res = await fetch('/api/javari/autonomy', { method: 'POST', headers })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(e.error ?? `HTTP ${res.status}`)
      }
      const result: CycleResult = await res.json()
      setLastCycle(result)
      setSessionCost(prev => Math.round((prev + result.total_cost) * 1_000_000) / 1_000_000)
      setSessionTasks(prev => prev + result.tasks_processed)
      setStreamEvents(prev => [...prev, {
        id:      Date.now().toString(),
        type:    'cycle',
        message: `Cycle complete — ${result.tasks_processed} tasks, $${result.total_cost.toFixed(6)}, stopped: ${result.stopped_reason}`,
        ts:      Date.now(),
      }].slice(-100))
      await refresh()
      await refreshCredits()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setStreamEvents(prev => [...prev, {
        id: Date.now().toString(), type: 'error', message: `Cycle error: ${msg}`, ts: Date.now(),
      }].slice(-100))
    } finally {
      setCycleRunning(false)
    }
  }, [cycleRunning, authToken, refresh, refreshCredits])

  // Auto-loop when autonomyOn
  useEffect(() => {
    if (!autonomyOn) { if (loopRef.current) clearTimeout(loopRef.current); return }
    const schedule = () => {
      loopRef.current = setTimeout(async () => {
        await runCycle()
        if (autonomyOn) schedule()
      }, 5000)  // 5s between cycles
    }
    schedule()
    return () => { if (loopRef.current) clearTimeout(loopRef.current) }
  }, [autonomyOn, runCycle])

  // ── Approve task ──────────────────────────────────────────────────────────
  const approveTask = useCallback(async (taskId: string) => {
    setApproving(taskId)
    try {
      // Mark task pending so the autonomy loop picks it up with approval
      const { error: dbErr } = await supabase
        .from('javari_autonomy_tasks')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('status', 'pending_approval')
      if (dbErr) throw new Error(dbErr.message)
      setStreamEvents(prev => [...prev, {
        id: Date.now().toString(), type: 'approved', message: `Task ${taskId.slice(0,8)} approved — re-queued`, ts: Date.now(),
      }].slice(-100))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setApproving(null)
    }
  }, [supabase, refresh])

  const rejectTask = useCallback(async (taskId: string) => {
    setApproving(taskId)
    try {
      await supabase
        .from('javari_autonomy_tasks')
        .update({ status: 'skipped', error: 'Rejected by user', updated_at: new Date().toISOString() })
        .eq('id', taskId)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setApproving(null)
    }
  }, [supabase, refresh])

  // ── Stop all / clear queue ────────────────────────────────────────────────
  const stopAll = useCallback(async () => {
    setAutonomyOn(false)
    // Abort any running executions
    const running = executions.filter(e => e.status === 'running' || e.status === 'aborting')
    for (const exec of running) {
      await fetch('/api/javari/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ action: 'abort', execution_id: exec.id }),
      }).catch(() => {})
    }
    setStreamEvents(prev => [...prev, {
      id: Date.now().toString(), type: 'system', message: 'All executions stopped', ts: Date.now(),
    }].slice(-100))
    await refresh()
  }, [executions, authToken, refresh])

  const clearQueue = useCallback(async () => {
    await supabase
      .from('javari_autonomy_tasks')
      .update({ status: 'skipped', error: 'Cleared by user', updated_at: new Date().toISOString() })
      .eq('status', 'pending')
    setStreamEvents(prev => [...prev, {
      id: Date.now().toString(), type: 'system', message: 'Pending queue cleared', ts: Date.now(),
    }].slice(-100))
    await refresh()
  }, [supabase, refresh])

  // ── Pending approval tasks ────────────────────────────────────────────────
  const pendingApproval = queueTasks.filter(t => t.status === 'pending_approval')

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #050507; color: #e4e4e7 }

        .cc-scroll::-webkit-scrollbar       { width: 3px; height: 3px }
        .cc-scroll::-webkit-scrollbar-track { background: transparent }
        .cc-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px }

        @keyframes cc-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .cc-pulse { animation: cc-pulse 1.6s ease-in-out infinite }

        @keyframes cc-slide-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .cc-slide-in { animation: cc-slide-in 0.2s ease forwards }

        @keyframes cc-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .cc-spin { animation: cc-spin 2s linear infinite; display:inline-block }

        .cc-btn {
          font-family: monospace; font-size: 11px; letter-spacing: 0.15em;
          border-radius: 7px; cursor: pointer; transition: all 0.2s ease;
          padding: 7px 14px; border: 1px solid; display: inline-flex;
          align-items: center; gap: 6px;
        }
        .cc-btn:disabled { opacity: 0.4; cursor: not-allowed }
        .cc-btn-primary {
          color: #fbbf24; background: rgba(245,158,11,0.1);
          border-color: rgba(251,191,36,0.4);
        }
        .cc-btn-primary:hover:not(:disabled) {
          background: rgba(245,158,11,0.18); border-color: rgba(251,191,36,0.7);
        }
        .cc-btn-danger {
          color: #f87171; background: rgba(239,68,68,0.08);
          border-color: rgba(248,113,113,0.35);
        }
        .cc-btn-danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.16); border-color: rgba(248,113,113,0.65);
        }
        .cc-btn-muted {
          color: #71717a; background: transparent; border-color: #27272a;
        }
        .cc-btn-muted:hover:not(:disabled) {
          color: #a1a1aa; border-color: #3f3f46;
        }
        .cc-btn-approve {
          color: #34d399; background: rgba(16,185,129,0.08);
          border-color: rgba(52,211,153,0.35);
        }
        .cc-btn-approve:hover:not(:disabled) {
          background: rgba(16,185,129,0.16); border-color: rgba(52,211,153,0.65);
        }

        @media (max-width: 768px) {
          .cc-grid-3 { grid-template-columns: 1fr !important }
          .cc-grid-2 { grid-template-columns: 1fr !important }
        }
      `}</style>

      <div style={{
        minHeight:    '100vh',
        background:   '#050507',
        color:        '#e4e4e7',
        fontFamily:   'monospace',
        padding:      '0',
        display:      'flex',
        flexDirection:'column',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{
          borderBottom: '1px solid #18181b',
          background:   'rgba(0,0,0,0.6)',
          backdropFilter:'blur(8px)',
          padding:      '0 24px',
          height:       '52px',
          display:      'flex',
          alignItems:   'center',
          gap:          '16px',
          flexShrink:   0,
          position:     'sticky',
          top:          0,
          zIndex:       50,
        }}>
          <a href="/javari" style={{ color: '#52525b', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em' }}>
            ← JAVARI OS
          </a>
          <div style={{ width: '1px', height: '20px', background: '#27272a' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7', letterSpacing: '-0.01em' }}>
            Command Center
          </span>
          <div style={{ flex: 1 }} />

          {/* Autonomy toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#52525b', letterSpacing: '0.15em' }}>AUTONOMY</span>
            <button
              onClick={() => setAutonomyOn(v => !v)}
              style={{
                width:      '44px',
                height:     '24px',
                borderRadius:'12px',
                background: autonomyOn ? 'rgba(245,158,11,0.3)' : '#18181b',
                border:     `1px solid ${autonomyOn ? 'rgba(251,191,36,0.5)' : '#27272a'}`,
                cursor:     'pointer',
                position:   'relative',
                transition: 'all 0.2s ease',
                padding:    0,
              }}
            >
              <span style={{
                position:    'absolute',
                top:         '3px',
                left:         autonomyOn ? '22px' : '3px',
                width:       '16px',
                height:      '16px',
                borderRadius:'50%',
                background:  autonomyOn ? '#f59e0b' : '#3f3f46',
                transition:  'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                boxShadow:   autonomyOn ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
              }} />
            </button>
            {autonomyOn && (
              <span className="cc-pulse" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.1em' }}>ACTIVE</span>
            )}
          </div>

          {credits !== null && (
            <>
              <div style={{ width: '1px', height: '20px', background: '#27272a' }} />
              <span style={{ fontSize: '10px', color: credits < 10 ? '#f87171' : '#71717a' }}>
                {credits} CREDITS
              </span>
            </>
          )}
        </header>

        {/* ── Error bar ──────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            padding:     '8px 24px',
            background:  'rgba(239,68,68,0.08)',
            borderBottom:'1px solid rgba(248,113,113,0.2)',
            display:     'flex',
            alignItems:  'center',
            gap:         '10px',
          }}>
            <span style={{ color: '#f87171', fontSize: '11px', flex: 1 }}>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background:'none', border:'none', color:'#71717a', cursor:'pointer', fontSize:'12px' }}>✕</button>
          </div>
        )}

        {/* ── Main content ───────────────────────────────────────────────── */}
        <div style={{
          flex:       1,
          padding:    '20px 24px',
          display:    'flex',
          flexDirection:'column',
          gap:        '16px',
          overflowY:  'auto',
        }}>

          {/* ── Row 1: Stats ───────────────────────────────────────────── */}
          <div className="cc-grid-3" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 '12px',
          }}>
            {[
              { label: 'TASKS THIS SESSION', value: sessionTasks.toString(), color: '#60a5fa' },
              { label: 'SESSION COST',        value: `$${sessionCost.toFixed(5)}`, color: '#fbbf24' },
              { label: 'QUEUE PENDING',        value: queueCounts.pending.toString(), color: '#c084fc' },
              { label: 'NEEDS APPROVAL',       value: queueCounts.pending_approval.toString(), color: queueCounts.pending_approval > 0 ? '#c084fc' : '#3f3f46' },
            ].map(stat => (
              <div key={stat.label} style={{
                background:   'rgba(0,0,0,0.3)',
                border:       '1px solid #1f1f21',
                borderRadius: '10px',
                padding:      '14px 18px',
              }}>
                <Stat label={stat.label} value={stat.value} color={stat.color} />
              </div>
            ))}
          </div>

          {/* ── Row 2: Control panel + Status ─────────────────────────── */}
          <div className="cc-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>

            {/* Control Panel */}
            <Panel title="CONTROL PANEL" accent="#f59e0b">
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                <button
                  className="cc-btn cc-btn-primary"
                  onClick={runCycle}
                  disabled={cycleRunning}
                >
                  {cycleRunning
                    ? <><span className="cc-spin">◌</span> RUNNING…</>
                    : <>▶ RUN CYCLE</>}
                </button>

                <button
                  className={`cc-btn ${autonomyOn ? 'cc-btn-danger' : 'cc-btn-primary'}`}
                  onClick={() => setAutonomyOn(v => !v)}
                >
                  {autonomyOn ? '⏸ PAUSE AUTONOMY' : '⚡ START AUTONOMY'}
                </button>

                <button
                  className="cc-btn cc-btn-danger"
                  onClick={stopAll}
                  disabled={cycleRunning}
                >
                  ■ STOP ALL
                </button>

                <button
                  className="cc-btn cc-btn-muted"
                  onClick={clearQueue}
                >
                  ✕ CLEAR QUEUE
                </button>

                <button
                  className="cc-btn cc-btn-muted"
                  onClick={() => { refresh(); refreshCredits() }}
                >
                  ↺ REFRESH
                </button>
              </div>

              {/* Last cycle summary */}
              {lastCycle && (
                <div style={{
                  marginTop:    '12px',
                  padding:      '10px 12px',
                  background:   'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border:       '1px solid #1f1f21',
                  display:      'flex',
                  flexWrap:     'wrap',
                  gap:          '14px',
                }}>
                  {[
                    { k: 'PROCESSED', v: lastCycle.tasks_processed.toString() },
                    { k: 'SUCCEEDED', v: lastCycle.tasks_succeeded.toString(),  c: '#34d399' },
                    { k: 'FAILED',    v: lastCycle.tasks_failed.toString(),     c: lastCycle.tasks_failed > 0 ? '#f87171' : '#71717a' },
                    { k: 'SKIPPED',   v: lastCycle.tasks_skipped.toString(),    c: '#c084fc' },
                    { k: 'QUEUED',    v: lastCycle.follow_ups_queued.toString(), c: '#60a5fa' },
                    { k: 'COST',      v: `$${lastCycle.total_cost.toFixed(6)}`, c: '#fbbf24' },
                    { k: 'STOPPED',   v: lastCycle.stopped_reason,              c: '#71717a' },
                  ].map(item => (
                    <div key={item.k} style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
                      <span style={{ fontSize:'9px', color:'#3f3f46', letterSpacing:'0.15em' }}>{item.k}</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color: item.c ?? '#e4e4e7' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Approval Queue */}
            <Panel title={`APPROVAL QUEUE${pendingApproval.length > 0 ? ` (${pendingApproval.length})` : ''}`} accent="#c084fc">
              {pendingApproval.length === 0 ? (
                <p style={{ fontSize:'11px', color:'#3f3f46', letterSpacing:'0.1em', textAlign:'center', padding:'12px 0' }}>
                  No tasks pending approval
                </p>
              ) : (
                <div className="cc-scroll" style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'220px', overflowY:'auto' }}>
                  {pendingApproval.map(task => (
                    <div key={task.id} className="cc-slide-in" style={{
                      padding:      '10px 12px',
                      border:       '1px solid rgba(192,132,252,0.25)',
                      borderRadius: '8px',
                      background:   'rgba(168,85,247,0.04)',
                      display:      'flex',
                      flexDirection:'column',
                      gap:          '6px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'9px', padding:'2px 6px', borderRadius:'3px', background:'rgba(192,132,252,0.15)', color:'#c084fc' }}>HIGH RISK</span>
                        <span style={{ fontSize:'11px', color:'#d4d4d8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {task.id.slice(0, 12)}…
                        </span>
                        <span style={{ fontSize:'10px', color:'#52525b' }}>{elapsed(task.created_at)}</span>
                      </div>
                      {task.error && (
                        <p style={{ fontSize:'10px', color:'#71717a', lineHeight:1.4 }}>{task.error}</p>
                      )}
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button
                          className="cc-btn cc-btn-approve"
                          style={{ fontSize:'10px', padding:'4px 10px' }}
                          disabled={approving === task.id}
                          onClick={() => approveTask(task.id)}
                        >✓ APPROVE</button>
                        <button
                          className="cc-btn cc-btn-danger"
                          style={{ fontSize:'10px', padding:'4px 10px' }}
                          disabled={approving === task.id}
                          onClick={() => rejectTask(task.id)}
                        >✕ REJECT</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ── Row 3: Task Graph + Execution Stream ─────────────────────── */}
          <div className="cc-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>

            {/* Live Task Graph */}
            <Panel title="LIVE TASK GRAPH" accent="#60a5fa">
              {/* Count badges */}
              <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                {Object.entries(queueCounts).map(([k, v]) => (
                  <span key={k} style={{
                    fontSize:'10px', padding:'2px 8px', borderRadius:'10px',
                    background:`${statusColor(k)}15`, color:statusColor(k), letterSpacing:'0.05em',
                  }}>
                    {v} {k.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="cc-scroll" style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'280px', overflowY:'auto' }}>
                {queueTasks.length === 0 && (
                  <p style={{ fontSize:'11px', color:'#3f3f46', textAlign:'center', padding:'16px 0', letterSpacing:'0.1em' }}>
                    Queue empty
                  </p>
                )}
                {queueTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="cc-slide-in"
                    style={{
                      animationDelay: `${i * 20}ms`,
                      padding:        '8px 10px',
                      borderRadius:   '7px',
                      border:         `1px solid ${statusColor(task.status)}20`,
                      background:     task.status === 'running'
                        ? `${statusColor(task.status)}08`
                        : 'rgba(0,0,0,0.15)',
                      display:        'flex',
                      alignItems:     'center',
                      gap:            '8px',
                    }}
                  >
                    <span style={{ fontSize:'12px', color:statusColor(task.status), flexShrink:0, width:'14px', textAlign:'center' }}>
                      {task.status === 'running'
                        ? <span className="cc-pulse">{statusGlyph(task.status)}</span>
                        : statusGlyph(task.status)}
                    </span>
                    <span style={{ fontSize:'11px', color:'#d4d4d8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {task.id.slice(0, 16)}
                    </span>
                    <Badge status={task.status} />
                    <span style={{ fontSize:'9px', color:'#3f3f46', flexShrink:0 }}>{elapsed(task.updated_at)}</span>
                    {task.cost_used > 0 && (
                      <span style={{ fontSize:'9px', color:'#52525b', flexShrink:0 }}>${task.cost_used.toFixed(5)}</span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Execution Stream */}
            <Panel title="EXECUTION STREAM" accent="#34d399">
              <div
                ref={streamRef}
                className="cc-scroll"
                style={{ display:'flex', flexDirection:'column', gap:'4px', height:'320px', overflowY:'auto' }}
              >
                {streamEvents.length === 0 && (
                  <p style={{ fontSize:'11px', color:'#3f3f46', textAlign:'center', padding:'16px 0', letterSpacing:'0.1em' }}>
                    Stream idle — run a cycle to see activity
                  </p>
                )}
                {streamEvents.map(evt => {
                  const c =
                    evt.type === 'error'    ? '#f87171'
                    : evt.type === 'approved' ? '#34d399'
                    : evt.type === 'cycle'   ? '#fbbf24'
                    : evt.type === 'system'  ? '#60a5fa'
                    : '#71717a'
                  return (
                    <div key={evt.id} className="cc-slide-in" style={{
                      display:'flex', gap:'8px', alignItems:'flex-start', padding:'4px 0',
                      borderBottom:'1px solid #0f0f10',
                    }}>
                      <span style={{ fontSize:'9px', color:'#27272a', flexShrink:0, paddingTop:'1px' }}>
                        {new Date(evt.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                      </span>
                      <span style={{ fontSize:'11px', color: c, flex:1, lineHeight:1.4, wordBreak:'break-word' }}>
                        {evt.message}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </div>

          {/* ── Row 4: Recent Executions + Cost Monitor ───────────────────── */}
          <div className="cc-grid-2" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>

            {/* Recent Executions */}
            <Panel title="RECENT EXECUTIONS" accent="#71717a">
              <div className="cc-scroll" style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'240px', overflowY:'auto' }}>
                {executions.length === 0 && (
                  <p style={{ fontSize:'11px', color:'#3f3f46', textAlign:'center', padding:'12px 0', letterSpacing:'0.1em' }}>
                    No executions yet
                  </p>
                )}
                {executions.map(exec => (
                  <div key={exec.id} style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '10px',
                    padding:    '6px 8px',
                    borderRadius:'6px',
                    borderBottom:'1px solid #0f0f10',
                  }}>
                    <span style={{ fontSize:'12px', color:statusColor(exec.status), flexShrink:0 }}>
                      {statusGlyph(exec.status)}
                    </span>
                    <span style={{ fontSize:'11px', color:'#d4d4d8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {exec.plan_id}
                    </span>
                    <Badge status={exec.status} />
                    <span style={{ fontSize:'10px', color:'#fbbf24', flexShrink:0 }}>
                      ${exec.total_cost.toFixed(5)}
                    </span>
                    <span style={{ fontSize:'9px', color:'#3f3f46', flexShrink:0 }}>
                      {elapsed(exec.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Cost Monitor */}
            <Panel title="COST MONITOR" accent="#fbbf24">
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <Stat
                  label="CREDITS REMAINING"
                  value={credits !== null ? credits.toString() : '—'}
                  color={credits !== null && credits < 10 ? '#f87171' : '#34d399'}
                  sub={credits !== null && credits < 10 ? 'low balance' : undefined}
                />
                <Stat
                  label="SESSION SPEND"
                  value={`$${sessionCost.toFixed(5)}`}
                  color="#fbbf24"
                />
                <Stat
                  label="AVG COST / TASK"
                  value={sessionTasks > 0 ? `$${(sessionCost / sessionTasks).toFixed(5)}` : '—'}
                  color="#a1a1aa"
                />
                <div style={{ height:'1px', background:'#18181b' }} />
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <span style={{ fontSize:'9px', color:'#3f3f46', letterSpacing:'0.2em' }}>QUEUE COST PROFILE</span>
                  {[
                    { label:'Completed', cost: executions.filter(e=>e.status==='complete').reduce((s,e)=>s+e.total_cost,0) },
                    { label:'Failed',    cost: executions.filter(e=>e.status==='failed').reduce((s,e)=>s+e.total_cost,0) },
                    { label:'Session',   cost: sessionCost },
                  ].map(row => (
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', gap:'8px' }}>
                      <span style={{ fontSize:'10px', color:'#52525b' }}>{row.label}</span>
                      <span style={{ fontSize:'10px', color:'#a1a1aa' }}>${row.cost.toFixed(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

        </div>{/* /main content */}
      </div>
    </>
  )
}
