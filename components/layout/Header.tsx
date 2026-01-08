'use client';

/**
 * CR AudioViz AI - HEADER COMPONENT
 * 
 * LIGHT BACKGROUND for logo legibility (per founder directive)
 * - Header: 80px mobile / 92px desktop (LOCKED)
 * - Logo: full-color, crisp, visually dominant
 * - Light gradient background for maximum logo contrast
 * - Cindy & Roy = RED letters (not pink)
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
    <header className="bg-gradient-to-r from-sky-100 to-teal-100 border-b border-gray-200" data-testid="site-header">
      {/* MAIN NAV BAR - FIXED HEIGHT: 80px mobile / 92px desktop */}
      <div className="h-[80px] md:h-[92px] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo wrapper - WIDTH EMPHASIZED, full-color logo */}
          <Link 
            href="/" 
            data-testid="header-logo" 
            aria-label="CR AudioViz AI Home"
            className="flex-shrink-0 w-[260px] md:w-[340px] lg:w-[420px] flex items-center"
          >
            <Image
              src="/craudiovizailogo.png"
              alt="CR AudioViz AI"
              width={274}
              height={72}
              className="h-[56px] md:h-[64px] lg:h-[72px] w-auto block"
              priority
            />
          </Link>

          {/* Right side: Nav + Auth */}
          <div className="flex flex-col items-end gap-1">
            {/* Desktop Navigation - Navy text on light background */}
            <nav className="hidden lg:flex items-center space-x-1" data-testid="desktop-nav">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-teal-500/20 text-teal-700 border-b-2 border-teal-500'
                      : 'text-slate-700 hover:text-teal-600 hover:bg-teal-500/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Section - Navy/charcoal text */}
            <div className="flex items-center gap-2" data-testid="auth-section">
              {loading ? (
                <div className="w-16 h-7 bg-slate-200 rounded animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard" className="flex items-center gap-1.5 px-2 py-1 text-sm text-slate-700 hover:text-teal-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{getDisplayName()}</span>
                  </Link>
                  <span className="text-slate-300 hidden sm:inline">|</span>
                  <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      isAdmin ? 'bg-yellow-100 text-yellow-700' :
                      plan === 'Pro' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Sparkles className="w-3 h-3 inline mr-0.5" />
                      {isAdmin ? 'Admin' : plan}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />
                      {isAdmin ? 'Unlimited' : `${credits?.toLocaleString()} credits`}
                    </span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">|</span>
                  <button onClick={handleSignOut} className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] hidden sm:inline">Log in to see your plan</span>
                  <Link href="/login" className="px-3 py-1 text-sm text-slate-700 hover:text-teal-600">Log In</Link>
                  <Link href="/signup" className="px-3 py-1.5 bg-teal-500 text-white hover:bg-teal-600 rounded-lg text-sm font-medium">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CR = phrase bar - light teal background */}
      <div className="flex justify-center py-1.5 bg-teal-50 border-t border-teal-100">
        <div className="flex items-center gap-2 text-slate-700 text-sm">
          <span className="font-bold text-teal-600">CR</span>
          <span className="text-slate-400">=</span>
          {/* Cindy & Roy in RED (not pink) */}
          <span className={`transition-all duration-300 ${showCindyRoy ? 'text-red-500 font-bold' : ''}`}>
            {displayPhrase}
          </span>
        </div>
      </div>

      {/* Mobile Navigation - navy text on light */}
      <div className="lg:hidden border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
            {NAV_LINKS.slice(0, 6).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive(link.href) ? 'bg-teal-500/20 text-teal-700' : 'text-slate-600 hover:text-teal-600 hover:bg-teal-500/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/about" className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap text-slate-500 hover:text-teal-600 hover:bg-teal-500/10">
              More...
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
