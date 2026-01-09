// /app/privacy/page.tsx
// Privacy Policy - CR AudioViz AI

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 30, 2025</p>

        <div className="bg-cyan-50 dark:bg-slate-900/20 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-cyan-100 mb-2">🔒 Our Promise</h2>
          <p className="text-cyan-700 dark:text-cyan-300">
            We never sell your data. Ever. Your privacy is fundamental to everything we build.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (avatar, preferences)</li>
              <li>Payment information (processed securely by Stripe/PayPal)</li>
              <li>Content you create using our tools</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Usage data (features used, time spent)</li>
              <li>Device information (browser, OS)</li>
              <li>IP address and location (country/region level)</li>
              <li>Cookies for session management</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important account notifications</li>
              <li>Provide customer support</li>
              <li>Analyze usage to improve features</li>
              <li>Prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong>We do NOT sell your personal information.</strong> We only share data with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Payment processors</strong> (Stripe, PayPal) for transactions</li>
              <li><strong>AI providers</strong> (anonymized) for processing requests</li>
              <li><strong>Analytics services</strong> (aggregated, anonymized)</li>
              <li><strong>Legal authorities</strong> when required by law</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Your Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">You Have the Right To:</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Access</strong> - Request a copy of your data</li>
              <li><strong>Correct</strong> - Update inaccurate information</li>
              <li><strong>Delete</strong> - Request deletion of your data</li>
              <li><strong>Export</strong> - Download your data in standard formats</li>
              <li><strong>Opt-out</strong> - Unsubscribe from marketing emails</li>
              <li><strong>Restrict</strong> - Limit how we process your data</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Exercise these rights via Settings → Privacy or by contacting support@craudiovizai.com
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Security</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>All data encrypted in transit (HTTPS/TLS)</li>
              <li>Data encrypted at rest</li>
              <li>Row Level Security (RLS) on all database tables</li>
              <li>Regular security audits</li>
              <li>Secure payment processing via Stripe/PayPal</li>
              <li>No storage of complete credit card numbers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We retain your data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Account data: As long as your account is active</li>
              <li>Content you create: Until you delete it</li>
              <li>Payment records: 7 years (legal requirement)</li>
              <li>Analytics: Aggregated/anonymized indefinitely</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              When you delete your account, we remove your personal data within 30 days, except where legally required to retain.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use cookies for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Essential</strong> - Session management, authentication</li>
              <li><strong>Functional</strong> - Preferences, settings</li>
              <li><strong>Analytics</strong> - Usage patterns (anonymized)</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              You can manage cookie preferences in your browser settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. GDPR Compliance (EU Users)</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For users in the European Economic Area:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>We process data based on consent and legitimate interest</li>
              <li>You have all rights under GDPR Articles 15-22</li>
              <li>You can lodge complaints with your local data protection authority</li>
              <li>Data transfers outside EU use approved mechanisms</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. CCPA Compliance (California Users)</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For California residents:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>We do NOT sell personal information</li>
              <li>You can request disclosure of collected data</li>
              <li>You can request deletion of your data</li>
              <li>We do not discriminate based on privacy choices</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children's Privacy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our services are not directed to children under 13. We do not knowingly collect data from children. 
              If we learn we have collected data from a child under 13, we will delete it promptly.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may update this policy periodically. We will notify you of material changes via email or 
              in-app notification at least 30 days before changes take effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For privacy-related inquiries:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-300 space-y-2">
              <li>📧 Email: privacy@craudiovizai.com</li>
              <li>📧 Support: support@craudiovizai.com</li>
              <li>📍 CR AudioViz AI, LLC</li>
              <li>📍 Fort Myers, Florida, USA</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 text-sm">
            CR AudioViz AI, LLC • Fort Myers, Florida • EIN: 93-4520864
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            <Link href="/support" className="text-blue-600 hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
