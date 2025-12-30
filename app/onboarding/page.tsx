// /app/onboarding/page.tsx
// Onboarding Page - CR AudioViz AI / Javari
// New user onboarding flow entry point

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JavariOnboarding from '@/components/Onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    checkUserAndOnboardingStatus();
  }, []);

  const checkUserAndOnboardingStatus = async () => {
    try {
      // Get current user session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (!session?.user) {
        // Not logged in, redirect to login
        router.push('/login?redirect=/onboarding');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name
      });

      // Check if onboarding already completed
      const statusRes = await fetch(`/api/user/onboarding?userId=${session.user.id}`);
      const status = await statusRes.json();

      if (status.completed) {
        setAlreadyCompleted(true);
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (data: any) => {
    // Track completion
    console.log('Onboarding completed:', data);
    
    // Redirect to dashboard
    router.push('/dashboard?welcome=true');
  };

  const handleSkipAll = async () => {
    if (!user) return;

    // Save minimal data
    await fetch('/api/user/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: user.name || 'Friend',
        useCase: 'other',
        interests: [],
        experience: 'intermediate',
        goals: [],
        completedAt: new Date().toISOString()
      })
    });

    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Already Set Up!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to continue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Onboarding
      userId={user.id}
      userEmail={user.email}
      userName={user.name}
      onComplete={handleComplete}
      onSkipAll={handleSkipAll}
    />
  );
}
