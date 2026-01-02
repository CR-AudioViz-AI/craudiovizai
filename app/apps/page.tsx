'use client'

import { useState } from 'react'
import Link from 'next/link'

interface App {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  url: string
  domain?: string
  color: string
  gradient: string
  category: string
  features: string[]
  creditCost?: string
  status: 'live' | 'coming-soon' | 'beta'
}

const PLATFORM_APPS: App[] = [
  {
    id: 'javari',
    name: 'Javari AI',
    tagline: 'Your AI Creative Assistant',
    description: 'Autonomous AI assistant for coding, writing, design, and more. 60+ professional tools.',
    icon: '🤖',
    url: '/apps/javari',
    domain: 'javariai.com',
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-500',
    category: 'productivity',
    features: ['Code Generation', 'Document Creation', 'Image Analysis', 'Multi-AI'],
    creditCost: '1-10 credits',
    status: 'beta',
  },
  {
    id: 'barrelverse',
    name: 'CRAVBarrels',
    tagline: 'Premium Spirit Discovery',
    description: 'Explore 22,000+ spirits with AI sommelier, barcode scanning, and collection tracking.',
    icon: '🥃',
    url: '/apps/barrelverse',
    domain: 'cravbarrels.com',
    color: 'amber',
    gradient: 'from-amber-600 to-orange-500',
    category: 'lifestyle',
    features: ['22,000+ Spirits', 'AI Sommelier', 'Barcode Scanner', 'Store Finder'],
    creditCost: '2 credits/scan',
    status: 'live',
  },
  {
    id: 'cardverse',
    name: 'CravCards',
    tagline: 'Premium Trading Card Collection',
    description: 'Track sports cards, Pokémon, Magic: The Gathering, and any collectible cards in one beautiful app.',
    icon: '🎴',
    url: '/apps/cardverse',
    domain: 'cravcards.com',
    color: 'purple',
    gradient: 'from-purple-600 to-pink-500',
    category: 'lifestyle',
    features: ['Any Card Type', 'Value Tracking', 'Marketplace', 'Collector Clubs'],
    creditCost: 'Free / Premium',
    status: 'live',
  },
  {
    id: 'games',
    name: 'CRAV Games',
    tagline: '1,200+ Free Games',
    description: 'Massive library of browser games. Casual, puzzle, action, strategy.',
    icon: '🎮',
    url: '/apps/games',
    domain: 'games.craudiovizai.com',
    color: 'green',
    gradient: 'from-green-600 to-emerald-500',
    category: 'games',
    features: ['1,200+ Games', 'No Downloads', 'Leaderboards', 'Achievements'],
    creditCost: 'Free / Premium',
    status: 'live',
  },
  {
    id: 'javari-books',
    name: 'Javari Books',
    tagline: 'AI eBook & Audiobook Platform',
    description: 'Generate professional eBooks with AI, convert to audiobooks, transcribe audio to text. 301+ books available.',
    icon: '📚',
    url: '/apps/javari-library',
    domain: 'books.craudiovizai.com',
    color: 'emerald',
    gradient: 'from-emerald-600 to-green-500',
    category: 'creative',
    features: ['301+ eBooks', 'AI Generation', 'Text-to-Audio', 'Audio-to-Text'],
    creditCost: '40-100 credits',
    status: 'live',
  },
  {
    id: 'craiverse',
    name: 'CRAIverse',
    tagline: 'Virtual World',
    description: 'Immersive virtual world with avatar creation and social spaces.',
    icon: '🌍',
    url: '/apps/craiverse',
    color: 'cyan',
    gradient: 'from-cyan-600 to-teal-500',
    category: 'social',
    features: ['Avatar Creator', 'Virtual Spaces', 'Events', 'Real Estate'],
    status: 'coming-soon',
  },
  {
    id: 'first-responders',
    name: 'First Responders',
    tagline: 'Tools for Heroes',
    description: 'Resources for firefighters, EMTs, police, and emergency personnel.',
    icon: '🚒',
    url: '/apps/first-responders',
    color: 'red',
    gradient: 'from-red-600 to-rose-500',
    category: 'social-impact',
    features: ['Resources', 'Community', 'Mental Health', 'Training'],
    creditCost: 'Free',
    status: 'coming-soon',
  },
  {
    id: 'veterans',
    name: 'Veterans Connect',
    tagline: 'Serving Those Who Served',
    description: 'Resources and community for military veterans and families.',
    icon: '🎖️',
    url: '/apps/veterans',
    color: 'slate',
    gradient: 'from-slate-600 to-gray-500',
    category: 'social-impact',
    features: ['Benefits', 'Jobs', 'Support', 'Events'],
    creditCost: 'Free',
    status: 'coming-soon',
  },
  {
    id: 'animal-rescue',
    name: 'Animal Rescue',
    tagline: 'Save Lives Together',
    description: 'Connect shelters, rescues, fosters, and adopters.',
    icon: '🐾',
    url: '/apps/animal-rescue',
    color: 'orange',
    gradient: 'from-orange-600 to-yellow-500',
    category: 'social-impact',
    features: ['Pet Listings', 'Foster Network', 'Donations', 'Transport'],
    creditCost: 'Free',
    status: 'coming-soon',
  },
]

const CATEGORIES = [
  { id: 'all', name: 'All Apps', icon: '📱' },
  { id: 'productivity', name: 'Productivity', icon: '💼' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' },
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'social-impact', name: 'Social Impact', icon: '❤️' },
]

export default function AppsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredApps = PLATFORM_APPS.filter(
    app => selectedCategory === 'all' || app.category === selectedCategory
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 to-stone-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🎨 Our Apps</h1>
          <p className="text-xl text-stone-400">60+ tools, 1,200+ games - one account</p>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-2 flex-wrap mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className={`relative rounded-2xl overflow-hidden bg-stone-900/80 border border-stone-700 hover:border-stone-600 transition-all hover:scale-[1.02] ${
                app.status === 'coming-soon' ? 'opacity-70' : ''
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${app.gradient}`} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{app.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{app.name}</h3>
                    <p className="text-xs text-stone-400">{app.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-300 mb-4 line-clamp-2">{app.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {app.features.slice(0, 2).map(f => (
                    <span key={f} className="px-2 py-0.5 bg-stone-800 text-xs text-stone-400 rounded">
                      {f}
                    </span>
                  ))}
                </div>
                {app.domain && app.status !== 'coming-soon' ? (
                  <div className="flex gap-2">
                    <Link
                      href={app.url}
                      className={`flex-1 py-2 bg-gradient-to-r ${app.gradient} text-white text-sm font-medium rounded-lg text-center`}
                    >
                      Open
                    </Link>
                    <a
                      href={`https://${app.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
                    >
                      ↗
                    </a>
                  </div>
                ) : (
                  <button
                    disabled={app.status === 'coming-soon'}
                    className="w-full py-2 bg-stone-800 text-stone-400 text-sm rounded-lg"
                  >
                    {app.status === 'coming-soon' ? 'Coming Soon' : 'Open'}
                  </button>
                )}
              </div>
              {app.status === 'beta' && (
                <div className="absolute top-4 right-4 px-2 py-0.5 bg-blue-600 text-xs text-white rounded-full">
                  BETA
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Credits CTA */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl border border-amber-900/30">
          <h2 className="text-2xl font-bold text-white mb-2">💎 Universal Credits</h2>
          <p className="text-stone-300 mb-6">One credit system across all apps. Start with 1,000 free!</p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}

