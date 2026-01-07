/**
 * Signup Page - CR AudioViz AI
 * 
 * Uses shared AuthOptions component to render ALL enabled auth providers.
 * This ensures login and signup pages stay in sync.
 * 
 * @timestamp January 7, 2026 - 11:34 AM EST
 * @author Claude (for Roy Henderson)
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AuthOptions from '@/components/auth/AuthOptions';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
              <div className="relative">
                <div className="flex gap-1.5 mb-1">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="w-4 h-1.5 bg-white rounded-full mx-auto" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-gray-400 mt-2">Start with 50 free credits</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Benefits */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-cyan-100 mb-2">What you get:</p>
            <ul className="text-sm text-cyan-200/80 space-y-1">
              <li>✓ 50 free credits to start</li>
              <li>✓ Access to Javari AI assistant</li>
              <li>✓ Free games and tools</li>
              <li>✓ No credit card required</li>
            </ul>
          </div>

          <AuthOptions 
            mode="signup" 
            redirectTo="/onboarding"
          />
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-500 text-sm">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-300">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-300">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
