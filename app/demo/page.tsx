'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type FormData = {
  name: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  useCase: string;
  message: string;
};

export default function DemoPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    companySize: '',
    useCase: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit to API
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const features = [
    {
      icon: '🤖',
      title: 'Javari AI Assistant',
      description: 'Your intelligent AI partner that learns and adapts to your business needs'
    },
    {
      icon: '🎨',
      title: 'Creative Tools Suite',
      description: 'Professional-grade design, video, and content creation tools'
    },
    {
      icon: '💼',
      title: 'Business Operations',
      description: 'CRM, invoicing, scheduling, and business management in one place'
    },
    {
      icon: '🌐',
      title: 'White-Label Solutions',
      description: 'Fully customizable platform you can brand as your own'
    },
    {
      icon: '🎮',
      title: 'Games & Entertainment',
      description: 'Extensive library of games and interactive experiences'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Real-time insights and business intelligence'
    },
  ];

  const testimonials = [
    {
      quote: "CR AudioViz AI transformed how we approach content creation. The AI tools are incredibly intuitive.",
      author: "Early Access Partner",
      role: "Marketing Agency Owner"
    },
    {
      quote: "The white-label capability let us launch our own branded AI platform in weeks, not months.",
      author: "Beta Tester",
      role: "SaaS Founder"
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-gray-300 mb-6">
            Your demo request has been received. Our team will reach out within 24 hours to schedule your personalized demo.
          </p>
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Return Home
            </Link>
            <Link
              href="https://javariai.com"
              className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Try Javari AI Now
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">CR AudioViz AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition">About</Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-purple-500/20 text-purple-300 px-4 py-1 rounded-full text-sm font-medium mb-6">
            🚀 Limited Pilot Program
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Experience the Future of
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> AI-Powered Business</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Join our exclusive pilot program and be among the first to access the complete CR AudioViz AI ecosystem with Javari AI, creative tools, and enterprise solutions.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">What You&apos;ll Get</h2>
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-5 hover:bg-white/10 transition"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{feature.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white">What Early Users Say</h3>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-5">
                  <p className="text-gray-300 italic mb-3">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="text-sm">
                    <span className="text-purple-400 font-medium">{testimonial.author}</span>
                    <span className="text-gray-500"> • {testimonial.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Demo Request Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Request Your Demo</h2>
            <p className="text-gray-400 mb-6">Fill out the form and our team will schedule a personalized demo within 24 hours.</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company *</label>
                  <input
                    type="text"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="CEO, CTO, Marketing Director..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Size</label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" className="bg-slate-800">Select...</option>
                    <option value="1-10" className="bg-slate-800">1-10 employees</option>
                    <option value="11-50" className="bg-slate-800">11-50 employees</option>
                    <option value="51-200" className="bg-slate-800">51-200 employees</option>
                    <option value="201-500" className="bg-slate-800">201-500 employees</option>
                    <option value="500+" className="bg-slate-800">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Primary Interest</label>
                  <select
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" className="bg-slate-800">Select...</option>
                    <option value="ai-assistant" className="bg-slate-800">AI Assistant (Javari)</option>
                    <option value="creative-tools" className="bg-slate-800">Creative Tools</option>
                    <option value="business-ops" className="bg-slate-800">Business Operations</option>
                    <option value="white-label" className="bg-slate-800">White-Label Solution</option>
                    <option value="enterprise" className="bg-slate-800">Enterprise Platform</option>
                    <option value="social-impact" className="bg-slate-800">Social Impact/Nonprofit</option>
                    <option value="other" className="bg-slate-800">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tell us about your needs</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="What challenges are you looking to solve? What features interest you most?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Request Demo'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By submitting, you agree to our{' '}
                <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>.
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">143+</div>
              <div className="text-gray-400 text-sm">Active Applications</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">57+</div>
              <div className="text-gray-400 text-sm">Custom Domains</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">500+</div>
              <div className="text-gray-400 text-sm">AI Models Available</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">24/7</div>
              <div className="text-gray-400 text-sm">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">© 2026 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-gray-600 text-sm mt-2">Your Story. Our Design. Everyone Connects. Everyone Wins.</p>
        </div>
      </footer>
    </div>
  );
}
