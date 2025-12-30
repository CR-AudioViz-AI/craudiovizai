// /hooks/useAIEval.ts
// AI Evaluation & Safety Hook - CR AudioViz AI
// Javari AI Quality Assurance Client

import { useState, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface SafetyCheck {
  is_safe: boolean;
  category?: string;
  severity?: string;
  confidence: number;
  details?: string;
}

export interface EvalSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  pass_threshold: number;
  critical_threshold: number;
}

export interface EvalRun {
  id: string;
  suite_id: string;
  status: 'running' | 'passed' | 'failed' | 'error';
  model_tested: string;
  overall_score: number;
  passed_tests: number;
  failed_tests: number;
  avg_latency_ms: number;
  created_at: string;
}

export interface DriftAlert {
  id: string;
  alert_type: string;
  severity: string;
  model: string;
  metric: string;
  baseline_value: number;
  current_value: number;
  deviation_percent: number;
  status: string;
  created_at: string;
}

export interface CostSummary {
  date: string;
  model: string;
  provider: string;
  request_count: number;
  total_tokens: number;
  total_cost: number;
  free_tier_savings: number;
}

export interface SafetyStats {
  total: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAIEval() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // SAFETY CHECKING
  // =============================================================================

  /**
   * Check if input is safe before sending to AI
   * Call this BEFORE every AI request
   */
  const checkSafety = useCallback(async (
    input: string,
    context?: { user_id?: string; session_id?: string }
  ): Promise<SafetyCheck> => {
    try {
      const response = await fetch('/api/ai-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_safety',
          input,
          ...context
        })
      });
      
