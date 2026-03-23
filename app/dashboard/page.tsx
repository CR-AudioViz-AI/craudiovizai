// app/dashboard/page.tsx
// CR AudioViz AI — Dashboard + Account Panel.
// Auth from useAuth() (Providers context). Apps from /api/apps.
// Account: avatar, name, email, plan, credits, billing, profile actions.
// Updated: March 22, 2026 — Full account system UI added.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PLAN BADGE
// =============================================================================

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    admin:   'bg-violet-100 text-violet-700 border-violet-200',
    premium: 'bg-amber-100  text-amber-700  border-amber-200',
    power:   'bg-cyan-100   text-cyan-700   border-cyan-200',
    pro:     'bg-blue-100   text-blue-700   border-blue-200',
    free:    'bg-gray-100   text-gray-600   border-gray-200',
  }
  const key   = plan.toLowerCase()
  const style = styles[key] ?? styles.free
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}>
      {plan}
    </span>
  )
}

// =============================================================================
// AVATAR
// =============================================================================

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-10 h-10 text-sm', md: 'w-16 h-16 text-xl', lg: 'w-20 h-20 text-2xl' }
  const initials = name
    .split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '??'
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        className={`${dims[size]} rounded-full object-cover ring-2 ring-cyan-100`}
      />
    )
  }
  return (
    <div className={`${dims[size]} rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-cyan-100`}>
      {initials}
    </div>
  )
}

// =============================================================================
// SECTION CARD
// =============================================================================

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
      {children}
    </h2>
  )
}

// =============================================================================
// ACCOUNT COLUMN (left on desktop)
// =============================================================================

function AccountColumn({ user, credits, plan, isAdmin }: {
  user: { email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string } } | null
  credits: number | null
  plan: string
  isAdmin: boolean
}) {
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Your Account'

  const avatarUrl = user?.user_metadata?.avatar_url

  const [buyLoading, setBuyLoading] = React.useState(false)

  async function handleBuyCredits() {
    setBuyLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId:    'price_1SdaLa7YeQ1dZTUvsjFZWqjB',
          userId:     user?.id ?? '',
          email:      user?.email ?? '',
          mode:       'payment',
          successUrl: window.location.origin + '/dashboard?success=credits',
          cancelUrl:  window.location.origin + '/dashboard',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout failed', data)
        alert('Unable to start checkout. Please try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to payment system. Please try again.')
    } finally {
      setBuyLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Account identity ─────────────────────────────────────── */}
      <Card>
        <SectionTitle>Account</SectionTitle>
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={displayName} avatarUrl={avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email ?? '—'}</p>
            <div className="mt-1.5">
              <PlanBadge plan={isAdmin ? 'Admin' : plan} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:border-cyan-300 hover:text-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:border-cyan-300 hover:text-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Upload Avatar
          </button>
        </div>
      </Card>

      {/* ── Credits ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Credits</SectionTitle>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-4xl font-bold text-cyan-600 tabular-nums">
            {isAdmin ? '∞' : (credits ?? 0).toLocaleString()}
          </span>
          {!isAdmin && (
            <span className="text-sm text-gray-400 mb-1">available</span>
          )}
        </div>
        {!isAdmin && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((credits ?? 0) / 600) * 100)}%` }}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleBuyCredits}
            disabled={buyLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-colors disabled:cursor-wait"
          >
            {buyLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
            )}
            {buyLoading ? 'Redirecting...' : 'Buy Credits'}
          </button>
          <Link
            href="/account/credits"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:border-cyan-300 text-gray-600 hover:text-cyan-700 rounded-xl text-sm font-medium transition-colors"
          >
            View Usage →
          </Link>
        </div>
      </Card>

      {/* ── Billing ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Billing</SectionTitle>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-semibold text-gray-900 capitalize">
              {isAdmin ? 'Admin' : plan} Plan
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdmin
                ? 'Full platform access'
                : plan === 'free'
                ? '25 credits / month'
                : plan === 'pro'
                ? '600 credits / month'
                : plan === 'premium' || plan === 'power'
                ? '2,500 credits / month'
                : 'Monthly subscription'}
            </p>
          </div>
          <PlanBadge plan={isAdmin ? 'Admin' : plan} />
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/pricing"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Upgrade Plan
          </Link>
          <button
            type="button"
            disabled
            title="Coming soon — Stripe integration"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Method
            <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Soon</span>
          </button>
        </div>
      </Card>

    </div>
  )
}

// =============================================================================
// FALLBACK APPS
// =============================================================================

const FALLBACK_APPS = [
  { id: '1', name: 'Javari AI',          icon: '🤖', href: '/javari' },
  { id: '2', name: 'Logo Studio',         icon: '🎨', href: '/apps/logo-studio' },
  { id: '3', name: 'Invoice Generator',   icon: '📄', href: '/apps/invoice-generator' },
];

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

export default function DashboardPage() {
  const { user, credits, plan, isAdmin, loading } = useAuth()

  const [apps, setApps]                 = useState(FALLBACK_APPS)
  const [appsLoading, setAppsLoading]   = useState(true)
  const [isDegraded, setIsDegraded]     = useState(false)
  const [degradeError, setDegradeError] = useState<string | undefined>()

  useEffect(() => {
    console.log('AUTH STATE', { user: user?.email, credits, plan })
  }, [user, credits, plan])

  useEffect(() => {
    fetch('/api/apps?limit=6', { signal: AbortSignal.timeout(5000) })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.apps?.length) setApps(data.apps.slice(0, 6))
        else setIsDegraded(true)
      })
      .catch(err => {
        setIsDegraded(true)
        setDegradeError(err.message)
      })
      .finally(() => setAppsLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {user
              ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'}`
              : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user ? `Signed in as ${user.email}` : 'Sign in to manage your account'}
          </p>
        </div>

        {isDegraded && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl">
            <p className="text-sm text-amber-700">
              Some services are unavailable.
              {degradeError && <span className="block text-xs mt-1 opacity-75">{degradeError}</span>}
            </p>
          </div>
        )}

        {user ? (
          /* ── Logged-in layout: 3-column grid ─────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column: account panel */}
            <div className="lg:col-span-1">
              <AccountColumn
                user={user}
                credits={credits}
                plan={plan}
                isAdmin={isAdmin}
              />
            </div>

            {/* Right column: apps + CTA */}
            <div className="lg:col-span-2 space-y-6">

              {/* Quick Access */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
                  <Link href="/apps" className="text-sm text-cyan-600 hover:underline">
                    All Apps →
                  </Link>
                </div>
                {appsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {apps.map((app: any) => (
                      <Link
                        key={app.id}
                        href={app.href || app.route_path || '#'}
                        className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-cyan-50 border border-transparent hover:border-cyan-200 transition-all group"
                      >
                        <span className="text-3xl mb-2">{app.icon || '📱'}</span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-cyan-700 text-center">
                          {app.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Activity placeholder */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Your recent AI sessions will appear here</p>
                  <Link href="/javari" className="mt-3 text-sm text-cyan-600 hover:underline font-medium">
                    Start a session →
                  </Link>
                </div>
              </Card>

            </div>
          </div>
        ) : (
          /* ── Logged-out state ─────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl mb-6 shadow-lg">
              ◈
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              Access your credits, apps, and account settings.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 border border-gray-200 hover:border-cyan-300 text-gray-700 hover:text-cyan-700 rounded-xl font-semibold transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
