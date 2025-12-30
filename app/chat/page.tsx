// /app/chat/page.tsx
// Javari AI Chat Interface - CR AudioViz AI
// The core AI assistant chat experience

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  creditCost?: number;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

// =============================================================================
// COMPONENTS
// =============================================================================

function JavariAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <div className={`relative ${speaking ? 'animate-pulse' : ''}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
        {/* Face */}
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-1.5 mb-0.5">
            <div className={`w-1.5 h-1.5 bg-white rounded-full ${speaking ? 'animate-bounce' : ''}`} />
            <div className={`w-1.5 h-1.5 bg-white rounded-full ${speaking ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }} />
          </div>
          {/* Mouth */}
          <div className={`w-3 h-1 bg-white rounded-full mx-auto ${speaking ? 'h-1.5' : ''} transition-all`} />
        </div>
      </div>
      {speaking && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </div>
  );
}

function MessageBubble({ message, isTyping = false }: { message: Message; isTyping?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          👤
        </div>
      ) : (
        <JavariAvatar speaking={isTyping} />
      )}

      {/* Message */}
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none shadow-lg'
          }`}
        >
          {isTyping ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.creditCost && !isUser && (
            <span className="ml-2">• {message.creditCost} credit</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  const prompts = [
    { icon: '🎨', text: 'Create a logo for my business' },
    { icon: '📝', text: 'Write a professional email' },
    { icon: '💡', text: 'Help me brainstorm ideas' },
    { icon: '📊', text: 'Analyze some data for me' },
    { icon: '🔍', text: 'Research a topic' },
    { icon: '✨', text: 'Surprise me with something fun' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(prompt.text)}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all text-left"
        >
          <span className="text-xl">{prompt.icon}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{prompt.text}</span>
        </button>
      ))}
    </div>
  );
}

function ConversationSidebar({ 
  conversations, 
  activeId, 
  onSelect, 
  onNew 
}: { 
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNew}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
        >
          + New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full p-3 rounded-lg text-left mb-1 transition-colors ${
              activeId === conv.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <p className="font-medium text-sm truncate">{conv.title}</p>
            <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(450);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [conversations] = useState<Conversation[]>([
    { id: '1', title: 'Logo design ideas', lastMessage: 'Here are some concepts...', timestamp: new Date() },
    { id: '2', title: 'Business plan help', lastMessage: 'Let me outline the key sections...', timestamp: new Date() },
    { id: '3', title: 'Marketing strategy', lastMessage: 'For your target audience...', timestamp: new Date() }
  ]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle URL prompt parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get('prompt');
    if (prompt) {
      setInput(prompt);
      inputRef.current?.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I'd be happy to help you with that! Let me think about the best approach...",
        "Great question! Here's what I can do for you...",
        "That sounds like an interesting project. Let me share some ideas...",
        "I understand what you're looking for. Here's my recommendation...",
        "Absolutely! I can help you create something amazing. Let's get started..."
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)] + 
          "\n\nI've analyzed your request and here are my thoughts:\n\n" +
          "1. First, we should consider the main goals\n" +
          "2. Then, we can explore different approaches\n" +
          "3. Finally, I'll help you implement the best solution\n\n" +
          "Would you like me to elaborate on any of these points?",
        timestamp: new Date(),
        creditCost: 1
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCredits(prev => prev - 1);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveConversation(null);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversation}
          onSelect={setActiveConversation}
          onNew={handleNewChat}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ☰
              </button>
              <div className="flex items-center gap-3">
                <JavariAvatar />
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white">Javari AI</h1>
                  <p className="text-xs text-green-600">Online • Ready to help</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  💳 {credits} credits
                </span>
              </div>
              <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                Get more
              </Link>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="relative">
                    <div className="flex gap-2 mb-1">
                      <div className="w-3 h-3 bg-white rounded-full" />
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    <div className="w-5 h-2 bg-white rounded-full mx-auto" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Hi! I'm Javari 👋
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Your AI assistant for creativity, productivity, and everything in between.
                  What would you like to work on today?
                </p>
              </div>
              <QuickPrompts onSelect={(prompt) => setInput(prompt)} />
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <MessageBubble
                  message={{ id: 'typing', role: 'assistant', content: '', timestamp: new Date() }}
                  isTyping
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Javari... (Shift+Enter for new line)"
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
                <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
                  📎
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>1 credit per message • Credits never expire on paid plans</span>
              <span>Powered by Claude & GPT-4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