      if (!response.ok) throw new Error('Safety check failed');
      return await response.json();
    } catch (err: any) {
      console.error('Safety check error:', err);
      // Fail safe - if safety check fails, treat as unsafe
      return {
        is_safe: false,
        category: 'error',
        severity: 'high',
        confidence: 0,
        details: err.message
      };
    }
  }, []);

  /**
   * Wrapper that checks safety before executing AI request
   */
  const safeAIRequest = useCallback(async <T>(
    input: string,
    aiFunction: () => Promise<T>,
    context?: { user_id?: string; session_id?: string }
  ): Promise<{ result?: T; blocked: boolean; safety: SafetyCheck }> => {
    const safety = await checkSafety(input, context);
    
    if (!safety.is_safe) {
      return {
        blocked: true,
        safety
      };
    }
    
    const result = await aiFunction();
    return {
      result,
      blocked: false,
      safety
    };
  }, [checkSafety]);

  // =============================================================================
  // EVALUATION
  // =============================================================================

  /**
   * Get available evaluation suites
   */
  const getEvalSuites = useCallback(async (): Promise<EvalSuite[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-eval?action=suites');
      if (!response.ok) throw new Error('Failed to fetch suites');
      
      const data = await response.json();
      return data.suites || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Run an evaluation suite
   */
  const runEvaluation = useCallback(async (
    suiteId: string,
    model: string
  ): Promise<EvalRun | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_eval',
          suite_id: suiteId,
          model
        })
      });
      
      if (!response.ok) throw new Error('Evaluation failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get recent evaluation runs
   */
  const getEvalRuns = useCallback(async (suiteId: string): Promise<EvalRun[]> => {
    try {
      const response = await fetch(`/api/ai-eval?action=runs&suiteId=${suiteId}`);
      if (!response.ok) throw new Error('Failed to fetch runs');
      
      const data = await response.json();
      return data.runs || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // =============================================================================
  // DRIFT MONITORING
  // =============================================================================

  /**
   * Check for performance drift on a model
   */
  const checkDrift = useCallback(async (model: string): Promise<{
    has_drift: boolean;
    alerts: DriftAlert[];
  }> => {
    try {
      const response = await fetch('/api/ai-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_drift',
          model
        })
      });
      
      if (!response.ok) throw new Error('Drift check failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return { has_drift: false, alerts: [] };
    }
  }, []);

  /**
   * Get active drift alerts
   */
  const getDriftAlerts = useCallback(async (): Promise<DriftAlert[]> => {
    try {
      const response = await fetch('/api/ai-eval?action=alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      return data.alerts || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // =============================================================================
  // FEEDBACK
  // =============================================================================

  /**
   * Submit user feedback on AI response
   */
  const submitFeedback = useCallback(async (feedback: {
    user_id?: string;
    session_id?: string;
    message_id?: string;
    rating: 'thumbs_up' | 'thumbs_down' | 'star_1' | 'star_2' | 'star_3' | 'star_4' | 'star_5';
    feedback_text?: string;
    feedback_category?: 'accuracy' | 'helpfulness' | 'safety' | 'speed' | 'other';
    model_used?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/ai-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          ...feedback
        })
      });
      
      return response.ok;
    } catch (err) {
      return false;
    }
  }, []);

  // =============================================================================
  // COST TRACKING
  // =============================================================================

  /**
   * Track AI usage cost
   */
  const trackCost = useCallback(async (usage: {
    model: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
  }): Promise<{ cost: number; is_free: boolean }> => {
    try {
      const response = await fetch('/api/ai-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_cost',
          ...usage
        })
      });
      
      if (!response.ok) throw new Error('Cost tracking failed');
      return await response.json();
    } catch (err) {
      return { cost: 0, is_free: false };
    }
  }, []);

  /**
   * Get cost summary for recent days
   */
  const getCostSummary = useCallback(async (days: number = 7): Promise<CostSummary[]> => {
    try {
      const response = await fetch(`/api/ai-eval?action=costs&days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch costs');
      
      const data = await response.json();
      return data.costs || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Get total costs aggregated
   */
  const getTotalCosts = useCallback(async (days: number = 30): Promise<{
    total_cost: number;
    total_savings: number;
    total_requests: number;
    total_tokens: number;
    by_model: Record<string, number>;
    by_provider: Record<string, number>;
  }> => {
    const costs = await getCostSummary(days);
    
    const result = {
      total_cost: 0,
      total_savings: 0,
      total_requests: 0,
      total_tokens: 0,
      by_model: {} as Record<string, number>,
      by_provider: {} as Record<string, number>
    };
    
    for (const c of costs) {
      result.total_cost += c.total_cost;
      result.total_savings += c.free_tier_savings;
      result.total_requests += c.request_count;
      result.total_tokens += c.total_tokens;
      
      result.by_model[c.model] = (result.by_model[c.model] || 0) + c.total_cost;
      result.by_provider[c.provider] = (result.by_provider[c.provider] || 0) + c.total_cost;
    }
    
    return result;
  }, [getCostSummary]);

  // =============================================================================
  // SAFETY STATS
  // =============================================================================

  /**
   * Get safety violation statistics
   */
  const getSafetyStats = useCallback(async (): Promise<SafetyStats> => {
    try {
      const response = await fetch('/api/ai-eval?action=safety_stats');
      if (!response.ok) throw new Error('Failed to fetch safety stats');
      
      const data = await response.json();
      
      // Aggregate stats
      const by_category: Record<string, number> = {};
      const by_severity: Record<string, number> = {};
      
      for (const v of data.violations || []) {
        by_category[v.category_id] = (by_category[v.category_id] || 0) + 1;
        by_severity[v.severity] = (by_severity[v.severity] || 0) + 1;
      }
      
      return {
        total: data.total || 0,
        by_category,
        by_severity
      };
    } catch (err: any) {
      setError(err.message);
      return { total: 0, by_category: {}, by_severity: {} };
    }
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    loading,
    error,
    
    // Safety
    checkSafety,
    safeAIRequest,
    getSafetyStats,
    
    // Evaluation
    getEvalSuites,
    runEvaluation,
    getEvalRuns,
    
    // Drift
    checkDrift,
    getDriftAlerts,
    
    // Feedback
    submitFeedback,
    
    // Costs
    trackCost,
    getCostSummary,
    getTotalCosts
  };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default useAIEval;
