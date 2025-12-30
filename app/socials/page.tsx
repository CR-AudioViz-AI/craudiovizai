'use client';

// /app/socials/page.tsx
// Social Media Links - CR AudioViz AI
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

const SOCIAL_LINKS = [
  { name: 'Twitter/X', icon: '𝕏', url: 'https://twitter.com/CRAudioVizAI', color: 'bg-black' },
  { name: 'Facebook', icon: '📘', url: 'https://facebook.com/CRAudioVizAI', color: 'bg-blue-600' },
  { name: 'Instagram', icon: '📸', url: 'https://instagram.com/CRAudioVizAI', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/company/craudiovizai', color: 'bg-blue-700' },
  { name: 'YouTube', icon: '▶️', url: 'https://youtube.com/@CRAudioVizAI', color: 'bg-red-600' },
  { name: 'TikTok', icon: '🎵', url: 'https://tiktok.com/@CRAudioVizAI', color: 'bg-black' },
  { name: 'Discord', icon: '💬', url: 'https://discord.gg/javari', color: 'bg-indigo-500' },
  { name: 'Threads', icon: '🧵', url: 'https://threads.net/@CRAudioVizAI', color: 'bg-black' },
  { name: 'Pinterest', icon: '📌', url: 'https://pinterest.com/CRAudioVizAI', color: 'bg-red-500' },
  { name: 'Reddit', icon: '🤖', url: 'https://reddit.com/r/CRAudioVizAI', color: 'bg-orange-500' },
  { name: 'Twitch', icon: '🎮', url: 'https://twitch.tv/CRAudioVizAI', color: 'bg-purple-600' },
  { name: 'Telegram', icon: '✈️', url: 'https://t.me/CRAudioVizAI', color: 'bg-blue-500' },
];

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            CR AudioViz AI
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/tools" className="text-gray-600 hover:text-purple-600">Tools</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-purple-600">Pricing</Link>
            <Link href="/login" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Sign In</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🌐 Connect With Us</h1>
          <p className="text-xl text-purple-100 mb-8">Follow us on social media for updates, tips, and community</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {SOCIAL_LINKS.map(social => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} text-white rounded-xl p-6 text-center hover:scale-105 transition-transform`}
              >
                <div className="text-4xl mb-2">{social.icon}</div>
                <h3 className="font-semibold">{social.name}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Everyone connects. Everyone wins.</p>
        </div>
      </footer>
    </div>
  );
}
