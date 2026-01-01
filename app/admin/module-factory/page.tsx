// /app/admin/module-factory/page.tsx
// Module Factory Admin UI - CR AudioViz AI
// Timestamp: January 1, 2026 - 5:49 PM EST

'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Plus, Play, Code, CheckCircle, AlertCircle, 
  Loader2, Copy, Download, Layers, Settings, Zap
} from 'lucide-react';

interface ModuleDefinition {
  name: string;
  slug: string;
  description: string;
  icon: string;
  family: 'revenue' | 'creator' | 'professional' | 'social_impact' | 'lifestyle' | 'infrastructure';
  category: string;
  tags: string[];
  features: { name: string; slug: string; description: string; enabled: boolean; tier?: string }[];
  revenueModel: 'affiliate' | 'subscription' | 'credits' | 'marketplace' | 'lead_gen' | 'free';
  pricingTiers?: { name: string; price: number; credits?: number; features: string[] }[];
  settings: {
    requiresAuth: boolean;
    requiresSubscription: boolean;
    hasMarketplace: boolean;
    hasSearch: boolean;
    hasAnalytics: boolean;
    hasModeration: boolean;
    hasCredits: boolean;
  };
}

interface RegisteredModule {
  id: string;
  module_slug: string;
  module_name: string;
  status: 'draft' | 'active' | 'deprecated';
  version: string;
  created_at: string;
}

const FAMILY_COLORS: Record<string, string> = {
  revenue: 'bg-green-100 text-green-800 border-green-200',
  creator: 'bg-purple-100 text-purple-800 border-purple-200',
  professional: 'bg-blue-100 text-blue-800 border-blue-200',
  social_impact: 'bg-orange-100 text-orange-800 border-orange-200',
  lifestyle: 'bg-pink-100 text-pink-800 border-pink-200',
  infrastructure: 'bg-gray-100 text-gray-800 border-gray-200',
};

const DEFAULT_DEFINITION: ModuleDefinition = {
  name: '',
  slug: '',
  description: '',
  icon: '📦',
  family: 'creator',
  category: '',
  tags: [],
  features: [],
  revenueModel: 'credits',
  settings: {
    requiresAuth: true,
    requiresSubscription: false,
    hasMarketplace: true,
    hasSearch: true,
    hasAnalytics: true,
    hasModeration: true,
    hasCredits: true,
  },
};

