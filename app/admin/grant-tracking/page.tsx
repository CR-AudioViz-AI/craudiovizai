'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Plus,
  TrendingUp,
  Building2,
  Users
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Grant {
  id: string;
  title: string;
  organization: string;
  amount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  deadline: string;
  submitted_date: string | null;
  decision_date: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  documents: string[];
  contact_name: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export default function GrantTrackingPage() {
  const [grants, setGrants] = useState<Grant[]>([
    {
      id: '1',
      title: 'Social Impact Technology Grant',
      organization: 'National Science Foundation',
      amount: 250000,
      status: 'under_review',
      deadline: '2025-12-15',
      submitted_date: '2025-10-20',
      decision_date: null,
      category: 'Technology',
      priority: 'high',
      notes: 'Focus on CRAIverse social impact modules',
      documents: ['proposal.pdf', 'budget.xlsx', 'team-bios.pdf'],
      contact_name: 'Dr. Sarah Johnson',
      contact_email: 'sjohnson@nsf.gov',
      created_at: '2025-09-15T10:00:00Z',
      updated_at: '2025-10-20T14:30:00Z'
    },
    {
      id: '2',
      title: 'Small Business Innovation Research (SBIR)',
      organization: 'Department of Defense',
      amount: 150000,
      status: 'approved',
      deadline: '2025-11-30',
      submitted_date: '2025-10-01',
      decision_date: '2025-10-25',
      category: 'Innovation',
      priority: 'critical',
      notes: 'Approved! Contract negotiation in progress',
      documents: ['sbir-proposal.pdf', 'technical-approach.pdf'],
      contact_name: 'Michael Chen',
      contact_email: 'mchen@dod.gov',
      created_at: '2025-08-10T09:00:00Z',
      updated_at: '2025-10-25T16:45:00Z'
    },
    {
      id: '3',
      title: 'Community Development Block Grant',
      organization: 'HUD',
      amount: 500000,
      status: 'submitted',
      deadline: '2025-11-15',
      submitted_date: '2025-10-28',
      decision_date: null,
      category: 'Community',
      priority: 'high',
      notes: 'Supporting nonprofit organizations through CRAIverse',
      documents: ['cdbg-application.pdf', 'community-impact.pdf'],
      contact_name: 'Lisa Martinez',
      contact_email: 'lmartinez@hud.gov',
      created_at: '2025-09-20T11:00:00Z',
      updated_at: '2025-10-28T13:20:00Z'
    },
    {
      id: '4',
      title: 'Digital Equity Grant',
      organization: 'FCC',
      amount: 100000,
      status: 'draft',
      deadline: '2025-12-01',
      submitted_date: null,
      decision_date: null,
      category: 'Technology',
      priority: 'medium',
      notes: 'Draft in progress - need budget finalization',
      documents: [],
      contact_name: 'Robert Kim',
      contact_email: 'rkim@fcc.gov',
      created_at: '2025-10-15T14:00:00Z',
      updated_at: '2025-10-27T10:15:00Z'
    }
  ]);

  const [filteredGrants, setFilteredGrants] = useState<Grant[]>(grants);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [grants, searchTerm, filterStatus, filterPriority]);

  const applyFilters = () => {
    let filtered = [...grants];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(term) ||
        g.organization.toLowerCase().includes(term) ||
        g.category.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => g.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(g => g.priority === filterPriority);
    }

    setFilteredGrants(filtered);
  };

  const stats = {
    total: grants.length,
    totalAmount: grants.reduce((sum, g) => sum + g.amount, 0),
    approved: grants.filter(g => g.status === 'approved').length,
    approvedAmount: grants.filter(g => g.status === 'approved').reduce((sum, g) => sum + g.amount, 0),
    pending: grants.filter(g => g.status === 'submitted' || g.status === 'under_review').length,
    pendingAmount: grants.filter(g => g.status === 'submitted' || g.status === 'under_review').reduce((sum, g) => sum + g.amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-cyan-500';
      case 'medium': return 'text-cyan-400';
      case 'low': return 'text-cyan-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Eye className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'draft': return <Edit2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-500 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <FileText className="w-8 h-8 text-cyan-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Grant Tracking</h1>
                <p className="text-slate-400">Monitor grant applications and funding</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Grant
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Grants</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-cyan-500" />
                <span className="text-2xl font-bold text-white">${(stats.totalAmount / 1000)}K</span>
              </div>
              <p className="text-slate-400 text-sm">Total Amount</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-cyan-500" />
                <span className="text-2xl font-bold text-white">{stats.approved}</span>
              </div>
              <p className="text-slate-400 text-sm">Approved</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                <span className="text-2xl font-bold text-white">${(stats.approvedAmount / 1000)}K</span>
              </div>
              <p className="text-slate-400 text-sm">Approved $</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">{stats.pending}</span>
              </div>
              <p className="text-slate-400 text-sm">Pending</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">${(stats.pendingAmount / 1000)}K</span>
              </div>
              <p className="text-slate-400 text-sm">Pending $</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search grants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Grants List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredGrants.map((grant) => (
            <div key={grant.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{grant.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(grant.status)}`}>
                      {getStatusIcon(grant.status)}
                      {grant.status.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(grant.priority)}`}>
                      {grant.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {grant.organization}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${grant.amount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Deadline: {new Date(grant.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedGrant(grant);
                    setShowDetailModal(true);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>

              {grant.notes && (
                <p className="text-slate-300 text-sm mb-3">{grant.notes}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  {grant.documents.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400 text-sm">
                      <FileText className="w-4 h-4" />
                      {grant.documents.length} documents
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400 text-sm">
                    <Users className="w-4 h-4" />
                    {grant.contact_name}
                  </span>
                </div>
                <div className="text-slate-500 text-xs">
                  Updated: {new Date(grant.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

          {filteredGrants.length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No grants found matching your filters</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedGrant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-3xl w-full p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedGrant.title}</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedGrant(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Organization</label>
                    <div className="text-white font-medium">{selectedGrant.organization}</div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Amount</label>
                    <div className="text-white font-medium">${selectedGrant.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(selectedGrant.status)}`}>
                      {getStatusIcon(selectedGrant.status)}
                      {selectedGrant.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Priority</label>
                    <div className={`font-medium ${getPriorityColor(selectedGrant.priority)}`}>
                      {selectedGrant.priority.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Deadline</label>
                    <div className="text-white">{new Date(selectedGrant.deadline).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Category</label>
                    <div className="text-white">{selectedGrant.category}</div>
                  </div>
                </div>

                {selectedGrant.notes && (
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Notes</label>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-white">{selectedGrant.notes}</div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 text-sm mb-2">Contact</label>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-white font-medium mb-1">{selectedGrant.contact_name}</div>
                    <div className="text-slate-400">{selectedGrant.contact_email}</div>
                  </div>
                </div>

                {selectedGrant.documents.length > 0 && (
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Documents ({selectedGrant.documents.length})</label>
                    <div className="space-y-2">
                      {selectedGrant.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                          <span className="text-white flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {doc}
                          </span>
                          <button className="text-cyan-500 hover:text-cyan-500">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedGrant(null);
                }}
                className="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Add Grant Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Grant</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center py-8">
                <Plus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Grant creation form coming soon</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
