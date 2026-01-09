'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export default function CreditsBar() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadCredits()
    
    // Listen for credit updates from child iframes
    window.addEventListener('message', handleCreditUpdate)
    return () => window.removeEventListener('message', handleCreditUpdate)
  }, [])

  function handleCreditUpdate(event: MessageEvent) {
    if (event.data.type === 'CREDITS_DEDUCTED') {
      setCredits(event.data.remaining)
    }
  }

  async function loadCredits() {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setLoading(false)
        return
      }

      setUser(user)

      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Fetch credits
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Failed to load credits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not logged in
  if (!user) return null

  return (
    <div className="bg-gradient-to-r from-cyan-500 to-cyan-500 border-b border-cyan-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Credits Display */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-cyan-500">
              <CreditCard className="w-5 h-5 text-cyan-500" />
              <span className="font-semibold text-gray-900">Credits:</span>
              {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <span className="text-2xl font-bold text-cyan-500">
                  {credits?.toLocaleString() || 0}
                </span>
              )}
            </div>

            {/* Low credits warning */}
            {credits !== null && credits < 50 && (
              <span className="text-sm text-cyan-500 font-medium animate-pulse">
                ⚠️ Low balance
              </span>
            )}
          </div>

          {/* Purchase Button */}
          <button
            onClick={() => window.location.href = '/credits/purchase'}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-500 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Purchase More Credits</span>
          </button>
        </div>
      </div>
    </div>
  )
}
