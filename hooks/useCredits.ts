// hooks/useCredits.ts
// Universal Credits Hook - CR AudioViz AI
'use client';

import { useState, useEffect, useCallback } from 'react';

interface CreditState {
  balance: number;
  loading: boolean;
  error: string | null;
}

interface SpendResult {
  success: boolean;
  cost?: number;
  newBalance?: number;
  error?: string;
}

interface UseCreditsReturn extends CreditState {
  refresh: () => Promise<void>;
  spend: (operation: string, appId: string, metadata?: Record<string, any>) => Promise<SpendResult>;
  canAfford: (operation: string) => Promise<boolean>;
  getCost: (operation: string) => Promise<number>;
}

// Credit costs - should match server
const CREDIT_COSTS: Record<string, number> = {
  'ai_chat_message': 1,
  'ai_image_generation': 5,
  'ai_document_analysis': 3,
  'ai_code_generation': 2,
  'ai_translation': 1,
  'ai_summarization': 2,
  'logo_generation': 10,
  'social_graphic': 5,
  'ebook_chapter': 8,
  'pdf_creation': 3,
  'invoice_generation': 2,
  'video_analysis': 15,
  'batch_processing': 10,
  'premium_export': 5,
  'default': 1
};

export function useCredits(userId: string | null): UseCreditsReturn {
  const [state, setState] = useState<CreditState>({
    balance: 0,
    loading: true,
    error: null
  });

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setState({ balance: 0, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`/api/credits/balance?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      setState({
        balance: data.balance || 0,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setState({
        balance: 0,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const spend = useCallback(async (
    operation: string,
    appId: string,
    metadata?: Record<string, any>
  ): Promise<SpendResult> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const res = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, operation, appId, metadata })
      });

      const data = await res.json();

      if (!res.ok) {
        return { 
          success: false, 
          error: data.error || 'Failed to spend credits',
          cost: data.required
        };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        balance: data.newBalance
      }));

      return {
        success: true,
        cost: data.cost,
        newBalance: data.newBalance
      };
    } catch (error) {
      console.error('Failed to spend credits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [userId]);

  const canAfford = useCallback(async (operation: string): Promise<boolean> => {
    if (!userId) return false;
    
    const cost = CREDIT_COSTS[operation] || CREDIT_COSTS['default'];
    return state.balance >= cost;
  }, [userId, state.balance]);

  const getCost = useCallback(async (operation: string): Promise<number> => {
    return CREDIT_COSTS[operation] || CREDIT_COSTS['default'];
  }, []);

  return {
    ...state,
    refresh: fetchBalance,
    spend,
    canAfford,
    getCost
  };
}

// Helper component for credit-gated features
interface CreditGateProps {
  userId: string | null;
  operation: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CreditGate({ userId, operation, children, fallback }: CreditGateProps) {
  const { balance, loading } = useCredits(userId);
  const cost = CREDIT_COSTS[operation] || CREDIT_COSTS['default'];

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />;
  }

  if (balance < cost) {
    return fallback || (
      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800">
          This feature requires {cost} credits. You have {balance}.
        </p>
        <button className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 underline">
          Purchase Credits
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default useCredits;
