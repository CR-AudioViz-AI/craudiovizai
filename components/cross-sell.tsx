/**
 * CR AudioViz AI - Centralized Cross-Sell Component
 * 
 * ALL apps use this to display related products/services.
 * Automatically shows relevant CR AudioViz AI products.
 * 
 * Features:
 * - Context-aware recommendations
 * - A/B testing support
 * - Analytics tracking
 * - Customizable styling
 * 
 * @author CR AudioViz AI
 * @created December 25, 2025
 */

'use client';

import React, { useEffect, useState } from 'react';

// All CR AudioViz AI products for cross-selling
const PRODUCTS = {
  // Creative Tools
  'logo-studio': {
    name: 'Logo Studio',
    description: 'AI-powered logo design in minutes',
    icon: '🎨',
    url: 'https://craudiovizai.com/tools/logo-studio',
    category: 'creative',
    tags: ['design', 'branding', 'business'],
  },
  'pdf-builder': {
    name: 'PDF Builder',
    description: 'Create professional PDFs instantly',
    icon: '📄',
    url: 'https://craudiovizai.com/tools/pdf-builder',
    category: 'creative',
    tags: ['documents', 'business', 'productivity'],
  },
  'ebook-creator': {
    name: 'eBook Creator',
    description: 'Write and publish eBooks with AI',
    icon: '📚',
    url: 'https://craudiovizai.com/tools/ebook-creator',
    category: 'creative',
    tags: ['writing', 'publishing', 'content'],
  },
  'music-builder': {
    name: 'Music Builder',
    description: 'Create royalty-free music',
    icon: '🎵',
    url: 'https://craudiovizai.com/tools/music-builder',
    category: 'creative',
    tags: ['audio', 'music', 'content'],
  },
  'social-graphics': {
    name: 'Social Graphics',
    description: 'Design social media content',
    icon: '📱',
    url: 'https://craudiovizai.com/tools/social-graphics',
    category: 'creative',
    tags: ['social', 'marketing', 'design'],
  },
  // Travel
  'orlando-deals': {
    name: 'Orlando Trip Deal',
    description: 'Best theme park vacation deals',
    icon: '🏰',
    url: 'https://orlandotripdeal.com',
    category: 'travel',
    tags: ['vacation', 'disney', 'theme-parks', 'hotels'],
  },
  // Finance
  'market-oracle': {
    name: 'Market Oracle',
    description: 'AI stock & crypto analysis',
    icon: '📈',
    url: 'https://craudiovizai.com/tools/market-oracle',
    category: 'finance',
    tags: ['stocks', 'crypto', 'investing'],
  },
  'mortgage-monitor': {
    name: 'Mortgage Monitor',
    description: 'Track the best mortgage rates',
    icon: '🏠',
    url: 'https://rateunlock.com',
    category: 'finance',
    tags: ['mortgage', 'rates', 'home'],
  },
  // Real Estate
  'realtor-platform': {
    name: 'CravKey Realtor',
    description: 'Real estate CRM & tools',
    icon: '🔑',
    url: 'https://cravkey.com',
    category: 'real-estate',
    tags: ['realtors', 'crm', 'listings'],
  },
  // Gaming
  'games-hub': {
    name: 'Games Hub',
    description: '1200+ free browser games',
    icon: '🎮',
    url: 'https://cravgameshub.com',
    category: 'gaming',
    tags: ['games', 'entertainment', 'fun'],
  },
  // Cards
  'crav-cards': {
    name: 'CravCards',
    description: 'Trading card collection & pricing',
    icon: '🃏',
    url: 'https://cravcards.com',
    category: 'collectibles',
    tags: ['cards', 'pokemon', 'collecting'],
  },
  // Spirits
  'crav-barrels': {
    name: 'CravBarrels',
    description: 'Discover 37K+ spirits',
    icon: '🥃',
    url: 'https://cravbarrels.com',
    category: 'lifestyle',
    tags: ['whiskey', 'spirits', 'bourbon'],
  },
  // Craft
  'crochet-ai': {
    name: 'CrochetAI',
    description: '89K+ crochet patterns',
    icon: '🧶',
    url: 'https://crochetai.app',
    category: 'craft',
    tags: ['crochet', 'patterns', 'yarn'],
  },
  // Testing
  'verifyforge': {
    name: 'VerifyForge',
    description: 'AI-powered app testing',
    icon: '✅',
    url: 'https://verifyforgeai.com',
    category: 'developer',
    tags: ['testing', 'qa', 'automation'],
  },
  // AI
  'javari-ai': {
    name: 'Javari AI',
    description: 'Your AI development partner',
    icon: '🤖',
    url: 'https://javariai.com',
    category: 'ai',
    tags: ['ai', 'assistant', 'builder'],
  },
};

