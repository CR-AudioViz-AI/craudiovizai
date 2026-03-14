// /app/hub/page.tsx
// Module Hub - CR AudioViz AI / Javari
// Central navigation to all platform tools, services, and modules
// Shows personalized recommendations based on user interests

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SocialLinks } from '@/components/SocialLinks';

// =============================================================================
// MODULE DEFINITIONS
// =============================================================================

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'live' | 'coming_soon' | 'beta';
  url: string;
  creditCost?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  tags: string[];
}

const MODULES: Module[] = [
  // CREATIVE TOOLS
  {
    id: 'javari-chat',
    name: 'Javari AI Chat',
    description: 'Your personal AI assistant for any task',
    icon: '🤖',
    category: 'creative',
    status: 'live',
    url: '/chat',
    creditCost: '1 credit/message',
    isFeatured: true,
    tags: ['ai', 'chat', 'assistant']
  },
  {
    id: 'logo-creator',
    name: 'Logo Creator',
    description: 'Design professional logos with AI assistance',
    icon: '🎨',
    category: 'creative',
    status: 'live',
    url: '/tools/logo-creator',
    creditCost: '5 credits/logo',
    tags: ['design', 'branding', 'graphics']
  },
  {
    id: 'document-writer',
    name: 'Document Writer',
    description: 'Create polished documents, reports, and more',
    icon: '📄',
    category: 'creative',
    status: 'live',
    url: '/tools/document-writer',
    creditCost: '3 credits/document',
    tags: ['writing', 'documents', 'reports']
  },
  {
    id: 'social-graphics',
    name: 'Social Media Designer',
    description: 'Create eye-catching social media graphics',
    icon: '📱',
    category: 'creative',
    status: 'live',
    url: '/tools/social-graphics',
    creditCost: '2 credits/design',
    tags: ['social', 'marketing', 'graphics']
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Professional invoices in seconds',
    icon: '💰',
    category: 'creative',
    status: 'live',
    url: '/tools/invoice-generator',
    creditCost: '1 credit/invoice',
    tags: ['business', 'finance', 'invoices']
  },
  {
    id: 'pdf-builder',
    name: 'PDF Builder',
    description: 'Create, edit, and merge PDFs',
    icon: '📑',
    category: 'creative',
    status: 'live',
    url: '/tools/pdf-builder',
    creditCost: '2 credits/PDF',
    tags: ['documents', 'pdf', 'editing']
  },
  {
    id: 'presentation-maker',
    name: 'Presentation Maker',
    description: 'Build stunning presentations with AI — professional slides in minutes',
    icon: '📊',
    category: 'creative',
    status: 'live',
    url: 'https://javari-presentation-maker-roy-hendersons-projects-1d3d5e94.vercel.app',
    creditCost: '3 credits/deck',
    isNew: true,
    tags: ['presentations', 'business', 'slides', 'ai']
  },
  {
    id: 'ebook-studio',
    name: 'eBook Studio',
    description: 'Write and publish eBooks',
    icon: '📚',
    category: 'creative',
    status: 'beta',
    url: 'https://javari-ebook-2qfpc15u4-roy-hendersons-projects-1d3d5e94.vercel.app',
    isNew: true,
    tags: ['writing', 'publishing', 'books']
  },

  // GAMES & ENTERTAINMENT
  {
    id: 'games-hub',
    name: 'Games Hub',
    description: 'Extensive library of casual games',
    icon: '🎮',
    category: 'games',
    status: 'live',
    url: '/games',
    creditCost: 'Free to play',
    isFeatured: true,
    tags: ['games', 'entertainment', 'fun']
  },
  {
    id: 'game-studio',
    name: 'Game Studio',
    description: 'Create your own games with AI',
    icon: '🕹️',
    category: 'games',
    status: 'beta',
    url: '/tools/game-studio',
    isNew: true,
    tags: ['games', 'development', 'creator']
  },

  // REVENUE ENGINES
  {
    id: 'travel',
    name: 'Orlando Trip Deal',
    description: 'Find amazing Orlando vacation deals',
    icon: '✈️',
    category: 'travel',
    status: 'live',
    url: 'https://orlandotripdeal.com',
    isFeatured: true,
    tags: ['travel', 'vacation', 'deals']
  },
  {
    id: 'spirits',
    name: 'CravBarrels',
    description: 'Discover premium spirits and whiskey',
    icon: '🥃',
    category: 'lifestyle',
    status: 'live',
    url: 'https://cravbarrels.com',
    tags: ['spirits', 'whiskey', 'discovery']
  },
  {
    id: 'trading-cards',
    name: 'CravCards',
    description: 'Trading cards marketplace and tools',
    icon: '🃏',
    category: 'collectors',
    status: 'live',
    url: 'https://cravcards.com',
    tags: ['trading cards', 'collectibles', 'marketplace']
  },
  {
    id: 'market-oracle',
    name: 'Market Oracle',
    description: 'AI-powered stock analysis and insights',
    icon: '📈',
    category: 'finance',
    status: 'live',
    url: '/tools/market-oracle',
    creditCost: '5 credits/analysis',
    tags: ['stocks', 'finance', 'analysis']
  },

  // REAL ESTATE
  {
    id: 'cravkey',
    name: 'CravKey',
    description: 'B2B realtor CRM and lead management',
    icon: '🏠',
    category: 'real-estate',
    status: 'live',
    url: 'https://cravkey.com',
    tags: ['real estate', 'crm', 'realtors']
  },
  {
    id: 'zoyzy',
    name: 'Zoyzy',
    description: 'Consumer property search',
    icon: '🔑',
    category: 'real-estate',
    status: 'live',
    url: 'https://zoyzy.com',
    tags: ['real estate', 'property', 'search']
  },
  {
    id: 'rate-unlock',
    name: 'Rate Unlock',
    description: 'Compare mortgage rates',
    icon: '💵',
    category: 'real-estate',
    status: 'live',
    url: 'https://rateunlock.com',
    tags: ['mortgage', 'rates', 'finance']
  },

  // BUSINESS TOOLS
  {
    id: 'newsletter',
    name: 'Newsletter Builder',
    description: 'Create and send beautiful newsletters',
    icon: '📧',
    category: 'business',
    status: 'live',
    url: '/tools/newsletter',
    creditCost: '2 credits/newsletter',
    tags: ['email', 'marketing', 'newsletters']
  },
  {
    id: 'competitive-intel',
    name: 'Competitive Intelligence',
    description: 'Track and analyze competitors',
    icon: '🔍',
    category: 'business',
    status: 'live',
    url: '/tools/competitive-intel',
    creditCost: '10 credits/report',
    tags: ['research', 'competition', 'analysis']
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Track your business metrics',
    icon: '📊',
    category: 'business',
    status: 'live',
    url: '/dashboard/analytics',
    tags: ['analytics', 'metrics', 'dashboard']
  },

  // MEDIA & CONTENT
  {
    id: 'music-builder',
    name: 'Music Builder',
    description: 'Create AI-generated music',
    icon: '🎵',
    category: 'media',
    status: 'beta',
    url: '/tools/music-builder',
    isNew: true,
    tags: ['music', 'audio', 'creator']
  },
  {
    id: 'video-analysis',
    name: 'Video Analysis',
    description: 'AI-powered video understanding',
    icon: '🎬',
    category: 'media',
    status: 'beta',
    url: '/tools/video-analysis',
    tags: ['video', 'analysis', 'ai']
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    description: 'Digital scrapbooking made easy',
    icon: '📸',
    category: 'media',
    status: 'live',
    url: '/tools/scrapbook',
    tags: ['photos', 'memories', 'creative']
  },

  // COMING SOON - SOCIAL IMPACT
  {
    id: 'first-responders',
    name: 'First Responders Hub',
    description: 'Mental health and peer support',
    icon: '🚒',
    category: 'social-impact',
    status: 'coming_soon',
    url: '/modules/first-responders',
    tags: ['first responders', 'mental health', 'support']
  },
  {
    id: 'veterans',
    name: 'Veterans Connect',
    description: 'Career transition and family support',
    icon: '🎖️',
    category: 'social-impact',
    status: 'coming_soon',
    url: '/modules/veterans',
    tags: ['veterans', 'military', 'careers']
  },
  {
    id: 'faith',
    name: 'Faith Communities',
    description: 'Church management and multi-faith support',
    icon: '⛪',
    category: 'social-impact',
    status: 'coming_soon',
    url: '/modules/faith',
    tags: ['faith', 'church', 'community']
  },
  {
    id: 'animal-rescue',
    name: 'Animal Rescue',
    description: 'Shelter management and adoption',
    icon: '🐾',
    category: 'social-impact',
    status: 'coming_soon',
    url: '/modules/animal-rescue',
    tags: ['animals', 'rescue', 'adoption']
  }
  // PHASE 2 MODULE FACTORY — Creator Tools (deployed 2026-03-15)
  {
    id: 'resume-builder',
    name: 'Resume Builder',
    description: 'AI-powered resume builder — land more interviews with a standout resume',
    icon: '📄',
    category: 'creative',
    status: 'live',
    url: 'https://javari-resume-builder-o61tndbm3.vercel.app',
    creditCost: '2 credits/resume',
    isNew: true,
    tags: ['resume', 'career', 'jobs', 'ai', 'writing']
  },
  {
    id: 'cover-letter-pro',
    name: 'Cover Letter Pro',
    description: 'AI cover letter generator — stand out from the crowd with personalized letters',
    icon: '💼',
    category: 'creative',
    status: 'live',
    url: 'https://javari-cover-letter-p0ktwmtbq-roy-hendersons-projects-1d3d5e94.vercel.app',
    creditCost: '1 credit/letter',
    isNew: true,
    tags: ['cover-letter', 'career', 'jobs', 'ai', 'writing']
  },
  {
    id: 'social-posts-creator',
    name: 'Social Posts Creator',
    description: 'Generate viral social media content for any platform in seconds',
    icon: '📱',
    category: 'creative',
    status: 'live',
    url: 'https://javari-social-posts-m8tv7437h-roy-hendersons-projects-1d3d5e94.vercel.app',
    creditCost: '1 credit/post',
    isNew: true,
    tags: ['social-media', 'marketing', 'content', 'ai']
  },
  {
    id: 'email-templates-builder',
    name: 'Email Templates',
    description: 'Professional AI email template builder — high-converting emails for any purpose',
    icon: '✉️',
    category: 'creative',
    status: 'live',
    url: 'https://javari-email-templates-85ccvbq3v.vercel.app',
    creditCost: '1 credit/template',
    isNew: true,
    tags: ['email', 'marketing', 'templates', 'ai']
  },
  {
    id: 'scrapbook-creator',
    name: 'Javari Scrapbook',
    description: 'AI-powered digital scrapbooking — create, share, and publish beautiful memory books',
    icon: '📷',
    category: 'creative',
    status: 'live',
    url: 'https://crav-scrapbook-8tymntthw-roy-hendersons-projects-1d3d5e94.vercel.app',
    creditCost: '2 credits/scrapbook',
    isNew: true,
    tags: ['scrapbook', 'photos', 'memories', 'creative', 'design']
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Modules', icon: '🏠' },
  { id: 'creative', name: 'Creative Tools', icon: '🎨' },
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'finance', name: 'Finance', icon: '📈' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'media', name: 'Media', icon: '🎬' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' },
  { id: 'collectors', name: 'Collectors', icon: '🃏' },
  { id: 'social-impact', name: 'Social Impact', icon: '❤️' }
];

// =============================================================================
// MODULE CARD COMPONENT
// =============================================================================

function ModuleCard({ module }: { module: Module }) {
  const statusColors = {
    live: 'bg-cyan-500 text-cyan-500 dark:bg-cyan-500/30 dark:text-cyan-500',
    beta: 'bg-cyan-400 text-cyan-400 dark:bg-cyan-400/30 dark:text-cyan-400',
    coming_soon: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  };

  const statusLabels = {
    live: 'Live',
    beta: 'Beta',
    coming_soon: 'Coming Soon'
  };

  const isExternal = module.url.startsWith('http');

  const CardContent = (
    <motion.div
      whileHover={{ scale: module.status !== 'coming_soon' ? 1.02 : 1, y: module.status !== 'coming_soon' ? -4 : 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col ${
        module.status === 'coming_soon' ? 'opacity-60' : 'cursor-pointer hover:shadow-xl'
      } transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{module.icon}</span>
        <div className="flex gap-2">
          {module.isNew && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded-full">
              New
            </span>
          )}
          {module.isFeatured && (
            <span className="px-2 py-1 bg-cyan-500 text-cyan-500 dark:bg-cyan-500/30 dark:text-cyan-500 text-xs font-medium rounded-full">
              ⭐ Featured
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[module.status]}`}>
            {statusLabels[module.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {module.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
        {module.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        {module.creditCost ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            💳 {module.creditCost}
          </span>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {module.status === 'coming_soon' ? 'Stay tuned!' : 'Free'}
          </span>
        )}
        {module.status !== 'coming_soon' && (
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1">
            Open →
            {isExternal && <span className="text-xs">↗</span>}
          </span>
        )}
      </div>
    </motion.div>
  );

  if (module.status === 'coming_soon') {
    return CardContent;
  }

  if (isExternal) {
    return (
      <a href={module.url} target="_blank" rel="noopener noreferrer">
        {CardContent}
      </a>
    );
  }

  return (
    <Link href={module.url}>
      {CardContent}
    </Link>
  );
}

// =============================================================================
// MAIN HUB PAGE
// =============================================================================

export default function HubPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userCredits, setUserCredits] = useState<number | null>(null);

  // Filter modules
  const filteredModules = MODULES.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredModules = MODULES.filter(m => m.isFeatured && m.status === 'live');
  const liveModules = filteredModules.filter(m => m.status === 'live');
  const betaModules = filteredModules.filter(m => m.status === 'beta');
  const comingSoonModules = filteredModules.filter(m => m.status === 'coming_soon');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">J</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white">Module Hub</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Explore all tools & services</p>
                </div>
              </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              {userCredits !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-blue-600 dark:text-blue-400">💳</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{userCredits} credits</span>
                </div>
              )}
              <Link href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Get Credits
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section (only show on "All") */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredModules.map(module => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        )}

        {/* Live Modules */}
        {liveModules.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🟢 Live Now
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({liveModules.length} modules)
              </span>
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {liveModules.map(module => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        )}

        {/* Beta Modules */}
        {betaModules.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🧪 In Beta
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({betaModules.length} modules)
              </span>
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {betaModules.map(module => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {comingSoonModules.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🚀 Coming Soon
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({comingSoonModules.length} modules)
              </span>
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {comingSoonModules.map(module => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No modules found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or category filter
            </p>
          </div>
        )}

        {/* Social CTA */}
        <section className="mt-16">
          <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-cyan-500 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Connected! 🎉</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Follow us for updates on new modules, features, tips, and exclusive content.
            </p>
            <SocialLinks 
              variant="icons" 
              platforms={['twitter', 'discord', 'youtube', 'instagram', 'tiktok', 'linkedin']}
              className="justify-center"
            />
            <Link 
              href="/socials" 
              className="inline-block mt-4 text-sm text-blue-200 hover:text-white"
            >
              See all platforms →
            </Link>
          </div>
        </section>

        {/* Request Feature */}
        <section className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Don't see what you need?
          </p>
          <Link 
            href="/support/enhancement-request"
            className="inline-block px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
          >
            💡 Request a Feature
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-sm mt-2">Your Story. Our Design.</p>
        </div>
      </footer>
    </div>
  );
}
