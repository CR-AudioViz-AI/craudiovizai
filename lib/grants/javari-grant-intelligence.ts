// lib/grants/javari-grant-intelligence.ts
// JAVARI GRANT INTELLIGENCE ENGINE - MULTI-AI POWERHOUSE
// Uses ALL AI providers + ALL free APIs to GUARANTEE grant success
// Timestamp: Saturday, December 13, 2025 - 1:25 PM EST

// ============================================================
// AI PROVIDER CONFIGURATION - ALL 5 PROVIDERS
// ============================================================

export const AI_PROVIDERS = {
  ANTHROPIC: {
    name: 'Claude (Anthropic)',
    model: 'claude-3-5-sonnet-20241022',
    endpoint: 'https://api.anthropic.com/v1/messages',
    strengths: ['Deep analysis', 'Complex reasoning', 'Document writing', 'Strategy'],
    useFor: ['grant_analysis', 'narrative_writing', 'strategy_development'],
  },
  OPENAI: {
    name: 'GPT-4 (OpenAI)',
    model: 'gpt-4-turbo-preview',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    strengths: ['Creative writing', 'Fast responses', 'Code generation'],
    useFor: ['budget_creation', 'timeline_planning', 'quick_analysis'],
  },
  GEMINI: {
    name: 'Gemini (Google)',
    model: 'gemini-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    strengths: ['Multi-modal', 'Large context', 'Research synthesis'],
    useFor: ['document_analysis', 'research_synthesis', 'data_extraction'],
  },
  PERPLEXITY: {
    name: 'Perplexity AI',
    model: 'llama-3.1-sonar-large-128k-online',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    strengths: ['Real-time web search', 'Current information', 'Fact checking'],
    useFor: ['agency_research', 'deadline_verification', 'competitor_analysis'],
  },
};

// ============================================================
// ALL FREE GRANT APIs - COMPREHENSIVE LIST
// ============================================================

export const GRANT_APIS = {
  // FEDERAL GRANT OPPORTUNITIES
  GRANTS_GOV: {
    name: 'Grants.gov',
    baseUrl: 'https://www.grants.gov/grantsws/rest',
    type: 'opportunities',
    free: true,
    rateLimit: '1000/day',
  },
  USA_SPENDING: {
    name: 'USASpending.gov',
    baseUrl: 'https://api.usaspending.gov/api/v2',
    type: 'awards',
    free: true,
    rateLimit: 'unlimited',
  },
  SAM_GOV: {
    name: 'SAM.gov',
    baseUrl: 'https://api.sam.gov',
    type: 'entities',
    free: true,
    rateLimit: '10000/day',
  },
  FEDERAL_REGISTER: {
    name: 'Federal Register',
    baseUrl: 'https://www.federalregister.gov/api/v1',
    type: 'announcements',
    free: true,
    rateLimit: 'unlimited',
  },

  // RESEARCH & SCIENCE
  NIH_REPORTER: {
    name: 'NIH RePORTER',
    baseUrl: 'https://api.reporter.nih.gov/v2',
    type: 'research_grants',
    free: true,
    rateLimit: 'unlimited',
  },
  NSF_AWARDS: {
    name: 'NSF Awards',
    baseUrl: 'https://api.nsf.gov/services/v1/awards',
    type: 'science_grants',
    free: true,
    rateLimit: 'unlimited',
  },
  DOE_OSTI: {
    name: 'DOE OSTI',
    baseUrl: 'https://www.osti.gov/api/v1',
    type: 'energy_research',
    free: true,
    rateLimit: 'unlimited',
  },

  // DEMOGRAPHICS & DATA
  CENSUS: {
    name: 'US Census',
    baseUrl: 'https://api.census.gov/data',
    type: 'demographics',
    free: true,
    rateLimit: '500/day',
  },
  BLS: {
    name: 'Bureau of Labor Statistics',
    baseUrl: 'https://api.bls.gov/publicAPI/v2',
    type: 'employment',
    free: true,
    rateLimit: '500/day',
  },
  FRED: {
    name: 'Federal Reserve Economic Data',
    baseUrl: 'https://api.stlouisfed.org/fred/series/observations',
    type: 'economic',
    free: true,
    rateLimit: 'unlimited',
  },

  // HEALTH & HUMAN SERVICES
  CDC_DATA: {
    name: 'CDC Open Data',
    baseUrl: 'https://data.cdc.gov/api',
    type: 'health_data',
    free: true,
    rateLimit: 'unlimited',
  },
  HRSA_DATA: {
    name: 'HRSA Data',
    baseUrl: 'https://data.hrsa.gov/api',
    type: 'health_resources',
    free: true,
    rateLimit: 'unlimited',
  },

  // DISASTER & EMERGENCY
  FEMA: {
    name: 'FEMA OpenFEMA',
    baseUrl: 'https://www.fema.gov/api/open/v2',
    type: 'disasters',
    free: true,
    rateLimit: 'unlimited',
  },

  // NONPROFITS
  PROPUBLICA: {
    name: 'ProPublica Nonprofit Explorer',
    baseUrl: 'https://projects.propublica.org/nonprofits/api/v2',
    type: 'nonprofits',
    free: true,
    rateLimit: '1000/day',
  },

  // BUSINESS
  SBA: {
    name: 'SBA',
    baseUrl: 'https://data.sba.gov/api',
    type: 'small_business',
    free: true,
    rateLimit: 'unlimited',
  },

  // HOUSING
  HUD: {
    name: 'HUD Exchange',
    baseUrl: 'https://www.hudexchange.info/api',
    type: 'housing',
    free: true,
    rateLimit: 'unlimited',
  },
};

