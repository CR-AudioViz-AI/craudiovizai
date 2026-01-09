'use client';

import { Coins, AlertCircle, Sparkles } from 'lucide-react';

/**
 * CR AudioViz AI - Credits Display Component
 * ==========================================
 * 
 * Shows current credit balance and provides quick purchase option.
 * Use in app headers to show users their remaining credits.
 */

interface CreditsDisplayProps {
  credits: number;
  isLoading?: boolean;
  showBuyButton?: boolean;
  className?: string;
}

export default function CreditsDisplay({
  credits,
  isLoading = false,
  showBuyButton = true,
  className = ''
}: CreditsDisplayProps) {
  const isLow = credits < 10;
  const isEmpty = credits <= 0;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg animate-pulse ${className}`}>
        <Coins className="w-4 h-4 text-gray-400" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isEmpty 
            ? 'bg-red-600/20 border border-red-500/30' 
            : isLow 
              ? 'bg-cyan-400/20 border border-cyan-400/30'
              : 'bg-white/10'
        }`}
        role="status"
        aria-label={`You have ${credits} credits remaining`}
      >
        {isEmpty ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Coins className={`w-4 h-4 ${isLow ? 'text-cyan-400' : 'text-cyan-500'}`} />
        )}
        <span className={`font-medium ${
          isEmpty ? 'text-red-400' : isLow ? 'text-cyan-400' : 'text-white'
        }`}>
          {credits.toLocaleString()} credits
        </span>
      </div>

      {showBuyButton && (isEmpty || isLow) && (
        <a
          href="/pricing"
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm rounded-lg hover:opacity-90 transition"
        >
          <Sparkles className="w-3 h-3" />
          Get More
        </a>
      )}
    </div>
  );
}
