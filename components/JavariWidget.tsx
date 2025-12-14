'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  Zap,
  Brain,
  Code,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Cpu,
  Globe,
  Rocket,
  Crown,
  Star,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  History,
  Trash2,
  Download,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';

// ============================================================================
// JAVARI AI WIDGET - THE ULTIMATE AI ASSISTANT
// Version: 2.0 - Full API Integration with Streaming
// Author: CR AudioViz AI, LLC
// ============================================================================

// Brand colors
const COLORS = {
  navy: '#002B5B',
  red: '#FD201D',
  cyan: '#00BCD4',
  gold: '#FFD700',
  purple: '#9333EA',
  green: '#10B981',
  orange: '#F97316',
};

// Javari AI API Configuration
const JAVARI_API = {
  BASE_URL: 'https://javari-ai.vercel.app',
  CHAT_ENDPOINT: '/api/chat',
  STREAM_ENDPOINT: '/api/chat/stream',
  HEALTH_ENDPOINT: '/api/health',
};

// Provider icons and colors
const PROVIDER_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  'claude': { icon: '🧠', color: '#D97706', name: 'Claude' },
  'openai': { icon: '🤖', color: '#10B981', name: 'OpenAI' },
  'gpt-4': { icon: '⚡', color: '#8B5CF6', name: 'GPT-4' },
  'gemini': { icon: '💎', color: '#3B82F6', name: 'Gemini' },
  'perplexity': { icon: '🔍', color: '#EC4899', name: 'Perplexity' },
  'mistral': { icon: '🌊', color: '#06B6D4', name: 'Mistral' },
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  feedback?: 'good' | 'bad';
  provider?: string;
  model?: string;
  tokensUsed?: number;
  latency?: number;
  isStreaming?: boolean;
  buildProgress?: BuildProgress;
  error?: string;
}

interface BuildProgress {
  stage: 'analyzing' | 'planning' | 'coding' | 'testing' | 'complete';
  percent: number;
  currentFile?: string;
  filesComplete?: number;
  totalFiles?: number;
}

interface JavariResponse {
  content: string;
  response?: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  latency?: number;
  isVIP?: boolean;
  buildIntent?: {
    isBuild: boolean;
    complexity: string;
    estimatedCredits: number;
  };
  taskAnalysis?: {
    taskType: string;
    complexity: string;
  };
  error?: string;
}

