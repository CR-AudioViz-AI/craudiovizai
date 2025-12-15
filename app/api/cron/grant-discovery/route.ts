// app/api/cron/grant-discovery/route.ts
// AUTOMATED GRANT DISCOVERY CRON JOB
// Runs every 6 hours via Vercel Cron or external scheduler
// Timestamp: Saturday, December 13, 2025 - 2:15 PM EST

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Endpoints
const APIS = {
  GRANTS_GOV: 'https://www.grants.gov/grantsws/rest/opportunities/search',
  NIH_REPORTER: 'https://api.reporter.nih.gov/v2/projects/search',
  NSF_AWARDS: 'https://api.nsf.gov/services/v1/awards.json',
  FEDERAL_REGISTER: 'https://www.federalregister.gov/api/v1/documents.json',
  FEMA: 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries',
};

// CRAIverse module keywords
const MODULE_KEYWORDS: Record<string, string[]> = {
  'first-responders': ['first responder', 'emergency services', 'law enforcement', 'fire', 'ems', 'police', 'ptsd', 'trauma', 'paramedic', 'public safety'],
  'veterans-transition': ['veteran', 'military', 'service member', 'transition', 'employment', 'voc rehab'],
  'together-anywhere': ['military family', 'deployment', 'family connection', 'family readiness'],
  'faith-communities': ['faith', 'religious', 'church', 'congregation', 'ministry', 'faith-based'],
  'senior-connect': ['senior', 'elderly', 'aging', 'older adult', 'isolation', 'loneliness'],
  'foster-care-network': ['foster', 'foster care', 'child welfare', 'adoption', 'kinship'],
  'rural-health': ['rural', 'telehealth', 'telemedicine', 'underserved', 'healthcare access'],
  'mental-health-youth': ['youth mental health', 'adolescent', 'teen', 'child mental health', 'school'],
  'addiction-recovery': ['addiction', 'recovery', 'substance abuse', 'opioid', 'treatment'],
  'animal-rescue': ['animal', 'rescue', 'shelter', 'pet', 'welfare', 'humane'],
  'green-earth': ['environment', 'climate', 'sustainability', 'conservation', 'green'],
  'disaster-relief': ['disaster', 'emergency', 'relief', 'response', 'recovery', 'fema'],
  'small-business': ['small business', 'entrepreneur', 'economic development', 'sbir'],
  'nonprofit-toolkit': ['nonprofit', 'ngo', 'charity', 'capacity building'],
  'education-access': ['education', 'student', 'learning', 'school', 'academic', 'stem'],
  'digital-literacy': ['digital literacy', 'technology', 'internet', 'digital divide', 'broadband'],
  'artists-collective': ['artist', 'art', 'creative', 'cultural', 'visual arts'],
  'musicians-guild': ['music', 'musician', 'performing arts', 'concert', 'orchestra'],
  'community-journalism': ['journalism', 'news', 'media', 'local news', 'press'],
  'food-security': ['food', 'hunger', 'nutrition', 'food bank', 'food insecurity'],
};

// Verify cron secret for security
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow if no secret configured (development) or secret matches
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

// Calculate match score
function calculateMatchScore(title: string, description: string): { score: number; modules: string[] } {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const matchingModules: string[] = [];
  let totalScore = 0;
  
  for (const [moduleId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    let moduleScore = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        moduleScore += 10;
      }
    }
    if (moduleScore >= 20) {
      matchingModules.push(moduleId);
      totalScore += moduleScore;
    }
  }
  
  return {
    score: Math.min(totalScore, 100),
    modules: matchingModules,
  };
}

// Estimate win probability
function estimateWinProbability(matchScore: number, amount: number | null): number {
  let probability = matchScore * 0.4;
  if (amount) {
    if (amount < 100000) probability += 15;
    else if (amount < 500000) probability += 10;
    else if (amount < 1000000) probability += 5;
  }
  return Math.min(Math.round(probability), 80);
}