// ============================================================
// CRAIVERSE MODULE INTELLIGENCE
// ============================================================

export const CRAIVERSE_MODULES = {
  'first-responders': {
    name: 'First Responders Haven',
    targetFunding: 400000000, // $400M
    keywords: ['first responder', 'emergency services', 'law enforcement', 'fire department', 'ems', 'police', 'ptsd', 'trauma', 'paramedic', 'firefighter', 'public safety'],
    agencies: ['FEMA', 'DOJ', 'HHS', 'SAMHSA'],
    cfda: ['16.', '93.', '97.'],
    successFactors: ['mental health focus', 'peer support', 'technology-enabled', 'evidence-based'],
  },
  'veterans-transition': {
    name: 'Veterans Transition Hub',
    targetFunding: 150000000, // $150M
    keywords: ['veteran', 'military', 'service member', 'transition', 'employment', 'reintegration', 'voc rehab'],
    agencies: ['VA', 'DOD', 'DOL'],
    cfda: ['64.', '12.'],
    successFactors: ['employment outcomes', 'skills translation', 'family support', 'holistic approach'],
  },
  'together-anywhere': {
    name: 'Together Anywhere',
    targetFunding: 75000000, // $75M
    keywords: ['military family', 'deployment', 'family connection', 'virtual connection', 'distance'],
    agencies: ['DOD', 'VA'],
    cfda: ['12.', '64.'],
    successFactors: ['family resilience', 'deployment support', 'connection technology'],
  },
  'faith-communities': {
    name: 'Faith Communities',
    targetFunding: 100000000, // $100M
    keywords: ['faith', 'religious', 'church', 'congregation', 'ministry', 'faith-based'],
    agencies: ['HHS', 'DOJ', 'FEMA'],
    cfda: ['93.', '97.'],
    successFactors: ['community partnerships', 'volunteer engagement', 'disaster response'],
  },
  'senior-connect': {
    name: 'Senior Connect',
    targetFunding: 45000000, // $45M
    keywords: ['senior', 'elderly', 'aging', 'older adult', 'isolation', 'loneliness'],
    agencies: ['HHS', 'ACL'],
    cfda: ['93.'],
    successFactors: ['social connection', 'technology adoption', 'health outcomes'],
  },
  'foster-care-network': {
    name: 'Foster Care Network',
    targetFunding: 45000000, // $45M
    keywords: ['foster', 'foster care', 'child welfare', 'adoption', 'kinship'],
    agencies: ['HHS', 'ACF'],
    cfda: ['93.'],
    successFactors: ['permanency outcomes', 'family reunification', 'youth voice'],
  },
  'rural-health': {
    name: 'Rural Health Access',
    targetFunding: 75000000, // $75M
    keywords: ['rural', 'telehealth', 'telemedicine', 'underserved', 'healthcare access'],
    agencies: ['HHS', 'HRSA', 'USDA'],
    cfda: ['93.', '10.'],
    successFactors: ['access expansion', 'telehealth infrastructure', 'provider retention'],
  },
  'mental-health-youth': {
    name: 'Youth Mental Health',
    targetFunding: 50000000, // $50M
    keywords: ['youth mental health', 'adolescent', 'teen', 'child mental health', 'school'],
    agencies: ['HHS', 'SAMHSA', 'ED'],
    cfda: ['93.', '84.'],
    successFactors: ['school-based', 'early intervention', 'family involvement'],
  },
  'addiction-recovery': {
    name: 'Recovery Together',
    targetFunding: 35000000, // $35M
    keywords: ['addiction', 'recovery', 'substance abuse', 'opioid', 'treatment', 'sobriety'],
    agencies: ['HHS', 'SAMHSA'],
    cfda: ['93.'],
    successFactors: ['evidence-based treatment', 'peer support', 'harm reduction'],
  },
  'animal-rescue': {
    name: 'Animal Rescue Network',
    targetFunding: 75000000, // $75M
    keywords: ['animal', 'rescue', 'shelter', 'pet', 'welfare', 'humane'],
    agencies: ['USDA', 'DOI'],
    cfda: ['10.', '15.'],
    successFactors: ['adoption outcomes', 'spay/neuter', 'community education'],
  },
  'green-earth': {
    name: 'Green Earth Initiative',
    targetFunding: 25000000, // $25M
    keywords: ['environment', 'climate', 'sustainability', 'conservation', 'green'],
    agencies: ['EPA', 'DOI', 'DOE'],
    cfda: ['66.', '15.', '81.'],
    successFactors: ['measurable impact', 'community engagement', 'innovation'],
  },
  'disaster-relief': {
    name: 'Disaster Relief Hub',
    targetFunding: 25000000, // $25M
    keywords: ['disaster', 'emergency', 'relief', 'response', 'recovery', 'resilience'],
    agencies: ['FEMA', 'HHS', 'HUD'],
    cfda: ['97.', '14.'],
    successFactors: ['rapid response', 'community resilience', 'coordination'],
  },
  'small-business': {
    name: 'Small Business Hub',
    targetFunding: 50000000, // $50M
    keywords: ['small business', 'entrepreneur', 'economic development', 'sbir', 'minority business'],
    agencies: ['SBA', 'DOC', 'EDA'],
    cfda: ['59.', '11.'],
    successFactors: ['job creation', 'innovation', 'underserved communities'],
  },
  'nonprofit-toolkit': {
    name: 'Nonprofit Toolkit',
    targetFunding: 25000000, // $25M
    keywords: ['nonprofit', 'ngo', 'charity', 'capacity building'],
    agencies: ['HHS', 'CNCS'],
    cfda: ['93.', '94.'],
    successFactors: ['organizational capacity', 'sustainability', 'impact measurement'],
  },
  'education-access': {
    name: 'Education Access',
    targetFunding: 25000000, // $25M
    keywords: ['education', 'student', 'learning', 'school', 'academic', 'stem'],
    agencies: ['ED', 'NSF'],
    cfda: ['84.', '47.'],
    successFactors: ['student outcomes', 'equity', 'innovation'],
  },
  'digital-literacy': {
    name: 'Digital Literacy',
    targetFunding: 15000000, // $15M
    keywords: ['digital literacy', 'technology', 'internet', 'digital divide', 'broadband'],
    agencies: ['NTIA', 'FCC', 'ED'],
    cfda: ['11.', '84.'],
    successFactors: ['access expansion', 'skills development', 'equity'],
  },
  'artists-collective': {
    name: 'Artists Collective',
    targetFunding: 25000000, // $25M
    keywords: ['artist', 'art', 'creative', 'cultural', 'visual arts'],
    agencies: ['NEA', 'NEH', 'IMLS'],
    cfda: ['45.'],
    successFactors: ['community engagement', 'cultural preservation', 'artist support'],
  },
  'musicians-guild': {
    name: 'Musicians Guild',
    targetFunding: 20000000, // $20M
    keywords: ['music', 'musician', 'performing arts', 'concert', 'orchestra'],
    agencies: ['NEA', 'NEH'],
    cfda: ['45.'],
    successFactors: ['access', 'education', 'community impact'],
  },
  'community-journalism': {
    name: 'Community Journalism',
    targetFunding: 10000000, // $10M
    keywords: ['journalism', 'news', 'media', 'local news', 'press'],
    agencies: ['NEH', 'CPB'],
    cfda: ['45.'],
    successFactors: ['local coverage', 'civic engagement', 'sustainability'],
  },
  'food-security': {
    name: 'Food Security Network',
    targetFunding: 25000000, // $25M
    keywords: ['food', 'hunger', 'nutrition', 'food bank', 'food insecurity'],
    agencies: ['USDA', 'HHS'],
    cfda: ['10.', '93.'],
    successFactors: ['meals provided', 'nutrition education', 'distribution efficiency'],
  },
};

