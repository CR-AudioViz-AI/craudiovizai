// app/account/credits/page.tsx
// Credits dashboard — shows current balance and recent activity.
// Reads from usage_ledger WHERE feature='credits' for user roy_test_user.
// Thursday, March 19, 2026
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'

interface LedgerRow {
  id:          string
  usage_count: number
  metadata:    { type?: string; source?: string; price_id?: string } | null
  created_at:  string
}

async function fetchCredits(): Promise<{ balance: number; rows: LedgerRow[] }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: rows, error } = await supabase
      .from('usage_ledger')
      .select('id, usage_count, metadata, created_at')
      .eq('user_id', 'roy_test_user')
      .eq('feature', 'credits')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw new Error(error.message)

    const balance = (rows ?? []).reduce((s, r) => s + (r.usage_count ?? 0), 0)
    return { balance, rows: rows ?? [] }
  } catch {
    return { balance: 0, rows: [] }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatSource(row: LedgerRow): string {
  const src = row.metadata?.source ?? row.metadata?.type ?? '—'
  return src.charAt(0).toUpperCase() + src.slice(1)
}

async function CreditsCard() {
  const { balance, rows } = await fetchCredits()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f1f5f9', padding: 24,
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 12, padding: 40,
        maxWidth: 560, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 6 }}>
            CR AudioViz AI
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>
            Your Credits
          </h1>

          {/* Balance */}
          <div style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: 12, padding: '28px 24px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {balance.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
              Available Credits
            </div>
          </div>
        </div>

        {/* Activity */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 16px',
          }}>
            Recent Activity
          </h2>

          {rows.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center',
              padding: '24px 0', border: '1px dashed #e2e8f0', borderRadius: 8 }}>
              No credit activity yet.
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                background: '#f8fafc', padding: '10px 16px',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>DATE</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b',
                  textAlign: 'center', minWidth: 80 }}>SOURCE</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b',
                  textAlign: 'right', minWidth: 60 }}>AMOUNT</span>
              </div>

              {/* Rows */}
              {rows.map((row, i) => (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: i % 2 === 0 ? '#ffffff' : '#fafafa',
                }}>
                  <span style={{ fontSize: 14, color: '#475569' }}>
                    {formatDate(row.created_at)}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b',
                    textAlign: 'center', minWidth: 80 }}>
                    {formatSource(row)}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: row.usage_count >= 0 ? '#059669' : '#dc2626',
                    textAlign: 'right', minWidth: 60,
                  }}>
                    +{row.usage_count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <a href="/javari" style={{
          display: 'block', width: '100%', padding: '14px 0',
          background: '#4F46E5', color: '#ffffff', borderRadius: 8,
          textAlign: 'center', textDecoration: 'none',
          fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
        }}>
          Go to Javari AI →
        </a>

      </div>
    </div>
  )
}

export default async function CreditsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
        Loading credits...
      </div>
    }>
      <CreditsCard />
    </Suspense>
  )
}
