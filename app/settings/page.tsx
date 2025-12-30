// /app/settings/page.tsx
// User Settings - CR AudioViz AI / Javari
// Account, billing, preferences, and security settings

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  tier: string;
  credits: number;
  createdAt: string;
}

interface BillingInfo {
  tier: string;
  nextBillingDate: string;
  amount: number;
  paymentMethod: {
    type: 'card' | 'paypal';
    last4?: string;
    email?: string;
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function SettingsNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'billing', name: 'Billing', icon: '💳' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'api', name: 'API Keys', icon: '🔑' }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="font-medium">{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileSettings({ profile }: { profile: UserProfile }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    alert('Profile updated!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl">
          {profile.avatar || '👤'}
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Change Avatar
          </button>
          <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Account Info</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Member Since</span>
            <p className="font-medium text-gray-900 dark:text-white">{profile.createdAt}</p>
          </div>
          <div>
            <span className="text-gray-500">Current Plan</span>
            <p className="font-medium text-gray-900 dark:text-white">{profile.tier}</p>
          </div>
          <div>
            <span className="text-gray-500">Credits</span>
            <p className="font-medium text-gray-900 dark:text-white">{profile.credits}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function BillingSettings({ billing }: { billing: BillingInfo }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Billing & Subscription</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Current Plan</p>
            <h3 className="text-2xl font-bold">{billing.tier}</h3>
            <p className="text-blue-100 mt-1">
              Next billing: {billing.nextBillingDate} • ${billing.amount}/month
            </p>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50"
          >
            Change Plan
          </Link>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-4">
            {billing.paymentMethod.type === 'card' ? (
              <>
                <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  💳
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    •••• •••• •••• {billing.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-500">Expires 12/2027</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                  🅿️
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                  <p className="text-sm text-gray-500">{billing.paymentMethod.email}</p>
                </div>
              </>
            )}
          </div>
          <button className="text-blue-600 hover:underline text-sm">Update</button>
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:underline">
          + Add payment method
        </button>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Billing History</h3>
        <div className="space-y-3">
          {[
            { date: 'Dec 1, 2025', amount: '$29.00', status: 'Paid', invoice: 'INV-001' },
            { date: 'Nov 1, 2025', amount: '$29.00', status: 'Paid', invoice: 'INV-002' },
            { date: 'Oct 1, 2025', amount: '$29.00', status: 'Paid', invoice: 'INV-003' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.date}</p>
                <p className="text-sm text-gray-500">{item.invoice}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">{item.amount}</p>
                <p className="text-sm text-green-600">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:underline">
          View all invoices →
        </button>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize your experience</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">GMT/UTC</option>
          </select>
        </div>

        {/* Javari Preferences */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Javari AI Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-gray-700 dark:text-gray-300">Show typing animation</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-gray-700 dark:text-gray-300">Play sound effects</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-gray-700 dark:text-gray-300">Remember conversation context</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Security</h2>
        <p className="text-gray-600 dark:text-gray-400">Protect your account</p>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Update Password
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Enable 2FA
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: 'Chrome on Windows', location: 'Fort Myers, FL', current: true },
            { device: 'Safari on iPhone', location: 'Fort Myers, FL', current: false }
          ].map((session, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{session.device.includes('iPhone') ? '📱' : '💻'}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {session.device}
                    {session.current && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                  </p>
                  <p className="text-sm text-gray-500">{session.location}</p>
                </div>
              </div>
              {!session.current && (
                <button className="text-red-600 hover:underline text-sm">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
        <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-100">
            Export My Data
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose what you want to be notified about</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
        {[
          { category: 'Account', items: ['Security alerts', 'Billing updates', 'Plan changes'] },
          { category: 'Product', items: ['New features', 'Tips & tutorials', 'Product updates'] },
          { category: 'Marketing', items: ['Promotions', 'Newsletter', 'Partner offers'] },
          { category: 'Community', items: ['Marketplace sales', 'Comments on your products', 'New followers'] }
        ].map((group) => (
          <div key={group.category}>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{group.category}</h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <label key={item} className="flex items-center justify-between py-2">
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-xs text-gray-500">Email</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-xs text-gray-500">Push</span>
                    </label>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Notifications
        </button>
      </div>
    </div>
  );
}

function APISettings() {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">API Keys</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your API access for integrations</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          ⚠️ API access is available on Pro and Business plans. Keep your keys secret!
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your API Key</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm">
            {showKey ? 'jv_sk_live_abc123xyz789...' : '••••••••••••••••••••••••••••••••'}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Created on Dec 15, 2025 • Last used 2 hours ago
        </p>
        <div className="mt-4 flex gap-4">
          <button className="text-sm text-blue-600 hover:underline">Regenerate Key</button>
          <button className="text-sm text-red-600 hover:underline">Revoke Key</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">API Usage</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500">Requests Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">45,678</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500">Rate Limit</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1000/min</p>
          </div>
        </div>
        <Link href="/docs/api" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          View API Documentation →
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const profile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    name: 'Demo User',
    avatar: '👤',
    tier: 'Pro',
    credits: 1850,
    createdAt: 'December 2025'
  };

  const billing: BillingInfo = {
    tier: 'Pro Plan',
    nextBillingDate: 'January 1, 2026',
    amount: 29,
    paymentMethod: {
      type: 'card',
      last4: '4242'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Dashboard
              </Link>
              <h1 className="font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {activeTab === 'profile' && <ProfileSettings profile={profile} />}
              {activeTab === 'billing' && <BillingSettings billing={billing} />}
              {activeTab === 'preferences' && <PreferencesSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'api' && <APISettings />}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
