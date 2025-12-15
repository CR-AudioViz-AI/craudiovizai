// app/api/admin/grants/discover/route.ts
// COMPREHENSIVE GRANT DISCOVERY - All FREE APIs Combined
// Timestamp: Saturday, December 13, 2025 - 12:55 PM EST

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// CRAIverse module keywords for intelligent matching
const MODULE_KEYWORDS: Record<string, string[]> = {
  'first-responders': [
    'first responder', 'emergency services', 'law enforcement', 'fire department', 
    'ems', 'police', 'mental health first responder', 'ptsd', 'trauma', 
    'paramedic', 'firefighter', 'sheriff', 'public safety', '911', 'dispatch'
  ],
  'veterans-transition': [
    'veteran', 'military', 'service member', 'transition', 'career', 'employment', 
    'reintegration', 'wounded warrior', 'gi bill', 'voc rehab', 'veteran employment',
    'military spouse', 'service-connected', 'discharge'
  ],
  'together-anywhere': [
    'military family', 'deployment', 'family connection', 'virtual connection', 
    'distance', 'separation', 'family readiness', 'military child', 'pcs',
    'remote family', 'video communication'
  ],
  'faith-communities': [
    'faith', 'religious', 'church', 'congregation', 'ministry', 'spiritual', 
    'worship', 'interfaith', 'synagogue', 'mosque', 'temple', 'faith-based',
    'religious organization', 'clergy'
  ],
  'senior-connect': [
    'senior', 'elderly', 'aging', 'older adult', 'isolation', 'loneliness', 
    'geriatric', 'medicare', 'social security', 'aarp', 'nursing home',
    'assisted living', 'elder care', 'dementia', 'alzheimer'
  ],
  'foster-care-network': [
    'foster', 'foster care', 'child welfare', 'adoption', 'kinship', 
    'family services', 'child protective', 'dcfs', 'caseworker', 'foster parent',
    'aging out', 'permanency', 'reunification'
  ],
  'rural-health': [
    'rural', 'telehealth', 'telemedicine', 'underserved', 'healthcare access', 
    'remote', 'frontier', 'critical access hospital', 'fqhc', 'community health center',
    'health professional shortage', 'medically underserved'
  ],
  'mental-health-youth': [
    'youth mental health', 'adolescent', 'teen', 'child mental health', 'school', 
    'student', 'pediatric', 'youth suicide', 'bullying', 'school counselor',
    'behavioral health', 'youth crisis', 'early intervention'
  ],
  'addiction-recovery': [
    'addiction', 'recovery', 'substance abuse', 'opioid', 'treatment', 'sobriety',
    'overdose', 'narcan', 'mat', 'medication assisted', 'detox', 'rehab',
    'sober living', 'harm reduction', 'fentanyl', 'drug court'
  ],
  'animal-rescue': [
    'animal', 'rescue', 'shelter', 'pet', 'welfare', 'humane', 'adoption',
    'spay', 'neuter', 'veterinary', 'animal control', 'wildlife', 'sanctuary',
    'no-kill', 'animal cruelty'
  ],
  'green-earth': [
    'environment', 'climate', 'sustainability', 'conservation', 'green', 'eco',
    'renewable', 'solar', 'wind', 'clean energy', 'carbon', 'recycling',
    'pollution', 'water quality', 'air quality', 'endangered species'
  ],
  'disaster-relief': [
    'disaster', 'emergency', 'relief', 'response', 'recovery', 'resilience', 
    'fema', 'hurricane', 'flood', 'wildfire', 'tornado', 'earthquake',
    'emergency management', 'preparedness', 'mitigation'
  ],
  'small-business': [
    'small business', 'entrepreneur', 'local business', 'economic development', 
    'sbir', 'sttr', 'minority business', 'women-owned', 'startup', 'microloan',
    'sba', 'business incubator', 'accelerator', 'venture'
  ],
  'nonprofit-toolkit': [
    'nonprofit', 'ngo', 'charity', 'foundation', 'capacity building',
    'organizational development', '501c3', 'philanthropy', 'grant writing',
    'board development', 'volunteer management'
  ],
  'education-access': [
    'education', 'student', 'learning', 'school', 'academic', 'stem',
    'scholarship', 'tutoring', 'literacy', 'title i', 'head start',
    'pell grant', 'higher education', 'k-12', 'early childhood'
  ],
  'digital-literacy': [
    'digital literacy', 'technology', 'computer', 'internet', 'digital divide', 
    'access', 'broadband', 'connectivity', 'digital skills', 'coding',
    'stem education', 'tech training', 'digital inclusion'
  ],
  'artists-collective': [
    'artist', 'art', 'creative', 'cultural', 'arts', 'visual arts',
    'painting', 'sculpture', 'gallery', 'museum', 'arts education',
    'public art', 'arts council', 'nea'
  ],
  'musicians-guild': [
    'music', 'musician', 'performing arts', 'concert', 'orchestra',
    'band', 'choir', 'music education', 'instrument', 'composer',
    'recording', 'live performance', 'symphony'
  ],
  'community-journalism': [
    'journalism', 'news', 'media', 'local news', 'press', 'reporter',
    'newspaper', 'broadcast', 'investigative', 'community media',
    'press freedom', 'media literacy'
  ],
  'food-security': [
    'food', 'hunger', 'nutrition', 'food bank', 'food insecurity', 'meal',
    'snap', 'wic', 'food pantry', 'food desert', 'school lunch',
    'community garden', 'farm to table', 'feeding program'
  ],
};

