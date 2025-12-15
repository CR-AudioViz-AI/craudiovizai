// app/admin/grants/[id]/components/GrantDocumentsSection.tsx
'use client';

import { useState } from 'react';
import { FileText, Plus, Upload, Download, Trash2, Eye, ChevronDown, ChevronUp, File, FileImage, FilePdf } from 'lucide-react';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  description: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  is_current: boolean;
  uploaded_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  application_draft: 'Application Draft',
  final_submission: 'Final Submission',
  award_letter: 'Award Letter',
  rejection_letter: 'Rejection Letter',
  budget: 'Budget Document',
  narrative: 'Narrative',
  letter_of_support: 'Letter of Support',
  evaluation: 'Evaluation',
  report: 'Report',
  correspondence: 'Correspondence',
  attachment: 'Attachment',
  other: 'Other',
};

const DOC_TYPE_ICONS: Record<string, any> = {
  application_draft: FileText,
  final_submission: FilePdf,
  budget: File,
  narrative: FileText,
  default: File,
};

export default function GrantDocumentsSection({ grantId, documents }: { grantId: string; documents: Document[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Documents</h2>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
            {documents.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowUpload(true); }}
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No documents uploaded</p>
              <button onClick={() => setShowUpload(true)} className="text-sm text-green-600 hover:text-green-700">
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDocs).map(([type, docs]) => (
                <div key={type}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {DOC_TYPE_LABELS[type] || type}
                  </h4>
                  <div className="space-y-2">
                    {docs.map((doc) => {
                      const Icon = DOC_TYPE_ICONS[doc.document_type] || DOC_TYPE_ICONS.default;
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <Icon className="w-8 h-8 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.document_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)}
                                {doc.version > 1 && ` • v${doc.version}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
