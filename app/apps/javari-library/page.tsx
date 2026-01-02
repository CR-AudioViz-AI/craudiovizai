// Javari Library - eBook & Audiobook Marketplace
// Timestamp: January 1, 2026 - 1:40 PM EST
// CR AudioViz AI - Full-Featured Content Marketplace

'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, Headphones, Search, Filter, Star, ShoppingCart, 
  Heart, Download, Play, Eye, Lock, Unlock, Gift, Share2,
  ChevronRight, ChevronDown, Grid, List, Sparkles, Crown,
  Clock, FileText, Volume2, CheckCircle, X, ArrowRight
} from 'lucide-react'

// Types
interface Book {
  id: string
  title: string
  subtitle: string
  author: string
  category: string
  subcategory: string
  description: string
  price: number
  salePrice?: number
  rating: number
  reviewCount: number
  pageCount: number
  audioLength?: string
  hasAudio: boolean
  hasEbook: boolean
  coverImage: string
  excerpt: string
  tableOfContents: string[]
  tags: string[]
  isFree: boolean
  isFeatured: boolean
  isNew: boolean
  publishDate: string
  downloads: number
}

interface Category {
  id: string
  name: string
  icon: string
  count: number
  subcategories: string[]
}

// Sample categories
const CATEGORIES: Category[] = [
  { id: 'ai-creative', name: 'AI & Creative', icon: '🎨', count: 50, 
    subcategories: ['Image Generation', 'Video Creation', 'Audio Production', 'Writing', 'Design'] },
  { id: 'business', name: 'Business & Marketing', icon: '💼', count: 75,
    subcategories: ['Digital Marketing', 'E-Commerce', 'Entrepreneurship', 'Freelancing', 'Sales'] },
  { id: 'legal', name: 'Legal & Compliance', icon: '⚖️', count: 40,
    subcategories: ['Business Legal', 'Intellectual Property', 'Contracts', 'App Legal', 'Content Rights'] },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', count: 60,
    subcategories: ['Residential', 'Commercial', 'Industrial', 'Investing', 'Contracts'] },
  { id: 'technical', name: 'Development & Tech', icon: '💻', count: 50,
    subcategories: ['App Development', 'Web Development', 'APIs', 'No-Code', 'Automation'] },
  { id: 'social-impact', name: 'Social Impact', icon: '❤️', count: 40,
    subcategories: ['First Responders', 'Veterans', 'Faith-Based', 'Animal Rescue', 'Community'] },
  { id: 'platform', name: 'Platform Guides', icon: '📚', count: 30,
    subcategories: ['Getting Started', 'Tools', 'Advanced', 'API', 'Enterprise'] },
]

// Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    features: ['Browse all titles', 'Read free excerpts', 'Purchase individual books', '50 platform credits/month'],
    limitations: ['No library access', 'No audiobook streaming'],
    cta: 'Current Plan'
  },
  {
    id: 'creator',
    name: 'Creator Annual',
    price: 199,
    period: 'year',
    features: ['FULL library access (300+ titles)', 'All new releases included', 'Audiobook streaming', '1,000 platform credits/month', 'Priority support', '50% off conversions'],
    limitations: [],
    cta: 'Subscribe Now',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Annual',
    price: 499,
    period: 'year',
    features: ['Everything in Creator', 'Source files (DOCX, project files)', 'Commercial license included', '5,000 platform credits/month', 'API access', 'White-label rights'],
    limitations: [],
    cta: 'Go Pro'
  }
]

