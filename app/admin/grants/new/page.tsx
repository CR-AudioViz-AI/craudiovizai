// app/admin/grants/new/page.tsx
// Add New Grant Form - Complete with all fields
// Timestamp: Saturday, December 13, 2025 - 12:40 PM EST

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, DollarSign, Calendar, Building, 
  Target, FileText, Globe, Tags, AlertTriangle,
  Sparkles, RefreshCw
} from 'lucide-react';

const CRAIVERSE_MODULES = [
  { id: 'first-responders', name: 'First Responders Haven' },
  { id: 'veterans-transition', name: 'Veterans Transition Hub' },
  { id: 'together-anywhere', name: 'Together Anywhere' },
  { id: 'faith-communities', name: 'Faith Communities' },
  { id: 'senior-connect', name: 'Senior Connect' },
  { id: 'foster-care-network', name: 'Foster Care Network' },
  { id: 'rural-health', name: 'Rural Health Access' },
  { id: 'mental-health-youth', name: 'Youth Mental Health' },
  { id: 'addiction-recovery', name: 'Recovery Together' },
  { id: 'animal-rescue', name: 'Animal Rescue Network' },
  { id: 'green-earth', name: 'Green Earth Initiative' },
  { id: 'disaster-relief', name: 'Disaster Relief Hub' },
  { id: 'small-business', name: 'Small Business Hub' },
  { id: 'nonprofit-toolkit', name: 'Nonprofit Toolkit' },
  { id: 'education-access', name: 'Education Access' },
  { id: 'digital-literacy', name: 'Digital Literacy' },
  { id: 'artists-collective', name: 'Artists Collective' },
  { id: 'musicians-guild', name: 'Musicians Guild' },
  { id: 'community-journalism', name: 'Community Journalism' },
  { id: 'food-security', name: 'Food Security Network' },
];

const STATUS_OPTIONS = [
  { value: 'researching', label: 'Researching' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'draft', label: 'Draft' },
  { value: 'internal_review', label: 'Internal Review' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'low', label: 'Low', color: 'text-gray-600' },
];

const COMPETITION_LEVELS = [
  { value: 'low', label: 'Low Competition' },
  { value: 'medium', label: 'Medium Competition' },
  { value: 'high', label: 'High Competition' },
  { value: 'extreme', label: 'Extreme Competition' },
];

export default function NewGrantPage() {
  const router = useRouter();
  const [loading, setSaving] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {};

    // Extract form fields
    formData.forEach((value, key) => {
      if (key !== 'target_modules') {
        data[key] = value;
      }
    });

    // Add arrays
    data.target_modules = selectedModules;
    data.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);

    // Convert numeric fields
    if (data.amount_available) data.amount_available = parseFloat(data.amount_available);
    if (data.amount_requested) data.amount_requested = parseFloat(data.amount_requested);
    if (data.match_required) data.match_required = parseFloat(data.match_required);
    if (data.indirect_rate) data.indirect_rate = parseFloat(data.indirect_rate);
    if (data.match_score) data.match_score = parseInt(data.match_score);
    if (data.win_probability) data.win_probability = parseInt(data.win_probability);

    try {
      const response = await fetch('/api/admin/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        router.push(`/admin/grants/${result.id}`);
      } else {
        alert(result.error || 'Failed to create grant');
      }
    } catch (error) {
      console.error('Error creating grant:', error);
      alert('Failed to create grant');
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/grants" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Add New Grant</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/grants/discover"
                className="flex items-center gap-2 px-3 py-2 text-sm text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200"
              >
                <Sparkles className="w-4 h-4" />
                Discover Grants
              </Link>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grant Name *
              </label>
              <input
                name="grant_name"
                required
                placeholder="e.g., FEMA Building Resilient Infrastructure and Communities (BRIC)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Name *
                </label>
                <input
                  name="agency_name"
                  required
                  placeholder="e.g., FEMA, NIH, USDA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name
                </label>
                <input
                  name="program_name"
                  placeholder="e.g., BRIC Program, SBIR Phase I"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grant/Opportunity Number
                </label>
                <input
                  name="opportunity_number"
                  placeholder="e.g., NOFO-2025-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  name="website_url"
                  type="url"
                  placeholder="https://www.grants.gov/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief description of the grant opportunity..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eligibility Requirements
              </label>
              <textarea
                name="eligibility_requirements"
                rows={2}
                placeholder="Who can apply for this grant..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Financial Information
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Available
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    name="amount_available"
                    type="number"
                    step="0.01"
                    placeholder="1000000"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Total grant funding available</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Requesting
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    name="amount_requested"
                    type="number"
                    step="0.01"
                    placeholder="500000"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount we plan to request</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Required (%)
                </label>
                <input
                  name="match_required"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indirect Rate Allowed (%)
                </label>
                <input
                  name="indirect_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Timeline & Dates
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Opens
                </label>
                <input
                  name="application_opens"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Deadline *
                </label>
                <input
                  name="application_deadline"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Period Start
                </label>
                <input
                  name="review_period_start"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Period End
                </label>
                <input
                  name="review_period_end"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision Expected
                </label>
                <input
                  name="decision_expected"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Start Date (If Awarded)
                </label>
                <input
                  name="project_start_date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project End Date
                </label>
                <input
                  name="project_end_date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status & Classification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Status & Classification
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="researching"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Level
                </label>
                <select
                  name="competition_level"
                  defaultValue="medium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {COMPETITION_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Score (0-100)
                </label>
                <input
                  name="match_score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="75"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How well this matches our mission</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Win Probability (0-100)
                </label>
                <input
                  name="win_probability"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="35"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Estimated chance of winning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Target CRAIverse Modules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Target CRAIverse Modules
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select which modules this grant would fund
            </p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CRAIVERSE_MODULES.map((module) => (
                <label
                  key={module.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                    selectedModules.includes(module.id)
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{module.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-teal-600" />
              Keywords
            </h2>
          </div>
          <div className="p-4">
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="mental health, technology, innovation, first responders (comma separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter keywords separated by commas for better searchability and AI matching
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/grants"
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Create Grant'}
          </button>
        </div>
      </form>
    </div>
  );
}
