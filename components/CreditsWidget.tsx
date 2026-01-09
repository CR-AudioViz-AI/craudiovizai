// CR AUDIOVIZ AI - Credits Balance Widget
// Session: 2025-10-25 - Phase 4
// Purpose: Real-time credits display with purchase quick-action

'use client';

import { useState, useEffect } from 'react';
import { Coins, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CreditsWidgetProps {
  initialBalance?: number;
  showPurchase?: boolean;
  compact?: boolean;
  className?: string;
}

export default function CreditsWidget({
  initialBalance = 0,
  showPurchase = true,
  compact = false,
  className = ''
}: CreditsWidgetProps) {
  const [credits, setCredits] = useState(initialBalance);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCredits();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/admin/credits');
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.creditsBalance || 0);
        setError('');
      } else if (response.status === 401) {
        // Not logged in
        setError('Not logged in');
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (credits >= 1000) return 'text-cyan-500';
    if (credits >= 100) return 'text-blue-600';
    if (credits >= 10) return 'text-cyan-400';
    return 'text-red-600';
  };

  const getStatusBg = () => {
    if (credits >= 1000) return 'bg-cyan-500 border-cyan-500';
    if (credits >= 100) return 'bg-blue-50 border-blue-200';
    if (credits >= 10) return 'bg-cyan-400 border-cyan-400';
    return 'bg-red-50 border-red-200';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusBg()}`}>
          <Coins className={`w-4 h-4 ${getStatusColor()}`} />
          <span className={`font-semibold text-sm ${getStatusColor()}`}>
            {isLoading ? '...' : credits.toLocaleString()}
          </span>
        </div>
        
        {showPurchase && (
          <Link
            href="/admin/credits"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${getStatusBg()}`}>
            <Coins className={`w-6 h-6 ${getStatusColor()}`} />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Available Credits</p>
            <p className={`text-3xl font-bold ${getStatusColor()}`}>
              {isLoading ? '...' : credits.toLocaleString()}
            </p>
          </div>
        </div>

        {showPurchase && (
          <Link
            href="/admin/credits"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Purchase</span>
          </Link>
        )}
      </div>

      {/* Status Message */}
      <div className="space-y-2">
        {credits >= 1000 && (
          <div className="flex items-center gap-2 text-sm text-cyan-500 bg-cyan-500 rounded-lg px-3 py-2">
            <TrendingUp className="w-4 h-4" />
            <span>Excellent! You're well-stocked with credits.</span>
          </div>
        )}

        {credits >= 100 && credits < 1000 && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            <Coins className="w-4 h-4" />
            <span>Good balance! You have plenty of credits available.</span>
          </div>
        )}

        {credits >= 10 && credits < 100 && (
          <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-400 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>Running low. Consider purchasing more credits soon.</span>
          </div>
        )}

        {credits < 10 && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>Low balance! Purchase credits to continue creating.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Cost per generation</p>
            <p className="font-semibold text-gray-900">~5-20 credits</p>
          </div>
          <div>
            <p className="text-gray-600">Estimated uses</p>
            <p className="font-semibold text-gray-900">
              {credits > 0 ? `~${Math.floor(credits / 10)}` : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
