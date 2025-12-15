// lib/automation/grant-discovery-automation.ts
// 24/7 AUTOMATED GRANT DISCOVERY & INTELLIGENCE SYSTEM
// Runs continuously to find, analyze, and prepare grant opportunities
// Timestamp: Saturday, December 13, 2025 - 2:00 PM EST

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All API endpoints
const APIS = {
  GRANTS_GOV: 'https://www.grants.gov/grantsws/rest/opportunities/search',
  USA_SPENDING: 'https://api.usaspending.gov/api/v2/search/spending_by_award/',
  NIH_REPORTER: 'https://api.reporter.nih.gov/v2/projects/search',
  NSF_AWARDS: 'https://api.nsf.gov/services/v1/awards.json',
  FEDERAL_REGISTER: 'https://www.federalregister.gov/api/v1/documents.json',
  FEMA: 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries',
  PROPUBLICA: 'https://projects.propublica.org/nonprofits/api/v2/search.json',
  CENSUS: 'https://api.census.gov/data',
  BLS: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
  FRED: 'https://api.stlouisfed.org/fred/series/observations',
};

// CRAIverse module keywords for discovery
const MODULE_KEYWORDS: Record<string, string[]> = {
  'first-responders': ['first responder', 'emergency services', 'law enforcement', 'fire department', 'ems', 'police', 'ptsd', 'trauma', 'paramedic', 'firefighter', 'public safety', '911'],
  'veterans-transition': ['veteran', 'military', 'service member', 'transition', 'employment', 'reintegration', 'voc rehab', 'gi bill', 'wounded warrior'],
  'together-anywhere': ['military family', 'deployment', 'family connection', 'virtual connection', 'family readiness', 'military child'],
  'faith-communities': ['faith', 'religious', 'church', 'congregation', 'ministry', 'faith-based', 'interfaith'],
  'senior-connect': ['senior', 'elderly', 'aging', 'older adult', 'isolation', 'loneliness', 'geriatric', 'dementia'],
  'foster-care-network': ['foster', 'foster care', 'child welfare', 'adoption', 'kinship', 'aging out', 'permanency'],
  'rural-health': ['rural', 'telehealth', 'telemedicine', 'underserved', 'healthcare access', 'critical access', 'fqhc'],
  'mental-health-youth': ['youth mental health', 'adolescent', 'teen', 'child mental health', 'school', 'student', 'youth suicide'],
  'addiction-recovery': ['addiction', 'recovery', 'substance abuse', 'opioid', 'treatment', 'sobriety', 'overdose', 'mat'],
  'animal-rescue': ['animal', 'rescue', 'shelter', 'pet', 'welfare', 'humane', 'spay', 'neuter', 'animal cruelty'],
  'green-earth': ['environment', 'climate', 'sustainability', 'conservation', 'green', 'renewable', 'clean energy'],
  'disaster-relief': ['disaster', 'emergency', 'relief', 'response', 'recovery', 'resilience', 'fema', 'mitigation'],
  'small-business': ['small business', 'entrepreneur', 'economic development', 'sbir', 'sttr', 'minority business', 'startup'],
  'nonprofit-toolkit': ['nonprofit', 'ngo', 'charity', 'capacity building', '501c3', 'philanthropy'],
  'education-access': ['education', 'student', 'learning', 'school', 'academic', 'stem', 'title i', 'pell'],
  'digital-literacy': ['digital literacy', 'technology', 'internet', 'digital divide', 'broadband', 'digital skills'],
  'artists-collective': ['artist', 'art', 'creative', 'cultural', 'visual arts', 'nea', 'arts education'],
  'musicians-guild': ['music', 'musician', 'performing arts', 'concert', 'orchestra', 'music education'],
  'community-journalism': ['journalism', 'news', 'media', 'local news', 'press', 'community media'],
  'food-security': ['food', 'hunger', 'nutrition', 'food bank', 'food insecurity', 'snap', 'food pantry'],
};

// ============================================================
// DISCOVERY FUNCTIONS
// ============================================================

