// app/admin/revenue/page.tsx
// Revenue Dashboard - Track all 7 revenue streams
// Timestamp: Dec 11, 2025 11:18 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, ArrowLeft, DollarSign, CreditCard, Users,
  ShoppingCart, Building, Gift, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

async function getRevenueData() {
  const supabase = createServerComponentClient({ cookies });
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // This month's revenue
  const { data: thisMonth } = await supabase
    .from('transactions')
    .select('amount, type, provider')
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString());

  // Last month's revenue
  const { data: lastMonth } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('status', 'completed')
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());

  // Subscription breakdown
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('status', 'active');

  // Recent transactions
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('*, user:users(full_name, email)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  const thisMonthTotal = thisMonth?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const lastMonthTotal = lastMonth?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Revenue by type
  const byType = {
    subscriptions: thisMonth?.filter(t => t.type === 'subscription_payment').reduce((sum, t) => sum + t.amount, 0) || 0,
    credits: thisMonth?.filter(t => t.type === 'credit_purchase').reduce((sum, t) => sum + t.amount, 0) || 0,
  };

  // Revenue by provider
  const byProvider = {
    stripe: thisMonth?.filter(t => t.provider === 'stripe').reduce((sum, t) => sum + t.amount, 0) || 0,
    paypal: thisMonth?.filter(t => t.provider === 'paypal').reduce((sum, t) => sum + t.amount, 0) || 0,
  };

  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    growth,
    byType,
    byProvider,
    subscriptions: subscriptions || [],
    recentTx: recentTx || [],
  };
}

export default async function AdminRevenuePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const data = await getRevenueData();

  const revenueStreams = [
    { name: 'Subscriptions (MRR)', value: data.byType.subscriptions, icon: CreditCard, color: 'blue' },
    { name: 'Credit Purchases', value: data.byType.credits, icon: DollarSign, color: 'green' },
    { name: 'Marketplace Commission', value: 0, icon: ShoppingCart, color: 'purple', coming: true },
    { name: 'White-Label Licenses', value: 0, icon: Building, color: 'orange', coming: true },
    { name: 'Grant Funding', value: 0, icon: Gift, color: 'pink', coming: true },
    { name: 'Affiliate Payouts', value: 0, icon: Users, color: 'indigo', coming: true },
    { name: 'API Usage', value: 0, icon: Percent, color: 'cyan', coming: true },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8" /> Revenue Dashboard
          </h1>
          <p className="text-gray-300">Track all 7 revenue streams</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">This Month</p>
            <p className="text-3xl font-bold text-gray-900">${data.thisMonth.toLocaleString()}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${data.growth >= 0 ? 'text-cyan-500' : 'text-red-600'}`}>
              {data.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(data.growth).toFixed(1)}% vs last month
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Last Month</p>
            <p className="text-3xl font-bold text-gray-900">${data.lastMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-blue-600">{data.subscriptions.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Projected ARR</p>
            <p className="text-3xl font-bold text-cyan-500">${(data.byType.subscriptions * 12).toLocaleString()}</p>
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">7 Revenue Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {revenueStreams.map((stream) => {
              const Icon = stream.icon;
              return (
                <div key={stream.name} className={`p-4 rounded-xl border ${stream.coming ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${stream.coming ? 'text-gray-400' : `text-${stream.color}-600`}`} />
                    <span className="text-sm font-medium text-gray-700">{stream.name}</span>
                  </div>
                  {stream.coming ? (
                    <p className="text-gray-400 text-sm">Coming soon</p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">${stream.value.toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Provider Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Payment Provider</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stripe</span>
                <span className="font-bold text-gray-900">${data.byProvider.stripe.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.thisMonth > 0 ? (data.byProvider.stripe / data.thisMonth) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">PayPal</span>
                <span className="font-bold text-gray-900">${data.byProvider.paypal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-cyan-400 h-2 rounded-full" 
                  style={{ width: `${data.thisMonth > 0 ? (data.byProvider.paypal / data.thisMonth) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Subscription Breakdown</h3>
            <div className="space-y-3">
              {['starter', 'pro', 'premium', 'enterprise'].map(plan => {
                const count = data.subscriptions.filter(s => s.plan_id === plan).length;
                return (
                  <div key={plan} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="capitalize text-gray-600">{plan}</span>
                    <span className="font-bold text-gray-900">{count} subscribers</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Provider</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTx.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{tx.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{tx.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-sm text-gray-600">
                      {tx.type?.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-500">${tx.amount?.toFixed(2)}</td>
                    <td className="py-3 px-4 capitalize text-sm text-gray-600">{tx.provider}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
