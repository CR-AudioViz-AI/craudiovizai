// components/javari/JavariInterface.tsx
// The main interface for users to interact with Javari
// This component provides context Javari needs to help users
// Timestamp: Dec 11, 2025 10:55 PM EST

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, X, Send, Loader2, Sparkles, 
  Mic, MicOff, Image, FileText, Paperclip,
  ChevronDown, Settings, Minimize2, Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tool_calls?: any[];
  attachments?: any[];
}

interface JavariInterfaceProps {
  userId: string;
  userCredits: number;
  currentPage?: string;
  userPreferences?: any;
  onCreditsUsed?: (amount: number) => void;
}

export function JavariInterface({
  userId,
  userCredits,
  currentPage,
  userPreferences,
  onCreditsUsed,
}: JavariInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Context-aware suggestions based on current page
  const getSuggestions = useCallback(() => {
    const suggestions: Record<string, string[]> = {
      '/apps': [
        'Help me create an AI image',
        'What tools can help with video?',
        'How many credits do I have?',
      ],
      '/dashboard': [
        'Show my recent creations',
        'How do I get more credits?',
        'Explain my usage this month',
      ],
      '/games': [
        'Recommend a puzzle game',
        'Show me multiplayer games',
        'What games are trending?',
      ],
      '/craiverse': [
        'How can my organization join?',
        'What grants are available?',
        'Explain the social impact modules',
      ],
      default: [
        'What can you help me with?',
        'Generate an image for me',
        'How do credits work?',
      ],
    };
    return suggestions[currentPage || 'default'] || suggestions.default;
  }, [currentPage]);

  // Initialize session
  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  const initSession = async () => {
    try {
      const response = await fetch('/api/javari/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      setSessionId(data.session_id);
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm Javari, your AI creative assistant. You have ${userCredits.toLocaleString()} credits available. How can I help you today?`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to init session:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/javari/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message: content,
          context: {
            current_page: currentPage,
            credits_available: userCredits,
            preferences: userPreferences,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        tool_calls: data.tool_calls,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If credits were used, notify parent
      if (data.credits_used && onCreditsUsed) {
        onCreditsUsed(data.credits_used);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        aria-label="Open Javari Assistant"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all ${
        isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Javari AI</h3>
            {!isMinimized && (
              <p className="text-xs text-white/70">{userCredits.toLocaleString()} credits</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 h-[440px] bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 ${
                  msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Show tool usage */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {msg.tool_calls.map((tool: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Used: {tool.name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[10px] opacity-50 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggestions */}
            {showSuggestions && messages.length === 1 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestions().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Javari anything..."
                  rows={1}
                  className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  style={{ maxHeight: '100px' }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button 
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-1.5 ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Voice input"
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default JavariInterface;