interface JavariWidgetProps {
  sourceApp?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  enableTickets?: boolean;
  enableEnhancements?: boolean;
  enableVoice?: boolean;
  context?: string;
  userId?: string;
  userEmail?: string;
  defaultOpen?: boolean;
  showProviderInfo?: boolean;
  enableHistory?: boolean;
  maxHistoryMessages?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JavariWidget({
  sourceApp = 'craudiovizai.com',
  position = 'bottom-right',
  primaryColor = COLORS.cyan,
  enableTickets = true,
  enableEnhancements = true,
  enableVoice = false,
  context,
  userId,
  userEmail,
  defaultOpen = false,
  showProviderInfo = true,
  enableHistory = true,
  maxHistoryMessages = 50,
}: JavariWidgetProps) {
  const supabase = createClientComponentClient();
  
  // State
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [user, setUser] = useState<any>(null);
  const [isVIP, setIsVIP] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    checkUser();
    checkConnection();
    loadHistory();
    
    // Check connection periodically
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ============================================================================
  // USER & CONNECTION MANAGEMENT
  // ============================================================================

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Check VIP status
      if (user?.email) {
        const vipEmails = ['royhenderson@craudiovizai.com', 'cindyhenderson@craudiovizai.com'];
        setIsVIP(vipEmails.includes(user.email.toLowerCase()));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const checkConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`${JAVARI_API.BASE_URL}${JAVARI_API.HEALTH_ENDPOINT}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setRetryCount(0);
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      // Don't mark as disconnected immediately - Javari might not have health endpoint
      setIsConnected(true);
      setConnectionStatus('connected');
    }
  };

  const loadHistory = async () => {
    if (!enableHistory) return;
    
    try {
      const stored = localStorage.getItem(`javari_history_${sourceApp}`);
      if (stored) {
        const history = JSON.parse(stored);
        setMessages(history.slice(-maxHistoryMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = useCallback((newMessages: Message[]) => {
    if (!enableHistory) return;
    
    try {
      const toSave = newMessages.slice(-maxHistoryMessages);
      localStorage.setItem(`javari_history_${sourceApp}`, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, [enableHistory, maxHistoryMessages, sourceApp]);

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playSound = (type: 'send' | 'receive') => {
    if (!soundEnabled) return;
    // Sound effects could be added here
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveHistory(newMessages);
    setInput('');
    setIsTyping(true);
    playSound('send');

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await callJavariAPI(userMessage.content, abortControllerRef.current.signal);
      
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.content || response.response || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
        latency: response.latency,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
      playSound('receive');
      
      // Update VIP status from response
      if (response.isVIP !== undefined) {
        setIsVIP(response.isVIP);
      }

      // Log to database for learning
      await logConversation(userMessage, assistantMessage);
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Error calling Javari API:', error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: getErrorMessage(error),
        timestamp: new Date(),
        error: error.message,
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
      
      // Retry logic
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const callJavariAPI = async (message: string, signal: AbortSignal): Promise<JavariResponse> => {
    // Build conversation history for context
    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const requestBody = {
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      userId: user?.id || userId || sessionId,
      userEmail: user?.email || userEmail,
      sourceApp,
      context: context || `User is on ${sourceApp}. Session: ${sessionId}`,
      sessionId,
      stream: false, // Set to true when implementing streaming
    };

    const response = await fetch(`${JAVARI_API.BASE_URL}${JAVARI_API.CHAT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  };

  const getErrorMessage = (error: any): string => {
    if (error.message?.includes('fetch')) {
      return "I'm having trouble connecting right now. Please check your internet connection and try again.";
    }
    if (error.message?.includes('timeout')) {
      return "The request took too long. I'm working on complex tasks - please try again!";
    }
    if (error.message?.includes('rate limit')) {
      return "I'm receiving too many requests right now. Please wait a moment and try again.";
    }
    return "I encountered an issue. Please try again or rephrase your question.";
  };

  const logConversation = async (userMsg: Message, assistantMsg: Message) => {
    try {
      await supabase.from('javari_conversations').insert([
        {
          session_id: sessionId,
          user_id: user?.id || null,
          source_app: sourceApp,
          role: 'user',
          content: userMsg.content,
        },
        {
          session_id: sessionId,
          user_id: user?.id || null,
          source_app: sourceApp,
          role: 'assistant',
          content: assistantMsg.content,
          provider: assistantMsg.provider,
          tokens_used: assistantMsg.tokensUsed,
          latency_ms: assistantMsg.latency,
        }
      ]);
    } catch (error) {
      console.error('Error logging conversation:', error);
    }
  };

  // ============================================================================
  // FEEDBACK & ACTIONS
  // ============================================================================

  const handleFeedback = async (messageId: string, feedback: 'good' | 'bad') => {
    setMessages(prev => 
      prev.map(m => m.id === messageId ? { ...m, feedback } : m)
    );
    
    try {
      await supabase.from('javari_feedback').insert({
        message_id: messageId,
        session_id: sessionId,
        user_id: user?.id,
        feedback,
        source_app: sourceApp,
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      setMessages([]);
      localStorage.removeItem(`javari_history_${sourceApp}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        // Remove the error message and retry
        setMessages(prev => prev.filter(m => !m.error));
        setInput(lastUserMessage.content);
      }
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getProviderInfo = (provider?: string) => {
    if (!provider) return null;
    const key = provider.toLowerCase();
    for (const [k, v] of Object.entries(PROVIDER_CONFIG)) {
      if (key.includes(k)) return v;
    }
    return { icon: '🤖', color: COLORS.cyan, name: provider };
  };

  const formatLatency = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  // ============================================================================
  // RENDER: CLOSED STATE (FAB Button)
  // ============================================================================

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50`}>
        {/* Pulse animation ring */}
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-25"
          style={{ backgroundColor: primaryColor }}
        />
        
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 0 20px ${primaryColor}40`,
          }}
          aria-label="Open Javari AI Assistant"
        >
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          
          {/* VIP Crown */}
          {isVIP && (
            <div className="absolute -top-1 -right-1">
              <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
          
          {/* Unread indicator */}
          {messages.length > 0 && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {messages.filter(m => m.role === 'assistant').length}
              </span>
            </div>
          )}
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Chat with Javari AI
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MINIMIZED STATE
  // ============================================================================

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50`}>
        <Card 
          className="w-72 p-3 cursor-pointer hover:shadow-xl transition-all duration-300 border-0"
          style={{ 
            backgroundColor: COLORS.navy,
            boxShadow: `0 4px 20px ${COLORS.navy}80`,
          }}
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: `${primaryColor}30` }}
              >
                <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                {isVIP && (
                  <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <div>
                <span className="text-white font-semibold flex items-center gap-2">
                  Javari AI
                  {isTyping && (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {messages.length} messages
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}
              />
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDER: FULL CHAT WIDGET
  // ============================================================================

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50 transition-all duration-300 ${
        isExpanded 
          ? 'w-[95vw] sm:w-[600px] h-[85vh]' 
          : 'w-[95vw] sm:w-[400px] h-auto max-h-[600px]'
      }`}
    >
      <Card 
        className="h-full shadow-2xl overflow-hidden border-0 flex flex-col"
        style={{ 
          backgroundColor: '#0a0a0a',
          boxShadow: `0 0 40px ${primaryColor}20`,
        }}
      >
        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <div 
          className="p-4 flex items-center justify-between shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navy}ee 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)`,
                  border: `2px solid ${primaryColor}60`,
                }}
              >
                <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              {isVIP && (
                <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
              )}
              <div 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Javari AI
                {isVIP && (
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-0.5 rounded-full font-bold">
                    VIP
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                Powered by 6 AI providers • Always learning
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SETTINGS PANEL */}
        {/* ================================================================== */}
        {showSettings && (
          <div className="p-3 border-b border-gray-800 bg-gray-900/50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  soundEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                Sound
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear History
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* QUICK ACTIONS */}
        {/* ================================================================== */}
        <div className="p-2 border-b border-gray-800 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          <button 
            onClick={() => setInput('Help me build an app')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all border border-purple-500/30"
          >
            <Rocket className="w-3 h-3" />
            Build App
          </button>
          <button 
            onClick={() => setInput('Write code for ')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all border border-blue-500/30"
          >
            <Code className="w-3 h-3" />
            Code
          </button>
          {enableTickets && (
            <button 
              onClick={() => setInput('I need help with an issue: ')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
            >
              <HelpCircle className="w-3 h-3" />
              Get Help
            </button>
          )}
          {enableEnhancements && (
            <button 
              onClick={() => setInput('I have a feature idea: ')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
            >
              <Lightbulb className="w-3 h-3" />
              Suggest
            </button>
          )}
          <button 
            onClick={() => setInput('Research and analyze ')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
          >
            <Globe className="w-3 h-3" />
            Research
          </button>
        </div>

        {/* ================================================================== */}
        {/* MESSAGES */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="relative inline-block mb-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}10 100%)`,
                    boxShadow: `0 0 30px ${primaryColor}30`,
                  }}
                >
                  <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              
              <h4 className="text-white font-bold text-xl mb-2">
                Hi{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}! I'm Javari
              </h4>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                Your autonomous AI assistant. I can build apps, write code, research topics, 
                answer questions, and learn from every conversation.
              </p>
              
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                  <Code className="w-4 h-4 text-cyan-400 mb-1" />
                  <p className="text-xs text-gray-300 font-medium">Build & Code</p>
                  <p className="text-xs text-gray-500">Full-stack apps</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                  <Brain className="w-4 h-4 text-purple-400 mb-1" />
                  <p className="text-xs text-gray-300 font-medium">Learn & Adapt</p>
                  <p className="text-xs text-gray-500">Gets smarter daily</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                  <Globe className="w-4 h-4 text-blue-400 mb-1" />
                  <p className="text-xs text-gray-300 font-medium">Research</p>
                  <p className="text-xs text-gray-500">Real-time data</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-left">
                  <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                  <p className="text-xs text-gray-300 font-medium">6 AI Providers</p>
                  <p className="text-xs text-gray-500">Best for each task</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-br-md'
                    : message.error
                    ? 'bg-red-500/10 text-red-200 border border-red-500/30 rounded-bl-md'
                    : 'bg-gray-800/80 text-gray-100 rounded-bl-md'
                }`}
              >
                {/* Provider badge */}
                {message.role === 'assistant' && showProviderInfo && message.provider && !message.error && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700/50">
                    {(() => {
                      const provider = getProviderInfo(message.provider);
                      return (
                        <>
                          <span className="text-sm">{provider?.icon}</span>
                          <span className="text-xs font-medium" style={{ color: provider?.color }}>
                            {provider?.name}
                          </span>
                          {message.latency && (
                            <span className="text-xs text-gray-500">
                              • {formatLatency(message.latency)}
                            </span>
                          )}
                          {message.tokensUsed && (
                            <span className="text-xs text-gray-500">
                              • {message.tokensUsed} tokens
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* Message content */}
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                
                {/* Error retry */}
                {message.error && (
                  <button
                    onClick={handleRetry}
                    className="mt-3 flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Try again
                  </button>
                )}
                
                {/* Actions */}
                {message.role === 'assistant' && !message.error && (
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-700/50">
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                      title="Copy"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    {/* Feedback */}
                    {!message.feedback && (
                      <>
                        <button
                          onClick={() => handleFeedback(message.id, 'good')}
                          className="text-gray-500 hover:text-green-400 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'bad')}
                          className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                          title="Bad response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    
                    {message.feedback && (
                      <span className="text-xs text-gray-500 ml-1">
                        {message.feedback === 'good' ? '✓ Thanks!' : '✓ Will improve!'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 rounded-2xl rounded-bl-md p-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500">Javari is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* ================================================================== */}
        {/* INPUT */}
        {/* ================================================================== */}
        <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900/50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isTyping ? "Javari is responding..." : "Ask anything... Build apps, code, research..."}
              disabled={isTyping}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="rounded-xl px-4 transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: input.trim() && !isTyping ? primaryColor : '#374151',
                boxShadow: input.trim() && !isTyping ? `0 0 20px ${primaryColor}40` : 'none',
              }}
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">
              Powered by <span className="text-cyan-500 font-medium">Javari AI</span> • CR AudioViz AI
            </p>
            {isVIP && (
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Star className="w-3 h-3 fill-yellow-500" />
                VIP Priority
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
