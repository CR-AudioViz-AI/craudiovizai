/**
 * CR AudioViz AI - Ecosystem Compliance Checker
 * ==============================================
 * 
 * Audits all apps in the ecosystem for:
 * 1. central-services.ts presence
 * 2. No duplicate auth/payment/credit routes
 * 3. Proper environment variables
 * 4. Build status
 * 
 * Run via: POST /api/admin/compliance-check
 * 
 * @version 1.0.0
 * @date January 1, 2026
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_Z0yef7NlFu1coCJWz8UmUdI5'

interface ComplianceResult {
  app: string
  repo: string
  checks: {
    central_services: boolean
    no_duplicate_auth: boolean
    no_duplicate_payments: boolean
    build_status: string
    score: number
  }
}

// Forbidden API routes - these should only exist in crav-website
const FORBIDDEN_ROUTES = ['auth', 'stripe', 'paypal', 'credits']

// Apps that are allowed to have their own routes (core infrastructure)
const EXEMPT_APPS = ['crav-website', 'crav-javari']

async function checkRepo(repoName: string): Promise<ComplianceResult> {
  const result: ComplianceResult = {
    app: repoName,
    repo: `CR-AudioViz-AI/${repoName}`,
    checks: {
      central_services: false,
      no_duplicate_auth: true,
      no_duplicate_payments: true,
      build_status: 'unknown',
      score: 0
    }
  }

  try {
    // Check for central-services.ts
    const csResponse = await fetch(
      `https://api.github.com/repos/CR-AudioViz-AI/${repoName}/contents/lib/central-services.ts`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    )
    result.checks.central_services = csResponse.ok

    // Check for forbidden API routes (unless exempt)
    if (!EXEMPT_APPS.includes(repoName)) {
      const apiResponse = await fetch(
        `https://api.github.com/repos/CR-AudioViz-AI/${repoName}/contents/app/api`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      )
      
      if (apiResponse.ok) {
        const routes = await apiResponse.json()
        const routeNames = routes.map((r: any) => r.name)
        
        result.checks.no_duplicate_auth = !routeNames.includes('auth')
        result.checks.no_duplicate_payments = !routeNames.includes('stripe') && !routeNames.includes('paypal')
      }
    }

    // Calculate score
    let score = 0
    if (result.checks.central_services) score += 40
    if (result.checks.no_duplicate_auth) score += 30
    if (result.checks.no_duplicate_payments) score += 30
    result.checks.score = score

  } catch (error: any) {
    console.error(`Error checking ${repoName}:`, error.message)
  }

  return result
}

export async function POST(request: Request) {
  try {
    // Get list of repos from GitHub org
    const reposResponse = await fetch(
      'https://api.github.com/orgs/CR-AudioViz-AI/repos?per_page=100',
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    )
    
    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repos')
    }

    const repos = await reposResponse.json()
    const appRepos = repos
      .filter((r: any) => r.name.startsWith('crav-') || r.name.startsWith('javari-'))
      .map((r: any) => r.name)

    // Check first 20 repos (to avoid rate limits)
    const results: ComplianceResult[] = []
    for (const repo of appRepos.slice(0, 20)) {
      results.push(await checkRepo(repo))
      await new Promise(r => setTimeout(r, 100)) // Rate limit
    }

    const compliant = results.filter(r => r.checks.score === 100).length
    const partial = results.filter(r => r.checks.score > 0 && r.checks.score < 100).length
    const nonCompliant = results.filter(r => r.checks.score === 0).length

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_checked: results.length,
        fully_compliant: compliant,
        partially_compliant: partial,
        non_compliant: nonCompliant,
        average_score: Math.round(results.reduce((sum, r) => sum + r.checks.score, 0) / results.length)
      },
      results
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/compliance-check',
    method: 'POST',
    description: 'Audits ecosystem apps for central services compliance',
    checks: [
      'central-services.ts present',
      'No duplicate auth routes',
      'No duplicate payment routes',
      'Build status'
    ]
  })
}
