'use client';

/**
 * CreditsBar - Logged-in User Plan & Credits Display
 * 
 * Shows under CR Bar for logged-in users:
 * - Plan name (Free, Starter, Pro, Premium)
 * - Credits balance
 * - Upgrade button (links to /pricing)
 * - Top Up button (links to /pricing#credits)
 * 
 * Hidden for logged-out users.
 * 
 * @timestamp January 7, 2026 - 11:54 AM EST
 * @author Claude (for Roy Henderson)
 */

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins, ArrowUp, Plus, Crown, Sparkles, Zap } from 'lucide-react';

interface UserPlan {
  plan_name: string;
  credits: number;
  is_admin: boolean;
}

const PLAN_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Free: { bg: 'bg-gray-700', text: 'text-gray-300', icon: <Sparkles className="w-3 h-3" /> },
  Starter: { bg: 'bg-blue-600', text: 'text-blue-100', icon: <Zap className="w-3 h-3" /> },
  Pro: { bg: 'bg-purple-600', text: 'text-purple-100', icon: <Crown className="w-3 h-3" /> },
  Premium: { bg: 'bg-amber-500', text: 'text-amber-100', icon: <Crown className="w-3 h-3" /> },
  Admin: { bg: 'bg-red-600', text: 'text-red-100', icon: <Crown className="w-3 h-3" /> },
};

export default function CreditsBar() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan_name, credits, is_admin')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          // Create default profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              plan_name: 'Free',
              credits: 50,
              is_admin: false
            })
            .select()
            .single();

          if (newProfile) {
            setUserPlan(newProfile);
          } else {
            setUserPlan({ plan_name: 'Free', credits: 50, is_admin: false });
          }
        } else {
          setUserPlan(profile);
        }
      } catch (error) {
        console.error('Error loading user plan:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserPlan();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        loadUserPlan();
      } else {
        setIsLoggedIn(false);
        setUserPlan(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Don't render anything if not logged in
  if (!isLoggedIn || loading) {
    return null;
  }

  const planKey = userPlan?.is_admin ? 'Admin' : (userPlan?.plan_name || 'Free');
  const planStyle = PLAN_COLORS[planKey] || PLAN_COLORS.Free;
  const showUpgrade = !userPlan?.is_admin && planKey !== 'Premium';

  return (
    <div className="bg-slate-900/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-sm">
          {/* Left: Plan Badge + Credits */}
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <Link 
              href="/pricing" 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${planStyle.bg} ${planStyle.text} hover:opacity-90 transition-opacity`}
            >
              {planStyle.icon}
              <span className="font-medium">{planKey}</span>
            </Link>
            
            {/* Credits */}
            <div className="flex items-center gap-1.5 text-gray-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-medium">{userPlan?.credits?.toLocaleString() || 0}</span>
              <span className="text-gray-500">credits</span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Top Up */}
            <Link
              href="/pricing#credits"
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Top Up</span>
            </Link>

            {/* Upgrade (if not Premium/Admin) */}
            {showUpgrade && (
              <Link
                href="/pricing"
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all"
              >
                <ArrowUp className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
