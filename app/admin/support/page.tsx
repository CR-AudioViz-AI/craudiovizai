'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source_app: string;
  user_email: string | null;
  user_name: string | null;
  auto_fix_attempted: boolean;
  auto_fix_successful: boolean | null;
  auto_fix_actions: any[] | null;
  auto_fix_logs: string | null;
  auto_fix_timestamp: string | null;
  assigned_bot: string | null;
  resolution: string | null;
  resolution_type: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Enhancement {
  id: string;
  request_number: string;
  title: string;
  description: string;
  use_case: string | null;
  expected_benefit: string | null;
  category: string;
  priority: string;
  status: string;
  source_app: string;
  user_email: string | null;
  user_name: string | null;
  ai_analysis: any | null;
  ai_implementation_plan: string | null;
  ai_estimated_effort: string | null;
  ai_estimated_complexity: string | null;
  approval_status: string | null;
  upvotes: number;
  downvotes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Status configs
const TICKET_STATUSES = [
  { key: 'open', label: 'Open', color: '#3B82F6', bg: 'bg-blue-500' },
  { key: 'auto_fixing', label: 'Auto-Fixing', color: '#F59E0B', bg: 'bg-cyan-400' },
  { key: 'in_progress', label: 'In Progress', color: '#8B5CF6', bg: 'bg-cyan-500' },
  { key: 'awaiting_user', label: 'Awaiting User', color: '#F97316', bg: 'bg-cyan-500' },
  { key: 'resolved', label: 'Resolved', color: '#22C55E', bg: 'bg-cyan-500' },
  { key: 'escalated', label: 'Escalated', color: '#EF4444', bg: 'bg-red-500' },
  { key: 'closed', label: 'Closed', color: '#6B7280', bg: 'bg-gray-500' },
];

const ENHANCEMENT_STATUSES = [
  { key: 'submitted', label: 'Submitted', color: '#3B82F6', bg: 'bg-blue-500' },
  { key: 'under_review', label: 'Under Review', color: '#F59E0B', bg: 'bg-cyan-400' },
  { key: 'approved', label: 'Approved', color: '#22C55E', bg: 'bg-cyan-500' },
  { key: 'in_development', label: 'In Development', color: '#8B5CF6', bg: 'bg-cyan-500' },
  { key: 'deployed', label: 'Deployed', color: '#10B981', bg: 'bg-cyan-500' },
  { key: 'rejected', label: 'Rejected', color: '#EF4444', bg: 'bg-red-500' },
];

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-cyan-500 text-white',
  medium: 'bg-cyan-400 text-black',
  low: 'bg-gray-300 text-gray-700',
};

