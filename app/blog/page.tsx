'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileButton, MobileInput } from '@/components/mobile';
import { Calendar, User, ArrowRight, Search, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Posts');

  const posts = [
    {
      id: 1,
      title: "10 Ways AI is Revolutionizing Creative Work in 2025",
      excerpt: "Discover how artificial intelligence is transforming the creative industry and what it means for designers, developers, and content creators.",
      author: "Sarah Johnson",
      date: "October 15, 2025",
      category: "AI & Technology",
      readTime: "5 min read",
      slug: "ai-revolutionizing-creative-work"
    },
    {
      id: 2,
      title: "Building Your First Game with CR AudioViz AI",
      excerpt: "A step-by-step tutorial on creating an engaging game using our platform's powerful tools and Javari AI assistant.",
      author: "Mike Chen",
      date: "October 10, 2025",
      category: "Tutorials",
      readTime: "8 min read",
      slug: "building-first-game"
    },
    {
      id: 3,
      title: "The Future of No-Code Development",
      excerpt: "Explore how no-code platforms are democratizing software development and empowering non-technical creators.",
      author: "Emily Rodriguez",
      date: "October 5, 2025",
      category: "Industry Insights",
      readTime: "6 min read",
      slug: "future-no-code"
    },
    {
      id: 4,
      title: "How Javari AI Writes Production-Ready Code",
      excerpt: "Deep dive into the AI technology powering our autonomous development assistant and how it achieves Fortune 50 quality.",
      author: "David Park",
      date: "September 28, 2025",
      category: "Product Updates",
      readTime: "7 min read",
      slug: "javari-production-code"
    },
    {
      id: 5,
      title: "5 Tips for Maximizing Your Creative Pro Plan",
      excerpt: "Get the most value from your subscription with these expert tips and hidden features you might have missed.",
      author: "Lisa Chen",
      date: "September 20, 2025",
      category: "Tips & Tricks",
      readTime: "4 min read",
      slug: "maximize-pro-plan"
    },
    {
      id: 6,
      title: "From Idea to Launch: Building Apps in Days, Not Months",
      excerpt: "Real customer stories showing how CR AudioViz AI accelerates development timelines by 10x.",
      author: "Marcus Johnson",
      date: "September 15, 2025",
      category: "Case Studies",
      readTime: "6 min read",
      slug: "idea-to-launch"
    }
  ];

  const categories = ['All Posts', 'AI & Technology', 'Tutorials', 'Industry Insights', 'Product Updates', 'Case Studies', 'Tips & Tricks'];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All Posts' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cyan-600 via-cyan-600 to-cyan-600 text-white px-4 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">
              CR AudioViz AI Blog
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-cyan-100 mb-6 md:mb-8">
              Insights, tutorials, and stories from the world of AI-powered creativity
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <MobileInput
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                className="bg-white/90 text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-6 md:py-8 bg-white border-b">
        <div className="container mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap md:justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0 text-sm ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 md:mb-8">
              <span className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Featured Post
              </span>
            </div>
            <Card className="overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-48 md:h-auto bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/30" />
                </div>
                <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {posts[0].category}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500">{posts[0].readTime}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
                    {posts[0].title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                    {posts[0].excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {posts[0].author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {posts[0].date}
                    </div>
                  </div>
                  <Link href={`/blog/${posts[0].slug}`} className="block">
                    <MobileButton
                      fullWidth
                      className="bg-blue-600 hover:bg-blue-700"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Read Article
                    </MobileButton>
                  </Link>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* All Posts Grid */}
      <section className="px-4 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {selectedCategory === 'All Posts' ? 'Latest Articles' : selectedCategory}
              </h2>
              <div className="text-sm md:text-base text-gray-600">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPosts.slice(1).map((post) => (
                <Card key={post.id} className="hover:shadow-xl transition-shadow flex flex-col">
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/30" />
                  </div>
                  <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-2 py-1 bg-cyan-100 text-slate-700 text-xs font-semibold rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date.split(',')[0]}
                      </div>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="block">
                      <MobileButton
                        fullWidth
                        size="sm"
                        variant="outline"
                        icon={<ArrowRight className="w-4 h-4" />}
                      >
                        Read More
                      </MobileButton>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <MobileButton
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Posts');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </MobileButton>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Never Miss an Update
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest articles, tutorials, and product updates
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <div className="flex-1">
              <MobileInput
                type="email"
                placeholder="your@email.com"
                className="bg-white/90 text-gray-900"
              />
            </div>
            <MobileButton 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 sm:w-auto"
            >
              Subscribe
            </MobileButton>
          </div>
        </div>
      </section>
    </div>
  );
}