// ============================================================
// GRANT SUCCESS PATTERNS - WHAT GETS APPROVED
// ============================================================

export const SUCCESS_PATTERNS = {
  // Application structure that wins
  winningStructure: {
    executiveSummary: 'Clear, compelling, quantifiable outcomes in first paragraph',
    needStatement: 'Data-driven, localized, connects to national priorities',
    projectDescription: 'Specific, measurable, time-bound activities',
    evaluation: 'Independent evaluator, logic model, outcome metrics',
    sustainability: 'Revenue diversification, partner commitments, phase-out plan',
    budget: 'Detailed, justified, reasonable indirect rate',
  },
  
  // Keywords that increase approval rates
  powerPhrases: [
    'evidence-based',
    'trauma-informed',
    'person-centered',
    'equity-focused',
    'culturally responsive',
    'community-driven',
    'scalable',
    'sustainable',
    'innovative',
    'measurable outcomes',
    'data-driven decision making',
    'continuous quality improvement',
    'collaborative partnership',
    'capacity building',
    'underserved communities',
    'health equity',
    'social determinants',
    'whole-person care',
  ],
  
  // Red flags that cause rejections
  redFlags: [
    'Vague outcomes',
    'No evaluation plan',
    'Unrealistic timeline',
    'Budget mismatch',
    'No sustainability plan',
    'Lack of partnerships',
    'No letters of support',
    'Missing required sections',
    'Over-promised deliverables',
    'No logic model',
  ],
  
  // Scoring priorities by agency
  agencyPriorities: {
    HHS: ['health equity', 'evidence-based', 'measurable outcomes', 'sustainability'],
    FEMA: ['community resilience', 'mitigation', 'partnership', 'cost-effectiveness'],
    DOJ: ['evidence-based', 'data-driven', 'community partnerships', 'sustainability'],
    VA: ['veteran-focused', 'employment outcomes', 'holistic services', 'peer support'],
    ED: ['student outcomes', 'equity', 'innovation', 'scalability'],
    NSF: ['intellectual merit', 'broader impacts', 'innovation', 'STEM education'],
    NEA: ['artistic excellence', 'community engagement', 'access', 'diversity'],
    USDA: ['rural focus', 'food security', 'sustainability', 'economic development'],
  },
};

