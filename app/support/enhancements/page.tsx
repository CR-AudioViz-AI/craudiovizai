'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  Plus,
  Search,
  ThumbsUp,
  Clock,
  CheckCircle,
  Code,
  TestTube,
  XCircle,
  Loader2,
  Filter,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

// Brand colors
const COLORS = {
  navy: '#002B5B',
  red: '#FD201D',
  cyan: '#00BCD4',
};

interface Enhancement {
  id: string;
  request_number: string;
  title: string;
  description: string;
  category: string;
  status: string;
  vote_count: number;
  user_id: string;
  source_app: string;
  target_release?: string;
  created_at: string;
  has_voted?: boolean;
}

const CATEGORIES = [
  { value: 'feature', label: 'New Feature', icon: '✨' },
  { value: 'improvement', label: 'Improvement', icon: '🔧' },
  { value: 'integration', label: 'Integration', icon: '🔗' },
  { value: 'ui', label: 'UI/UX', icon: '🎨' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
];

const APPS = [
  { value: 'craudiovizai.com', label: 'CR AudioViz AI (Main)' },
  { value: 'javariai.com', label: 'Javari AI' },
  { value: 'cardverse', label: 'CardVerse' },
  { value: 'all', label: 'All Apps / Platform-wide' },
];

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    submitted: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: <Clock className="w-3 h-3" />, label: 'Submitted' },
    under_review: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Search className="w-3 h-3" />, label: 'Under Review' },
    planned: { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: <Calendar className="w-3 h-3" />, label: 'Planned' },
    in_progress: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: <Code className="w-3 h-3" />, label: 'In Progress' },
    testing: { color: 'text-pink-400', bg: 'bg-pink-500/20', icon: <TestTube className="w-3 h-3" />, label: 'Testing' },
    completed: { color: 'text-green-400', bg: 'bg-green-500/20', icon: <CheckCircle className="w-3 h-3" />, label: 'Completed' },
    declined: { color: 'text-red-400', bg: 'bg-red-500/20', icon: <XCircle className="w-3 h-3" />, label: 'Declined' },
  };
  return configs[status] || configs.submitted;
};

