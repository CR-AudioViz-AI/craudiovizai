// /components/JavariOnboarding.tsx
// Javari-Led Onboarding Experience - CR AudioViz AI
// Personal avatar-guided journey that creates real connection

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingData {
  name: string;
  useCase: string;
  interests: string[];
  experience: string;
  goals: string[];
  hasCompletedFirstChat: boolean;
}

interface JavariOnboardingProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onComplete: (data: OnboardingData) => void;
}

interface Message {
  id: string;
  type: 'javari' | 'user' | 'options' | 'input';
  content: string;
  options?: { id: string; label: string; icon?: string }[];
  inputType?: 'text' | 'multiselect';
  avatar?: boolean;
  delay?: number;
}

// =============================================================================
// JAVARI AVATAR COMPONENT
// =============================================================================

function JavariAvatar({ speaking = false, size = 'md' }: { speaking?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizes[size]}`}>
      {/* Glow effect when speaking */}
      {speaking && (
        <motion.div
          className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Avatar */}
      <motion.div
        className={`relative ${sizes[size]} bg-gradient-to-br from-blue-500 via-cyan-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg`}
        animate={speaking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: speaking ? Infinity : 0 }}
      >
        {/* Face */}
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <motion.div 
              className="w-2 h-2 bg-white rounded-full"
              animate={speaking ? { scaleY: [1, 0.5, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div 
              className="w-2 h-2 bg-white rounded-full"
              animate={speaking ? { scaleY: [1, 0.5, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity, delay: 0.1 }}
            />
          </div>
          {/* Mouth */}
          <motion.div 
            className="w-4 h-1.5 bg-white rounded-full mx-auto"
            animate={speaking ? { scaleX: [1, 1.3, 1], scaleY: [1, 1.5, 1] } : {}}
            transition={{ duration: 0.3, repeat: speaking ? Infinity : 0 }}
          />
        </div>
      </motion.div>

      {/* Status indicator */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 rounded-full border-2 border-white" />
    </div>
  );
}

// =============================================================================
// TYPING INDICATOR
// =============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 p-4">
      <JavariAvatar speaking size="sm" />
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <motion.span 
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span 
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span 
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

function MessageBubble({ message, onOptionSelect, onInputSubmit }: {
  message: Message;
  onOptionSelect?: (optionId: string) => void;
  onInputSubmit?: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  if (message.type === 'javari') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4"
      >
        {message.avatar !== false && <JavariAvatar size="sm" />}
        {message.avatar === false && <div className="w-10" />}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
          <p className="text-gray-900 dark:text-white whitespace-pre-line">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end p-4"
      >
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
          <p>{message.content}</p>
        </div>
      </motion.div>
    );
  }

  if (message.type === 'options' && message.options) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 pl-16"
      >
        <div className="flex flex-wrap gap-2">
          {message.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect?.(option.id)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center gap-2"
            >
              {option.icon && <span>{option.icon}</span>}
              <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (message.type === 'input') {
    if (message.inputType === 'multiselect' && message.options) {
      const toggleOption = (id: string) => {
        setSelectedOptions(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 pl-16"
        >
          <div className="grid grid-cols-3 gap-2 mb-4">
            {message.options.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedOptions.includes(option.id)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-xl block mb-1">{option.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => onInputSubmit?.(selectedOptions.join(','))}
            disabled={selectedOptions.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Continue with {selectedOptions.length} selected
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 pl-16"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                onInputSubmit?.(inputValue);
                setInputValue('');
              }
            }}
            placeholder={message.content}
            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-0"
            autoFocus
          />
          <button
            onClick={() => {
              if (inputValue.trim()) {
                onInputSubmit?.(inputValue);
                setInputValue('');
              }
            }}
            disabled={!inputValue.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

// =============================================================================
// MAIN JAVARI ONBOARDING COMPONENT
// =============================================================================

export function JavariOnboarding({ userId, userEmail, userName, onComplete }: JavariOnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<OnboardingData>({
    name: userName || '',
    useCase: '',
    interests: [],
    experience: '',
    goals: [],
    hasCompletedFirstChat: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Conversation flow
  const conversationFlow = [
    // Step 0: Introduction
    {
      messages: [
        { 
          id: 'intro1', 
          type: 'javari' as const, 
          content: "Hey there! 👋", 
          avatar: true,
          delay: 500
        },
        { 
          id: 'intro2', 
          type: 'javari' as const, 
          content: "I'm Javari - your personal AI assistant. I've been looking forward to meeting you!",
          avatar: false,
          delay: 1500
        },
        { 
          id: 'intro3', 
          type: 'javari' as const, 
          content: "Before we dive in, I'd love to get to know you a bit. What should I call you?",
          avatar: false,
          delay: 1500
        },
        { 
          id: 'name_input', 
          type: 'input' as const, 
          content: "Type your name...",
          inputType: 'text' as const,
          delay: 500
        }
      ],
      onResponse: (value: string) => {
        setUserData(prev => ({ ...prev, name: value }));
      }
    },
    // Step 1: Personalized greeting + use case
    {
      messages: (data: OnboardingData) => [
        { 
          id: 'greeting1', 
          type: 'javari' as const, 
          content: `${data.name}! I love that name! ✨`,
          delay: 800
        },
        { 
          id: 'greeting2', 
          type: 'javari' as const, 
          content: `So ${data.name}, I'm curious - what brings you to me today? How are you hoping I can help?`,
          avatar: false,
          delay: 1500
        },
        { 
          id: 'usecase_options', 
          type: 'options' as const, 
          content: '',
          options: [
            { id: 'personal', label: 'Personal projects', icon: '👤' },
            { id: 'business', label: 'Business work', icon: '💼' },
            { id: 'creator', label: 'Creating content', icon: '🎨' },
            { id: 'developer', label: 'Building apps', icon: '💻' },
            { id: 'learning', label: 'Learning new things', icon: '📚' },
            { id: 'exploring', label: 'Just exploring!', icon: '🔍' }
          ],
          delay: 500
        }
      ],
      onResponse: (value: string) => {
        setUserData(prev => ({ ...prev, useCase: value }));
      }
    },
    // Step 2: React to use case + interests
    {
      messages: (data: OnboardingData) => {
        const reactions: Record<string, string> = {
          personal: "Personal projects are my favorite! There's something special about building things just for yourself.",
          business: "Ah, a professional! I love helping people crush it at work. Let's make you look like a rockstar.",
          creator: "A fellow creative! 🎨 I have so many tools to help you bring your ideas to life.",
          developer: "Ooh, a builder! We're going to get along great. I can help with code, debugging, architecture - you name it.",
          learning: "A curious mind! That's the best kind. I'll be your study buddy and knowledge companion.",
          exploring: "An explorer! I respect that. Let me show you around - there's a lot to discover here."
        };
        
        return [
          { 
            id: 'react1', 
            type: 'javari' as const, 
            content: reactions[data.useCase] || "Awesome! I'm excited to help.",
            delay: 800
          },
          { 
            id: 'react2', 
            type: 'javari' as const, 
            content: "Now let me ask - what topics get you excited? Pick everything that sparks your interest:",
            avatar: false,
            delay: 1500
          },
          { 
            id: 'interests_input', 
            type: 'input' as const, 
            content: '',
            inputType: 'multiselect' as const,
            options: [
              { id: 'writing', icon: '✍️', label: 'Writing' },
              { id: 'coding', icon: '💻', label: 'Coding' },
              { id: 'design', icon: '🎨', label: 'Design' },
              { id: 'marketing', icon: '📈', label: 'Marketing' },
              { id: 'research', icon: '🔍', label: 'Research' },
              { id: 'music', icon: '🎵', label: 'Music' },
              { id: 'video', icon: '🎬', label: 'Video' },
              { id: 'business', icon: '💼', label: 'Business' },
              { id: 'games', icon: '🎮', label: 'Games' },
              { id: 'social', icon: '💬', label: 'Social' },
              { id: 'learning', icon: '📚', label: 'Learning' },
              { id: 'productivity', icon: '⚡', label: 'Productivity' }
            ],
            delay: 500
          }
        ];
      },
      onResponse: (value: string) => {
        setUserData(prev => ({ ...prev, interests: value.split(',') }));
      }
    },
    // Step 3: Experience level
    {
      messages: (data: OnboardingData) => [
        { 
          id: 'exp1', 
          type: 'javari' as const, 
          content: `${data.interests.length > 3 ? "Wow, you've got diverse interests!" : "Great choices!"} I'm already thinking of ways I can help you with those.`,
          delay: 800
        },
        { 
          id: 'exp2', 
          type: 'javari' as const, 
          content: "One more thing - have you used AI assistants like me before? This helps me know how to talk to you.",
          avatar: false,
          delay: 1500
        },
        { 
          id: 'experience_options', 
          type: 'options' as const, 
          content: '',
          options: [
            { id: 'beginner', label: "I'm new to this!", icon: '🌱' },
            { id: 'intermediate', label: "Used ChatGPT etc.", icon: '🌿' },
            { id: 'advanced', label: "I'm a power user", icon: '🌳' }
          ],
          delay: 500
        }
      ],
      onResponse: (value: string) => {
        setUserData(prev => ({ ...prev, experience: value }));
      }
    },
    // Step 4: Completion
    {
      messages: (data: OnboardingData) => {
        const expResponses: Record<string, string> = {
          beginner: `Perfect! I'll make sure to explain things clearly and guide you every step of the way. No jargon, I promise.`,
          intermediate: `Great, so you know the basics! I'll skip the hand-holding but still make sure everything is crystal clear.`,
          advanced: `A power user! Excellent. I'll keep things efficient and dive deep when you want. Let's do some cool stuff together.`
        };

        return [
          { 
            id: 'final1', 
            type: 'javari' as const, 
            content: expResponses[data.experience] || "Perfect!",
            delay: 800
          },
          { 
            id: 'final2', 
            type: 'javari' as const, 
            content: `${data.name}, I'm SO excited to work with you! 🎉`,
            avatar: false,
            delay: 1500
          },
          { 
            id: 'final3', 
            type: 'javari' as const, 
            content: "I've set up your account with 50 free credits to get started. Here's what I recommend we do first:",
            avatar: false,
            delay: 1500
          },
          { 
            id: 'final4', 
            type: 'javari' as const, 
            content: data.interests.includes('design') 
              ? "→ Check out the Logo Creator - you can make something awesome in minutes!"
              : data.interests.includes('writing')
              ? "→ Try the Document Writer - I'll help you write anything from emails to reports!"
              : data.interests.includes('games')
              ? "→ Hit up the Games Hub - sometimes you need a break, I get it 😄"
              : "→ Let's just chat! Ask me anything and I'll show you what I can do.",
            avatar: false,
            delay: 1500
          },
          { 
            id: 'ready_options', 
            type: 'options' as const, 
            content: '',
            options: [
              { id: 'ready', label: "Let's go! 🚀", icon: '' },
              { id: 'chat', label: "Chat with me first", icon: '💬' }
            ],
            delay: 500
          }
        ];
      },
      onResponse: (value: string) => {
        if (value === 'ready') {
          saveAndComplete();
        } else {
          // Start free chat mode
          setMessages(prev => [
            ...prev,
            { id: 'user_chat', type: 'user', content: "Chat with me first" },
            { 
              id: 'chat_mode', 
              type: 'javari', 
              content: `Absolutely, ${userData.name}! I'm all yours. What would you like to talk about? Ask me anything - seriously, anything! 😊`,
              delay: 800
            }
          ]);
        }
      }
    }
  ];

  // Start conversation
  useEffect(() => {
    if (currentStep === 0 && messages.length === 0) {
      playMessages(conversationFlow[0].messages);
    }
  }, []);

  const playMessages = async (msgs: Message[] | ((data: OnboardingData) => Message[])) => {
    const messagesToPlay = typeof msgs === 'function' ? msgs(userData) : msgs;
    
    for (const msg of messagesToPlay) {
      if (msg.type === 'javari') {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, msg.delay || 1000));
        setIsTyping(false);
      }
      
      setMessages(prev => [...prev, msg]);
      
      if (msg.type === 'options' || msg.type === 'input') {
        break; // Wait for user response
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleOptionSelect = (optionId: string) => {
    const currentFlow = conversationFlow[currentStep];
    const msgs = typeof currentFlow.messages === 'function' 
      ? currentFlow.messages(userData) 
      : currentFlow.messages;
    
    const selectedOption = msgs
      .find(m => m.type === 'options')?.options
      ?.find(o => o.id === optionId);
    
    // Add user response
    setMessages(prev => [...prev, {
      id: `user_${Date.now()}`,
      type: 'user',
      content: selectedOption?.label || optionId
    }]);

    // Process response
    currentFlow.onResponse?.(optionId);

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < conversationFlow.length) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        playMessages(conversationFlow[nextStep].messages);
      }, 500);
    }
  };

  const handleInputSubmit = (value: string) => {
    // Add user response
    setMessages(prev => [...prev, {
      id: `user_${Date.now()}`,
      type: 'user',
      content: value.includes(',') ? `Selected ${value.split(',').length} interests` : value
    }]);

    // Process response
    conversationFlow[currentStep].onResponse?.(value);

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < conversationFlow.length) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        playMessages(conversationFlow[nextStep].messages);
      }, 500);
    }
  };

  const saveAndComplete = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...userData,
          completedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save onboarding:', error);
    }

    onComplete(userData);
  };

  const progress = ((currentStep + 1) / conversationFlow.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <JavariAvatar size="sm" speaking={isTyping} />
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-white">Javari</h1>
            <p className="text-xs text-cyan-500 dark:text-cyan-500">Online • Ready to help</p>
          </div>
          {/* Progress */}
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onOptionSelect={handleOptionSelect}
                onInputSubmit={handleInputSubmit}
              />
            ))}
          </AnimatePresence>
          
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default JavariOnboarding;