// Search Grants.gov
async function searchGrantsGov(): Promise<any[]> {
  const allKeywords = Object.values(MODULE_KEYWORDS).flat().slice(0, 15);
  
  try {
    const params = new URLSearchParams({
      keyword: allKeywords.join(' OR '),
      oppStatuses: 'forecasted|posted',
      sortBy: 'openDate|desc',
      rows: '100',
    });

    const response = await fetch(`${APIS.GRANTS_GOV}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.oppHits || [];
  } catch (error) {
    console.error('Grants.gov error:', error);
    return [];
  }
}

// Search NIH Reporter
async function searchNIHReporter(): Promise<any[]> {
  const keywords = ['mental health', 'veteran', 'rural health', 'youth', 'addiction'];
  
  try {
    const response = await fetch(APIS.NIH_REPORTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criteria: {
          advanced_text_search: {
            operator: 'or',
            search_field: 'all',
            search_text: keywords.join(' '),
          },
          fiscal_years: [2024, 2025],
        },
        limit: 50,
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('NIH error:', error);
    return [];
  }
}

// Search Federal Register
async function searchFederalRegister(): Promise<any[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    const params = new URLSearchParams({
      'conditions[term]': 'grant funding opportunity',
      'conditions[type][]': 'NOTICE',
      'conditions[publication_date][gte]': thirtyDaysAgo,
      'per_page': '50',
      'order': 'newest',
    });

    const response = await fetch(`${APIS.FEDERAL_REGISTER}?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Federal Register error:', error);
    return [];
  }
}

// Get FEMA disasters
async function getFEMADisasters(): Promise<any[]> {
  try {
    const response = await fetch(`${APIS.FEMA}?$top=30&$orderby=declarationDate desc`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.DisasterDeclarationsSummaries || [];
  } catch (error) {
    console.error('FEMA error:', error);
    return [];
  }
}

// Main discovery function
async function runDiscovery() {
  const results = {
    discovered: 0,
    imported: 0,
    highPriority: 0,
    errors: [] as string[],
    sources: [] as { name: string; count: number }[],
  };

  // Run all searches
  const [grantsGov, nih, fedReg, fema] = await Promise.all([
    searchGrantsGov(),
    searchNIHReporter(),
    searchFederalRegister(),
    getFEMADisasters(),
  ]);

  results.sources = [
    { name: 'Grants.gov', count: grantsGov.length },
    { name: 'NIH RePORTER', count: nih.length },
    { name: 'Federal Register', count: fedReg.length },
    { name: 'FEMA', count: fema.length },
  ];

  // Process Grants.gov results
  for (const opp of grantsGov) {
    const { score, modules } = calculateMatchScore(opp.title, opp.synopsis);
    if (score < 30) continue;

    results.discovered++;

    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('grant_opportunities')
        .select('id')
        .eq('opportunity_number', opp.id)
        .maybeSingle();

      if (existing) continue;

      const priority = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
      if (priority === 'critical' || priority === 'high') results.highPriority++;

      const { error } = await supabase.from('grant_opportunities').insert({
        grant_name: opp.title,
        opportunity_number: opp.id,
        agency_name: opp.agency?.name || opp.agencyCode,
        description: (opp.synopsis || '').substring(0, 5000),
        amount_available: opp.awardCeiling,
        application_opens: opp.openDate,
        application_deadline: opp.closeDate,
        status: 'researching',
        priority,
        target_modules: modules,
        match_score: score,
        win_probability: estimateWinProbability(score, opp.awardCeiling),
        website_url: `https://www.grants.gov/search-results-detail/${opp.id}`,
        discovery_source: 'grants_gov',
      });

      if (!error) results.imported++;
    } catch (e) {
      results.errors.push(`Grants.gov ${opp.id}: ${e}`);
    }
  }

  // Process NIH results
  for (const project of nih) {
    const { score, modules } = calculateMatchScore(project.project_title, project.abstract_text);
    if (score < 30) continue;

    results.discovered++;

    try {
      const externalId = project.project_num || String(project.appl_id);
      
      const { data: existing } = await supabase
        .from('grant_opportunities')
        .select('id')
        .eq('opportunity_number', externalId)
        .maybeSingle();

      if (existing) continue;

      const priority = score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium';
      if (priority === 'critical' || priority === 'high') results.highPriority++;

      const { error } = await supabase.from('grant_opportunities').insert({
        grant_name: project.project_title,
        opportunity_number: externalId,
        agency_name: 'National Institutes of Health',
        description: (project.abstract_text || '').substring(0, 5000),
        amount_available: project.award_amount,
        status: 'researching',
        priority,
        target_modules: modules,
        match_score: score,
        win_probability: estimateWinProbability(score, project.award_amount),
        website_url: `https://reporter.nih.gov/project-details/${externalId}`,
        discovery_source: 'nih_reporter',
      });

      if (!error) results.imported++;
    } catch (e) {
      results.errors.push(`NIH ${project.project_num}: ${e}`);
    }
  }

  // Process FEMA disasters (always relevant for disaster-relief module)
  for (const disaster of fema) {
    results.discovered++;

    try {
      const externalId = `DR-${disaster.disasterNumber}`;
      
      const { data: existing } = await supabase
        .from('grant_opportunities')
        .select('id')
        .eq('opportunity_number', externalId)
        .maybeSingle();

      if (existing) continue;

      const programs: string[] = [];
      if (disaster.ihProgramDeclared) programs.push('Individual Assistance');
      if (disaster.paProgramDeclared) programs.push('Public Assistance');
      if (disaster.hmProgramDeclared) programs.push('Hazard Mitigation');

      results.highPriority++;

      const { error } = await supabase.from('grant_opportunities').insert({
        grant_name: `FEMA ${disaster.declarationType}: ${disaster.title}`,
        opportunity_number: externalId,
        agency_name: 'Federal Emergency Management Agency',
        description: `${disaster.incidentType} in ${disaster.state}. Programs: ${programs.join(', ')}`,
        application_opens: disaster.declarationDate,
        status: 'researching',
        priority: 'high',
        target_modules: ['disaster-relief'],
        match_score: 85,
        win_probability: 70,
        website_url: `https://www.fema.gov/disaster/${disaster.disasterNumber}`,
        discovery_source: 'fema',
      });

      if (!error) results.imported++;
    } catch (e) {
      results.errors.push(`FEMA ${disaster.disasterNumber}: ${e}`);
    }
  }

  return results;
}

// Check deadlines and create alerts
async function checkDeadlines() {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: urgent } = await supabase
    .from('grant_opportunities')
    .select('id, grant_name, application_deadline, priority')
    .gte('application_deadline', now.toISOString())
    .lte('application_deadline', sevenDays.toISOString())
    .in('status', ['researching', 'preparing', 'writing'])
    .order('application_deadline');

  return urgent || [];
}

// GET: Run discovery (for testing or manual trigger)
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    const results = await runDiscovery();
    const urgentDeadlines = await checkDeadlines();
    
    // Log the run
    await supabase.from('system_logs').insert({
      log_type: 'grant_discovery',
      message: `Discovery complete: ${results.discovered} found, ${results.imported} imported, ${results.highPriority} high priority`,
      metadata: {
        ...results,
        urgent_deadlines: urgentDeadlines.length,
        duration_ms: Date.now() - startTime,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      ...results,
      urgent_deadlines: urgentDeadlines,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ 
      error: 'Discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST: Same as GET (for Vercel Cron)
export async function POST(request: Request) {
  return GET(request);
}

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max
