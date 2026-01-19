import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Javari AI - Your Story. Our Design.',
  description: 'The ultimate AI-powered creative ecosystem',
  icons: {
    icon: '/logos/javari/javari-glyph-32.png',
    apple: '/logos/javari/javari-glyph-512.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
