/**
 * CR AudioViz AI - Ecosystem Health Dashboard
 * ===========================================
 * 
 * Real-time monitoring of all platform components.
 * 
 * @version 1.0.0
 * @date January 1, 2026
 */

'use client'

import { useState, useEffect } from 'react'

interface ComponentHealth {
  name: string
  category: 'core' | 'module' | 'integration' | 'infrastructure'
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  latency?: number
  lastCheck: string
  uptime?: number
  details?: string
}

interface EcosystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  score: number
  components: ComponentHealth[]
  timestamp: string
  summary: {
    operational: number
    degraded: number
    outage: number
    maintenance: number
    total: number
  }
}

export default function EcosystemHealthPage() {
  const [ecosystem, setEcosystem] = useState<EcosystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchHealth() {
    try {
      const res = await fetch('/api/admin/ecosystem-health')
      const data = await res.json()
      if (data.success) {
        setEcosystem(data.ecosystem)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch health')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  function getStatusColor(status: string) {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'outage': return 'bg-red-500'
      case 'maintenance': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  function getOverallColor(overall: string) {
    switch (overall) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ecosystem Health</h1>
          <p className="text-gray-500 mt-1">
            Real-time status of all platform components
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchHealth(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Overall Status */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Overall Status</div>
            <div className={`text-4xl font-bold mt-1 ${getOverallColor(ecosystem?.overall || 'healthy')}`}>
              {ecosystem?.overall?.toUpperCase() || 'CHECKING...'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Health Score</div>
            <div className={`text-4xl font-bold ${
              (ecosystem?.score ?? 0) >= 80 ? 'text-green-600' :
              (ecosystem?.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {ecosystem?.score ?? 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-3xl font-bold">{ecosystem?.summary.operational ?? 0}</div>
          <div className="text-green-700 text-sm">Operational</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-600 text-3xl font-bold">{ecosystem?.summary.degraded ?? 0}</div>
          <div className="text-yellow-700 text-sm">Degraded</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-3xl font-bold">{ecosystem?.summary.outage ?? 0}</div>
          <div className="text-red-700 text-sm">Outage</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-3xl font-bold">{ecosystem?.summary.maintenance ?? 0}</div>
          <div className="text-blue-700 text-sm">Maintenance</div>
        </div>
      </div>

      {/* Component List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Components ({ecosystem?.summary.total ?? 0})</h2>
        </div>
        <div className="divide-y">
          {ecosystem?.components.map((component, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                <div>
                  <div className="font-medium">{component.name}</div>
                  <div className="text-sm text-gray-500">{component.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {component.latency && (
                  <div className="text-right">
                    <div className="text-sm font-medium">{component.latency}ms</div>
                    <div className="text-xs text-gray-500">latency</div>
                  </div>
                )}
                {component.uptime && (
                  <div className="text-right">
                    <div className="text-sm font-medium">{component.uptime}%</div>
                    <div className="text-xs text-gray-500">uptime</div>
                  </div>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  component.status === 'operational' ? 'bg-green-100 text-green-700' :
                  component.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                  component.status === 'outage' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {component.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {ecosystem?.timestamp ? new Date(ecosystem.timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}
