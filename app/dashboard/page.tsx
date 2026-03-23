// app/dashboard/page.tsx
// CR AudioViz AI — Dashboard.
// Credits + plan from useAuth() (Providers context, usage_ledger-based).
// Apps from /api/apps. Never throws — degrades gracefully.
// Updated: March 22, 2026 — useAuth() for credits/plan.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DEGRADED BANNER
// =============================================================================

function DegradedBanner({ error }: { error?: string }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <p className="text-sm text-amber-700">
        Some services are unavailable. Showing cached data.
        {error && <span className="block text-xs mt-1 opacity-75">Error: {error}</span>}
      </p>
    </div>
  );
}

// =============================================================================
// FALLBACK APPS
// =============================================================================

const FALLBACK_APPS = [
  { id: '1', name: 'Javari AI', icon: '🤖', href: '/javari' },
  { id: '2', name: 'Logo Studio', icon: '🎨', href: '/apps/logo-studio' },
  { id: '3', name: 'Invoice Generator', icon: '📄', href: '/apps/invoice-generator' },
];

// =============================================================================
// DASHBOARD
// =============================================================================

export default function DashboardPage() {
  const { user, credits, plan, loading } = useAuth()

  const [apps, setApps]               = useState(FALLBACK_APPS)
  const [appsLoading, setAppsLoading] = useState(true)
  const [isDegraded, setIsDegraded]   = useState(false)
  const [degradeError, setDegradeError] = useState<string | undefined>()

  // Auth state validation log
  useEffect(() => {
    console.log('AUTH STATE', { user: user?.email, credits, plan })
  }, [user, credits, plan])

  // Fetch apps separately — doesn't need auth
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

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {user ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'}` : 'Dashboard'}
        </h1>

        {isDegraded && <DegradedBanner error={degradeError} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {credits ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
              {plan || 'free'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {user?.email || '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <p className="text-sm font-medium text-green-600">
              {user ? 'Active' : 'Guest'}
            </p>
          </div>
        </div>

        {/* Quick Access Apps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
          {appsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {apps.map((app: any) => (
                <Link
                  key={app.id}
                  href={app.href || app.route_path || '#'}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-2xl mb-2">{app.icon || '📱'}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                    {app.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/apps"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Explore All Apps
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Not logged in CTA */}
        {!user && (
          <div className="mt-6 text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-gray-600 dark:text-gray-400 mb-3">Sign in to see your credits and personalized dashboard</p>
            <Link href="/login" className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
              Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