interface CrossSellProps {
  currentApp: string;
  category?: string;
  tags?: string[];
  maxItems?: number;
  style?: 'cards' | 'banner' | 'sidebar' | 'minimal';
  className?: string;
  onProductClick?: (productId: string) => void;
}

export function CrossSell({
  currentApp,
  category,
  tags = [],
  maxItems = 3,
  style = 'cards',
  className = '',
  onProductClick,
}: CrossSellProps) {
  const [recommendations, setRecommendations] = useState<typeof PRODUCTS[keyof typeof PRODUCTS][]>([]);

  useEffect(() => {
    // Get relevant products
    const products = Object.entries(PRODUCTS)
      .filter(([id]) => id !== currentApp) // Exclude current app
      .map(([id, product]) => ({ id, ...product }));

    // Score products by relevance
    const scored = products.map(product => {
      let score = 0;
      
      // Same category = high score
      if (category && product.category === category) {
        score += 10;
      }
      
      // Matching tags
      const matchingTags = product.tags.filter(t => tags.includes(t));
      score += matchingTags.length * 5;
      
      // Add some randomness for variety
      score += Math.random() * 3;
      
      return { ...product, score };
    });

    // Sort by score and take top items
    const topProducts = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    setRecommendations(topProducts);

    // Track impression
    trackCrossSellImpression(currentApp, topProducts.map(p => p.id));
  }, [currentApp, category, tags, maxItems]);

  const handleClick = (productId: string, url: string) => {
    trackCrossSellClick(currentApp, productId);
    onProductClick?.(productId);
    window.open(url, '_blank');
  };

  if (recommendations.length === 0) return null;

  // Different render styles
  switch (style) {
    case 'banner':
      return (
        <div className={`bg-gradient-to-r from-cyan-500 to-cyan-500 text-white p-4 rounded-lg ${className}`}>
          <p className="text-sm font-medium mb-2">You might also like:</p>
          <div className="flex gap-4 overflow-x-auto">
            {recommendations.map(product => (
              <button
                key={product.id}
                onClick={() => handleClick(product.id, product.url)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg whitespace-nowrap transition"
              >
                <span>{product.icon}</span>
                <span className="font-medium">{product.name}</span>
              </button>
            ))}
          </div>
        </div>
      );

    case 'sidebar':
      return (
        <div className={`bg-gray-50 dark:bg-gray-800 p-4 rounded-lg ${className}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            More from CR AudioViz AI
          </h3>
          <div className="space-y-3">
            {recommendations.map(product => (
              <button
                key={product.id}
                onClick={() => handleClick(product.id, product.url)}
                className="w-full flex items-start gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <span className="text-2xl">{product.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
          <span className="text-gray-500">Also try:</span>
          {recommendations.map((product, i) => (
            <React.Fragment key={product.id}>
              <button
                onClick={() => handleClick(product.id, product.url)}
                className="text-cyan-500 hover:text-cyan-500 dark:text-cyan-500"
              >
                {product.icon} {product.name}
              </button>
              {i < recommendations.length - 1 && <span className="text-gray-300">•</span>}
            </React.Fragment>
          ))}
        </div>
      );

    case 'cards':
    default:
      return (
        <div className={`${className}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Explore More Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map(product => (
              <button
                key={product.id}
                onClick={() => handleClick(product.id, product.url)}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-cyan-500 transition text-center"
              >
                <span className="text-4xl mb-2">{product.icon}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">{product.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.description}</p>
              </button>
            ))}
          </div>
        </div>
      );
  }
}

// Analytics tracking functions
function trackCrossSellImpression(fromApp: string, productIds: string[]) {
  if (typeof window !== 'undefined') {
    fetch('/api/analytics/cross-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'impression',
        fromApp,
        products: productIds,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // Silent fail
  }
}

function trackCrossSellClick(fromApp: string, productId: string) {
  if (typeof window !== 'undefined') {
    fetch('/api/analytics/cross-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'click',
        fromApp,
        product: productId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // Silent fail
  }
}

export default CrossSell;
