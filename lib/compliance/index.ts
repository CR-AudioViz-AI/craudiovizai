// lib/compliance/index.ts
// CR AudioViz AI — ComplianceOS Constitutional Service
// Friday, March 13, 2026
// Scope: GDPR, CCPA, COPPA — consent management and data subject rights
// Constitutional Authority: Tier 3 — overrides any OS Domain
// SERVER-SIDE ONLY. Never import from client components.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('[ComplianceOS] Supabase credentials not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type ConsentPurpose =
  | 'analytics'
  | 'marketing'
  | 'personalization'
  | 'third_party_sharing'
  | 'essential'           // always required — cannot be declined

export type DataSubjectRightType =
  | 'access'
  | 'deletion'
  | 'portability'
  | 'correction'
  | 'restriction'
  | 'objection'

export interface ConsentRecord {
  userId: string
  sessionId?: string
  purposes: Partial<Record<ConsentPurpose, boolean>>
  ipAddress: string
  userAgent: string
  consentVersion: string
  source: 'banner' | 'settings' | 'onboarding' | 'api'
}

export interface DataSubjectRequest {
  userId: string
  email: string
  requestType: DataSubjectRightType
  description?: string
  ipAddress: string
}

// Bump this string whenever consent language changes — forces re-consent
export const CONSENT_VERSION = '2026-03-13-v1'

// ── Record consent ────────────────────────────────────────────────────────────
export async function recordConsent(record: ConsentRecord): Promise<string> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('consent_records')
    .insert({
      user_id:          record.userId,
      session_id:       record.sessionId ?? null,
      purposes:         { ...record.purposes, essential: true },
      ip_address:       record.ipAddress,
      user_agent:       record.userAgent,
      consent_version:  record.consentVersion,
      source:           record.source,
      recorded_at:      new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`[ComplianceOS] recordConsent failed: ${error.message}`)
  return data.id as string
}

// ── Retrieve latest consent ───────────────────────────────────────────────────
export async function getLatestConsent(
  userId: string
): Promise<{ purposes: Partial<Record<ConsentPurpose, boolean>>; version: string; recordedAt: string } | null> {
  const sb = getSupabase()
  const { data } = await sb
    .from('consent_records')
    .select('purposes, consent_version, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return {
    purposes:   data.purposes as Partial<Record<ConsentPurpose, boolean>>,
    version:    data.consent_version as string,
    recordedAt: data.recorded_at as string,
  }
}

// ── Check consent for one purpose ────────────────────────────────────────────
export async function hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
  if (purpose === 'essential') return true
  const latest = await getLatestConsent(userId)
  if (!latest) return false
  if (latest.version !== CONSENT_VERSION) return false  // outdated — re-consent required
  return latest.purposes[purpose] === true
}

// ── Withdraw consent (GDPR Art. 7) ───────────────────────────────────────────
export async function withdrawConsent(userId: string, purposes: ConsentPurpose[]): Promise<void> {
  const current = await getLatestConsent(userId)
  const updated: Partial<Record<ConsentPurpose, boolean>> = { ...(current?.purposes ?? {}) }
  for (const p of purposes) {
    if (p !== 'essential') updated[p] = false
  }
  const sb = getSupabase()
  await sb.from('consent_records').insert({
    user_id:         userId,
    purposes:        updated,
    ip_address:      'withdrawal',
    user_agent:      'user-initiated',
    consent_version: CONSENT_VERSION,
    source:          'settings',
    recorded_at:     new Date().toISOString(),
  })
}

// ── Data Subject Request (GDPR Art. 15-22, CCPA) ─────────────────────────────
export async function submitDataSubjectRequest(
  request: DataSubjectRequest
): Promise<{ id: string; caseNumber: string; estimatedCompletionDays: number }> {
  const sb = getSupabase()
  const caseNumber = `DSR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  // GDPR: 30 days. CCPA: 45 days. Use 30 as conservative default.
  const deadlineDays = 30

  const { data, error } = await sb
    .from('data_subject_requests')
    .insert({
      user_id:       request.userId,
      email:         request.email,
      request_type:  request.requestType,
      description:   request.description ?? null,
      ip_address:    request.ipAddress,
      case_number:   caseNumber,
      status:        'pending_verification',
      deadline_days: deadlineDays,
      created_at:    new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`[ComplianceOS] DSR insert failed: ${error.message}`)
  return { id: data.id as string, caseNumber, estimatedCompletionDays: deadlineDays }
}

// ── COPPA age gate (must run before any account creation) ─────────────────────
export function verifyAgeCompliance(
  dateOfBirth: string | null,
  selfDeclaredAdult: boolean
): { compliant: boolean; requiresParentalConsent: boolean; ageVerified: boolean } {
  if (!dateOfBirth && !selfDeclaredAdult) {
    return { compliant: false, requiresParentalConsent: false, ageVerified: false }
  }
  if (selfDeclaredAdult && !dateOfBirth) {
    return { compliant: true, requiresParentalConsent: false, ageVerified: false }
  }
  if (dateOfBirth) {
    const ageYears = (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (ageYears < 13) return { compliant: false, requiresParentalConsent: true,  ageVerified: true }
    if (ageYears < 18) return { compliant: true,  requiresParentalConsent: true,  ageVerified: true }
    return              { compliant: true,  requiresParentalConsent: false, ageVerified: true }
  }
  return { compliant: true, requiresParentalConsent: false, ageVerified: false }
}

// ── Data retention policy ─────────────────────────────────────────────────────
export const DATA_RETENTION_DAYS: Record<string, number> = {
  session_logs:        90,
  analytics_events:    365,
  payment_records:     2555,  // 7 years — IRS requirement
  user_messages:       730,
  moderation_events:   1825,  // 5 years
  consent_records:     2555,  // 7 years — audit trail
  safety_reports:      1825,
  deleted_user_data:   30,    // 30 days then purge
}
