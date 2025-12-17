'use client';

/**
 * LAUNCH CHECKLIST - PLATFORM-SPECIFIC GUIDES
 * CR AudioViz AI - craudiovizai.com/marketing/launch-checklist
 * Optimized checklists for Product Hunt, HN, Reddit, etc.
 * Created: December 16, 2025
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Rocket, ChevronLeft, Check, Clock, AlertCircle, 
  ExternalLink, ChevronDown, ChevronUp, Calendar,
  Users, Target, Sparkles, Share2, Star
} from 'lucide-react';

// Platform Checklists
const PLATFORM_CHECKLISTS = {
  'product-hunt': {
    name: 'Product Hunt',
    url: 'https://producthunt.com',
    color: 'from-orange-500 to-red-500',
    optimalTime: '12:01 AM PST (3:01 AM EST)',
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    difficulty: 'Medium',
    sections: [
      {
        title: '2 Weeks Before Launch',
        tasks: [
          { id: 'ph-1', text: 'Create Product Hunt account and verify email', priority: 'high' },
          { id: 'ph-2', text: 'Build your hunter network (find an established hunter to launch your product)', priority: 'high' },
          { id: 'ph-3', text: 'Prepare 5-6 high-quality product images (1270x760px)', priority: 'high' },
          { id: 'ph-4', text: 'Write compelling tagline (60 chars max)', priority: 'high' },
          { id: 'ph-5', text: 'Create demo video or GIF (highly recommended)', priority: 'medium' },
          { id: 'ph-6', text: 'Prepare detailed description with key features', priority: 'high' },
        ]
      },
      {
        title: '1 Week Before Launch',
        tasks: [
          { id: 'ph-7', text: 'Schedule launch date (Tue-Thu recommended)', priority: 'high' },
          { id: 'ph-8', text: 'Prepare launch day email to your existing users', priority: 'medium' },
          { id: 'ph-9', text: 'Create social media content for launch day', priority: 'medium' },
          { id: 'ph-10', text: 'Brief your team on engagement strategy', priority: 'high' },
          { id: 'ph-11', text: 'Prepare "Maker Comment" - your story and why you built this', priority: 'high' },
        ]
      },
      {
        title: 'Launch Day',
        tasks: [
          { id: 'ph-12', text: 'Launch at 12:01 AM PST (not earlier!)', priority: 'high' },
          { id: 'ph-13', text: 'Post your Maker Comment immediately', priority: 'high' },
          { id: 'ph-14', text: 'Share on social media and email your list', priority: 'high' },
          { id: 'ph-15', text: 'Respond to EVERY comment within 1 hour', priority: 'high' },
          { id: 'ph-16', text: 'Stay active all 24 hours (have team coverage)', priority: 'medium' },
          { id: 'ph-17', text: 'Thank everyone who upvotes or comments', priority: 'medium' },
        ]
      },
      {
        title: 'After Launch',
        tasks: [
          { id: 'ph-18', text: 'Send thank you messages to supporters', priority: 'medium' },
          { id: 'ph-19', text: 'Analyze traffic and conversion data', priority: 'high' },
          { id: 'ph-20', text: 'Follow up with users who signed up', priority: 'high' },
        ]
      }
    ]
  },
  'hacker-news': {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    color: 'from-orange-400 to-orange-600',
    optimalTime: '8-10 AM EST on weekdays',
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    difficulty: 'Hard',
    sections: [
      {
        title: 'Before Posting',
        tasks: [
          { id: 'hn-1', text: 'Read HN guidelines and understand the culture', priority: 'high' },
          { id: 'hn-2', text: 'Build karma by commenting thoughtfully first', priority: 'high' },
          { id: 'hn-3', text: 'Prepare authentic, technical content', priority: 'high' },
          { id: 'hn-4', text: 'Use "Show HN:" prefix for your own projects', priority: 'high' },
          { id: 'hn-5', text: 'Write technical blog post about your approach', priority: 'medium' },
        ]
      },
      {
        title: 'Posting Strategy',
        tasks: [
          { id: 'hn-6', text: 'Post during US business hours (8-10 AM EST best)', priority: 'high' },
          { id: 'hn-7', text: 'Avoid weekends and holidays', priority: 'medium' },
          { id: 'hn-8', text: 'Title must be factual, not marketing speak', priority: 'high' },
          { id: 'hn-9', text: 'Include technical details in description', priority: 'high' },
        ]
      },
      {
        title: 'Engagement',
        tasks: [
          { id: 'hn-10', text: 'Never ask for upvotes (instant death)', priority: 'high' },
          { id: 'hn-11', text: 'Answer technical questions in depth', priority: 'high' },
          { id: 'hn-12', text: 'Be authentic about challenges and failures', priority: 'medium' },
          { id: 'hn-13', text: 'Engage genuinely, not defensively', priority: 'high' },
        ]
      }
    ]
  },
  'reddit': {
    name: 'Reddit',
    url: 'https://reddit.com',
    color: 'from-orange-500 to-red-600',
    optimalTime: 'Varies by subreddit',
    bestDays: ['Any day'],
    difficulty: 'Medium',
    sections: [
      {
        title: 'Preparation',
        tasks: [
          { id: 'rd-1', text: 'Identify 5-10 relevant subreddits for your niche', priority: 'high' },
          { id: 'rd-2', text: 'Read rules of each subreddit carefully', priority: 'high' },
          { id: 'rd-3', text: 'Build karma by being helpful in communities first', priority: 'high' },
          { id: 'rd-4', text: 'Understand what type of content works in each sub', priority: 'medium' },
        ]
      },
      {
        title: 'Posting',
        tasks: [
          { id: 'rd-5', text: 'Provide genuine value, not just promotion', priority: 'high' },
          { id: 'rd-6', text: 'Use appropriate flair if required', priority: 'medium' },
          { id: 'rd-7', text: 'Include context and story, not just link', priority: 'high' },
          { id: 'rd-8', text: 'Be transparent - "I built this" is fine', priority: 'high' },
        ]
      },
      {
        title: 'Engagement',
        tasks: [
          { id: 'rd-9', text: 'Respond to comments quickly and genuinely', priority: 'high' },
          { id: 'rd-10', text: 'Thank people for feedback, even criticism', priority: 'medium' },
          { id: 'rd-11', text: 'Offer free trials or special deals for Redditors', priority: 'medium' },
        ]
      }
    ]
  },
  'indie-hackers': {
    name: 'Indie Hackers',
    url: 'https://indiehackers.com',
    color: 'from-blue-500 to-indigo-600',
    optimalTime: 'Any time (US business hours slightly better)',
    bestDays: ['Any day'],
    difficulty: 'Easy',
    sections: [
      {
        title: 'Before Posting',
        tasks: [
          { id: 'ih-1', text: 'Create detailed product page with milestones', priority: 'high' },
          { id: 'ih-2', text: 'Add revenue/traffic stats (transparency wins)', priority: 'high' },
          { id: 'ih-3', text: 'Write authentic journey story', priority: 'medium' },
        ]
      },
      {
        title: 'Posting',
        tasks: [
          { id: 'ih-4', text: 'Share in relevant groups (SaaS, tools, etc.)', priority: 'high' },
          { id: 'ih-5', text: 'Post milestone updates regularly', priority: 'medium' },
          { id: 'ih-6', text: 'Ask specific questions to encourage discussion', priority: 'medium' },
        ]
      },
      {
        title: 'Community Building',
        tasks: [
          { id: 'ih-7', text: 'Comment helpfully on others posts', priority: 'medium' },
          { id: 'ih-8', text: 'Share what worked and what failed', priority: 'high' },
          { id: 'ih-9', text: 'Connect with other founders in your niche', priority: 'medium' },
        ]
      }
    ]
  },
  'betalist': {
    name: 'BetaList',
    url: 'https://betalist.com',
    color: 'from-gray-700 to-gray-900',
    optimalTime: 'Submit anytime (reviewed by team)',
    bestDays: ['Any day'],
    difficulty: 'Easy',
    sections: [
      {
        title: 'Submission',
        tasks: [
          { id: 'bl-1', text: 'Create account and verify email', priority: 'high' },
          { id: 'bl-2', text: 'Prepare logo (500x500px)', priority: 'high' },
          { id: 'bl-3', text: 'Write compelling 160-char description', priority: 'high' },
          { id: 'bl-4', text: 'Prepare 3 screenshots or product images', priority: 'high' },
          { id: 'bl-5', text: 'Set up email capture for beta signups', priority: 'high' },
        ]
      },
      {
        title: 'Optimization',
        tasks: [
          { id: 'bl-6', text: 'Consider paid listing ($129) for immediate feature', priority: 'low' },
          { id: 'bl-7', text: 'Ensure landing page is optimized for signups', priority: 'high' },
          { id: 'bl-8', text: 'Set up onboarding email sequence', priority: 'medium' },
        ]
      }
    ]
  }
};

type PlatformKey = keyof typeof PLATFORM_CHECKLISTS;

export default function LaunchChecklist() {
  const searchParams = useSearchParams();
  const initialPlatform = (searchParams.get('platform') as PlatformKey) || 'product-hunt';
  
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>(initialPlatform);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['0']));
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load saved progress from local storage
        const saved = localStorage.getItem(`launch-checklist-${user.id}-${selectedPlatform}`);
        if (saved) {
          setCompletedTasks(new Set(JSON.parse(saved)));
        }
        
        // Log activity
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            action: 'page_view',
            appId: 'marketing-command-center',
            metadata: { page: 'launch-checklist', platform: selectedPlatform }
          })
        }).catch(() => {});
      }
    }
    loadUser();
  }, [selectedPlatform]);

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    
    // Save progress
    if (user) {
      localStorage.setItem(
        `launch-checklist-${user.id}-${selectedPlatform}`,
        JSON.stringify([...newCompleted])
      );
    }
  };

  const toggleSection = (index: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const platform = PLATFORM_CHECKLISTS[selectedPlatform];
  const allTasks = platform.sections.flatMap(s => s.tasks);
  const progress = (completedTasks.size / allTasks.length) * 100;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">Low</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${platform.color} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/marketing" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Marketing
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Rocket className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Launch Checklist</h1>
              <p className="text-white/80">Step-by-step guide for a successful launch</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Platform Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_CHECKLISTS) as PlatformKey[]).map(key => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPlatform(key);
                  setCompletedTasks(new Set());
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedPlatform === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PLATFORM_CHECKLISTS[key].name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Checklist */}
          <div className="lg:col-span-2 space-y-4">
            {platform.sections.map((section, sectionIndex) => {
              const sectionKey = sectionIndex.toString();
              const isExpanded = expandedSections.has(sectionKey);
              const sectionTasks = section.tasks;
              const completedInSection = sectionTasks.filter(t => completedTasks.has(t.id)).length;
              
              return (
                <div key={sectionKey} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        completedInSection === sectionTasks.length
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {completedInSection === sectionTasks.length ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{sectionIndex + 1}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-500">
                          {completedInSection} of {sectionTasks.length} tasks complete
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-2">
                      {sectionTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            completedTasks.has(task.id)
                              ? 'bg-green-50'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            completedTasks.has(task.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {completedTasks.has(task.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`${completedTasks.has(task.id) ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.text}
                            </p>
                          </div>
                          {getPriorityBadge(task.priority)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {completedTasks.size} of {allTasks.length} tasks
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${platform.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {progress === 100 && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Ready to launch! 🚀</p>
                </div>
              )}
            </div>

            {/* Platform Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{platform.name} Tips</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Best Time</p>
                    <p className="text-sm font-medium text-gray-900">{platform.optimalTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Best Days</p>
                    <p className="text-sm font-medium text-gray-900">{platform.bestDays.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Difficulty</p>
                    <p className="text-sm font-medium text-gray-900">{platform.difficulty}</p>
                  </div>
                </div>
              </div>

              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Visit {platform.name}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Cross-sell */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
              <Sparkles className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Need Launch Content?</h3>
              <p className="text-sm text-white/80 mb-4">
                Create compelling graphics, emails, and social posts with our tools.
              </p>
              <div className="space-y-2">
                <Link
                  href="/apps/social-graphics"
                  className="block w-full px-3 py-2 bg-white/20 rounded-lg text-sm text-center hover:bg-white/30"
                >
                  Create Social Graphics
                </Link>
                <Link
                  href="/marketing/distribution"
                  className="block w-full px-3 py-2 bg-white/20 rounded-lg text-sm text-center hover:bg-white/30"
                >
                  Schedule Launch Posts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
