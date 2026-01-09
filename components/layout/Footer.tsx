'use client';

/**
 * CR AudioViz AI - FOOTER COMPONENT (COMPACT + ACCESSIBLE)
 * 
 * FIX: Added "site-footer" class for scoped CSS targeting
 * - Compact visual appearance
 * - 44px tap targets via ::after pseudo-elements (handled in CSS)
 * - No inflated line heights
 * 
 * @timestamp January 8, 2026 - SPACING FIX
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
    <footer className="site-footer bg-slate-900" data-testid="site-footer">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-2">
              <span className="text-white font-bold text-xl">CR AudioViz AI</span>
            </Link>
            <p className="text-cyan-400 text-sm font-medium">Your Story. Our Design.</p>
            <p className="text-slate-400 text-sm mt-1.5">AI-powered creative tools for the modern creator.</p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Navigation</h3>
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="footer-link min-h-[44px] py-2 inline-flex items-center text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Support</h3>
            <ul className="space-y-1">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="footer-link min-h-[44px] py-2 inline-flex items-center text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-1">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="footer-link min-h-[44px] py-2 inline-flex items-center text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-slate-400 text-xs">© {currentYear} CR AudioViz AI, LLC. All rights reserved.</p>
            <p className="text-slate-500 text-xs">Made with ❤️ in Fort Myers, Florida</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
