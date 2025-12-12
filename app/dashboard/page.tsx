// app/dashboard/page.tsx
// Complete Customer Dashboard - All Features
// Timestamp: Dec 11, 2025 9:59 PM EST

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
  Coins, 
  CreditCard, 
  FileImage, 
  Settings, 
  TrendingUp, 
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Star,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

async function getDashboardData(userId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get user profile with subscription info
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Get credit balance
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('user_id', userId)
    .single();

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get recent assets
  const { data: assets } = await supabase
    .from('user_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6);

  // Get usage stats for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from('credit_transactions')
    .select('credits, app_id')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  return {
    profile,
    credits: credits || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 },
    transactions: transactions || [],
    assets: assets || [],
    usage: usage || [],
  };
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = 'blue' 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subtext?: string;
  color?: string;
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ 
  href, 
  icon: Icon, 
  label, 
  description 
}: { 
  href: string; 
  icon: any; 
  label: string; 
  description: string;
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const data = await getDashboardData(session.user.id);
  const { profile, credits, transactions, assets, usage } = data;

  const monthlyUsage = usage.reduce((sum, t) => sum + Math.abs(t.credits), 0);
  const appsUsed = new Set(usage.map(t => t.app_id)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}!
              </h1>
              <p className="text-blue-100">
                Your creative dashboard • {profile?.subscription_tier || 'Free'} Plan
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/apps"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors"
              >
                Browse Apps
              </Link>
              <Link 
                href="/dashboard/credits"
                className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            icon={Coins}
            label="Credit Balance"
            value={credits.balance.toLocaleString()}
            subtext="Never expire on paid plans"
            color="blue"
          />
          <StatsCard 
            icon={TrendingUp}
            label="Used This Month"
            value={monthlyUsage.toLocaleString()}
            subtext={`Across ${appsUsed} apps`}
            color="green"
          />
          <StatsCard 
            icon={FileImage}
            label="Assets Created"
            value={assets.length}
            subtext="Images, videos, & more"
            color="purple"
          />
          <StatsCard 
            icon={Star}
            label="Plan Status"
            value={profile?.subscription_status === 'active' ? 'Active' : 'Free'}
            subtext={profile?.subscription_tier || 'Upgrade for more'}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction 
                  href="/apps/image-generator"
                  icon={Sparkles}
                  label="Generate Images"
                  description="Create AI images"
                />
                <QuickAction 
                  href="/apps/video-generator"
                  icon={Zap}
                  label="Create Videos"
                  description="AI video generation"
                />
                <QuickAction 
                  href="/apps/music-builder"
                  icon={Star}
                  label="Make Music"
                  description="AI composition"
                />
                <QuickAction 
                  href="/apps/builder"
                  icon={Settings}
                  label="Build Apps"
                  description="No-code app builder"
                />
              </div>
            </div>

            {/* Recent Assets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Creations</h2>
                <Link href="/dashboard/assets" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  View All →
                </Link>
              </div>
              
              {assets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {assets.map((asset: any) => (
                    <div key={asset.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {asset.thumbnail_url ? (
                        <img 
                          src={asset.thumbnail_url} 
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                        <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                          <RefreshCw className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No creations yet</p>
                  <Link 
                    href="/apps"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Start Creating
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Credit Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Coins className="w-8 h-8" />
                <div>
                  <p className="text-blue-100 text-sm">Available Credits</p>
                  <p className="text-3xl font-bold">{credits.balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-blue-200">Lifetime Earned</p>
                  <p className="font-semibold">{credits.lifetime_earned.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-200">Lifetime Used</p>
                  <p className="font-semibold">{credits.lifetime_spent.toLocaleString()}</p>
                </div>
              </div>
              <Link 
                href="/dashboard/credits"
                className="block w-full py-3 bg-white text-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors"
              >
                Buy More Credits
              </Link>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <Link href="/dashboard/billing" className="text-blue-600 text-sm">
                  View All
                </Link>
              </div>
              
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'credit_purchase' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {tx.type === 'credit_purchase' ? (
                            <CreditCard className="w-4 h-4 text-green-600" />
                          ) : (
                            <Zap className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.type === 'credit_purchase' ? 'Credits Purchased' : 'Credits Used'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        tx.credits > 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tx.credits > 0 ? '+' : ''}{tx.credits}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>

            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Your Plan</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {profile?.subscription_tier || 'Free'} Plan
                  </p>
                  <p className="text-sm text-gray-500">
                    {profile?.subscription_status === 'active' ? 'Active' : 'Not subscribed'}
                  </p>
                </div>
              </div>
              
              {profile?.subscription_status !== 'active' && (
                <Link 
                  href="/pricing"
                  className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-center hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  Upgrade Now
                </Link>
              )}
              
              {profile?.subscription_status === 'active' && (
                <Link 
                  href="/dashboard/billing"
                  className="block w-full py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold text-center hover:bg-gray-50 transition-colors"
                >
                  Manage Subscription
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Account</h3>
              <nav className="space-y-2">
                <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <Link href="/dashboard/billing" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <CreditCard className="w-5 h-5" />
                  <span>Billing</span>
                </Link>
                <Link href="/dashboard/assets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <FileImage className="w-5 h-5" />
                  <span>My Assets</span>
                </Link>
                <Link href="/support" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span>Support</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
