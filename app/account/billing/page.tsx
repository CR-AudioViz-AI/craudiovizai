// app/account/billing/page.tsx
// Billing status page — shows success/cancel state + live subscription details.
// Reads ?success=1 or ?canceled=1 from Stripe redirect.
// Thursday, March 19, 2026
import { Suspense } from 'react'

interface Sub {
  plan_tier: string
  status: string
  current_period_end: number | null
  is_paid: boolean
  is_active: boolean
}

async function fetchSub(): Promise<Sub | null> {
  try {
    const res = await fetch(
      'https://craudiovizai.com/api/billing/subscription?userId=roy_test_user',
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function formatDate(ms: number | null): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

function StatusBanner({ success, canceled }: { success: boolean; canceled: boolean }) {
  if (success) return (
    <div style={{ background: '#f0fdf4', border: '1px solid #86efac',
      borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>✅ Payment Successful</div>
      <div style={{ color: '#166534', fontSize: 15 }}>Your subscription is now active.</div>
    </div>
  )
  if (canceled) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5',
      borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>❌ Payment Canceled</div>
      <div style={{ color: '#991b1b', fontSize: 15 }}>No charges were made.</div>
    </div>
  )
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontSize: 18, color: '#475569' }}>Billing Status</div>
    </div>
  )
}

async function BillingCard({ success, canceled }: { success: boolean; canceled: boolean }) {
  const sub = await fetchSub()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f1f5f9', padding: 24
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 12, padding: 40,
        maxWidth: 480, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CR AudioViz AI
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Account Billing
          </h1>
        </div>

        {/* Status banner */}
        <StatusBanner success={success} canceled={canceled} />

        {/* Subscription details */}
        {sub ? (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
              Subscription Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Row label="Plan" value={
                sub.plan_tier.charAt(0).toUpperCase() + sub.plan_tier.slice(1)
              } highlight={sub.is_paid} />
              <Row label="Status" value={
                sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
              } highlight={sub.status === 'active'} />
              <Row label="Renews" value={formatDate(sub.current_period_end)} />
            </div>
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center',
            padding: '20px 0', marginBottom: 20 }}>
            Could not load subscription details.
          </div>
        )}

        {/* CTA */}
        <a href="/javari" style={{
          display: 'block', width: '100%', padding: '14px 0',
          background: '#4F46E5', color: '#ffffff', borderRadius: 8,
          textAlign: 'center', textDecoration: 'none',
          fontSize: 15, fontWeight: 600, boxSizing: 'border-box'
        }}>
          Go to Javari AI →
        </a>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: highlight ? '#059669' : '#0f172a'
      }}>{value}</span>
    </div>
  )
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params  = await searchParams
  const success  = params.success === '1'
  const canceled = params.canceled === '1'

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
        Loading...
      </div>
    }>
      <BillingCard success={success} canceled={canceled} />
    </Suspense>
  )
}