// ALL FREE API ENDPOINTS
const APIS = {
  GRANTS_GOV: 'https://www.grants.gov/grantsws/rest/opportunities/search',
  USA_SPENDING: 'https://api.usaspending.gov/api/v2/search/spending_by_award/',
  NIH_REPORTER: 'https://api.reporter.nih.gov/v2/projects/search',
  NSF_AWARDS: 'https://api.nsf.gov/services/v1/awards.json',
  FEDERAL_REGISTER: 'https://www.federalregister.gov/api/v1/documents.json',
  FEMA: 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries',
  PROPUBLICA: 'https://projects.propublica.org/nonprofits/api/v2/search.json',
};

// Search Grants.gov
async function searchGrantsGov(keywords: string[], limit: number = 50): Promise<any[]> {
  try {
    const searchParams = new URLSearchParams({
      keyword: keywords.slice(0, 10).join(' OR '),
      oppStatuses: 'forecasted|posted',
      sortBy: 'openDate|desc',
      rows: limit.toString(),
    });

    const response = await fetch(`${APIS.GRANTS_GOV}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.oppHits || []).map((opp: any) => ({
      source: 'grants_gov',
      sourceLabel: 'Grants.gov',
      id: opp.id,
      opportunity_number: opp.number,
      title: opp.title,
      agency: opp.agency?.name || opp.agencyCode,
      description: opp.synopsis,
      amount_available: opp.awardCeiling,
      amount_floor: opp.awardFloor,
      open_date: opp.openDate,
      close_date: opp.closeDate,
      category: opp.category?.name,
      eligibilities: opp.eligibilities?.map((e: any) => e.name) || [],
      url: `https://www.grants.gov/search-results-detail/${opp.id}`,
      cfda: opp.cfdaNumbers?.join(', '),
    }));
  } catch (error) {
    console.error('Grants.gov error:', error);
    return [];
  }
}

// Search USA Spending
async function searchUSASpending(keywords: string[], limit: number = 25): Promise<any[]> {
  try {
    const response = await fetch(APIS.USA_SPENDING, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          keywords: keywords.slice(0, 5),
          award_type_codes: ['02', '03', '04', '05'],
          time_period: [{
            start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          }],
        },
        fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Description', 'Awarding Agency', 'CFDA Number'],
        limit,
        sort: 'Award Amount',
        order: 'desc',
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((award: any) => ({
      source: 'usa_spending',
      sourceLabel: 'USASpending.gov',
      id: award['Award ID'],
      title: `Award to ${award['Recipient Name']}`,
      agency: award['Awarding Agency'] || 'Federal Government',
      description: award['Description'],
      amount_available: award['Award Amount'],
      cfda: award['CFDA Number'],
      url: `https://www.usaspending.gov/award/${award['Award ID']}`,
      type: 'historical_award',
    }));
  } catch (error) {
    console.error('USASpending error:', error);
    return [];
  }
}

