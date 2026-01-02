// Javari Books - Bi-directional eBook & Audiobook Converter
// Timestamp: January 1, 2026 - 5:45 AM EST
// CR AudioViz AI - Convert eBooks to Audiobooks and Audiobooks to eBooks

'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  BookOpen, Headphones, Upload, Download, Play, Pause, 
  Volume2, Settings, Sparkles, ArrowRight, ArrowLeft,
  FileText, Mic, Clock, Zap, Check, AlertCircle, RefreshCw,
  ChevronDown, Globe, User
} from 'lucide-react'

// Voice options for text-to-speech
const VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral', style: 'Balanced & Professional' },
  { id: 'echo', name: 'Echo', gender: 'male', style: 'Deep & Authoritative' },
  { id: 'fable', name: 'Fable', gender: 'female', style: 'Warm & Storytelling' },
  { id: 'onyx', name: 'Onyx', gender: 'male', style: 'Rich & Dramatic' },
  { id: 'nova', name: 'Nova', gender: 'female', style: 'Bright & Engaging' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', style: 'Soft & Soothing' },
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
]

const SPEEDS = [
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x (Normal)' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' },
]

type ConversionMode = 'ebook-to-audio' | 'audio-to-ebook'
type ConversionStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

interface ConversionJob {
  id: string
  mode: ConversionMode
  filename: string
  status: ConversionStatus
  progress: number
  outputUrl?: string
  error?: string
  createdAt: Date
  completedAt?: Date
}

