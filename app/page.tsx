// /app/page.tsx
// CR AudioViz AI - Main Landing Page
// Features real Javari and CRAI avatars with proper intros

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// =============================================================================
// HERO SECTION WITH JAVARI & CRAI
// =============================================================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/craudiovizailogo.png" 
              alt="CR AudioViz AI" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-white">CR AudioViz AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/apps" className="text-gray-300 hover:text-white">Apps</Link>
            <Link href="/games" className="text-gray-300 hover:text-white">Games</Link>
            <Link href="/craiverse" className="text-gray-300 hover:text-white">CRAIverse</Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-300 hover:text-white">Log In</Link>
            <Link href="/signup" className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - CRAI Introduction */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* CRAI Avatar */}
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-3xl opacity-30 scale-110" />
                <Image
                  src="/avatars/craiavatar.png"
                  alt="CRAI - Your AI Guide"
                  width={300}
                  height={300}
                  className="relative rounded-full border-4 border-red-500 shadow-2xl shadow-red-500/30"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                  CRAI
                </div>
              </div>
            </motion.div>

            {/* CRAI Introduction */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">CR AudioViz AI</span>
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                Hi, I'm <strong className="text-red-400">CRAI</strong> - your guide to the CR AudioViz AI ecosystem. 
                We've built the most comprehensive AI-powered creative platform on the web.
              </p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>50+ AI-Powered Apps</strong> - Logos, documents, social media, invoices & more</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>1000+ Games</strong> - Take a break and have fun</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>CRAIverse</strong> - Our 2D social world coming soon</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>Enterprise Solutions</strong> - White-label apps for your business</span>
                </li>
              </ul>
              <Link 
                href="/apps"
                className="inline-block px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg font-medium rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Explore Our Apps →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="border-t border-gray-700" />
      </div>

      {/* Javari Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Javari Introduction */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Javari</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                I'm <strong className="text-cyan-400">Javari</strong> - your personal AI assistant who actually remembers you. 
                I'm here to help you create, build, learn, and accomplish amazing things.
              </p>
              <div className="space-y-4 mb-8">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-cyan-400 font-bold mb-2">💬 Natural Conversations</h3>
                  <p className="text-gray-400">Chat with me like a friend. I remember our past conversations and learn your preferences.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-cyan-400 font-bold mb-2">🎨 Creative Partner</h3>
                  <p className="text-gray-400">Need a logo? Document? Social post? I'll help you create professional content in minutes.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-cyan-400 font-bold mb-2">🤖 Multiple AI Models</h3>
                  <p className="text-gray-400">I automatically select the best AI (GPT-4, Claude, Gemini) for each task, or you can choose manually.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-cyan-400 font-bold mb-2">🎥 Voice & Video</h3>
                  <p className="text-gray-400">Talk to me with voice commands or join a video call. I'm here 24/7.</p>
                </div>
              </div>
              <Link 
                href="/javari"
                className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30"
              >
                Chat with Javari →
              </Link>
            </motion.div>

            {/* Javari Avatar */}
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-30 scale-110" />
                <Image
                  src="/avatars/javariavatar.png"
                  alt="Javari - Your AI Assistant"
                  width={300}
                  height={300}
                  className="relative rounded-full border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  Javari AI - Online
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI-Powered Apps & Tools
            </h2>
            <p className="text-xl text-gray-400">Create professional results in minutes, not hours</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Logo Creator', icon: '🎨', color: 'from-pink-500 to-rose-500' },
              { name: 'Document Writer', icon: '📄', color: 'from-blue-500 to-cyan-500' },
              { name: 'Social Designer', icon: '📱', color: 'from-purple-500 to-violet-500' },
              { name: 'Invoice Generator', icon: '💰', color: 'from-green-500 to-emerald-500' },
              { name: 'Presentation Builder', icon: '📊', color: 'from-orange-500 to-amber-500' },
              { name: 'Code Assistant', icon: '💻', color: 'from-gray-500 to-gray-700' },
              { name: 'Research Helper', icon: '🔍', color: 'from-indigo-500 to-blue-500' },
              { name: 'Games Hub', icon: '🎮', color: 'from-red-500 to-pink-500' },
            ].map((tool, idx) => (
              <motion.div
                key={tool.name}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`bg-gradient-to-br ${tool.color} p-4 rounded-xl text-white text-center cursor-pointer shadow-lg`}
              >
                <span className="text-3xl block mb-2">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.name}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/apps" className="text-cyan-400 font-medium hover:underline">
              See All 50+ Apps →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-xl text-gray-400">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 50 credits/month</li>
                <li>✓ Javari AI chat</li>
                <li>✓ Basic tools</li>
              </ul>
              <Link href="/signup" className="block w-full py-2 text-center border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl p-6 text-white relative shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$29<span className="text-lg font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-cyan-100 mb-6">
                <li>✓ 2,000 credits/month</li>
                <li>✓ All creative tools</li>
                <li>✓ Priority AI models</li>
                <li>✓ Credits never expire</li>
              </ul>
              <Link href="/signup?plan=pro" className="block w-full py-2 text-center bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Business */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">Business</h3>
              <div className="text-4xl font-bold text-white mb-4">$99<span className="text-lg font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 10,000 credits/month</li>
                <li>✓ Unlimited team members</li>
                <li>✓ White-label options</li>
              </ul>
              <Link href="/contact?plan=business" className="block w-full py-2 text-center border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            50 free credits. No credit card required. Start creating today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/signup"
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-xl"
            >
              Get Started Free →
            </Link>
            <Link 
              href="/javari"
              className="px-10 py-4 border-2 border-cyan-500 text-cyan-400 text-lg font-medium rounded-xl hover:bg-cyan-500/10 transition-all"
            >
              Chat with Javari
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/craudiovizailogo.png" alt="CR AudioViz AI" width={32} height={32} className="rounded" />
                <span className="text-lg font-bold text-white">CR AudioViz AI</span>
              </div>
              <p className="text-sm">AI-powered creative tools for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/apps" className="hover:text-white">Apps</Link></li>
                <li><Link href="/games" className="hover:text-white">Games</Link></li>
                <li><Link href="/javari" className="hover:text-white">Javari AI</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/team" className="hover:text-white">Team</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
