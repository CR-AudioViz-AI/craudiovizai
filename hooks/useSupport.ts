// /hooks/useSupport.ts
// Support & Success Hook - CR AudioViz AI
// Tickets, Enhancement Requests, Knowledge Base

import { useState, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  default_priority: string;
  sla_hours: number;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'waiting_on_internal' | 'escalated' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  ticket_type: string;
  category?: { name: string; icon: string };
  created_at: string;
  updated_at: string;
  sla_due_at?: string;
  satisfaction_rating?: number;
}

export interface TicketMessage {
  id: string;
  author_type: 'customer' | 'agent' | 'system' | 'ai';
  author_name?: string;
  message: string;
  attachments?: any[];
  created_at: string;
}

export interface EnhancementRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  use_case?: string;
  expected_benefit?: string;
  category: string;
  module?: string;
  status: 'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined' | 'duplicate';
  upvote_count: number;
  downvote_count: number;
  vote_score: number;
  user_vote?: number;
  target_release?: string;
  created_at: string;
}

export interface KBCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  article_count: number;
}

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  collection?: { name: string; slug: string };
  tags?: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  related?: { id: string; title: string; slug: string }[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// =============================================================================
// HOOK
// =============================================================================

interface UseSupportOptions {
  userId?: string;
}

export function useSupport(options: UseSupportOptions = {}) {
  const { userId } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // SUPPORT TICKETS
  // =============================================================================

  const getCategories = useCallback(async (): Promise<SupportCategory[]> => {
    try {
      const response = await fetch('/api/support?action=categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const createTicket = useCallback(async (input: {
    email: string;
    name?: string;
    category_id?: string;
    subject: string;
    description: string;
    priority?: string;
    ticket_type?: string;
  }): Promise<SupportTicket | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_ticket',
          user_id: userId,
          ...input
        })
      });
      
      if (!response.ok) throw new Error('Failed to create ticket');
      const data = await response.json();
      return data.ticket;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getTickets = useCallback(async (filters?: {
    status?: string;
    limit?: number;
  }): Promise<SupportTicket[]> => {
    if (!userId) return [];
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'tickets',
        userId
      });
      if (filters?.status) params.set('status', filters.status);
      if (filters?.limit) params.set('limit', String(filters.limit));
      
      const response = await fetch(`/api/support?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      const data = await response.json();
      return data.tickets || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getTicketDetails = useCallback(async (ticketId: string): Promise<{
    ticket: SupportTicket;
    messages: TicketMessage[];
    activity: any[];
  } | null> => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/support?action=ticket&ticketId=${ticketId}&userId=${userId}`
      );
      if (!response.ok) throw new Error('Failed to fetch ticket');
      
      const data = await response.json();
      return data.ticket;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addTicketMessage = useCallback(async (
    ticketId: string, 
    message: string
  ): Promise<TicketMessage | null> => {
    if (!userId) return null;
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_message',
          ticket_id: ticketId,
          user_id: userId,
          message
        })
      });
      
      if (!response.ok) throw new Error('Failed to add message');
      const data = await response.json();
      return data.message;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [userId]);

  // =============================================================================
  // ENHANCEMENT REQUESTS
  // =============================================================================

  const createEnhancement = useCallback(async (input: {
    email: string;
    name?: string;
    title: string;
    description: string;
    use_case?: string;
    expected_benefit?: string;
    category: string;
    module?: string;
  }): Promise<EnhancementRequest | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_enhancement',
          user_id: userId,
          ...input
        })
      });
      
      if (!response.ok) throw new Error('Failed to create enhancement request');
      const data = await response.json();
      return data.enhancement;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getEnhancements = useCallback(async (filters?: {
    status?: string;
    category?: string;
    module?: string;
    sort?: 'votes' | 'newest' | 'priority';
    limit?: number;
  }): Promise<EnhancementRequest[]> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'enhancements' });
      if (userId) params.set('userId', userId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.module) params.set('module', filters.module);
      if (filters?.sort) params.set('sort', filters.sort);
      if (filters?.limit) params.set('limit', String(filters.limit));
      
      const response = await fetch(`/api/support?${params}`);
      if (!response.ok) throw new Error('Failed to fetch enhancements');
      
      const data = await response.json();
      return data.enhancements || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const voteOnEnhancement = useCallback(async (
    enhancementId: string, 
    vote: 1 | -1 | 0
  ): Promise<{ upvote_count: number; downvote_count: number; vote_score: number } | null> => {
    if (!userId) {
      setError('Must be logged in to vote');
      return null;
    }
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          enhancement_id: enhancementId,
          user_id: userId,
          vote
        })
      });
      
      if (!response.ok) throw new Error('Failed to vote');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [userId]);

  const addEnhancementComment = useCallback(async (
    enhancementId: string,
    comment: string,
    parentId?: string
  ): Promise<boolean> => {
    if (!userId) {
      setError('Must be logged in to comment');
      return false;
    }
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          enhancement_id: enhancementId,
          user_id: userId,
          comment,
          parent_id: parentId
        })
      });
      
      return response.ok;
    } catch (err) {
      return false;
    }
  }, [userId]);

  // =============================================================================
  // KNOWLEDGE BASE
  // =============================================================================

  const searchKnowledgeBase = useCallback(async (query: string): Promise<{
    articles: KBArticle[];
    faqs: FAQ[];
  }> => {
    try {
      const response = await fetch(`/api/support?action=kb_search&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return { articles: [], faqs: [] };
    }
  }, []);

  const getKBCollections = useCallback(async (): Promise<KBCollection[]> => {
    try {
      const response = await fetch('/api/support?action=kb_collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      return data.collections || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const getKBArticle = useCallback(async (slug: string): Promise<KBArticle | null> => {
    try {
      const response = await fetch(`/api/support?action=kb_article&slug=${slug}`);
      if (!response.ok) throw new Error('Article not found');
      const data = await response.json();
      return data.article;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const submitKBFeedback = useCallback(async (
    articleId: string,
    helpful: boolean,
    feedbackText?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kb_feedback',
          article_id: articleId,
          user_id: userId,
          helpful,
          feedback_text: feedbackText
        })
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }, [userId]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    loading,
    error,
    clearError: () => setError(null),
    
    // Tickets
    getCategories,
    createTicket,
    getTickets,
    getTicketDetails,
    addTicketMessage,
    
    // Enhancements
    createEnhancement,
    getEnhancements,
    voteOnEnhancement,
    addEnhancementComment,
    
    // Knowledge Base
    searchKnowledgeBase,
    getKBCollections,
    getKBArticle,
    submitKBFeedback
  };
}

// =============================================================================
// ENHANCEMENT CATEGORIES
// =============================================================================

export const ENHANCEMENT_CATEGORIES = [
  { value: 'feature', label: 'New Feature', icon: '✨' },
  { value: 'improvement', label: 'Improvement', icon: '📈' },
  { value: 'integration', label: 'Integration', icon: '🔌' },
  { value: 'ui_ux', label: 'UI/UX', icon: '🎨' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '💡' }
];

export const ENHANCEMENT_STATUSES = [
  { value: 'submitted', label: 'Submitted', color: 'gray' },
  { value: 'under_review', label: 'Under Review', color: 'yellow' },
  { value: 'planned', label: 'Planned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'purple' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'declined', label: 'Declined', color: 'red' },
  { value: 'duplicate', label: 'Duplicate', color: 'gray' }
];

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default useSupport;
