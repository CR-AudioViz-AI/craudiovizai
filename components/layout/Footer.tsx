'use client';

/**
 * CR AudioViz AI - Complete Footer Component
 * 
 * Features:
 * - Stay Connected email subscription (connected to Supabase)
 * - Navigation, Resources, Company, Legal links
 * - Payment method icons
 * - Contact email
 * - Admin link (for logged-in admins only)
 * 
 * @timestamp Tuesday, December 10, 2024 - 12:40 AM EST
 * @author Claude (for Roy Henderson)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

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
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Navigation Links
  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'Apps', href: '/apps' },
    { label: 'Games', href: '/games' },
    { label: 'Javari AI', href: '/javari' },
    { label: 'CRAIverse', href: '/craiverse' },
    { label: 'Pricing', href: '/pricing' },
  ];

  // Resource Links
  const resourceLinks = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Help Center', href: '/help' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Tutorials', href: '/tutorials' },
    { label: 'Blog', href: '/blog' },
    { label: 'Status', href: '/status' },
  ];

  // Company Links
  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Meet the Team', href: '/team' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press Kit', href: '/press' },
  ];

  // Legal Links
  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refunds' },
    { label: 'Security', href: '/security' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          
          {/* Company Info with Subscribe - Takes 2 columns */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-lg mb-4">CR AudioViz AI, LLC</h3>
            <p className="text-sm text-gray-400 mb-4">Your Story. Our Design.</p>
            
            {/* Subscribe Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Stay Connected
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Get updates on new releases and features
              </p>
              
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <Button 
                  type="submit" 
                  disabled={subscribeStatus === 'loading'}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-sm py-2"
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

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* Admin link - only visible to admins */}
              {isAdmin && (
                <li>
                  <Link 
                    href="/admin" 
                    className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Payment Methods Bar */}
      <div className="border-t border-gray-800 bg-gray-850">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center items-center gap-4 text-gray-400">
            <span className="text-xs font-medium">Secure Payments:</span>
            
            {/* Stripe */}
            <div className="flex items-center gap-1 text-xs">
              <svg className="w-8 h-5" viewBox="0 0 60 25" fill="currentColor">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.6 10.6 0 0 1-4.56.93c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.39 6.23-7.39 3.97 0 5.97 2.93 5.97 7.3v1.52zm-3.96-2.87c0-1.44-.69-2.76-2.22-2.76-1.41 0-2.32 1.24-2.41 2.76h4.63zM41.17 19.93V.5h4.08v19.43h-4.08zM34.29 19.93V5.68h4.08v14.25h-4.08zm2.04-16.3c-1.29 0-2.33-1.02-2.33-2.28S35.04.5 36.33.5s2.34 1.08 2.34 2.34c0 1.26-1.05 2.28-2.34 2.28zM28.51 19.93V9.57h-1.96V5.68h1.96V3.97c0-3.23 1.85-4.97 5.17-4.97.85 0 1.93.19 2.59.43v3.51c-.43-.19-.96-.28-1.53-.28-1.35 0-2.15.74-2.15 2.08v1.24h3.51v3.89h-3.51v10.36h-4.08v-.3zM18.93 19.93V9.57h-1.96V5.68h1.96V3.97c0-3.23 1.85-4.97 5.17-4.97.85 0 1.93.19 2.59.43v3.51c-.43-.19-.96-.28-1.53-.28-1.35 0-2.15.74-2.15 2.08v1.24h3.51v3.89h-3.51v10.36h-4.08v-.3zM.5 12.56c0-4.64 3.29-7.09 7.64-7.09 1.97 0 3.68.5 4.76 1.1v4.01c-.96-.68-2.5-1.19-4.02-1.19-2.52 0-4.08 1.35-4.08 3.17 0 1.82 1.56 3.17 4.08 3.17 1.52 0 3.06-.51 4.02-1.19v4.01c-1.08.6-2.79 1.1-4.76 1.1C3.79 19.65.5 17.2.5 12.56z"/>
              </svg>
            </div>
            
            {/* PayPal */}
            <div className="flex items-center gap-1 text-xs">
              <svg className="w-12 h-4" viewBox="0 0 100 26" fill="currentColor">
                <path d="M12.5 3h5.6c4.3 0 7.4 2.7 6.7 7.2-.5 3.1-3 5.9-7.2 5.9h-3.5c-.5 0-.9.4-1 .8l-.9 5.5c0 .3-.3.5-.6.5H7.8c-.4 0-.6-.3-.5-.7l3.2-18.5c.1-.4.5-.7 1-.7h1zm4.1 9.2h2.3c1.8 0 3.4-1.2 3.7-3 .3-2-1-3.3-3.1-3.3h-2.1c-.3 0-.5.2-.6.5l-.8 5.3c0 .3.2.5.6.5z"/>
                <path d="M34.5 3h5.6c4.3 0 7.4 2.7 6.7 7.2-.5 3.1-3 5.9-7.2 5.9h-3.5c-.5 0-.9.4-1 .8l-.9 5.5c0 .3-.3.5-.6.5h-3.8c-.4 0-.6-.3-.5-.7l3.2-18.5c.1-.4.5-.7 1-.7zm4.1 9.2h2.3c1.8 0 3.4-1.2 3.7-3 .3-2-1-3.3-3.1-3.3h-2.1c-.3 0-.5.2-.6.5l-.8 5.3c0 .3.2.5.6.5z"/>
              </svg>
            </div>
            
            {/* Visa */}
            <div className="flex items-center text-xs font-bold text-blue-400">
              VISA
            </div>
            
            {/* Mastercard */}
            <div className="flex items-center gap-0">
              <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
              <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80 -ml-2" />
            </div>
            
            {/* Amex */}
            <div className="flex items-center text-xs font-bold text-blue-300">
              AMEX
            </div>
            
            {/* Discover */}
            <div className="flex items-center text-xs font-bold text-orange-400">
              DISCOVER
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© {currentYear} CR AudioViz AI, LLC. All rights reserved.</p>
            
            <div className="flex items-center gap-6">
              <a 
                href="mailto:info@craudiovizai.com" 
                className="flex items-center hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                info@craudiovizai.com
              </a>
              <a 
                href="mailto:support@craudiovizai.com" 
                className="flex items-center hover:text-white transition-colors"
              >
                support@craudiovizai.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
