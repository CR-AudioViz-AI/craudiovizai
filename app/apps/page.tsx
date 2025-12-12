// app/apps/page.tsx
// Complete Apps Catalog - 60+ AI Tools
// Timestamp: Dec 11, 2025 11:32 PM EST

import Link from 'next/link';
import { 
  Sparkles, Wand2, Scissors, Maximize, Users, Palette,
  Video, Film, Mic, Music, FileAudio, Headphones,
  FileText, Code, Languages, FileSearch, PenTool,
  QrCode, Image, Gamepad2, MessageSquare, Bot,
  Camera, Layers, Brush, Eraser, Move, RotateCw,
  Volume2, Radio, Podcast, Voicemail, AudioLines,
  BookOpen, Mail, Newspaper, ScrollText, FileCode,
  Search, Filter, Star, Zap, Crown, TrendingUp
} from 'lucide-react';

// Complete tools registry with all 60+ tools
const TOOLS_CATALOG = {
  image: {
    name: 'Image Tools',
    description: 'Create and edit stunning images with AI',
    icon: Image,
    color: 'blue',
    tools: [
      { id: 'image-generator', name: 'AI Image Generator', description: 'Create images from text descriptions', credits: 10, icon: Sparkles, popular: true },
      { id: 'image-editor', name: 'AI Image Editor', description: 'Edit and enhance images', credits: 8, icon: Wand2 },
      { id: 'background-remover', name: 'Background Remover', description: 'Remove backgrounds instantly', credits: 3, icon: Scissors },
      { id: 'image-upscaler', name: 'Image Upscaler', description: 'Upscale images up to 4x', credits: 5, icon: Maximize },
      { id: 'face-swap', name: 'Face Swap', description: 'Swap faces in images', credits: 8, icon: Users },
      { id: 'style-transfer', name: 'Style Transfer', description: 'Apply artistic styles', credits: 6, icon: Palette },
      { id: 'colorize', name: 'Photo Colorizer', description: 'Colorize black & white photos', credits: 5, icon: Brush },
      { id: 'restore', name: 'Photo Restorer', description: 'Restore old or damaged photos', credits: 7, icon: RotateCw },
      { id: 'inpaint', name: 'AI Inpainting', description: 'Remove or replace objects', credits: 8, icon: Eraser },
      { id: 'outpaint', name: 'AI Outpainting', description: 'Extend image boundaries', credits: 10, icon: Move },
      { id: 'avatar-maker', name: 'Avatar Maker', description: 'Create custom AI avatars', credits: 15, icon: Users },
      { id: 'logo-generator', name: 'Logo Generator', description: 'AI-powered logo design', credits: 12, icon: Layers },
    ],
  },
  video: {
    name: 'Video Tools',
    description: 'Create and edit videos with AI',
    icon: Video,
    color: 'purple',
    tools: [
      { id: 'video-generator', name: 'AI Video Generator', description: 'Create videos from text or images', credits: 50, icon: Video, popular: true },
      { id: 'text-to-video', name: 'Text to Video', description: 'Turn scripts into videos', credits: 60, icon: Film },
      { id: 'image-to-video', name: 'Image to Video', description: 'Animate still images', credits: 40, icon: Camera },
      { id: 'lipsync', name: 'Lip Sync Video', description: 'Sync lips to audio', credits: 45, icon: Mic },
      { id: 'video-upscaler', name: 'Video Upscaler', description: 'Enhance video quality', credits: 35, icon: Maximize },
      { id: 'video-bg-remover', name: 'Video Background Remover', description: 'Remove video backgrounds', credits: 30, icon: Scissors },
      { id: 'slow-mo', name: 'AI Slow Motion', description: 'Create smooth slow-mo', credits: 25, icon: RotateCw },
      { id: 'video-translator', name: 'Video Translator', description: 'Translate and dub videos', credits: 55, icon: Languages },
    ],
  },
  audio: {
    name: 'Audio & Voice',
    description: 'Voice cloning, TTS, and audio tools',
    icon: Mic,
    color: 'green',
    tools: [
      { id: 'text-to-speech', name: 'Text to Speech', description: 'Natural voice synthesis', credits: 5, icon: Volume2, popular: true },
      { id: 'voice-clone', name: 'Voice Clone', description: 'Clone any voice', credits: 100, icon: Users },
      { id: 'voice-changer', name: 'Voice Changer', description: 'Transform your voice', credits: 8, icon: AudioLines },
      { id: 'transcription', name: 'Audio Transcription', description: 'Convert speech to text', credits: 2, icon: FileText },
      { id: 'audio-enhancer', name: 'Audio Enhancer', description: 'Clean and enhance audio', credits: 5, icon: Headphones },
      { id: 'noise-remover', name: 'Noise Remover', description: 'Remove background noise', credits: 4, icon: Volume2 },
      { id: 'podcast-editor', name: 'Podcast Editor', description: 'AI-powered podcast editing', credits: 15, icon: Podcast },
      { id: 'audiobook-creator', name: 'Audiobook Creator', description: 'Turn books into audio', credits: 20, icon: BookOpen },
    ],
  },
  music: {
    name: 'Music Creation',
    description: 'Generate original music with AI',
    icon: Music,
    color: 'pink',
    tools: [
      { id: 'music-generator', name: 'AI Music Generator', description: 'Create original music', credits: 15, icon: Music, popular: true },
      { id: 'song-creator', name: 'Full Song Creator', description: 'Complete songs with vocals', credits: 50, icon: Mic },
      { id: 'beat-maker', name: 'Beat Maker', description: 'Generate custom beats', credits: 10, icon: Radio },
      { id: 'melody-generator', name: 'Melody Generator', description: 'Create unique melodies', credits: 8, icon: AudioLines },
      { id: 'stem-separator', name: 'Stem Separator', description: 'Separate vocals/instruments', credits: 12, icon: Layers },
      { id: 'remix-tool', name: 'AI Remix', description: 'Remix existing tracks', credits: 20, icon: RotateCw },
    ],
  },
  text: {
    name: 'Writing & Text',
    description: 'AI writing and document tools',
    icon: FileText,
    color: 'orange',
    tools: [
      { id: 'ai-writer', name: 'AI Writer', description: 'Generate articles and content', credits: 3, icon: PenTool, popular: true },
      { id: 'copywriter', name: 'AI Copywriter', description: 'Marketing copy and ads', credits: 5, icon: Newspaper },
      { id: 'story-generator', name: 'Story Generator', description: 'Create stories and fiction', credits: 5, icon: BookOpen },
      { id: 'email-writer', name: 'Email Writer', description: 'Professional email drafts', credits: 2, icon: Mail },
      { id: 'summarizer', name: 'Text Summarizer', description: 'Summarize long texts', credits: 2, icon: FileSearch },
      { id: 'translator', name: 'AI Translator', description: 'Translate 100+ languages', credits: 2, icon: Languages },
      { id: 'grammar-checker', name: 'Grammar Checker', description: 'Fix grammar and style', credits: 1, icon: ScrollText },
      { id: 'paraphraser', name: 'Paraphraser', description: 'Rewrite text', credits: 2, icon: RotateCw },
    ],
  },
  code: {
    name: 'Code & Dev',
    description: 'AI-powered coding tools',
    icon: Code,
    color: 'cyan',
    tools: [
      { id: 'code-generator', name: 'Code Generator', description: 'Generate code in any language', credits: 5, icon: Code, popular: true },
      { id: 'code-explainer', name: 'Code Explainer', description: 'Understand any code', credits: 3, icon: FileCode },
      { id: 'bug-fixer', name: 'Bug Fixer', description: 'Find and fix bugs', credits: 5, icon: Search },
      { id: 'code-converter', name: 'Code Converter', description: 'Convert between languages', credits: 4, icon: RotateCw },
      { id: 'api-generator', name: 'API Generator', description: 'Generate API endpoints', credits: 8, icon: Layers },
      { id: 'regex-builder', name: 'Regex Builder', description: 'Build regex patterns', credits: 2, icon: Search },
    ],
  },
  utility: {
    name: 'Utilities',
    description: 'Helpful AI utilities',
    icon: Zap,
    color: 'yellow',
    tools: [
      { id: 'qr-generator', name: 'QR Code Generator', description: 'Create beautiful QR codes', credits: 1, icon: QrCode },
      { id: 'meme-generator', name: 'Meme Generator', description: 'Create memes with AI', credits: 2, icon: Image },
      { id: 'resume-builder', name: 'Resume Builder', description: 'AI-powered resumes', credits: 5, icon: FileText },
      { id: 'presentation-maker', name: 'Presentation Maker', description: 'Create slide decks', credits: 10, icon: Layers },
      { id: 'social-scheduler', name: 'Social Scheduler', description: 'Plan social media posts', credits: 3, icon: Calendar },
      { id: 'hashtag-generator', name: 'Hashtag Generator', description: 'Trending hashtags', credits: 1, icon: TrendingUp },
    ],
  },
  chat: {
    name: 'AI Assistants',
    description: 'Specialized AI chatbots',
    icon: Bot,
    color: 'indigo',
    tools: [
      { id: 'javari-chat', name: 'Javari AI', description: 'Your creative assistant', credits: 1, icon: Bot, popular: true },
      { id: 'business-advisor', name: 'Business Advisor', description: 'Business strategy AI', credits: 3, icon: TrendingUp },
      { id: 'legal-assistant', name: 'Legal Assistant', description: 'Legal document help', credits: 5, icon: FileText },
      { id: 'fitness-coach', name: 'Fitness Coach', description: 'Workout and nutrition AI', credits: 2, icon: Zap },
      { id: 'language-tutor', name: 'Language Tutor', description: 'Learn new languages', credits: 2, icon: Languages },
      { id: 'therapist-ai', name: 'Wellness AI', description: 'Mental wellness support', credits: 2, icon: MessageSquare },
    ],
  },
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
};

