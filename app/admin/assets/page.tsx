// =============================================================================
// UNIVERSAL ASSET MANAGER - ADMIN UI
// CR AudioViz AI - Single interface for ALL assets
// Path: app/admin/assets/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Upload, Filter, Grid, List, RefreshCw, Download, 
  Trash2, Edit, Eye, Music, Image, FileText, Video, Box,
  Database, Zap, TrendingUp, Clock, ChevronDown, X, Check,
  Wine, Book, Mic, Code, Type, Palette, Package, Settings
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Asset {
  id: string;
  asset_id: string;
  asset_type: string;
  category: string;
  subcategory: string | null;
  name: string;
  description: string | null;
  tags: string[];
  file_url: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  metadata: Record<string, any>;
  is_public: boolean;
  is_free: boolean;
  price_cents: number;
  quality_score: number | null;
  view_count: number;
  download_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AssetStats {
  total: number;
  byType: { type: string; count: number }[];
  byCategory: { category: string; count: number }[];
  sources: { source_code: string; source_name: string; total_harvested: number }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ASSET_TYPE_ICONS: Record<string, React.ReactNode> = {
  spirit: <Wine className="w-4 h-4" />,
  ebook: <Book className="w-4 h-4" />,
  audiobook: <Mic className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
  sound_effect: <Zap className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  font: <Type className="w-4 h-4" />,
  logo: <Palette className="w-4 h-4" />,
  icon: <Grid className="w-4 h-4" />,
  '3d_model': <Box className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  default: <Package className="w-4 h-4" />,
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  spirit: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  audiobook: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  image: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  music: 'bg-green-500/20 text-green-400 border-green-500/30',
  sound_effect: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  font: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  logo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function UniversalAssetManager() {
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 50;

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedType) params.set('type', selectedType);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', LIMIT.toString());
      params.set('offset', (page * LIMIT).toString());

      const res = await fetch(`/api/assets?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedCategory, page]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/assets/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, [fetchAssets]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(), fetchStats()]);
    setRefreshing(false);
  };

  // Format file size
  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format number
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjAzMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Universal Asset Manager
            </h1>
            <p className="text-gray-400 mt-1">
              {formatNumber(total)} assets across {stats?.byType?.length || 0} types
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Assets
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {stats?.byType?.slice(0, 6).map((item) => (
            <button
              key={item.type}
              onClick={() => setSelectedType(selectedType === item.type ? null : item.type)}
              className={`p-4 rounded-xl border transition-all ${
                selectedType === item.type
                  ? 'bg-amber-500/20 border-amber-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded-lg ${ASSET_TYPE_COLORS[item.type] || ASSET_TYPE_COLORS.default}`}>
                  {ASSET_TYPE_ICONS[item.type] || ASSET_TYPE_ICONS.default}
                </span>
                <span className="text-sm text-gray-400 capitalize">{item.type.replace('_', ' ')}</span>
              </div>
              <div className="text-2xl font-bold">{formatNumber(item.count)}</div>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets by name, description, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAssets()}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none appearance-none cursor-pointer min-w-[150px]"
          >
            <option value="">All Types</option>
            {stats?.byType?.map((item) => (
              <option key={item.type} value={item.type}>
                {item.type} ({formatNumber(item.count)})
              </option>
            ))}
          </select>

          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none appearance-none cursor-pointer min-w-[150px]"
          >
            <option value="">All Categories</option>
            {stats?.byCategory?.map((item) => (
              <option key={item.category} value={item.category}>
                {item.category} ({formatNumber(item.count)})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchAssets}
            className="px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all"
          >
            Search
          </button>
        </div>

        {/* Active Filters */}
        {(selectedType || selectedCategory || searchQuery) && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-400">Active filters:</span>
            {searchQuery && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-sm">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedType && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                Type: {selectedType}
                <button onClick={() => setSelectedType(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button 
              onClick={() => { setSearchQuery(''); setSelectedType(null); setSelectedCategory(null); }}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Asset Grid */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/10 cursor-pointer transition-all"
              >
                {/* Preview */}
                <div className="aspect-square rounded-lg bg-black/30 mb-3 flex items-center justify-center overflow-hidden">
                  {asset.file_url && asset.asset_type === 'image' ? (
                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`p-4 rounded-xl ${ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.default}`}>
                      {ASSET_TYPE_ICONS[asset.asset_type] || ASSET_TYPE_ICONS.default}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-2">{asset.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs border ${ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.default}`}>
                      {asset.asset_type}
                    </span>
                    {asset.subcategory && (
                      <span className="text-xs text-gray-500">{asset.subcategory}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{asset.asset_id}</span>
                    <span>{formatSize(asset.file_size_bytes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Asset List */}
        {!loading && viewMode === 'list' && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">Asset</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-1">Views</div>
              <div className="col-span-2">Created</div>
            </div>
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/30 cursor-pointer transition-all"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.default}`}>
                    {ASSET_TYPE_ICONS[asset.asset_type] || ASSET_TYPE_ICONS.default}
                  </span>
                  <div>
                    <div className="font-medium text-sm line-clamp-1">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.asset_id}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`px-2 py-0.5 rounded text-xs border ${ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.default}`}>
                    {asset.asset_type}
                  </span>
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-400">
                  {asset.category}
                </div>
                <div className="col-span-1 flex items-center text-sm text-gray-400">
                  {formatSize(asset.file_size_bytes)}
                </div>
                <div className="col-span-1 flex items-center text-sm text-gray-400">
                  {formatNumber(asset.view_count)}
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-400">
                  {new Date(asset.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Database className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium mb-2">No assets found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedType(null); setSelectedCategory(null); }}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > LIMIT && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50 hover:bg-white/10 transition-all"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page + 1} of {Math.ceil(total / LIMIT)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * LIMIT >= total}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50 hover:bg-white/10 transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}>
            <div className="w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedAsset.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedAsset.asset_id}</p>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              {selectedAsset.file_url && (
                <div className="mb-6 rounded-xl bg-black/30 p-4 flex items-center justify-center">
                  {selectedAsset.asset_type === 'image' ? (
                    <img src={selectedAsset.file_url} alt={selectedAsset.name} className="max-h-64 rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <span className={`inline-block p-6 rounded-xl ${ASSET_TYPE_COLORS[selectedAsset.asset_type] || ASSET_TYPE_COLORS.default}`}>
                        {ASSET_TYPE_ICONS[selectedAsset.asset_type] || ASSET_TYPE_ICONS.default}
                      </span>
                      <p className="text-sm text-gray-400 mt-2">Preview not available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Type</div>
                  <div className="flex items-center gap-2">
                    {ASSET_TYPE_ICONS[selectedAsset.asset_type] || ASSET_TYPE_ICONS.default}
                    <span className="capitalize">{selectedAsset.asset_type.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Category</div>
                  <div className="capitalize">{selectedAsset.category}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Size</div>
                  <div>{formatSize(selectedAsset.file_size_bytes)}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Quality Score</div>
                  <div>{selectedAsset.quality_score || '-'}/100</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Views</div>
                  <div>{formatNumber(selectedAsset.view_count)}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Downloads</div>
                  <div>{formatNumber(selectedAsset.download_count)}</div>
                </div>
              </div>

              {/* Metadata */}
              {selectedAsset.metadata && Object.keys(selectedAsset.metadata).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Metadata</h3>
                  <div className="p-4 rounded-lg bg-white/5 font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(selectedAsset.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-white/10 text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {selectedAsset.file_url && (
                  <a
                    href={selectedAsset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all ml-auto">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
            <div className="w-full max-w-xl bg-[#12121a] border border-white/10 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Upload Assets</h2>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-amber-500/50 transition-all cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Drop files here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <p className="text-xs text-gray-500 mt-4">
                  Supports: Images, Documents, Audio, Video, Fonts, 3D Models
                </p>
              </div>

              <p className="text-center text-sm text-gray-400 mt-4">
                Files will be auto-classified by Javari AI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
