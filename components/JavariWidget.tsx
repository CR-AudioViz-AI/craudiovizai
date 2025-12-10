'use client';

/**
 * CR AudioViz AI - Javari AI Chat Widget
 * 
 * A REAL embedded chat widget that:
 * - Floats on bottom-right of every page
 * - Opens an actual chat interface
 * - Connects to Claude/OpenAI API
 * - Has streaming responses
 * - Context-aware based on current page
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * 
 * @timestamp Tuesday, December 10, 2024 - 12:50 AM EST
 * @author Claude (for Roy Henderson)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Loader2,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Page-specific welcome messages and quick actions
const PAGE_CONTEXTS: Record<string, { 
  page: string; 
  welcomeMessage: string; 
  quickActions: string[] 
}> = {
  '/': {
    page: 'Home',
    welcomeMessage: "Hi! I'm Javari, your AI assistant. How can I help you today?",
    quickActions: [
      'What can I create with this platform?',
      'Show me pricing options',
      'How do credits work?',
      'Tell me about the tools available'
    ]
  },
  '/pricing': {
    page: 'Pricing',
    welcomeMessage: "Looking at our pricing? I can help you choose the perfect plan!",
    quickActions: [
      'Which plan is best for me?',
      'How do credits work?',
      'Can I change plans later?',
      "What's included in each tier?"
    ]
  },
  '/apps': {
    page: 'Apps',
    welcomeMessage: "Explore our 60+ creative tools! Need help finding the right one?",
    quickActions: [
      'What tools are best for video editing?',
      'Show me audio creation tools',
      'Which tools are most popular?',
      'How do I use multiple tools together?'
    ]
  },
  '/games': {
    page: 'Games',
    welcomeMessage: "Welcome to our gaming hub! We have 1200+ games to explore.",
    quickActions: [
      'Show me popular games',
      'What game categories do you have?',
      'How do I save my progress?',
      'Can I create my own games?'
    ]
  },
  '/javari': {
    page: 'Javari AI',
    welcomeMessage: "You're on my main page! Want to see what I can do?",
    quickActions: [
      'What are your capabilities?',
      'Show me examples',
      'How do I get started?',
      'What makes you different from ChatGPT?'
    ]
  },
  '/craiverse': {
    page: 'CRAIverse',
    welcomeMessage: "Welcome to CRAIverse - our virtual world platform!",
    quickActions: [
      'What is CRAIverse?',
      'How do I create an avatar?',
      'What modules are available?',
      'Tell me about social impact features'
    ]
  },
};

type ChatState = 'closed' | 'minimized' | 'open';

export default function JavariWidget() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Get context based on current page
  const context = PAGE_CONTEXTS[pathname] || PAGE_CONTEXTS['/'];

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatState === 'open') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatState]);

  // Initialize with welcome message when first opened
  useEffect(() => {
    if (chatState === 'open' && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: context.welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [chatState, context.welcomeMessage, messages.length]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setChatState(prev => prev === 'open' ? 'closed' : 'open');
      }
      // Escape to close
      if (e.key === 'Escape' && chatState === 'open') {
        setChatState('closed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatState]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/javari/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          pageContext: context.page,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or refresh the page.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  // Floating button when closed
  if (chatState === 'closed') {
    return (
      <button
        onClick={() => {
          setChatState('open');
          setHasUnread(false);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white z-50 hover:scale-110 group"
        aria-label="Chat with Javari AI"
      >
        <MessageSquare className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat with Javari AI
          <span className="ml-2 text-gray-400 text-xs">⌘K</span>
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </button>
    );
  }

  // Minimized state
  if (chatState === 'minimized') {
    return (
      <button
        onClick={() => setChatState('open')}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-50"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">Javari AI</span>
        <Maximize2 className="w-4 h-4" />
        {hasUnread && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  // Full chat interface
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">Javari AI</h3>
            <p className="text-xs text-white/80">
              {isLoading ? 'Thinking...' : `Helping on ${context.page}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChatState('minimized')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChatState('closed')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (only show when few messages) */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {context.quickActions.slice(0, 3).map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Javari anything..."
            className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd> to toggle
        </p>
      </form>
    </div>
  );
}
