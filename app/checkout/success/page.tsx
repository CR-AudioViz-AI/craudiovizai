// /app/checkout/success/page.tsx
export const dynamic = 'force-dynamic';

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (sessionId) {
      // Verify session
      fetch(`/api/stripe/checkout?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => setStatus(data.success ? 'success' : 'error'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('success');
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {status === 'loading' ? (
          <>
            <div className="text-6xl mb-6 animate-pulse">⏳</div>
            <h1 className="text-2xl font-bold mb-4">Processing...</h1>
          </>
        ) : status === 'success' ? (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold mb-4 text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">Thank you for your purchase. Your credits have been added to your account.</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold mb-4 text-yellow-600">Verification Issue</h1>
            <p className="text-gray-600 mb-8">We couldn't verify your payment. Please contact support if you were charged.</p>
          </>
        )}
        <Link href="/dashboard" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
