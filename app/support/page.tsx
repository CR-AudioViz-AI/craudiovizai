'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Send,
  Sparkles,
  CreditCard,
  Bug,
  Shield,
  Lightbulb,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// Brand colors
const COLORS = {
  navy: '#002B5B',
  red: '#FD201D',
  cyan: '#00BCD4',
};

interface Ticket {
  id: string;
  ticket_number: string;
  subject?: string;
  error_message?: string;
  status: string;
  category?: string;
  source_app?: string;
  created_at: string;
  updated_at?: string;
}

interface Category {
  id: string;
  category_slug: string;
  category_name: string;
  description: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: '1', category_slug: 'billing', category_name: 'Billing & Payments', description: 'Questions about subscriptions, credits, and payments', icon: 'credit-card' },
  { id: '2', category_slug: 'technical', category_name: 'Technical Issues', description: 'Bugs, errors, and technical problems', icon: 'bug' },
  { id: '3', category_slug: 'account', category_name: 'Account & Security', description: 'Login issues, password reset, account settings', icon: 'shield' },
  { id: '4', category_slug: 'feature', category_name: 'Feature Questions', description: 'How to use specific features', icon: 'lightbulb' },
  { id: '5', category_slug: 'feedback', category_name: 'General Feedback', description: 'Suggestions and general comments', icon: 'message-circle' },
];

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    open: { color: 'bg-blue-500', icon: <Clock className="w-3 h-3" /> },
    in_progress: { color: 'bg-yellow-500', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    resolved: { color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
    closed: { color: 'bg-gray-500', icon: <CheckCircle className="w-3 h-3" /> },
  };
  const config = statusConfig[status] || statusConfig.open;
  return (
    <Badge className={`${config.color} text-white flex items-center gap-1`}>
      {config.icon}
      {status.replace('_', ' ')}
    </Badge>
  );
};

const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'credit-card': <CreditCard className="w-5 h-5" />,
    'bug': <Bug className="w-5 h-5" />,
    'shield': <Shield className="w-5 h-5" />,
    'lightbulb': <Lightbulb className="w-5 h-5" />,
    'message-circle': <MessageSquare className="w-5 h-5" />,
  };
  return icons[iconName] || <HelpCircle className="w-5 h-5" />;
};

export default function SupportPortal() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    source_app: 'craudiovizai.com',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
    loadTickets();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
    setLoading(false);
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !newTicket.category) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate ticket number
      const ticketNumber = `CRAV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: user?.id,
          user_email: user?.email,
          error_type: newTicket.category,
          error_message: newTicket.subject,
          page_url: window.location.href,
          severity: 'medium',
          status: 'open',
          category: newTicket.category,
          source_app: newTicket.source_app,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial message
      if (data) {
        await supabase.from('ticket_messages').insert({
          ticket_id: data.id,
          sender_type: 'user',
          sender_id: user?.id,
          sender_name: user?.email || 'User',
          message: newTicket.description,
        });
      }

      setNewTicket({ subject: '', description: '', category: '', source_app: 'craudiovizai.com' });
      setShowNewTicket(false);
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
    setSubmitting(false);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (ticket.subject || ticket.error_message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Hero Section */}
      <div className="relative py-16 px-4" style={{ backgroundColor: COLORS.navy }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" style={{ color: COLORS.cyan }} />
            <h1 className="text-4xl font-bold text-white">Support Center</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Get help from our team and AI assistants across all CR AudioViz AI platforms
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => setShowNewTicket(true)}
              className="text-white"
              style={{ backgroundColor: COLORS.red }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Support Ticket
            </Button>
            <Link href="/support/enhancements">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                <Lightbulb className="w-4 h-4 mr-2" />
                Request a Feature
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* New Ticket Form Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" style={{ color: COLORS.cyan }} />
                  Create Support Ticket
                </CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category *</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.category_slug} value={cat.category_slug} className="text-white">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat.icon)}
                            {cat.category_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Subject *</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description *</label>
                  <Textarea
                    placeholder="Please provide as much detail as possible..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-[150px]"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Which app is this about?</label>
                  <Select
                    value={newTicket.source_app}
                    onValueChange={(v) => setNewTicket({ ...newTicket, source_app: v })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select app" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="craudiovizai.com" className="text-white">CR AudioViz AI (Main Site)</SelectItem>
                      <SelectItem value="javariai.com" className="text-white">Javari AI</SelectItem>
                      <SelectItem value="cardverse" className="text-white">CardVerse</SelectItem>
                      <SelectItem value="other" className="text-white">Other / General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitTicket}
                    disabled={submitting}
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
                        <Send className="w-4 h-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTicket(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How can we help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.category_slug}
                className="bg-gray-900 border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer"
                onClick={() => {
                  setNewTicket({ ...newTicket, category: cat.category_slug });
                  setShowNewTicket(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${COLORS.cyan}20`, color: COLORS.cyan }}
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <h3 className="font-semibold text-white text-sm">{cat.category_name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Tickets Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Tickets</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="open" className="text-white">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-white">Resolved</SelectItem>
                  <SelectItem value="closed" className="text-white">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!user ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">Sign in to view your tickets</h3>
                <p className="text-gray-400 mb-6">Track your support requests and get faster help</p>
                <Link href="/signin">
                  <Button style={{ backgroundColor: COLORS.red }} className="text-white">
                    Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
              <p className="text-gray-400 mt-4">Loading your tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">No tickets found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : "You haven't created any support tickets yet"}
                </p>
                <Button
                  onClick={() => setShowNewTicket(true)}
                  style={{ backgroundColor: COLORS.cyan }}
                  className="text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-cyan-400 font-mono text-sm">{ticket.ticket_number}</span>
                          {getStatusBadge(ticket.status)}
                          {ticket.source_app && ticket.source_app !== 'craudiovizai.com' && (
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {ticket.source_app}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-semibold">
                          {ticket.subject || ticket.error_message || 'Support Request'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          Created {new Date(ticket.created_at).toLocaleDateString()} at{' '}
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Link href={`/support/tickets/${ticket.id}`}>
                        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Help Resources */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <HelpCircle className="w-8 h-8 mb-4" style={{ color: COLORS.cyan }} />
              <h3 className="text-lg font-semibold text-white mb-2">Help Center</h3>
              <p className="text-gray-400 text-sm mb-4">Browse our knowledge base for instant answers</p>
              <Link href="/help">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                  Browse Articles
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <Lightbulb className="w-8 h-8 mb-4" style={{ color: COLORS.cyan }} />
              <h3 className="text-lg font-semibold text-white mb-2">Feature Requests</h3>
              <p className="text-gray-400 text-sm mb-4">Suggest new features and vote on ideas</p>
              <Link href="/support/enhancements">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                  View Roadmap
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <Sparkles className="w-8 h-8 mb-4" style={{ color: COLORS.cyan }} />
              <h3 className="text-lg font-semibold text-white mb-2">Ask Javari AI</h3>
              <p className="text-gray-400 text-sm mb-4">Get instant help from our AI assistant</p>
              <Link href="https://javariai.com" target="_blank">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                  Chat with Javari
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
