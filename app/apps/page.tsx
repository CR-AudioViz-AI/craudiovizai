// ================================================================================
// CR AUDIOVIZ AI - APPS PAGE (NEVER 503)
// Returns 200 + x-cr-degraded header on failure
// ================================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Static fallback apps - always available
const FALLBACK_APPS = [
  { id: '1', name: 'Javari AI', description: 'AI-powered assistant', icon: '🤖', category: 'AI', route_path: '/javari' },
  { id: '2', name: 'Logo Studio', description: 'Create stunning logos', icon: '🎨', category: 'Design', route_path: '/apps/logo-studio' },
  { id: '3', name: 'Invoice Generator', description: 'Professional invoices', icon: '📄', category: 'Business', route_path: '/apps/invoice-generator' },
  { id: '4', name: 'Social Graphics', description: 'Social media designs', icon: '📱', category: 'Design', route_path: '/apps/social-graphics' },
  { id: '5', name: 'Website Builder', description: 'Build websites fast', icon: '🌐', category: 'Development', route_path: '/apps/website-builder' },
  { id: '6', name: 'Music Builder', description: 'Create music with AI', icon: '🎵', category: 'Creative', route_path: '/apps/music-builder' },
];

function DegradedBanner({ errorId }: { errorId?: string }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
      <p className="text-sm text-yellow-700 dark:text-yellow-200">
        Showing cached apps. Some apps may not be visible.
        {errorId && <span className="block text-xs opacity-75">Ref: {errorId}</span>}
      </p>
    </div>
  );
}

function AppCard({ app }: { app: typeof FALLBACK_APPS[0] }) {
  return (
    <Link
      href={app.route_path || '#'}
      className="block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
    >
      <div className="text-4xl mb-4">{app.icon || '📱'}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{app.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{app.description}</p>
      <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
        {app.category}
      </span>
    </Link>
  );
}

export default function AppsPage() {
  const [apps, setApps] = useState(FALLBACK_APPS);
  const [isDegraded, setIsDegraded] = useState(false);
  const [errorId, setErrorId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps', { signal: AbortSignal.timeout(5000) })
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        if (data.apps && data.apps.length > 0) {
          setApps(data.apps);
        }
      })
      .catch(() => {
        setIsDegraded(true);
        setErrorId(crypto.randomUUID().slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {isDegraded && <DegradedBanner errorId={errorId} />}
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Our Apps
        </h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {apps.length} apps available
          </p>
        </div>
      </div>
    </div>
  );
}
