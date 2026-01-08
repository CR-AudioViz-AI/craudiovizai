/**
 * CR AudioViz AI - Collectors Pricing Page (v6.2)
 * Javari Collectors umbrella + individual collector apps
 * 
 * @version 6.2
 * @timestamp January 8, 2026
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  TRIAL_CONFIGS,
  FREE_TIER_CONFIGS,
  COLLECTORS_UMBRELLA_NAME,
  COLLECTORS_DOWNGRADE_POLICY,
  FAQ_ITEMS,
} from '@/lib/pricing/v62';
import {
  PlanCard,
  TrialBanner,
  VerticalNav,
  ExploreOtherOfferings,
  FAQAccordion,
  PolicyNotices,
  CreditExplanation,
} from '@/components/pricing/PricingComponents';
import { Package, Zap, Eye, AlertTriangle } from 'lucide-react';

// Collector Plans
const COLLECTOR_PLANS = [
  {
    id: 'collector-starter',
    name: 'Collector Starter',
    priceMonthly: 9,
    credits: 100,
    items: 100,
    features: [
      '100 credits/month',
      '100 items capacity',
      'All collector apps access',
      'AI cataloging',
      'Basic export',
    ],
    cta: 'Start Collecting',
  },
  {
    id: 'collector-plus',
    name: 'Collector Plus',
    priceMonthly: 29,
    credits: 500,
    items: 500,
    badge: 'Most Popular',
    features: [
      '500 credits/month',
      '500 items capacity',
      'All collector apps access',
      'AI cataloging + valuations',
      'Full export options',
      'Priority processing',
    ],
    cta: 'Go Plus',
  },
  {
    id: 'collector-vault',
    name: 'Collector Vault',
    priceMonthly: 79,
    credits: 2000,
    items: 5000,
    features: [
      '2,000 credits/month',
      '5,000 items capacity',
      'All collector apps access',
      'AI cataloging + valuations',
      'Full export + API access',
      'Priority processing',
      'Insurance reports',
    ],
    cta: 'Upgrade to Vault',
  },
];

// Collector Apps (reference - these should match what's in the registry)
const COLLECTOR_APPS = [
  { name: 'Card Collector', description: 'Sports & trading cards' },
  { name: 'Coin Collection', description: 'Numismatic collections' },
  { name: 'Stamp Album', description: 'Philatelic collections' },
  { name: 'Comic Vault', description: 'Comics & graphic novels' },
  { name: 'Vinyl Records', description: 'Music collections' },
  { name: 'Art Gallery', description: 'Fine art & prints' },
];

export default function CollectorsPricingPage() {
  const trialConfig = TRIAL_CONFIGS.collectors;
  const freeTierConfig = FREE_TIER_CONFIGS.collectors;

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
            <Package className="w-4 h-4" />
            {COLLECTORS_UMBRELLA_NAME}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Organize Your Collections with AI
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Catalog, value, and manage any collection. From cards to coins, stamps to vinyl.
          </p>
        </div>

        {/* Vertical Navigation */}
        <VerticalNav current="collectors" />

        {/* Trial Banner */}
        <TrialBanner
          vertical={COLLECTORS_UMBRELLA_NAME}
          credits={trialConfig.credits}
          capacity={trialConfig.capacity}
          days={30}
        />

        {/* Free Tier Info */}
        {freeTierConfig.hasFreeTier && (
          <div className="mb-8 bg-slate-100 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Eye className="w-6 h-6 text-slate-500 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Free Tier Available</h3>
                <p className="text-slate-600 text-sm">
                  After your trial, you can continue with a free tier: {freeTierConfig.capacity?.amount} items, 
                  view-only access. Upgrade anytime to unlock full features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collector Apps */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Included Collector Apps</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COLLECTOR_APPS.map((app) => (
              <div
                key={app.name}
                className="bg-white rounded-lg border border-slate-200 p-4"
              >
                <div className="font-medium text-slate-900">{app.name}</div>
                <div className="text-xs text-slate-500">{app.description}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            All plans include access to every collector app. Use your credits across any of them.
          </p>
        </section>

        {/* Credit Explanation */}
        <CreditExplanation />

        {/* Plans */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">Collector Plans</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {COLLECTOR_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.priceMonthly}
                credits={plan.credits}
                capacity={{ type: 'items', amount: plan.items }}
                badge={plan.badge}
                features={plan.features}
                cta={plan.cta}
                ctaHref="/signup?vertical=collectors"
                highlighted={plan.badge === 'Most Popular'}
              />
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            Credits roll forward while subscription is active. Cancel anytime.
          </div>
        </section>

        {/* Downgrade Policy */}
        <section className="mb-12">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">Downgrade Policy</h3>
                <p className="text-amber-700 text-sm">
                  {COLLECTORS_DOWNGRADE_POLICY}
                </p>
                <p className="text-amber-600 text-xs mt-2">
                  Example: If you have 300 items and downgrade to Starter (100 items), you'll only see your first 100 items until you upgrade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Grace Period Info */}
        <section className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-3">10-Day Grace Period</h3>
            <p className="text-blue-800 mb-3">
              After your paid term expires, you get a 10-day grace period:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Continue using remaining credits</li>
              <li>• Full access to all your items</li>
              <li>• Cannot purchase additional credits</li>
              <li>• After grace: drops to free tier (10 items, view-only) unless renewed</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </section>

        {/* Explore Other Offerings */}
        <ExploreOtherOfferings exclude="collectors" />

        {/* Policy Notices */}
        <PolicyNotices />

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-cyan-600 hover:text-cyan-700 font-medium">
            ← Back to all pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
