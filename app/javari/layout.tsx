// app/javari/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Javari OS — dedicated layout.
// Overrides the root layout to strip the site header, footer, social bar,
// and floating widget. The OS is a full-screen SCIF terminal — it manages
// its own chrome. Providers is kept for useAuth() to work.
// ─────────────────────────────────────────────────────────────────────────────
import Providers from '@/app/providers'

export default function JavariLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
