'use client';

import { useState } from 'react';
import { Mic, Headphones, Waveform, FileAudio, Download, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, Clock, Users, Rss, Upload } from 'lucide-react';

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
[01:30] Let's dive into the main topic...`);
    setIsTranscribing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Podcast Tools</h1>
                <p className="text-sm text-gray-400">Create, transcribe, and distribute</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                <Upload className="w-4 h-4" />
                Upload Episode
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'episodes', label: 'Episodes', icon: FileAudio },
            { id: 'transcribe', label: 'Transcribe', icon: Waveform },
            { id: 'analytics', label: 'Analytics', icon: Headphones },
            { id: 'distribute', label: 'Distribute', icon: Rss }
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

        {/* Episodes Tab */}
        {activeTab === 'episodes' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  {stat.change && <div className="text-xs text-green-400 mt-1">{stat.change}</div>}
                </div>
              ))}
            </div>

            {/* Episodes List */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Episodes</h3>
              <div className="space-y-4">
                {episodes.map(episode => (
                  <div key={episode.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center hover:bg-orange-700 transition"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
                    </button>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{episode.title}</h4>
                      <p className="text-sm text-gray-400">{episode.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{episode.duration}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        episode.status === 'published' ? 'bg-green-600/20 text-green-400' :
                        episode.status === 'scheduled' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {episode.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transcribe Tab */}
        {activeTab === 'transcribe' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Audio
              </h3>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
                <Waveform className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Drag and drop audio file</p>
                <p className="text-sm text-gray-500">MP3, WAV, M4A up to 500MB</p>
                <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Browse Files
                </button>
              </div>
              <button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isTranscribing ? 'Transcribing...' : 'AI Transcribe'}
              </button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Transcription</h3>
              {transcription ? (
                <div className="bg-black/30 rounded-xl p-4 max-h-[400px] overflow-auto">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{transcription}</pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Upload and transcribe audio to see results</p>
                </div>
              )}
              {transcription && (
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                    Copy Text
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                    Download SRT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  {stat.change && <div className="text-xs text-green-400 mt-1">{stat.change}</div>}
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Listener Demographics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Top Countries</h4>
                  <div className="space-y-2">
                    {['United States (45%)', 'United Kingdom (15%)', 'Canada (12%)', 'Australia (8%)'].map((country, i) => (
                      <div key={i} className="text-white">{country}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Listening Platforms</h4>
                  <div className="space-y-2">
                    {['Spotify (40%)', 'Apple Podcasts (35%)', 'YouTube (15%)', 'Other (10%)'].map((platform, i) => (
                      <div key={i} className="text-white">{platform}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Peak Listening Hours</h4>
                  <div className="space-y-2">
                    {['8-9 AM (Commute)', '12-1 PM (Lunch)', '6-7 PM (Evening)', '9-10 PM (Night)'].map((time, i) => (
                      <div key={i} className="text-white">{time}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Distribute Tab */}
        {activeTab === 'distribute' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connected Platforms</h3>
              <div className="grid grid-cols-3 gap-4">
                {platforms.map((platform, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="text-white">{platform.name}</span>
                    </div>
                    <button className={`px-3 py-1 rounded-lg text-sm ${
                      platform.connected
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}>
                      {platform.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Rss className="w-5 h-5" />
                RSS Feed
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="https://craudiovizai.com/podcast/feed.xml"
                  readOnly
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
