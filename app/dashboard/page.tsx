// ================================================================================
// CR AUDIOVIZ AI - DASHBOARD (NEVER 503)
// Always renders shell - shows degraded banner if services down
// ================================================================================

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8 animate-pulse" />
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Content skeleton */}
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
    <div className="bg-cyan-500 dark:bg-cyan-500/20 border-l-4 border-cyan-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-cyan-500 dark:text-cyan-500">
            Some services are currently unavailable. Showing cached data.
            {error && <span className="block text-xs mt-1 opacity-75">Error: {error}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STATIC FALLBACK DATA
// =============================================================================

const FALLBACK_STATS = {
  credits: 50,
  creditsUsed: 0,
  tier: 'Free',
  appsUsed: 0,
};

const FALLBACK_APPS = [
  { id: '1', name: 'Javari AI', icon: '🤖', href: '/javari' },
  { id: '2', name: 'Logo Studio', icon: '🎨', href: '/apps/logo-studio' },
  { id: '3', name: 'Invoice Generator', icon: '📄', href: '/apps/invoice-generator' },
];

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

interface DashboardData {
  stats: typeof FALLBACK_STATS;
  apps: typeof FALLBACK_APPS;
  isDegraded: boolean;
  error?: string;
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    // Fetch credits
    const creditsRes = await fetch('/api/credits', { 
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    const credits = creditsRes.ok ? await creditsRes.json() : null;
    
    // Fetch apps
    const appsRes = await fetch('/api/apps?limit=6', {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    const appsData = appsRes.ok ? await appsRes.json() : null;
    
    return {
      stats: {
        credits: credits?.balance ?? FALLBACK_STATS.credits,
        creditsUsed: credits?.lifetime_spent ?? FALLBACK_STATS.creditsUsed,
        tier: credits?.plan ?? FALLBACK_STATS.tier,
        appsUsed: credits?.apps_used ?? FALLBACK_STATS.appsUsed,
      },
      apps: appsData?.apps?.slice(0, 6) ?? FALLBACK_APPS,
      isDegraded: !creditsRes.ok || !appsRes.ok,
      error: !creditsRes.ok ? 'Credits unavailable' : undefined,
    };
  } catch (error: any) {
    return {
      stats: FALLBACK_STATS,
      apps: FALLBACK_APPS,
      isDegraded: true,
      error: error.message,
    };
  }
}

function DashboardContent({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Dashboard
        </h1>
        
        {/* Degraded banner if needed */}
        {data.isDegraded && <DegradedBanner error={data.error} />}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.stats.credits}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.tier}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits Used</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.creditsUsed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Apps Used</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.appsUsed}</p>
          </div>
        </div>
        
        {/* Quick Access Apps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.apps.map(app => (
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
      </div>
    </div>
  );
}

// =============================================================================
// MAIN EXPORT - NEVER THROWS
// =============================================================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch(() => setData({
        stats: FALLBACK_STATS,
        apps: FALLBACK_APPS,
        isDegraded: true,
        error: 'Failed to load dashboard',
      }))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading || !data) {
    return <DashboardSkeleton />;
  }
  
  return <DashboardContent data={data} />;
}
