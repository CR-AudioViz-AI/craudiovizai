// app/admin/grants/discover/page.tsx
// Grant Discovery - Automatic Grant Finding with AI Matching
// Uses FREE APIs: Grants.gov, USASpending.gov
// Timestamp: Saturday, December 13, 2025 - 12:25 PM EST

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Filter, Download, RefreshCw, 
  Target, TrendingUp, DollarSign, Calendar, Building,
  CheckCircle, Plus, ExternalLink, Sparkles, Zap,
  AlertTriangle, Globe, Database, ChevronDown, ChevronUp
} from 'lucide-react';

// CRAIverse modules for filtering
const CRAIVERSE_MODULES = [
  { id: 'first-responders', name: 'First Responders Haven', tier: 1 },
  { id: 'veterans-transition', name: 'Veterans Transition Hub', tier: 1 },
  { id: 'together-anywhere', name: 'Together Anywhere', tier: 2 },
  { id: 'faith-communities', name: 'Faith Communities', tier: 2 },
  { id: 'senior-connect', name: 'Senior Connect', tier: 2 },
  { id: 'foster-care-network', name: 'Foster Care Network', tier: 2 },
  { id: 'rural-health', name: 'Rural Health Access', tier: 3 },
  { id: 'mental-health-youth', name: 'Youth Mental Health', tier: 3 },
  { id: 'addiction-recovery', name: 'Recovery Together', tier: 3 },
  { id: 'animal-rescue', name: 'Animal Rescue Network', tier: 4 },
  { id: 'green-earth', name: 'Green Earth Initiative', tier: 4 },
  { id: 'disaster-relief', name: 'Disaster Relief Hub', tier: 4 },
  { id: 'small-business', name: 'Small Business Hub', tier: 5 },
  { id: 'nonprofit-toolkit', name: 'Nonprofit Toolkit', tier: 5 },
  { id: 'education-access', name: 'Education Access', tier: 5 },
  { id: 'digital-literacy', name: 'Digital Literacy', tier: 5 },
  { id: 'artists-collective', name: 'Artists Collective', tier: 6 },
  { id: 'musicians-guild', name: 'Musicians Guild', tier: 6 },
  { id: 'community-journalism', name: 'Community Journalism', tier: 6 },
  { id: 'food-security', name: 'Food Security Network', tier: 6 },
];

interface DiscoveredGrant {
  id: string;
  source: string;
  opportunity_number: string;
  title: string;
  agency: string;
  description: string;
  amount_available: number;
  amount_floor?: number;
  open_date: string;
  close_date: string;
  category?: string;
  eligibilities?: string[];
  url: string;
  match_score: number;
  win_probability: number;
  target_modules: string[];
}

