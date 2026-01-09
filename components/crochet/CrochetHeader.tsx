/**
 * CrochetHeader - Header component for CrochetAI
 * Shows auth status, credit balance, and navigation
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, Coins, ChevronDown, LogOut, Settings, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
}

interface CrochetHeaderProps {
  user: UserProfile | null;
  creditBalance: number;
}

export default function CrochetHeader({ user, creditBalance }: CrochetHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-cyan-500 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="CR AudioViz AI"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <Link href="/apps" className="hover:text-cyan-500">Apps</Link>
              <span className="mx-2">›</span>
              <Link href="/hobbies" className="hover:text-cyan-500">Hobbies</Link>
              <span className="mx-2">›</span>
              <span className="text-cyan-500 font-medium">CrochetAI</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            {user && (
              <Link 
                href="/pricing"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-500 px-4 py-2 rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-colors"
              >
                <Coins className="w-4 h-4 text-cyan-500" />
                <span className="font-semibold text-cyan-500">{creditBalance.toLocaleString()}</span>
                <span className="text-xs text-gray-500">credits</span>
              </Link>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:border-cyan-500 transition-colors"
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-cyan-500" />
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium max-w-24 truncate">
                    {user.full_name || 'Account'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{creditBalance} credits</p>
                      </div>
                      
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Dashboard
                      </Link>
                      
                      <Link 
                        href="/pricing"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Buy Credits
                      </Link>
                      
                      <hr className="my-2" />
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login?redirect=/hobbies/crochet"
                  className="text-sm font-medium text-gray-600 hover:text-cyan-500 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?redirect=/hobbies/crochet&signup=true"
                  className="text-sm font-medium bg-cyan-500 text-white px-4 py-2 rounded-xl hover:bg-cyan-500 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
