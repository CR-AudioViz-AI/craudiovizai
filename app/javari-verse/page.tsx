/**
 * JavariVerse Page - CR AudioViz AI
 * 
 * Main page for the JavariVerse virtual world experience.
 * Renamed from CRAIverse per UI contract Phase 2.9.
 * 
 * @timestamp January 7, 2026 - 12:15 PM EST
 * @locked PHASE 2.9 UI CONTRACT
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe, Users, Sparkles, Building2, Map, Gamepad2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'JavariVerse - Virtual World | CR AudioViz AI',
  description: 'Explore JavariVerse, an immersive virtual world powered by AI. Create avatars, build communities, and experience the future of digital interaction.',
  alternates: {
    canonical: 'https://craudiovizai.com/javari-verse',
  },
};

const FEATURES = [
  {
    icon: Globe,
    title: 'Virtual Worlds',
    description: 'Explore vast, AI-generated landscapes and environments tailored to your interests.',
  },
  {
    icon: Users,
    title: 'Community Spaces',
    description: 'Connect with like-minded individuals in themed social hubs and gathering places.',
  },
  {
    icon: Sparkles,
    title: 'AI Companions',
    description: 'Interact with intelligent NPCs powered by advanced AI for guidance and entertainment.',
  },
  {
    icon: Building2,
    title: 'Build & Create',
    description: 'Design your own spaces, structures, and experiences within the JavariVerse.',
  },
  {
    icon: Map,
    title: 'Quests & Adventures',
    description: 'Embark on AI-driven storylines and discover hidden treasures throughout the verse.',
  },
  {
    icon: Gamepad2,
    title: 'Games & Activities',
    description: 'Play multiplayer games and participate in events with the JavariVerse community.',
  },
];

export default function JavariVersePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              JavariVerse
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            An immersive virtual world where AI meets community. Create your avatar, 
            explore infinite landscapes, and connect with others in ways never before possible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-cyan-500 transition-all"
            >
              Join the Waitlist
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              A New Kind of Virtual Experience
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              JavariVerse combines cutting-edge AI technology with social interaction 
              to create a living, breathing digital world.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-r from-slate-900/50 to-slate-900/50 border border-cyan-500/20 rounded-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Be Among the First Explorers
            </h2>
            <p className="text-gray-300 mb-6">
              JavariVerse is currently in development. Sign up now to get early access 
              and exclusive benefits when we launch.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Get Early Access
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
