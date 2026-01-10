// /app/dmca/page.tsx
// CR AudioViz AI - DMCA Policy Page (Stub)
// Created: 2026-01-14

import Link from "next/link";
import { FileText, Home, Shield, MessageSquare } from "lucide-react";

export const metadata = {
  title: "DMCA - CR AudioViz AI",
  description: "DMCA policy and copyright takedown process for CR AudioViz AI.",
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            DMCA Policy
          </h1>
          <p className="text-lg text-gray-400">
            Copyright infringement reporting and takedown process.
          </p>
        </div>

        {/* DMCA Notice */}
        <div className="bg-gray-800/50 border border-red-500/30 rounded-2xl p-8 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              Copyright & Takedown Requests
            </h2>
          </div>

          <p className="text-gray-300 mb-4">
            CR AudioViz AI respects the intellectual property rights of others.
            If you believe content on our platform infringes your copyright,
            you may submit a takedown notice.
          </p>

          <p className="text-gray-300 mb-6">
            This page provides a basic reporting process. If you require immediate help,
            please contact support.
          </p>

          {/* Minimal Claim-Safe Process */}
          <div className="space-y-4 text-gray-300">
            <div className="flex gap-3">
              <FileText className="w-6 h-6 text-red-400 mt-1" />
              <div>
                <h3 className="text-white font-semibold">1) Submit a Notice</h3>
                <p className="text-sm text-gray-400">
                  Provide your contact information, a description of the copyrighted work,
                  the URL(s) of the allegedly infringing content, and a statement of good-faith belief.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FileText className="w-6 h-6 text-red-400 mt-1" />
              <div>
                <h3 className="text-white font-semibold">2) Review & Action</h3>
                <p className="text-sm text-gray-400">
                  We review requests and may remove or restrict access to content where appropriate.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FileText className="w-6 h-6 text-red-400 mt-1" />
              <div>
                <h3 className="text-white font-semibold">3) Counter-Notice</h3>
                <p className="text-sm text-gray-400">
                  If content is removed, the uploader may have the option to submit a counter-notice.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <Link
              href="/support"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all border border-gray-600"
            >
              View Privacy Policy
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Note: This is a general informational page and does not constitute legal advice.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/"
            className="group bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all"
          >
            <Home className="w-8 h-8 text-red-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Home</h3>
            <p className="text-gray-400 text-sm">Return to homepage</p>
          </Link>

          <Link
            href="/terms"
            className="group bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all"
          >
            <FileText className="w-8 h-8 text-red-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Terms</h3>
            <p className="text-gray-400 text-sm">Terms of service</p>
          </Link>

          <Link
            href="/accessibility"
            className="group bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all"
          >
            <Shield className="w-8 h-8 text-red-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Accessibility</h3>
            <p className="text-gray-400 text-sm">Accessibility statement</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