export default function JavariBooksPage() {
  const [mode, setMode] = useState<ConversionMode>('ebook-to-audio')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ConversionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Settings
  const [voice, setVoice] = useState(VOICES[0])
  const [speed, setSpeed] = useState(1.0)
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [showSettings, setShowSettings] = useState(false)
  
  // Audio preview
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // History
  const [history, setHistory] = useState<ConversionJob[]>([])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setStatus('idle')
      setError(null)
      setProgress(0)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setStatus('idle')
      setError(null)
    }
  }, [])

  const startConversion = async () => {
    if (!selectedFile) return
    
    setStatus('uploading')
    setProgress(0)
    setError(null)
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 30; i += 5) {
        await new Promise(r => setTimeout(r, 100))
        setProgress(i)
      }
      
      setStatus('processing')
      
      // Simulate processing
      for (let i = 30; i <= 90; i += 5) {
        await new Promise(r => setTimeout(r, 200))
        setProgress(i)
      }
      
      // In production, this would call the actual conversion API
      // const formData = new FormData()
      // formData.append('file', selectedFile)
      // formData.append('mode', mode)
      // formData.append('voice', voice.id)
      // formData.append('speed', speed.toString())
      // formData.append('language', language.code)
      // const response = await fetch('/api/javari-books/convert', { method: 'POST', body: formData })
      
      setProgress(100)
      setStatus('complete')
      
      // Add to history
      const job: ConversionJob = {
        id: Date.now().toString(),
        mode,
        filename: selectedFile.name,
        status: 'complete',
        progress: 100,
        outputUrl: '#', // Would be actual URL
        createdAt: new Date(),
        completedAt: new Date()
      }
      setHistory(prev => [job, ...prev])
      
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Conversion failed')
    }
  }

  const playPreview = async () => {
    // In production, this would generate a short audio preview
    setIsPlaying(!isPlaying)
  }

  const acceptedFormats = mode === 'ebook-to-audio' 
    ? '.pdf,.epub,.docx,.txt,.md'
    : '.mp3,.wav,.m4a,.ogg,.flac'

  const outputFormat = mode === 'ebook-to-audio' ? 'MP3 Audiobook' : 'DOCX/EPUB eBook'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Javari Books</h1>
                <p className="text-xs text-purple-300">eBook ↔ Audiobook Converter</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-300">
                <Sparkles className="w-4 h-4 inline mr-1" />
                100 Credits Available
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-2xl p-1 flex gap-1">
            <button
              onClick={() => setMode('ebook-to-audio')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'ebook-to-audio'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              eBook → Audiobook
              <ArrowRight className="w-4 h-4" />
              <Headphones className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMode('audio-to-ebook')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'audio-to-ebook'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Headphones className="w-5 h-5" />
              Audiobook → eBook
              <ArrowRight className="w-4 h-4" />
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Upload {mode === 'ebook-to-audio' ? 'eBook' : 'Audiobook'}
            </h2>
            
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                selectedFile 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5'
              }`}
            >
              <input
                type="file"
                accept={acceptedFormats}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="space-y-2">
                    <Check className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-purple-400">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mode === 'ebook-to-audio' ? (
                      <BookOpen className="w-12 h-12 text-purple-400 mx-auto" />
                    ) : (
                      <Headphones className="w-12 h-12 text-purple-400 mx-auto" />
                    )}
                    <p className="text-white">
                      Drop your {mode === 'ebook-to-audio' ? 'eBook' : 'audiobook'} here
                    </p>
                    <p className="text-sm text-gray-400">
                      or click to browse
                    </p>
                    <p className="text-xs text-purple-400">
                      Supports: {acceptedFormats.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-gray-700/50 rounded-xl text-gray-300 hover:bg-gray-700 transition"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Conversion Settings
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-4 space-y-4 p-4 bg-gray-700/30 rounded-xl">
                {mode === 'ebook-to-audio' && (
                  <>
                    {/* Voice Selection */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">AI Voice</label>
                      <div className="grid grid-cols-2 gap-2">
                        {VOICES.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setVoice(v)}
                            className={`p-3 rounded-lg text-left transition ${
                              voice.id === v.id
                                ? 'bg-purple-600/50 border border-purple-500'
                                : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-400" />
                              <span className="text-white font-medium">{v.name}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{v.style}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speed */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Narration Speed</label>
                      <div className="flex gap-2">
                        {SPEEDS.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setSpeed(s.value)}
                            className={`flex-1 py-2 rounded-lg text-sm transition ${
                              speed === s.value
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Language */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {mode === 'ebook-to-audio' ? 'Output Language' : 'Transcription Language'}
                  </label>
                  <select
                    value={language.code}
                    onChange={(e) => setLanguage(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[0])}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400" />
              Output: {outputFormat}
            </h2>

            {/* Status Display */}
            <div className="bg-gray-700/30 rounded-xl p-6 mb-4">
              {status === 'idle' && (
                <div className="text-center text-gray-400">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Upload a file to start conversion</p>
                </div>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                    <span className="text-white">
                      {status === 'uploading' ? 'Uploading...' : 'Converting...'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-400">{progress}% complete</p>
                </div>
              )}

              {status === 'complete' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-white font-medium">Conversion Complete!</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90 transition flex items-center gap-2 mx-auto">
                    <Download className="w-5 h-5" />
                    Download {mode === 'ebook-to-audio' ? 'Audiobook' : 'eBook'}
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <p className="text-red-400">{error}</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <button
              onClick={startConversion}
              disabled={!selectedFile || status === 'uploading' || status === 'processing'}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                !selectedFile || status === 'uploading' || status === 'processing'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/25'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              {status === 'uploading' ? 'Uploading...' : 
               status === 'processing' ? 'Converting...' : 
               `Convert to ${mode === 'ebook-to-audio' ? 'Audiobook' : 'eBook'}`}
            </button>

            {/* Credit Cost */}
            <p className="text-center text-sm text-gray-400 mt-3">
              <Zap className="w-4 h-4 inline mr-1" />
              Estimated cost: {mode === 'ebook-to-audio' ? '5-20' : '3-10'} credits based on file size
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-purple-500/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">50+ AI Voices</h3>
            <p className="text-gray-400 text-sm">
              Professional narration voices in multiple languages and styles
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-6 border border-purple-500/10">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Fast Conversion</h3>
            <p className="text-gray-400 text-sm">
              Convert a full book in minutes, not hours
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-6 border border-purple-500/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Smart Formatting</h3>
            <p className="text-gray-400 text-sm">
              Preserves chapters, paragraphs, and document structure
            </p>
          </div>
        </div>

        {/* Recent Conversions */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Conversions</h2>
            <div className="bg-gray-800/30 rounded-xl border border-purple-500/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm text-gray-400 px-4 py-3">File</th>
                    <th className="text-left text-sm text-gray-400 px-4 py-3">Type</th>
                    <th className="text-left text-sm text-gray-400 px-4 py-3">Date</th>
                    <th className="text-right text-sm text-gray-400 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job.id} className="border-b border-gray-700/50">
                      <td className="px-4 py-3 text-white">{job.filename}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                          {job.mode === 'ebook-to-audio' ? 'eBook → Audio' : 'Audio → eBook'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {job.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-purple-400 hover:text-purple-300 text-sm">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pricing Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Conversion Credits</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">Free</p>
              <p className="text-gray-400 mt-1">1 book/month</p>
              <p className="text-purple-400 text-sm mt-2">Get Started</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">$9.99</p>
              <p className="text-gray-400 mt-1">5 books/month</p>
              <p className="text-purple-400 text-sm mt-2">~$2/book</p>
            </div>
            <div className="bg-purple-600/30 rounded-xl p-6 text-center border-2 border-purple-500">
              <p className="text-xs text-purple-300 mb-1">POPULAR</p>
              <p className="text-3xl font-bold text-white">$29.99</p>
              <p className="text-gray-400 mt-1">20 books/month</p>
              <p className="text-purple-400 text-sm mt-2">~$1.50/book</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">$99.99</p>
              <p className="text-gray-400 mt-1">Unlimited</p>
              <p className="text-purple-400 text-sm mt-2">Best Value</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 CR AudioViz AI, LLC. Your Story. Our Design.
          </p>
        </div>
      </footer>
    </div>
  )
}
