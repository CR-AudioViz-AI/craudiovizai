// app/login/page.tsx
// CR AudioViz AI — Login / Sign-up page.
// OAuth providers: Google (primary), Apple (primary), GitHub (dev).
// Email/password: secondary option below OAuth buttons.
// Updated: March 21, 2026 — OAuth auth system.
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

const BILLING_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://craudiovizai.com'

// OAuth provider configs — order = visual priority
const OAUTH_PROVIDERS = [
  {
    id:      'google' as const,
    label:   'Continue with Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    bg:    'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700',
    dark:  false,
  },
  {
    id:      'apple' as const,
    label:   'Continue with Apple',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    bg:    'bg-black hover:bg-gray-900 text-white',
    dark:  true,
  },
  {
    id:      'github' as const,
    label:   'Continue with GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
    bg:    'bg-gray-900 hover:bg-gray-800 text-white',
    dark:  true,
  },
]

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const supabase = createClient()

  async function handleOAuth(provider: 'google' | 'apple' | 'github') {
    setLoading(provider)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${BILLING_BASE}/api/auth/callback?redirect_to=/dashboard`,
        // Request profile scopes for all providers
        scopes: provider === 'github' ? 'read:user user:email' : undefined,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(null)
    }
    // On success: browser redirects to Supabase, then to /api/auth/callback
  }

  return (
    <div className="min-h-[calc(100vh-300px)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to continue to your account</p>
        </div>

        {/* OAuth buttons */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8 space-y-3">

          {OAUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleOAuth(provider.id)}
              disabled={loading !== null}
              className={`
                w-full flex items-center justify-center gap-3
                rounded-xl px-4 py-3 font-medium text-sm
                transition duration-150 relative
                ${provider.bg}
                ${loading !== null ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {loading === provider.id ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : provider.icon}
              {provider.label}
            </button>
          ))}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-700/40 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"/>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-800/50 text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email/password fallback */}
          <div className="space-y-2">
            <a
              href="/login/email"
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Sign in with Email
            </a>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 pt-2">
            By continuing, you agree to our{' '}
            <a href="/legal/terms" className="underline hover:text-gray-300">Terms</a>
            {' '}and{' '}
            <a href="/legal/privacy" className="underline hover:text-gray-300">Privacy Policy</a>.
          </p>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign up free
          </a>
        </p>
      </motion.div>
    </div>
  )
}
