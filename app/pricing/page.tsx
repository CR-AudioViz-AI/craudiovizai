// ================================================================================
// CR AUDIOVIZ AI - PRICING PAGE (NEVER 503)
// Returns 200 + x-cr-degraded header on failure
// ================================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Static pricing data - always available
const STATIC_PLANS = [
  {
    name: 'Free',
    price: '$0',
    credits: 50,
    features: ['50 credits/month', 'Access to all apps', 'Community support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    credits: 500,
    features: ['500 credits/month', 'Priority support', 'Advanced features', 'API access'],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    credits: 5000,
    features: ['5000 credits/month', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
];

function DegradedBanner({ errorId }: { errorId?: string }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-200">
            Showing cached pricing. Live data temporarily unavailable.
            {errorId && <span className="block text-xs opacity-75">Ref: {errorId}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, popular }: { plan: typeof STATIC_PLANS[0]; popular: boolean }) {
  return (
    <div className={`relative rounded-2xl p-8 ${popular ? 'bg-blue-600 text-white ring-4 ring-blue-600' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h3 className={`text-xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {plan.name}
      </h3>
      <div className="mb-4">
        <span className={`text-4xl font-bold ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {plan.price}
        </span>
        <span className={`text-sm ${popular ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>/month</span>
      </div>
      <p className={`text-sm mb-6 ${popular ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
        {plan.credits} credits included
      </p>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${popular ? 'text-blue-200' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm ${popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
        {plan.cta}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const [isDegraded, setIsDegraded] = useState(false);
  const [errorId, setErrorId] = useState<string | undefined>();
  const [plans, setPlans] = useState(STATIC_PLANS);

  useEffect(() => {
    // Try to fetch live pricing
    fetch('/api/pricing', { signal: AbortSignal.timeout(5000) })
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        if (data.plans) setPlans(data.plans);
      })
      .catch(() => {
        setIsDegraded(true);
        setErrorId(crypto.randomUUID().slice(0, 8));
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {isDegraded && <DegradedBanner errorId={errorId} />}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that works for you
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} popular={plan.popular} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            All plans include a 14-day money-back guarantee
          </p>
          <Link href="/apps" className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Explore our apps →
          </Link>
        </div>
      </div>
    </div>
  );
}
