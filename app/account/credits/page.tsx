// app/account/credits/page.tsx
// CR AudioViz AI — Credits balance page.
// Uses Supabase session access_token to authenticate /api/credits/balance.
// Updated: March 21, 2026 — Fixed auth header, post-purchase confirmation.
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface BalanceData {
  total:             number
  used_this_month:   number
  monthly_allowance: number
  bonus_credits:     number
  plan:              string
  is_admin:          boolean
}

const PACK_NAMES: Record<string, string> = {
  '50':   'Starter Pack (50 credits)',
  '150':  'Creator Pack (150 credits)',
  '525':  'Pro Pack (525 credits)',
  '1300': 'Studio Pack (1,300 credits)',
}

function CreditsPageContent() {
  const supabase      = createClientComponentClient()
  const searchParams  = useSearchParams()
  const isSuccess     = searchParams.get('success') === '1'
  const purchasedPack = searchParams.get('pack') ?? null

  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [data,    setData]    = useState<BalanceData | null>(null)

  useEffect(() => {
    async function loadBalance() {
      try {
        setLoading(true)
        setError(null)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
          throw new Error('Not authenticated — please sign in')
        }

        const res = await fetch('/api/credits/balance', {
          method:  'GET',
          headers: { Authorization:  },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || )
        }

        const json = await res.json()
        setData(json)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadBalance()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Post-purchase confirmation */}
        {isSuccess && (
          <div className="mb-8 rounded-2xl bg-green-50 border border-green-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-900">Credits added successfully!</p>
                {purchasedPack && PACK_NAMES[purchasedPack] && (
                  <p className="text-sm text-green-700 mt-0.5">
                    {PACK_NAMES[purchasedPack]} has been added to your balance.
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1">
                  Credits never expire on paid plans. Start using them right now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balance card */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Your Credits</h1>

          {loading && (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-100 rounded w-32"/>
              <div className="h-4 bg-gray-100 rounded w-48"/>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
              <a href="/login" className="text-xs text-red-600 underline mt-1 block">
                Sign in to view your credits
              </a>
            </div>
          )}

          {!loading && !error && data && (
            <div>
              <p className="text-4xl font-bold text-indigo-600 tabular-nums">
                {data.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">credits available</p>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Used this month</p>
                  <p className="font-medium text-gray-700">{data.used_this_month.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Monthly allowance</p>
                  <p className="font-medium text-gray-700">{data.monthly_allowance.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium uppercase tracking-wide">
                  {data.plan}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Buy more credits */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Top up your credits</h2>
          <p className="text-sm text-gray-500 mb-4">One-time purchase. Credits never expire on paid plans.</p>

          <div className="space-y-2">
            {([
              { pack: '150',  label: 'Creator Pack',  credits: 150,  price: '$12.99', badge: 'Most Popular' },
              { pack: '525',  label: 'Pro Pack',       credits: 525,  price: '$39.99', badge: 'Best Value'   },
              { pack: '1300', label: 'Studio Pack',    credits: 1300, price: '$89.99', badge: 'Power User'   },
            ] as const).map(({ pack, label, credits, price, badge }) => (
              <a
                key={pack}
                href={`/pricing?buy_pack=${pack}`}
                className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{label}</span>
                    <span className="text-xs bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 px-2 py-0.5 rounded-full transition">
                      {badge}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{credits.toLocaleString()} credits</div>
                </div>
                <span className="font-bold text-gray-700 group-hover:text-indigo-600 transition">{price}</span>
              </a>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="/pricing" className="text-sm text-indigo-600 hover:underline">
              Compare subscription plans →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 animate-pulse"/>}>
      <CreditsPageContent />
    </Suspense>
  )
}
