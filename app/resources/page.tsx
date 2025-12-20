'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, Search, Sparkles, Image, Video, Music, 
  Code, FileText, Gamepad2, Briefcase, GraduationCap, 
  Palette, Globe, Wrench, Star, Filter
} from 'lucide-react';

// ============================================
// CURATED RESOURCES DATABASE
// ============================================

interface Resource {
  name: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

const RESOURCES: Resource[] = [
  // AI TOOLS
  { name: 'Krea.ai', url: 'https://krea.ai', description: 'Real-time AI image generation with 64+ models', category: 'ai', tags: ['image', 'generation', 'free'], featured: true },
  { name: 'Kling AI', url: 'https://klingai.com', description: 'AI video generation up to 2 minutes, 1080p', category: 'ai', tags: ['video', 'generation', 'free'] },
  { name: 'Suno', url: 'https://suno.com', description: 'AI music generation, 50 free credits/day', category: 'ai', tags: ['music', 'generation', 'free'] },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io', description: 'AI voice synthesis and cloning', category: 'ai', tags: ['voice', 'audio', 'synthesis'] },
  { name: 'Runway', url: 'https://runwayml.com', description: 'AI video editing and generation suite', category: 'ai', tags: ['video', 'editing', 'generation'] },
  { name: 'HuggingFace', url: 'https://huggingface.co', description: '200K+ AI models repository', category: 'ai', tags: ['models', 'developer', 'open-source'] },
  { name: 'DeepSeek', url: 'https://deepseek.com', description: 'Open-source AI, 10-30x cheaper than OpenAI', category: 'ai', tags: ['api', 'cheap', 'developer'] },
  { name: 'Bolt.new', url: 'https://bolt.new', description: 'AI full-stack app builder in browser', category: 'ai', tags: ['app-builder', 'developer', 'free'] },
  { name: 'v0.dev', url: 'https://v0.dev', description: 'Vercel AI UI component generator', category: 'ai', tags: ['ui', 'developer', 'react'] },

  // CREATIVE TOOLS
  { name: 'Photopea', url: 'https://photopea.com', description: 'Free Photoshop alternative in browser', category: 'creative', tags: ['photo', 'editor', 'free'], featured: true },
  { name: 'Remove.bg', url: 'https://remove.bg', description: 'AI background removal', category: 'creative', tags: ['background', 'removal', 'free'] },
  { name: 'TinyPNG', url: 'https://tinypng.com', description: 'Image compression', category: 'creative', tags: ['compression', 'optimization', 'free'] },
  { name: 'Jitter', url: 'https://jitter.video', description: 'Motion design tool', category: 'creative', tags: ['motion', 'animation', 'design'] },
  { name: 'Panzoid', url: 'https://panzoid.com', description: 'Intro maker and 3D text generator', category: 'creative', tags: ['intro', '3d', 'free'] },
  { name: 'Slidesgo', url: 'https://slidesgo.com', description: 'Free presentation templates', category: 'creative', tags: ['presentations', 'templates', 'free'] },
  { name: 'Inkarnate', url: 'https://inkarnate.com', description: 'Fantasy map maker', category: 'creative', tags: ['maps', 'fantasy', 'design'] },
  { name: 'PNG Images', url: 'https://pngimg.com', description: 'Free PNG images with transparency', category: 'creative', tags: ['png', 'images', 'free'] },

  // DEVELOPER RESOURCES
  { name: 'ByteByteGo', url: 'https://bytebytego.com', description: 'System design newsletter, 1M+ subscribers', category: 'developer', tags: ['learning', 'system-design', 'newsletter'], featured: true },
  { name: 'Naked Development', url: 'https://naked.dev', description: 'Developer tutorials and content', category: 'developer', tags: ['tutorials', 'coding', 'free'] },
  { name: 'TinyWow', url: 'https://tinywow.com', description: '200+ free online tools', category: 'developer', tags: ['tools', 'utility', 'free'] },
  { name: '123Apps', url: 'https://123apps.com', description: '50+ free web tools', category: 'developer', tags: ['tools', 'utility', 'free'] },
  { name: 'FakeDetail', url: 'https://fakedetail.com', description: 'Test data generation', category: 'developer', tags: ['testing', 'data', 'free'] },

  // NEWSLETTERS
  { name: 'The Hustle', url: 'https://thehustle.co', description: 'Business & tech newsletter', category: 'newsletters', tags: ['business', 'tech', 'news'] },
  { name: 'Alpha Signal', url: 'https://alphasignal.ai', description: 'AI newsletter', category: 'newsletters', tags: ['ai', 'news', 'weekly'] },
  { name: 'Techpresso', url: 'https://techpresso.co', description: 'Tech news digest', category: 'newsletters', tags: ['tech', 'news', 'daily'] },

  // GAMES & ENTERTAINMENT
  { name: 'Emupedia', url: 'https://emupedia.net', description: 'Classic PC games in browser', category: 'games', tags: ['retro', 'browser', 'free'], featured: true },
  { name: 'PlayRetroGames', url: 'https://playretrogames.online', description: 'Console classics online', category: 'games', tags: ['retro', 'console', 'free'] },
  { name: 'Neal.fun', url: 'https://neal.fun', description: '35+ interactive experiences', category: 'games', tags: ['interactive', 'fun', 'educational'] },
  { name: 'Poki', url: 'https://poki.com', description: '5000+ browser games', category: 'games', tags: ['browser', 'casual', 'free'] },
  { name: 'CrazyGames', url: 'https://crazygames.com', description: '5000+ browser games', category: 'games', tags: ['browser', 'casual', 'free'] },
  { name: 'LostGamer.io', url: 'https://lostgamer.io', description: 'Gaming challenges', category: 'games', tags: ['challenge', 'geography', 'fun'] },
  { name: 'Modrinth', url: 'https://modrinth.com', description: 'Minecraft mods', category: 'games', tags: ['minecraft', 'mods', 'free'] },

  // STOCK ASSETS
  { name: 'Unsplash', url: 'https://unsplash.com', description: '3M+ free stock photos', category: 'assets', tags: ['photos', 'free', 'commercial'] },
  { name: 'Pexels', url: 'https://pexels.com', description: 'Free stock photos & videos', category: 'assets', tags: ['photos', 'videos', 'free'] },
  { name: 'Pixabay', url: 'https://pixabay.com', description: '2.5M+ free media', category: 'assets', tags: ['photos', 'videos', 'vectors'] },
  { name: 'Poly Haven', url: 'https://polyhaven.com', description: 'Free 3D assets, HDRIs, textures', category: 'assets', tags: ['3d', 'textures', 'cc0'] },
  { name: 'ambientCG', url: 'https://ambientcg.com', description: '2000+ free PBR textures', category: 'assets', tags: ['textures', 'pbr', 'cc0'] },
  { name: 'Freesound', url: 'https://freesound.org', description: '500K+ free sound effects', category: 'assets', tags: ['sounds', 'sfx', 'cc0'] },
  { name: 'LottieFiles', url: 'https://lottiefiles.com', description: '100K+ free animations', category: 'assets', tags: ['animations', 'lottie', 'free'] },

  // UTILITY
  { name: 'OwnUp', url: 'https://ownup.com', description: 'Mortgage comparison', category: 'utility', tags: ['mortgage', 'finance', 'comparison'] },
  { name: 'SeatGuru', url: 'https://seatguru.com', description: 'Airplane seat maps', category: 'utility', tags: ['travel', 'flights', 'reviews'] },
  { name: 'Wayback Machine', url: 'https://web.archive.org', description: 'Internet archive', category: 'utility', tags: ['archive', 'history', 'research'] },
  { name: '10 Minute Mail', url: 'https://10minutemail.com', description: 'Disposable email', category: 'utility', tags: ['email', 'temporary', 'privacy'] },
  { name: 'Layla AI', url: 'https://layla.ai', description: 'AI travel planning', category: 'utility', tags: ['travel', 'ai', 'planning'] },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Globe },
  { id: 'ai', name: 'AI Tools', icon: Sparkles },
  { id: 'creative', name: 'Creative', icon: Palette },
  { id: 'developer', name: 'Developer', icon: Code },
  { id: 'games', name: 'Games', icon: Gamepad2 },
  { id: 'assets', name: 'Stock Assets', icon: Image },
  { id: 'newsletters', name: 'Newsletters', icon: FileText },
  { id: 'utility', name: 'Utility', icon: Wrench },
];

export default function ResourcesPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredResources = RESOURCES.filter(r => {
    const matchesCategory = category === 'all' || r.category === category;
    const matchesSearch = !search || 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredResources = RESOURCES.filter(r => r.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Resources</h1>
          <p className="text-slate-400">50+ curated tools and resources for creators, developers, and everyone</p>
        </div>
      </div>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Featured
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredResources.map(resource => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{resource.name}</h3>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
              </div>
              <p className="text-sm text-slate-400">{resource.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Search & Filter */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm text-slate-500 mb-4">{filteredResources.length} resources</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold group-hover:text-blue-400 transition-colors">{resource.name}</h3>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm text-slate-400 mb-3">{resource.description}</p>
              <div className="flex flex-wrap gap-1">
                {resource.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-2">Need more than links?</h2>
          <p className="text-slate-400 mb-6">Check out our 60+ professional tools built right into CR AudioViz AI</p>
          <a
            href="/apps"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
          >
            Explore Our Apps
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 CR AudioViz AI, LLC. "Your Story. Our Design."</p>
      </footer>
    </div>
  );
}
