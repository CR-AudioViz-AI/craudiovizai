// app/admin/grants/[id]/components/GrantApplicationSection.tsx
'use client';

import { useState } from 'react';
import { FileText, Plus, ChevronDown, ChevronUp, Edit, Send } from 'lucide-react';
import Link from 'next/link';

interface Application {
  id: string;
  version: number;
  status: string;
  updated_at: string;
}

export default function GrantApplicationSection({ grantId, applications, grant }: { grantId: string; applications: Application[]; grant: any }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Application</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/grants/${grantId}/application`}
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}>
            {applications.length > 0 ? <><Edit className="w-4 h-4" />Edit</> : <><Plus className="w-4 h-4" />Start</>}
          </Link>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {applications.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No application draft started</p>
              <Link href={`/admin/grants/${grantId}/application`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <Plus className="w-4 h-4" />
                Start Application
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Version {app.version}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'final' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{app.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(app.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
