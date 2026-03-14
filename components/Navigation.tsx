// /components/Navigation.tsx
// Global Navigation - CR AudioViz AI
// Responsive header with user menu, credits, and quick actions

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    tier: string;
    credits: number;
  };
}

export default function Navigation({ user }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: '/hub', label: 'Tools', icon: '🛠️' },
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/games', label: 'Games', icon: '🎮' },
    { href: 'https://create.craudiovizai.com', label: 'Create', icon: '✏️' },
    { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
    { href: '/pricing', label: 'Pricing', icon: '💎' }
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <div className="relative">
                <div className="flex gap-1 mb-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="w-3 h-1 bg-white rounded-full mx-auto" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 dark:text-white">Javari</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">AI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Credits Badge */}
                <Link
                  href="/pricing"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-slate-900/30 rounded-lg hover:bg-cyan-100 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <span className="text-cyan-600 dark:text-cyan-400">💳</span>
                  <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                    {user.credits.toLocaleString()}
                  </span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.avatar || user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                        >
                          {/* User Info */}
                          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-cyan-100 dark:bg-slate-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-medium rounded-full">
                                {user.tier}
                              </span>
                              <span className="text-sm text-gray-500">
                                {user.credits.toLocaleString()} credits
                              </span>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <span>📊</span> Dashboard
                            </Link>
                            <Link
                              href="/settings"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <span>⚙️</span> Settings
                            </Link>
                            <Link
                              href="/marketplace/sell"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <span>🏪</span> Seller Dashboard
                            </Link>
                            <Link
                              href="/support"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <span>❓</span> Help & Support
                            </Link>
                          </div>

                          {/* Logout */}
                          <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                            <button
                              className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => {
                                // Handle logout
                                setUserMenuOpen(false);
                              }}
                            >
                              <span>🚪</span> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
              </nav>

              {user && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 bg-cyan-50 dark:bg-slate-900/30 rounded-lg"
                  >
                    <span className="font-medium text-cyan-700 dark:text-cyan-300">Credits</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">{user.credits.toLocaleString()}</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
