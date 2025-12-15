// app/admin/grants/[id]/components/GrantMilestonesSection.tsx
'use client';

import { useState } from 'react';
import { Target, Plus, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_type: string;
  due_date: string;
  status: string;
}

export default function GrantMilestonesSection({ grantId, milestones }: { grantId: string; milestones: Milestone[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'missed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = milestones.filter(m => m.status === 'pending').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Milestones</h2>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{pendingCount} pending</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => e.stopPropagation()} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <Plus className="w-4 h-4" />Add
          </button>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {milestones.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No milestones set</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    milestone.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {milestone.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${milestone.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {milestone.milestone_name}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(milestone.due_date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(milestone.status)}`}>
                    {milestone.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
