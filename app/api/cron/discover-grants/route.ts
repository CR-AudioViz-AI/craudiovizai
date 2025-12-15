// app/api/cron/discover-grants/route.ts
// AUTOMATED GRANT DISCOVERY CRON JOB
// Runs daily to find new opportunities across all APIs
// Configure in Vercel: /api/cron/discover-grants
// Timestamp: Saturday, December 13, 2025 - 2:10 PM EST

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with service role for cron
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All CRAIverse modules
const MODULES = [
  'first-responders', 'veterans-transition', 'together-anywhere', 'faith-communities',
  'senior-connect', 'foster-care-network', 'rural-health', 'mental-health-youth',
  'addiction-recovery', 'animal-rescue', 'green-earth', 'disaster-relief',
  'small-business', 'nonprofit-toolkit', 'education-access', 'digital-literacy',
  'artists-collective', 'musicians-guild', 'community-journalism', 'food-security',
];

const MODULE_KEYWORDS: Record<string, string[]> = {
  'first-responders': ['first responder', 'emergency services', 'law enforcement', 'fire', 'ems', 'ptsd'],
  'veterans-transition': ['veteran', 'military', 'service member', 'transition', 'employment'],
  'together-anywhere': ['military family', 'deployment', 'virtual connection'],
  'faith-communities': ['faith', 'religious', 'church', 'congregation'],
  'senior-connect': ['senior', 'elderly', 'aging', 'isolation'],
  'foster-care-network': ['foster', 'child welfare', 'adoption'],
  'rural-health': ['rural', 'telehealth', 'telemedicine', 'underserved'],
  'mental-health-youth': ['youth mental health', 'adolescent', 'teen'],
  'addiction-recovery': ['addiction', 'recovery', 'substance abuse', 'opioid'],
  'animal-rescue': ['animal', 'rescue', 'shelter', 'pet'],
  'green-earth': ['environment', 'climate', 'sustainability'],
  'disaster-relief': ['disaster', 'emergency', 'relief', 'fema'],
  'small-business': ['small business', 'entrepreneur', 'sbir'],
  'nonprofit-toolkit': ['nonprofit', 'capacity building'],
  'education-access': ['education', 'student', 'stem'],
  'digital-literacy': ['digital literacy', 'technology', 'digital divide'],
  'artists-collective': ['artist', 'art', 'creative'],
  'musicians-guild': ['music', 'musician', 'performing arts'],
  'community-journalism': ['journalism', 'news', 'local news'],
  'food-security': ['food', 'hunger', 'nutrition', 'food bank'],
};