function Calendar(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

export default function AppsPage() {
  const totalTools = Object.values(TOOLS_CATALOG).reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            {totalTools}+ AI-Powered Tools
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Story. Our Design.
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Create stunning images, videos, music, and more with our comprehensive suite of AI tools. 
            All powered by your credits that never expire.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/dashboard/credits"
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Get Credits
            </Link>
            <Link 
              href="#tools"
              className="px-8 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold whitespace-nowrap">
                All Tools
              </button>
              {Object.entries(TOOLS_CATALOG).map(([key, cat]) => (
                <a 
                  key={key}
                  href={`#${key}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 whitespace-nowrap"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tools Catalog */}
      <div id="tools" className="container mx-auto px-4 py-12">
        {Object.entries(TOOLS_CATALOG).map(([key, category]) => {
          const CategoryIcon = category.icon;
          const colors = colorClasses[category.color];
          
          return (
            <section key={key} id={key} className="mb-16 scroll-mt-24">
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center`}>
                  <CategoryIcon className={`w-7 h-7 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                  <p className="text-gray-500">{category.description}</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                  {category.tools.length} tools
                </span>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.tools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link 
                      key={tool.id}
                      href={`/apps/${tool.id}`}
                      className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
                    >
                      {tool.popular && (
                        <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" fill="white" /> Popular
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <ToolIcon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {tool.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded-lg text-xs font-semibold`}>
                          {tool.credits} credits
                        </span>
                        <span className="text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Try it →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Get started with 25 free credits. Upgrade for unlimited access and credits that never expire.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/signup"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-green-700 transition-colors"
            >
              Start Free
            </Link>
            <Link 
              href="/pricing"
              className="px-8 py-3 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
