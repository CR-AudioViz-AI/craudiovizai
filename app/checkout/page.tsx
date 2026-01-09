// /app/checkout/page.tsx
// Unified Checkout Page - CR AudioViz AI
// Timestamp: January 1, 2026 - 6:14 PM EST

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CreditCard, Shield, Lock, Check, Loader2, 
  ArrowLeft, Zap, Star, Gift
} from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// PRICING DATA
// =============================================================================

const PLANS = {
  starter: {
    name: 'Starter',
    price: 9,
    credits: 100,
    features: ['100 AI credits/month', 'Basic tools access', 'Email support'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  creator: {
    name: 'Creator',
    price: 29,
    credits: 500,
    popular: true,
    features: ['500 AI credits/month', 'All creative tools', 'Priority support', 'Custom exports'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID,
  },
  professional: {
    name: 'Professional',
    price: 79,
    credits: 2000,
    features: ['2,000 AI credits/month', 'All tools + API access', 'White-label exports', 'Dedicated support'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  business: {
    name: 'Business',
    price: 199,
    credits: 10000,
    features: ['10,000 AI credits/month', 'Team management', 'Analytics dashboard', 'SLA guarantee'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
  },
};

const CREDIT_PACKS = {
  small: { credits: 50, price: 5, bonus: 0 },
  medium: { credits: 200, price: 15, bonus: 20 },
  large: { credits: 500, price: 35, bonus: 75 },
  xl: { credits: 1000, price: 60, bonus: 200 },
};

// =============================================================================
// CHECKOUT COMPONENT
// =============================================================================

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutType, setCheckoutType] = useState<'subscription' | 'credits'>('subscription');

  useEffect(() => {
    const plan = searchParams.get('plan');
    const type = searchParams.get('type');
    
    if (plan && PLANS[plan as keyof typeof PLANS]) {
      setSelectedPlan(plan);
      setCheckoutType('subscription');
    }
    if (type === 'credits') {
      setCheckoutType('credits');
    }
  }, [searchParams]);

  const handleStripeCheckout = async (priceId: string, mode: 'subscription' | 'payment') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalCheckout = async (amount: number, description: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          returnUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
        }),
      });

      const data = await response.json();

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        setError(data.error || 'Failed to create PayPal order');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Complete Your Purchase</h1>
          <p className="text-slate-400 text-lg">Choose your plan and payment method</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setCheckoutType('subscription')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                checkoutType === 'subscription'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setCheckoutType('credits')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                checkoutType === 'credits'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Credit Packs
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {checkoutType === 'subscription' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`relative bg-slate-800/50 rounded-2xl border transition-all cursor-pointer ${
                  selectedPlan === key
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                } ${plan.popular ? 'ring-2 ring-cyan-500/30' : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span>{plan.credits.toLocaleString()} credits</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Credit Packs */}
        {checkoutType === 'credits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {Object.entries(CREDIT_PACKS).map(([key, pack]) => (
              <div
                key={key}
                className={`bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all p-6 cursor-pointer`}
                onClick={() => handleStripeCheckout(`credit_pack_${key}`, 'payment')}
              >
                <div className="flex items-center justify-between mb-4">
                  <Gift className="w-8 h-8 text-cyan-400" />
                  {pack.bonus > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-500 text-xs font-bold px-2 py-1 rounded">
                      +{pack.bonus} BONUS
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {pack.credits.toLocaleString()}
                </div>
                <div className="text-slate-400 text-sm mb-4">credits</div>
                <div className="text-2xl font-bold text-cyan-400">${pack.price}</div>
                {pack.bonus > 0 && (
                  <div className="text-sm text-cyan-500 mt-2">
                    Total: {(pack.credits + pack.bonus).toLocaleString()} credits
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payment Buttons */}
        {selectedPlan && checkoutType === 'subscription' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={() => {
                const plan = PLANS[selectedPlan as keyof typeof PLANS];
                if (plan.stripePriceId) {
                  handleStripeCheckout(plan.stripePriceId, 'subscription');
                }
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay with Card
                </>
              )}
            </button>

            <button
              onClick={() => {
                const plan = PLANS[selectedPlan as keyof typeof PLANS];
                handlePayPalCheckout(plan.price, `${plan.name} Plan - Monthly Subscription`);
              }}
              disabled={isLoading}
              className="w-full bg-[#0070ba] hover:bg-[#003087] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="font-bold italic">Pay</span>
                  <span className="font-bold text-[#00a1e4] italic">Pal</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 pt-4 text-slate-400 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>30-day guarantee</span>
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm mb-4">Trusted payment processing</p>
          <div className="flex items-center justify-center gap-8 opacity-50">
            <span className="text-white font-bold">STRIPE</span>
            <span className="text-[#003087] font-bold">PayPal</span>
            <span className="text-slate-300">🔒 SSL Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