export async function GET(request: Request) {
  // Verify cron secret (set in Vercel)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if CRON_SECRET not set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const sources: { name: string; count: number; error?: string }[] = [];
  const allOpportunities: any[] = [];
  let newCount = 0;
  let highMatchCount = 0;

  console.log('🚀 Starting automated grant discovery...');

  try {
    // Collect all keywords
    const allKeywords: string[] = [];
    for (const moduleId of MODULES) {
      allKeywords.push(...(MODULE_KEYWORDS[moduleId] || []).slice(0, 2));
    }
    const uniqueKeywords = [...new Set(allKeywords)];

    // Search all sources in parallel
    const results = await Promise.allSettled([
      searchGrantsGov(uniqueKeywords),
      searchNIHReporter(uniqueKeywords),
      searchNSFAwards(uniqueKeywords),
      searchFederalRegister(uniqueKeywords),
      searchFEMA(),
    ]);

    // Process Grants.gov
    if (results[0].status === 'fulfilled') {
      const data = results[0].value;
      sources.push({ name: 'Grants.gov', count: data.length });
      allOpportunities.push(...data);
    } else {
      sources.push({ name: 'Grants.gov', count: 0, error: 'Failed' });
    }

    // Process NIH
    if (results[1].status === 'fulfilled') {
      const data = results[1].value;
      sources.push({ name: 'NIH RePORTER', count: data.length });
      allOpportunities.push(...data);
    } else {
      sources.push({ name: 'NIH RePORTER', count: 0, error: 'Failed' });
    }

    // Process NSF
    if (results[2].status === 'fulfilled') {
      const data = results[2].value;
      sources.push({ name: 'NSF Awards', count: data.length });
      allOpportunities.push(...data);
    } else {
      sources.push({ name: 'NSF Awards', count: 0, error: 'Failed' });
    }

    // Process Federal Register
    if (results[3].status === 'fulfilled') {
      const data = results[3].value;
      sources.push({ name: 'Federal Register', count: data.length });
      allOpportunities.push(...data);
    } else {
      sources.push({ name: 'Federal Register', count: 0, error: 'Failed' });
    }

    // Process FEMA
    if (results[4].status === 'fulfilled') {
      const data = results[4].value;
      sources.push({ name: 'FEMA', count: data.length });
      allOpportunities.push(...data);
    } else {
      sources.push({ name: 'FEMA', count: 0, error: 'Failed' });
    }

    console.log(`📊 Found ${allOpportunities.length} total opportunities`);

    // Process and store high-match opportunities
    for (const opp of allOpportunities) {
      const matchingModules = detectMatchingModules(opp);
      const matchScore = calculateMatchScore(opp, matchingModules);
      
      if (matchScore >= 50) {
        highMatchCount++;
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('grant_opportunities')
          .select('id')
          .or(`opportunity_number.eq.${opp.opportunityNumber || opp.externalId},grant_name.ilike.%${opp.title?.substring(0, 40)}%`)
          .maybeSingle();

        if (!existing) {
          // Insert new opportunity
          const { error } = await supabase.from('grant_opportunities').insert({
            grant_name: opp.title,
            opportunity_number: opp.opportunityNumber || opp.externalId,
            agency_name: opp.agency,
            description: opp.description?.substring(0, 5000),
            amount_available: opp.amountMax || opp.amountMin,
            application_opens: opp.openDate,
            application_deadline: opp.closeDate,
            status: 'researching',
            priority: matchScore >= 80 ? 'critical' : matchScore >= 60 ? 'high' : 'medium',
            target_modules: matchingModules,
            match_score: matchScore,
            win_probability: estimateWinProbability(matchScore, opp.amountMax),
            website_url: opp.url,
            keywords: extractKeywords(opp.title + ' ' + (opp.description || '')).slice(0, 10),
          });

          if (!error) {
            newCount++;
            console.log(`✅ Added: ${opp.title?.substring(0, 50)}... (${matchScore}% match)`);
          }
        }
      }
    }

    // Log discovery run
    await supabase.from('grant_discovery_runs').insert({
      run_type: 'scheduled',
      modules_searched: MODULES,
      keywords_used: uniqueKeywords,
      sources_queried: sources.map(s => s.name),
      total_found: allOpportunities.length,
      new_opportunities: newCount,
      high_match_count: highMatchCount,
      results_by_source: sources,
      duration_ms: Date.now() - startTime,
    });

    // Send notification if high-priority grants found
    if (newCount > 0) {
      console.log(`🎉 Discovery complete! Added ${newCount} new opportunities`);
      // TODO: Send email notification
    }

    return NextResponse.json({
      success: true,
      message: `Discovered ${allOpportunities.length} opportunities, added ${newCount} new grants`,
      stats: {
        totalFound: allOpportunities.length,
        highMatches: highMatchCount,
        newAdded: newCount,
        sources,
        durationMs: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('❌ Discovery error:', error);
    
    // Log failed run
    await supabase.from('grant_discovery_runs').insert({
      run_type: 'scheduled',
      modules_searched: MODULES,
      total_found: 0,
      errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
      duration_ms: Date.now() - startTime,
    });

    return NextResponse.json({ 
      error: 'Discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============================================================
// API SEARCH FUNCTIONS
// ============================================================

async function searchGrantsGov(keywords: string[]): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      keyword: keywords.slice(0, 10).join(' OR '),
      oppStatuses: 'forecasted|posted',
      rows: '100',
    });

    const response = await fetch(`https://www.grants.gov/grantsws/rest/opportunities/search?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.oppHits || []).map((o: any) => ({
      source: 'grants_gov',
      externalId: o.id,
      opportunityNumber: o.number,
      title: o.title,
      agency: o.agency?.name || o.agencyCode,
      description: o.synopsis,
      amountMax: o.awardCeiling,
      amountMin: o.awardFloor,
      openDate: o.openDate,
      closeDate: o.closeDate,
      url: `https://www.grants.gov/search-results-detail/${o.id}`,
    }));
  } catch (e) {
    return [];
  }
}

async function searchNIHReporter(keywords: string[]): Promise<any[]> {
  try {
    const response = await fetch('https://api.reporter.nih.gov/v2/projects/search', {
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
        limit: 50,
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((p: any) => ({
      source: 'nih_reporter',
      externalId: p.project_num,
      opportunityNumber: p.project_num,
      title: p.project_title,
      agency: 'NIH',
      description: p.abstract_text,
      amountMax: p.award_amount,
      openDate: p.project_start_date,
      closeDate: p.project_end_date,
      url: `https://reporter.nih.gov/project-details/${p.project_num}`,
    }));
  } catch (e) {
    return [];
  }
}

async function searchNSFAwards(keywords: string[]): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      keyword: keywords.slice(0, 3).join(' '),
      printFields: 'id,title,abstractText,awardeeName,fundsObligatedAmt,startDate,expDate',
    });

    const response = await fetch(`https://api.nsf.gov/services/v1/awards.json?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.response?.award || []).slice(0, 50).map((a: any) => ({
      source: 'nsf_awards',
      externalId: a.id,
      opportunityNumber: a.id,
      title: a.title,
      agency: 'NSF',
      description: a.abstractText,
      amountMax: parseInt(a.fundsObligatedAmt) || 0,
      openDate: a.startDate,
      closeDate: a.expDate,
      url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}`,
    }));
  } catch (e) {
    return [];
  }
}

