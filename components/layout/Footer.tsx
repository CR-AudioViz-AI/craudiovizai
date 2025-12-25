'use client';

/**
 * CR AudioViz AI - Mobile-Optimized Footer Component
 * 
 * Mobile-first design with:
 * - Stacking columns on mobile (1 col) → 2 cols → 6 cols
 * - 48px touch targets for all links
 * - Proper input sizing (16px font to prevent iOS zoom)
 * - Accordion-style link sections on mobile
 * - Payment icons in responsive grid
 * 
 * @timestamp Thursday, December 25, 2025 - 5:30 PM EST
 * @author Claude (for Roy Henderson)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, Loader2, CheckCircle, AlertCircle, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// Collapsible Section Component for Mobile
function FooterSection({ 
  title, 
  children,
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-800 md:border-0">
      {/* Mobile: Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 md:hidden
                   text-white font-semibold text-base touch-manipulation"
        aria-expanded={isOpen}
      >
        {title}
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {/* Desktop: Static Header */}
      <h4 className="hidden md:block text-white font-semibold mb-4">
        {title}
      </h4>
      
      {/* Content */}
      <div className={`
        overflow-hidden transition-all duration-200
        ${isOpen ? 'max-h-96 pb-4' : 'max-h-0 md:max-h-none'}
        md:overflow-visible md:pb-0
      `}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
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
    };
    
    checkAdmin();
  }, [supabase]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus('loading');
    setStatusMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (data.success) {
        setSubscribeStatus('success');
        setStatusMessage(data.message);
        setEmail('');
        setName('');
        setTimeout(() => {
          setSubscribeStatus('idle');
          setStatusMessage('');
        }, 5000);
      } else {
        setSubscribeStatus('error');
        setStatusMessage(data.error || 'Something went wrong');
        setTimeout(() => setSubscribeStatus('idle'), 5000);
      }
    } catch (error) {
      setSubscribeStatus('error');
      setStatusMessage('Network error. Please try again.');
      setTimeout(() => setSubscribeStatus('idle'), 5000);
    }
  };

  // Link arrays
  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'Apps', href: '/apps' },
    { label: 'Games', href: '/games' },
    { label: 'Javari AI', href: '/javari' },
    { label: 'CRAIverse', href: '/craiverse' },
    { label: 'Pricing', href: '/pricing' },
  ];

  const resourceLinks = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Help Center', href: '/help' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Tutorials', href: '/tutorials' },
    { label: 'Blog', href: '/blog' },
    { label: 'Status', href: '/status' },
  ];

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Meet the Team', href: '/team' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press Kit', href: '/press' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refunds' },
    { label: 'Security', href: '/security' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ];

  // Reusable link list component
  const LinkList = ({ links }: { links: { label: string; href: string }[] }) => (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.href}>
          <Link 
            href={link.href} 
            className="block py-2 md:py-1 text-sm text-gray-400 
                       hover:text-white transition-colors
                       min-h-[44px] md:min-h-0 flex items-center"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        
        {/* Mobile: Stack vertically | Desktop: 6-column grid */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-6 md:gap-8">
          
          {/* Company Info & Newsletter - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2 pb-6 md:pb-0">
            <h3 className="text-white font-bold text-lg mb-2">
              CR AudioViz AI, LLC
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Your Story. Our Design.
            </p>
            
            {/* Newsletter Subscribe Box */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Stay Connected
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Get updates on new releases and features
              </p>
              
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 
                             rounded-lg text-base text-white placeholder-gray-500 
                             focus:outline-none focus:border-blue-500 focus:ring-2 
                             focus:ring-blue-500/20 transition-all
                             min-h-[48px]"
                  style={{ fontSize: '16px' }} // Prevents iOS zoom
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 
                             rounded-lg text-base text-white placeholder-gray-500 
                             focus:outline-none focus:border-blue-500 focus:ring-2 
                             focus:ring-blue-500/20 transition-all
                             min-h-[48px]"
                  style={{ fontSize: '16px' }} // Prevents iOS zoom
                />
                <Button 
                  type="submit" 
                  disabled={subscribeStatus === 'loading'}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 
                             hover:from-blue-700 hover:to-green-700 
                             text-white text-sm font-semibold
                             min-h-[48px] rounded-lg transition-all"
                >
                  {subscribeStatus === 'loading' && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {subscribeStatus === 'success' && (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {subscribeStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {subscribeStatus === 'loading' ? 'Subscribing...' : 
                   subscribeStatus === 'success' ? 'Subscribed!' : 
                   subscribeStatus === 'error' ? 'Try Again' : 'Subscribe'}
                </Button>
                
                {statusMessage && (
                  <p className={`text-xs ${subscribeStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {statusMessage}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Navigation Links - Collapsible on mobile */}
          <div className="mt-4 md:mt-0">
            <FooterSection title="Navigation" defaultOpen={false}>
              <LinkList links={navigationLinks} />
            </FooterSection>
          </div>

          {/* Resources Links */}
          <div>
            <FooterSection title="Resources" defaultOpen={false}>
              <LinkList links={resourceLinks} />
            </FooterSection>
          </div>

          {/* Company Links */}
          <div>
            <FooterSection title="Company" defaultOpen={false}>
              <ul className="space-y-1">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="block py-2 md:py-1 text-sm text-gray-400 
                                 hover:text-white transition-colors
                                 min-h-[44px] md:min-h-0 flex items-center"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* Admin link - only visible to admins */}
                {isAdmin && (
                  <li>
                    <Link 
                      href="/admin" 
                      className="block py-2 md:py-1 text-sm text-purple-400 
                                 hover:text-purple-300 transition-colors font-medium
                                 min-h-[44px] md:min-h-0 flex items-center"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </FooterSection>
          </div>

          {/* Legal Links */}
          <div>
            <FooterSection title="Legal" defaultOpen={false}>
              <LinkList links={legalLinks} />
            </FooterSection>
          </div>
        </div>
      </div>

      {/* Payment Methods Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 text-gray-400">
            <span className="text-xs font-medium w-full text-center md:w-auto">
              Secure Payments:
            </span>
            
            {/* Payment Icons - Responsive sizing */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              {/* Stripe */}
              <div className="flex items-center gap-1 text-xs bg-gray-800 px-3 py-1.5 rounded">
                <svg className="w-8 h-5" viewBox="0 0 60 25" fill="currentColor">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.6 10.6 0 0 1-4.56.93c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.39 6.23-7.39 3.97 0 5.97 2.93 5.97 7.3v1.52zm-3.96-2.87c0-1.44-.69-2.76-2.22-2.76-1.41 0-2.32 1.24-2.41 2.76h4.63z"/>
                </svg>
              </div>
              
              {/* Visa */}
              <div className="text-xs font-bold text-blue-400 bg-gray-800 px-3 py-1.5 rounded">
                VISA
              </div>
              
              {/* Mastercard */}
              <div className="flex items-center gap-0 bg-gray-800 px-3 py-1.5 rounded">
                <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
                <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80 -ml-2" />
              </div>
              
              {/* Amex */}
              <div className="text-xs font-bold text-blue-300 bg-gray-800 px-3 py-1.5 rounded">
                AMEX
              </div>
              
              {/* Discover */}
              <div className="text-xs font-bold text-orange-400 bg-gray-800 px-3 py-1.5 rounded">
                DISCOVER
              </div>
              
              {/* PayPal */}
              <div className="text-xs font-bold text-blue-400 bg-gray-800 px-3 py-1.5 rounded">
                PayPal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Contact & Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4 text-sm text-gray-400">
            
            {/* Contact Links - Stack on mobile */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <a 
                href="mailto:info@craudiovizai.com" 
                className="flex items-center hover:text-white transition-colors
                           min-h-[44px] px-2"
              >
                <Mail className="w-4 h-4 mr-2" />
                info@craudiovizai.com
              </a>
              <a 
                href="mailto:support@craudiovizai.com" 
                className="flex items-center hover:text-white transition-colors
                           min-h-[44px] px-2"
              >
                support@craudiovizai.com
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-center text-gray-500">
              © {currentYear} CR AudioViz AI, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      
      {/* Safe Area Padding for iOS */}
      <div className="pb-safe" />
    </footer>
  );
}
