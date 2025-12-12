// app/admin/grants/page.tsx
// Grant Tracking Dashboard - $600M+ Opportunities
// ADMIN ONLY - Roy's Executive Dashboard
// Timestamp: Dec 11, 2025 11:52 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, ArrowLeft, DollarSign, Calendar, FileText,
  CheckCircle, Clock, AlertTriangle, Target, TrendingUp,
  Building, Users, MapPin
} from 'lucide-react';

// Grant opportunities database
const GRANT_OPPORTUNITIES = [
  {
    id: 'fema-bric',
    name: 'FEMA BRIC (Building Resilient Infrastructure)',
    agency: 'FEMA',
    amount: '$1B annually',
    deadline: '2025-01-31',
    status: 'researching',
    modules: ['first-responders'],
    notes: 'Focus on community resilience, perfect for first responder tools',
  },
  {
    id: 'usda-rural',
    name: 'USDA Rural Development',
    agency: 'USDA',
    amount: '$500M',
    deadline: '2025-03-15',
    status: 'preparing',
    modules: ['small-business', 'community'],
    notes: 'Rural community technology grants',
  },
  {
    id: 'va-innovation',
    name: 'VA Innovation Competition',
    agency: 'Dept of Veterans Affairs',
    amount: '$50M',
    deadline: '2025-02-28',
    status: 'submitted',
    modules: ['veterans'],
    notes: 'Veteran support and transition services',
  },
  {
    id: 'hhs-health',
    name: 'HHS Digital Health Initiative',
    agency: 'HHS',
    amount: '$200M',
    deadline: '2025-04-30',
    status: 'researching',
    modules: ['health', 'seniors'],
    notes: 'Healthcare technology for underserved',
  },
  {
    id: 'doj-safety',
    name: 'DOJ Community Safety Grant',
    agency: 'Dept of Justice',
    amount: '$150M',
    deadline: '2025-02-15',
    status: 'preparing',
    modules: ['first-responders', 'community'],
    notes: 'Law enforcement and community safety',
  },
  {
    id: 'petco-foundation',
    name: 'Petco Foundation Love Grant',
    agency: 'Petco Foundation',
    amount: '$25M',
    deadline: 'Rolling',
    status: 'approved',
    modules: ['animal-rescues'],
    notes: 'Animal welfare organizations',
  },
  {
    id: 'lilly-endowment',
    name: 'Lilly Endowment Community Fund',
    agency: 'Lilly Endowment',
    amount: '$100M',
    deadline: 'Rolling',
    status: 'researching',
    modules: ['faith-based', 'community'],
    notes: 'Faith-based and community initiatives',
  },
];

const statusColors = {
  researching: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  preparing: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FileText },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Target },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
};

export default async function AdminGrantsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Verify super admin access
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (user?.role !== 'super_admin') {
    redirect('/admin');
  }

  const totalPipeline = GRANT_OPPORTUNITIES.reduce((sum, g) => {
    const amount = parseFloat(g.amount.replace(/[^0-9.]/g, '')) * (g.amount.includes('B') ? 1000 : 1);
    return sum + amount;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white py-6">
        <div className="container mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center gap-2 text-rose-200 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Heart className="w-8 h-8" /> Grant Tracking
              </h1>
              <p className="text-rose-200">$600M+ in grant opportunities for social impact modules</p>
            </div>
            <div className="text-right">
              <p className="text-rose-200 text-sm">Total Pipeline</p>
              <p className="text-3xl font-bold">${(totalPipeline / 1000).toFixed(1)}B+</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusColors).map(([status, colors]) => {
            const count = GRANT_OPPORTUNITIES.filter(g => g.status === status).length;
            const Icon = colors.icon;
            return (
              <div key={status} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm text-gray-500 capitalize">{status}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Grant Opportunities Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Grant Opportunities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Grant</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Agency</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Deadline</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Modules</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {GRANT_OPPORTUNITIES.map((grant) => {
                  const status = statusColors[grant.status as keyof typeof statusColors];
                  const StatusIcon = status.icon;
                  const isUrgent = grant.deadline !== 'Rolling' && 
                    new Date(grant.deadline) < new Date(Date.now() + 30*24*60*60*1000);
                  
                  return (
                    <tr key={grant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{grant.name}</p>
                        <p className="text-sm text-gray-500">{grant.notes}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{grant.agency}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-green-600">{grant.amount}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`flex items-center gap-2 ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                          <Calendar className="w-4 h-4" />
                          <span className={isUrgent ? 'font-semibold' : ''}>{grant.deadline}</span>
                          {isUrgent && <AlertTriangle className="w-4 h-4" />}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {grant.modules.map((mod) => (
                            <span key={mod} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {mod}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {grant.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRAIverse Modules */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Social Impact Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              'First Responders', 'Veterans', 'Faith-Based', 'Animal Rescues',
              'Small Business', 'Artists/Musicians', 'Community Services',
              'Seniors', 'Youth Programs', 'Health Services',
            ].map((mod) => (
              <div key={mod} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <p className="font-semibold text-gray-900">{mod}</p>
                <p className="text-xs text-gray-500 mt-1">Grant eligible</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
