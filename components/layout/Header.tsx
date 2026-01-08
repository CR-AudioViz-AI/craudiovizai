'use client';

/**
 * CR AudioViz AI - HEADER COMPONENT
 * 
 * - MUCH BIGGER logo (~2/3 bigger: 460x75)
 * - CR = CENTERED on page (its own row)
 * 
 * @timestamp January 8, 2026
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, Sparkles, Zap } from 'lucide-react';

const NAV_LINKS = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'apps', href: '/apps', label: 'Apps' },
  { id: 'games', href: '/games', label: 'Games' },
  { id: 'javari-ai', href: '/javari', label: 'Javari AI' },
  { id: 'javari-verse', href: '/javari-verse', label: 'JavariVerse' },
  { id: 'pricing', href: '/pricing', label: 'Pricing' },
  { id: 'about', href: '/about', label: 'About' },
  { id: 'contact', href: '/contact', label: 'Contact' },
];

const CR_PHRASES = [
  "Creative Results", "Customer Rewards", "Cutting-edge Resources", "Community Reach",
  "Content Revolution", "Collaborative Realms", "Curated Riches", "Captivating Realities",
  "Clever Resources", "Comprehensive Results", "Connected Realms", "Crafted Reactions",
  "Crystal Reality", "Continuous Rewards", "Certified Reliability", "Compelling Reasons",
  "Confident Returns", "Celebrated Revelations", "Curious Roaming", "Countless Riches",
  "Cohesive Resources", "Conquering Realms", "Cultivated Rewards", "Collaborative Reach",
  "Capable Responses", "Caring Relationships", "Celebrated Results", "Central Resources",
  "Certain Returns", "Champion Rank", "Charged Reactions", "Charming Results",
  "Clear Reasoning", "Clever Renditions", "Cloud Resources", "Coastal Retreats",
  "Coded Reality", "Colorful Renders", "Combined Reach", "Commanding Respect",
  "Complete Resources", "Concentrated Results", "Connected Reality", "Conscious Responsibility",
  "Consistent Results", "Constructive Reviews", "Core Reliability", "Cosmic Rays",
  "Creative Reach", "Crisp Resolution", "Critical Reviews", "Crowning Rewards",
  "Crucial Resources", "Cumulative Returns", "Curious Readers", "Current Relevance",
  "Custom Requests", "Cybernetic Realms", "Calculated Risks", "Calm Reflection",
  "Candid Reviews", "Capital Returns", "Captive Results", "Cardinal Rules",
  "Careful Research", "Cascading Results", "Casual Reading", "Catalytic Reactions",
  "Centered Reality", "Challenging Routes", "Changing Reality", "Character Recognition",
  "Charitable Reach", "Checked References", "Chemical Reactions", "Chief Researchers",
  "Circular Reasoning", "Civic Responsibility", "Classic Renditions", "Clean Records",
  "Climbing Rankings", "Clinical Research", "Closed Rounds", "Coached Results",
  "Coastal Routes", "Cognitive Research", "Collective Resources", "Colonial Routes",
  "Comfortable Rhythms", "Commercial Reality", "Common Resources", "Compact Results",
  "Competitive Rates", "Complex Relations", "Computed Results", "Conceptual Reasoning",
  "Concrete Results", "Conditional Returns", "Confirmed Reports", "Conscious Reasoning",
  "Constant Reliability", "Consumer Reports", "Contemporary Research", "Contextual Relevance",
  "Controlled Reactions", "Conventional Routes", "Cooperative Relations", "Coordinated Response",
];

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('Free');
  const [loading, setLoading] = useState(true);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [rotationCount, setRotationCount] = useState(0);
  const [showCindyRoy, setShowCindyRoy] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationCount(prev => {
        const newCount = prev + 1;
        setShowCindyRoy(newCount % 25 === 0);
        return newCount;
      });
      setCurrentPhraseIndex((prev) => (prev + 1) % CR_PHRASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const adminEmails = ['royhenderson@craudiovizai.com', 'cindyhenderson@craudiovizai.com'];
          const isAdminEmail = user.email && adminEmails.includes(user.email.toLowerCase());
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits, subscription_tier, is_admin, role')
            .eq('id', user.id)
            .single();
          const isAdminUser = profile?.is_admin || profile?.role === 'admin' || isAdminEmail;
          setIsAdmin(isAdminUser);
          if (isAdminUser) {
            setPlan('Admin');
            setCredits(null);
          } else if (profile) {
            setCredits(profile.credits ?? 0);
            setPlan(profile.subscription_tier || 'Free');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    window.location.href = '/';
  }, [supabase]);

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const displayPhrase = showCindyRoy ? "Cindy & Roy" : CR_PHRASES[currentPhraseIndex];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-green-600" data-testid="site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: BIGGER Logo + Nav + Auth */}
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo - MUCH BIGGER: ~2/3 larger */}
          <Link 
            href="/" 
            data-testid="header-logo" 
            aria-label="CR AudioViz AI Home"
            className="flex-shrink-0"
          >
            <Image
              src="/craudiovizailogo.png"
              alt="CR AudioViz AI"
              width={460}
              height={75}
              className="h-14 sm:h-16 md:h-[75px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" data-testid="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/25 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex flex-col items-end gap-0">
            <div className="flex items-center gap-2" data-testid="auth-section">
              {loading ? (
                <div className="w-16 h-7 bg-white/20 rounded animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard" className="flex items-center gap-1.5 px-2 py-1 text-sm text-white/90 hover:text-white">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{getDisplayName()}</span>
                  </Link>
                  <span className="text-white/40 hidden sm:inline">|</span>
                  <button onClick={handleSignOut} className="flex items-center gap-1 text-sm text-white/70 hover:text-white">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-3 py-1 text-sm text-white/90 hover:text-white">Log In</Link>
                  <Link href="/signup" className="px-3 py-1.5 bg-white text-blue-600 hover:bg-white/90 rounded-lg text-sm font-medium">Sign Up</Link>
                </div>
              )}
            </div>
            {/* Plan details - compact */}
            <div className="text-[11px] mt-0.5">
              {!loading && (user ? (
                <div className="flex items-center gap-1.5 text-white/80">
                  <span className={`px-1.5 py-0.5 rounded-full ${
                    isAdmin ? 'bg-yellow-500/30 text-yellow-200' :
                    plan === 'Pro' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/20'
                  }`}>
                    <Sparkles className="w-3 h-3 inline mr-0.5" />
                    {isAdmin ? 'Admin' : plan}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />
                    {isAdmin ? 'Unlimited' : `${credits?.toLocaleString()} credits`}
                  </span>
                </div>
              ) : (
                <span className="text-white/60">Log in to see your plan details</span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: CR = CENTERED on page */}
        <div className="flex justify-center pb-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="font-bold text-cyan-300">CR</span>
            <span className="text-white/60">=</span>
            <span className={`transition-all duration-300 ${showCindyRoy ? 'text-pink-300 font-bold' : ''}`}>
              {displayPhrase}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
            {NAV_LINKS.slice(0, 6).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive(link.href) ? 'bg-white/25 text-white' : 'text-white/70 hover:text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/about" className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap text-white/70 hover:text-white hover:bg-white/15">
              More...
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
