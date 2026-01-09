/**
 * CR AudioViz AI - Core Pricing Page (v6.2)
 * Main pricing hub - links to all vertical pricing pages
 * 
 * @version 6.2
 * @timestamp January 8, 2026
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  CORE_PLANS,
  CREDIT_PACKS,
  AUTO_RELOAD_TIERS,
  TRIAL_CONFIGS,
  FAQ_ITEMS,
  CREDIT_PRICE_DISPLAY,
} from '@/lib/pricing/v62';
import {
  PlanCard,
  CreditPackCard,
  TrialBanner,
  VerticalNav,
  ExploreOtherOfferings,
  FAQAccordion,
  PolicyNotices,
  CreditExplanation,
} from '@/components/pricing/PricingComponents';
import { Zap, Package, RefreshCw } from 'lucide-react';

export default function PricingPage() {
  const trialConfig = TRIAL_CONFIGS.core;

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that works for you. All plans include access to our full suite of AI-powered apps.
          </p>
        </div>

        {/* Vertical Navigation */}
        <VerticalNav current="core" />

        {/* Trial Banner */}
        <TrialBanner
          vertical="CR AudioViz AI"
          credits={trialConfig.credits}
          days={30}
        />

        {/* Credit Explanation */}
        <CreditExplanation />

        {/* Core Plans */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">Monthly Plans</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {CORE_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.priceMonthly}
                credits={plan.credits}
                badge={plan.badge}
                features={plan.features}
                cta={plan.cta}
                ctaHref="/signup"
                highlighted={plan.badge === 'Most Popular'}
              />
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            Credits roll forward while subscription is active. Cancel anytime.
          </div>
        </section>

        {/* Credit Packs */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">Credit Packs</h2>
          </div>
          
          <p className="text-slate-600 mb-4">
            Need more credits? Top up anytime with a one-time purchase.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <CreditPackCard
                key={pack.credits}
                credits={pack.credits}
                price={pack.price}
                badge={pack.badge}
              />
            ))}
          </div>
          
          <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-700 mb-2">Pack Rules</h4>
            <ul className="text-sm text-cyan-600 space-y-1">
              <li>• Pack credits stay usable while subscription is active</li>
              <li>• Packs do NOT extend subscription term</li>
              <li>• Pack credits remain usable during 10-day grace period</li>
              <li>• If not renewed after grace, remaining credits are forfeited</li>
            </ul>
          </div>
        </section>

        {/* Auto-Reload */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">Auto-Reload</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-slate-600 mb-4">
              Never run out of credits. Set a threshold and we'll automatically add credits when your balance is low.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {AUTO_RELOAD_TIERS.map((tier) => (
                <div
                  key={tier.credits}
                  className="p-4 rounded-lg border border-slate-200 text-center"
                >
                  <div className="text-xl font-bold text-slate-900">+{tier.credits}</div>
                  <div className="text-sm text-slate-500">credits</div>
                  <div className="text-lg font-semibold text-cyan-600 mt-2">
                    ${tier.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-slate-500 space-y-1">
              <p>• You set the threshold (minimum 10 credits) and select your reload tier</p>
              <p>• Triggers once per threshold event (never repeatedly)</p>
              <p>• Auto-reload paused during grace period</p>
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
              <li>• Continue using remaining credits (plan + packs)</li>
              <li>• Cannot purchase additional credits</li>
              <li>• Auto-reload is paused</li>
              <li>• Renew to keep your credits; otherwise they're forfeited after grace ends</li>
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
        <ExploreOtherOfferings exclude="core" />

        {/* Policy Notices */}
        <PolicyNotices />

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/apps" className="text-cyan-600 hover:text-cyan-700 font-medium">
            Explore our apps →
          </Link>
        </div>
      </div>
    </div>
  );
}
