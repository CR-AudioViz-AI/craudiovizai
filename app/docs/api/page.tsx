// /app/docs/api/page.tsx
// API Documentation - CR AudioViz AI
// Developer documentation for the Javari API

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  endpoints: Endpoint[];
}

// =============================================================================
// DATA
// =============================================================================

const API_SECTIONS: Section[] = [
  {
    id: 'auth',
    title: 'Authentication',
    icon: '🔐',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/token',
        description: 'Generate an access token using your API key',
        auth: false,
        parameters: [
          { name: 'api_key', type: 'string', required: true, description: 'Your API key from the dashboard' }
        ],
        response: '{ "access_token": "jv_at_...", "expires_in": 3600 }'
      }
    ]
  },
  {
    id: 'chat',
    title: 'Chat Completions',
    icon: '💬',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/chat/completions',
        description: 'Create a chat completion with Javari AI',
        auth: true,
        parameters: [
          { name: 'messages', type: 'array', required: true, description: 'Array of message objects with role and content' },
          { name: 'model', type: 'string', required: false, description: 'Model to use (default: javari-1)' },
          { name: 'max_tokens', type: 'number', required: false, description: 'Maximum tokens in response (default: 1000)' },
          { name: 'temperature', type: 'number', required: false, description: 'Creativity level 0-2 (default: 0.7)' }
        ],
        response: '{ "id": "chat_...", "choices": [{ "message": { "role": "assistant", "content": "..." } }], "usage": { "credits": 1 } }'
      },
      {
        method: 'POST',
        path: '/api/v1/chat/stream',
        description: 'Stream a chat completion (SSE)',
        auth: true,
        parameters: [
          { name: 'messages', type: 'array', required: true, description: 'Array of message objects' },
          { name: 'model', type: 'string', required: false, description: 'Model to use' }
        ]
      }
    ]
  },
  {
    id: 'images',
    title: 'Image Generation',
    icon: '🎨',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/images/generate',
        description: 'Generate images from text prompts',
        auth: true,
        parameters: [
          { name: 'prompt', type: 'string', required: true, description: 'Text description of the image' },
          { name: 'size', type: 'string', required: false, description: '256x256, 512x512, or 1024x1024 (default)' },
          { name: 'n', type: 'number', required: false, description: 'Number of images 1-4 (default: 1)' },
          { name: 'style', type: 'string', required: false, description: 'natural, vivid, or artistic' }
        ],
        response: '{ "images": [{ "url": "https://...", "b64_json": "..." }], "usage": { "credits": 5 } }'
      }
    ]
  },
  {
    id: 'credits',
    title: 'Credits',
    icon: '💳',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/credits/balance',
        description: 'Get current credit balance',
        auth: true,
        response: '{ "balance": 1850, "tier": "pro", "expires": null }'
      },
      {
        method: 'GET',
        path: '/api/v1/credits/usage',
        description: 'Get credit usage history',
        auth: true,
        parameters: [
          { name: 'start_date', type: 'string', required: false, description: 'ISO date string' },
          { name: 'end_date', type: 'string', required: false, description: 'ISO date string' },
          { name: 'limit', type: 'number', required: false, description: 'Max results (default: 100)' }
        ]
      }
    ]
  },
  {
    id: 'users',
    title: 'Users',
    icon: '👤',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/users/me',
        description: 'Get current user profile',
        auth: true,
        response: '{ "id": "user_...", "email": "...", "name": "...", "tier": "pro", "created_at": "..." }'
      },
      {
        method: 'PUT',
        path: '/api/v1/users/me',
        description: 'Update user profile',
        auth: true,
        parameters: [
          { name: 'name', type: 'string', required: false, description: 'Display name' },
          { name: 'preferences', type: 'object', required: false, description: 'User preferences' }
        ]
      }
    ]
  }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${colors[method]}`}>
      {method}
    </span>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-mono text-gray-900 dark:text-white">{endpoint.path}</code>
          {endpoint.auth && (
            <span className="text-xs text-gray-500">🔒 Auth required</span>
          )}
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">{endpoint.description}</p>

          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Parameters</h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Required</th>
                      <th className="px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map(param => (
                      <tr key={param.name} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-2 font-mono text-blue-600">{param.name}</td>
                        <td className="px-4 py-2 text-gray-500">{param.type}</td>
                        <td className="px-4 py-2">{param.required ? '✓' : '—'}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.response && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {endpoint.response}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function CodeExample() {
  const [lang, setLang] = useState<'curl' | 'javascript' | 'python'>('curl');

  const examples = {
    curl: `curl -X POST https://api.craudiovizai.com/v1/chat/completions \\
  -H "Authorization: Bearer jv_sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, Javari!"}
    ],
    "model": "javari-1"
  }'`,
    javascript: `const response = await fetch('https://api.craudiovizai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jv_sk_live_your_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello, Javari!' }
    ],
    model: 'javari-1'
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`,
    python: `import requests

response = requests.post(
    'https://api.craudiovizai.com/v1/chat/completions',
    headers={
        'Authorization': 'Bearer jv_sk_live_your_key',
        'Content-Type': 'application/json'
    },
    json={
        'messages': [
            {'role': 'user', 'content': 'Hello, Javari!'}
        ],
        'model': 'javari-1'
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])`
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-700">
        {(['curl', 'javascript', 'python'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-4 py-2 text-sm font-medium ${
              lang === l
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {l === 'curl' ? 'cURL' : l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>
      <pre className="p-4 text-sm text-green-400 overflow-x-auto">
        {examples[lang]}
      </pre>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function APIDocsPage() {
  const [activeSection, setActiveSection] = useState('auth');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">J</span>
                </div>
              </Link>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">API Documentation</h1>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/settings#api" className="text-sm text-blue-600 hover:underline">
                Get API Key →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto p-4">
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Getting Started</p>
            <Link href="#intro" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              Introduction
            </Link>
            <Link href="#auth" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              Authentication
            </Link>
            <Link href="#errors" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              Error Handling
            </Link>
          </div>

          <div className="mt-6 space-y-1">
            <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Endpoints</p>
            {API_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-1">
            <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Resources</p>
            <Link href="#sdks" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              SDKs & Libraries
            </Link>
            <Link href="#webhooks" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              Webhooks
            </Link>
            <Link href="#changelog" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              Changelog
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Introduction */}
            <section id="intro" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Javari API Documentation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The Javari API allows you to integrate AI capabilities into your applications.
                Generate text, create images, and build intelligent features with simple API calls.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Base URL</h3>
                <code className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                  https://api.craudiovizai.com/v1
                </code>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Start</h3>
              <CodeExample />
            </section>

            {/* Authentication */}
            <section id="auth" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🔐 Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                All API requests require authentication using a Bearer token. Get your API key from the{' '}
                <Link href="/settings#api" className="text-blue-600 hover:underline">Settings page</Link>.
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
                Authorization: Bearer jv_sk_live_your_api_key_here
              </pre>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Never expose your API key in client-side code. Always make API calls from your server.
                </p>
              </div>
            </section>

            {/* Endpoints */}
            {API_SECTIONS.map(section => (
              <section key={section.id} id={section.id} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>{section.icon}</span>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.endpoints.map((endpoint, idx) => (
                    <EndpointCard key={idx} endpoint={endpoint} />
                  ))}
                </div>
              </section>
            ))}

            {/* Error Handling */}
            <section id="errors" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error Handling
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The API uses standard HTTP status codes and returns error details in JSON format.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">200</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Success</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">400</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Bad Request - Invalid parameters</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">401</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Unauthorized - Invalid API key</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">402</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Payment Required - Insufficient credits</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">429</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Rate Limited - Too many requests</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-mono">500</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Server Error - Try again later</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate Limits */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Rate Limits
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Requests/min</th>
                      <th className="px-4 py-3 text-left">Requests/day</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">Free</td>
                      <td className="px-4 py-3">20</td>
                      <td className="px-4 py-3">100</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">Pro</td>
                      <td className="px-4 py-3">100</td>
                      <td className="px-4 py-3">10,000</td>
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">Business</td>
                      <td className="px-4 py-3">1,000</td>
                      <td className="px-4 py-3">100,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Support */}
            <section className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <p className="text-blue-100 mb-6">
                Our developer support team is here to help you integrate the Javari API.
              </p>
              <div className="flex gap-4">
                <Link href="/support" className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
                  Contact Support
                </Link>
                <Link href="https://github.com/CR-AudioViz-AI" className="px-6 py-2 border border-white rounded-lg font-medium hover:bg-white/10">
                  GitHub Examples
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