interface DiscoveredGrant {
  source: string;
  external_id: string;
  title: string;
  agency: string;
  description: string;
  amount_available: number | null;
  amount_floor: number | null;
  open_date: string | null;
  close_date: string | null;
  url: string;
  category: string | null;
  eligibility: string[];
  target_modules: string[];
  match_score: number;
  win_probability: number;
  raw_data: any;
}

// Search Grants.gov
async function searchGrantsGov(keywords: string[]): Promise<DiscoveredGrant[]> {
  const results: DiscoveredGrant[] = [];
  
  try {
    const searchParams = new URLSearchParams({
      keyword: keywords.slice(0, 10).join(' OR '),
      oppStatuses: 'forecasted|posted',
      sortBy: 'openDate|desc',
      rows: '100',
    });

    const response = await fetch(`${APIS.GRANTS_GOV}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Grants.gov error:', response.status);
      return results;
    }

    const data = await response.json();
    
    for (const opp of data.oppHits || []) {
      const targetModules = detectMatchingModules(opp.title, opp.synopsis);
      const matchScore = calculateMatchScore(opp.title, opp.synopsis, targetModules);
      
      results.push({
        source: 'grants_gov',
        external_id: opp.id,
        title: opp.title,
        agency: opp.agency?.name || opp.agencyCode || 'Federal Government',
        description: opp.synopsis || '',
        amount_available: opp.awardCeiling,
        amount_floor: opp.awardFloor,
        open_date: opp.openDate,
        close_date: opp.closeDate,
        url: `https://www.grants.gov/search-results-detail/${opp.id}`,
        category: opp.category?.name,
        eligibility: opp.eligibilities?.map((e: any) => e.name) || [],
        target_modules: targetModules,
        match_score: matchScore,
        win_probability: estimateWinProbability(matchScore, opp.awardCeiling),
        raw_data: opp,
      });
    }
  } catch (error) {
    console.error('Error searching Grants.gov:', error);
  }
  
  return results;
}

// Search NIH Reporter
async function searchNIHReporter(keywords: string[]): Promise<DiscoveredGrant[]> {
  const results: DiscoveredGrant[] = [];
  
  try {
    const response = await fetch(APIS.NIH_REPORTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criteria: {
          advanced_text_search: {
            operator: 'or',
            search_field: 'all',
            search_text: keywords.slice(0, 5).join(' '),
          },
          fiscal_years: [2024, 2025],
        },
        offset: 0,
        limit: 50,
        sort_field: 'award_amount',
        sort_order: 'desc',
      }),
    });

    if (!response.ok) return results;

    const data = await response.json();
    
    for (const project of data.results || []) {
      const targetModules = detectMatchingModules(project.project_title, project.abstract_text);
      const matchScore = calculateMatchScore(project.project_title, project.abstract_text, targetModules);
      
      results.push({
        source: 'nih_reporter',
        external_id: project.project_num || project.appl_id,
        title: project.project_title,
        agency: 'National Institutes of Health',
        description: project.abstract_text || '',
        amount_available: project.award_amount,
        amount_floor: null,
        open_date: project.project_start_date,
        close_date: project.project_end_date,
        url: `https://reporter.nih.gov/search/results?query=${encodeURIComponent(project.project_title || '')}`,
        category: project.activity_code,
        eligibility: [],
        target_modules: targetModules,
        match_score: matchScore,
        win_probability: estimateWinProbability(matchScore, project.award_amount),
        raw_data: project,
      });
    }
  } catch (error) {
    console.error('Error searching NIH Reporter:', error);
  }
  
  return results;
}

