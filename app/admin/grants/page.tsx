// app/admin/grants/page.tsx  
// Admin Grant Tracking - $600M+ Opportunities
// Timestamp: Dec 11, 2025 10:31 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, DollarSign, FileText, Calendar, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const GRANT_OPPORTUNITIES = [
  {
    id: '1',
    name: 'SBIR Phase II',
    agency: 'NSF',
    amount: '$1,000,000',
    deadline: '2025-03-15',
    status: 'researching',
    module: 'Technology Innovation',
    priority: 'high',
  },
  {
    id: '2',
    name: 'Community Development Block Grant',
    agency: 'HUD',
    amount: '$500,000',
    deadline: '2025-02-28',
    status: 'drafting',
    module: 'Small Business Support',
    priority: 'high',
  },
  {
    id: '3',
    name: 'Veterans Affairs Innovation Grant',
    agency: 'VA',
    amount: '$750,000',
    deadline: '2025-04-01',
    status: 'researching',
    module: 'Veterans Services',
    priority: 'medium',
  },
  {
    id: '4',
    name: 'First Responder Technology Grant',
    agency: 'DHS/FEMA',
    amount: '$2,000,000',
    deadline: '2025-05-15',
    status: 'identified',
    module: 'First Responders',
    priority: 'high',
  },
  {
    id: '5',
    name: 'Faith-Based Community Initiative',
    agency: 'HHS',
    amount: '$300,000',
    deadline: '2025-03-30',
    status: 'researching',
    module: 'Faith Communities',
    priority: 'medium',
  },
  {
    id: '6',
    name: 'Animal Welfare Innovation Fund',
    agency: 'USDA',
    amount: '$250,000',
    deadline: '2025-06-01',
    status: 'identified',
    module: 'Animal Rescues',
    priority: 'low',
  },
];

const SOCIAL_IMPACT_MODULES = [
  'First Responders', 'Veterans Services', 'Faith Communities', 'Animal Rescues',
  'Small Business Support', 'Artist Development', 'Musician Support', 'Community Services',
  'Education Access', 'Healthcare Access', 'Housing Assistance', 'Food Security',
  'Mental Health', 'Senior Services', 'Youth Programs', 'Disability Services',
  'Environmental Justice', 'Rural Development', 'Urban Renewal', 'Technology Access'
];

export default async function AdminGrantsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const totalPipeline = GRANT_OPPORTUNITIES.reduce((sum, g) => {
    const amount = parseInt(g.amount.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-700 to-rose-600 text-white py-6">
        <div className="container mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center gap-2 text-rose-200 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Heart className="w-8 h-8" />
                Grant Tracking
              </h1>
              <p className="text-rose-200">$600M+ opportunities for 20 social impact modules</p>
            </div>
            <button className="px-4 py-2 bg-white text-rose-600 rounded-lg font-semibold hover:bg-rose-50">
              + Add Grant Opportunity
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-rose-500" />
              <p className="text-sm text-gray-500">Total Opportunity</p>
            </div>
            <p className="text-3xl font-bold text-rose-600">$600M+</p>
            <p className="text-xs text-gray-400">Across all modules</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              <p className="text-sm text-gray-500">Active Pipeline</p>
            </div>
            <p className="text-3xl font-bold text-green-600">${(totalPipeline / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-400">{GRANT_OPPORTUNITIES.length} grants in progress</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <p className="text-sm text-gray-500">Applications</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{GRANT_OPPORTUNITIES.filter(g => g.status === 'drafting').length}</p>
            <p className="text-xs text-gray-400">In progress</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-purple-500" />
              <p className="text-sm text-gray-500">Impact Modules</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">20</p>
            <p className="text-xs text-gray-400">Social impact areas</p>
          </div>
        </div>

        {/* 20 Social Impact Modules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">20 Social Impact Modules</h2>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_IMPACT_MODULES.map((module) => (
              <span key={module} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-sm font-medium">
                {module}
              </span>
            ))}
          </div>
        </div>

        {/* Grant Pipeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Grant Pipeline</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Grant</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Agency</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Module</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Deadline</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {GRANT_OPPORTUNITIES.map((grant) => (
                <tr key={grant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-gray-900">{grant.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      grant.priority === 'high' ? 'bg-red-100 text-red-700' :
                      grant.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{grant.priority}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{grant.agency}</td>
                  <td className="py-4 px-6 font-bold text-green-600">{grant.amount}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{grant.module}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {grant.deadline}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      grant.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      grant.status === 'drafting' ? 'bg-blue-100 text-blue-700' :
                      grant.status === 'researching' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {grant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
