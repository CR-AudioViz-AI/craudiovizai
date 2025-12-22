'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

// OAuth Provider type
type OAuthProvider = 'google' | 'github' | 'apple' | 'azure' | 'discord' | 'twitter'

// Inner component that uses useSearchParams
function LoginForm() {
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const provider = searchParams.get('provider')
  const appId = searchParams.get('app') || 'main'
  const returnUrl = searchParams.get('return') || '/'

  useEffect(() => {
    if (provider && ['google', 'github', 'apple', 'azure', 'discord', 'twitter'].includes(provider)) {
      handleOAuth(provider as OAuthProvider)
    }
  }, [provider])

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoading(provider)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?return=${encodeURIComponent(returnUrl)}&app=${appId}`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(null)
      }
    } catch (err: any) {
      setError(err.message || 'OAuth failed')
      setLoading(null)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading('email')
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?return=${encodeURIComponent(returnUrl)}&app=${appId}`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setEmailSent(true)
    }
    setLoading(null)
  }

  if (emailSent) {
    return (
      <div className="max-w-md w-full p-8 bg-stone-900/80 backdrop-blur rounded-2xl border border-stone-700 text-center">
        <div className="text-6xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-stone-400 mb-6">
          We sent a magic link to <span className="text-amber-500">{email}</span>
        </p>
        <button onClick={() => setEmailSent(false)} className="text-amber-500 hover:underline">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full p-8 bg-stone-900/80 backdrop-blur rounded-2xl border border-stone-700">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🎨</div>
        <h1 className="text-2xl font-bold text-white">CR AudioViz AI</h1>
        <p className="text-stone-400 mt-1">One account for all 60+ creative tools</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* PRIMARY OAuth Providers */}
      <div className="space-y-3 mb-4">
        {/* Google */}
        <button
          onClick={() => handleOAuth('google')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* GitHub */}
        <button
          onClick={() => handleOAuth('github')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
        </button>

        {/* Apple */}
        <button
          onClick={() => handleOAuth('apple')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:opacity-50 transition border border-stone-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {loading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
        </button>

        {/* Microsoft */}
        <button
          onClick={() => handleOAuth('azure')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#2F2F2F] text-white font-medium rounded-xl hover:bg-[#404040] disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          {loading === 'azure' ? 'Connecting...' : 'Continue with Microsoft'}
        </button>
      </div>

      {/* SECONDARY OAuth Providers (collapsible or smaller) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Discord */}
        <button
          onClick={() => handleOAuth('discord')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5865F2] text-white font-medium rounded-xl hover:bg-[#4752C4] disabled:opacity-50 transition text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
          </svg>
          {loading === 'discord' ? '...' : 'Discord'}
        </button>

        {/* Twitter/X */}
        <button
          onClick={() => handleOAuth('twitter')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-900 disabled:opacity-50 transition text-sm border border-stone-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          {loading === 'twitter' ? '...' : 'X (Twitter)'}
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-stone-900 text-stone-500">or use email</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
          required
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 transition"
        >
          {loading === 'email' ? 'Sending Link...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-700">
        <p className="text-xs text-stone-500 text-center mb-4">One account gives you access to:</p>
        <div className="flex justify-center gap-4 text-2xl">
          <span title="Javari AI">🤖</span>
          <span title="CRAVBarrels">🥃</span>
          <span title="CardVerse">🃏</span>
          <span title="Games">🎮</span>
          <span title="CRAIverse">🌍</span>
          <span title="Realtor Platform">🏠</span>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-stone-500">
        By signing in, you agree to our{' '}
        <Link href="/terms" className="text-amber-500 hover:underline">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="max-w-md w-full p-8 bg-stone-900/80 backdrop-blur rounded-2xl border border-stone-700 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-stone-400">Loading...</p>
    </div>
  )
}

// Main page with Suspense
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
