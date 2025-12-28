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
 * 
 * @timestamp Tuesday, December 10, 2024 - 12:45 AM EST
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

const inter = Inter({ subsets: ["latin"] });

/**
 * Viewport configuration for mobile-first design
 * CRITICAL: Prevents iOS zoom, enables proper mobile scaling
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility, but controlled
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export const metadata: Metadata = {
  title: "CR AudioViz AI - Create Apps, Games, Websites & More with AI",
  description: "Empower your creativity with AI-powered creative tools, games, and Javari AI assistant. Build apps, websites, games, and digital content with no coding required.",
  keywords: "AI tools, app builder, game creator, website builder, Javari AI, no-code platform, creative tools, CR AudioViz AI",
  authors: [{ name: "CR AudioViz AI, LLC" }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CR AudioViz AI',
    title: 'CR AudioViz AI - Your Story. Our Design.',
    description: 'Create apps, games, and websites with AI-powered tools',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CR AudioViz AI Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CR AudioViz AI',
    description: 'Create apps, games, and websites with AI-powered tools',
    images: ['/twitter-image.png'],
    creator: '@craudiovizai',
  },
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
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        {/* Mobile-optimized header */}
        <Header />
        
        {/* Top bars */}
        <CRBar />
        <CreditsBar />
        
        {/* Main content with safe area insets for notch devices */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Social Media Buttons - Above Footer */}
        <SocialMediaButtons />
        
        {/* Footer */}
        <Footer />
        
        {/* Javari AI Chat Widget - Floating button */}
        <JavariWidget />
        
        {/* Analytics (add your tracking here) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics example - replace with your ID */}
            {/* <Script
              src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX');
              `}
            </Script> */}
          </>
        )}
      </body>
    </html>
  );
}

