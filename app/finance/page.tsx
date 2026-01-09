'use client';

// /app/finance/page.tsx
export const dynamic = 'force-dynamic';




import React from 'react';
import Link from 'next/link';

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-500 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">
            CR AudioViz AI
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/tools" className="text-gray-600 hover:text-cyan-500">Tools</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-cyan-500">Pricing</Link>
            <Link href="/login" className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500">Sign In</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">💰 Finance Hub</h1>
          <p className="text-xl text-cyan-500 mb-8">AI-powered financial tools and market insights</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/tools/market-oracle" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Market Oracle</h3>
              <p className="text-gray-600">AI-powered stock and crypto analysis with predictions</p>
            </Link>
            <Link href="/tools/invoice" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🧾</div>
              <h3 className="text-xl font-bold mb-2">Invoice Generator</h3>
              <p className="text-gray-600">Professional invoices in seconds</p>
            </Link>
            <Link href="/tools/budget" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💵</div>
              <h3 className="text-xl font-bold mb-2">Budget Planner</h3>
              <p className="text-gray-600">AI-assisted budget planning and tracking</p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
