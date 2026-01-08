'use client';

/**
 * CR AudioViz AI - Combined TopBar Component
 * 
 * Single bar combining:
 * - Left: CR = [rotating phrase] 
 * - Right: Credits info (logged in) or "Log in to see plan details" text (logged out)
 * 
 * NO duplicate login buttons - those are in the Header
 * Every 25th rotation shows "Cindy & Roy"
 * 
 * @timestamp January 8, 2026
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Zap } from 'lucide-react';

// Comprehensive list of CR phrases - every clean C + R word combination
const CR_PHRASES = [
  // Original phrases
  "Creative Results",
  "Customer Rewards", 
  "Cutting-edge Resources",
  "Community Reach",
  "Content Revolution",
  "Collaborative Realms",
  "Curated Riches",
  "Captivating Realities",
  "Clever Resources",
  "Comprehensive Results",
  "Connected Realms",
  "Crafted Reactions",
  "Crystal Reality",
  "Continuous Rewards",
  "Certified Reliability",
  "Compelling Reasons",
  "Confident Returns",
  "Celebrated Revelations",
  "Curious Roaming",
  "Countless Riches",
  "Cohesive Resources",
  "Conquering Realms",
  "Cultivated Rewards",
  "Collaborative Reach",
  // Additional C + R combinations
  "Capable Responses",
  "Caring Relationships",
  "Celebrated Results",
  "Central Resources",
  "Certain Returns",
  "Champion Rank",
  "Charged Reactions",
  "Charming Results",
  "Clear Reasoning",
  "Clever Renditions",
  "Cloud Resources",
  "Coastal Retreats",
  "Coded Reality",
  "Colorful Renders",
  "Combined Reach",
  "Commanding Respect",
  "Complete Resources",
  "Concentrated Results",
  "Connected Reality",
  "Conscious Responsibility",
  "Consistent Results",
  "Constructive Reviews",
  "Core Reliability",
  "Cosmic Rays",
  "Creative Reach",
  "Crisp Resolution",
  "Critical Reviews",
  "Crowning Rewards",
  "Crucial Resources",
  "Cumulative Returns",
  "Curious Readers",
  "Current Relevance",
  "Custom Requests",
  "Cybernetic Realms",
];

export default function TopBar() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [rotationCount, setRotationCount] = useState(0);
  const [showCindyRoy, setShowCindyRoy] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('Free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Rotate CR phrases - slower (5 seconds), every 25th shows "Cindy & Roy"
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationCount(prev => {
        const newCount = prev + 1;
        // Every 25th rotation, show "Cindy & Roy"
        if (newCount % 25 === 0) {
          setShowCindyRoy(true);
          setTimeout(() => setShowCindyRoy(false), 5000); // Show for one full cycle
        }
        return newCount;
      });
      setCurrentPhraseIndex((prev) => (prev + 1) % CR_PHRASES.length);
    }, 5000); // 5 seconds per phrase

    return () => clearInterval(interval);
  }, []);

  // Fetch user data and credits
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          
          // Check if admin
          const adminEmails = ['royhenderson@craudiovizai.com', 'cindyhenderson@craudiovizai.com'];
          const isAdminEmail = user.email && adminEmails.includes(user.email.toLowerCase());
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits, subscription_tier, is_admin, role')
            .eq('id', user.id)
            .single();

          const isAdminUser = profile?.is_admin || profile?.role === 'admin' || isAdminEmail;
          setIsAdmin(isAdminUser);

          if (isAdminUser) {
            setCredits(Infinity);
            setPlan('Admin');
          } else if (profile) {
            setCredits(profile.credits ?? 0);
            setPlan(profile.subscription_tier || 'Free');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const displayPhrase = showCindyRoy ? "Cindy & Roy" : CR_PHRASES[currentPhraseIndex];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-green-600 h-8 flex items-center justify-between px-4 text-white text-sm border-b border-white/20">
      {/* Left side: CR = rotating phrase */}
      <div className="flex items-center gap-2">
        <span className="font-semibold">CR</span>
        <span className="text-white/70">=</span>
        <span 
          key={showCindyRoy ? 'cindy-roy' : currentPhraseIndex}
          className={`transition-opacity duration-500 ${showCindyRoy ? 'text-pink-200 font-semibold' : ''}`}
        >
          {displayPhrase}
        </span>
      </div>

      {/* Right side: Credits info or login prompt */}
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-24 h-5 bg-white/20 rounded animate-pulse" />
        ) : user ? (
          // Logged in - show plan and credits
          <div className="flex items-center gap-3">
            {/* Plan badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isAdmin ? 'bg-yellow-500/30 text-yellow-200' :
              plan === 'Pro' ? 'bg-purple-500/30 text-purple-200' :
              plan === 'Enterprise' ? 'bg-blue-500/30 text-blue-200' :
              'bg-white/20 text-white/80'
            }`}>
              <Sparkles className="w-3 h-3 inline mr-1" />
              {isAdmin ? 'Admin' : plan}
            </span>

            {/* Credits */}
            <span className="flex items-center gap-1 text-white/90">
              <Zap className="w-3 h-3" />
              {isAdmin ? '∞' : credits?.toLocaleString()} credits
            </span>

            {/* Top up / Upgrade link */}
            {!isAdmin && (
              <Link
                href="/pricing"
                className="text-xs text-white/70 hover:text-white transition-colors underline"
              >
                {plan === 'Free' ? 'Upgrade' : 'Top Up'}
              </Link>
            )}
          </div>
        ) : (
          // Logged out - just text, no buttons (buttons are in header)
          <span className="text-white/70 text-xs">
            Log in to see plan details
          </span>
        )}
      </div>
    </div>
  );
}