// Search NIH Reporter
async function searchNIHReporter(keywords: string[], limit: number = 25): Promise<any[]> {
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
        limit,
        sort_field: 'award_amount',
        sort_order: 'desc',
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((project: any) => ({
      source: 'nih_reporter',
      sourceLabel: 'NIH RePORTER',
      id: project.project_num || project.appl_id,
      opportunity_number: project.project_num,
      title: project.project_title,
      agency: project.agency_ic_admin?.name || 'National Institutes of Health',
      description: project.abstract_text,
      amount_available: project.award_amount,
      open_date: project.project_start_date,
      close_date: project.project_end_date,
      category: project.activity_code,
      url: `https://reporter.nih.gov/search/results?query=${encodeURIComponent(project.project_title || '')}`,
      pi: project.principal_investigators?.map((pi: any) => pi.full_name).join(', '),
      organization: project.organization?.org_name,
    }));
  } catch (error) {
    console.error('NIH Reporter error:', error);
    return [];
  }
}

// Search NSF Awards
async function searchNSFAwards(keywords: string[], limit: number = 25): Promise<any[]> {
  try {
    const searchParams = new URLSearchParams({
      keyword: keywords.slice(0, 3).join(' '),
      printFields: 'id,title,abstractText,agency,awardeeName,fundsObligatedAmt,date,startDate,expDate,primaryProgram',
    });

    const response = await fetch(`${APIS.NSF_AWARDS}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.response?.award || []).slice(0, limit).map((award: any) => ({
      source: 'nsf_awards',
      sourceLabel: 'NSF Awards',
      id: award.id,
      opportunity_number: award.id,
      title: award.title,
      agency: 'National Science Foundation',
      description: award.abstractText,
      amount_available: parseInt(award.fundsObligatedAmt) || 0,
      open_date: award.startDate,
      close_date: award.expDate,
      category: award.primaryProgram,
      url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${award.id}`,
      organization: award.awardeeName,
    }));
  } catch (error) {
    console.error('NSF Awards error:', error);
    return [];
  }
}

// Search Federal Register for new NOFOs
async function searchFederalRegister(keywords: string[], limit: number = 25): Promise<any[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const searchParams = new URLSearchParams({
      'conditions[term]': `${keywords.slice(0, 3).join(' ')} grant funding`,
      'conditions[type][]': 'NOTICE',
      'conditions[publication_date][gte]': thirtyDaysAgo,
      'per_page': limit.toString(),
      'order': 'newest',
    });

    const response = await fetch(`${APIS.FEDERAL_REGISTER}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((doc: any) => ({
      source: 'federal_register',
      sourceLabel: 'Federal Register',
      id: doc.document_number,
      opportunity_number: doc.document_number,
      title: doc.title,
      agency: doc.agencies?.[0]?.name || 'Federal Government',
      description: doc.abstract,
      open_date: doc.publication_date,
      url: doc.html_url,
      pdf_url: doc.pdf_url,
      type: doc.type,
    }));
  } catch (error) {
    console.error('Federal Register error:', error);
    return [];
  }
}

// Get FEMA disaster declarations (for disaster relief grants)
async function getFEMADisasters(state?: string): Promise<any[]> {
  try {
    let url = `${APIS.FEMA}?$top=50&$orderby=declarationDate desc`;
    if (state) {
      url += `&$filter=state eq '${state}'`;
    }

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.DisasterDeclarationsSummaries || []).map((disaster: any) => ({
      source: 'fema_disaster',
      sourceLabel: 'FEMA Disasters',
      id: `DR-${disaster.disasterNumber}`,
      title: `${disaster.declarationType} Declaration: ${disaster.title}`,
      agency: 'Federal Emergency Management Agency',
      description: `${disaster.incidentType} in ${disaster.state}. Programs: ${disaster.ihProgramDeclared ? 'Individual Assistance, ' : ''}${disaster.paProgramDeclared ? 'Public Assistance, ' : ''}${disaster.hmProgramDeclared ? 'Hazard Mitigation' : ''}`,
      open_date: disaster.declarationDate,
      category: disaster.incidentType,
      state: disaster.state,
      url: `https://www.fema.gov/disaster/${disaster.disasterNumber}`,
      programs: {
        individualAssistance: disaster.ihProgramDeclared,
        publicAssistance: disaster.paProgramDeclared,
        hazardMitigation: disaster.hmProgramDeclared,
      },
    }));
  } catch (error) {
    console.error('FEMA error:', error);
    return [];
  }
}

