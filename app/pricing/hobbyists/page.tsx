/**
 * CR AudioViz AI - Hobbyists Pricing Page (v6.2)
 * Hobby tiers with credits + project capacity
 * 
 * @version 6.2
 * @timestamp January 8, 2026
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  HOBBY_PLANS,
  TRIAL_CONFIGS,
  FREE_TIER_CONFIGS,
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
import { Palette, Zap, Eye, AlertTriangle, HelpCircle } from 'lucide-react';

// Hobby Apps (examples - should match registry)
const HOBBY_APPS = [
  { name: 'CrochetAI', description: 'AI-powered crochet patterns' },
  { name: 'KnitMaster', description: 'Knitting pattern generator' },
  { name: 'Quilt Designer', description: 'Quilting layouts & patterns' },
  { name: 'Woodcraft Plans', description: 'Woodworking projects' },
  { name: 'Recipe Creator', description: 'AI recipe generation' },
  { name: 'Garden Planner', description: 'Garden layout & plant care' },
];

export default function HobbyistsPricingPage() {
  const trialConfig = TRIAL_CONFIGS.hobbyists;
  const freeTierConfig = FREE_TIER_CONFIGS.hobbyists;

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
            <Palette className="w-4 h-4" />
            Hobby Plans
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Bring Your Creative Projects to Life
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            AI-powered tools for crafters, makers, and hobbyists. Generate patterns, plans, and ideas.
          </p>
        </div>

        {/* Vertical Navigation */}
        <VerticalNav current="hobbyists" />

        {/* Trial Banner */}
        <TrialBanner
          vertical="Hobby Apps"
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
                  After your trial, you can continue with a free tier: {freeTierConfig.capacity?.amount} project, 
                  view-only access. Upgrade anytime to unlock full features and more projects.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What's a Project? */}
        <section className="mb-8">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-cyan-900 mb-2">What counts as a "project"?</h3>
                <p className="text-cyan-800 text-sm mb-2">
                  A project is a saved creative work you're building with AI assistance:
                </p>
                <ul className="text-sm text-cyan-700 space-y-1">
                  <li>• A crochet pattern you're designing</li>
                  <li>• A recipe collection you're curating</li>
                  <li>• A woodworking plan you're developing</li>
                  <li>• A garden layout you're planning</li>
                </ul>
                <p className="text-cyan-600 text-xs mt-2">
                  Credits are used for AI operations within projects (generating, editing, refining).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hobby Apps */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Included Hobby Apps</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {HOBBY_APPS.map((app) => (
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
            All plans include access to every hobby app. Use your credits and projects across any of them.
          </p>
        </section>

        {/* Credit Explanation */}
        <CreditExplanation />

        {/* Plans */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-900">Hobby Plans</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOBBY_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.priceMonthly}
                credits={plan.credits}
                capacity={{ type: 'projects', amount: plan.projects }}
                badge={plan.badge}
                features={plan.features}
                cta={plan.cta}
                ctaHref="/signup?vertical=hobbyists"
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
                  If you downgrade: data retained, but projects above tier limit are hidden until upgrade.
                </p>
                <p className="text-amber-600 text-xs mt-2">
                  Example: If you have 50 projects and downgrade to Starter (20 projects), you'll only see your most recent 20 projects until you upgrade.
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
              <li>• Full access to all your projects</li>
              <li>• Cannot purchase additional credits</li>
              <li>• After grace: drops to free tier (1 project, view-only) unless renewed</li>
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
        <ExploreOtherOfferings exclude="hobbyists" />

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
