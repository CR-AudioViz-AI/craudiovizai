// ============================================================
// CR AUDIOVIZ AI - API HEALTH DASHBOARD (No framer-motion)
// /components/admin/APIHealthDashboard.tsx
// Real-time monitoring dashboard for all 30+ APIs
// Created: December 17, 2025
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
  Cloud,
  Newspaper,
  Brain,
  Image,
  Bell,
  BarChart3,
  Globe,
  Gamepad2,
  Search,
  Mail,
  Video,
  ExternalLink
} from 'lucide-react';

// Types
interface HealthCheckResult {
  name: string;
  displayName: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  statusCode?: number;
  latencyMs: number;
  message: string;
  lastChecked: string;
  isCritical: boolean;
  isFree: boolean;
  freeAnnualValue: number;
  failoverGroup?: string;
  quotaRemaining?: number;
  quotaLimit?: number;
}

interface HealthCheckSummary {
  timestamp: string;
  overall: 'operational' | 'degraded' | 'major_outage';
  totalApis: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  avgLatencyMs: number;
  freeApisValue: number;
  criticalStatus: string;
  results: HealthCheckResult[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  'AI': <Brain className="w-4 h-4" />,
  'Financial': <DollarSign className="w-4 h-4" />,
  'News': <Newspaper className="w-4 h-4" />,
  'Search': <Search className="w-4 h-4" />,
  'Media': <Image className="w-4 h-4" />,
  'Storage': <Database className="w-4 h-4" />,
  'Creative': <Zap className="w-4 h-4" />,
  'Entertainment': <Gamepad2 className="w-4 h-4" />,
  'Notification': <Bell className="w-4 h-4" />,
  'Analytics': <BarChart3 className="w-4 h-4" />,
  'Monitoring': <Activity className="w-4 h-4" />,
  'Geolocation': <Globe className="w-4 h-4" />,
  'Weather': <Cloud className="w-4 h-4" />,
  'Video': <Video className="w-4 h-4" />,
  'Lead Gen': <Mail className="w-4 h-4" />,
  'Database': <Database className="w-4 h-4" />
};

function StatusBadge({ status }: { status: string }) {
  const config = {
    healthy: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2, label: 'Healthy' },
    degraded: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertTriangle, label: 'Degraded' },
    down: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Down' },
    unknown: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Clock, label: 'Unknown' }
  }[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Clock, label: 'Unknown' };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function APICard({ api, expanded, onToggle }: { api: HealthCheckResult; expanded: boolean; onToggle: () => void; }) {
  const statusColors = {
    healthy: 'border-emerald-500/30 bg-emerald-500/5',
    degraded: 'border-amber-500/30 bg-amber-500/5',
    down: 'border-red-500/30 bg-red-500/5',
    unknown: 'border-slate-500/30 bg-slate-500/5'
  };
  const latencyColor = api.latencyMs < 500 ? 'text-emerald-400' : api.latencyMs < 2000 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className={`rounded-xl border ${statusColors[api.status]} backdrop-blur-sm overflow-hidden transition-all duration-200`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800/50">
            {categoryIcons[api.category] || <Activity className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{api.displayName}</span>
              {api.isCritical && <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 rounded">Critical</span>}
              {api.isFree && <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded">Free</span>}
            </div>
            <span className="text-xs text-slate-400">{api.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className={`text-sm font-mono ${latencyColor}`}>{api.latencyMs}ms</span>
          </div>
          <StatusBadge status={api.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-slate-400 block text-xs mb-1">Status Code</span><span className="text-white font-mono">{api.statusCode || 'N/A'}</span></div>
          <div><span className="text-slate-400 block text-xs mb-1">Latency</span><span className={`font-mono ${latencyColor}`}>{api.latencyMs}ms</span></div>
          <div><span className="text-slate-400 block text-xs mb-1">Message</span><span className="text-white">{api.message}</span></div>
          <div><span className="text-slate-400 block text-xs mb-1">Last Checked</span><span className="text-white">{new Date(api.lastChecked).toLocaleTimeString()}</span></div>
          {api.quotaRemaining !== undefined && <div><span className="text-slate-400 block text-xs mb-1">Quota</span><span className="text-white font-mono">{api.quotaRemaining.toLocaleString()}{api.quotaLimit && ` / ${api.quotaLimit.toLocaleString()}`}</span></div>}
          {api.failoverGroup && <div><span className="text-slate-400 block text-xs mb-1">Failover Group</span><span className="text-cyan-400 font-mono text-xs">{api.failoverGroup}</span></div>}
          {api.freeAnnualValue > 0 && <div><span className="text-slate-400 block text-xs mb-1">Annual Value</span><span className="text-emerald-400 font-medium">${api.freeAnnualValue.toLocaleString()}/year</span></div>}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, subtext }: { label: string; value: string | number; icon: React.ElementType; color: string; subtext?: string; }) {
  return (
    <div className={`rounded-xl border ${color} p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-slate-400 text-xs uppercase tracking-wider">{label}</span>
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
          {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50"><Icon className="w-5 h-5 text-slate-300" /></div>
      </div>
    </div>
  );
}

export default function APIHealthDashboard() {
  const [data, setData] = useState<HealthCheckSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedApis, setExpandedApis] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health/apis');
      if (!response.ok) throw new Error('Health check failed');
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefresh]);

  const toggleExpanded = (name: string) => {
    setExpandedApis(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const categories = data ? ['all', ...new Set(data.results.map(r => r.category))] : ['all'];
  const filteredResults = data?.results.filter(api => {
    if (categoryFilter !== 'all' && api.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && api.status !== statusFilter) return false;
    return true;
  }) || [];

  const groupedByCategory = filteredResults.reduce((acc, api) => {
    if (!acc[api.category]) acc[api.category] = [];
    acc[api.category].push(api);
    return acc;
  }, {} as Record<string, HealthCheckResult[]>);

  const statusConfig = {
    operational: { bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '✅ All Systems Operational' },
    degraded: { bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400', label: '⚠️ Some Systems Degraded' },
    major_outage: { bg: 'bg-gradient-to-r from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', label: '🚨 Major Outage Detected' }
  };
  const currentStatus = data ? statusConfig[data.overall] : statusConfig.operational;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">API Health Dashboard</h1>
            <p className="text-slate-400 mt-1">Monitoring {data?.totalApis || 0} APIs • Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${autoRefresh ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
              {autoRefresh ? '🔄 Auto ON' : '⏸️ Auto OFF'}
            </button>
            <button onClick={fetchHealth} disabled={loading} className="p-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400"><strong>Error:</strong> {error}</div>}

        {data && (
          <div className={`mb-6 p-6 rounded-xl border ${currentStatus.border} ${currentStatus.bg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className={`text-2xl font-bold ${currentStatus.text}`}>{currentStatus.label}</span>
                <p className="text-slate-400 mt-1 text-sm">{data.criticalStatus}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center"><span className="text-2xl font-bold text-emerald-400">{data.healthy}</span><span className="text-slate-400 block">Healthy</span></div>
                <div className="text-center"><span className="text-2xl font-bold text-amber-400">{data.degraded}</span><span className="text-slate-400 block">Degraded</span></div>
                <div className="text-center"><span className="text-2xl font-bold text-red-400">{data.down}</span><span className="text-slate-400 block">Down</span></div>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard label="Total APIs" value={data.totalApis} icon={Activity} color="border-slate-700 bg-slate-800/50" />
            <SummaryCard label="Avg Latency" value={`${data.avgLatencyMs}ms`} icon={Clock} color={data.avgLatencyMs < 500 ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"} />
            <SummaryCard label="Free APIs Value" value={`$${data.freeApisValue.toLocaleString()}`} icon={DollarSign} color="border-cyan-500/30 bg-cyan-500/10" subtext="per year" />
            <SummaryCard label="Uptime" value={`${Math.round((data.healthy / data.totalApis) * 100)}%`} icon={CheckCircle2} color="border-emerald-500/30 bg-emerald-500/10" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm">
            {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm">
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">Unknown</option>
          </select>
          <span className="text-sm text-slate-400 ml-auto">Showing {filteredResults.length} of {data?.totalApis || 0} APIs</span>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([category, apis]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded bg-slate-800">{categoryIcons[category] || <Activity className="w-4 h-4" />}</div>
                  <h2 className="text-lg font-semibold text-white">{category}</h2>
                  <span className="text-sm text-slate-500">({apis.length})</span>
                </div>
                <div className="space-y-2">
                  {apis.map(api => <APICard key={api.name} api={api} expanded={expandedApis.has(api.name)} onToggle={() => toggleExpanded(api.name)} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            CR AudioViz AI • API Health Monitor v1.0 • 
            <a href="/api/health/apis" target="_blank" className="text-cyan-400 hover:text-cyan-300 ml-1 inline-flex items-center gap-1">View Raw JSON <ExternalLink className="w-3 h-3" /></a>
          </p>
        </div>
      </div>
    </div>
  );
}
