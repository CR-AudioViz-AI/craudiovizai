'use client';

/**
 * CR AudioViz AI - HEADER COMPONENT
 * 
 * - BIGGER logo (readable)
 * - CR = under logo, rotating phrases, Cindy & Roy every 25th
 * - No "Admin" next to name - only in plan bar
 * - Credits show exact number or "Unlimited" for admins
 * 
 * @timestamp January 8, 2026
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, Sparkles, Zap } from 'lucide-react';

// Navigation links
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

// 100+ unique CR phrases
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

  // CR phrase rotation - 5 seconds, Cindy & Roy every 25th
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationCount(prev => {
        const newCount = prev + 1;
        if (newCount % 25 === 0) {
          setShowCindyRoy(true);
        } else {
          setShowCindyRoy(false);
        }
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
            setCredits(null); // Will show "Unlimited"
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

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
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const displayPhrase = showCindyRoy ? "Cindy & Roy" : CR_PHRASES[currentPhraseIndex];

  return (
    <header 
      className="bg-gradient-to-r from-blue-600 to-green-600"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 md:h-28">
          
          {/* Logo + CR = phrase underneath - BIGGER */}
          <div className="flex flex-col items-start flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center"
              data-testid="header-logo"
              aria-label="CR AudioViz AI Home"
            >
              <Image
                src="/craudiovizailogo.png"
                alt="CR AudioViz AI"
                width={400}
                height={90}
                className="h-16 sm:h-20 md:h-[90px] w-auto"
                priority
              />
            </Link>
            {/* CR = phrase under logo */}
            <div className="text-white/90 text-xs mt-1 flex items-center gap-1">
              <span className="font-semibold">CR</span>
              <span className="text-white/60">=</span>
              <span className={`transition-all duration-300 ${showCindyRoy ? 'text-pink-200 font-semibold' : ''}`}>
                {displayPhrase}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" data-testid="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/25 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                data-testid={`nav-link-${link.id}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section + Plan Details */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3" data-testid="auth-section">
              {loading ? (
                <div className="w-20 h-10 bg-white/20 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2" data-testid="auth-logged-in">
                  {/* User name - NO Admin label here */}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:text-white transition-colors"
                    data-testid="user-name"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{getDisplayName()}</span>
                  </Link>
                  <span className="text-white/40 hidden sm:inline">|</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2" data-testid="auth-logged-out">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-white/90 hover:text-white transition-colors"
                    data-testid="login-link"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-white text-blue-600 hover:bg-white/90 rounded-lg text-sm font-medium transition-colors"
                    data-testid="signup-link"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
            
            {/* Plan details under auth buttons */}
            <div className="text-xs">
              {loading ? null : user ? (
                <div className="flex items-center gap-2 text-white/80">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isAdmin ? 'bg-yellow-500/30 text-yellow-200' :
                    plan === 'Pro' ? 'bg-purple-500/30 text-purple-200' :
                    'bg-white/20'
                  }`}>
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {isAdmin ? 'Admin' : plan}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {isAdmin ? 'Unlimited' : `${credits?.toLocaleString()} credits`}
                  </span>
                  {!isAdmin && (
                    <Link href="/pricing" className="text-white/60 hover:text-white underline">
                      {plan === 'Free' ? 'Upgrade' : 'Top Up'}
                    </Link>
                  )}
                </div>
              ) : (
                <span className="text-white/60">Log in to see plan details</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Mobile Navigation */}
      <div className="lg:hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {NAV_LINKS.slice(0, 6).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/25 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/about"
              className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap text-white/70 hover:text-white hover:bg-white/15"
            >
              More...
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
