// app/admin/users/page.tsx
// Admin User Management
// Timestamp: Dec 11, 2025 10:15 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Search, Filter, MoreVertical, Mail, Ban, 
  Crown, CheckCircle, Clock, ArrowLeft, Download
} from 'lucide-react';

async function getUsers(page = 1, limit = 20) {
  const supabase = createServerComponentClient({ cookies });
  const offset = (page - 1) * limit;

  const { data: users, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { users: users || [], total: count || 0 };
}

export default async function AdminUsersPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect('/login');

  const { users, total } = await getUsers();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8" />
                User Management
              </h1>
              <p className="text-gray-300">{total.toLocaleString()} total users</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold">
                + Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Roles</option>
                <option>Admin</option>
                <option>User</option>
                <option>Creator</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>Active</option>
                <option>Suspended</option>
                <option>Pending</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Plan</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Credits</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.full_name || 'No Name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      user.subscription_tier === 'premium' 
                        ? 'bg-purple-100 text-purple-700'
                        : user.subscription_tier === 'pro'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.subscription_tier === 'premium' && <Crown className="w-3 h-3" />}
                      {user.subscription_tier || 'Free'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">
                      {(user.credit_balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : user.status === 'suspended'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status === 'active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Email User">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Suspend User">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing 1-{Math.min(20, total)} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">3</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
