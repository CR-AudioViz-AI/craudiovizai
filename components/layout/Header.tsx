'use client';

/**
 * CR AudioViz AI - LOCKED HEADER COMPONENT
 * 
 * ⚠️ UI CONTRACT LOCK - PHASE 2.9
 * This is the SINGLE SOURCE OF TRUTH for all page headers.
 * DO NOT create per-page header variants.
 * 
 * Requirements:
 * - Logo: 40-56px mobile, links to /
 * - NO "CR AudioViz AI" text when logo visible
 * - Nav: Home, Apps, Games, Javari AI, JavariVerse, Pricing, About, Contact
 * - Auth: "Log in" when logged out, "Name | Logout" when logged in
 * 
 * @timestamp January 7, 2026 - 5:20 PM EST
 * @locked PHASE 2.9 UI CONTRACT
 * @fix Replaced CSS icon with actual CR AudioViz AI logo image
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Shield, LogOut, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// LOCKED NAVIGATION - DO NOT MODIFY ORDER
// ============================================================================
const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'apps', label: 'Apps', href: '/apps' },
  { id: 'games', label: 'Games', href: '/games' },
  { id: 'javari-ai', label: 'Javari AI', href: '/javari' },
  { id: 'javari-verse', label: 'JavariVerse', href: '/javari-verse' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

interface UserProfile {
  full_name?: string;
  display_name?: string;
  role?: string;
  is_admin?: boolean;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, display_name, role, is_admin')
            .eq('id', user.id)
            .single();
          
          if (profileData) {
            setProfile(profileData);
            setIsAdmin(profileData.role === 'admin' || profileData.is_admin === true);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
  }, [supabase, router]);

  // Get display name for logged-in user
  const getDisplayName = (): string => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Account';
  };

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header 
      className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* ============================================================
              LOGO - Actual CR AudioViz AI logo image
              Mobile: 40px, Desktop: 48px
              Links to home
              ============================================================ */}
          <Link 
            href="/" 
            className="flex items-center flex-shrink-0"
            data-testid="header-logo"
            aria-label="CR AudioViz AI Home"
          >
            <Image
              src="/craudiovizailogo.png"
              alt="CR AudioViz AI"
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg"
              priority
            />
            {/* NO text branding - logo is the only brand indicator */}
          </Link>

          {/* ============================================================
              DESKTOP NAVIGATION - Exact order per UI contract
              ============================================================ */}
          <nav className="hidden lg:flex items-center space-x-1" data-testid="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                data-testid={`nav-link-${link.id}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ============================================================
              AUTH SECTION
              Logged out: "Log in" button
              Logged in: "Name | Logout"
              ============================================================ */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3" data-testid="auth-section">
              {loading ? (
                <div className="w-20 h-10 bg-gray-800 rounded-lg animate-pulse" />
              ) : user ? (
                // Logged In: Name | Logout
                <div className="flex items-center gap-2" data-testid="auth-logged-in">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                      data-testid="admin-link"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    data-testid="user-name"
                  >
                    <User className="w-4 h-4" />
                    {getDisplayName()}
                  </Link>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                    data-testid="logout-button"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                // Logged Out: "Log in" button
                <Link href="/login" data-testid="auth-logged-out">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Log in
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label="Toggle menu"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE MENU
          ============================================================ */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-16 bg-slate-950/98 backdrop-blur-lg z-40 overflow-y-auto"
          data-testid="mobile-menu"
        >
          <div className="px-4 py-6 space-y-2">
            {/* Nav Links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium transition-colors min-h-[48px] ${
                  isActive(link.href)
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-200 hover:bg-white/5 active:bg-white/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`mobile-nav-${link.id}`}
              >
                {link.label}
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t border-white/10 my-4" />

            {/* Mobile Auth */}
            {loading ? (
              <div className="px-4 py-4">
                <div className="h-12 bg-gray-800 rounded-xl animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* User Info */}
                <div className="px-4 py-3 text-gray-400 text-sm">
                  Signed in as <span className="text-white font-medium">{getDisplayName()}</span>
                </div>
                
                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium text-gray-200 hover:bg-white/5 min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Dashboard
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>

                {/* Admin Link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium text-amber-400 hover:bg-amber-500/10 min-h-[48px]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      Admin Panel
                    </span>
                    <ChevronRight className="w-5 h-5 text-amber-500/50" />
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 min-h-[48px]"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    Logout
                  </span>
                </button>
              </>
            ) : (
              // Logged Out Mobile
              <div className="space-y-3 px-4">
                <Link
                  href="/login"
                  className="block w-full py-4 text-center rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="block w-full py-4 text-center rounded-xl border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-medium min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
