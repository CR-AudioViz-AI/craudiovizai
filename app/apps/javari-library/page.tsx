// Javari Library - eBook & Audiobook Marketplace
// Timestamp: January 2, 2026 - 4:27 PM EST
// CR AudioViz AI - REAL DATA from Supabase

'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, Headphones, Search, Filter, Star, ShoppingCart, 
  Heart, Download, Play, Eye, Lock, Unlock, Gift, Share2,
  ChevronRight, ChevronDown, Grid, List, Sparkles, Crown,
  Clock, FileText, Volume2, CheckCircle, X, ArrowRight, Loader2
} from 'lucide-react'
import { CentralAuth, CentralCredits, CentralPayments } from '@/lib/central-services'

// Supabase client for fetching assets
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const EBOOKS_CATEGORY_ID = 'be83797e-c86b-4bd9-819e-1c6b94241dcf'

interface Book {
  id: string
  name: string
  slug: string
  description: string
  price_cents: number
  is_free: boolean
  is_public: boolean
  storage_path: string
  tags: string[]
  download_count: number
  view_count: number
  created_at: string
  ai_description?: string
}

interface Category {
  name: string
  count: number
}

// Subscription plans matching your Stripe products
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    features: ['Access 112 free eBooks', 'Browse full catalog', 'Purchase individual books'],
    limitations: ['No premium library access', 'No audiobook streaming'],
    cta: 'Current Plan'
  },
  {
    id: 'creator',
    name: 'Creator Annual',
    price: 199,
    period: '/year',
    priceId: 'price_1SlDWw7YeQ1dZTUvEhTwoU8x',
    features: ['Full library access (301+ books)', '1,000 credits/month', 'Audiobook streaming', '50% off conversions', 'New releases included'],
    limitations: [],
    cta: 'Subscribe',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro Annual',
    price: 499,
    period: '/year',
    priceId: 'price_1SlDWw7YeQ1dZTUvKaryyAlk',
    features: ['Everything in Creator', '5,000 credits/month', 'Source file access', 'Commercial license', 'API access', 'White-label rights'],
    limitations: [],
    cta: 'Subscribe',
    popular: true
  }
]

