// lib/safety/index.ts
// CR AudioViz AI — SafetyOS Constitutional Service
// Friday, March 13, 2026
// Constitutional Authority: Tier 3 — overrides any OS Domain
// Henderson Priority Order: #1 Protect the company, #2 Protect customers
// SERVER-SIDE ONLY. Never import from client components.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Lazy Supabase init (prevents build-time errors) ───────────────────────────
let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('[SafetyOS] Supabase credentials not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ── Content categories ────────────────────────────────────────────────────────
export type ContentCategory =
  | 'hate_speech'
  | 'harassment'
  | 'sexual_content'
  | 'violence'
  | 'spam'
  | 'misinformation'
  | 'illegal_activity'
  | 'self_harm'
  | 'child_safety'       // zero tolerance — immediate block + escalate
  | 'terrorism'          // zero tolerance — immediate block + escalate
  | 'copyright'
  | 'privacy_violation'
  | 'clean'

export type ModerationAction   = 'allow' | 'flag' | 'block' | 'escalate'
export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ContentModerationResult {
  action: ModerationAction
  severity: ModerationSeverity
  category: ContentCategory
  reason: string
  flagId?: string
  requiresHumanReview: boolean
  autoResolved: boolean
}

export interface SafetyReport {
  id?: string
  reporterId: string
  reportedUserId?: string
  reportedContentId?: string
  contentType: 'user' | 'content' | 'message' | 'profile' | 'upload'
  category: ContentCategory
  description: string
  evidence?: Record<string, unknown>
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  createdAt?: string
}

export interface DMCANotice {
  claimantName: string
  claimantEmail: string
  copyrightWork: string
  infringingUrl: string
  statement: string
  signature: string
  ipAddress?: string
}

// ── Zero-tolerance patterns (deterministic — no AI cost) ─────────────────────
const ZERO_TOLERANCE_PATTERNS: RegExp[] = [
  /(ch?ild\s*(porn|sex|nude|exploit|abuse|rape|molest))/i,
  /(loli|shota|jailbait|pedo|pedophil)/i,
  /(minor.{0,20}(sex|nude|naked|exploit))/i,
  /(isis|isil|al.qaeda|hamas|hezbollah).{0,30}(attack|bomb|kill|recruit)/i,
  /(how\s+to\s+(make|build).{0,20}(bomb|weapon|explosive))/i,
]

const HIGH_RISK_PATTERNS: RegExp[] = [
  /(kill\s+(your)?self|kys|commit\s+suicide)/i,
  /(doxx|doxing|swat(ting)?)/i,
]

function patternScreen(text: string): { category: ContentCategory; severity: ModerationSeverity } | null {
  const n = text.toLowerCase()
  for (const p of ZERO_TOLERANCE_PATTERNS) {
    if (p.test(n)) return { category: 'child_safety', severity: 'critical' }
  }
  for (const p of HIGH_RISK_PATTERNS) {
    if (p.test(n)) return { category: 'harassment', severity: 'high' }
  }
  return null
}

// ── Core moderation ───────────────────────────────────────────────────────────
export async function moderateContent(
  text: string,
  context: {
    userId: string
    contentType: 'message' | 'profile' | 'upload' | 'comment'
    appId?: string
    metadata?: Record<string, unknown>
  }
): Promise<ContentModerationResult> {
  const sb = getSupabase()
  const hit = patternScreen(text)

  if (hit) {
    const isCritical = hit.severity === 'critical'
    const flagId = await logModerationEvent(sb, {
      userId: context.userId,
      contentType: context.contentType,
      appId: context.appId,
      category: hit.category,
      severity: hit.severity,
      action: isCritical ? 'block' : 'flag',
      snippet: text.slice(0, 200),
      metadata: context.metadata,
      requiresHumanReview: true,
    })
    await recordUserBehaviorSignal(context.userId, 'content_blocked')
    return {
      action: isCritical ? 'block' : 'flag',
      severity: hit.severity,
      category: hit.category,
      reason: isCritical
        ? 'Content violates zero-tolerance policy and has been blocked.'
        : 'Content flagged for human review.',
      flagId,
      requiresHumanReview: true,
      autoResolved: false,
    }
  }

  return {
    action: 'allow',
    severity: 'low',
    category: 'clean',
    reason: 'Content passed safety screening.',
    requiresHumanReview: false,
    autoResolved: true,
  }
}

// ── Report submission ─────────────────────────────────────────────────────────
export async function submitSafetyReport(report: SafetyReport): Promise<{ id: string; status: string }> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('safety_reports')
    .insert({
      reporter_id:          report.reporterId,
      reported_user_id:     report.reportedUserId ?? null,
      reported_content_id:  report.reportedContentId ?? null,
      content_type:         report.contentType,
      category:             report.category,
      description:          report.description,
      evidence:             report.evidence ?? {},
      status:               'pending',
      created_at:           new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`[SafetyOS] Report insert failed: ${error.message}`)
  return { id: data.id as string, status: 'pending' }
}

// ── DMCA intake ───────────────────────────────────────────────────────────────
export async function submitDMCANotice(
  notice: DMCANotice,
  ipAddress: string
): Promise<{ id: string; caseNumber: string }> {
  const sb = getSupabase()
  const caseNumber = `DMCA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const { data, error } = await sb
    .from('dmca_notices')
    .insert({
      claimant_name:   notice.claimantName,
      claimant_email:  notice.claimantEmail,
      copyright_work:  notice.copyrightWork,
      infringing_url:  notice.infringingUrl,
      statement:       notice.statement,
      signature:       notice.signature,
      ip_address:      ipAddress,
      case_number:     caseNumber,
      status:          'received',
      created_at:      new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`[SafetyOS] DMCA insert failed: ${error.message}`)
  return { id: data.id as string, caseNumber }
}

// ── User behavior signal ──────────────────────────────────────────────────────
export async function recordUserBehaviorSignal(
  userId: string,
  signal: 'report_received' | 'content_blocked' | 'tos_violation' | 'spam_detected',
  metadata?: Record<string, unknown>
): Promise<void> {
  const sb = getSupabase()
  const { data: existing } = await sb
    .from('user_safety_scores')
    .select('id, signal_counts')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const counts = (existing.signal_counts as Record<string, number>) ?? {}
    counts[signal] = (counts[signal] ?? 0) + 1
    await sb
      .from('user_safety_scores')
      .update({ signal_counts: counts, last_signal_at: new Date().toISOString() })
      .eq('id', existing.id as string)
  } else {
    await sb.from('user_safety_scores').insert({
      user_id:          userId,
      signal_counts:    { [signal]: 1 },
      trust_level:      'new',
      last_signal_at:   new Date().toISOString(),
      created_at:       new Date().toISOString(),
    })
  }
}

// ── Internal: log moderation event ───────────────────────────────────────────
async function logModerationEvent(
  sb: SupabaseClient,
  event: {
    userId: string
    contentType: string
    appId?: string
    category: ContentCategory
    severity: ModerationSeverity
    action: ModerationAction
    snippet: string
    metadata?: Record<string, unknown>
    requiresHumanReview: boolean
  }
): Promise<string> {
  const { data, error } = await sb
    .from('moderation_events')
    .insert({
      user_id:               event.userId,
      content_type:          event.contentType,
      app_id:                event.appId ?? null,
      category:              event.category,
      severity:              event.severity,
      action:                event.action,
      content_snippet:       event.snippet,
      metadata:              event.metadata ?? {},
      requires_human_review: event.requiresHumanReview,
      created_at:            new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[SafetyOS] logModerationEvent failed:', error.message)
    return 'unknown'
  }
  return data.id as string
}
