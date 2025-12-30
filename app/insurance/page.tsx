// /app/insurance/page.tsx
// Insurance Hub - CR AudioViz AI Revenue Trinity
// Squaremouth + Multi-provider comparison
'use client';

import React, { useState, useEffect } from 'react';
import { ConversionFunnel, FUNNEL_CONFIGS } from '@/components/ConversionFunnel';
import { useAnalytics } from '@/hooks/useAnalytics';

// Insurance types
const INSURANCE_TYPES = [
  { id: 'travel', name: 'Travel Insurance', icon: '✈️' },
  { id: 'auto', name: 'Auto Insurance', icon: '🚗' },
  { id: 'home', name: 'Home Insurance', icon: '🏠' },
  { id: 'life', name: 'Life Insurance', icon: '❤️' },
  { id: 'health', name: 'Health Insurance', icon: '🏥' },
  { id: 'pet', name: 'Pet Insurance', icon: '🐕' }
];

// Mock quotes (would come from API)
const MOCK_QUOTES = [
  {
    id: 'sq-1',
    title: 'Squaremouth Travel Protection',
    description: 'Comprehensive travel insurance with trip cancellation, medical coverage, and 24/7 assistance.',
    price: 89,
    priceLabel: '/trip',
    rating: 4.8,
    reviewCount: 12500,
    features: [
      'Trip cancellation up to $10,000',
      'Medical coverage up to $100,000',
      'Baggage protection up to $2,500',
      '24/7 emergency assistance',
      'Cancel for any reason option'
    ],
    ctaText: 'Get Quote',
    ctaUrl: 'https://www.squaremouth.com/?ref=craudiovizai',
    affiliateId: 'squaremouth',
    badge: 'Most Popular'
  },
  {
    id: 'sq-2',
    title: 'Allianz Travel Insurance',
    description: 'Trusted worldwide coverage with flexible plans for any trip.',
    price: 75,
    priceLabel: '/trip',
    rating: 4.6,
    reviewCount: 8900,
    features: [
      'Trip cancellation coverage',
      'Emergency medical & dental',
      'Travel delay benefits',
      'Lost baggage reimbursement'
    ],
    ctaText: 'Get Quote',
    ctaUrl: 'https://www.squaremouth.com/travel-insurance-providers/allianz?ref=craudiovizai',
    affiliateId: 'allianz'
  },
  {
    id: 'sq-3',
    title: 'World Nomads Adventure',
    description: 'Perfect for adventurous travelers with extreme sports coverage.',
    price: 120,
    priceLabel: '/trip',
    rating: 4.5,
    reviewCount: 6200,
    features: [
      'Adventure sports coverage',
      'Equipment protection',
      'Emergency evacuation',
      'Trip interruption benefits'
    ],
    ctaText: 'Get Quote',
    ctaUrl: 'https://www.squaremouth.com/travel-insurance-providers/world-nomads?ref=craudiovizai',
    affiliateId: 'worldnomads'
  },
  {
    id: 'sq-4',
    title: 'Generali Global Assistance',
    description: 'Budget-friendly coverage without compromising protection.',
    price: 55,
    priceLabel: '/trip',
    rating: 4.4,
    reviewCount: 4100,
    features: [
      'Basic trip cancellation',
      'Medical expense coverage',
      'Baggage delay coverage',
      'Affordable rates'
    ],
    ctaText: 'Get Quote',
    ctaUrl: 'https://www.squaremouth.com/travel-insurance-providers/generali?ref=craudiovizai',
    affiliateId: 'generali',
    badge: 'Best Value'
  }
];

export default function InsurancePage() {
  const [selectedType, setSelectedType] = useState('travel');
  const [quotes, setQuotes] = useState(MOCK_QUOTES);
  const [isLoading, setIsLoading] = useState(false);
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('insurance', { type: selectedType });
  }, [selectedType, trackPageView]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    // In production, this would call the insurance API
    // For now, filter mock data
    setTimeout(() => {
      setQuotes(MOCK_QUOTES);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Insurance Comparison Hub</h1>
          <p className="text-xl text-blue-100">
            Compare quotes from top providers and find the perfect coverage for you.
          </p>
        </div>
      </div>

      {/* Insurance Type Selector */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {INSURANCE_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedType === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-4">
        {selectedType === 'travel' ? (
          <ConversionFunnel
            config={FUNNEL_CONFIGS.insurance}
            items={quotes}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">
              {INSURANCE_TYPES.find(t => t.id === selectedType)?.icon}
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {INSURANCE_TYPES.find(t => t.id === selectedType)?.name}
            </h2>
            <p className="text-gray-600 mb-8">
              We're expanding our insurance comparison tools. Enter your email to be notified when {INSURANCE_TYPES.find(t => t.id === selectedType)?.name.toLowerCase()} comparison goes live.
            </p>
            <form className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 border rounded-lg"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Notify Me
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="bg-white py-8 border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm">Trusted by thousands of travelers</p>
          </div>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">50,000+</div>
              <div className="text-sm text-gray-500">Policies Compared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$2.5M+</div>
              <div className="text-sm text-gray-500">Saved by Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.8/5</div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-500">Support Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FAQItem
              question="How does the insurance comparison work?"
              answer="We aggregate quotes from multiple top-rated insurance providers, allowing you to compare coverage, prices, and reviews side-by-side. When you find a plan you like, you're connected directly to the provider to complete your purchase."
            />
            <FAQItem
              question="Is it free to compare quotes?"
              answer="Yes! Comparing quotes is completely free. We earn a small commission from insurance providers when you purchase a policy, but this doesn't affect your price."
            />
            <FAQItem
              question="How do I earn credits?"
              answer="When you purchase a policy through our platform, you earn credits that can be used across CR AudioViz AI tools and services. Travel insurance purchases earn 25 credits per policy."
            />
            <FAQItem
              question="Can I trust these providers?"
              answer="All providers in our comparison are licensed, regulated, and have been vetted for quality. We display real customer reviews and ratings to help you make informed decisions."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex justify-between items-center"
      >
        <span className="font-medium">{question}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}
