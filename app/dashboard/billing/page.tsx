export const dynamic = 'force-dynamic';

// app/dashboard/billing/page.tsx
// Billing & Subscription Management
// Timestamp: Dec 11, 2025 10:04 PM EST

import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Star,
  Settings
} from 'lucide-react';

async function getBillingData(userId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId);

  return { subscription, transactions: transactions || [], paymentMethods: paymentMethods || [] };
}

export default async function BillingPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect('/login');

  const { subscription, transactions, paymentMethods } = await getBillingData(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-blue-100">Manage your plan, payment methods, and invoices</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h2>
              
              {subscription ? (
                <div className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Star className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {subscription.metadata?.plan_name || subscription.plan_id} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        {subscription.metadata?.credits_per_month?.toLocaleString()} credits/month
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${subscription.metadata?.price || '29.99'}/mo
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-500 mb-4">You're on the Free plan</p>
                  <Link 
                    href="/pricing"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold inline-block hover:from-purple-700 hover:to-pink-700"
                  >
                    Upgrade Now
                  </Link>
                </div>
              )}

              {subscription && (
                <div className="mt-4 flex gap-4">
                  <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                    Change Plan
                  </button>
                  <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  + Add New
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method: any) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            •••• •••• •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      {method.is_default && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment methods saved</p>
                </div>
              )}
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter((t: any) => t.amount > 0).map((tx: any) => (
                        <tr key={tx.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-gray-900">
                              {tx.type === 'subscription_payment' ? 'Subscription' : `${tx.credits} Credits`}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{tx.provider}</p>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tx.status === 'completed' 
                                ? 'bg-green-100 text-green-700'
                                : tx.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-blue-600 hover:text-blue-700">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No billing history yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Billing Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-bold text-gray-900">
                    ${transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Credits Purchased</span>
                  <span className="font-bold text-gray-900">
                    {transactions.reduce((sum: number, t: any) => sum + (t.credits || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transactions</span>
                  <span className="font-bold text-gray-900">{transactions.length}</span>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                Questions about billing or your subscription? Our support team is here to help.
              </p>
              <Link 
                href="/support"
                className="block w-full py-2 text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
