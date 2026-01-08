// /app/page.tsx
// CR AudioViz AI - Main Landing Page
// Expanded What We're Building section, full-width showcase

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Sparkles, Brain, Shield, Zap, Users, Cpu,
  Briefcase, Palette, Plane, Home, ShoppingBag, Gamepad2,
  FileText, Camera, Music, MessageSquare, Vote, Rocket,
  Globe, Server, Code, Lightbulb
} from 'lucide-react';

export default function LandingPage() {
  const [comingSoonProjects, setComingSoonProjects] = useState<any[]>([]);

  useEffect(() => {
    setComingSoonProjects([]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      
      {/* Hero Section - Javari Introduction */}
      <section className="hero-section pt-8 pb-10 px-4">
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

              <p className="text-gray-400 mb-5 leading-relaxed">
                I'm not just another chatbot. I'm your <strong className="text-cyan-400">autonomous AI partner</strong> with 
                advanced capabilities that set me apart from anything you've experienced before.
              </p>

              {/* Javari's Advanced Capabilities */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-800/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold text-sm">Autonomous Learning</span>
                  </div>
                  <p className="text-gray-400 text-xs">I learn from every interaction, adapting to your preferences without being told.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold text-sm">Self-Healing Systems</span>
                  </div>
                  <p className="text-gray-400 text-xs">I detect and fix errors automatically, keeping your projects on track 24/7.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold text-sm">Synthetic Intelligence</span>
                  </div>
                  <p className="text-gray-400 text-xs">I combine GPT-4, Claude, and Gemini to give you the best response for each task.</p>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold text-sm">Real-Time Processing</span>
                  </div>
                  <p className="text-gray-400 text-xs">Voice, video, and instant generation — I work at the speed of thought.</p>
                </div>
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

      {/* ========== WHAT WE'RE BUILDING - FULL WIDTH ========== */}
      <section className="py-12 px-4 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              What We're <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-500">Building</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              A comprehensive suite of AI-powered applications for every aspect of your personal and professional life
            </p>
          </div>

          {/* App Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            
            {/* Business Apps */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Integrated Business Apps</h3>
                  <span className="text-cyan-400 text-xs">Available Now</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Invoice & Quote Generator</li>
                <li>• Proposal Builder</li>
                <li>• Contract Creator</li>
                <li>• Business Plan Writer</li>
                <li>• Financial Reports</li>
                <li>• Employee Handbook Generator</li>
              </ul>
            </motion.div>

            {/* Creative Tools */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Creative & Design Tools</h3>
                  <span className="text-cyan-400 text-xs">Available Now</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Logo Creator</li>
                <li>• Social Media Designer</li>
                <li>• Presentation Builder</li>
                <li>• Flyer & Poster Maker</li>
                <li>• Business Card Designer</li>
                <li>• Brand Kit Generator</li>
              </ul>
            </motion.div>

            {/* Collectors & Hobby */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Collectors & Hobby Apps</h3>
                  <span className="text-cyan-400 text-xs">Coming Soon</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Collection Inventory Manager</li>
                <li>• Price Guide & Valuation</li>
                <li>• Trading Card Organizer</li>
                <li>• Comic Book Catalog</li>
                <li>• Vinyl Record Tracker</li>
                <li>• Memorabilia Database</li>
              </ul>
            </motion.div>

            {/* Travel Apps */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Travel Related Apps</h3>
                  <span className="text-cyan-400 text-xs">Coming Soon</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Trip Planner & Itinerary Builder</li>
                <li>• Packing List Generator</li>
                <li>• Travel Budget Calculator</li>
                <li>• Flight & Hotel Comparison</li>
                <li>• Travel Journal Creator</li>
                <li>• Local Guide Generator</li>
              </ul>
            </motion.div>

            {/* Real Estate Apps */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Real Estate Apps</h3>
                  <span className="text-cyan-400 text-xs">Coming Soon</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Property Listing Generator</li>
                <li>• Virtual Tour Creator</li>
                <li>• Mortgage Calculator</li>
                <li>• Rental Agreement Builder</li>
                <li>• Property Comparison Tool</li>
                <li>• Investment Analysis</li>
              </ul>
            </motion.div>

            {/* Content Creation */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Content Creation</h3>
                  <span className="text-cyan-400 text-xs">Available Now</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Blog Post Writer</li>
                <li>• Email Template Creator</li>
                <li>• Newsletter Builder</li>
                <li>• Resume & CV Generator</li>
                <li>• Script Writer</li>
                <li>• Course Content Creator</li>
              </ul>
            </motion.div>

            {/* Media & Entertainment */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-red-500/30 hover:border-red-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Media & Entertainment</h3>
                  <span className="text-cyan-400 text-xs">Coming Soon</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Video Script Generator</li>
                <li>• Podcast Outline Creator</li>
                <li>• YouTube Description Writer</li>
                <li>• Thumbnail Designer</li>
                <li>• Storyboard Creator</li>
                <li>• Audio Visualizer</li>
              </ul>
            </motion.div>

            {/* Games & Fun */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-indigo-500/30 hover:border-indigo-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Games & Entertainment</h3>
                  <span className="text-cyan-400 text-xs">Available Now</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Trivia Games</li>
                <li>• Word Puzzles</li>
                <li>• Memory Games</li>
                <li>• Strategy Games</li>
                <li>• Multiplayer Challenges</li>
                <li>• Daily Brain Teasers</li>
              </ul>
            </motion.div>

            {/* Developer Tools */}
            <motion.div 
              className="bg-gray-800/70 p-6 rounded-2xl border border-teal-500/30 hover:border-teal-500/60 transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                  <Code className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Developer Tools</h3>
                  <span className="text-cyan-400 text-xs">Available Now</span>
                </div>
              </div>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Code Generator</li>
                <li>• API Documentation Writer</li>
                <li>• Database Schema Designer</li>
                <li>• README Creator</li>
                <li>• Bug Report Generator</li>
                <li>• Code Review Assistant</li>
              </ul>
            </motion.div>
          </div>

          {/* Enhancement Request & Build Your Own */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Enhancement Request */}
            <motion.div 
              className="bg-gradient-to-r from-slate-800/30 to-slate-800/30 p-6 rounded-2xl border border-cyan-500/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Need Something We Don't Have?</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Submit an enhancement request and our community will vote on it! The most requested features 
                    get prioritized for development. Your voice shapes what we build next.
                  </p>
                  <Link 
                    href="/feature-request"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all text-sm font-medium"
                  >
                    <Vote className="w-4 h-4" />
                    Submit Enhancement Request
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Build Your Own */}
            <motion.div 
              className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-6 rounded-2xl border border-cyan-500/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Build Your Own App</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Want to create your own custom app, website, or tool? Sign up, select your plan, and work 
                    directly with Javari to design and build it. We'll even host it for you!
                  </p>
                  <Link 
                    href="/signup"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all text-sm font-medium"
                  >
                    <Code className="w-4 h-4" />
                    Start Building Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hosting Callout */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700">
              <Server className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-300">
                <strong className="text-white">Full Hosting Available</strong> — Deploy your apps, websites, and tools directly on our platform
              </span>
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section - Only shows if projects marked in admin */}
      {comingSoonProjects.length > 0 && (
        <section className="py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full mb-3">
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
                  className="bg-gradient-to-b from-slate-900/30 to-gray-900/50 p-6 rounded-xl border border-cyan-500/30 text-center"
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
          <div className="bg-gradient-to-r from-slate-900/50 to-blue-900/50 rounded-2xl p-8 border border-cyan-500/30 text-center">
            <span className="inline-block px-4 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full mb-4">
              COMING SOON
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-400">JavariVerse</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              A virtual world where creativity meets AI. Build, explore, and connect with others in our immersive 3D environment.
            </p>
            <Link 
              href="/javari-verse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
