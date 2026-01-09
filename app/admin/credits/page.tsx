export const dynamic = 'force-dynamic';

// app/admin/credits/page.tsx
// Admin Credit System Management
// Timestamp: Dec 11, 2025 10:25 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Coins, ArrowLeft, TrendingUp, TrendingDown, Users, Zap, Gift, RefreshCw } from 'lucide-react';

async function getCreditStats() {
  const supabase = createServerComponentClient({ cookies });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total credits in circulation
  const { data: totalCredits } = await supabase
    .from('user_credits')
    .select('balance');
  const totalInCirculation = totalCredits?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;

  // Credits used today
  const { data: usedToday } = await supabase
    .from('credit_transactions')
    .select('credits')
    .eq('type', 'deduction')
    .gte('created_at', today.toISOString());
  const creditsUsedToday = usedToday?.reduce((sum, t) => sum + Math.abs(t.credits || 0), 0) || 0;

  // Credits purchased today
  const { data: purchasedToday } = await supabase
    .from('credit_transactions')
    .select('credits')
    .eq('type', 'purchase')
    .gte('created_at', today.toISOString());
  const creditsPurchasedToday = purchasedToday?.reduce((sum, t) => sum + (t.credits || 0), 0) || 0;

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from('credit_transactions')
    .select('*, user:users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    totalInCirculation,
    creditsUsedToday,
    creditsPurchasedToday,
    recentTransactions: recentTransactions || [],
  };
}

export default async function AdminCreditsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const stats = await getCreditStats();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-400 to-cyan-400 text-white py-6">
        <div className="container mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center gap-2 text-cyan-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Coins className="w-8 h-8" />
                Credit System Management
              </h1>
              <p className="text-cyan-400">Monitor credit usage, purchases, and distribution</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold">
                <Gift className="w-4 h-4 inline mr-2" />
                Grant Credits
              </button>
              <button className="px-4 py-2 bg-white text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-400">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Process Refunds
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total in Circulation</p>
              <Coins className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalInCirculation.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Across all users</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Used Today</p>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.creditsUsedToday.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Consumed by apps</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Purchased Today</p>
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-3xl font-bold text-cyan-500">{stats.creditsPurchasedToday.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">New credits sold</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Net Flow Today</p>
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`text-3xl font-bold ${stats.creditsPurchasedToday - stats.creditsUsedToday >= 0 ? 'text-cyan-500' : 'text-red-600'}`}>
              {stats.creditsPurchasedToday - stats.creditsUsedToday >= 0 ? '+' : ''}{(stats.creditsPurchasedToday - stats.creditsUsedToday).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Purchased - Used</p>
          </div>
        </div>

        {/* Credit Policy Reminder */}
        <div className="bg-cyan-500 border border-cyan-500 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-cyan-500 mb-2">✨ Credits Never Expire Policy</h3>
          <p className="text-cyan-500">On paid plans, credits never expire. This is our customer promise. Free tier credits may have different policies.</p>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Credit Transactions</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Credits</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Source/App</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.length > 0 ? stats.recentTransactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="py-3 px-6">
                    <p className="text-sm font-medium text-gray-900">{tx.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{tx.user?.email}</p>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      tx.type === 'purchase' ? 'bg-cyan-500 text-cyan-500' :
                      tx.type === 'deduction' ? 'bg-red-100 text-red-700' :
                      tx.type === 'refund' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`font-bold ${tx.credits > 0 ? 'text-cyan-500' : 'text-red-600'}`}>
                      {tx.credits > 0 ? '+' : ''}{tx.credits}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-500">{tx.source || tx.app_id || '-'}</td>
                  <td className="py-3 px-6 text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