export default function ModuleFactoryPage() {
  const [modules, setModules] = useState<RegisteredModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registry' | 'create' | 'scaffold'>('registry');
  
  // Create module state
  const [definition, setDefinition] = useState<ModuleDefinition>(DEFAULT_DEFINITION);
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  
  // Scaffold preview state
  const [scaffoldFiles, setScaffoldFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/module-factory');
      const data = await res.json();
      
      if (data.success) {
        setModules(data.data?.modules || []);
      } else {
        setError(data.error?.message || 'Failed to fetch modules');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!definition.name || !definition.slug) {
      setError('Module name and slug are required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const res = await fetch('/api/admin/module-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          definition
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setCreateResult(data.data);
        setScaffoldFiles(data.data?.scaffold || {});
        if (Object.keys(data.data?.scaffold || {}).length > 0) {
          setSelectedFile(Object.keys(data.data.scaffold)[0]);
        }
        setActiveTab('scaffold');
        fetchModules();
      } else {
        setError(data.error?.message || 'Failed to create module');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateModule = async (moduleId: string) => {
    try {
      const res = await fetch('/api/admin/module-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          moduleId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        fetchModules();
      } else {
        setError(data.error?.message || 'Failed to activate module');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generatePreviewScaffold = async () => {
    if (!definition.name || !definition.slug) {
      setError('Module name and slug are required for preview');
      return;
    }

    try {
      const res = await fetch('/api/admin/module-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scaffold',
          definition
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setScaffoldFiles(data.data?.scaffold || {});
        if (Object.keys(data.data?.scaffold || {}).length > 0) {
          setSelectedFile(Object.keys(data.data.scaffold)[0]);
        }
        setActiveTab('scaffold');
      } else {
        setError(data.error?.message || 'Failed to generate scaffold');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updateDefinition = (field: string, value: any) => {
    setDefinition(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name' && !definition.slug) {
      setDefinition(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }));
    }
  };

  const updateSettings = (field: string, value: boolean) => {
    setDefinition(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            Module Factory
          </h1>
          <p className="text-gray-600 mt-1">
            Rapid module deployment with Core 10 infrastructure inheritance
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
          <Zap className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">
            Launch modules in &lt;2 weeks
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'registry', label: 'Module Registry', icon: Layers },
          { id: 'create', label: 'Create Module', icon: Plus },
          { id: 'scaffold', label: 'Scaffold Preview', icon: Code },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registry Tab */}
      {activeTab === 'registry' && (
        <div className="bg-white rounded-xl border shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="mt-3 text-gray-600">Loading modules...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No modules registered</h3>
              <p className="mt-2 text-gray-600">Create your first module to get started</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Module
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {modules.map(module => (
                <div key={module.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl">
                      📦
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{module.module_name}</h3>
                      <p className="text-sm text-gray-500">/{module.module_slug} • v{module.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      module.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : module.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {module.status}
                    </span>
                    {module.status === 'draft' && (
                      <button
                        onClick={() => handleActivateModule(module.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Module Configuration
            </h2>

            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Name *</label>
                <input
                  type="text"
                  value={definition.name}
                  onChange={(e) => updateDefinition('name', e.target.value)}
                  placeholder="e.g., Pet Care Services"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={definition.slug}
                  onChange={(e) => updateDefinition('slug', e.target.value)}
                  placeholder="e.g., pet-care"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={definition.description}
                  onChange={(e) => updateDefinition('description', e.target.value)}
                  placeholder="Brief description of the module..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family</label>
                  <select
                    value={definition.family}
                    onChange={(e) => updateDefinition('family', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="revenue">Revenue Engines</option>
                    <option value="creator">Creator Economy</option>
                    <option value="professional">Professional Services</option>
                    <option value="social_impact">Social Impact</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Model</label>
                  <select
                    value={definition.revenueModel}
                    onChange={(e) => updateDefinition('revenueModel', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="credits">Credits</option>
                    <option value="subscription">Subscription</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="affiliate">Affiliate</option>
                    <option value="lead_gen">Lead Gen</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>

              {/* Settings */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Module Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'requiresAuth', label: 'Requires Auth' },
                    { key: 'requiresSubscription', label: 'Requires Subscription' },
                    { key: 'hasMarketplace', label: 'Marketplace' },
                    { key: 'hasSearch', label: 'Search' },
                    { key: 'hasAnalytics', label: 'Analytics' },
                    { key: 'hasModeration', label: 'Moderation' },
                    { key: 'hasCredits', label: 'Credits' },
                  ].map(setting => (
                    <label key={setting.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={definition.settings[setting.key as keyof typeof definition.settings]}
                        onChange={(e) => updateSettings(setting.key, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={generatePreviewScaffold}
                className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2"
              >
                <Code className="w-4 h-4" />
                Preview Scaffold
              </button>
              <button
                onClick={handleCreateModule}
                disabled={isCreating || !definition.name || !definition.slug}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Register Module
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Module Preview</h2>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-3xl">
                  {definition.icon || '📦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {definition.name || 'Module Name'}
                  </h3>
                  <p className="text-sm text-gray-500">/{definition.slug || 'module-slug'}</p>
                  <p className="mt-2 text-gray-600 text-sm">
                    {definition.description || 'Module description will appear here...'}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${FAMILY_COLORS[definition.family] || FAMILY_COLORS.creator}`}>
                      {definition.family.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded border bg-gray-100 text-gray-700">
                      {definition.revenueModel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generated Routes Preview */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Routes</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div className="text-green-600">/{definition.slug || 'module'}</div>
                  <div className="text-green-600">/{definition.slug || 'module'}/[id]</div>
                  {definition.settings.hasSearch && (
                    <div className="text-blue-600">/{definition.slug || 'module'}/search</div>
                  )}
                  {definition.settings.hasMarketplace && (
                    <>
                      <div className="text-purple-600">/{definition.slug || 'module'}/sell</div>
                      <div className="text-purple-600">/{definition.slug || 'module'}/my-listings</div>
                    </>
                  )}
                  <div className="text-orange-600">/api/{definition.slug || 'module'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scaffold Tab */}
      {activeTab === 'scaffold' && (
        <div className="grid grid-cols-4 gap-6">
          {/* File List */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Generated Files</h3>
            {Object.keys(scaffoldFiles).length === 0 ? (
              <p className="text-sm text-gray-500">No scaffold generated yet</p>
            ) : (
              <div className="space-y-1">
                {Object.keys(scaffoldFiles).map(file => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                      selectedFile === file
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {file.split('/').pop()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code Preview */}
          <div className="col-span-3 bg-white rounded-xl border shadow-sm">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <span className="text-sm font-mono text-gray-700">{selectedFile}</span>
                  <button
                    onClick={() => copyToClipboard(scaffoldFiles[selectedFile])}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <pre className="p-4 overflow-auto max-h-[600px] text-sm">
                  <code className="text-gray-800">{scaffoldFiles[selectedFile]}</code>
                </pre>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Code className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p>Select a file to preview or generate a scaffold</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Result */}
      {createResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{createResult.message}</span>
          </div>
          <p className="mt-2 text-sm text-green-600">
            Module ID: {createResult.moduleId}
          </p>
        </div>
      )}
    </div>
  );
}
