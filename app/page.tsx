// /app/page.tsx
// CR AudioViz AI - Main Landing Page
// Streamlined - no redundant apps section

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Brain, Shield, Zap, Users, Cpu } from 'lucide-react';

export default function LandingPage() {
  const [comingSoonProjects, setComingSoonProjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch from admin API - empty means section won't show
    setComingSoonProjects([]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      
      {/* Hero Section - Javari Introduction */}
      <section className="hero-section pt-8 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Javari Avatar */}
            <motion.div 
              className="md:col-span-2 flex justify-center"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-2xl opacity-30 scale-110" />
                <Image
                  src="/avatars/javariavatar.png"
                  alt="Javari - Your AI Assistant"
                  width={240}
                  height={240}
                  className="relative rounded-full border-3 border-cyan-400 shadow-xl shadow-cyan-500/30"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Javari AI - Online
                </div>
              </div>
            </motion.div>

            {/* Javari Introduction */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Javari</span>!
              </h1>
              
              <p className="text-lg text-gray-300 mb-4 leading-relaxed">
                Welcome to <strong className="text-white">CR AudioViz AI</strong> — the most comprehensive 
                AI-powered creative platform on the web. We're building the future of business productivity 
                with intelligent tools that actually understand you.
              </p>

              <p className="text-gray-400 mb-6 leading-relaxed">
                I'm not just another chatbot. I'm your <strong className="text-cyan-400">autonomous AI partner</strong> with 
                advanced capabilities that set me apart from anything you've experienced before.
              </p>

              {/* Javari's Advanced Capabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-800/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold text-sm">Autonomous Learning</span>
                  </div>
                  <p className="text-gray-400 text-xs">I learn from every interaction, adapting to your preferences and workflow without being told.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold text-sm">Self-Healing Systems</span>
                  </div>
                  <p className="text-gray-400 text-xs">I detect and fix errors automatically, ensuring your projects stay on track 24/7.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">Synthetic Intelligence</span>
                  </div>
                  <p className="text-gray-400 text-xs">I combine multiple AI models (GPT-4, Claude, Gemini) to give you the best response for each task.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-semibold text-sm">Real-Time Processing</span>
                  </div>
                  <p className="text-gray-400 text-xs">Voice, video, and instant document generation — I work at the speed of thought.</p>
                </div>
              </div>

              {/* What CR AudioViz Offers */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 p-4 rounded-xl border border-gray-700 mb-6">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  What We're Building
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• <strong className="text-white">AI Business Apps</strong> — Logos, documents, invoices, social media, presentations</li>
                  <li>• <strong className="text-white">Intelligent Automation</strong> — Let me handle repetitive tasks while you focus on growth</li>
                  <li>• <strong className="text-white">Memory & Context</strong> — I remember our conversations and your preferences</li>
                  <li>• <strong className="text-white">Enterprise Ready</strong> — White-label solutions for businesses of all sizes</li>
                  <li>• <strong className="text-white">JavariVerse</strong> — Our upcoming virtual world for creators</li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/apps"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                >
                  Explore Our Apps <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/javari"
                  className="px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-all border border-gray-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Chat with Me
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section - Only shows if projects marked in admin */}
      {comingSoonProjects.length > 0 && (
        <section className="py-10 px-4 bg-gray-800/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-full mb-3">
                COMING SOON
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                What We're Working On
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {comingSoonProjects.map((project, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-b from-purple-900/30 to-gray-900/50 p-6 rounded-xl border border-purple-500/30 text-center"
                >
                  <span className="text-3xl mb-3 block">{project.icon || '🚀'}</span>
                  <h3 className="text-white font-semibold mb-2">{project.name}</h3>
                  <p className="text-gray-400 text-sm">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JavariVerse Preview */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30 text-center">
            <span className="inline-block px-4 py-1 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-full mb-4">
              COMING SOON
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">JavariVerse</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              A virtual world where creativity meets AI. Build, explore, and connect with others in our immersive 3D environment.
            </p>
            <Link 
              href="/javari-verse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