function formatCurrency(amount: number | null): string {
  if (!amount) return 'Varies';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Rolling';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function GrantDiscoveryPage() {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [grants, setGrants] = useState<DiscoveredGrant[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [keywordsUsed, setKeywordsUsed] = useState<string[]>([]);

  const discoverGrants = async () => {
    setSearching(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (selectedModules.length > 0) {
        params.set('modules', selectedModules.join(','));
      }
      
      const response = await fetch(`/api/admin/grants/discover?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGrants(data.opportunities);
        setKeywordsUsed(data.keywords_used || []);
      } else {
        setError(data.error || 'Failed to discover grants');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setSearching(false);
    }
  };

  const importGrant = async (grant: DiscoveredGrant) => {
    setImportingId(grant.id);
    
    try {
      const response = await fetch('/api/admin/grants/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: grant }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImportedIds(prev => new Set([...prev, grant.id]));
      } else {
        if (data.existing_id) {
          setImportedIds(prev => new Set([...prev, grant.id]));
        }
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImportingId(null);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAllModules = () => {
    setSelectedModules(CRAIVERSE_MODULES.map(m => m.id));
  };

  const clearModules = () => {
    setSelectedModules([]);
  };

  // Group modules by tier
  const modulesByTier = CRAIVERSE_MODULES.reduce((acc, module) => {
    if (!acc[module.tier]) acc[module.tier] = [];
    acc[module.tier].push(module);
    return acc;
  }, {} as Record<number, typeof CRAIVERSE_MODULES>);

  const tierNames: Record<number, string> = {
    1: 'Tier 1: Priority ($550M+)',
    2: 'Tier 2: Family & Community ($265M+)',
    3: 'Tier 3: Health & Wellness ($140M+)',
    4: 'Tier 4: Animals & Environment ($125M+)',
    5: 'Tier 5: Business & Education ($110M+)',
    6: 'Tier 6: Arts & Culture ($78M+)',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/grants" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Grant Discovery</h1>
                <p className="text-xs text-gray-500">Find grants from Grants.gov & more</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Powered by FREE Federal APIs
              </span>
              <button
                onClick={discoverGrants}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-cyan-500 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                {searching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {searching ? 'Searching...' : 'Discover Grants'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* API Sources Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-500 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Connected Data Sources</h3>
              <div className="mt-2 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm">
                  <Globe className="w-4 h-4 text-cyan-500" />
                  Grants.gov (Federal Grants)
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  USASpending.gov (Award Data)
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  AI Matching Engine
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div 
                className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
                onClick={() => setShowFilters(!showFilters)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">Target Modules</h2>
                </div>
                {showFilters ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {showFilters && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500">
                      {selectedModules.length} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllModules}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={clearModules}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(modulesByTier).map(([tier, modules]) => (
                      <div key={tier}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {tierNames[parseInt(tier)]}
                        </p>
                        <div className="space-y-1">
                          {modules.map((module) => (
                            <label
                              key={module.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedModules.includes(module.id)}
                                onChange={() => toggleModule(module.id)}
                                className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-gray-700">{module.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Keywords Used */}
            {keywordsUsed.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Search keywords used:</p>
                <div className="flex flex-wrap gap-1">
                  {keywordsUsed.slice(0, 15).map((keyword, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white text-gray-600 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                  {keywordsUsed.length > 15 && (
                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                      +{keywordsUsed.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Results Count */}
            {grants.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold">{grants.length}</span> matching grants
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sort by:</span>
                  <select className="text-sm border-0 bg-transparent text-gray-700 focus:ring-0">
                    <option>Match Score</option>
                    <option>Amount (High to Low)</option>
                    <option>Deadline (Soonest)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Grant Cards */}
            {grants.length === 0 && !searching && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Discover Grants</h3>
                <p className="text-gray-500 mb-6">
                  Select CRAIverse modules to target, then click "Discover Grants" to search federal databases.
                </p>
                <button
                  onClick={discoverGrants}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                >
                  Start Discovery
                </button>
              </div>
            )}

            {searching && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <RefreshCw className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Searching Federal Databases...</h3>
                <p className="text-gray-500">
                  Querying Grants.gov and matching against CRAIverse modules
                </p>
              </div>
            )}

            <div className="space-y-4">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            grant.match_score >= 80 ? 'bg-cyan-500 text-cyan-500' :
                            grant.match_score >= 60 ? 'bg-cyan-400 text-cyan-400' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {grant.match_score}% match
                          </span>
                          <span className="text-xs text-gray-500">
                            {grant.source === 'grants_gov' ? 'Grants.gov' : grant.source}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{grant.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {grant.agency}
                          </span>
                          {grant.opportunity_number && (
                            <span className="text-gray-400">#{grant.opportunity_number}</span>
                          )}
                        </div>
                        {grant.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {grant.description}
                          </p>
                        )}
                        
                        {/* Target Modules */}
                        {grant.target_modules.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {grant.target_modules.map((module) => (
                              <span
                                key={module}
                                className="px-2 py-0.5 bg-cyan-500 text-cyan-500 rounded text-xs"
                              >
                                {CRAIVERSE_MODULES.find(m => m.id === module)?.name || module}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-cyan-500" />
                            <span className="font-semibold text-cyan-500">
                              {formatCurrency(grant.amount_available)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`${
                              getDaysUntil(grant.close_date) !== null && getDaysUntil(grant.close_date)! <= 30
                                ? 'text-red-600 font-medium'
                                : 'text-gray-600'
                            }`}>
                              Due: {formatDate(grant.close_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600">{grant.win_probability}% win chance</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {importedIds.has(grant.id) ? (
                          <span className="flex items-center gap-1 px-3 py-2 bg-cyan-500 text-cyan-500 rounded-lg text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => importGrant(grant)}
                            disabled={importingId === grant.id}
                            className="flex items-center gap-1 px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-500 transition-colors disabled:opacity-50"
                          >
                            {importingId === grant.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            Import
                          </button>
                        )}
                        <a
                          href={grant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
