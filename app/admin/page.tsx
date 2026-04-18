// app/admin/page.tsx
// CR AudioViz AI — Billing Command Center.
// Client component: useAuth() guard + ADMIN_EMAILS allowlist.
// Fetches /api/admin/payments, /api/admin/credits, /api/admin/webhooks.
// Auto-refreshes every 10 seconds.
// Updated: April 18, 2026

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

// ── Admin allowlist — must match API routes ───────────────────────────────────
const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'admin@craudiovizai.com',
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface PaymentRow {
  id:             string
  mode:           string
  status:         string | null
  payment_status: string | null
  amount_total:   number | null
  currency:       string | null
  customer_email: string | null
  created:        string
  livemode:       boolean
}

interface CreditSummary {
  user_id:       string
  total_credits: number
  grants:        number
  usages:        number
  refunds:       number
  last_activity: string
}

interface WebhookRow {
  id:              string
  stripe_event_id: string
  event_type:      string
  processed:       boolean
  created_at:      string
}

interface AdminData {
  payments: PaymentRow[]
  credits:  CreditSummary[]
  webhooks: WebhookRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    })
  } catch { return iso }
}

function fmtAmount(cents: number | null, currency: string | null) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)} ${(currency ?? 'usd').toUpperCase()}`
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, loading, error }: {
  title:   string
  count:   number
  loading: boolean
  error:   string | null
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
          {title}
        </h2>
        {!loading && !error && (
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {loading && (
        <span className="text-xs text-gray-500 animate-pulse">loading…</span>
      )}
      {error && !loading && (
        <span className="text-xs text-red-400">Failed to load</span>
      )}
    </div>
  )
}

function Table({ headers, rows }: {
  headers: string[]
  rows:    (string | React.ReactNode)[][]
}) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-6 text-gray-600 text-sm">No data</div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {headers.map(h => (
              <th key={h} className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2.5 pr-4 text-gray-300 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ value, positive, negative }: {
  value:    string | null | boolean
  positive?: string[]
  negative?: string[]
}) {
  const s = String(value ?? '')
  const isGood = positive?.includes(s)
  const isBad  = negative?.includes(s)
  const color  = isGood ? 'text-emerald-400 bg-emerald-900/30'
               : isBad  ? 'text-red-400 bg-red-900/30'
               : 'text-gray-400 bg-gray-800'
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
      {s || '—'}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCommandCenter() {
  const router = useRouter()
  const { user, loading: authLoading, session } = useAuth()

  const [data, setData]       = useState<AdminData>({ payments: [], credits: [], webhooks: [] })
  const [errors, setErrors]   = useState<Record<string, string | null>>({
    payments: null, credits: null, webhooks: null,
  })
  const [loading, setLoading] = useState<Record<string, boolean>>({
    payments: true, credits: true, webhooks: true,
  })
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing]   = useState(false)

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  // ── Fetch all three endpoints ───────────────────────────────────────────────
  const fetchAll = useCallback(async (token: string) => {
    setRefreshing(true)

    const headers = { Authorization: `Bearer ${token}` }

    const fetcher = async (
      key: keyof AdminData,
      path: string,
      extractor: (json: Record<string, unknown>) => unknown[],
    ) => {
      try {
        setLoading(prev => ({ ...prev, [key]: true }))
        const res  = await fetch(path, { headers })
        const json = await res.json() as Record<string, unknown>
        if (!res.ok) throw new Error((json.error as string) ?? `HTTP ${res.status}`)
        setData(prev => ({ ...prev, [key]: extractor(json) }))
        setErrors(prev => ({ ...prev, [key]: null }))
      } catch (e) {
        setErrors(prev => ({ ...prev, [key]: (e as Error).message }))
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }))
      }
    }

    await Promise.all([
      fetcher('payments', '/api/admin/payments?limit=25&status=complete',
        j => (j.sessions as PaymentRow[]) ?? []),
      fetcher('credits',  '/api/admin/credits?limit=50',
        j => (j.summary as CreditSummary[]) ?? []),
      fetcher('webhooks', '/api/admin/webhooks?limit=50',
        j => (j.events as WebhookRow[]) ?? []),
    ])

    setLastRefresh(new Date())
    setRefreshing(false)
  }, [])

  // ── Initial load + 10-second auto-refresh ──────────────────────────────────
  useEffect(() => {
    if (!session?.access_token || authLoading) return
    if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) return

    fetchAll(session.access_token)
    const interval = setInterval(() => fetchAll(session.access_token), 10_000)
    return () => clearInterval(interval)
  }, [session, user, authLoading, fetchAll])

  // ── Render guards ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return null
  }

  // ── Table rows ──────────────────────────────────────────────────────────────
  const paymentRows = data.payments.map(p => [
    <span key="id" className="font-mono text-xs text-gray-500">{truncate(p.id, 24)}</span>,
    <span key="em">{p.customer_email ?? '—'}</span>,
    <span key="am">{fmtAmount(p.amount_total, p.currency)}</span>,
    <StatusBadge key="st" value={p.payment_status}
      positive={['paid']} negative={['unpaid', 'no_payment_required']} />,
    <span key="lv" className={`text-xs ${p.livemode ? 'text-emerald-400' : 'text-amber-400'}`}>
      {p.livemode ? 'live' : 'test'}
    </span>,
    <span key="dt" className="text-xs text-gray-500">{fmt(p.created)}</span>,
  ])

  const creditRows = data.credits.map(c => [
    <span key="id" className="font-mono text-xs text-gray-500">{truncate(c.user_id, 20)}</span>,
    <span key="tc" className={`font-semibold ${c.total_credits >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {c.total_credits.toLocaleString()}
    </span>,
    <span key="gr" className="text-emerald-400">{c.grants}</span>,
    <span key="us" className="text-gray-400">{c.usages}</span>,
    <span key="rf" className="text-red-400">{c.refunds}</span>,
    <span key="la" className="text-xs text-gray-500">{fmt(c.last_activity)}</span>,
  ])

  const webhookRows = data.webhooks.map(w => [
    <span key="et" className="font-mono text-xs">{w.event_type}</span>,
    <StatusBadge key="pr" value={String(w.processed)}
      positive={['true']} negative={['false']} />,
    <span key="ei" className="font-mono text-xs text-gray-600">{truncate(w.stripe_event_id, 20)}</span>,
    <span key="ca" className="text-xs text-gray-500">{fmt(w.created_at)}</span>,
  ])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Billing Command Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Payments · Credits · Webhooks — {user.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Updated {fmt(lastRefresh.toISOString())}
              </span>
            )}
            {refreshing && (
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">Live · 10s</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Section A: Payments ────────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <SectionHeader
            title="Payments"
            count={data.payments.length}
            loading={loading.payments}
            error={errors.payments}
          />
          {loading.payments ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-9 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : errors.payments ? (
            <div className="py-4 text-sm text-red-400">{errors.payments}</div>
          ) : (
            <Table
              headers={['Session ID', 'Email', 'Amount', 'Status', 'Mode', 'Date']}
              rows={paymentRows}
            />
          )}
        </section>

        {/* ── Section B: Credits ─────────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <SectionHeader
            title="Credits"
            count={data.credits.length}
            loading={loading.credits}
            error={errors.credits}
          />
          {loading.credits ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-9 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : errors.credits ? (
            <div className="py-4 text-sm text-red-400">{errors.credits}</div>
          ) : (
            <Table
              headers={['User ID', 'Total Credits', 'Grants', 'Usages', 'Refunds', 'Last Activity']}
              rows={creditRows}
            />
          )}
        </section>

        {/* ── Section C: Webhooks ────────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <SectionHeader
            title="Webhooks"
            count={data.webhooks.length}
            loading={loading.webhooks}
            error={errors.webhooks}
          />
          {loading.webhooks ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-9 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : errors.webhooks ? (
            <div className="py-4 text-sm text-red-400">{errors.webhooks}</div>
          ) : (
            <Table
              headers={['Event Type', 'Processed', 'Event ID', 'Created At']}
              rows={webhookRows}
            />
          )}
        </section>

      </div>
    </div>
  )
}