export default function JavariLibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<any>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [total, setTotal] = useState(0)

  // Fetch user session
  useEffect(() => {
    async function loadUser() {
      const session = await CentralAuth.getSession()
      if (session.success && session.data) {
        setUser(session.data)
        const credits = await CentralCredits.getBalance()
        if (credits.success && credits.data) {
          setUserCredits(credits.data.balance)
        }
      }
    }
    loadUser()
  }, [])

  // Fetch books from Supabase
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true)
      try {
        let url = `${SUPABASE_URL}/rest/v1/assets?category_id=eq.${EBOOKS_CATEGORY_ID}&is_public=eq.true&select=*&order=created_at.desc`
        
        if (showFreeOnly) {
          url += '&is_free=eq.true'
        }
        
        if (selectedCategory) {
          url += `&tags=cs.{${selectedCategory.toLowerCase()}}`
        }
        
        if (searchQuery) {
          url += `&or=(name.ilike.*${searchQuery}*,description.ilike.*${searchQuery}*)`
        }

        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setBooks(data)
          setTotal(data.length)
          
          // Extract categories from tags
          const tagCounts: Record<string, number> = {}
          data.forEach((book: Book) => {
            book.tags?.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1
            })
          })
          
          const cats = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([name, count]) => ({ name, count }))
          
          setCategories(cats)
        }
      } catch (error) {
        console.error('Failed to fetch books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [searchQuery, selectedCategory, showFreeOnly])

  const handlePurchase = async (book: Book) => {
    if (!user) {
      window.location.href = '/login?redirect=/apps/javari-library'
      return
    }

    if (book.is_free) {
      // Direct download for free books
      window.open(`${SUPABASE_URL}/storage/v1/object/public/assets/${book.storage_path}`, '_blank')
      return
    }

    // Create checkout session via central services
    const checkout = await CentralPayments.createCheckout({
      items: [{ 
        name: book.name, 
        price: book.price_cents,
        quantity: 1,
        metadata: { book_id: book.id, type: 'ebook' }
      }],
      successUrl: `${window.location.origin}/apps/javari-library/success?book=${book.id}`,
      cancelUrl: window.location.href
    })

    if (checkout.success && checkout.data?.url) {
      window.location.href = checkout.data.url
    }
  }

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!plan.priceId) return
    
    if (!user) {
      window.location.href = '/login?redirect=/apps/javari-library'
      return
    }

    const checkout = await CentralPayments.createSubscription({
      priceId: plan.priceId,
      successUrl: `${window.location.origin}/apps/javari-library/welcome`,
      cancelUrl: window.location.href
    })

    if (checkout.success && checkout.data?.url) {
      window.location.href = checkout.data.url
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4" />
              {total.toLocaleString()}+ Professional eBooks
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Javari Library
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professional eBooks and audiobooks for creators, entrepreneurs, and professionals.
              112 free titles, premium content from $24.99.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books by title, topic, or keyword..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-background text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <strong>{total}</strong> eBooks
              </span>
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                <strong>112</strong> Free
              </span>
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <strong>{total - 112}</strong> Premium
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFreeOnly(!showFreeOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  showFreeOnly ? 'bg-green-500/10 border-green-500 text-green-600' : 'hover:border-primary'
                }`}
              >
                <Gift className="h-4 w-4" />
                Free Only
              </button>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Sidebar - Categories */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    All Books ({total})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex justify-between ${
                        selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="capitalize">{cat.name}</span>
                      <span className="text-sm opacity-70">{cat.count}</span>
                    </button>
                  ))}
                </div>

                {/* Subscription CTA */}
                <div className="mt-8 p-4 bg-primary/10 rounded-xl">
                  <Crown className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Unlock Everything</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get access to all {total}+ books for $199/year
                  </p>
                  <button 
                    onClick={() => handleSubscribe(SUBSCRIPTION_PLANS[1])}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            </aside>

            {/* Book Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No books found</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                  {books.map(book => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      viewMode={viewMode}
                      onPurchase={() => handlePurchase(book)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Subscription Plans</h2>
            <p className="text-muted-foreground">Unlock the full library with a subscription</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div 
                key={plan.id}
                className={`bg-background rounded-xl p-6 border-2 ${
                  plan.popular ? 'border-primary relative' : 'border-transparent'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary mb-4">
                  ${plan.price}<span className="text-lg text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={plan.id === 'free'}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                    plan.id === 'free' 
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function BookCard({ 
  book, 
  viewMode,
  onPurchase 
}: { 
  book: Book
  viewMode: 'grid' | 'list'
  onPurchase: () => void
}) {
  const price = book.is_free ? 'FREE' : `$${(book.price_cents / 100).toFixed(2)}`
  
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-background border rounded-xl hover:shadow-md transition-all">
        <div className="w-20 h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-8 w-8 text-primary/40" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{book.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{book.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-sm font-medium ${book.is_free ? 'text-green-500' : 'text-primary'}`}>
              {price}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Download className="h-3 w-3" />
              {book.download_count || 0}
            </span>
          </div>
        </div>
        <button
          onClick={onPurchase}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex-shrink-0 self-center"
        >
          {book.is_free ? 'Download' : 'Buy'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-background border rounded-xl overflow-hidden hover:shadow-lg transition-all group">
      <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
        <BookOpen className="h-16 w-16 text-primary/40" />
        {book.is_free && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
            FREE
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {book.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {book.description || book.ai_description || 'Professional eBook'}
        </p>
        <div className="flex items-center justify-between">
          <span className={`font-bold ${book.is_free ? 'text-green-500' : 'text-primary'}`}>
            {price}
          </span>
          <button
            onClick={onPurchase}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            {book.is_free ? (
              <>
                <Download className="h-4 w-4" />
                Get
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Buy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
