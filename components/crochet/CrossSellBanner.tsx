/**
 * CrossSellBanner - Promotes other CR AudioViz AI apps
 * 
 * Shows relevant tools for crocheters to grow their business
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Palette, Share2, FileText, Receipt, BookOpen, TrendingUp } from 'lucide-react';

const CROSS_SELL_APPS = [
  {
    name: 'Logo Studio',
    description: 'Create a brand for your Etsy shop',
    icon: Palette,
    href: '/apps/logo-studio',
    color: 'from-blue-500 to-cyan-500',
    tag: 'Brand Your Shop',
  },
  {
    name: 'Social Graphics',
    description: 'Market your makes on Instagram',
    icon: Share2,
    href: '/apps/social-graphics',
    color: 'from-cyan-500 to-cyan-500',
    tag: 'Get Noticed',
  },
  {
    name: 'PDF Builder',
    description: 'Professional pattern PDFs',
    icon: FileText,
    href: '/apps/pdf-builder',
    color: 'from-cyan-500 to-cyan-500',
    tag: 'Sell Patterns',
  },
  {
    name: 'Invoice Generator',
    description: 'Bill clients for custom orders',
    icon: Receipt,
    href: '/apps/invoice-generator',
    color: 'from-cyan-500 to-cyan-500',
    tag: 'Get Paid',
  },
  {
    name: 'eBook Creator',
    description: 'Compile pattern collections',
    icon: BookOpen,
    href: '/apps/ebook-creator',
    color: 'from-cyan-500 to-cyan-400',
    tag: 'Passive Income',
  },
  {
    name: 'Market Oracle',
    description: 'Research pricing & trends',
    icon: TrendingUp,
    href: '/apps/market-oracle',
    color: 'from-cyan-500 to-blue-500',
    tag: 'Know Your Market',
  },
];

export default function CrossSellBanner() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-cyan-500 to-cyan-500">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Turn Your Hobby Into a Business
          </h2>
          <p className="text-lg text-cyan-500">
            Use our other tools to sell patterns, market your makes, and grow your crochet business
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CROSS_SELL_APPS.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.name}
                href={app.href}
                className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${app.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{app.name}</h3>
                      <span className="text-xs bg-white/20 text-cyan-500 px-2 py-0.5 rounded-full">
                        {app.tag}
                      </span>
                    </div>
                    <p className="text-sm text-cyan-500">{app.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyan-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* All Apps Link */}
        <div className="text-center mt-8">
          <Link 
            href="/apps"
            className="inline-flex items-center gap-2 text-cyan-500 hover:text-white transition-colors"
          >
            <span>Explore all 60+ AI tools</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
