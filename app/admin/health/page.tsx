// ============================================================
// CR AUDIOVIZ AI - API HEALTH DASHBOARD PAGE
// /app/admin/health/page.tsx
// Created: December 17, 2025
// ============================================================

import APIHealthDashboard from '@/components/APIHealthDashboard';

export const metadata = {
  title: 'API Health Dashboard | CR AudioViz AI Admin',
  description: 'Real-time monitoring dashboard for all 30+ APIs in the CR AudioViz AI ecosystem',
};

export default function HealthDashboardPage() {
  return <APIHealthDashboard />;
}
