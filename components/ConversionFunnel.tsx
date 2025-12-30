// /components/ConversionFunnel.tsx
// Unified Conversion Funnel - CR AudioViz AI Revenue Trinity
// Shared UI for Travel, Insurance, Finance modules
'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Types
interface FunnelItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  priceLabel?: string;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  ctaText: string;
  ctaUrl: string;
  affiliateId?: string;
  badge?: string;
  image?: string;
}

interface FunnelConfig {
  module: 'travel' | 'insurance' | 'finance';
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  compareEnabled: boolean;
  maxCompare: number;
  creditsReward?: number;
  crossSellModules?: string[];
}

interface ConversionFunnelProps {
  config: FunnelConfig;
  items: FunnelItem[];
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  isLoading?: boolean;
}

// Funnel Steps
type FunnelStep = 'search' | 'browse' | 'compare' | 'convert';

export function ConversionFunnel({
  config,
  items,
  onSearch,
  onFilter,
  isLoading = false
}: ConversionFunnelProps) {
  const [step, setStep] = useState<FunnelStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const { trackEvent, trackConversion } = useAnalytics();

  // Track funnel progression
  useEffect(() => {
    trackEvent(`${config.module}_funnel_step`, { step });
  }, [step, config.module, trackEvent]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEvent(`${config.module}_search`, { query: searchQuery });
      onSearch?.(searchQuery);
      setStep('browse');
    }
  };

  // Handle item selection for compare
  const toggleCompare = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      if (prev.length >= config.maxCompare) {
        return prev;
      }
      return [...prev, itemId];
    });
  };

  // Handle CTA click (conversion)
  const handleConversion = (item: FunnelItem) => {
    trackConversion({
      module: config.module,
      itemId: item.id,
      affiliateId: item.affiliateId,
      value: item.price
    });

    // Open affiliate link
    window.open(item.ctaUrl, '_blank');
  };

  // Get selected items for compare
  const compareItems = items.filter(item => selectedItems.includes(item.id));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
        <p className="text-gray-600">{config.subtitle}</p>
        {config.creditsReward && (
          <p className="text-sm text-green-600 mt-2">
            🎁 Earn {config.creditsReward} credits on your first booking!
          </p>
        )}
      </div>

      {/* Search Section */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={config.searchPlaceholder}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Compare Bar (when items selected) */}
      {config.compareEnabled && selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {selectedItems.length} of {config.maxCompare} selected
              </span>
              <div className="flex gap-2">
                {compareItems.map(item => (
                  <span key={item.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {item.title.substring(0, 20)}...
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setShowCompare(true);
                  setStep('compare');
                  trackEvent(`${config.module}_compare`, { count: selectedItems.length });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={selectedItems.length < 2}
              >
                Compare ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Compare Options</h2>
              <button
                onClick={() => setShowCompare(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compareItems.map(item => (
                  <CompareCard
                    key={item.id}
                    item={item}
                    onSelect={() => handleConversion(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Finding the best options...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No results found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onToggleCompare={() => toggleCompare(item.id)}
              onConvert={() => handleConversion(item)}
              compareEnabled={config.compareEnabled}
            />
          ))}
        </div>
      )}

      {/* Cross-sell Section */}
      {config.crossSellModules && config.crossSellModules.length > 0 && items.length > 0 && (
        <CrossSellBanner modules={config.crossSellModules} currentModule={config.module} />
      )}
    </div>
  );
}

// Item Card Component
function ItemCard({
  item,
  isSelected,
  onToggleCompare,
  onConvert,
  compareEnabled
}: {
  item: FunnelItem;
  isSelected: boolean;
  onToggleCompare: () => void;
  onConvert: () => void;
  compareEnabled: boolean;
}) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:shadow-lg'
    }`}>
      {/* Badge */}
      {item.badge && (
        <div className="bg-green-500 text-white text-sm px-3 py-1 text-center">
          {item.badge}
        </div>
      )}

      {/* Image */}
      {item.image && (
        <div className="h-40 bg-gray-100">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-3">{item.description}</p>

        {/* Rating */}
        {item.rating && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{item.rating.toFixed(1)}</span>
            {item.reviewCount && (
              <span className="text-gray-500 text-sm">({item.reviewCount} reviews)</span>
            )}
          </div>
        )}

        {/* Features */}
        {item.features && item.features.length > 0 && (
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            {item.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="text-green-500">✓</span> {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        {item.price !== undefined && (
          <div className="mb-4">
            <span className="text-2xl font-bold">${item.price}</span>
            {item.priceLabel && (
              <span className="text-gray-500 text-sm ml-1">{item.priceLabel}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {compareEnabled && (
            <button
              onClick={onToggleCompare}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isSelected ? '✓ Selected' : 'Compare'}
            </button>
          )}
          <button
            onClick={onConvert}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {item.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Compare Card Component
function CompareCard({
  item,
  onSelect
}: {
  item: FunnelItem;
  onSelect: () => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{item.title}</h3>
      
      {item.price !== undefined && (
        <div className="text-2xl font-bold text-blue-600 mb-3">
          ${item.price}
          {item.priceLabel && <span className="text-sm text-gray-500 ml-1">{item.priceLabel}</span>}
        </div>
      )}

      {item.rating && (
        <div className="flex items-center gap-1 mb-3">
          <span className="text-yellow-500">★</span>
          <span>{item.rating.toFixed(1)}</span>
        </div>
      )}

      {item.features && (
        <ul className="text-sm space-y-2 mb-4">
          {item.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onSelect}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {item.ctaText}
      </button>
    </div>
  );
}

// Cross-sell Banner
function CrossSellBanner({
  modules,
  currentModule
}: {
  modules: string[];
  currentModule: string;
}) {
  const crossSellConfig: Record<string, { title: string; description: string; link: string }> = {
    travel: {
      title: '✈️ Planning a Trip?',
      description: 'Find the best deals on flights, hotels, and experiences.',
      link: '/travel'
    },
    insurance: {
      title: '🛡️ Protect Your Trip',
      description: 'Get travel insurance quotes from top providers.',
      link: '/insurance'
    },
    finance: {
      title: '💰 Manage Your Money',
      description: 'Track investments and get personalized financial insights.',
      link: '/finance'
    }
  };

  const relevantModules = modules.filter(m => m !== currentModule);

  if (relevantModules.length === 0) return null;

  return (
    <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
      <h3 className="font-semibold text-lg mb-4">You might also be interested in...</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantModules.map(module => {
          const config = crossSellConfig[module];
          if (!config) return null;
          
          return (
            <a
              key={module}
              href={config.link}
              className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <h4 className="font-medium">{config.title}</h4>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
              <span className="text-blue-600">→</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Pre-configured funnels for each module
export const FUNNEL_CONFIGS: Record<string, FunnelConfig> = {
  travel: {
    module: 'travel',
    title: 'Find Your Perfect Trip',
    subtitle: 'Compare deals from top travel sites and save big',
    searchPlaceholder: 'Where do you want to go?',
    compareEnabled: true,
    maxCompare: 3,
    creditsReward: 50,
    crossSellModules: ['insurance', 'finance']
  },
  insurance: {
    module: 'insurance',
    title: 'Compare Insurance Quotes',
    subtitle: 'Get the best coverage at the best price',
    searchPlaceholder: 'What type of insurance do you need?',
    compareEnabled: true,
    maxCompare: 4,
    creditsReward: 25,
    crossSellModules: ['travel', 'finance']
  },
  finance: {
    module: 'finance',
    title: 'Your Financial Dashboard',
    subtitle: 'Track, plan, and grow your wealth',
    searchPlaceholder: 'Search investments, tools, or guides...',
    compareEnabled: false,
    maxCompare: 0,
    creditsReward: 10,
    crossSellModules: ['travel', 'insurance']
  }
};

export default ConversionFunnel;
