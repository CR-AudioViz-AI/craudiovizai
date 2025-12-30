// /app/dashboard/page.tsx
// User Dashboard - CR AudioViz AI / Javari
// Personal command center with credits, activity, recommendations

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface UserStats {
  credits: number;
  creditsUsedThisMonth: number;
  tier: string;
  memberSince: string;
  totalProjects: number;
  activeStreak: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  icon: string;
  url?: string;
}

interface QuickAction {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
}

// =============================================================================
// DASHBOARD COMPONENTS
// =============================================================================

function StatCard({ label, value, icon, trend, color = 'blue' }: {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function CreditMeter({ used, total, tier }: { used: number; total: number; tier: string }) {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = total - used;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Credits This Month</h3>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          {tier} Plan
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${
            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {used.toLocaleString()} used
        </span>
        <span className="text-gray-900 dark:text-white font-medium">
          {remaining.toLocaleString()} remaining
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Need more credits?
        </span>
        <Link
          href="/pricing"
          className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Upgrade Plan →
        </Link>
      </div>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: RecentActivity[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-2 block">📭</span>
          <p>No recent activity yet</p>
          <p className="text-sm">Start using Javari to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.timestamp}
                </p>
              </div>
              {activity.url && (
                <Link
                  href={activity.url}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  View
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/activity"
        className="block text-center text-sm text-blue-600 dark:text-blue-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 hover:underline"
      >
        View All Activity →
      </Link>
    </div>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.url}
            className={`${action.color} p-4 rounded-xl text-white text-center hover:opacity-90 transition-opacity`}
          >
            <span className="text-2xl block mb-2">{action.icon}</span>
            <span className="text-sm font-medium">{action.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function JavariWidget() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
      <div className="flex items-center gap-4 mb-4">
        {/* Javari Avatar */}
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
          <div className="relative">
            <div className="flex gap-2 mb-1">
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <div className="w-4 h-1.5 bg-white rounded-full mx-auto" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg">{greeting}! 👋</h3>
          <p className="text-blue-100">How can I help you today?</p>
        </div>
      </div>

      <Link
        href="/chat"
        className="block w-full py-3 bg-white/20 hover:bg-white/30 rounded-lg text-center font-medium backdrop-blur transition-colors"
      >
        💬 Start Chatting with Javari
      </Link>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-sm text-blue-100 mb-2">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {['Create a logo', 'Write an email', 'Analyze my data'].map((prompt) => (
            <Link
              key={prompt}
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              {prompt}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD PAGE
// =============================================================================

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats>({
    credits: 450,
    creditsUsedThisMonth: 50,
    tier: 'Starter',
    memberSince: 'December 2025',
    totalProjects: 12,
    activeStreak: 5
  });

  const [activities, setActivities] = useState<RecentActivity[]>([
    { id: '1', type: 'chat', title: 'Chat with Javari', timestamp: '2 hours ago', icon: '💬', url: '/chat' },
    { id: '2', type: 'tool', title: 'Created a new logo', timestamp: '5 hours ago', icon: '🎨', url: '/projects/logo-1' },
    { id: '3', type: 'document', title: 'Generated business proposal', timestamp: 'Yesterday', icon: '📄', url: '/projects/doc-1' },
    { id: '4', type: 'game', title: 'Played Puzzle Quest', timestamp: '2 days ago', icon: '🎮', url: '/games' },
    { id: '5', type: 'purchase', title: 'Purchased 500 credits', timestamp: '3 days ago', icon: '💳' }
  ]);

  const quickActions: QuickAction[] = [
    { id: 'chat', name: 'Chat with Javari', icon: '💬', url: '/chat', color: 'bg-gradient-to-br from-blue-500 to-purple-500' },
    { id: 'logo', name: 'Create Logo', icon: '🎨', url: '/tools/logo-creator', color: 'bg-gradient-to-br from-pink-500 to-rose-500' },
    { id: 'document', name: 'Write Document', icon: '📄', url: '/tools/document-writer', color: 'bg-gradient-to-br from-green-500 to-emerald-500' },
    { id: 'games', name: 'Play Games', icon: '🎮', url: '/games', color: 'bg-gradient-to-br from-orange-500 to-amber-500' }
  ];

  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Load user data
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === 'true') {
      // Show welcome toast or animation
      console.log('Welcome new user!');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">J</span>
                </div>
              </Link>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back{userName ? `, ${userName}` : ''}!</p>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              <Link href="/hub" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Module Hub
              </Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Pricing
              </Link>
              <Link href="/support" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Support
              </Link>
              <Link href="/settings" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xl">👤</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Available Credits"
            value={stats.credits.toLocaleString()}
            icon="💳"
            color="blue"
          />
          <StatCard
            label="Projects Created"
            value={stats.totalProjects}
            icon="📁"
            color="purple"
          />
          <StatCard
            label="Active Streak"
            value={`${stats.activeStreak} days`}
            icon="🔥"
            trend="Keep it up!"
            color="orange"
          />
          <StatCard
            label="Member Since"
            value={stats.memberSince}
            icon="⭐"
            color="green"
          />
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Javari Widget */}
          <div className="space-y-6">
            <JavariWidget />
            <QuickActions actions={quickActions} />
          </div>

          {/* Middle Column - Credit Meter & Activity */}
          <div className="space-y-6">
            <CreditMeter
              used={stats.creditsUsedThisMonth}
              total={500}
              tier={stats.tier}
            />
            <ActivityFeed activities={activities} />
          </div>

          {/* Right Column - Recommendations & Social */}
          <div className="space-y-6">
            {/* Recommended Tools */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recommended for You</h3>
              <div className="space-y-3">
                {[
                  { name: 'Logo Creator', icon: '🎨', desc: 'Design your brand', url: '/tools/logo-creator' },
                  { name: 'Market Oracle', icon: '📈', desc: 'Track investments', url: '/tools/market-oracle' },
                  { name: 'Games Hub', icon: '🎮', desc: 'Take a break', url: '/games' }
                ].map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.url}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tool.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tool.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/hub"
                className="block text-center text-sm text-blue-600 dark:text-blue-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 hover:underline"
              >
                Explore All Modules →
              </Link>
            </div>

            {/* Social Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Stay Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Follow us for updates, tips, and exclusive content!
              </p>
              <div className="flex gap-2">
                {[
                  { name: 'Twitter', icon: '𝕏', url: 'https://twitter.com/CRAudioVizAI', color: 'bg-black' },
                  { name: 'Discord', icon: '💬', url: 'https://discord.gg/javari', color: 'bg-indigo-600' },
                  { name: 'YouTube', icon: '▶️', url: 'https://youtube.com/@CRAudioVizAI', color: 'bg-red-600' }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${social.color} w-10 h-10 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity`}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <Link
                href="/socials"
                className="block text-sm text-blue-600 dark:text-blue-400 mt-4 hover:underline"
              >
                See all platforms →
              </Link>
            </div>

            {/* Help Card */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Our team is here to help you succeed.
              </p>
              <div className="space-y-2">
                <Link
                  href="/support"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📋 Submit a Ticket
                </Link>
                <Link
                  href="/docs"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📚 Documentation
                </Link>
                <Link
                  href="/support/enhancement-request"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  💡 Request a Feature
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
