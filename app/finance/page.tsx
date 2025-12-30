// /app/finance/page.tsx
// Finance Hub - CR AudioViz AI Revenue Trinity
// Investment tracking, budgeting, and financial tools
'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Finance categories
const FINANCE_CATEGORIES = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'invest', name: 'Investing', icon: '📈' },
  { id: 'budget', name: 'Budgeting', icon: '💰' },
  { id: 'credit', name: 'Credit', icon: '💳' },
  { id: 'crypto', name: 'Crypto', icon: '₿' },
  { id: 'learn', name: 'Learn', icon: '📚' }
];

// Partner offers
const PARTNER_OFFERS = [
  {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Commission-free stock & crypto trading. Get a free stock when you sign up.',
    bonus: 'Free Stock',
    category: 'invest',
    features: ['No commission fees', 'Fractional shares', 'Crypto trading', 'Cash management'],
    ctaText: 'Get Free Stock',
    ctaUrl: 'https://robinhood.com/ref/craudiovizai',
    rating: 4.5,
    logo: '🟢'
  },
  {
    id: 'webull',
    name: 'Webull',
    description: 'Advanced trading platform with free stocks for new accounts.',
    bonus: 'Up to 12 Free Stocks',
    category: 'invest',
    features: ['Extended hours trading', 'Advanced charts', 'Paper trading', 'Options trading'],
    ctaText: 'Claim Free Stocks',
    ctaUrl: 'https://webull.com/ref/craudiovizai',
    rating: 4.6,
    logo: '🔵'
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    description: 'The most trusted crypto exchange. Earn free crypto through learning.',
    bonus: '$10 in Bitcoin',
    category: 'crypto',
    features: ['500+ cryptocurrencies', 'Earn while learning', 'Secure vault', 'Staking rewards'],
    ctaText: 'Get $10 Bitcoin',
    ctaUrl: 'https://coinbase.com/join/craudiovizai',
    rating: 4.4,
    logo: '🔷'
  },
  {
    id: 'sofi',
    name: 'SoFi',
    description: 'All-in-one finance app for banking, investing, and loans.',
    bonus: '$25 Bonus',
    category: 'invest',
    features: ['No account fees', 'High APY savings', 'Stock/crypto trading', 'Personal loans'],
    ctaText: 'Get $25 Bonus',
    ctaUrl: 'https://sofi.com/share/craudiovizai',
    rating: 4.7,
    logo: '🟣'
  },
  {
    id: 'creditkarma',
    name: 'Credit Karma',
    description: 'Free credit scores, reports, and personalized recommendations.',
    bonus: 'Free Forever',
    category: 'credit',
    features: ['Free credit scores', 'Credit monitoring', 'Personalized offers', 'Tax filing'],
    ctaText: 'Check Score Free',
    ctaUrl: 'https://creditkarma.com/ref/craudiovizai',
    rating: 4.8,
    logo: '💚'
  },
  {
    id: 'acorns',
    name: 'Acorns',
    description: 'Invest spare change automatically. Start with just $5.',
    bonus: '$20 Bonus',
    category: 'invest',
    features: ['Round-up investing', 'Automated savings', 'Retirement accounts', 'Banking'],
    ctaText: 'Start Investing',
    ctaUrl: 'https://acorns.com/share/craudiovizai',
    rating: 4.5,
    logo: '🌰'
  }
];

// Financial tools
const FINANCE_TOOLS = [
  {
    id: 'budget-calc',
    name: 'Budget Calculator',
    description: 'Create a personalized budget based on your income and goals.',
    icon: '🧮',
    credits: 0
  },
  {
    id: 'compound-calc',
    name: 'Compound Interest Calculator',
    description: 'See how your investments can grow over time.',
    icon: '📈',
    credits: 0
  },
  {
    id: 'debt-payoff',
    name: 'Debt Payoff Planner',
    description: 'Create a strategy to become debt-free faster.',
    icon: '🎯',
    credits: 0
  },
  {
    id: 'retirement-calc',
    name: 'Retirement Calculator',
    description: 'Plan for your future with our retirement estimator.',
    icon: '🏖️',
    credits: 0
  },
  {
    id: 'net-worth',
    name: 'Net Worth Tracker',
    description: 'Track your assets and liabilities in one place.',
    icon: '💎',
    credits: 5
  },
  {
    id: 'investment-analyzer',
    name: 'Investment Analyzer',
    description: 'Analyze stocks, ETFs, and crypto with AI insights.',
    icon: '🤖',
    credits: 10
  }
];

// Learning resources
const LEARNING_RESOURCES = [
  {
    title: 'Investing 101',
    description: 'Learn the basics of stock market investing.',
    duration: '15 min',
    level: 'Beginner'
  },
  {
    title: 'Crypto Fundamentals',
    description: 'Understand blockchain and cryptocurrency basics.',
    duration: '20 min',
    level: 'Beginner'
  },
  {
    title: 'Building Your Budget',
    description: 'Create a budget that actually works.',
    duration: '10 min',
    level: 'Beginner'
  },
  {
    title: 'Credit Score Mastery',
    description: 'Improve your credit score step by step.',
    duration: '12 min',
    level: 'Intermediate'
  }
];

