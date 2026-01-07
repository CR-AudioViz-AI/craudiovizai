'use client';

/**
 * CR AudioViz AI - Universal Header Component
 * 
 * Features:
 * - Mobile-optimized logo (40-56px, links to home)
 * - No redundant title text next to logo
 * - Auth state: Logged out = "Login" button, Logged in = Name + Logout
 * - Consistent across ALL pages including login/signup
 * - 48px touch targets for mobile
 * 
 * @timestamp January 7, 2026 - 11:52 AM EST
 * @author Claude (for Roy Henderson)
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Shield, LogOut, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Navigation links
const NAV_LINKS = [
  { id: 'apps', label: 'Apps', href: '/apps' },
  { id: 'games', label: 'Games', href: '/games' },
  { id: 'javari', label: 'Javari AI', href: '/javari' },
  { id: 'craiverse', label: 'CRAIverse', href: '/craiverse' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

interface UserProfile {
  full_name?: string;
  display_name?: string;
  email?: string;
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
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Account';
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo - Links to Home, Mobile Optimized */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="relative">
                <div className="flex gap-1 mb-0.5">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" />
                </div>
                <div className="w-3 h-1 md:w-4 md:h-1.5 bg-white rounded-full mx-auto" />
              </div>
            </div>
            {/* Brand text - hidden on mobile, visible on md+ */}
            <span className="hidden md:block ml-3 text-xl font-bold text-white">
              CR AudioViz AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-20 h-10 bg-gray-800 rounded-lg animate-pulse" />
              ) : user ? (
                // Logged In: Show Name + Logout
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    {getDisplayName()}
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                // Logged Out: Show Login button
                <Link href="/login">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-slate-950/98 backdrop-blur-lg z-40 overflow-y-auto">
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
                    Sign Out
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
                  Login
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
