'use client';

import { useState } from 'react';
import { Mic, Headphones, AudioWaveform, FileAudio, Download, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, Clock, Users, Rss, Upload } from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  publishDate: string;
  audioUrl: string;
  status: 'draft' | 'scheduled' | 'published';
}

export default function PodcastToolsPage() {
  const [activeTab, setActiveTab] = useState<'episodes' | 'transcribe' | 'analytics' | 'distribute'>('episodes');
  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      id: '1',
      title: 'Episode 1: Getting Started',
      description: 'Introduction to our podcast',
      duration: '45:30',
      publishDate: '2026-01-01',
      audioUrl: '',
      status: 'published'
    }
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');

  const platforms = [
    { name: 'Apple Podcasts', icon: '🎧', connected: true },
    { name: 'Spotify', icon: '💚', connected: true },
    { name: 'Google Podcasts', icon: '🎵', connected: false },
    { name: 'Amazon Music', icon: '🎶', connected: false },
    { name: 'YouTube', icon: '▶️', connected: true },
    { name: 'RSS Feed', icon: '📡', connected: true }
  ];

  const stats = [
    { label: 'Total Downloads', value: '12,450', change: '+15%' },
    { label: 'Avg. Listen Time', value: '32:15', change: '+8%' },
    { label: 'Subscribers', value: '2,340', change: '+22%' },
    { label: 'Episodes', value: episodes.length.toString(), change: '' }
  ];

  const transcribeAudio = async () => {
    setIsTranscribing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setTranscription(`[00:00] Welcome to our podcast!
[00:05] Today we're going to discuss...
[00:30] First, let's talk about the fundamentals...
[01:00] Our guest today is an expert in...
[01:30] Let me share some insights...`);
    setIsTranscribing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Podcast Tools</h1>
              <p className="text-gray-400">Create, transcribe, and distribute your podcast</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            New Episode
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                {stat.change && (
                  <span className="text-green-400 text-sm">{stat.change}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'episodes', label: 'Episodes', icon: FileAudio },
            { id: 'transcribe', label: 'Transcribe', icon: AudioWaveform },
            { id: 'analytics', label: 'Analytics', icon: Users },
            { id: 'distribute', label: 'Distribute', icon: Rss }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Your Episodes</h2>
              {episodes.map((episode) => (
                <div key={episode.id} className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
                  </button>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{episode.title}</h3>
                    <p className="text-gray-400 text-sm">{episode.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{episode.duration}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      episode.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      episode.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {episode.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'transcribe' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">AI Transcription</h2>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Drop your audio file here or click to upload</p>
                <button 
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
                </button>
              </div>
              {transcription && (
                <div className="bg-black/30 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-2">Transcription Result</h3>
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{transcription}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Podcast Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Downloads Over Time</h3>
                  <div className="h-48 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Top Episodes</h3>
                  <div className="space-y-3">
                    {['Episode 1: Getting Started', 'Episode 2: Deep Dive', 'Episode 3: Expert Interview'].map((ep, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-300">{ep}</span>
                        <span className="text-purple-400">{(1000 - i * 200).toLocaleString()} plays</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distribute' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Distribution Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <div key={platform.name} className="bg-black/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="text-white font-medium">{platform.name}</span>
                    </div>
                    <button className={`px-3 py-1 rounded-lg text-sm ${
                      platform.connected
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}>
                      {platform.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
