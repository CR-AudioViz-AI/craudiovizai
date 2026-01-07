/**
 * Signup Page - CR AudioViz AI
 * 
 * Uses shared AuthOptions component and inherits Header/Footer from root layout.
 * 
 * @timestamp January 7, 2026 - 11:56 AM EST
 * @author Claude (for Roy Henderson)
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AuthOptions from '@/components/auth/AuthOptions';

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
          <p className="text-gray-400 mt-2">Start with 50 free credits</p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-cyan-100 mb-2">What you get:</p>
          <ul className="text-sm text-cyan-200/80 space-y-1">
            <li>✓ 50 free credits to start</li>
            <li>✓ Access to Javari AI assistant</li>
            <li>✓ Free games and tools</li>
            <li>✓ No credit card required</li>
          </ul>
        </div>

        {/* Auth Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8">
          <AuthOptions 
            mode="signup" 
            redirectTo="/onboarding"
          />
        </div>
      </motion.div>
    </div>
  );
}
