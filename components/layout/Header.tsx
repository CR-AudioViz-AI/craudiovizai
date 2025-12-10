'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MobileButton } from '@/components/mobile';
import { Menu, X, User, Shield, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Hardcoded navigation links - ALWAYS show these
const DEFAULT_NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/', is_visible: true, display_order: 0 },
  { id: 'apps', label: 'Apps', href: '/apps', is_visible: true, display_order: 1 },
  { id: 'games', label: 'Games', href: '/games', is_visible: true, display_order: 2 },
  { id: 'javari', label: 'Javari AI', href: '/javari', is_visible: true, display_order: 3 },
  { id: 'craiverse', label: 'CRAIverse', href: '/craiverse', is_visible: true, display_order: 4 },
  { id: 'pricing', label: 'Pricing', href: '/pricing', is_visible: true, display_order: 5 },
  { id: 'about', label: 'About', href: '/about', is_visible: true, display_order: 6 },
  { id: 'contact', label: 'Contact', href: '/contact', is_visible: true, display_order: 7 },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navLinks = DEFAULT_NAV_LINKS;
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* SINGLE ROW: Logo (left) | Navigation (center) | Auth (right) */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 lg:h-28">
            
            {/* Logo - MUCH LARGER */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/craudiovizailogo.png"
                alt="CR AudioViz AI"
                width={600}
                height={180}
                className="h-20 lg:h-24 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation - CENTERED with better spacing */}
            <nav className="hidden lg:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center space-x-2 xl:space-x-6">
                {navLinks.filter(link => link.is_visible).map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`px-3 xl:px-4 py-2 text-base font-medium whitespace-nowrap rounded-md transition-colors ${
                      isActive(link.href)
                        ? 'text-blue-600 font-semibold bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop Auth - Right side */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <Link href="/admin">
                          <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-purple-600">
                            <Shield className="w-4 h-4 mr-1" />
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-blue-600">
                          <User className="w-4 h-4 mr-1" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-sm text-gray-600 hover:text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link href="/login">
                        <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-5 py-2">
                          Get Started Free
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <MobileButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </MobileButton>
          </div>
        </div>
      </div>

      {/* CR = Coordinated Rejuvenating Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-center py-1.5 text-sm font-medium">
        CR = Coordinated Rejuvenating
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-1">
              {navLinks.filter(link => link.is_visible).map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Auth */}
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            <Shield className="w-5 h-5 mr-2 text-purple-600" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-5 h-5 mr-2" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-3 rounded-lg text-center text-gray-700 hover:bg-gray-50 border border-gray-200"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-3 rounded-lg text-center bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold"
                        >
                          Get Started Free
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
