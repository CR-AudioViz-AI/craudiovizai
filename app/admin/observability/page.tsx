/**
 * CR AudioViz AI - Observability Dashboard
 * =========================================
 * 
 * Real-time platform health monitoring:
 * - API health (latency, error rate)
 * - Cron health (last run, duration, failures)
 * - Email health (queued, sent, bounced)
 * - Payments health (conversion, webhooks, failures)
 * - Database health (connections, slow queries)
 * 
 * @version 1.0.0
 * @date January 2, 2026 - 2:06 AM EST
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Mail, 
  CreditCard,
  Zap,
  RefreshCw,
  XCircle,
  TrendingUp,
  Server
} from 'lucide-react'

interface HealthMetric {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  value: string | number
  detail?: string
  lastUpdated?: string
}

interface DashboardData {
  api: {
    latency_p50: number
    latency_p99: number
    error_rate: number
    requests_per_minute: number
  }
  cron: {
    jobs: Array<{
      name: string
      last_run: string
      duration_ms: number
      status: string
      failures_24h: number
    }>
  }
  email: {
    queued: number
    sent_24h: number
    bounced_24h: number
    suppressed: number
  }
  payments: {
    checkouts_24h: number
    conversions_24h: number
    conversion_rate: number
    failed_payments_24h: number
    webhook_success_rate: number
  }
  database: {
    connections_used: number
    connections_max: number
    slow_queries_24h: number
    write_throughput: number
  }
  alerts: Array<{
    id: string
    severity: 'warning' | 'critical'
    message: string
    timestamp: string
  }>
}

export default function ObservabilityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [incidentMode, setIncidentMode] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/observability')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // 30 second refresh
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const toggleIncidentMode = async () => {
    if (!incidentMode) {
      if (!confirm('Enable Incident Mode? This will pause non-critical operations.')) return
    }
    
    try {
      await fetch('/api/admin/incident-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !incidentMode })
      })
      setIncidentMode(!incidentMode)
    } catch (err) {
      console.error('Failed to toggle incident mode:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Platform Observability</h1>
          <p className="text-gray-400">Real-time health monitoring</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </button>
          <button
            onClick={toggleIncidentMode}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              incidentMode ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {incidentMode ? 'INCIDENT MODE ACTIVE' : 'Incident Mode'}
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                alert.severity === 'critical' ? 'bg-red-900/50 border border-red-500' : 'bg-yellow-900/50 border border-yellow-500'
              }`}
            >
              {alert.severity === 'critical' ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span>{alert.message}</span>
              <span className="ml-auto text-sm text-gray-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* API Health */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">API Health</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Latency (p50)</span>
              <span className={data?.api.latency_p50 && data.api.latency_p50 > 500 ? 'text-yellow-500' : 'text-green-500'}>
                {data?.api.latency_p50 || 0}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Latency (p99)</span>
              <span className={data?.api.latency_p99 && data.api.latency_p99 > 2000 ? 'text-red-500' : 'text-green-500'}>
                {data?.api.latency_p99 || 0}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Error Rate</span>
              <span className={data?.api.error_rate && data.api.error_rate > 2 ? 'text-red-500' : 'text-green-500'}>
                {data?.api.error_rate?.toFixed(2) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Requests/min</span>
              <span className="text-blue-400">{data?.api.requests_per_minute || 0}</span>
            </div>
          </div>
        </div>

        {/* Cron Jobs */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Cron Jobs</h2>
          </div>
          <div className="space-y-3">
            {data?.cron.jobs.map(job => (
              <div key={job.name} className="flex justify-between items-center">
                <div>
                  <span className="text-sm">{job.name}</span>
                  <p className="text-xs text-gray-500">{job.duration_ms}ms</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.failures_24h > 0 && (
                    <span className="text-xs text-red-400">{job.failures_24h} fails</span>
                  )}
                  {getStatusIcon(job.status === 'success' ? 'healthy' : 'warning')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email System */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold">Email System</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Queued</span>
              <span className={data?.email.queued && data.email.queued > 100 ? 'text-yellow-500' : 'text-green-500'}>
                {data?.email.queued || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sent (24h)</span>
              <span className="text-blue-400">{data?.email.sent_24h || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bounced (24h)</span>
              <span className={data?.email.bounced_24h && data.email.bounced_24h > 10 ? 'text-red-500' : 'text-green-500'}>
                {data?.email.bounced_24h || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Suppressed</span>
              <span className="text-gray-400">{data?.email.suppressed || 0}</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Payments</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Checkouts (24h)</span>
              <span className="text-blue-400">{data?.payments.checkouts_24h || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Conversions (24h)</span>
              <span className="text-green-500">{data?.payments.conversions_24h || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Conversion Rate</span>
              <span className={data?.payments.conversion_rate && data.payments.conversion_rate < 2 ? 'text-yellow-500' : 'text-green-500'}>
                {data?.payments.conversion_rate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed Payments</span>
              <span className={data?.payments.failed_payments_24h && data.payments.failed_payments_24h > 5 ? 'text-red-500' : 'text-green-500'}>
                {data?.payments.failed_payments_24h || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold">Database</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Connections</span>
              <span className={
                data?.database.connections_used && data?.database.connections_max && 
                (data.database.connections_used / data.database.connections_max) > 0.8 
                  ? 'text-red-500' : 'text-green-500'
              }>
                {data?.database.connections_used || 0}/{data?.database.connections_max || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Slow Queries (24h)</span>
              <span className={data?.database.slow_queries_24h && data.database.slow_queries_24h > 10 ? 'text-yellow-500' : 'text-green-500'}>
                {data?.database.slow_queries_24h || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Write Throughput</span>
              <span className="text-blue-400">{data?.database.write_throughput || 0}/s</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => fetch('/api/cron/warmup')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              Force Warmup
            </button>
            <button 
              onClick={() => fetch('/api/admin/clear-rate-limits', { method: 'POST' })}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
            >
              Clear Rate Limits
            </button>
            <button 
              onClick={() => window.open('/admin/logs', '_blank')}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
            >
              View Full Logs
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        Last updated: {new Date().toLocaleString()} EST
        <br />
        CR AudioViz AI Platform Observability v1.0
      </div>
    </div>
  )
}