// Calculate match score
function calculateMatchScore(opportunity: any, targetModules: string[]): number {
  let score = 0;
  const title = (opportunity.title || '').toLowerCase();
  const description = (opportunity.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  for (const module of targetModules) {
    const keywords = MODULE_KEYWORDS[module] || [];
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        score += 8;
      }
    }
  }

  // Bonus for federal grants
  if (opportunity.source === 'grants_gov') score += 10;
  
  // Bonus for open opportunities
  if (opportunity.close_date) {
    const daysUntil = Math.ceil((new Date(opportunity.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 30) score += 5;
  }

  return Math.min(score, 100);
}

// Estimate win probability
function estimateWinProbability(opportunity: any, matchScore: number): number {
  let probability = matchScore * 0.4;

  // Lower amounts = less competition
  if (opportunity.amount_available) {
    if (opportunity.amount_available < 100000) probability += 15;
    else if (opportunity.amount_available < 500000) probability += 10;
    else if (opportunity.amount_available < 1000000) probability += 5;
  }

  // Private foundations typically have higher win rates
  if (opportunity.source === 'propublica') probability += 10;

  return Math.min(Math.round(probability), 75);
}

// Detect which modules match
function detectMatchingModules(opportunity: any): string[] {
  const title = (opportunity.title || '').toLowerCase();
  const description = (opportunity.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  const matchingModules: string[] = [];
  
  for (const [moduleId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    const matchCount = keywords.filter(k => combinedText.includes(k.toLowerCase())).length;
    if (matchCount >= 2) {
      matchingModules.push(moduleId);
    }
  }
  
  return matchingModules;
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const modules = searchParams.get('modules')?.split(',') || Object.keys(MODULE_KEYWORDS);
  const sources = searchParams.get('sources')?.split(',') || ['all'];
  const includeHistorical = searchParams.get('historical') === 'true';
  const state = searchParams.get('state');

  try {
    // Collect keywords from target modules
    const keywords: string[] = [];
    for (const module of modules) {
      const moduleKeywords = MODULE_KEYWORDS[module] || [];
      keywords.push(...moduleKeywords.slice(0, 5)); // Top 5 from each module
    }
    const uniqueKeywords = [...new Set(keywords)].slice(0, 25);

    // Run all API searches in parallel
    const searchPromises: Promise<any[]>[] = [];
    const sourceResults: { name: string; count: number; error?: string }[] = [];

    if (sources.includes('all') || sources.includes('grants_gov')) {
      searchPromises.push(
        searchGrantsGov(uniqueKeywords).then(results => {
          sourceResults.push({ name: 'Grants.gov', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'Grants.gov', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    if (sources.includes('all') || sources.includes('nih')) {
      searchPromises.push(
        searchNIHReporter(uniqueKeywords).then(results => {
          sourceResults.push({ name: 'NIH RePORTER', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'NIH RePORTER', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    if (sources.includes('all') || sources.includes('nsf')) {
      searchPromises.push(
        searchNSFAwards(uniqueKeywords).then(results => {
          sourceResults.push({ name: 'NSF Awards', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'NSF Awards', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    if (sources.includes('all') || sources.includes('federal_register')) {
      searchPromises.push(
        searchFederalRegister(uniqueKeywords).then(results => {
          sourceResults.push({ name: 'Federal Register', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'Federal Register', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    if (includeHistorical && (sources.includes('all') || sources.includes('usa_spending'))) {
      searchPromises.push(
        searchUSASpending(uniqueKeywords).then(results => {
          sourceResults.push({ name: 'USASpending.gov', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'USASpending.gov', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    if (sources.includes('all') || sources.includes('fema')) {
      searchPromises.push(
        getFEMADisasters(state || undefined).then(results => {
          sourceResults.push({ name: 'FEMA Disasters', count: results.length });
          return results;
        }).catch(() => {
          sourceResults.push({ name: 'FEMA Disasters', count: 0, error: 'API Error' });
          return [];
        })
      );
    }

    // Wait for all searches
    const allResults = await Promise.all(searchPromises);
    let opportunities = allResults.flat();

    // Calculate scores and detect matching modules
    opportunities = opportunities.map(opp => {
      const detectedModules = detectMatchingModules(opp);
      const targetModulesForScoring = detectedModules.length > 0 ? detectedModules : modules;
      const matchScore = calculateMatchScore(opp, targetModulesForScoring);
      
      return {
        ...opp,
        target_modules: detectedModules,
        match_score: matchScore,
        win_probability: estimateWinProbability(opp, matchScore),
      };
    });

    // Sort by match score
    opportunities.sort((a, b) => b.match_score - a.match_score);

    // Remove duplicates by title similarity
    const seen = new Set<string>();
    opportunities = opportunities.filter(opp => {
      const key = opp.title?.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      keywords_used: uniqueKeywords,
      sources: sourceResults,
      opportunities: opportunities.slice(0, 200), // Limit to 200 results
      api_info: {
        grants_gov: 'https://www.grants.gov - Federal grant opportunities',
        nih_reporter: 'https://reporter.nih.gov - NIH research funding',
        nsf_awards: 'https://nsf.gov - National Science Foundation',
        federal_register: 'https://federalregister.gov - New announcements',
        usa_spending: 'https://usaspending.gov - Historical awards',
        fema: 'https://fema.gov - Disaster declarations',
      },
    });

  } catch (error) {
    console.error('Error discovering grants:', error);
    return NextResponse.json({ 
      error: 'Failed to discover grants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Import discovered grant into our system
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { opportunity } = body;

    // Check if already imported
    const { data: existing } = await supabase
      .from('grant_opportunities')
      .select('id')
      .or(`opportunity_number.eq.${opportunity.opportunity_number},grant_name.ilike.%${opportunity.title?.substring(0, 50)}%`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Grant already imported',
        existing_id: existing.id 
      });
    }

    // Import the grant
    const { data: newGrant, error } = await supabase
      .from('grant_opportunities')
      .insert({
        grant_name: opportunity.title,
        opportunity_number: opportunity.opportunity_number || opportunity.id,
        agency_name: opportunity.agency,
        description: opportunity.description,
        amount_available: opportunity.amount_available,
        application_opens: opportunity.open_date,
        application_deadline: opportunity.close_date,
        status: 'researching',
        priority: opportunity.match_score >= 80 ? 'critical' : opportunity.match_score >= 60 ? 'high' : opportunity.match_score >= 40 ? 'medium' : 'low',
        target_modules: opportunity.target_modules || [],
        match_score: opportunity.match_score || 0,
        win_probability: opportunity.win_probability || 0,
        website_url: opportunity.url,
        eligibility_requirements: opportunity.eligibilities?.join(', '),
        keywords: opportunity.category ? [opportunity.category] : [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Grant imported successfully',
      grant: newGrant,
    });

  } catch (error) {
    console.error('Error importing grant:', error);
    return NextResponse.json({ 
      error: 'Failed to import grant',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
