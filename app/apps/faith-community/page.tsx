'use client';

import { useState } from 'react';
import { Church, Calendar, Users, Heart, Book, Music, FileText, MessageSquare, Video, Bell, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'service' | 'study' | 'community' | 'youth';
}

const events: Event[] = [
  { id: '1', title: 'Sunday Worship Service', date: '2026-01-05', time: '10:00 AM', type: 'service' },
  { id: '2', title: 'Bible Study Group', date: '2026-01-08', time: '7:00 PM', type: 'study' },
  { id: '3', title: 'Community Outreach', date: '2026-01-10', time: '9:00 AM', type: 'community' },
  { id: '4', title: 'Youth Group Meeting', date: '2026-01-12', time: '6:00 PM', type: 'youth' }
];

const tools = [
  { id: 'bulletin', title: 'Bulletin Creator', description: 'Create beautiful weekly bulletins', icon: FileText, color: 'from-blue-500 to-indigo-600' },
  { id: 'sermon', title: 'Sermon Notes', description: 'AI-assisted sermon preparation', icon: Book, color: 'from-purple-500 to-pink-600' },
  { id: 'worship', title: 'Worship Planning', description: 'Plan services and song selections', icon: Music, color: 'from-amber-500 to-orange-600' },
  { id: 'announcements', title: 'Announcements', description: 'Create slides and social posts', icon: Bell, color: 'from-green-500 to-teal-600' },
  { id: 'prayer', title: 'Prayer Requests', description: 'Manage and share prayer needs', icon: Heart, color: 'from-rose-500 to-red-600' },
  { id: 'groups', title: 'Small Groups', description: 'Organize and track groups', icon: Users, color: 'from-cyan-500 to-blue-600' }
];

export default function FaithCommunityPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tools' | 'events' | 'resources'>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWithAI = async (type: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'service': return Church;
      case 'study': return Book;
      case 'community': return Heart;
      case 'youth': return Users;
      default: return Calendar;
    }
  };

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'service': return 'bg-blue-600/20 text-blue-400';
      case 'study': return 'bg-purple-600/20 text-purple-400';
      case 'community': return 'bg-green-600/20 text-green-400';
      case 'youth': return 'bg-amber-600/20 text-amber-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Faith Community Tools</h1>
                <p className="text-sm text-gray-400">Empowering houses of worship</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Church },
            { id: 'tools', label: 'Tools', icon: FileText },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'resources', label: 'Resources', icon: Book }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === tab.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-2xl border border-indigo-500/30 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Faith Community Tools</h2>
              <p className="text-gray-300 mb-4">
                Free resources to help your faith community grow, connect, and serve.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('tools')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Explore Tools
                </button>
                <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                  Watch Tutorial
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Upcoming Events', value: events.length.toString(), icon: Calendar },
                { label: 'Active Groups', value: '12', icon: Users },
                { label: 'Prayer Requests', value: '28', icon: Heart },
                { label: 'Resources', value: '45+', icon: Book }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <stat.icon className="w-8 h-8 text-indigo-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Upcoming Events Preview */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
                <button onClick={() => setActiveTab('events')} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {events.slice(0, 3).map(event => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{event.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tools */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-3 gap-6">
            {tools.map(tool => (
              <div
                key={tool.id}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                <button className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300">
                  Open Tool <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        {activeTab === 'events' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">All Events</h3>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                + Add Event
              </button>
            </div>
            <div className="space-y-3">
              {events.map(event => {
                const Icon = getEventIcon(event.type);
                return (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getEventColor(event.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${getEventColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resources */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { title: 'Sermon Templates', count: 25, icon: Book },
              { title: 'Worship Song Library', count: 500, icon: Music },
              { title: 'Bulletin Designs', count: 40, icon: FileText },
              { title: 'Social Media Graphics', count: 100, icon: MessageSquare }
            ].map((resource, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                    <resource.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{resource.title}</h3>
                    <p className="text-sm text-gray-400">{resource.count}+ available</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                  Browse Resources
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Faith Community Tools is provided by CR AudioViz AI as part of our Social Impact Initiative.</p>
          <p className="mt-2">Serving communities of all faiths and denominations.</p>
        </div>
      </div>
    </div>
  );
}
