// components/payments/UnifiedCheckout.tsx
// Unified Payment Checkout - Stripe + PayPal
// Timestamp: Dec 11, 2025 9:57 PM EST

'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UnifiedCheckoutProps {
  type: 'credits' | 'subscription';
  itemId: string;
  itemName: string;
  amount: number;
  credits?: number;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function UnifiedCheckout({
  type,
  itemId,
  itemName,
  amount,
  credits,
  userId,
  onSuccess,
  onError,
}: UnifiedCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleStripeCheckout = async () => {
    setLoading(true);
    setStatus('processing');
    
    try {
      const endpoint = type === 'subscription' 
        ? '/api/stripe/create-subscription-session'
        : '/api/stripe/create-checkout-session';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: itemId,
          userId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Stripe checkout failed';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalCheckout = async () => {
    setLoading(true);
    setStatus('processing');
    
    try {
      const endpoint = type === 'subscription'
        ? '/api/paypal/subscriptions'
        : '/api/paypal/orders';
      
      const body = type === 'subscription'
        ? { planId: itemId, userId }
        : { packId: itemId, userId };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error(data.error || 'Failed to create PayPal order');
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'PayPal checkout failed';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === 'stripe') {
      handleStripeCheckout();
    } else if (paymentMethod === 'paypal') {
      handlePayPalCheckout();
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-600">Your {type === 'subscription' ? 'subscription' : 'credits'} have been processed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Order Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Order Summary</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">{itemName}</p>
            {credits && (
              <p className="text-blue-100 text-sm">{credits.toLocaleString()} credits</p>
            )}
          </div>
          <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Select Payment Method</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Stripe Option */}
          <button
            onClick={() => setPaymentMethod('stripe')}
            disabled={loading}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'stripe'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
              paymentMethod === 'stripe' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <p className="font-semibold text-gray-800">Card</p>
            <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
          </button>

          {/* PayPal Option */}
          <button
            onClick={() => setPaymentMethod('paypal')}
            disabled={loading}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'paypal'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Wallet className={`w-8 h-8 mx-auto mb-2 ${
              paymentMethod === 'paypal' ? 'text-yellow-600' : 'text-gray-400'
            }`} />
            <p className="font-semibold text-gray-800">PayPal</p>
            <p className="text-xs text-gray-500">Pay with PayPal balance</p>
          </button>
        </div>

        {/* Error Message */}
        {status === 'error' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={!paymentMethod || loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            paymentMethod && !loading
              ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'stripe' && <CreditCard className="w-5 h-5" />}
              {paymentMethod === 'paypal' && <Wallet className="w-5 h-5" />}
              {paymentMethod ? `Pay $${amount.toFixed(2)}` : 'Select Payment Method'}
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>🔒 Secure checkout powered by Stripe & PayPal</p>
          <p className="mt-1">Your payment information is encrypted and secure.</p>
        </div>
      </div>

      {/* Credits Never Expire Badge */}
      {type === 'credits' && (
        <div className="bg-green-50 border-t border-green-200 px-6 py-3 text-center">
          <p className="text-green-700 font-semibold text-sm">
            ✨ Credits Never Expire on Paid Plans!
          </p>
        </div>
      )}
    </div>
  );
}

export default UnifiedCheckout;
