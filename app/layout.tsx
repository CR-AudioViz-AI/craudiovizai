/**
 * CR AudioViz AI - Root Layout
 * 
 * Complete page structure with:
 * - Header
 * - CR= Bar
 * - Credits Bar
 * - Main content
 * - Social Media Buttons (above footer)
 * - Footer
 * - Javari Widget
 * - CanonicalLink (SEO)
 * 
 * @timestamp Friday, January 02, 2026 - 7:52 PM EST
 * @author Claude (for Roy Henderson)
 */

import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import CRBar from "@/components/layout/CRBar";
import CreditsBar from "@/components/layout/CreditsBar";
import Footer from "@/components/layout/Footer";
import SocialMediaButtons from "@/components/SocialMediaButtons";
import JavariWidget from '@/components/JavariWidget';
import { CanonicalLink } from '@/components/seo/canonical-link';

const inter = Inter({ subsets: ["latin"] });

/**
 * Viewport configuration for mobile-first design
 * CRITICAL: Prevents iOS zoom, enables proper mobile scaling
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://craudiovizai.com'),
  title: "CR AudioViz AI - Create Apps, Games, Websites & More with AI",
  description: "Empower your creativity with AI-powered creative tools, games, and Javari AI assistant. Build apps, websites, games, and digital content with no coding required.",
  keywords: "AI tools, app builder, game creator, website builder, Javari AI, no-code platform, creative tools, CR AudioViz AI",
  authors: [{ name: "CR AudioViz AI, LLC" }],
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CR AudioViz AI',
    title: 'CR AudioViz AI - Your Story. Our Design.',
    description: 'Create apps, games, and websites with AI-powered tools',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'CR AudioViz AI Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@craudiovizai',
    title: 'CR AudioViz AI',
    description: 'Create apps, games, and websites with AI-powered tools',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <CanonicalLink />
        <div className="min-h-screen flex flex-col">
          <Header />
          <CRBar />
          <CreditsBar />
          <main className="flex-grow">
            {children}
          </main>
          <SocialMediaButtons />
          <Footer />
        </div>
        <JavariWidget />
      </body>
    </html>
  );
}