// Search NSF Awards
async function searchNSFAwards(keywords: string[]): Promise<DiscoveredGrant[]> {
  const results: DiscoveredGrant[] = [];
  
  try {
    const searchParams = new URLSearchParams({
      keyword: keywords.slice(0, 3).join(' '),
      printFields: 'id,title,abstractText,agency,awardeeName,fundsObligatedAmt,date,startDate,expDate,primaryProgram',
    });

    const response = await fetch(`${APIS.NSF_AWARDS}?${searchParams}`);
    if (!response.ok) return results;

    const data = await response.json();
    
    for (const award of (data.response?.award || []).slice(0, 50)) {
      const targetModules = detectMatchingModules(award.title, award.abstractText);
      const matchScore = calculateMatchScore(award.title, award.abstractText, targetModules);
      
      results.push({
        source: 'nsf_awards',
        external_id: award.id,
        title: award.title,
        agency: 'National Science Foundation',
        description: award.abstractText || '',
        amount_available: parseInt(award.fundsObligatedAmt) || 0,
        amount_floor: null,
        open_date: award.startDate,
        close_date: award.expDate,
        url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${award.id}`,
        category: award.primaryProgram,
        eligibility: [],
        target_modules: targetModules,
        match_score: matchScore,
        win_probability: estimateWinProbability(matchScore, parseInt(award.fundsObligatedAmt)),
        raw_data: award,
      });
    }
  } catch (error) {
    console.error('Error searching NSF:', error);
  }
  
  return results;
}

// Search Federal Register for new NOFOs
async function searchFederalRegister(keywords: string[]): Promise<DiscoveredGrant[]> {
  const results: DiscoveredGrant[] = [];
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const searchParams = new URLSearchParams({
      'conditions[term]': `${keywords.slice(0, 3).join(' ')} grant funding`,
      'conditions[type][]': 'NOTICE',
      'conditions[publication_date][gte]': thirtyDaysAgo,
      'per_page': '50',
      'order': 'newest',
    });

    const response = await fetch(`${APIS.FEDERAL_REGISTER}?${searchParams}`);
    if (!response.ok) return results;

    const data = await response.json();
    
    for (const doc of data.results || []) {
      const targetModules = detectMatchingModules(doc.title, doc.abstract);
      const matchScore = calculateMatchScore(doc.title, doc.abstract, targetModules);
      
      if (matchScore >= 30) { // Only include relevant ones
        results.push({
          source: 'federal_register',
          external_id: doc.document_number,
          title: doc.title,
          agency: doc.agencies?.[0]?.name || 'Federal Government',
          description: doc.abstract || '',
          amount_available: null,
          amount_floor: null,
          open_date: doc.publication_date,
          close_date: null,
          url: doc.html_url,
          category: doc.type,
          eligibility: [],
          target_modules: targetModules,
          match_score: matchScore,
          win_probability: 50, // New announcements get baseline probability
          raw_data: doc,
        });
      }
    }
  } catch (error) {
    console.error('Error searching Federal Register:', error);
  }
  
  return results;
}

// Get FEMA disaster declarations
async function getFEMADisasters(): Promise<DiscoveredGrant[]> {
  const results: DiscoveredGrant[] = [];
  
  try {
    const response = await fetch(`${APIS.FEMA}?$top=50&$orderby=declarationDate desc`);
    if (!response.ok) return results;

    const data = await response.json();
    
    for (const disaster of data.DisasterDeclarationsSummaries || []) {
      // FEMA disasters create grant opportunities
      const programs: string[] = [];
      if (disaster.ihProgramDeclared) programs.push('Individual Assistance');
      if (disaster.paProgramDeclared) programs.push('Public Assistance');
      if (disaster.hmProgramDeclared) programs.push('Hazard Mitigation');
      
      results.push({
        source: 'fema_disaster',
        external_id: `DR-${disaster.disasterNumber}`,
        title: `${disaster.declarationType} Declaration: ${disaster.title}`,
        agency: 'Federal Emergency Management Agency',
        description: `${disaster.incidentType} in ${disaster.state}. Programs available: ${programs.join(', ')}`,
        amount_available: null, // Varies
        amount_floor: null,
        open_date: disaster.declarationDate,
        close_date: null, // Rolling
        url: `https://www.fema.gov/disaster/${disaster.disasterNumber}`,
        category: disaster.incidentType,
        eligibility: [],
        target_modules: ['disaster-relief'],
        match_score: 85, // High match for disaster relief module
        win_probability: 70, // Disaster grants are less competitive
        raw_data: disaster,
      });
    }
  } catch (error) {
    console.error('Error fetching FEMA:', error);
  }
  
  return results;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function detectMatchingModules(title: string, description: string): string[] {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const matchingModules: string[] = [];
  
  for (const [moduleId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    const matchCount = keywords.filter(k => text.includes(k.toLowerCase())).length;
    if (matchCount >= 2) {
      matchingModules.push(moduleId);
    }
  }
  
  return matchingModules;
}

function calculateMatchScore(title: string, description: string, modules: string[]): number {
  let score = 0;
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  for (const module of modules) {
    const keywords = MODULE_KEYWORDS[module] || [];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 8;
      }
    }
  }
  
  return Math.min(score, 100);
}

