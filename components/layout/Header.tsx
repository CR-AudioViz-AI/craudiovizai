'use client';

/**
 * CR AudioViz AI - HEADER COMPONENT
 * 
 * Gradient header matching TopBar (blue-to-green)
 * - Logo on left
 * - Navigation links
 * - Auth section
 * - No hamburger menu (removed non-functional)
 * 
 * @timestamp January 8, 2026
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Shield, LogOut } from 'lucide-react';

// Navigation links - exact order per UI contract
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

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          
          // Check if admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single();
          
          const adminEmails = ['royhenderson@craudiovizai.com', 'cindyhenderson@craudiovizai.com'];
          const isAdminUser = profile?.is_admin || 
                            profile?.role === 'admin' || 
                            (user.email && adminEmails.includes(user.email.toLowerCase()));
          setIsAdmin(isAdminUser);
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

  return (
    <header 
      className="bg-gradient-to-r from-blue-600 to-green-600 border-b border-white/20"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center flex-shrink-0"
            data-testid="header-logo"
            aria-label="CR AudioViz AI Home"
          >
            <Image
              src="/craudiovizailogo.png"
              alt="CR AudioViz AI"
              width={160}
              height={160}
              className="w-[100px] h-auto sm:w-[120px] md:w-[140px] lg:w-[160px]"
              priority
            />
          </Link>

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

          {/* Auth Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-3" data-testid="auth-section">
              {loading ? (
                <div className="w-20 h-10 bg-white/20 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2" data-testid="auth-logged-in">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-3 py-2 text-sm text-yellow-200 hover:text-yellow-100 transition-colors"
                      data-testid="admin-link"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
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
          </div>
        </div>
      </div>

      {/* Compact Mobile Navigation - Always visible on small screens */}
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
