// app/admin/grants/[id]/components/GrantAISection.tsx
// Javari AI Grant Assistant - Win More Grants
// Timestamp: Saturday, December 13, 2025 - 12:15 PM EST

'use client';

import { useState } from 'react';
import { 
  Sparkles, Brain, Lightbulb, Target, TrendingUp, 
  FileText, CheckCircle, AlertTriangle, Zap, RefreshCw,
  ThumbsUp, ThumbsDown, Copy, ChevronDown, ChevronUp
} from 'lucide-react';

interface AIAnalysis {
  id: string;
  analysis_type: string;
  analysis_title: string;
  analysis_content: string;
  recommendations: string[];
  keywords_suggested: string[];
  confidence_score: number;
  created_at: string;
  was_helpful: boolean | null;
}

interface Grant {
  id: string;
  grant_name: string;
  agency_name: string;
  description: string;
  target_modules: string[];
  match_score: number;
  win_probability: number;
}

const ANALYSIS_TYPES = [
  { id: 'match_analysis', label: 'Match Analysis', icon: Target, description: 'How well does this grant match our mission?' },
  { id: 'win_strategy', label: 'Win Strategy', icon: TrendingUp, description: 'Strategic recommendations to win' },
  { id: 'keyword_suggestions', label: 'Keyword Analysis', icon: FileText, description: 'Key terms to include in application' },
  { id: 'narrative_draft', label: 'Narrative Draft', icon: Brain, description: 'AI-generated narrative sections' },
  { id: 'competitive_intel', label: 'Competitive Intel', icon: Lightbulb, description: 'Who else is applying?' },
  { id: 'weakness_review', label: 'Weakness Review', icon: AlertTriangle, description: 'Identify application weaknesses' },
];

export default function GrantAISection({ 
  grantId, 
  grant,
  aiAnalysis 
}: { 
  grantId: string;
  grant: Grant;
  aiAnalysis: AIAnalysis[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const runAnalysis = async (analysisType: string) => {
    setLoading(true);
    setActiveAnalysis(analysisType);
    
    try {
      const response = await fetch(`/api/admin/grants/${grantId}/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysis_type: analysisType,
          grant_data: grant 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const provideFeedback = async (analysisId: string, helpful: boolean) => {
    try {
      await fetch(`/api/admin/grants/ai-analysis/${analysisId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ was_helpful: helpful }),
      });
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-sm overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-semibold">Javari Grant Assistant</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/70" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/70" />
        )}
      </div>

      {isExpanded && (
        <div className="bg-white">
          {/* AI Score Summary */}
          <div className="p-4 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{grant.match_score || 0}%</div>
                <div className="text-xs text-gray-500">Match Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{grant.win_probability || 0}%</div>
                <div className="text-xs text-gray-500">Win Probability</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">AI Analysis Tools</p>
            <div className="grid grid-cols-2 gap-2">
              {ANALYSIS_TYPES.slice(0, 4).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => runAnalysis(type.id)}
                    disabled={loading}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      activeAnalysis === type.id && loading
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {activeAnalysis === type.id && loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="p-4 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-purple-900">{generatedContent.title}</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                {generatedContent.content}
              </div>
              {generatedContent.recommendations && generatedContent.recommendations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-purple-700 font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {generatedContent.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {generatedContent.keywords && generatedContent.keywords.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-purple-700 font-medium mb-2">Suggested Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedContent.keywords.map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white text-purple-700 rounded text-xs cursor-pointer hover:bg-purple-100"
                        onClick={() => copyToClipboard(keyword)}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Confidence: {generatedContent.confidence || 85}%
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Was this helpful?</span>
                  <button
                    onClick={() => provideFeedback(generatedContent.id, true)}
                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => provideFeedback(generatedContent.id, false)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Previous Analyses */}
          {aiAnalysis.length > 0 && (
            <div className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Previous Analyses</p>
              <div className="space-y-2">
                {aiAnalysis.slice(0, 3).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setGeneratedContent(analysis)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {analysis.analysis_title || analysis.analysis_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {analysis.analysis_content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full AI Assistant Link */}
          <div className="p-4 border-t border-gray-100">
            <a
              href={`/admin/grants/${grantId}/ai-assistant`}
              className="block w-full py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg text-center hover:bg-purple-700 transition-colors"
            >
              Open Full AI Assistant
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
