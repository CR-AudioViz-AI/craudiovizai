// Subscription Success Page
// Timestamp: January 1, 2026 - 3:40 PM EST

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, BookOpen, Headphones, Zap, 
  Download, Crown, ArrowRight, Sparkles
} from 'lucide-react'

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // Verify the session and get subscription details
      fetch(`/api/subscriptions/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSubscription(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6 animate-pulse">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Javari Library! 🎉
          </h1>
          
          <p className="text-xl text-gray-300">
            Your subscription is now active. You have full access to our entire library.
          </p>
        </div>

        {/* What You Get */}
        <div className="bg-gray-800/50 rounded-2xl border border-purple-500/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            What You Now Have Access To
          </h2>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">160+ Professional eBooks</h3>
                <p className="text-gray-400 text-sm">
                  Full access to our complete library covering AI, business, legal, real estate, and more
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Audiobook Streaming</h3>
                <p className="text-gray-400 text-sm">
                  Listen to any title in our library with our built-in audio player
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Monthly Platform Credits</h3>
                <p className="text-gray-400 text-sm">
                  Your credits have been added and will refresh monthly
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Download for Offline</h3>
                <p className="text-gray-400 text-sm">
                  Download any eBook for offline reading on any device
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">All New Releases Included</h3>
                <p className="text-gray-400 text-sm">
                  Every new eBook we publish is automatically included in your subscription
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/30 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Start Guide</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
              <span>Browse the library and find topics that interest you</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
              <span>Click any title to start reading immediately</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</span>
              <span>Download for offline reading or switch to audiobook mode</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">4</span>
              <span>Use your credits across the CR AudioViz AI platform</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/apps/javari-library"
            className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <BookOpen className="w-5 h-5" />
            Browse Library
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href="/dashboard"
            className="flex-1 py-4 px-6 bg-gray-700 text-white font-bold rounded-xl text-center hover:bg-gray-600 transition"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Support Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Questions? Contact us at support@craudiovizai.com
        </p>
      </div>
    </div>
  )
}
