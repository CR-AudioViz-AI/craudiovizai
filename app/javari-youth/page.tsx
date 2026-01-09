'use client'
// Javari Youth - CR AudioViz AI Module | Generated: 2026-01-02T02:09:53.995Z
import Link from 'next/link'

export default function JavariYouthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <header className="border-b border-white/10 p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">👶</span>
          <span className="text-xl font-bold">Javari Youth</span>
        </Link>
      </header>
      <main className="max-w-4xl mx-auto p-8 text-center">
        <span className="text-6xl mb-6 block">👶</span>
        <h1 className="text-4xl font-bold mb-4">Javari Youth</h1>
        <p className="text-xl text-gray-300 mb-8">Youth development programs</p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup" className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-slate-700">Get Started</Link>
          <Link href="/demo" className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10">Demo</Link>
        </div>
      </main>
      <footer className="border-t border-white/10 p-4 text-center text-gray-500 mt-auto">
        © 2026 CR AudioViz AI, LLC
      </footer>
    </div>
  )
}
