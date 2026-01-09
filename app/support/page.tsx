// /app/support/page.tsx
// Help Center / Support - CR AudioViz AI
// Submit tickets, browse KB, get help

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  views: number;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastUpdate: string;
}

// =============================================================================
// DATA
// =============================================================================

const KB_CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: '🚀', count: 12 },
  { id: 'javari-ai', name: 'Javari AI Guide', icon: '🤖', count: 18 },
  { id: 'billing', name: 'Account & Billing', icon: '💳', count: 15 },
  { id: 'api', name: 'API Documentation', icon: '🔧', count: 24 },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔍', count: 20 },
  { id: 'marketplace', name: 'Creator Marketplace', icon: '🏪', count: 10 }
];

const POPULAR_ARTICLES: Article[] = [
  { id: '1', title: 'How to get started with Javari AI', excerpt: 'Learn the basics of using our AI assistant...', category: 'getting-started', views: 12500 },
  { id: '2', title: 'Understanding credits and pricing', excerpt: 'Everything you need to know about our credit system...', category: 'billing', views: 8900 },
  { id: '3', title: 'Creating your first logo with AI', excerpt: 'Step-by-step guide to generating professional logos...', category: 'javari-ai', views: 7600 },
  { id: '4', title: 'API authentication guide', excerpt: 'How to authenticate and make your first API call...', category: 'api', views: 5400 },
  { id: '5', title: 'Selling on the Creator Marketplace', excerpt: 'Complete guide to listing and selling your products...', category: 'marketplace', views: 4200 },
  { id: '6', title: 'Troubleshooting payment issues', excerpt: 'Common payment problems and how to fix them...', category: 'troubleshooting', views: 3800 }
];

const FAQS = [
  { q: 'How do credits work?', a: 'Credits are used for AI features. Each action costs 1-5 credits depending on complexity. Credits never expire on paid plans.' },
  { q: 'Can I get a refund?', a: 'Yes! We offer full refunds within 7 days, no questions asked. Contact support or cancel from your settings.' },
  { q: 'What AI models does Javari use?', a: 'Javari uses a combination of Claude, GPT-4, and other models optimized for different tasks.' },
  { q: 'How do I cancel my subscription?', a: 'Go to Settings → Billing → Cancel Subscription. You\'ll keep access until your billing period ends.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use enterprise-grade encryption, never sell your data, and comply with GDPR/CCPA.' },
  { q: 'Can I use Javari for commercial projects?', a: 'Yes! All content you create with Javari is yours to use commercially.' }
];

const MY_TICKETS: Ticket[] = [
  { id: 'TKT-00123', subject: 'Payment not processing', status: 'pending', priority: 'high', createdAt: '2025-12-28', lastUpdate: '2 hours ago' },
  { id: 'TKT-00089', subject: 'Feature request: Dark mode', status: 'resolved', priority: 'low', createdAt: '2025-12-20', lastUpdate: '5 days ago' }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <div className="relative max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for help articles..."
        className="w-full px-6 py-4 pl-14 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

function CategoryCard({ category }: { category: typeof KB_CATEGORIES[0] }) {
  return (
    <Link
      href={`/support/category/${category.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="text-4xl mb-3">{category.icon}</div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{category.name}</h3>
      <p className="text-sm text-gray-500">{category.count} articles</p>
    </Link>
  );
}

function ArticleRow({ article }: { article: Article }) {
  return (
    <Link
      href={`/support/article/${article.id}`}
      className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
    >
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{article.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{article.excerpt}</p>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span>{article.category}</span>
        <span>👁 {article.views.toLocaleString()} views</span>
      </div>
    </Link>
  );
}

function FAQItem({ faq, isOpen, toggle }: { faq: typeof FAQS[0]; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={toggle}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{faq.q}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pb-4 text-gray-600 dark:text-gray-400"
        >
          {faq.a}
        </motion.div>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const statusColors = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pending: 'bg-cyan-100 text-cyan-700 dark:bg-slate-900/30 dark:text-cyan-400',
    resolved: 'bg-cyan-100 text-cyan-700 dark:bg-slate-900/30 dark:text-cyan-400'
  };

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-cyan-600',
    high: 'text-red-600'
  };

  return (
    <Link
      href={`/support/ticket/${ticket.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-gray-500">{ticket.id}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
            {ticket.status}
          </span>
          <span className={`text-xs ${priorityColors[ticket.priority]}`}>
            {ticket.priority === 'high' ? '🔴' : ticket.priority === 'medium' ? '🟡' : '🟢'} {ticket.priority}
          </span>
        </div>
        <p className="font-medium text-gray-900 dark:text-white mt-1">{ticket.subject}</p>
      </div>
      <div className="text-right text-sm text-gray-500">
        <p>Created {ticket.createdAt}</p>
        <p>Updated {ticket.lastUpdate}</p>
      </div>
    </Link>
  );
}

function NewTicketForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    alert('Ticket submitted! We\'ll respond within 24 hours.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit a Ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Select...</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High - Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!subject || !category || !message || submitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'tickets'>('help');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-blue-100 mb-8">Search our knowledge base or contact support</p>
          <SearchBar />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('help')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'help'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📚 Help Center
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎫 My Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {activeTab === 'help' ? (
          <>
            {/* Categories Grid */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                {KB_CATEGORIES.map(cat => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>

            {/* Popular Articles */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Popular Articles</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg divide-y divide-gray-100 dark:divide-gray-700">
                {POPULAR_ARTICLES.map(article => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                {FAQS.map((faq, idx) => (
                  <FAQItem
                    key={idx}
                    faq={faq}
                    isOpen={openFaq === idx}
                    toggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                  />
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <section className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                <p className="text-blue-100 mb-6">Our support team typically responds within 24 hours</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowTicketForm(true)}
                    className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50"
                  >
                    Submit a Ticket
                  </button>
                  <Link
                    href="/chat?prompt=I need help with..."
                    className="px-8 py-3 border-2 border-white rounded-xl font-medium hover:bg-white/10"
                  >
                    Chat with Javari
                  </Link>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* My Tickets Tab */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Tickets</h2>
              <button
                onClick={() => setShowTicketForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + New Ticket
              </button>
            </div>

            {MY_TICKETS.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg divide-y divide-gray-100 dark:divide-gray-700">
                {MY_TICKETS.map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <span className="text-6xl mb-4 block">🎫</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't submitted any support tickets
                </p>
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Your First Ticket
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/socials" className="hover:text-white">Follow Us</Link>
          </div>
        </div>
      </footer>

      {/* Ticket Form Modal */}
      {showTicketForm && <NewTicketForm onClose={() => setShowTicketForm(false)} />}
    </div>
  );
}
