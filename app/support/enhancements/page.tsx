'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ThumbsUp,
  Clock,
  CheckCircle,
  Code,
  XCircle,
  Loader2,
  TrendingUp,
  ArrowLeft,
  Search,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import JavariWidget from '@/components/JavariWidget';

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
  created_at: string;
  user_voted?: boolean;
}

const CATEGORIES = [
  { value: 'feature', label: '✨ New Feature' },
  { value: 'improvement', label: '🔧 Improvement' },
  { value: 'integration', label: '🔗 Integration' },
  { value: 'ui', label: '🎨 UI/UX' },
  { value: 'performance', label: '⚡ Performance' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  submitted: { color: 'bg-blue-500/20 text-blue-400', label: 'Submitted' },
  under_review: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Under Review' },
  planned: { color: 'bg-purple-500/20 text-purple-400', label: 'Planned' },
  in_progress: { color: 'bg-orange-500/20 text-orange-400', label: 'In Progress' },
  completed: { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
  declined: { color: 'bg-red-500/20 text-red-400', label: 'Declined' },
};

export default function EnhancementsPage() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [votingId, setVotingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'feature',
    source_app: 'all',
  });

  useEffect(() => {
    loadUser();
    loadEnhancements();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadEnhancements = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: enhancementsData } = await supabase
      .from('enhancement_requests')
      .select('*')
      .order('vote_count', { ascending: false });

    let userVotes: string[] = [];
    if (user) {
      const { data: votesData } = await supabase
        .from('enhancement_votes')
        .select('enhancement_id')
        .eq('user_id', user.id);
      userVotes = votesData?.map(v => v.enhancement_id) || [];
    }

    const withVotes = (enhancementsData || []).map(e => ({
      ...e,
      user_voted: userVotes.includes(e.id),
    }));

    setEnhancements(withVotes);
    setLoading(false);
  };

  const handleVote = async (id: string, hasVoted: boolean) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }
    
    setVotingId(id);
    
    if (hasVoted) {
      await supabase.from('enhancement_votes').delete()
        .eq('enhancement_id', id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('enhancement_votes').insert({
        enhancement_id: id,
        user_id: user.id,
      });
    }
    
    await loadEnhancements();
    setVotingId(null);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      alert('Please fill in all fields');
      return;
    }
    if (!user) {
      alert('Please sign in to submit');
      return;
    }

    setSubmitting(true);
    
    const { error } = await supabase.from('enhancement_requests').insert({
      user_id: user.id,
      user_email: user.email,
      title: form.title,
      description: form.description,
      category: form.category,
      source_app: form.source_app,
    });

    if (error) {
      console.error('Error:', error);
      alert('Failed to submit');
    } else {
      setForm({ title: '', description: '', category: 'feature', source_app: 'all' });
      setShowForm(false);
      loadEnhancements();
    }
    setSubmitting(false);
  };

  const filtered = enhancements.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: enhancements.length,
    planned: enhancements.filter(e => e.status === 'planned').length,
    inProgress: enhancements.filter(e => e.status === 'in_progress').length,
    completed: enhancements.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="py-12 px-4" style={{ backgroundColor: COLORS.navy }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/support" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Support
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-4">Feature Requests</h1>
          <p className="text-gray-300 mb-6">Vote on features and see what's coming</p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.planned}</div>
              <div className="text-xs text-gray-400">Planned</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.inProgress}</div>
              <div className="text-xs text-gray-400">Building</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-400">Done</div>
            </div>
          </div>

          <Button onClick={() => setShowForm(true)} style={{ backgroundColor: COLORS.red }} className="text-white">
            <Plus className="w-4 h-4 mr-2" /> Submit Idea
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* New Request Form */}
        {showForm && (
          <Card className="mb-8 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5" style={{ color: COLORS.cyan }} />
                Submit Feature Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Title</label>
                <Input
                  placeholder="Brief title for your idea"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Category</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-white">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">For which app?</label>
                  <Select value={form.source_app} onValueChange={(v) => setForm({ ...form, source_app: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white">All / Platform</SelectItem>
                      <SelectItem value="craudiovizai.com" className="text-white">CR AudioViz AI</SelectItem>
                      <SelectItem value="javariai.com" className="text-white">Javari AI</SelectItem>
                      <SelectItem value="cardverse" className="text-white">CardVerse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Description</label>
                <Textarea
                  placeholder="Describe your idea and why it would be helpful..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !user}
                  style={{ backgroundColor: COLORS.cyan }}
                  className="text-white flex-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
              </div>
              {!user && <p className="text-yellow-400 text-sm text-center">Sign in to submit ideas</p>}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="submitted" className="text-white">Submitted</SelectItem>
              <SelectItem value="planned" className="text-white">Planned</SelectItem>
              <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No ideas yet. Be the first!</p>
              <Button onClick={() => setShowForm(true)} style={{ backgroundColor: COLORS.cyan }} className="text-white">
                Submit First Idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
              const category = CATEGORIES.find(c => c.value === item.category);
              
              return (
                <Card key={item.id} className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Vote */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleVote(item.id, item.user_voted || false)}
                          disabled={votingId === item.id}
                          className={`p-2 rounded ${item.user_voted ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'}`}
                        >
                          {votingId === item.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ThumbsUp className={`w-5 h-5 ${item.user_voted ? 'fill-current' : ''}`} />
                          )}
                        </button>
                        <span className="text-lg font-bold text-white">{item.vote_count}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={statusConf.color}>{statusConf.label}</Badge>
                          {category && (
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {category.label}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {item.request_number} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <JavariWidget sourceApp="craudiovizai.com" enableEnhancements={true} />
    </div>
  );
}
