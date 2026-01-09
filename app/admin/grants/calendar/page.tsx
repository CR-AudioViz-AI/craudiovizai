// app/admin/grants/calendar/page.tsx
// Grant Calendar - Color-coded deadlines, milestones, follow-ups
// Timestamp: Saturday, December 13, 2025 - 12:30 PM EST

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, ChevronLeft, ChevronRight, 
  AlertTriangle, Target, FileText, CheckCircle,
  Clock, Bell, Filter, Plus
} from 'lucide-react';
import GrantCalendarView from './GrantCalendarView';

async function getCalendarEvents(supabase: any) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  // Get grant deadlines
  const { data: grants } = await supabase
    .from('grant_opportunities')
    .select('id, grant_name, agency_name, application_deadline, decision_expected, status, priority')
    .not('status', 'in', '("approved","rejected","withdrawn","archived")')
    .gte('application_deadline', startOfMonth.toISOString())
    .lte('application_deadline', endOfMonth.toISOString())
    .order('application_deadline', { ascending: true });

  // Get milestones
  const { data: milestones } = await supabase
    .from('grant_milestones')
    .select('*, grant_opportunities(id, grant_name)')
    .eq('status', 'pending')
    .gte('due_date', startOfMonth.toISOString())
    .lte('due_date', endOfMonth.toISOString())
    .order('due_date', { ascending: true });

  // Get reports due
  const { data: reports } = await supabase
    .from('grant_reports')
    .select('*, grant_opportunities(id, grant_name)')
    .eq('status', 'pending')
    .gte('due_date', startOfMonth.toISOString())
    .lte('due_date', endOfMonth.toISOString())
    .order('due_date', { ascending: true });

  // Get follow-ups
  const { data: followups } = await supabase
    .from('grant_communications')
    .select('*, grant_opportunities(id, grant_name)')
    .eq('followup_required', true)
    .eq('followup_completed', false)
    .gte('followup_date', startOfMonth.toISOString())
    .lte('followup_date', endOfMonth.toISOString())
    .order('followup_date', { ascending: true });

  // Combine into events
  const events: any[] = [];

  // Add deadline events
  grants?.forEach((grant: any) => {
    if (grant.application_deadline) {
      events.push({
        id: `deadline-${grant.id}`,
        type: 'deadline',
        title: grant.grant_name,
        subtitle: grant.agency_name,
        date: grant.application_deadline,
        grantId: grant.id,
        priority: grant.priority,
        color: 'red',
      });
    }
    if (grant.decision_expected) {
      events.push({
        id: `decision-${grant.id}`,
        type: 'decision',
        title: `Decision: ${grant.grant_name}`,
        subtitle: grant.agency_name,
        date: grant.decision_expected,
        grantId: grant.id,
        color: 'purple',
      });
    }
  });

  // Add milestone events
  milestones?.forEach((milestone: any) => {
    events.push({
      id: `milestone-${milestone.id}`,
      type: 'milestone',
      title: milestone.milestone_name,
      subtitle: milestone.grant_opportunities?.grant_name,
      date: milestone.due_date,
      grantId: milestone.grant_id,
      color: 'blue',
    });
  });

  // Add report events
  reports?.forEach((report: any) => {
    events.push({
      id: `report-${report.id}`,
      type: 'report',
      title: report.report_name,
      subtitle: report.grant_opportunities?.grant_name,
      date: report.due_date,
      grantId: report.grant_id,
      color: 'orange',
    });
  });

  // Add follow-up events
  followups?.forEach((followup: any) => {
    events.push({
      id: `followup-${followup.id}`,
      type: 'followup',
      title: 'Follow-up Required',
      subtitle: followup.grant_opportunities?.grant_name,
      date: followup.followup_date,
      grantId: followup.grant_id,
      color: 'yellow',
    });
  });

  return events;
}

async function getUpcomingDeadlines(supabase: any) {
  const { data } = await supabase
    .from('grant_opportunities')
    .select('id, grant_name, agency_name, application_deadline, priority')
    .not('status', 'in', '("approved","rejected","withdrawn","archived")')
    .not('application_deadline', 'is', null)
    .gte('application_deadline', new Date().toISOString())
    .order('application_deadline', { ascending: true })
    .limit(10);

  return data || [];
}

export default async function GrantCalendarPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.is_admin) redirect('/dashboard');

  const events = await getCalendarEvents(supabase);
  const upcomingDeadlines = await getUpcomingDeadlines(supabase);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/grants" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Grant Calendar</h1>
                <p className="text-xs text-gray-500">Deadlines, milestones, and follow-ups</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Bell className="w-4 h-4" />
                Set Alerts
              </button>
              <Link
                href="/admin/grants/new"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-cyan-500 rounded-lg hover:bg-cyan-500"
              >
                <Plus className="w-4 h-4" />
                Add Grant
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Legend */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Legend:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-600">Deadlines</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm text-gray-600">Milestones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span className="text-sm text-gray-600">Reports Due</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              <span className="text-sm text-gray-600">Follow-ups</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span className="text-sm text-gray-600">Decision Expected</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <GrantCalendarView events={events} />
          </div>

          {/* Sidebar - Upcoming */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="font-semibold text-red-900">Upcoming Deadlines</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {upcomingDeadlines.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No upcoming deadlines
                  </div>
                ) : (
                  upcomingDeadlines.map((grant: any) => {
                    const deadline = new Date(grant.application_deadline);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Link
                        key={grant.id}
                        href={`/admin/grants/${grant.id}`}
                        className="block p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {grant.grant_name}
                            </p>
                            <p className="text-xs text-gray-500">{grant.agency_name}</p>
                          </div>
                          <div className={`text-right ${
                            daysUntil <= 7 ? 'text-red-600' : 
                            daysUntil <= 14 ? 'text-cyan-500' : 
                            'text-gray-600'
                          }`}>
                            <p className="text-sm font-bold">{daysUntil}d</p>
                            <p className="text-xs">
                              {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deadlines</span>
                  <span className="font-semibold text-red-600">
                    {events.filter(e => e.type === 'deadline').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Milestones</span>
                  <span className="font-semibold text-blue-600">
                    {events.filter(e => e.type === 'milestone').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reports Due</span>
                  <span className="font-semibold text-cyan-500">
                    {events.filter(e => e.type === 'report').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Follow-ups</span>
                  <span className="font-semibold text-cyan-400">
                    {events.filter(e => e.type === 'followup').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Export Calendar</h3>
              <div className="space-y-2">
                <button className="w-full py-2 px-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Export to .ics (iCal)
                </button>
                <button className="w-full py-2 px-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Sync with Google Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