export default function EnhancementRequests() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('votes');
  
  // New request form
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    source_app: 'all',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
    loadEnhancements();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadEnhancements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get enhancements
      const { data: enhancementsData, error } = await supabase
        .from('enhancement_requests')
        .select('*')
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      
      // Get user's votes if logged in
      let userVotes: string[] = [];
      if (user) {
        const { data: votesData } = await supabase
          .from('enhancement_votes')
          .select('enhancement_id')
          .eq('user_id', user.id);
        userVotes = votesData?.map(v => v.enhancement_id) || [];
      }
      
      // Mark which ones user has voted for
      const enhancementsWithVotes = (enhancementsData || []).map(e => ({
        ...e,
        has_voted: userVotes.includes(e.id),
      }));
      
      setEnhancements(enhancementsWithVotes);
    } catch (error) {
      console.error('Error loading enhancements:', error);
    }
    setLoading(false);
  };

  const handleVote = async (enhancementId: string, hasVoted: boolean) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      if (hasVoted) {
        // Remove vote
        await supabase
          .from('enhancement_votes')
          .delete()
          .eq('enhancement_id', enhancementId)
          .eq('user_id', user.id);
      } else {
        // Add vote
        await supabase
          .from('enhancement_votes')
          .insert({
            enhancement_id: enhancementId,
            user_id: user.id,
          });
      }
      
      // Refresh data
      loadEnhancements();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title || !newRequest.description || !newRequest.category) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user) {
      alert('Please sign in to submit a request');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('enhancement_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          title: newRequest.title,
          description: newRequest.description,
          category: newRequest.category,
          source_app: newRequest.source_app,
        });

      if (error) throw error;

      setNewRequest({ title: '', description: '', category: '', source_app: 'all' });
      setShowNewRequest(false);
      loadEnhancements();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    }
    setSubmitting(false);
  };

  // Filter and sort enhancements
  const filteredEnhancements = enhancements
    .filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.vote_count - a.vote_count;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  // Stats
  const stats = {
    total: enhancements.length,
    planned: enhancements.filter(e => e.status === 'planned').length,
    inProgress: enhancements.filter(e => e.status === 'in_progress').length,
    completed: enhancements.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Hero Section */}
      <div className="relative py-16 px-4" style={{ backgroundColor: COLORS.navy }}>
        <div className="max-w-6xl mx-auto">
          <Link href="/support" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-8 h-8" style={{ color: COLORS.cyan }} />
            <h1 className="text-4xl font-bold text-white">Feature Requests & Roadmap</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Vote on features you want, suggest new ideas, and see what's coming next
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/10 border-none">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-300">Total Requests</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.planned}</div>
                <div className="text-sm text-gray-300">Planned</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{stats.inProgress}</div>
                <div className="text-sm text-gray-300">In Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
                <div className="text-sm text-gray-300">Completed</div>
              </CardContent>
            </Card>
          </div>
          
          <Button
            onClick={() => setShowNewRequest(true)}
            className="text-white"
            style={{ backgroundColor: COLORS.red }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit Feature Request
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* New Request Modal */}
        {showNewRequest && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" style={{ color: COLORS.cyan }} />
                  Submit Feature Request
                </CardTitle>
                <CardDescription>
                  Share your idea to help improve our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                  <Input
                    placeholder="Brief title for your feature request"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Category *</label>
                    <Select
                      value={newRequest.category}
                      onValueChange={(v) => setNewRequest({ ...newRequest, category: v })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="text-white">
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">For which app?</label>
                    <Select
                      value={newRequest.source_app}
                      onValueChange={(v) => setNewRequest({ ...newRequest, source_app: v })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select app" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {APPS.map((app) => (
                          <SelectItem key={app.value} value={app.value} className="text-white">
                            {app.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description *</label>
                  <Textarea
                    placeholder="Describe the feature, why it would be useful, and how you'd like it to work..."
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-[150px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={submitting || !user}
                    className="flex-1 text-white"
                    style={{ backgroundColor: COLORS.red }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewRequest(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
                {!user && (
                  <p className="text-center text-yellow-400 text-sm">
                    Please <Link href="/signin" className="underline">sign in</Link> to submit a request
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="submitted" className="text-white">Submitted</SelectItem>
              <SelectItem value="under_review" className="text-white">Under Review</SelectItem>
              <SelectItem value="planned" className="text-white">Planned</SelectItem>
              <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="text-white">
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="votes" className="text-white">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Most Votes
              </SelectItem>
              <SelectItem value="newest" className="text-white">
                <Clock className="w-4 h-4 inline mr-2" />
                Newest
              </SelectItem>
              <SelectItem value="oldest" className="text-white">
                <Clock className="w-4 h-4 inline mr-2" />
                Oldest
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhancement List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
            <p className="text-gray-400 mt-4">Loading feature requests...</p>
          </div>
        ) : filteredEnhancements.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Be the first to suggest a feature!'}
              </p>
              <Button
                onClick={() => setShowNewRequest(true)}
                style={{ backgroundColor: COLORS.cyan }}
                className="text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEnhancements.map((enhancement) => {
              const statusConfig = getStatusConfig(enhancement.status);
              const category = CATEGORIES.find(c => c.value === enhancement.category);
              
              return (
                <Card
                  key={enhancement.id}
                  className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Vote Section */}
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(enhancement.id, enhancement.has_voted || false)}
                          className={`p-2 ${enhancement.has_voted ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'}`}
                        >
                          <ThumbsUp className={`w-6 h-6 ${enhancement.has_voted ? 'fill-current' : ''}`} />
                        </Button>
                        <span className="text-xl font-bold text-white">{enhancement.vote_count}</span>
                        <span className="text-xs text-gray-500">votes</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <Badge className={`${statusConfig.bg} ${statusConfig.color} flex items-center gap-1`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                          {category && (
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {category.icon} {category.label}
                            </Badge>
                          )}
                          {enhancement.source_app !== 'all' && enhancement.source_app !== 'craudiovizai.com' && (
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {enhancement.source_app}
                            </Badge>
                          )}
                          {enhancement.target_release && (
                            <Badge className="bg-purple-500/20 text-purple-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {enhancement.target_release}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {enhancement.title}
                        </h3>
                        
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {enhancement.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {enhancement.request_number} • Submitted {new Date(enhancement.created_at).toLocaleDateString()}
                          </span>
                          <Link href={`/support/enhancements/${enhancement.id}`}>
                            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                              Details <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
