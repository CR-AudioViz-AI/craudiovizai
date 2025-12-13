// app/dashboard/credits/page.tsx
// Credits Purchase Page - Buy credit packs
// Timestamp: Dec 13, 2025 - Fixed useSearchParams Suspense boundary
// Fix: Wrap useSearchParams in Suspense to prevent static generation errors

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Coins, Check, Sparkles, Gift, Zap, Crown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import UnifiedCheckout from '@/components/payments/UnifiedCheckout';

// Force dynamic rendering to handle useSearchParams properly
export const dynamic = 'force-dynamic';

const CREDIT_PACKS = [
  { 
    id: 'small', 
    name: 'Starter Pack', 
    credits: 50, 
    price: 4.99, 
    popular: false,
    description: 'Perfect for trying out our tools',
    icon: Sparkles,
    color: 'blue'
  },
  { 
    id: 'medium', 
    name: 'Creator Pack', 
    credits: 150, 
    price: 12.99, 
    popular: true,
    description: 'Most popular choice',
    icon: Zap,
    color: 'green',
    savings: '13%'
  },
  { 
    id: 'large', 
    name: 'Pro Pack', 
    credits: 500, 
    price: 39.99, 
    popular: false,
    description: 'For serious creators',
    icon: Crown,
    color: 'purple',
    savings: '20%'
  },
  { 
    id: 'xl', 
    name: 'Enterprise Pack', 
    credits: 1200, 
    price: 89.99, 
    popular: false,
    description: 'Best value for teams',
    icon: Gift,
    color: 'orange',
    savings: '25%'
  },
];

// Inner component that uses searchParams
function CreditsContent() {
  const searchParams = useSearchParams();
  const [selectedPack, setSelectedPack] = useState<typeof CREDIT_PACKS[0] | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Get user ID from session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setUserId(data.user?.id || ''))
      .catch(console.error);

    // Check for success/error from payment redirect
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get('canceled') === 'true') {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }, [searchParams]);

  const handlePurchase = async (packId: string) => {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (pack) {
      setSelectedPack(pack);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full mb-4">
            <Coins className="w-5 h-5" />
            <span className="font-medium">Purchase Credits</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Power Your Creative Journey
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Credits unlock all 60+ professional tools. Buy once, use anywhere in the ecosystem.
          </p>
        </div>

        {/* Success/Error Messages */}
        {showSuccess && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Purchase Successful!</p>
              <p className="text-green-300/70 text-sm">Your credits have been added to your account.</p>
            </div>
          </div>
        )}

        {showError && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Purchase Canceled</p>
              <p className="text-red-300/70 text-sm">No charges were made. Feel free to try again.</p>
            </div>
          </div>
        )}

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKS.map((pack) => {
            const Icon = pack.icon;
            const colorClasses: Record<string, string> = {
              blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40',
              green: 'from-green-500/20 to-green-600/5 border-green-500/20 hover:border-green-400/40',
              purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 hover:border-purple-400/40',
              orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-400/40',
            };
            const iconColors: Record<string, string> = {
              blue: 'text-blue-400',
              green: 'text-green-400',
              purple: 'text-purple-400',
              orange: 'text-orange-400',
            };

            return (
              <div
                key={pack.id}
                className={`relative bg-gradient-to-b ${colorClasses[pack.color]} border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                onClick={() => handlePurchase(pack.id)}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                {pack.savings && (
                  <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded">
                    SAVE {pack.savings}
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center mb-4 ${iconColors[pack.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pack.description}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-white">{pack.credits}</span>
                  <span className="text-gray-400">credits</span>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl font-bold text-white">${pack.price}</span>
                  <span className="text-gray-400 text-sm">one-time</span>
                </div>

                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  pack.popular 
                    ? 'bg-green-500 hover:bg-green-400 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  Select Pack
                </button>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">What You Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Credits Never Expire', desc: 'Use them whenever you want on paid plans' },
              { title: '60+ Professional Tools', desc: 'PDF, images, video, audio, and more' },
              { title: 'Instant Delivery', desc: 'Credits added immediately after purchase' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPack && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Complete Purchase</h2>
            <p className="text-gray-400 mb-6">
              {selectedPack.name} - {selectedPack.credits} credits for ${selectedPack.price}
            </p>
            <UnifiedCheckout
              productId={`credits-${selectedPack.id}`}
              amount={selectedPack.price}
              productName={selectedPack.name}
              onSuccess={() => {
                setSelectedPack(null);
                setShowSuccess(true);
              }}
              onCancel={() => setSelectedPack(null)}
            />
            <button
              onClick={() => setSelectedPack(null)}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function CreditsLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading credits page...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function CreditsPage() {
  return (
    <Suspense fallback={<CreditsLoading />}>
      <CreditsContent />
    </Suspense>
  );
}