function estimateWinProbability(matchScore: number, amount: number | null): number {
  let probability = matchScore * 0.4;
  
  if (amount) {
    if (amount < 100000) probability += 15;
    else if (amount < 500000) probability += 10;
    else if (amount < 1000000) probability += 5;
  }
  
  return Math.min(Math.round(probability), 80);
}

// ============================================================
// MAIN DISCOVERY ENGINE
// ============================================================

export async function runFullDiscovery(): Promise<{
  discovered: number;
  imported: number;
  highPriority: number;
  sources: { name: string; count: number }[];
}> {
  console.log('🔍 Starting full grant discovery...');
  const startTime = Date.now();
  
  // Collect all keywords from all modules
  const allKeywords = Object.values(MODULE_KEYWORDS).flat();
  const uniqueKeywords = [...new Set(allKeywords)];
  
  // Run all searches in parallel
  const [grantsGov, nih, nsf, fedReg, fema] = await Promise.all([
    searchGrantsGov(uniqueKeywords.slice(0, 20)),
    searchNIHReporter(uniqueKeywords.slice(0, 10)),
    searchNSFAwards(uniqueKeywords.slice(0, 10)),
    searchFederalRegister(uniqueKeywords.slice(0, 10)),
    getFEMADisasters(),
  ]);
  
  const allGrants = [...grantsGov, ...nih, ...nsf, ...fedReg, ...fema];
  
  // Deduplicate by title similarity
  const seen = new Set<string>();
  const uniqueGrants = allGrants.filter(g => {
    const key = g.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by match score
  uniqueGrants.sort((a, b) => b.match_score - a.match_score);
  
  // Import to database
  let imported = 0;
  let highPriority = 0;
  
  for (const grant of uniqueGrants) {
    if (grant.match_score < 30) continue; // Skip low matches
    
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('grant_opportunities')
        .select('id')
        .or(`opportunity_number.eq.${grant.external_id},grant_name.ilike.%${grant.title.substring(0, 40)}%`)
        .maybeSingle();
      
      if (existing) continue;
      
      // Determine priority
      let priority = 'low';
      if (grant.match_score >= 80) priority = 'critical';
      else if (grant.match_score >= 60) priority = 'high';
      else if (grant.match_score >= 40) priority = 'medium';
      
      if (priority === 'critical' || priority === 'high') highPriority++;
      
      // Insert new grant
      const { error } = await supabase
        .from('grant_opportunities')
        .insert({
          grant_name: grant.title,
          opportunity_number: grant.external_id,
          agency_name: grant.agency,
          description: grant.description.substring(0, 5000),
          amount_available: grant.amount_available,
          application_opens: grant.open_date,
          application_deadline: grant.close_date,
          status: 'researching',
          priority,
          target_modules: grant.target_modules,
          match_score: grant.match_score,
          win_probability: grant.win_probability,
          website_url: grant.url,
          keywords: grant.target_modules,
          discovery_source: grant.source,
        });
      
      if (!error) imported++;
    } catch (error) {
      console.error('Error importing grant:', error);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Discovery complete in ${duration}s: ${uniqueGrants.length} found, ${imported} imported, ${highPriority} high priority`);
  
  return {
    discovered: uniqueGrants.length,
    imported,
    highPriority,
    sources: [
      { name: 'Grants.gov', count: grantsGov.length },
      { name: 'NIH RePORTER', count: nih.length },
      { name: 'NSF Awards', count: nsf.length },
      { name: 'Federal Register', count: fedReg.length },
      { name: 'FEMA', count: fema.length },
    ],
  };
}

// ============================================================
// SCHEDULED TASKS
// ============================================================

export async function runScheduledDiscovery() {
  const hour = new Date().getHours();
  
  // Run different sources at different times to spread load
  if (hour === 6 || hour === 18) {
    // Morning and evening: Full discovery
    return runFullDiscovery();
  } else if (hour === 12) {
    // Noon: Federal Register only (new announcements)
    const allKeywords = Object.values(MODULE_KEYWORDS).flat().slice(0, 10);
    const fedReg = await searchFederalRegister(allKeywords);
    console.log(`📰 Federal Register check: ${fedReg.length} new announcements`);
    return { discovered: fedReg.length, imported: 0, highPriority: 0, sources: [] };
  } else if (hour === 0) {
    // Midnight: FEMA disasters
    const fema = await getFEMADisasters();
    console.log(`🚨 FEMA check: ${fema.length} disaster declarations`);
    return { discovered: fema.length, imported: 0, highPriority: 0, sources: [] };
  }
  
  return { discovered: 0, imported: 0, highPriority: 0, sources: [] };
}

// ============================================================
// DEADLINE MONITORING
// ============================================================

export async function checkUpcomingDeadlines(): Promise<{
  urgent: any[];
  upcoming: any[];
  thisWeek: any[];
}> {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Get all active grants with deadlines
  const { data: grants } = await supabase
    .from('grant_opportunities')
    .select('*')
    .not('application_deadline', 'is', null)
    .gte('application_deadline', now.toISOString())
    .lte('application_deadline', thirtyDays.toISOString())
    .in('status', ['researching', 'preparing', 'writing'])
    .order('application_deadline', { ascending: true });
  
  const urgent: any[] = [];
  const upcoming: any[] = [];
  const thisWeek: any[] = [];
  
  for (const grant of grants || []) {
    const deadline = new Date(grant.application_deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 3) {
      urgent.push({ ...grant, days_remaining: daysRemaining });
    } else if (daysRemaining <= 7) {
      thisWeek.push({ ...grant, days_remaining: daysRemaining });
    } else if (daysRemaining <= 14) {
      upcoming.push({ ...grant, days_remaining: daysRemaining });
    }
  }
  
  return { urgent, upcoming, thisWeek };
}

// ============================================================
// ALERT SYSTEM
// ============================================================

export async function sendDeadlineAlerts() {
  const { urgent, upcoming, thisWeek } = await checkUpcomingDeadlines();
  
  if (urgent.length === 0 && thisWeek.length === 0) {
    console.log('✅ No urgent deadlines');
    return;
  }
  
  // Log alerts (in production, this would send emails/Slack)
  if (urgent.length > 0) {
    console.log(`🚨 URGENT: ${urgent.length} grants due in 3 days or less!`);
    for (const grant of urgent) {
      console.log(`   - ${grant.grant_name} (${grant.days_remaining} days)`);
    }
  }
  
  if (thisWeek.length > 0) {
    console.log(`⚠️ THIS WEEK: ${thisWeek.length} grants due`);
    for (const grant of thisWeek) {
      console.log(`   - ${grant.grant_name} (${grant.days_remaining} days)`);
    }
  }
  
  // Store alert in database
  await supabase.from('system_logs').insert({
    log_type: 'deadline_alert',
    message: `Deadline check: ${urgent.length} urgent, ${thisWeek.length} this week, ${upcoming.length} upcoming`,
    metadata: { urgent: urgent.length, thisWeek: thisWeek.length, upcoming: upcoming.length },
  });
}

// ============================================================
// LEARNING ENGINE - TRACK WHAT GETS APPROVED
// ============================================================

export async function recordGrantOutcome(grantId: string, outcome: {
  won: boolean;
  amount_awarded?: number;
  feedback?: string;
  lessons_learned?: string[];
}) {
  // Update grant record
  await supabase
    .from('grant_opportunities')
    .update({
      status: outcome.won ? 'awarded' : 'rejected',
      amount_requesting: outcome.won ? outcome.amount_awarded : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', grantId);
  
  // Store learning data
  const { data: grant } = await supabase
    .from('grant_opportunities')
    .select('*')
    .eq('id', grantId)
    .single();
  
  if (grant) {
    await supabase.from('grant_learnings').insert({
      grant_id: grantId,
      agency: grant.agency_name,
      target_modules: grant.target_modules,
      amount_requested: grant.amount_requesting,
      amount_awarded: outcome.amount_awarded,
      won: outcome.won,
      match_score_predicted: grant.match_score,
      win_probability_predicted: grant.win_probability,
      feedback: outcome.feedback,
      lessons_learned: outcome.lessons_learned,
      application_elements: {
        // Track what was in the winning/losing application
        had_letters_of_support: true, // Would be actual data
        had_evaluation_plan: true,
        budget_detailed: true,
        sustainability_plan: true,
      },
    });
  }
}

// Analyze what works
export async function analyzeWinPatterns(): Promise<{
  overallWinRate: number;
  winRateByAgency: Record<string, number>;
  winRateByModule: Record<string, number>;
  successFactors: string[];
  failurePatterns: string[];
}> {
  const { data: learnings } = await supabase
    .from('grant_learnings')
    .select('*');
  
  if (!learnings || learnings.length === 0) {
    return {
      overallWinRate: 0,
      winRateByAgency: {},
      winRateByModule: {},
      successFactors: [],
      failurePatterns: [],
    };
  }
  
  const wins = learnings.filter(l => l.won);
  const overallWinRate = (wins.length / learnings.length) * 100;
  
  // Win rate by agency
  const byAgency: Record<string, { wins: number; total: number }> = {};
  for (const l of learnings) {
    if (!byAgency[l.agency]) byAgency[l.agency] = { wins: 0, total: 0 };
    byAgency[l.agency].total++;
    if (l.won) byAgency[l.agency].wins++;
  }
  
  const winRateByAgency: Record<string, number> = {};
  for (const [agency, data] of Object.entries(byAgency)) {
    winRateByAgency[agency] = Math.round((data.wins / data.total) * 100);
  }
  
  // Win rate by module
  const byModule: Record<string, { wins: number; total: number }> = {};
  for (const l of learnings) {
    for (const mod of l.target_modules || []) {
      if (!byModule[mod]) byModule[mod] = { wins: 0, total: 0 };
      byModule[mod].total++;
      if (l.won) byModule[mod].wins++;
    }
  }
  
  const winRateByModule: Record<string, number> = {};
  for (const [mod, data] of Object.entries(byModule)) {
    winRateByModule[mod] = Math.round((data.wins / data.total) * 100);
  }
  
  // Extract success factors from wins
  const successFactors: string[] = [];
  const failurePatterns: string[] = [];
  
  for (const l of wins) {
    if (l.lessons_learned) {
      successFactors.push(...l.lessons_learned);
    }
  }
  
  for (const l of learnings.filter(l => !l.won)) {
    if (l.feedback) {
      failurePatterns.push(l.feedback);
    }
  }
  
  return {
    overallWinRate: Math.round(overallWinRate),
    winRateByAgency,
    winRateByModule,
    successFactors: [...new Set(successFactors)].slice(0, 10),
    failurePatterns: [...new Set(failurePatterns)].slice(0, 10),
  };
}

// ============================================================
// EXPORT MAIN FUNCTIONS
// ============================================================

export {
  searchGrantsGov,
  searchNIHReporter,
  searchNSFAwards,
  searchFederalRegister,
  getFEMADisasters,
};