// ============================================================
// MULTI-AI ANALYSIS FUNCTIONS
// ============================================================

interface AIAnalysisRequest {
  grantId: string;
  grantData: any;
  analysisType: 'match' | 'strategy' | 'narrative' | 'budget' | 'review' | 'competitive';
  targetModules: string[];
}

interface AIAnalysisResponse {
  provider: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  keywords: string[];
  risks: string[];
  nextSteps: string[];
}

// Call Claude for deep analysis
export async function analyzeWithClaude(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const systemPrompt = buildSystemPrompt(request.analysisType);
  const userPrompt = buildAnalysisPrompt(request);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  
  const data = await response.json();
  return parseAIResponse('Claude', data.content[0].text);
}

// Call GPT-4 for creative writing
export async function analyzeWithGPT4(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const systemPrompt = buildSystemPrompt(request.analysisType);
  const userPrompt = buildAnalysisPrompt(request);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });
  
  const data = await response.json();
  return parseAIResponse('GPT-4', data.choices[0].message.content);
}

// Call Gemini for research synthesis
export async function analyzeWithGemini(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `${buildSystemPrompt(request.analysisType)}\n\n${buildAnalysisPrompt(request)}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  
  const data = await response.json();
  return parseAIResponse('Gemini', data.candidates[0].content.parts[0].text);
}

// Call Perplexity for real-time research
export async function analyzeWithPerplexity(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a grant research expert. Find current information about this grant opportunity, the funding agency, recent awards, and success factors.',
        },
        {
          role: 'user',
          content: `Research this grant opportunity and provide current intelligence:
          
Grant: ${request.grantData.title || request.grantData.grant_name}
Agency: ${request.grantData.agency || request.grantData.agency_name}
Amount: ${request.grantData.amount_available}

Find:
1. Recent awards from this agency
2. Success rates and competition level
3. Current agency priorities
4. Recent policy changes affecting this grant
5. Similar successful applications`,
        },
      ],
    }),
  });
  
  const data = await response.json();
  return parseAIResponse('Perplexity', data.choices[0].message.content);
}

// ============================================================
// COMBINED MULTI-AI ANALYSIS
// ============================================================

export async function runMultiAIAnalysis(request: AIAnalysisRequest): Promise<{
  consensus: AIAnalysisResponse;
  individual: AIAnalysisResponse[];
  confidence: number;
}> {
  // Run all AI providers in parallel
  const [claude, gpt4, gemini, perplexity] = await Promise.allSettled([
    analyzeWithClaude(request),
    analyzeWithGPT4(request),
    analyzeWithGemini(request),
    analyzeWithPerplexity(request),
  ]);
  
  const results: AIAnalysisResponse[] = [];
  
  if (claude.status === 'fulfilled') results.push(claude.value);
  if (gpt4.status === 'fulfilled') results.push(gpt4.value);
  if (gemini.status === 'fulfilled') results.push(gemini.value);
  if (perplexity.status === 'fulfilled') results.push(perplexity.value);
  
  // Synthesize consensus from all responses
  const consensus = synthesizeConsensus(results);
  
  return {
    consensus,
    individual: results,
    confidence: calculateOverallConfidence(results),
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function buildSystemPrompt(analysisType: string): string {
  const basePrompt = `You are Javari AI, the world's most advanced grant-winning assistant for CR AudioViz AI. 
Your mission is to help win $1.289 BILLION in grants for 20 CRAIverse social impact modules.

You analyze grants with surgical precision, identifying exactly what funders want to see.
You know the success patterns, the power phrases, the red flags, and the scoring priorities.

Your goal: Maximize our win rate by providing actionable, specific recommendations.`;

  const typeSpecific: Record<string, string> = {
    match: 'Analyze how well this grant aligns with our mission and capabilities. Score 0-100 with detailed justification.',
    strategy: 'Develop a winning strategy for this grant. What angles should we emphasize? What partnerships do we need?',
    narrative: 'Draft compelling narrative sections using power phrases and addressing all scoring criteria.',
    budget: 'Create a detailed, justified budget that maximizes our request while staying reasonable.',
    review: 'Review this application draft. Identify weaknesses, red flags, and areas for improvement.',
    competitive: 'Analyze our competition. Who else is likely applying? How do we differentiate?',
  };
  
  return `${basePrompt}\n\nYour task: ${typeSpecific[analysisType] || typeSpecific.match}`;
}

function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const moduleInfo = request.targetModules.map(m => {
    const mod = CRAIVERSE_MODULES[m as keyof typeof CRAIVERSE_MODULES];
    return mod ? `- ${mod.name}: $${(mod.targetFunding / 1000000).toFixed(0)}M target` : '';
  }).filter(Boolean).join('\n');
  
  return `GRANT ANALYSIS REQUEST

GRANT DETAILS:
- Name: ${request.grantData.grant_name || request.grantData.title}
- Agency: ${request.grantData.agency_name || request.grantData.agency}
- Amount: $${(request.grantData.amount_available || 0).toLocaleString()}
- Deadline: ${request.grantData.application_deadline || request.grantData.close_date || 'Rolling'}
- Description: ${request.grantData.description || 'N/A'}

TARGET CRAIVERSE MODULES:
${moduleInfo}

OUR ORGANIZATION:
- CR AudioViz AI, LLC (Florida S-Corporation)
- Mission: "Your Story. Our Design"
- Platform: 60+ creative tools, 1,200+ games, CRAIverse virtual world
- Social Impact: 20 modules serving underserved communities
- Differentiators: AI-powered, customer-first policies, credits never expire

Provide your analysis with:
1. Match Score (0-100) with justification
2. Win Probability estimate
3. Top 5 specific recommendations
4. Key phrases to use
5. Risks and mitigation strategies
6. Recommended next steps`;
}

function parseAIResponse(provider: string, text: string): AIAnalysisResponse {
  // Extract structured data from AI response
  const recommendations: string[] = [];
  const keywords: string[] = [];
  const risks: string[] = [];
  const nextSteps: string[] = [];
  let confidence = 70;
  
  // Parse numbered lists
  const recMatches = text.match(/recommendations?:?\n([\s\S]*?)(?=\n\n|risks|keywords|next|$)/i);
  if (recMatches) {
    const items = recMatches[1].match(/^\d+\.\s+.+$/gm);
    if (items) recommendations.push(...items.map(i => i.replace(/^\d+\.\s+/, '')));
  }
  
  // Parse keywords
  const kwMatches = text.match(/keywords?:?\s*([^\n]+)/i);
  if (kwMatches) {
    keywords.push(...kwMatches[1].split(/,|;/).map(k => k.trim()).filter(Boolean));
  }
  
  // Extract confidence/score
  const scoreMatch = text.match(/(?:score|confidence|match):\s*(\d+)/i);
  if (scoreMatch) confidence = parseInt(scoreMatch[1]);
  
  return {
    provider,
    analysis: text,
    recommendations: recommendations.slice(0, 5),
    confidence,
    keywords: keywords.slice(0, 10),
    risks,
    nextSteps,
  };
}

function synthesizeConsensus(results: AIAnalysisResponse[]): AIAnalysisResponse {
  if (results.length === 0) {
    return {
      provider: 'Consensus',
      analysis: 'No AI analysis available',
      recommendations: [],
      confidence: 0,
      keywords: [],
      risks: [],
      nextSteps: [],
    };
  }
  
  // Average confidence scores
  const avgConfidence = Math.round(
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  );
  
  // Combine unique recommendations
  const allRecs = results.flatMap(r => r.recommendations);
  const uniqueRecs = [...new Set(allRecs)].slice(0, 10);
  
  // Combine keywords
  const allKeywords = results.flatMap(r => r.keywords);
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 15);
  
  // Build consensus analysis
  const consensusAnalysis = results.map(r => 
    `**${r.provider} (${r.confidence}% confidence):**\n${r.analysis.substring(0, 500)}...`
  ).join('\n\n---\n\n');
  
  return {
    provider: 'Multi-AI Consensus',
    analysis: consensusAnalysis,
    recommendations: uniqueRecs,
    confidence: avgConfidence,
    keywords: uniqueKeywords,
    risks: results.flatMap(r => r.risks).slice(0, 5),
    nextSteps: results.flatMap(r => r.nextSteps).slice(0, 5),
  };
}

function calculateOverallConfidence(results: AIAnalysisResponse[]): number {
  if (results.length === 0) return 0;
  
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  // Bonus for consensus (multiple AIs agreeing)
  const varianceBonus = results.length >= 3 ? 5 : 0;
  
  return Math.min(Math.round(avgConfidence + varianceBonus), 100);
}
