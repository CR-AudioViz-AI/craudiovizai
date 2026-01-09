// /app/marketplace/page.tsx
// Creator Marketplace - CR AudioViz AI
// Browse, buy, and sell digital products with 70/30 creator split

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // in credits
  category: string;
  thumbnail: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  stats: {
    sales: number;
    rating: number;
    reviews: number;
  };
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Products', icon: '🏪', count: 0 },
  { id: 'templates', name: 'Templates', icon: '📄', count: 45 },
  { id: 'graphics', name: 'Graphics', icon: '🎨', count: 128 },
  { id: 'logos', name: 'Logo Packs', icon: '✨', count: 67 },
  { id: 'prompts', name: 'AI Prompts', icon: '🤖', count: 234 },
  { id: 'presets', name: 'Presets', icon: '🎛️', count: 89 },
  { id: 'fonts', name: 'Fonts', icon: '🔤', count: 56 },
  { id: 'icons', name: 'Icon Packs', icon: '🎯', count: 78 },
  { id: 'photos', name: 'Photos', icon: '📸', count: 312 },
  { id: 'audio', name: 'Audio', icon: '🎵', count: 145 },
  { id: 'video', name: 'Video', icon: '🎬', count: 67 },
  { id: 'code', name: 'Code', icon: '💻', count: 89 }
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Professional Business Card Templates',
    description: '50 premium business card designs, fully customizable',
    price: 25,
    category: 'templates',
    thumbnail: '💼',
    creator: { id: 'c1', name: 'DesignPro', avatar: '👨‍🎨', verified: true },
    stats: { sales: 1234, rating: 4.9, reviews: 456 },
    tags: ['business', 'cards', 'professional'],
    featured: true
  },
  {
    id: '2',
    title: 'AI Art Prompt Collection - Fantasy',
    description: '100 detailed prompts for stunning fantasy artwork',
    price: 15,
    category: 'prompts',
    thumbnail: '🐉',
    creator: { id: 'c2', name: 'PromptMaster', avatar: '🧙', verified: true },
    stats: { sales: 2567, rating: 4.8, reviews: 892 },
    tags: ['ai', 'prompts', 'fantasy', 'art'],
    featured: true
  },
  {
    id: '3',
    title: 'Minimal Logo Pack - 200 Designs',
    description: 'Clean, modern logo templates for any business',
    price: 35,
    category: 'logos',
    thumbnail: '◯',
    creator: { id: 'c3', name: 'LogoStudio', avatar: '🎨', verified: true },
    stats: { sales: 890, rating: 4.7, reviews: 234 },
    tags: ['logos', 'minimal', 'modern'],
    featured: true
  },
  {
    id: '4',
    title: 'Social Media Template Bundle',
    description: 'Instagram, TikTok, YouTube - 150 templates',
    price: 20,
    category: 'templates',
    thumbnail: '📱',
    creator: { id: 'c4', name: 'SocialKing', avatar: '👑', verified: false },
    stats: { sales: 3421, rating: 4.6, reviews: 1023 },
    tags: ['social', 'templates', 'instagram'],
    isNew: true
  },
  {
    id: '5',
    title: 'Hand-Drawn Icon Set - 500 Icons',
    description: 'Unique hand-drawn style icons in multiple formats',
    price: 18,
    category: 'icons',
    thumbnail: '✏️',
    creator: { id: 'c5', name: 'IconArtist', avatar: '🖌️', verified: true },
    stats: { sales: 567, rating: 4.9, reviews: 178 },
    tags: ['icons', 'hand-drawn', 'unique']
  },
  {
    id: '6',
    title: 'Cinematic LUTs Pack',
    description: '25 professional color grading presets for video',
    price: 30,
    category: 'presets',
    thumbnail: '🎬',
    creator: { id: 'c6', name: 'ColorGrade', avatar: '🎥', verified: true },
    stats: { sales: 789, rating: 4.8, reviews: 267 },
    tags: ['video', 'luts', 'color']
  },
  {
    id: '7',
    title: 'Ambient Music Loops - 50 Tracks',
    description: 'Royalty-free ambient background music',
    price: 22,
    category: 'audio',
    thumbnail: '🎧',
    creator: { id: 'c7', name: 'SoundWave', avatar: '🎹', verified: false },
    stats: { sales: 432, rating: 4.5, reviews: 145 },
    tags: ['music', 'ambient', 'royalty-free'],
    isNew: true
  },
  {
    id: '8',
    title: 'React Component Library',
    description: '75 production-ready React components with TypeScript',
    price: 45,
    category: 'code',
    thumbnail: '⚛️',
    creator: { id: 'c8', name: 'DevPro', avatar: '👨‍💻', verified: true },
    stats: { sales: 234, rating: 4.9, reviews: 89 },
    tags: ['react', 'typescript', 'components']
  }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
    >
      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-500 dark:from-blue-900/30 dark:to-cyan-500/30 flex items-center justify-center relative">
        <span className="text-6xl">{product.thumbnail}</span>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && (
            <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded-full">
              ⭐ Featured
            </span>
          )}
          {product.isNew && (
            <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded-full">
              New
            </span>
          )}
        </div>
        
        {/* Price */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white shadow-lg">
            {product.price} credits
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{product.creator.avatar}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {product.creator.name}
          </span>
          {product.creator.verified && (
            <span className="text-blue-500" title="Verified Creator">✓</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>⭐ {product.stats.rating} ({product.stats.reviews})</span>
          <span>📦 {product.stats.sales.toLocaleString()} sold</span>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <Link
          href={`/marketplace/product/${product.id}`}
          className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

function CreatorCTA() {
  return (
    <div className="bg-gradient-to-r from-cyan-500 to-cyan-500 rounded-2xl p-8 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Become a Creator 🎨</h2>
        <p className="text-cyan-500 mb-6 text-lg">
          Sell your digital products and keep 70% of every sale. 
          Templates, prompts, graphics, code - if you made it, you can sell it.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-bold">70% Revenue</div>
            <div className="text-sm text-cyan-500">You keep the majority</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl mb-2">🚀</div>
            <div className="font-bold">Instant Payouts</div>
            <div className="text-sm text-cyan-500">Weekly to your account</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-bold">Full Analytics</div>
            <div className="text-sm text-cyan-500">Track every sale</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/marketplace/sell"
            className="px-8 py-3 bg-white text-cyan-500 rounded-xl font-bold hover:bg-purple-50 transition-colors"
          >
            Start Selling →
          </Link>
          <Link
            href="/marketplace/creator-guide"
            className="px-8 py-3 border-2 border-white/50 rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Creator Guide
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.stats.sales - a.stats.sales;
      case 'newest':
        return b.isNew ? 1 : -1;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.stats.rating - a.stats.rating;
      default:
        return 0;
    }
  });

  const featuredProducts = products.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏪</span>
                </div>
              </Link>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Creator Marketplace</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Buy & sell digital products</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href="/marketplace/sell" className="px-4 py-2 border border-cyan-500 text-cyan-500 dark:text-cyan-500 rounded-lg hover:bg-purple-50 dark:hover:bg-cyan-500/20 text-sm font-medium">
                Sell Products
              </Link>
              <Link href="/dashboard" className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 text-sm font-medium">
                My Purchases
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-cyan-500 dark:bg-cyan-500/50 dark:text-cyan-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
                {cat.id !== 'all' && (
                  <span className="ml-1.5 text-xs text-gray-400">({cat.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ⭐ Featured Products
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Sort & Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {sortedProducts.length} products found
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Creator CTA */}
        <CreatorCTA />

        {/* How It Works */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '🔍', title: 'Browse', desc: 'Find the perfect digital product' },
              { icon: '💳', title: 'Purchase', desc: 'Pay with your Javari credits' },
              { icon: '📥', title: 'Download', desc: 'Instant access to your files' },
              { icon: '🚀', title: 'Create', desc: 'Use in your projects immediately' }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-cyan-500 dark:bg-cyan-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-sm mt-2">Creators keep 70% of every sale.</p>
        </div>
      </footer>
    </div>
  );
}
