'use client';

// ================================================================================
// CR AUDIOVIZ AI - GLOBAL HEADER
// Fixed navigation with credits display and proper menu items
// ================================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Zap, 
  Settings,
  Home,
  Grid3x3,
  Gamepad2,
  Bot,
  DollarSign
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HeaderProps {
  variant?: 'light' | 'dark';
}

export default function GlobalHeader({ variant = 'light' }: HeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCredits();
  }, []);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }

  async function fetchCredits() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.credits) {
          setCredits(data.credits.balance);
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setCredits(0);
    window.location.href = '/';
  }

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apps', href: '/apps', icon: Grid3x3 },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Javari AI', href: '/javari', icon: Bot },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
  ];

  const isDark = variant === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <header className={`${bgColor} ${textColor} border-b ${borderColor} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
              CR
            </div>
            <span className="hidden sm:inline">CR AudioViz AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                             (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-cyan-500 text-white' 
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${pathname.startsWith('/admin')
                    ? 'bg-cyan-500 text-white'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side - Credits & User Menu */}
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            {user && (
              <Link
                href="/pricing"
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                <Zap className="w-4 h-4" />
                <span className="font-semibold">{credits.toLocaleString()}</span>
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                  `}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className={`
                    absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2
                    ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
                  `}>
                    <Link
                      href="/profile"
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className={`
                        w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                      `}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`
                    px-4 py-2 rounded-lg transition-colors
                    ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                  `}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Credits (Mobile) */}
            {user && (
              <Link
                href="/pricing"
                className="flex items-center justify-between px-4 py-3 mb-2 bg-gradient-to-r from-cyan-500 to-cyan-500 text-white rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="font-semibold">Credits</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {credits.toLocaleString()}
                </div>
              </Link>
            )}

            {/* Navigation (Mobile) */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                             (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-cyan-500 text-white' : 'hover:bg-gray-100'}
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin (Mobile) */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${pathname.startsWith('/admin') ? 'bg-cyan-500 text-white' : 'hover:bg-gray-100'}
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            )}

            {/* User Actions (Mobile) */}
            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-gray-100 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