export default function FinancePage() {
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const { trackPageView, trackEvent, trackConversion } = useAnalytics();

  useEffect(() => {
    trackPageView('finance', { category: selectedCategory });
  }, [selectedCategory, trackPageView]);

  const handleOfferClick = (offer: typeof PARTNER_OFFERS[0]) => {
    trackConversion({
      module: 'finance',
      itemId: offer.id,
      affiliateId: offer.id,
      value: 0
    });
    window.open(offer.ctaUrl, '_blank');
  };

  const handleToolClick = (tool: typeof FINANCE_TOOLS[0]) => {
    trackEvent('finance_tool_click', { tool: tool.id, credits: tool.credits });
    // Would navigate to tool
  };

  const filteredOffers = selectedCategory === 'overview' 
    ? PARTNER_OFFERS 
    : PARTNER_OFFERS.filter(o => o.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Financial Command Center
          </h1>
          <p className="text-xl text-emerald-100 mb-6">
            Track, plan, and grow your wealth with smart tools and exclusive partner offers.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <div className="text-2xl font-bold">$500+</div>
              <div className="text-sm text-emerald-200">In Sign-up Bonuses</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <div className="text-2xl font-bold">6</div>
              <div className="text-sm text-emerald-200">Free Finance Tools</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <div className="text-2xl font-bold">10</div>
              <div className="text-sm text-emerald-200">Credits Per Sign-up</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {FINANCE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Section */}
        {selectedCategory === 'overview' && (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <QuickAction icon="📊" label="Check Net Worth" onClick={() => handleToolClick(FINANCE_TOOLS[4])} />
              <QuickAction icon="💳" label="Credit Score" onClick={() => handleOfferClick(PARTNER_OFFERS[4])} />
              <QuickAction icon="📈" label="Start Investing" onClick={() => handleOfferClick(PARTNER_OFFERS[0])} />
              <QuickAction icon="🧮" label="Budget Planner" onClick={() => handleToolClick(FINANCE_TOOLS[0])} />
            </div>

            {/* Featured Offers */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">🎁 Exclusive Sign-up Bonuses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PARTNER_OFFERS.slice(0, 6).map(offer => (
                  <OfferCard key={offer.id} offer={offer} onClick={() => handleOfferClick(offer)} />
                ))}
              </div>
            </section>

            {/* Finance Tools */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">🛠️ Free Finance Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FINANCE_TOOLS.map(tool => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => handleToolClick(tool)} />
                ))}
              </div>
            </section>

            {/* Learning Resources */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">📚 Learn & Earn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEARNING_RESOURCES.map((resource, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{resource.title}</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {resource.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                    <div className="text-xs text-gray-500">⏱️ {resource.duration}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Category-specific content */}
        {selectedCategory !== 'overview' && selectedCategory !== 'learn' && (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              {FINANCE_CATEGORIES.find(c => c.id === selectedCategory)?.icon}{' '}
              {FINANCE_CATEGORIES.find(c => c.id === selectedCategory)?.name} Partners
            </h2>
            {filteredOffers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} onClick={() => handleOfferClick(offer)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">More partners coming soon!</p>
              </div>
            )}
          </section>
        )}

        {/* Learn section */}
        {selectedCategory === 'learn' && (
          <section>
            <h2 className="text-2xl font-bold mb-6">📚 Financial Education</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LEARNING_RESOURCES.map((resource, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{resource.title}</h3>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                      {resource.level}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">⏱️ {resource.duration}</span>
                    <button className="text-emerald-600 font-medium hover:text-emerald-700">
                      Start Learning →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Cross-sell Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-xl font-bold mb-6 text-center">Complete Your Financial Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/travel" className="flex items-center gap-4 p-6 bg-white rounded-xl hover:shadow-lg transition-shadow">
              <span className="text-4xl">✈️</span>
              <div>
                <h4 className="font-semibold">Plan Your Next Trip</h4>
                <p className="text-sm text-gray-600">Compare travel deals and earn credits</p>
              </div>
            </a>
            <a href="/insurance" className="flex items-center gap-4 p-6 bg-white rounded-xl hover:shadow-lg transition-shadow">
              <span className="text-4xl">🛡️</span>
              <div>
                <h4 className="font-semibold">Protect What Matters</h4>
                <p className="text-sm text-gray-600">Compare insurance quotes instantly</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-white py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm mb-4">
            We partner with trusted, regulated financial institutions
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap text-gray-400">
            <span>🔒 Bank-level Security</span>
            <span>📋 SEC Registered</span>
            <span>💚 FDIC Insured Partners</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border hover:shadow-md transition-shadow"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

// Offer Card
function OfferCard({ offer, onClick }: { offer: typeof PARTNER_OFFERS[0]; onClick: () => void }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
      {offer.bonus && (
        <div className="bg-emerald-500 text-white text-sm px-4 py-2 text-center font-medium">
          🎁 {offer.bonus}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{offer.logo}</span>
          <div>
            <h3 className="font-semibold text-lg">{offer.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span className="text-yellow-500">★</span>
              <span>{offer.rating}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
        <ul className="text-sm text-gray-600 mb-4 space-y-1">
          {offer.features.slice(0, 3).map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <button
          onClick={onClick}
          className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          {offer.ctaText}
        </button>
      </div>
    </div>
  );
}

// Tool Card
function ToolCard({ tool, onClick }: { tool: typeof FINANCE_TOOLS[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow text-left w-full"
    >
      <span className="text-2xl">{tool.icon}</span>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{tool.name}</h3>
          {tool.credits > 0 ? (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
              {tool.credits} credits
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Free
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
      </div>
    </button>
  );
}
