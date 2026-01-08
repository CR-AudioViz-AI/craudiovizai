'use client';

/**
 * CR AudioViz AI - FOOTER COMPONENT
 * 
 * - TIGHT spacing - NO double spacing
 * - Larger fonts but compact layout
 * - Links directly stacked with minimal gap
 * 
 * @timestamp January 8, 2026
 */

import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Apps', href: '/apps' },
  { label: 'Games', href: '/games' },
  { label: 'Javari AI', href: '/javari' },
  { label: 'JavariVerse', href: '/javari-verse' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'DMCA', href: '/dmca' },
  { label: 'Accessibility', href: '/accessibility' },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '/support' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Documentation', href: '/docs' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-white/10" data-testid="site-footer">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <span className="text-white font-semibold text-sm">CR AudioViz AI</span>
            </Link>
            <p className="text-gray-400 text-xs">Your Story. Our Design.</p>
            <p className="text-gray-500 text-xs">AI-powered creative tools.</p>
          </div>

          {/* Navigation - SINGLE SPACED, larger font */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">Navigation</h3>
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block text-gray-400 hover:text-white text-sm leading-[1.4]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Support - SINGLE SPACED, larger font */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">Support</h3>
            {SUPPORT_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block text-gray-400 hover:text-white text-sm leading-[1.4]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Legal - SINGLE SPACED, larger font */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">Legal</h3>
            {LEGAL_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block text-gray-400 hover:text-white text-sm leading-[1.4]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
            <p className="text-gray-400 text-xs">© {currentYear} CR AudioViz AI, LLC. All rights reserved.</p>
            <p className="text-gray-500 text-xs">Made with ❤️ in Fort Myers, Florida</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
