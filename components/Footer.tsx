// /components/Footer.tsx
// Global Footer - CR AudioViz AI
// Full footer with links, socials, and newsletter

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  const footerLinks = {
    product: [
      { href: '/hub', label: 'All Tools' },
      { href: '/chat', label: 'Javari AI' },
      { href: '/games', label: 'Games Hub' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/pricing', label: 'Pricing' }
    ],
    company: [
      { href: '/about', label: 'About Us' },
      { href: '/careers', label: 'Careers' },
      { href: '/blog', label: 'Blog' },
      { href: '/press', label: 'Press' },
      { href: '/partners', label: 'Partners' }
    ],
    resources: [
      { href: '/docs/api', label: 'API Docs' },
      { href: '/support', label: 'Help Center' },
      { href: '/guides', label: 'Guides' },
      { href: '/status', label: 'System Status' },
      { href: '/changelog', label: 'Changelog' }
    ],
    legal: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/licenses', label: 'Licenses' },
      { href: '/security', label: 'Security' }
    ]
  };

  const socialLinks = [
    { href: 'https://twitter.com/CRAudioVizAI', icon: '𝕏', label: 'Twitter' },
    { href: 'https://facebook.com/CRAudioVizAI', icon: '📘', label: 'Facebook' },
    { href: 'https://instagram.com/CRAudioVizAI', icon: '📸', label: 'Instagram' },
    { href: 'https://linkedin.com/company/craudiovizai', icon: '💼', label: 'LinkedIn' },
    { href: 'https://youtube.com/@CRAudioVizAI', icon: '📺', label: 'YouTube' },
    { href: 'https://tiktok.com/@CRAudioVizAI', icon: '🎵', label: 'TikTok' },
    { href: 'https://discord.gg/javari', icon: '💬', label: 'Discord' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-6 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <div className="relative">
                  <div className="flex gap-1 mb-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div className="w-3 h-1 bg-white rounded-full mx-auto" />
                </div>
              </div>
              <span className="font-bold text-white">CR AudioViz AI</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Your Story. Our Design. AI-powered creative tools for everyone.
            </p>

            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="mb-6">
                <p className="text-sm font-medium text-white mb-2">Newsletter</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Subscribe
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-cyan-500 mb-6">✓ Subscribed!</p>
            )}

            <div className="flex gap-3">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                   className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-lg transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2025 CR AudioViz AI, LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/socials" className="hover:text-white">Follow Us</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <span>Fort Myers, Florida 🌴</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
