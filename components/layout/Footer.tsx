'use client';

/**
 * CR AudioViz AI - FOOTER COMPONENT
 * 
 * VERY compact - minimal spacing between rows
 * Single line height, tight gaps
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
      {/* Main Footer - VERY tight spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </Link>
            <p className="text-gray-400 text-[11px] leading-tight">Your Story. Our Design.</p>
            <p className="text-gray-500 text-[11px] leading-tight">AI-powered creative tools.</p>
          </div>

          {/* Navigation - TIGHT rows */}
          <div>
            <h3 className="text-white font-semibold text-[11px] mb-1">Navigation</h3>
            <ul className="space-y-0">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="leading-none py-[2px]">
                  <Link href={link.href} className="text-gray-400 hover:text-white text-[11px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support - TIGHT rows */}
          <div>
            <h3 className="text-white font-semibold text-[11px] mb-1">Support</h3>
            <ul className="space-y-0">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href} className="leading-none py-[2px]">
                  <Link href={link.href} className="text-gray-400 hover:text-white text-[11px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal - TIGHT rows */}
          <div>
            <h3 className="text-white font-semibold text-[11px] mb-1">Legal</h3>
            <ul className="space-y-0">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href} className="leading-none py-[2px]">
                  <Link href={link.href} className="text-gray-400 hover:text-white text-[11px]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright - minimal */}
      <div className="bg-slate-900/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-0.5 text-center sm:text-left">
            <p className="text-gray-500 text-[10px]">© {currentYear} CR AudioViz AI, LLC. All rights reserved.</p>
            <p className="text-gray-600 text-[10px]">Made with ❤️ in Fort Myers, Florida</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