async function searchFederalRegister(keywords: string[]): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      'conditions[term]': `${keywords.slice(0, 3).join(' ')} grant funding`,
      'conditions[type][]': 'NOTICE',
      'per_page': '50',
    });

    const response = await fetch(`https://www.federalregister.gov/api/v1/documents.json?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((d: any) => ({
      source: 'federal_register',
      externalId: d.document_number,
      opportunityNumber: d.document_number,
      title: d.title,
      agency: d.agencies?.[0]?.name || 'Federal',
      description: d.abstract,
      openDate: d.publication_date,
      url: d.html_url,
    }));
  } catch (e) {
    return [];
  }
}

async function searchFEMA(): Promise<any[]> {
  try {
    const response = await fetch('https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=50&$orderby=declarationDate desc');
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.DisasterDeclarationsSummaries || []).map((d: any) => ({
      source: 'fema',
      externalId: `DR-${d.disasterNumber}`,
      opportunityNumber: `DR-${d.disasterNumber}`,
      title: `${d.declarationType}: ${d.title}`,
      agency: 'FEMA',
      description: `${d.incidentType} disaster in ${d.state}. Programs available: ${d.ihProgramDeclared ? 'IA ' : ''}${d.paProgramDeclared ? 'PA ' : ''}${d.hmProgramDeclared ? 'HM' : ''}`,
      openDate: d.declarationDate,
      url: `https://www.fema.gov/disaster/${d.disasterNumber}`,
    }));
  } catch (e) {
    return [];
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function detectMatchingModules(opp: any): string[] {
  const text = `${opp.title || ''} ${opp.description || ''}`.toLowerCase();
  const matches: string[] = [];

  for (const [moduleId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    const matchCount = keywords.filter(k => text.includes(k.toLowerCase())).length;
    if (matchCount >= 1) {
      matches.push(moduleId);
    }
  }

  return matches;
}

function calculateMatchScore(opp: any, modules: string[]): number {
  let score = 0;
  const text = `${opp.title || ''} ${opp.description || ''}`.toLowerCase();

  for (const moduleId of modules) {
    const keywords = MODULE_KEYWORDS[moduleId] || [];
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) score += 8;
    }
  }

  if (opp.source === 'grants_gov') score += 15;
  if (opp.closeDate) {
    const daysLeft = Math.ceil((new Date(opp.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 30) score += 5;
  }

  return Math.min(score, 100);
}

function estimateWinProbability(matchScore: number, amount: number): number {
  let prob = 30 + matchScore * 0.35;
  if (amount && amount < 500000) prob += 10;
  if (amount && amount < 100000) prob += 5;
  return Math.min(Math.round(prob), 75);
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return [...new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
  )];
}

// Export for Vercel cron
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes
