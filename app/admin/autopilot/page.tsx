/**
 * CR AudioViz AI - Autopilot Control Center
 * ==========================================
 * 
 * The central nervous system for autonomous operations.
 * Implements the Autopilot Loop:
 * Observe → Test → Score → Recommend → Fix → Verify → Report
 * 
 * @version 2.0.0
 * @date January 1, 2026
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface SystemHealth {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  lastCheck: string
  score: number
  details?: string
  fixable?: boolean
  tier?: 0 | 1 | 2
}

interface AutopilotAction {
  id: string
  type: 'observe' | 'test' | 'fix' | 'verify' | 'report'
  target: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_approval'
  tier: 0 | 1 | 2
  description: string
  timestamp: string
  result?: string
}

interface AutopilotState {
  enabled: boolean
  tier: 0 | 1 | 2
  lastRun: string | null
  systemHealth: SystemHealth[]
  pendingActions: AutopilotAction[]
  completedActions: AutopilotAction[]
  overallScore: number
}

export default function AutopilotControlCenter() {
  const [autopilot, setAutopilot] = useState<AutopilotState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAutopilotStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/autopilot?action=status')
      const data = await res.json()
      if (data.success) {
        setAutopilot(data.autopilot)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch status')
      }
    } catch (err: any) {
      setError(err.message || 'Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAutopilotStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAutopilotStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchAutopilotStatus])

  async function toggleAutopilot() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: autopilot?.enabled ? 'disable' : 'enable',
          tier: autopilot?.tier ?? 0
        })
      })
      const data = await res.json()
      if (data.success) {
        setAutopilot(data.autopilot)
      }
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function runAutopilotLoop() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' })
      })
      const data = await res.json()
      if (data.success) {
        setAutopilot(data.autopilot)
      }
    } catch (err) {
      console.error('Run error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function setTier(tier: 0 | 1 | 2) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setTier', tier })
      })
      const data = await res.json()
      if (data.success) {
        setAutopilot(data.autopilot)
      }
    } catch (err) {
      console.error('Tier error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'healthy': return 'bg-cyan-500'
      case 'warning': return 'bg-cyan-400'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-cyan-500'
    if (score >= 50) return 'text-cyan-400'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Autopilot</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          onClick={fetchAutopilotStatus}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autopilot Control Center</h1>
          <p className="text-gray-600 mt-1">
            Autonomous platform monitoring and self-healing operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            autopilot?.enabled ? 'bg-cyan-500 text-cyan-500' : 'bg-gray-100 text-gray-800'
          }`}>
            {autopilot?.enabled ? '● ACTIVE' : '○ STANDBY'}
          </span>
          <button
            onClick={toggleAutopilot}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              autopilot?.enabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-cyan-500 text-white hover:bg-cyan-500'
            } disabled:opacity-50`}
          >
            {actionLoading ? '...' : autopilot?.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Overall Health Score</h2>
            <p className="text-sm text-gray-500">
              Last updated: {autopilot?.lastRun ? new Date(autopilot.lastRun).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className={`text-5xl font-bold ${getScoreColor(autopilot?.overallScore ?? 0)}`}>
            {autopilot?.overallScore ?? 0}%
          </div>
        </div>
        <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              (autopilot?.overallScore ?? 0) >= 80 ? 'bg-cyan-500' :
              (autopilot?.overallScore ?? 0) >= 50 ? 'bg-cyan-400' : 'bg-red-500'
            }`}
            style={{ width: `${autopilot?.overallScore ?? 0}%` }}
          />
        </div>
      </div>

      {/* Tier Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Autonomous Operation Tier</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { tier: 0, name: 'Observe Only', desc: 'Monitor and report, no changes' },
            { tier: 1, name: 'Safe Auto-Fix', desc: 'Restart services, clear caches' },
            { tier: 2, name: 'Full Autonomous', desc: 'Code changes, deployments (approval required)' }
          ].map(({ tier, name, desc }) => (
            <button
              key={tier}
              onClick={() => setTier(tier as 0 | 1 | 2)}
              disabled={actionLoading}
              className={`p-4 rounded-lg border-2 text-left transition ${
                autopilot?.tier === tier 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Tier {tier}: {name}</div>
              <div className="text-sm text-gray-500 mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">System Health</h2>
          <button
            onClick={runAutopilotLoop}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? 'Running...' : 'Run Health Check'}
          </button>
        </div>
        <div className="space-y-3">
          {autopilot?.systemHealth.map((system, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`} />
                <div>
                  <div className="font-medium text-gray-900">{system.name}</div>
                  <div className="text-sm text-gray-500">{system.details}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${getScoreColor(system.score)}`}>
                  {system.score}%
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(system.lastCheck).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Actions */}
      {autopilot?.pendingActions && autopilot.pendingActions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Pending Actions</h2>
          <div className="space-y-3">
            {autopilot.pendingActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 bg-cyan-400 rounded-lg border border-cyan-400">
                <div>
                  <div className="font-medium text-gray-900">{action.target}</div>
                  <div className="text-sm text-gray-600">{action.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-cyan-400 text-cyan-400 rounded text-xs font-medium">
                    Tier {action.tier}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                    {action.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loop Diagram */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-500 rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Autopilot Loop</h2>
        <div className="flex items-center justify-between text-center">
          {['Observe', 'Test', 'Score', 'Recommend', 'Fix', 'Verify', 'Report'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center font-bold text-blue-600">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">{step}</span>
              </div>
              {i < 6 && <div className="w-8 h-0.5 bg-blue-300 mx-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