export default function AdminSupportDashboard() {
  // State
  const [activeTab, setActiveTab] = useState<'tickets' | 'enhancements'>('tickets');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [stats, setStats] = useState<any>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'tickets') {
        const res = await fetch('/api/tickets');
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets || []);
          setStats(data.stats || {});
        }
      } else {
        const res = await fetch('/api/enhancements');
        const data = await res.json();
        if (data.success) {
          setEnhancements(data.enhancements || []);
          setStats(data.stats || {});
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get selected item
  const selectedItem = activeTab === 'tickets' 
    ? tickets.find(t => t.id === selectedId)
    : enhancements.find(e => e.id === selectedId);

  // Run auto-fix manually
  const runAutoFix = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/cron/autofix', { method: 'POST' });
      const data = await res.json();
      alert(`Auto-fix complete!\n\nProcessed: ${data.results?.processed || 0}\nFixed: ${data.results?.fixed || 0}\nEscalated: ${data.results?.failed || 0}\nSkipped: ${data.results?.skipped || 0}`);
      fetchData();
    } catch (error) {
      alert('Failed to run auto-fix');
    }
    setProcessing(false);
  };

  // Update ticket status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const endpoint = activeTab === 'tickets' ? '/api/tickets' : '/api/enhancements';
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      fetchData();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Format helpers
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleString() : 'N/A';
  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };

  const getStatusConfig = (status: string) => {
    const configs = activeTab === 'tickets' ? TICKET_STATUSES : ENHANCEMENT_STATUSES;
    return configs.find(s => s.key === status) || { key: status, label: status, color: '#6B7280', bg: 'bg-gray-500' };
  };

  // Get items by status for kanban
  const getItemsByStatus = (status: string) => {
    if (activeTab === 'tickets') {
      return tickets.filter(t => t.status === status);
    }
    return enhancements.filter(e => e.status === status);
  };

  const statuses = activeTab === 'tickets' ? TICKET_STATUSES : ENHANCEMENT_STATUSES;

  // Card click handler
  const handleCardClick = (id: string) => {
    console.log('Card clicked:', id);
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛠️ Admin Support Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage tickets, enhancements, and Javari auto-fix</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total || 0}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                {activeTab === 'tickets' && (
                  <>
                    <div className="text-center border-l pl-4">
                      <div className="text-2xl font-bold text-cyan-500">{stats.autoFixed || 0}</div>
                      <div className="text-xs text-gray-500">Auto-Fixed</div>
                    </div>
                    <div className="text-center border-l pl-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.byStatus?.open || 0}</div>
                      <div className="text-xs text-gray-500">Open</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Run Auto-Fix Button */}
              {activeTab === 'tickets' && (
                <button
                  onClick={runAutoFix}
                  disabled={processing}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      🤖 Run Auto-Fix Now
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {/* Tabs and View Toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setActiveTab('tickets'); setSelectedId(null); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'tickets' ? 'bg-white shadow text-cyan-500' : 'text-gray-600'
                }`}
              >
                🎫 Tickets ({tickets.length})
              </button>
              <button
                onClick={() => { setActiveTab('enhancements'); setSelectedId(null); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'enhancements' ? 'bg-white shadow text-cyan-500' : 'text-gray-600'
                }`}
              >
                💡 Enhancements ({enhancements.length})
              </button>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === 'kanban' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                📋 Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                📝 List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Panel - Kanban/List */}
        <div className={`${selectedId ? 'w-2/3' : 'w-full'} overflow-auto p-4`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin text-4xl">⚙️</div>
            </div>
          ) : viewMode === 'kanban' ? (
            /* KANBAN VIEW */
            <div className="flex gap-4 min-w-max">
              {statuses.map(status => {
                const items = getItemsByStatus(status.key);
                return (
                  <div key={status.key} className="w-72 flex-shrink-0">
                    {/* Column Header */}
                    <div 
                      className="text-white rounded-t-lg px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: status.color }}
                    >
                      <span className="font-medium">{status.label}</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                        {items.length}
                      </span>
                    </div>
                    
                    {/* Column Content */}
                    <div className="bg-gray-200/60 rounded-b-lg p-2 min-h-[400px] space-y-2">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No items
                        </div>
                      ) : (
                        items.map((item: any) => {
                          const isTicket = 'ticket_number' in item;
                          const number = isTicket ? item.ticket_number : item.request_number;
                          const isSelected = selectedId === item.id;
                          
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleCardClick(item.id)}
                              className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${
                                isSelected ? 'ring-2 ring-cyan-500 shadow-lg' : ''
                              } ${
                                item.priority === 'critical' ? 'border-l-red-600' :
                                item.priority === 'high' ? 'border-l-cyan-500' :
                                item.priority === 'medium' ? 'border-l-cyan-400' : 'border-l-gray-300'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-gray-500">{number}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_STYLES[item.priority]}`}>
                                  {item.priority}
                                </span>
                              </div>
                              
                              {/* Title */}
                              <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                                {item.title}
                              </h4>
                              
                              {/* Bot Status */}
                              {isTicket && item.assigned_bot && (
                                <div className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 mb-2 ${
                                  item.auto_fix_successful === true ? 'bg-cyan-500 text-cyan-500' :
                                  item.auto_fix_successful === false ? 'bg-red-100 text-red-700' :
                                  item.auto_fix_attempted ? 'bg-cyan-400 text-cyan-400' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  🤖 {item.auto_fix_successful === true ? 'Auto-Fixed' :
                                      item.auto_fix_successful === false ? 'Fix Failed' :
                                      item.auto_fix_attempted ? 'Fixing...' : 'Bot Assigned'}
                                </div>
                              )}
                              
                              {/* Enhancement votes */}
                              {!isTicket && (
                                <div className="flex items-center gap-2 text-xs mb-2">
                                  <span className="text-cyan-500">👍 {item.upvotes || 0}</span>
                                  <span className="text-red-600">👎 {item.downvotes || 0}</span>
                                </div>
                              )}
                              
                              {/* Footer */}
                              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                                <span>{item.source_app}</span>
                                <span>{timeAgo(item.created_at)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bot Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(activeTab === 'tickets' ? tickets : enhancements).map((item: any) => {
                    const isTicket = 'ticket_number' in item;
                    const number = isTicket ? item.ticket_number : item.request_number;
                    const statusConfig = getStatusConfig(item.status);
                    
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleCardClick(item.id)}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedId === item.id ? 'bg-cyan-500' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-600">{number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_STYLES[item.priority]}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isTicket && item.assigned_bot ? (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.auto_fix_successful === true ? 'bg-cyan-500 text-cyan-500' :
                              item.auto_fix_successful === false ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              🤖 {item.auto_fix_successful === true ? 'Fixed' : 
                                  item.auto_fix_successful === false ? 'Failed' : 'Pending'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {timeAgo(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel - Details */}
        {selectedId && selectedItem && (
          <div className="w-1/3 border-l bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono text-gray-500">
                    {'ticket_number' in selectedItem ? selectedItem.ticket_number : selectedItem.request_number}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedItem.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>
              
              {/* Status and Priority */}
              <div className="flex items-center gap-2 mt-3">
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: getStatusConfig(selectedItem.status).color }}
                >
                  {getStatusConfig(selectedItem.status).label}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${PRIORITY_STYLES[selectedItem.priority]}`}>
                  {selectedItem.priority}
                </span>
              </div>
              
              {/* Status Change Buttons */}
              <div className="flex flex-wrap gap-1 mt-3">
                {statuses.map(s => (
                  <button
                    key={s.key}
                    onClick={() => updateStatus(selectedItem.id, s.key)}
                    disabled={selectedItem.status === s.key}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      selectedItem.status === s.key 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    → {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📝 Description</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm whitespace-pre-wrap">
                  {selectedItem.description || 'No description provided'}
                </div>
              </div>

              {/* Bot Status for Tickets */}
              {'ticket_number' in selectedItem && selectedItem.assigned_bot && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🤖 Javari Auto-Fix Status</h3>
                  <div className={`rounded-lg p-4 ${
                    selectedItem.auto_fix_successful === true ? 'bg-cyan-500 border border-cyan-500' :
                    selectedItem.auto_fix_successful === false ? 'bg-red-50 border border-red-200' :
                    selectedItem.auto_fix_attempted ? 'bg-cyan-400 border border-cyan-400' : 
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {selectedItem.auto_fix_successful === true ? '✅' :
                         selectedItem.auto_fix_successful === false ? '❌' :
                         selectedItem.auto_fix_attempted ? '🔄' : '⏳'}
                      </span>
                      <div>
                        <div className="font-medium">
                          {selectedItem.auto_fix_successful === true ? 'Successfully Auto-Fixed!' :
                           selectedItem.auto_fix_successful === false ? 'Auto-Fix Failed - Escalated' :
                           selectedItem.auto_fix_attempted ? 'Auto-Fix In Progress...' : 'Awaiting Auto-Fix'}
                        </div>
                        <div className="text-sm text-gray-600">Bot: {selectedItem.assigned_bot}</div>
                      </div>
                    </div>
                    
                    {/* Resolution */}
                    {selectedItem.resolution && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-1">Resolution:</div>
                        <div className="text-sm text-gray-600">{selectedItem.resolution}</div>
                      </div>
                    )}
                    
                    {/* Actions Taken */}
                    {selectedItem.auto_fix_actions && selectedItem.auto_fix_actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Actions Taken:</div>
                        <div className="space-y-1">
                          {selectedItem.auto_fix_actions.map((action: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-cyan-500">✓</span>
                              <span>{action.action || action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Logs Toggle */}
                    {selectedItem.auto_fix_logs && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => setShowLogs(!showLogs)}
                          className="text-sm font-medium text-cyan-500 hover:text-cyan-500"
                        >
                          {showLogs ? '▼ Hide Bot Logs' : '▶ View Bot Logs'}
                        </button>
                        {showLogs && (
                          <pre className="mt-2 text-xs bg-gray-900 text-cyan-500 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                            {selectedItem.auto_fix_logs}
                          </pre>
                        )}
                      </div>
                    )}
                    
                    {selectedItem.auto_fix_timestamp && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last action: {formatDate(selectedItem.auto_fix_timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhancement AI Analysis */}
              {'request_number' in selectedItem && selectedItem.ai_implementation_plan && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🧠 AI Analysis</h3>
                  <div className="bg-cyan-500 border border-cyan-500 rounded-lg p-4">
                    {selectedItem.ai_estimated_complexity && (
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <span className="text-xs text-gray-500">Complexity</span>
                          <div className="font-medium capitalize">{selectedItem.ai_estimated_complexity}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Effort</span>
                          <div className="font-medium">{selectedItem.ai_estimated_effort || 'TBD'}</div>
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedItem.ai_implementation_plan}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhancement Voting */}
              {'request_number' in selectedItem && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📊 Community Votes</h3>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl">👍</div>
                      <div className="font-bold text-cyan-500">{selectedItem.upvotes || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">👎</div>
                      <div className="font-bold text-red-600">{selectedItem.downvotes || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">👁️</div>
                      <div className="font-bold text-gray-600">{selectedItem.view_count || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📋 Details</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Source App:</span>
                    <span className="font-medium">{selectedItem.source_app}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium capitalize">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted by:</span>
                    <span className="font-medium">{selectedItem.user_name || selectedItem.user_email || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(selectedItem.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span className="font-medium">{formatDate(selectedItem.updated_at)}</span>
                  </div>
                  {'resolved_at' in selectedItem && selectedItem.resolved_at && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Resolved:</span>
                        <span className="font-medium">{formatDate(selectedItem.resolved_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Resolved by:</span>
                        <span className="font-medium">{selectedItem.resolved_by}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
