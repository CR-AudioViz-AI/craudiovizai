'use client';

/**
 * CR AudioViz AI - Mobile-Optimized Header Component
 * 
 * Mobile-first design with:
 * - Properly sized logo (40-56px instead of 112px)
 * - Compact header height (64px mobile, 80px desktop)
 * - 48px touch targets for all interactive elements
 * - Full-screen mobile menu with safe area support
 * - Smooth animations with reduced motion support
 * 
 * @timestamp Thursday, December 25, 2025 - 5:25 PM EST
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
  { id: 'home', label: 'Home', href: '/' },
  { id: 'apps', label: 'Apps', href: '/apps' },
  { id: 'games', label: 'Games', href: '/games' },
  { id: 'javari', label: 'Javari AI', href: '/javari' },
  { id: 'craiverse', label: 'CRAIverse', href: '/craiverse' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
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
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_admin')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.role === 'admin' || profile?.is_admin === true);
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
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  }, [supabase, router]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Main Header Row */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 md:h-20 lg:h-24">
              
              {/* Logo - Mobile Optimized Sizing */}
              <Link 
                href="/" 
                className="flex items-center flex-shrink-0 min-h-[48px]"
                onClick={closeMobileMenu}
              >
                <Image
                  src="/craudiovizailogo.png"
                  alt="CR AudioViz AI"
                  width={400}
                  height={120}
                  className="h-10 md:h-12 lg:h-14 w-auto"
                  priority
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center justify-center flex-1 mx-4 xl:mx-8">
                <div className="flex items-center gap-1 xl:gap-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={`
                        px-3 xl:px-4 py-2 text-sm xl:text-base font-medium 
                        whitespace-nowrap rounded-lg transition-all duration-200
                        min-h-[40px] flex items-center
                        ${isActive(link.href)
                          ? 'text-blue-600 font-semibold bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                {!loading && (
                  <>
                    {user ? (
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Link href="/admin">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-sm text-gray-600 hover:text-purple-600 min-h-[40px]"
                            >
                              <Shield className="w-4 h-4 mr-1.5" />
                              Admin
                            </Button>
                          </Link>
                        )}
                        <Link href="/dashboard">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-sm text-gray-600 hover:text-blue-600 min-h-[40px]"
                          >
                            <User className="w-4 h-4 mr-1.5" />
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSignOut}
                          className="text-sm text-gray-600 hover:text-red-600 min-h-[40px]"
                        >
                          <LogOut className="w-4 h-4 mr-1.5" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link href="/login">
                          <Button 
                            variant="ghost" 
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 min-h-[40px]"
                          >
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup">
                          <Button 
                            className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-green-600 
                                       hover:from-blue-700 hover:to-green-700 text-white px-5 min-h-[40px]"
                          >
                            Get Started Free
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile Menu Button - 48px touch target */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                className="lg:hidden flex items-center justify-center w-12 h-12 -mr-2
                           rounded-lg hover:bg-gray-100 active:bg-gray-200 
                           transition-colors touch-manipulation"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Full Screen */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div 
            className="absolute top-16 md:top-20 left-0 right-0 bottom-0 
                       bg-white overflow-y-auto overscroll-contain
                       animate-in slide-in-from-top-2 duration-200"
          >
            <div className="container mx-auto px-4 py-4 pb-safe">
              
              {/* Navigation Links */}
              <nav className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`
                      flex items-center justify-between
                      px-4 py-4 rounded-xl text-base font-medium
                      min-h-[56px] transition-colors touch-manipulation
                      ${isActive(link.href)
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }
                    `}
                  >
                    {link.label}
                    <ChevronRight className={`w-5 h-5 ${isActive(link.href) ? 'text-blue-400' : 'text-gray-400'}`} />
                  </Link>
                ))}
              </nav>
              
              {/* Divider */}
              <div className="my-4 border-t border-gray-200" />
              
              {/* Mobile Auth Section */}
              <div className="space-y-2">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        {/* User Email */}
                        <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50 rounded-xl">
                          <span className="font-medium text-gray-700">Signed in as:</span>
                          <br />
                          {user.email}
                        </div>
                        
                        {/* Admin Link */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={closeMobileMenu}
                            className="flex items-center px-4 py-4 rounded-xl text-base font-medium
                                       text-purple-600 hover:bg-purple-50 active:bg-purple-100
                                       min-h-[56px] transition-colors touch-manipulation"
                          >
                            <Shield className="w-5 h-5 mr-3" />
                            Admin Panel
                            <ChevronRight className="w-5 h-5 ml-auto text-purple-400" />
                          </Link>
                        )}
                        
                        {/* Dashboard Link */}
                        <Link
                          href="/dashboard"
                          onClick={closeMobileMenu}
                          className="flex items-center px-4 py-4 rounded-xl text-base font-medium
                                     text-gray-700 hover:bg-gray-50 active:bg-gray-100
                                     min-h-[56px] transition-colors touch-manipulation"
                        >
                          <User className="w-5 h-5 mr-3 text-blue-600" />
                          Dashboard
                          <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                        </Link>
                        
                        {/* Sign Out Button */}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-4 rounded-xl text-base font-medium
                                     text-red-600 hover:bg-red-50 active:bg-red-100
                                     min-h-[56px] transition-colors touch-manipulation"
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Sign In Button */}
                        <Link
                          href="/login"
                          onClick={closeMobileMenu}
                          className="flex items-center justify-center w-full px-4 py-4 
                                     rounded-xl text-base font-medium text-gray-700
                                     border-2 border-gray-200 hover:border-gray-300 
                                     hover:bg-gray-50 active:bg-gray-100
                                     min-h-[56px] transition-colors touch-manipulation"
                        >
                          Sign In
                        </Link>
                        
                        {/* Get Started Button */}
                        <Link
                          href="/signup"
                          onClick={closeMobileMenu}
                          className="flex items-center justify-center w-full px-4 py-4 
                                     rounded-xl text-base font-semibold text-white
                                     bg-gradient-to-r from-blue-600 to-green-600 
                                     hover:from-blue-700 hover:to-green-700
                                     active:from-blue-800 active:to-green-800
                                     min-h-[56px] transition-all touch-manipulation
                                     shadow-lg shadow-blue-500/25"
                        >
                          Get Started Free
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Bottom Padding for Safe Area */}
              <div className="h-20" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
