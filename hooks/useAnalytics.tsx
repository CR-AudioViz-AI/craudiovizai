// hooks/useAnalytics.ts
// Universal Analytics Hook - CR AudioViz AI
'use client';

import { useCallback, useEffect, useRef } from 'react';

type EventType = 
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'signup'
  | 'login'
  | 'logout'
  | 'feature_used'
  | 'tool_opened'
  | 'tool_completed'
  | 'credit_purchase'
  | 'credit_spent'
  | 'cross_module_click'
  | 'search_performed'
  | 'search_result_clicked'
  | 'content_created'
  | 'content_exported'
  | 'content_shared'
  | 'error_occurred'
  | 'ai_error';

interface AnalyticsConfig {
  appId: string;
  userId?: string | null;
  debug?: boolean;
}

interface TrackOptions {
  immediate?: boolean; // Send immediately vs batch
}

// Session ID persists across page loads
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('crav_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('crav_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics(config: AnalyticsConfig) {
  const { appId, userId, debug = false } = config;
  const eventQueue = useRef<any[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout>();

  // Flush event queue
  const flush = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      });

      if (!res.ok && debug) {
        console.error('Analytics flush failed:', await res.text());
      } else if (debug) {
        console.log(`📊 Flushed ${events.length} events`);
      }
    } catch (error) {
      if (debug) {
        console.error('Analytics error:', error);
      }
      // Re-queue failed events
      eventQueue.current = [...events, ...eventQueue.current];
    }
  }, [debug]);

  // Track event
  const track = useCallback((
    event: EventType,
    properties?: Record<string, any>,
    options?: TrackOptions
  ) => {
    const eventData = {
      event,
      appId,
      userId: userId || undefined,
      sessionId: getSessionId(),
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      },
      timestamp: new Date().toISOString()
    };

    if (debug) {
      console.log('📊 Track:', event, properties);
    }

    if (options?.immediate) {
      // Send immediately
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(err => debug && console.error('Analytics error:', err));
    } else {
      // Add to queue
      eventQueue.current.push(eventData);

      // Debounce flush
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current);
      }
      flushTimeout.current = setTimeout(flush, 1000);
    }
  }, [appId, userId, debug, flush]);

  // Track page view on mount
  useEffect(() => {
    track('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });

    // Flush on page unload
    const handleUnload = () => {
      if (eventQueue.current.length > 0) {
        // Use sendBeacon for reliable delivery
        navigator.sendBeacon('/api/analytics/track', 
          JSON.stringify(eventQueue.current)
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      flush();
    };
  }, [track, flush]);

  // Convenience methods
  const trackFeature = useCallback((feature: string, properties?: Record<string, any>) => {
    track('feature_used', { feature, ...properties });
  }, [track]);

  const trackTool = useCallback((tool: string, action: 'opened' | 'completed', properties?: Record<string, any>) => {
    track(action === 'opened' ? 'tool_opened' : 'tool_completed', { tool, ...properties });
  }, [track]);

  const trackCrossModule = useCallback((destinationApp: string, properties?: Record<string, any>) => {
    track('cross_module_click', { destination_app: destinationApp, ...properties });
  }, [track]);

  const trackSearch = useCallback((query: string, resultCount: number) => {
    track('search_performed', { query, result_count: resultCount });
  }, [track]);

  const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
    track('error_occurred', {
      error_message: typeof error === 'string' ? error : error.message,
      error_stack: typeof error === 'object' ? error.stack : undefined,
      ...context
    }, { immediate: true });
  }, [track]);

  const trackAIError = useCallback((model: string, error: string, context?: Record<string, any>) => {
    track('ai_error', {
      model,
      error_message: error,
      ...context
    }, { immediate: true });
  }, [track]);

  return {
    track,
    trackFeature,
    trackTool,
    trackCrossModule,
    trackSearch,
    trackError,
    trackAIError,
    flush
  };
}

// Provider component for app-wide analytics
import { createContext, useContext, ReactNode } from 'react';

interface AnalyticsContextValue {
  track: ReturnType<typeof useAnalytics>['track'];
  trackFeature: ReturnType<typeof useAnalytics>['trackFeature'];
  trackTool: ReturnType<typeof useAnalytics>['trackTool'];
  trackCrossModule: ReturnType<typeof useAnalytics>['trackCrossModule'];
  trackSearch: ReturnType<typeof useAnalytics>['trackSearch'];
  trackError: ReturnType<typeof useAnalytics>['trackError'];
  trackAIError: ReturnType<typeof useAnalytics>['trackAIError'];
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  appId: string;
  userId?: string | null;
  debug?: boolean;
}

export function AnalyticsProvider({ children, appId, userId, debug }: AnalyticsProviderProps) {
  const analytics = useAnalytics({ appId, userId, debug });

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

export default useAnalytics;
