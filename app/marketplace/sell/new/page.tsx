// /app/marketplace/sell/new/page.tsx
// Create New Product - CR AudioViz AI Creator Marketplace
// Upload and list digital products for sale

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// =============================================================================
// TYPES
// =============================================================================

interface ProductForm {
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  files: File[];
  thumbnail: File | null;
  license: 'standard' | 'extended' | 'exclusive';
}

const CATEGORIES = [
  { id: 'templates', name: 'Templates', icon: '📄' },
  { id: 'graphics', name: 'Graphics', icon: '🎨' },
  { id: 'logos', name: 'Logo Packs', icon: '✨' },
  { id: 'prompts', name: 'AI Prompts', icon: '🤖' },
  { id: 'presets', name: 'Presets', icon: '🎛️' },
  { id: 'fonts', name: 'Fonts', icon: '🔤' },
  { id: 'icons', name: 'Icon Packs', icon: '🎯' },
  { id: 'photos', name: 'Photos', icon: '📸' },
  { id: 'audio', name: 'Audio', icon: '🎵' },
  { id: 'video', name: 'Video', icon: '🎬' },
  { id: 'code', name: 'Code', icon: '💻' }
];

const LICENSE_TYPES = [
  {
    id: 'standard',
    name: 'Standard License',
    description: 'Use in unlimited personal projects',
    multiplier: 1
  },
  {
    id: 'extended',
    name: 'Extended License',
    description: 'Use in commercial projects, resale allowed',
    multiplier: 2.5
  },
  {
    id: 'exclusive',
    name: 'Exclusive License',
    description: 'Full ownership transfer, removed from marketplace',
    multiplier: 10
  }
];

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price: 10,
    category: '',
    tags: [],
    files: [],
    thumbnail: null,
    license: 'standard'
  });
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim().toLowerCase())) {
        setForm({ ...form, tags: [...form.tags, tagInput.trim().toLowerCase()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm({ ...form, files: [...form.files, ...files] });
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, thumbnail: file });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/marketplace/sell?success=true');
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    return (form.price * 0.7).toFixed(2);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return form.title.length >= 5 && form.category !== '';
      case 2:
        return form.description.length >= 20 && form.tags.length >= 1;
      case 3:
        return form.files.length > 0;
      case 4:
        return form.price >= 5;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketplace/sell" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <h1 className="font-bold text-gray-900 dark:text-white">Create New Product</h1>
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of 4
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            {['Details', 'Description', 'Files', 'Pricing'].map((label, idx) => (
              <div
                key={label}
                className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
                  step > idx + 1
                    ? 'border-green-500 text-green-600'
                    : step === idx + 1
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {step > idx + 1 ? '✓ ' : ''}{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Basic Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Professional Business Card Templates"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          form.category === cat.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{cat.icon}</span>
                        <span className="text-sm">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description & Tags */}
          {step === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Description & Tags
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your product in detail. What's included? What makes it special?"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.description.length}/2000 characters (minimum 20)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags * (press Enter to add)
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tags like: business, minimal, modern..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: File Upload */}
          {step === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Upload Files
              </h2>

              <div className="space-y-6">
                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                    {form.thumbnail ? (
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-4xl">🖼️</span>
                        <div>
                          <p className="font-medium">{form.thumbnail.name}</p>
                          <button
                            onClick={() => setForm({ ...form, thumbnail: null })}
                            className="text-sm text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          id="thumbnail-upload"
                        />
                        <label htmlFor="thumbnail-upload" className="cursor-pointer">
                          <span className="text-4xl block mb-2">📷</span>
                          <p className="text-gray-600 dark:text-gray-400">
                            Click to upload thumbnail (recommended: 800x600)
                          </p>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Files */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Files *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-4xl block mb-2">📁</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        Drag & drop files or click to browse
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Max 500MB per file. ZIP recommended for multiple files.
                      </p>
                    </label>
                  </div>

                  {form.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {form.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span>📄</span>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setForm({ 
                              ...form, 
                              files: form.files.filter((_, i) => i !== idx) 
                            })}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Set Your Price
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (in credits) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Math.max(5, parseInt(e.target.value) || 0) })}
                      min={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-2xl font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      credits
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 5 credits. 1 credit ≈ $0.05
                  </p>
                </div>

                {/* Earnings Calculator */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">You'll Earn (70%)</p>
                      <p className="text-3xl font-bold text-green-600">${calculateEarnings()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Platform fee (30%)</p>
                      <p className="text-lg text-gray-600">${(form.price * 0.3 * 0.05).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* License Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    License Type
                  </label>
                  <div className="space-y-3">
                    {LICENSE_TYPES.map(license => (
                      <button
                        key={license.id}
                        onClick={() => setForm({ ...form, license: license.id as any })}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          form.license === license.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {license.name}
                            </p>
                            <p className="text-sm text-gray-500">{license.description}</p>
                          </div>
                          {license.id !== 'standard' && (
                            <span className="text-sm text-purple-600">
                              {license.multiplier}x price
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            ← Previous
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !isStepValid()}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                <>🚀 Publish Product</>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
