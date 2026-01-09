'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { FileText, Download, Sparkles, Briefcase, GraduationCap, Award, User as UserIcon, Mail, Phone, MapPin, Linkedin, Globe, Loader2, AlertCircle, Coins } from 'lucide-react';

/**
 * Resume Builder - CR AudioViz AI
 * ================================
 * Standardized with: Auth, Credits, Error Handling, Accessibility
 */

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    location: string;
    graduationDate: string;
    gpa: string;
  }>;
  skills: string[];
}

const CREDIT_COST = 2; // Credits per AI enhancement

export default function ResumeBuilderPage() {
  // Auth & Credits State
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // App State
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [activeSection, setActiveSection] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '' },
    experience: [],
    education: [],
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');

  // Initialize auth and credits
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', session.user.id)
            .single();
          setCredits(profile?.credits || 0);
          
          // Log app usage
          await supabase.from('app_usage').insert({
            user_id: session.user.id,
            app_id: 'resume-builder',
            action: 'open',
            timestamp: new Date().toISOString()
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!user) {
      setError('Please sign in to use AI features');
      return false;
    }
    if (credits < amount) {
      setError(`Insufficient credits. You need ${amount} credits.`);
      return false;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: credits - amount })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'deduction',
        app_id: 'resume-builder',
        description: 'AI Resume Enhancement'
      }).catch(() => {});
      
      setCredits(prev => prev - amount);
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to process credits');
      return false;
    }
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: ''
      }]
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '', school: '', location: '', graduationDate: '', gpa: ''
      }]
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  const generateWithAI = async () => {
    const success = await deductCredits(CREDIT_COST);
    if (!success) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // AI enhancement logic would go here
      await new Promise(resolve => setTimeout(resolve, 2000));
      // For now, just simulate
    } catch (err) {
      setError('AI generation failed. Credits have been refunded.');
      // Refund credits on error
      await supabase.from('profiles').update({ credits: credits }).eq('id', user?.id);
      setCredits(prev => prev + CREDIT_COST);
    } finally {
      setIsGenerating(false);
    }
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: UserIcon },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Award }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-500 to-slate-900 flex items-center justify-center" role="status" aria-label="Loading">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Resume Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-500 to-slate-900" role="main" aria-label="Resume Builder">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center" aria-hidden="true">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Resume Builder</h1>
                <p className="text-sm text-gray-400">AI-Powered Professional Resumes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Credits Display */}
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${credits < 10 ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/10'}`}
                role="status"
                aria-label={`${credits} credits remaining`}
              >
                <Coins className={`w-4 h-4 ${credits < 10 ? 'text-cyan-500' : 'text-cyan-500'}`} />
                <span className={`font-medium ${credits < 10 ? 'text-cyan-500' : 'text-white'}`}>
                  {credits} credits
                </span>
              </div>
              
              <button
                onClick={generateWithAI}
                disabled={isGenerating || credits < CREDIT_COST}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`AI Enhance (costs ${CREDIT_COST} credits)`}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : `AI Enhance (${CREDIT_COST} credits)`}
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition"
                aria-label="Export resume as PDF"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-4" role="alert" aria-live="assertive">
          <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Resume view options">
          <button
            onClick={() => setActiveTab('edit')}
            role="tab"
            aria-selected={activeTab === 'edit'}
            aria-controls="edit-panel"
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'edit' ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            Edit Resume
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            role="tab"
            aria-selected={activeTab === 'preview'}
            aria-controls="preview-panel"
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'preview' ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            Preview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Section Navigation */}
          <nav className="lg:col-span-1" aria-label="Resume sections">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
              <h2 className="text-white font-semibold mb-4">Sections</h2>
              <div className="space-y-2" role="list">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as typeof activeSection)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeSection === section.id ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    aria-current={activeSection === section.id ? 'true' : undefined}
                  >
                    <section.icon className="w-5 h-5" aria-hidden="true" />
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Right Panel - Form/Preview */}
          <div className="lg:col-span-2">
            {activeTab === 'edit' ? (
              <div 
                id="edit-panel" 
                role="tabpanel" 
                aria-labelledby="edit-tab"
                className="bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                {activeSection === 'personal' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm text-gray-400 mb-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                          <input
                            id="fullName"
                            type="text"
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                            }))}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                          <input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, email: e.target.value }
                            }))}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm text-gray-400 mb-1">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                          <input
                            id="phone"
                            type="tel"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, phone: e.target.value }
                            }))}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-sm text-gray-400 mb-1">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                          <input
                            id="location"
                            type="text"
                            value={resumeData.personalInfo.location}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, location: e.target.value }
                            }))}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="New York, NY"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="summary" className="block text-sm text-gray-400 mb-1">Professional Summary</label>
                      <textarea
                        id="summary"
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, summary: e.target.value }
                        }))}
                        rows={4}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        placeholder="A brief summary of your professional background..."
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Work Experience</h3>
                      <button onClick={addExperience} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition">
                        + Add Experience
                      </button>
                    </div>
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                        <p>No experience added yet</p>
                      </div>
                    ) : (
                      resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Job Title" value={exp.title}
                              onChange={(e) => {
                                const newExp = [...resumeData.experience];
                                newExp[index].title = e.target.value;
                                setResumeData(prev => ({ ...prev, experience: newExp }));
                              }}
                              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <input type="text" placeholder="Company" value={exp.company}
                              onChange={(e) => {
                                const newExp = [...resumeData.experience];
                                newExp[index].company = e.target.value;
                                setResumeData(prev => ({ ...prev, experience: newExp }));
                              }}
                              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <textarea placeholder="Description..." value={exp.description} rows={3}
                            onChange={(e) => {
                              const newExp = [...resumeData.experience];
                              newExp[index].description = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            className="w-full mt-4 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSection === 'education' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Education</h3>
                      <button onClick={addEducation} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition">
                        + Add Education
                      </button>
                    </div>
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                        <p>No education added yet</p>
                      </div>
                    ) : (
                      resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Degree" value={edu.degree}
                              onChange={(e) => {
                                const newEdu = [...resumeData.education];
                                newEdu[index].degree = e.target.value;
                                setResumeData(prev => ({ ...prev, education: newEdu }));
                              }}
                              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <input type="text" placeholder="School" value={edu.school}
                              onChange={(e) => {
                                const newEdu = [...resumeData.education];
                                newEdu[index].school = e.target.value;
                                setResumeData(prev => ({ ...prev, education: newEdu }));
                              }}
                              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4">Skills</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add a skill..."
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-label="New skill"
                      />
                      <button onClick={addSkill} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4" role="list" aria-label="Added skills">
                      {resumeData.skills.map((skill, index) => (
                        <span key={index} role="listitem" className="px-3 py-1 bg-cyan-500/30 text-cyan-500 rounded-full text-sm flex items-center gap-2">
                          {skill}
                          <button onClick={() => removeSkill(index)} className="hover:text-white" aria-label={`Remove ${skill}`}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div id="preview-panel" role="tabpanel" aria-labelledby="preview-tab" className="bg-white rounded-2xl p-8 text-gray-900">
                <div className="text-center border-b pb-6 mb-6">
                  <h1 className="text-3xl font-bold">{resumeData.personalInfo.fullName || 'Your Name'}</h1>
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                    {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
                    {resumeData.personalInfo.phone && <span>{resumeData.personalInfo.phone}</span>}
                    {resumeData.personalInfo.location && <span>{resumeData.personalInfo.location}</span>}
                  </div>
                </div>
                {resumeData.personalInfo.summary && (
                  <section className="mb-6">
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-2">Professional Summary</h2>
                    <p className="text-gray-700">{resumeData.personalInfo.summary}</p>
                  </section>
                )}
                {resumeData.experience.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-2">Experience</h2>
                    {resumeData.experience.map(exp => (
                      <article key={exp.id} className="mb-4">
                        <div className="font-semibold">{exp.title || 'Job Title'}</div>
                        <div className="text-gray-600">{exp.company || 'Company'}</div>
                        <p className="text-sm mt-1">{exp.description}</p>
                      </article>
                    ))}
                  </section>
                )}
                {resumeData.skills.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-2">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">{skill}</span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
