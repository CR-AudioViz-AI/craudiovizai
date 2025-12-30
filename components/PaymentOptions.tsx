// /components/PaymentOptions.tsx
// Dual Payment Provider Component - CR AudioViz AI
// ALWAYS offer both Stripe AND PayPal - user's choice

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface PaymentOptionsProps {
  amount: number; // In dollars
  productId?: string;
  tierId?: string;
  billingCycle?: 'monthly' | 'yearly';
  credits?: number;
  mode: 'subscription' | 'payment';
  userId?: string;
  onSuccess?: (provider: string, transactionId: string) => void;
  onError?: (error: string) => void;
}

type PaymentProvider = 'stripe' | 'paypal';

// =============================================================================
// PAYMENT OPTIONS COMPONENT
// =============================================================================

export function PaymentOptions({
  amount,
  productId,
  tierId,
  billingCycle,
  credits,
  mode,
  userId,
  onSuccess,
  onError
}: PaymentOptionsProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          tierId,
          billingCycle,
          productId,
          userId,
          credits
        })
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          amount,
          tierId,
          billingCycle,
          productId,
          userId,
          credits
        })
      });

      const { approvalUrl, error } = await response.json();
      if (error) throw new Error(error);
      if (approvalUrl) window.location.href = approvalUrl;
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedProvider === 'stripe') {
      handleStripeCheckout();
    } else if (selectedProvider === 'paypal') {
      handlePayPalCheckout();
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Choose payment method:
        </p>

        {/* Stripe Option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setSelectedProvider('stripe')}
          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
            selectedProvider === 'stripe'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          {/* Radio */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selectedProvider === 'stripe' ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selectedProvider === 'stripe' && (
              <div className="w-3 h-3 rounded-full bg-blue-600" />
            )}
          </div>

          {/* Stripe Logo */}
          <div className="flex items-center gap-3">
            <svg className="h-8 w-auto" viewBox="0 0 60 25" fill="none">
              <path d="M59.64 14.28c0-4.77-2.31-8.54-6.74-8.54-4.45 0-7.12 3.77-7.12 8.5 0 5.61 3.17 8.45 7.72 8.45 2.22 0 3.9-.5 5.17-1.21v-3.74c-1.27.64-2.73 1.03-4.58 1.03-1.81 0-3.42-.64-3.63-2.83h9.14c0-.24.04-1.21.04-1.66zm-9.24-1.77c0-2.1 1.29-2.98 2.46-2.98 1.14 0 2.35.88 2.35 2.98h-4.81z" fill="#635BFF"/>
              <path d="M38.39 5.74c-1.83 0-3.01.86-3.67 1.46l-.24-1.16h-4.14v21.39l4.71-.99.01-5.19c.67.48 1.66 1.17 3.29 1.17 3.33 0 6.37-2.68 6.37-8.58-.01-5.4-3.09-8.1-6.33-8.1zm-1.11 12.44c-1.1 0-1.74-.39-2.19-.87l-.02-6.87c.48-.54 1.14-.91 2.21-.91 1.69 0 2.86 1.9 2.86 4.31 0 2.47-1.15 4.34-2.86 4.34z" fill="#635BFF"/>
              <path d="M25.4 4.48l4.73-1.01V0l-4.73 1v3.48zM25.4 5.97h4.73v16.3H25.4V5.97zM20.76 7.59l-.3-1.62h-4.05v16.3h4.71V11.4c1.11-1.45 3-1.19 3.59-.98V5.97c-.61-.23-2.84-.66-3.95 1.62zM11.32 2.35l-4.6.98-.02 14.93c0 2.76 2.07 4.79 4.83 4.79 1.53 0 2.65-.28 3.27-.61v-3.82c-.6.24-3.56 1.11-3.56-1.67V9.73h3.56V5.97h-3.56l.08-3.62zM0 10.05c0-.64.53-1.03 1.4-1.03 1.25 0 2.83.38 4.08 1.06V5.79C4.11 5.34 2.77 5.1 1.4 5.1 -1.08 5.1 0 7.51 0 10.05c0 3.47 2.47 4.64 4.08 4.64v-4.43c-1.4 0-4.08-.58-4.08-.21z" fill="#635BFF"/>
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard, Amex, Discover</p>
            </div>
          </div>

          {/* Card Icons */}
          <div className="ml-auto flex gap-1">
            <div className="w-8 h-5 bg-[#1A1F71] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div className="w-8 h-5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-[#FF5F00] rounded-full" />
            </div>
          </div>
        </motion.button>

        {/* PayPal Option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setSelectedProvider('paypal')}
          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
            selectedProvider === 'paypal'
              ? 'border-[#0070BA] bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          {/* Radio */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selectedProvider === 'paypal' ? 'border-[#0070BA]' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selectedProvider === 'paypal' && (
              <div className="w-3 h-3 rounded-full bg-[#0070BA]" />
            )}
          </div>

          {/* PayPal Logo */}
          <div className="flex items-center gap-3">
            <svg className="h-6 w-auto" viewBox="0 0 101 32" fill="none">
              <path d="M12.237 4.578h-7.69c-.527 0-.975.382-1.057.897L.956 24.038c-.062.38.232.722.619.722h3.68c.527 0 .975-.382 1.057-.898l.68-4.31c.082-.515.53-.897 1.057-.897h2.437c5.074 0 8.001-2.454 8.768-7.32.345-2.13.014-3.804-.983-4.974-1.097-1.288-3.04-1.783-5.034-1.783zm.889 7.21c-.421 2.766-2.535 2.766-4.578 2.766h-1.163l.816-5.17c.049-.31.317-.54.632-.54h.533c1.392 0 2.706 0 3.384.793.405.474.528 1.175.376 2.152z" fill="#253B80"/>
              <path d="M35.482 11.675h-3.696c-.315 0-.583.23-.632.54l-.163 1.03-.258-.374c-.8-1.162-2.585-1.55-4.366-1.55-4.085 0-7.576 3.093-8.257 7.434-.355 2.164.149 4.234 1.382 5.678 1.133 1.327 2.75 1.88 4.677 1.88 3.307 0 5.14-2.126 5.14-2.126l-.165 1.031c-.062.38.233.723.62.723h3.326c.527 0 .975-.383 1.057-.898l1.996-12.646c.062-.38-.233-.722-.661-.722zm-5.18 7.193c-.357 2.113-2.037 3.532-4.18 3.532-.978 0-1.76-.314-2.262-.91-.498-.59-.686-1.432-.528-2.37.331-2.094 2.04-3.559 4.147-3.559.955 0 1.73.318 2.242.918.516.605.718 1.452.58 2.39z" fill="#253B80"/>
              <path d="M55.673 11.675h-3.714c-.354 0-.686.178-.881.476l-5.089 7.494-2.157-7.203c-.135-.452-.553-.767-1.023-.767H39.13c-.44 0-.748.428-.608.845l4.063 11.93-3.822 5.393c-.3.425.02 1.01.53 1.01h3.71c.352 0 .682-.175.878-.47l12.27-17.714c.296-.425-.024-1.01-.534-1.01h.057z" fill="#253B80"/>
              <path d="M67.255 4.578h-7.69c-.527 0-.975.382-1.057.897l-2.534 18.563c-.062.38.232.722.619.722h3.95c.369 0 .683-.267.74-.627l.72-4.58c.082-.516.53-.898 1.057-.898h2.437c5.074 0 8.001-2.454 8.768-7.32.345-2.13.014-3.804-.983-4.974-1.097-1.288-3.04-1.783-5.034-1.783h.007zm.889 7.21c-.421 2.766-2.535 2.766-4.578 2.766h-1.163l.816-5.17c.049-.31.317-.54.632-.54h.533c1.392 0 2.706 0 3.384.793.405.474.528 1.175.376 2.152z" fill="#179BD7"/>
              <path d="M90.5 11.675h-3.696c-.315 0-.583.23-.632.54l-.163 1.03-.258-.374c-.8-1.162-2.585-1.55-4.366-1.55-4.085 0-7.576 3.093-8.257 7.434-.355 2.164.149 4.234 1.382 5.678 1.133 1.327 2.75 1.88 4.677 1.88 3.307 0 5.14-2.126 5.14-2.126l-.165 1.031c-.062.38.233.723.62.723h3.326c.527 0 .975-.383 1.057-.898l1.996-12.646c.062-.38-.233-.722-.661-.722zm-5.18 7.193c-.357 2.113-2.037 3.532-4.18 3.532-.978 0-1.76-.314-2.262-.91-.498-.59-.686-1.432-.528-2.37.331-2.094 2.04-3.559 4.147-3.559.955 0 1.73.318 2.242.918.516.605.718 1.452.58 2.39z" fill="#179BD7"/>
              <path d="M93.494 5.24l-2.574 18.8c-.062.38.232.722.619.722h3.18c.527 0 .975-.382 1.057-.898l2.534-18.562c.062-.38-.232-.722-.619-.722h-3.578c-.315 0-.583.23-.632.54l.013.12z" fill="#179BD7"/>
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pay with your PayPal account</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Amount Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Total:</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={!selectedProvider || loading}
        className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 ${
          selectedProvider === 'stripe'
            ? 'bg-[#635BFF] hover:bg-[#5851DB] text-white'
            : selectedProvider === 'paypal'
            ? 'bg-[#0070BA] hover:bg-[#005C9A] text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            {selectedProvider === 'stripe' && 'Pay with Card'}
            {selectedProvider === 'paypal' && 'Pay with PayPal'}
            {!selectedProvider && 'Select payment method'}
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secure payment powered by {selectedProvider === 'paypal' ? 'PayPal' : 'Stripe'}
      </div>
    </div>
  );
}

// =============================================================================
// QUICK BUY BUTTONS (Both providers)
// =============================================================================

interface QuickBuyProps {
  amount: number;
  label: string;
  productId: string;
  userId?: string;
}

export function QuickBuyButtons({ amount, label, productId, userId }: QuickBuyProps) {
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null);

  const handleStripe = async () => {
    setLoading('stripe');
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'payment', productId, userId })
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  };

  const handlePayPal = async () => {
    setLoading('paypal');
    try {
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'payment', amount, productId, userId })
      });
      const { approvalUrl } = await response.json();
      if (approvalUrl) window.location.href = approvalUrl;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {label} - ${amount}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleStripe}
          disabled={loading !== null}
          className="flex-1 py-2 px-4 bg-[#635BFF] text-white rounded-lg hover:bg-[#5851DB] disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          {loading === 'stripe' ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>💳 Card</>
          )}
        </button>
        <button
          onClick={handlePayPal}
          disabled={loading !== null}
          className="flex-1 py-2 px-4 bg-[#0070BA] text-white rounded-lg hover:bg-[#005C9A] disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          {loading === 'paypal' ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>PayPal</>
          )}
        </button>
      </div>
    </div>
  );
}

export default PaymentOptions;