export default function JavariLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [cart, setCart] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [userSubscription, setUserSubscription] = useState<string>('free')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Sample featured books
  const featuredBooks: Book[] = [
    {
      id: '1',
      title: 'AI Image Generation Mastery',
      subtitle: 'The Complete Guide to Creating Professional AI Art',
      author: 'CR AudioViz AI',
      category: 'AI & Creative',
      subcategory: 'Image Generation',
      description: 'Master the art of AI image generation with this comprehensive 50+ page guide. Learn prompt engineering, styles, commercial use, and advanced techniques.',
      price: 24.99,
      rating: 4.9,
      reviewCount: 127,
      pageCount: 58,
      audioLength: '3h 45m',
      hasAudio: true,
      hasEbook: true,
      coverImage: '/api/placeholder/300/400',
      excerpt: 'Chapter 1: Understanding AI Image Generation...',
      tableOfContents: ['Introduction', 'How AI Works', 'Prompt Engineering', 'Styles Guide', 'Commercial Use', 'Advanced Techniques'],
      tags: ['AI', 'Images', 'Prompts', 'Creative'],
      isFree: false,
      isFeatured: true,
      isNew: false,
      publishDate: '2026-01-01',
      downloads: 1247
    },
    {
      id: '2',
      title: 'Prompt Engineering Mastery',
      subtitle: 'The Art & Science of AI Communication',
      author: 'CR AudioViz AI',
      category: 'AI & Creative',
      subcategory: 'Writing',
      description: 'Learn the CRISP framework and advanced techniques for communicating effectively with AI systems.',
      price: 19.99,
      rating: 4.8,
      reviewCount: 89,
      pageCount: 45,
      audioLength: '2h 30m',
      hasAudio: true,
      hasEbook: true,
      coverImage: '/api/placeholder/300/400',
      excerpt: 'The Foundation of AI Communication...',
      tableOfContents: ['AI Language', 'CRISP Framework', 'Advanced Techniques', 'Use Cases', 'Common Mistakes'],
      tags: ['AI', 'Prompts', 'Writing', 'Communication'],
      isFree: false,
      isFeatured: true,
      isNew: true,
      publishDate: '2026-01-01',
      downloads: 892
    },
    {
      id: '3',
      title: 'AI Marketing Mastery',
      subtitle: 'Transform Your Marketing with AI',
      author: 'CR AudioViz AI',
      category: 'Business & Marketing',
      subcategory: 'Digital Marketing',
      description: 'Complete guide to AI-powered marketing: content, email, advertising, and analytics.',
      price: 24.99,
      rating: 4.7,
      reviewCount: 156,
      pageCount: 62,
      audioLength: '4h 15m',
      hasAudio: true,
      hasEbook: true,
      coverImage: '/api/placeholder/300/400',
      excerpt: 'The AI Marketing Revolution...',
      tableOfContents: ['AI Marketing Overview', 'Content Marketing', 'Email Marketing', 'Advertising', 'Analytics'],
      tags: ['Marketing', 'AI', 'Business', 'Advertising'],
      isFree: false,
      isFeatured: true,
      isNew: false,
      publishDate: '2026-01-01',
      downloads: 1089
    }
  ]

  const addToCart = (bookId: string) => {
    setCart(prev => [...prev, bookId])
  }

  const toggleWishlist = (bookId: string) => {
    setWishlist(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    )
  }

  const canAccessBook = (book: Book) => {
    if (book.isFree) return true
    if (userSubscription === 'creator' || userSubscription === 'pro') return true
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-500/20 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Javari Library</h1>
                <p className="text-xs text-purple-300">300+ eBooks & Audiobooks</p>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books, topics, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-white">
                <Heart className="w-6 h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs flex items-center justify-center text-white">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button className="relative p-2 text-gray-400 hover:text-white">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                    {cart.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowSubscriptionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90"
              >
                <Crown className="w-4 h-4" />
                {userSubscription === 'free' ? 'Subscribe' : 'Pro'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 mb-8 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Complete Learning Library</h2>
              <p className="text-purple-200 mb-4">300+ professional guides on AI, Business, Legal, Real Estate & more</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Annual subscription = Unlimited access</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-5 h-5" />
                  <span>Content protected</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-300 mb-1">Starting at</p>
              <p className="text-4xl font-bold text-white">$199<span className="text-lg text-purple-300">/year</span></p>
              <p className="text-sm text-purple-300">Full library access</p>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={\`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition \${
              !selectedCategory 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }\`}
          >
            <Sparkles className="w-4 h-4" />
            All Books
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={\`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition \${
                selectedCategory === cat.id 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }\`}
            >
              <span>{cat.icon}</span>
              {cat.name}
              <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Featured Books */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Featured Books
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={\`p-2 rounded-lg \${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}\`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={\`p-2 rounded-lg \${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}\`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={\`grid gap-6 \${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}\`}>
            {featuredBooks.map(book => (
              <div 
                key={book.id}
                className="bg-gray-800/50 rounded-2xl border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition group"
              >
                <div className="relative">
                  {/* Book Cover Placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/50" />
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {book.isNew && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">NEW</span>
                    )}
                    {book.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded-full">⭐ Featured</span>
                    )}
                  </div>
                  
                  {/* Format badges */}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {book.hasEbook && (
                      <span className="p-1.5 bg-black/50 rounded-lg" title="eBook Available">
                        <FileText className="w-4 h-4 text-white" />
                      </span>
                    )}
                    {book.hasAudio && (
                      <span className="p-1.5 bg-black/50 rounded-lg" title="Audiobook Available">
                        <Headphones className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button 
                      onClick={() => { setSelectedBook(book); setShowPreview(true); }}
                      className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
                    >
                      <Eye className="w-6 h-6 text-white" />
                    </button>
                    <button 
                      onClick={() => toggleWishlist(book.id)}
                      className={\`p-3 rounded-xl transition \${
                        wishlist.includes(book.id) ? 'bg-pink-500' : 'bg-white/20 hover:bg-white/30'
                      }\`}
                    >
                      <Heart className={\`w-6 h-6 \${wishlist.includes(book.id) ? 'text-white fill-white' : 'text-white'}\`} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs text-purple-400 mb-1">{book.category}</p>
                  <h4 className="text-lg font-semibold text-white mb-1 line-clamp-1">{book.title}</h4>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{book.subtitle}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {book.rating}
                    </span>
                    <span>{book.pageCount} pages</span>
                    {book.audioLength && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {book.audioLength}
                      </span>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      {canAccessBook(book) ? (
                        <span className="text-green-400 font-medium flex items-center gap-1">
                          <Unlock className="w-4 h-4" />
                          Included
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">${book.price}</span>
                          {book.salePrice && (
                            <span className="text-sm text-gray-500 line-through">${book.salePrice}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {canAccessBook(book) ? (
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-xl text-white font-medium hover:bg-green-700 transition">
                        <Download className="w-4 h-4" />
                        Access
                      </button>
                    ) : (
                      <button 
                        onClick={() => addToCart(book.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl text-white font-medium hover:bg-purple-700 transition"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription CTA */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlock the Entire Library</h3>
                <p className="text-purple-100 mb-4">Get instant access to 300+ eBooks and audiobooks with an annual subscription</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    All current and future releases
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    Audiobook streaming included
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    1,000+ platform credits monthly
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-white mb-2">$199</p>
                <p className="text-purple-200 mb-4">per year</p>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition"
                >
                  Subscribe Now
                </button>
                <p className="text-xs text-purple-200 mt-2">Cancel anytime. Access until term ends.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section>
          <h3 className="text-2xl font-bold text-white mb-6">Browse by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition text-left group"
              >
                <span className="text-4xl mb-3 block">{cat.icon}</span>
                <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition">{cat.name}</h4>
                <p className="text-sm text-gray-400">{cat.count} titles</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Choose Your Plan</h3>
              <button onClick={() => setShowSubscriptionModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-400 font-medium">⚠️ Annual Subscriptions Only</p>
                <p className="text-yellow-300/80 text-sm">Subscriptions are billed annually to protect our content library. You can cancel anytime, but access continues until your term ends.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map(plan => (
                  <div 
                    key={plan.id}
                    className={\`rounded-xl p-6 border-2 transition \${
                      plan.popular 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-gray-700 bg-gray-800/50'
                    }\`}
                  >
                    {plan.popular && (
                      <span className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full mb-4">
                        MOST POPULAR
                      </span>
                    )}
                    <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">${plan.price}</span>
                          <span className="text-gray-400">/{plan.period}</span>
                        </>
                      )}
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">{limit}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      className={\`w-full py-3 rounded-xl font-semibold transition \${
                        plan.id === 'free'
                          ? 'bg-gray-700 text-gray-400 cursor-default'
                          : plan.popular
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                      }\`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Preview Modal */}
      {showPreview && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{selectedBook.title}</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-purple-400 mb-2">{selectedBook.category} → {selectedBook.subcategory}</p>
              <p className="text-gray-300 mb-4">{selectedBook.description}</p>
              
              <h4 className="text-lg font-semibold text-white mb-2">Table of Contents</h4>
              <ul className="space-y-2 mb-6">
                {selectedBook.tableOfContents.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                    Chapter {i + 1}: {item}
                  </li>
                ))}
              </ul>

              <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Free Excerpt
                </h4>
                <p className="text-gray-300 italic">{selectedBook.excerpt}</p>
                <p className="text-gray-500 text-sm mt-2">... Continue reading with purchase or subscription</p>
              </div>

              <div className="flex gap-4">
                {canAccessBook(selectedBook) ? (
                  <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download Now
                  </button>
                ) : (
                  <>
                    <button className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
                      Buy for ${selectedBook.price}
                    </button>
                    <button 
                      onClick={() => { setShowPreview(false); setShowSubscriptionModal(true); }}
                      className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition"
                    >
                      Subscribe & Access All
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              © 2026 CR AudioViz AI, LLC. All rights reserved.
            </p>
            <p className="text-purple-400 text-sm italic">
              Your Story. Our Design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
