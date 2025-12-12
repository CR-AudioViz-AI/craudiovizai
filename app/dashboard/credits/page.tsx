// app/dashboard/credits/page.tsx
// Credits Purchase Page - Buy credit packs
// Timestamp: Dec 11, 2025 10:02 PM EST

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Coins, Check, Sparkles, Gift, Zap, Crown, AlertCircle, CheckCircle } from 'lucide-react';
import UnifiedCheckout from '@/components/payments/UnifiedCheckout';

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

export default function CreditsPage() {
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

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 border-blue-200 hover:border-blue-400',
    green: 'from-green-500 to-green-600 border-green-200 hover:border-green-400',
    purple: 'from-purple-500 to-purple-600 border-purple-200 hover:border-purple-400',
    orange: 'from-orange-500 to-orange-600 border-orange-200 hover:border-orange-400',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Coins className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Buy Credits</h1>
          <p className="text-blue-100 text-lg">Power your creativity with CR AudioViz AI credits</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Success/Error Notifications */}
        {showSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-800">Payment Successful!</p>
              <p className="text-green-600">Your credits have been added to your account.</p>
            </div>
          </div>
        )}
        
        {showError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">Payment Canceled</p>
              <p className="text-red-600">Your payment was canceled. Please try again.</p>
            </div>
          </div>
        )}

        {/* Credits Never Expire Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl text-center">
          <p className="text-lg font-semibold text-green-800">
            ✨ Credits Never Expire on Paid Plans! ✨
          </p>
          <p className="text-green-600 mt-1">Use them whenever you're ready - no rush, no pressure.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Credit Packs */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Pack</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CREDIT_PACKS.map((pack) => {
                const Icon = pack.icon;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                      selectedPack?.id === pack.id
                        ? `border-${pack.color}-500 ring-2 ring-${pack.color}-200 shadow-lg`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    
                    {pack.savings && (
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                        SAVE {pack.savings}
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[pack.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{pack.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{pack.description}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900">{pack.credits.toLocaleString()}</span>
                          <span className="text-gray-500">credits</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">${pack.price}</p>
                        <p className="text-xs text-gray-400">${(pack.price / pack.credits * 100).toFixed(1)}¢ per credit</p>
                      </div>
                      
                      {selectedPack?.id === pack.id && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* What Credits Can Do */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">What Can You Create?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">10 credits</p>
                  <p className="text-gray-500">AI Image</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">25 credits</p>
                  <p className="text-gray-500">Video Clip</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">15 credits</p>
                  <p className="text-gray-500">Music Track</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">5 credits</p>
                  <p className="text-gray-500">Voice Clone</p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-1">
            {selectedPack && userId ? (
              <UnifiedCheckout
                type="credits"
                itemId={selectedPack.id}
                itemName={selectedPack.name}
                amount={selectedPack.price}
                credits={selectedPack.credits}
                userId={userId}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Pack</h3>
                <p className="text-gray-500">Choose a credit pack from the left to continue with checkout.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
