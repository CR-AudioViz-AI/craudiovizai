// app/providers.tsx
// Global auth provider for CR AudioViz AI.
// Shares Supabase session, user, credits, and plan across all components.
// Uses @supabase/auth-helpers-nextjs — no additional packages required.
// Updated: March 22, 2026
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User, Session } from '@supabase/supabase-js'

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthState {
  user:        User | null
  session:     Session | null
  credits:     number | null
  plan:        string
  isAdmin:     boolean
  loading:     boolean
  signOut:     () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user:        null,
  session:     null,
  credits:     null,
  plan:        'free',
  isAdmin:     false,
  loading:     true,
  signOut:     async () => {},
  refreshAuth: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────
export default function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()

  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [plan,    setPlan]    = useState<string>('free')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAuth = useCallback(async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)
      setUser(s?.user ?? null)

      if (!s?.user) {
        setCredits(null)
        setPlan('free')
        setIsAdmin(false)
        return
      }

      // Fetch credits from billing authority (usage_ledger-based)
      try {
        const res = await fetch('/api/credits/balance', {
          headers: { Authorization: `Bearer ${s.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCredits(data.total ?? 0)
          setPlan(data.plan ?? 'free')
          setIsAdmin(data.is_admin ?? false)
        }
      } catch {
        // Non-fatal — credits display degrades gracefully
        setCredits(0)
      }
    } catch (err) {
      console.error('[Providers] auth load error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        loadAuth()
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, loadAuth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCredits(null)
    setPlan('free')
    setIsAdmin(false)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{
      user, session, credits, plan, isAdmin, loading,
      signOut, refreshAuth: loadAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
