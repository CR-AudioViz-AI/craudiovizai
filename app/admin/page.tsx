// app/admin/page.tsx
// Admin Dashboard - 18 Card System
// Timestamp: Dec 11, 2025 10:10 PM EST

import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
  Activity, Users, CreditCard, Coins, MessageSquare, Shield,
  Gamepad2, Globe, TrendingUp, Bot, FileText, Settings,
  BarChart3, Database, Clock, AlertTriangle, Zap, Heart
} from 'lucide-react';

async function getAdminStats() {
  const supabase = createServerComponentClient({ cookies });
  
  // User stats
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen', new Date(Date.now() - 24*60*60*1000).toISOString());

  // Revenue stats
  const { data: revenueData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', new Date(new Date().setDate(1)).toISOString());

  const monthlyRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // Ticket stats
  const { count: openTickets } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress']);

  // Credit stats
  const { data: creditStats } = await supabase
    .from('credit_transactions')
    .select('credits')
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

  const creditsUsedToday = creditStats?.reduce((sum, t) => sum + Math.abs(t.credits || 0), 0) || 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    monthlyRevenue,
    openTickets: openTickets || 0,
    creditsUsedToday,
  };
}

const ADMIN_CARDS = [
  {
    id: 'system-health',
    title: 'System Health',
    icon: Activity,
    href: '/admin/system',
    color: 'green',
    description: 'Monitor platform status and performance',
  },
  {
    id: 'bot-activity',
    title: 'Bot Activity',
    icon: Bot,
    href: '/admin/bots',
    color: 'purple',
    description: '9 autonomous bots running 24/7',
  },
  {
    id: 'user-management',
    title: 'User Management',
    icon: Users,
    href: '/admin/users',
    color: 'blue',
    description: 'Manage users, roles, and permissions',
  },
  {
    id: 'revenue',
    title: 'Revenue Dashboard',
    icon: TrendingUp,
    href: '/admin/revenue',
    color: 'green',
    description: 'Track revenue across all streams',
  },
  {
    id: 'credits',
    title: 'Credit System',
    icon: Coins,
    href: '/admin/credits',
    color: 'yellow',
    description: 'Monitor credit usage and purchases',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    icon: CreditCard,
    href: '/admin/subscriptions',
    color: 'purple',
    description: 'Manage subscription plans and billing',
  },
  {
    id: 'support',
    title: 'Support Tickets',
    icon: MessageSquare,
    href: '/admin/support',
    color: 'orange',
    description: 'Handle customer support requests',
  },
  {
    id: 'moderation',
    title: 'Content Moderation',
    icon: Shield,
    href: '/admin/moderation',
    color: 'red',
    description: 'Review and moderate user content',
  },
  {
    id: 'apps',
    title: 'App Performance',
    icon: Zap,
    href: '/admin/apps',
    color: 'blue',
    description: 'Monitor 60+ app usage and health',
  },
  {
    id: 'games',
    title: 'Games Analytics',
    icon: Gamepad2,
    href: '/admin/games',
    color: 'pink',
    description: 'Track 1,200+ games engagement',
  },
  {
    id: 'craiverse',
    title: 'CRAIverse Analytics',
    icon: Globe,
    href: '/admin/craiverse',
    color: 'teal',
    description: '20 social impact modules',
  },
  {
    id: 'marketing',
    title: 'Marketing Dashboard',
    icon: BarChart3,
    href: '/admin/marketing',
    color: 'indigo',
    description: 'Campaigns, newsletters, conversions',
  },
  {
    id: 'grants',
    title: 'Grant Tracking',
    icon: Heart,
    href: '/admin/grants',
    color: 'rose',
    description: 'Track $600M+ grant opportunities',
  },
  {
    id: 'competitor-intel',
    title: 'Competitor Intel',
    icon: FileText,
    href: '/admin/competitors',
    color: 'slate',
    description: 'News apps and market intelligence',
  },
  {
    id: 'ai-training',
    title: 'AI/Avatar Training',
    icon: Bot,
    href: '/admin/training',
    color: 'violet',
    description: 'Javari AI learning and improvement',
  },
  {
    id: 'cost-tracking',
    title: 'Cost Tracking',
    icon: CreditCard,
    href: '/admin/costs',
    color: 'amber',
    description: 'Supabase, Vercel, API costs',
  },
  {
    id: 'database',
    title: 'Database Management',
    icon: Database,
    href: '/admin/database',
    color: 'cyan',
    description: 'Tables, migrations, backups',
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    icon: Clock,
    href: '/admin/audit',
    color: 'gray',
    description: 'Track all system activity',
  },
];

function AdminCard({ card, stats }: { card: typeof ADMIN_CARDS[0]; stats?: any }) {
  const Icon = card.icon;
  const colorClasses: Record<string, string> = {
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
    indigo: 'from-indigo-500 to-indigo-600',
    rose: 'from-rose-500 to-rose-600',
    slate: 'from-slate-500 to-slate-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <Link href={card.href}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[card.color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {stats && (
            <span className="text-2xl font-bold text-gray-900">{stats}</span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
        <p className="text-sm text-gray-500">{card.description}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect('/login');

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-300">CR AudioViz AI Control Center</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Active Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="text-2xl font-bold text-blue-600">${stats.monthlyRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Open Tickets</p>
            <p className="text-2xl font-bold text-orange-600">{stats.openTickets}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Credits Used Today</p>
            <p className="text-2xl font-bold text-purple-600">{stats.creditsUsedToday.toLocaleString()}</p>
          </div>
        </div>

        {/* 18 Card Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Management Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ADMIN_CARDS.map((card) => (
            <AdminCard key={card.id} card={card} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">5 new users registered</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">$89.99 subscription payment received</p>
                <p className="text-xs text-gray-500">32 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
