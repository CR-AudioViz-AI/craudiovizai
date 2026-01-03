import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { CreditsProvider } from '@/components/providers/credits-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CanonicalLink } from '@/components/seo/canonical-link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://craudiovizai.com'),
  title: {
    default: 'CR AudioViz AI - Your Story. Our Design.',
    template: '%s | CR AudioViz AI',
  },
  description: 'Professional AI-powered creative platform with comprehensive tools, games, and social impact programs. Your Story. Our Design.',
  keywords: ['AI', 'creative tools', 'design', 'audio', 'visualization', 'Javari AI', 'no-code platform'],
  authors: [{ name: 'CR AudioViz AI, LLC' }],
  creator: 'CR AudioViz AI, LLC',
  publisher: 'CR AudioViz AI, LLC',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://craudiovizai.com',
    siteName: 'CR AudioViz AI',
    title: 'CR AudioViz AI - Your Story. Our Design.',
    description: 'Professional AI-powered creative platform with comprehensive tools, games, and social impact programs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CR AudioViz AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CR AudioViz AI - Your Story. Our Design.',
    description: 'Professional AI-powered creative platform.',
    images: ['/og-image.png'],
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
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CreditsProvider>
              <CanonicalLink />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </CreditsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
