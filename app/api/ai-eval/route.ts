// /api/ai-eval/route.ts
// AI Evaluation & Safety API - CR AudioViz AI
// Javari AI Quality Assurance and Monitoring
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// =============================================================================
// TYPES
// =============================================================================

interface EvalTest {
  id: string;
  name: string;
  input_prompt: string;
  input_context?: Record<string, any>;
  expected_output?: string;
  expected_contains?: string[];
  expected_not_contains?: string[];
  scoring_method: string;
  weight: number;
}

interface EvalResult {
  test_id: string;
  passed: boolean;
  score: number;
  actual_output: string;
  latency_ms: number;
  tokens_used: number;
  failure_reason?: string;
}

interface SafetyCheck {
  is_safe: boolean;
  category?: string;
  severity?: string;
  confidence: number;
  details?: string;
}

// =============================================================================
// SAFETY PATTERNS (Pre-filter)
// =============================================================================

const SAFETY_PATTERNS: { category: string; patterns: RegExp[]; severity: string }[] = [
  {
    category: 'harmful_content',
    severity: 'critical',
    patterns: [
      /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|explosive)/i,
      /how\s+to\s+(kill|murder|harm)\s+(someone|people|a\s+person)/i,
    ]
  },
  {
    category: 'jailbreak_attempt',
    severity: 'medium',
    patterns: [
      /ignore\s+(all\s+)?(previous|prior|your)\s+(instructions|rules|guidelines)/i,
      /pretend\s+(you\s+)?(have|are)\s+no\s+(rules|restrictions|limits)/i,
      /you\s+are\s+now\s+(DAN|jailbroken|unrestricted)/i,
      /bypass\s+(your\s+)?(safety|content)\s+(filters|restrictions)/i,
    ]
  },
  {
    category: 'privacy_violation',
    severity: 'high',
    patterns: [
      /what\s+is\s+(my|their|his|her)\s+(ssn|social\s+security)/i,
      /give\s+me\s+(someone'?s?|their)\s+(password|credit\s+card)/i,
    ]
  },
  {
    category: 'self_harm',
    severity: 'critical',
    patterns: [
      /how\s+to\s+(commit\s+)?suicide/i,
      /best\s+way\s+to\s+(end\s+my\s+life|kill\s+myself)/i,
    ]
  }
];

// =============================================================================
// SAFETY CHECKING
// =============================================================================

function checkSafetyPatterns(input: string): SafetyCheck {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const category of SAFETY_PATTERNS) {
    for (const pattern of category.patterns) {
      if (pattern.test(normalizedInput)) {
        return {
          is_safe: false,
          category: category.category,
          severity: category.severity,
          confidence: 0.95,
          details: `Matched pattern in category: ${category.category}`
        };
      }
    }
  }
  
  return {
    is_safe: true,
    confidence: 0.9
  };
}

// LLM-based safety check for nuanced detection
async function checkSafetyWithLLM(input: string, output: string): Promise<SafetyCheck> {
  // This would call an LLM to evaluate safety
  // For now, using pattern-based checks
  const inputCheck = checkSafetyPatterns(input);
  if (!inputCheck.is_safe) return inputCheck;
  
  // Check output for safety issues
  const outputCheck = checkSafetyPatterns(output);
  return outputCheck;
}

// Log safety violation
async function logSafetyViolation(
  violation: {
    user_id?: string;
    session_id?: string;
    user_input: string;
    ai_output?: string;
    category: string;
    severity: string;
    detected_by: string;
    confidence: number;
    action_taken: string;
  }
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get category ID
  const { data: category } = await supabase
    .from('ai_safety_categories')
    .select('id')
    .eq('name', violation.category)
    .single();
  
  await supabase.from('ai_safety_violations').insert({
    user_id: violation.user_id,
    session_id: violation.session_id,
    user_input: violation.user_input,
    ai_output: violation.ai_output,
    category_id: category?.id,
    severity: violation.severity,
    detected_by: violation.detected_by,
    detection_confidence: violation.confidence,
    action_taken: violation.action_taken
  });
}

// =============================================================================
// EVALUATION FRAMEWORK
// =============================================================================

// Score a single test
async function scoreTest(
  test: EvalTest,
  actualOutput: string,
  latencyMs: number
): Promise<EvalResult> {
  let score = 100;
  let passed = true;
  let failureReason: string | undefined;
  
  // Check expected_contains
  if (test.expected_contains && test.expected_contains.length > 0) {
    for (const expected of test.expected_contains) {
      if (!actualOutput.toLowerCase().includes(expected.toLowerCase())) {
        score -= 20;
        failureReason = `Missing expected content: "${expected}"`;
        passed = false;
      }
    }
  }
  
  // Check expected_not_contains
  if (test.expected_not_contains && test.expected_not_contains.length > 0) {
    for (const forbidden of test.expected_not_contains) {
      if (actualOutput.toLowerCase().includes(forbidden.toLowerCase())) {
        score -= 30;
        failureReason = `Contains forbidden content: "${forbidden}"`;
        passed = false;
      }
    }
  }
  
  // Check exact match if expected
  if (test.expected_output) {
    const similarity = calculateSimilarity(actualOutput, test.expected_output);
    if (similarity < 0.8) {
      score = Math.round(similarity * 100);
      if (similarity < 0.5) passed = false;
      failureReason = `Output similarity: ${Math.round(similarity * 100)}%`;
    }
  }
  
  // Penalize slow responses
  if (latencyMs > 5000) {
    score -= 10;
  } else if (latencyMs > 10000) {
    score -= 20;
  }
  
  return {
    test_id: test.id,
    passed: passed && score >= 60,
    score: Math.max(0, score),
    actual_output: actualOutput,
    latency_ms: latencyMs,
    tokens_used: Math.ceil(actualOutput.length / 4), // Rough estimate
    failure_reason: failureReason
  };
}

// Simple similarity calculation (would use embeddings in production)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.size / union.size;
}

// Run evaluation suite
async function runEvalSuite(suiteId: string, modelToTest: string): Promise<{
  run_id: string;
  status: string;
  overall_score: number;
  passed: number;
  failed: number;
  results: EvalResult[];
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get suite and tests
  const { data: suite } = await supabase
    .from('ai_eval_suites')
    .select('*')
    .eq('id', suiteId)
    .single();
  
  if (!suite) throw new Error('Suite not found');
  
  const { data: tests } = await supabase
    .from('ai_eval_tests')
    .select('*')
    .eq('suite_id', suiteId)
    .eq('is_active', true);
  
  if (!tests || tests.length === 0) {
    throw new Error('No active tests in suite');
  }
  
  // Create run record
  const { data: run } = await supabase
    .from('ai_eval_runs')
    .insert({
      suite_id: suiteId,
      triggered_by: 'api',
      model_tested: modelToTest,
      status: 'running',
      total_tests: tests.length
    })
    .select()
    .single();
  
  const results: EvalResult[] = [];
  let totalScore = 0;
  let passed = 0;
  let failed = 0;
  
  // Run each test
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      // In production, this would call the actual AI model
      // For now, simulating a response
      const mockOutput = `This is a simulated response for test: ${test.name}`;
      const latency = Date.now() - startTime;
      
      const result = await scoreTest(test, mockOutput, latency);
      results.push(result);
      
      totalScore += result.score * (test.weight || 1);
      if (result.passed) passed++;
      else failed++;
      
      // Save individual result
      await supabase.from('ai_eval_results').insert({
        run_id: run!.id,
        test_id: test.id,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        latency_ms: result.latency_ms,
        actual_input: test.input_prompt,
        actual_output: result.actual_output,
        passed: result.passed,
        score: result.score,
        failure_reason: result.failure_reason,
        model_used: modelToTest,
        tokens_used: result.tokens_used
      });
    } catch (error: any) {
      failed++;
      results.push({
        test_id: test.id,
        passed: false,
        score: 0,
        actual_output: '',
        latency_ms: Date.now() - startTime,
        tokens_used: 0,
        failure_reason: error.message
      });
    }
  }
  
  // Calculate overall score
  const totalWeight = tests.reduce((sum, t) => sum + (t.weight || 1), 0);
  const overallScore = totalScore / totalWeight;
  
  // Update run record
  const status = overallScore >= suite.pass_threshold ? 'passed' : 'failed';
  
  await supabase
    .from('ai_eval_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      passed_tests: passed,
      failed_tests: failed,
      overall_score: overallScore,
      avg_latency_ms: Math.round(
        results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length
      )
    })
    .eq('id', run!.id);
  
  return {
    run_id: run!.id,
    status,
    overall_score: overallScore,
    passed,
    failed,
    results
  };
}

// =============================================================================
// DRIFT DETECTION
// =============================================================================

async function checkForDrift(model: string): Promise<{
  has_drift: boolean;
  alerts: any[];
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const alerts: any[] = [];
  
  // Get recent performance snapshots
  const { data: recent } = await supabase
    .from('ai_performance_snapshots')
    .select('*')
    .eq('model', model)
    .order('snapshot_date', { ascending: false })
    .limit(7);
  
  if (!recent || recent.length < 2) {
    return { has_drift: false, alerts: [] };
  }
  
  const latest = recent[0];
  const previous = recent.slice(1);
  
  // Calculate baselines
  const avgQuality = previous.reduce((sum, p) => sum + (p.avg_quality_score || 0), 0) / previous.length;
  const avgLatency = previous.reduce((sum, p) => sum + (p.avg_latency_ms || 0), 0) / previous.length;
  const avgErrorRate = previous.reduce((sum, p) => sum + (p.error_rate || 0), 0) / previous.length;
  
  // Check for quality drop
  if (latest.avg_quality_score && avgQuality > 0) {
    const qualityDrop = ((avgQuality - latest.avg_quality_score) / avgQuality) * 100;
    if (qualityDrop > 10) {
      alerts.push({
        type: 'quality_drop',
        severity: qualityDrop > 20 ? 'critical' : 'high',
        metric: 'avg_quality_score',
        baseline: avgQuality,
        current: latest.avg_quality_score,
        deviation: qualityDrop
      });
    }
  }
  
  // Check for latency spike
  if (latest.avg_latency_ms && avgLatency > 0) {
    const latencyIncrease = ((latest.avg_latency_ms - avgLatency) / avgLatency) * 100;
    if (latencyIncrease > 50) {
      alerts.push({
        type: 'latency_spike',
        severity: latencyIncrease > 100 ? 'high' : 'medium',
        metric: 'avg_latency_ms',
        baseline: avgLatency,
        current: latest.avg_latency_ms,
        deviation: latencyIncrease
      });
    }
  }
  
  // Check for error rate increase
  if (latest.error_rate && avgErrorRate >= 0) {
    const errorIncrease = latest.error_rate - avgErrorRate;
    if (errorIncrease > 0.05) { // 5% increase
      alerts.push({
        type: 'error_rate',
        severity: errorIncrease > 0.1 ? 'critical' : 'high',
        metric: 'error_rate',
        baseline: avgErrorRate,
        current: latest.error_rate,
        deviation: errorIncrease * 100
      });
    }
  }
  
  // Store alerts
  for (const alert of alerts) {
    await supabase.from('ai_drift_alerts').insert({
      alert_type: alert.type,
      severity: alert.severity,
      model,
      metric: alert.metric,
      baseline_value: alert.baseline,
      current_value: alert.current,
      deviation_percent: alert.deviation
    });
  }
  
  return {
    has_drift: alerts.length > 0,
    alerts
  };
}

// =============================================================================
// FEEDBACK
// =============================================================================

async function recordFeedback(feedback: {
  user_id?: string;
  session_id?: string;
  message_id?: string;
  rating: string;
  feedback_text?: string;
  model_used?: string;
}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  await supabase.from('ai_feedback').insert(feedback);
  
  return { success: true };
}

// =============================================================================
// COST TRACKING
// =============================================================================

async function trackCost(usage: {
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get model pricing
  const { data: pricing } = await supabase
    .from('ai_model_costs')
    .select('*')
    .eq('model', usage.model)
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();
  
  const inputCost = pricing 
    ? (usage.input_tokens / 1000000) * pricing.input_cost_per_million 
    : 0;
  const outputCost = pricing 
    ? (usage.output_tokens / 1000000) * pricing.output_cost_per_million 
    : 0;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Upsert daily cost record
  const { data: existing } = await supabase
    .from('ai_cost_daily')
    .select('*')
    .eq('date', today)
    .eq('model', usage.model)
    .single();
  
  if (existing) {
    await supabase
      .from('ai_cost_daily')
      .update({
        request_count: existing.request_count + 1,
        input_tokens: existing.input_tokens + usage.input_tokens,
        output_tokens: existing.output_tokens + usage.output_tokens,
        total_tokens: existing.total_tokens + usage.input_tokens + usage.output_tokens,
        input_cost: existing.input_cost + inputCost,
        output_cost: existing.output_cost + outputCost,
        total_cost: existing.total_cost + inputCost + outputCost,
        free_tier_savings: pricing?.is_free_tier ? existing.free_tier_savings + inputCost + outputCost : existing.free_tier_savings
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('ai_cost_daily').insert({
      date: today,
      model: usage.model,
      provider: usage.provider,
      request_count: 1,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.input_tokens + usage.output_tokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: inputCost + outputCost,
      free_tier_savings: pricing?.is_free_tier ? inputCost + outputCost : 0
    });
  }
  
  return {
    cost: inputCost + outputCost,
    is_free: pricing?.is_free_tier || false
  };
}

// =============================================================================
// API HANDLERS
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    switch (action) {
      case 'suites':
        const { data: suites } = await supabase
          .from('ai_eval_suites')
          .select('*')
          .eq('is_active', true);
        return NextResponse.json({ suites });
      
      case 'runs':
        const suiteId = searchParams.get('suiteId');
        const { data: runs } = await supabase
          .from('ai_eval_runs')
          .select('*')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false })
          .limit(10);
        return NextResponse.json({ runs });
      
      case 'alerts':
        const { data: alerts } = await supabase
          .from('ai_drift_alerts')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        return NextResponse.json({ alerts });
      
      case 'costs':
        const days = parseInt(searchParams.get('days') || '7');
        const { data: costs } = await supabase
          .from('ai_cost_daily')
          .select('*')
          .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false });
        return NextResponse.json({ costs });
      
      case 'safety_stats':
        const { data: violations } = await supabase
          .from('ai_safety_violations')
          .select('category_id, severity, action_taken, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        return NextResponse.json({ 
          total: violations?.length || 0,
          violations 
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI Eval GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'check_safety':
        const safetyResult = checkSafetyPatterns(data.input);
        
        if (!safetyResult.is_safe) {
          await logSafetyViolation({
            user_id: data.user_id,
            session_id: data.session_id,
            user_input: data.input,
            category: safetyResult.category!,
            severity: safetyResult.severity!,
            detected_by: 'pre_filter',
            confidence: safetyResult.confidence,
            action_taken: 'blocked'
          });
        }
        
        return NextResponse.json(safetyResult);
      
      case 'run_eval':
        if (!data.suite_id || !data.model) {
          return NextResponse.json({ error: 'suite_id and model required' }, { status: 400 });
        }
        const evalResult = await runEvalSuite(data.suite_id, data.model);
        return NextResponse.json(evalResult);
      
      case 'check_drift':
        if (!data.model) {
          return NextResponse.json({ error: 'model required' }, { status: 400 });
        }
        const driftResult = await checkForDrift(data.model);
        return NextResponse.json(driftResult);
      
      case 'feedback':
        await recordFeedback(data);
        return NextResponse.json({ success: true });
      
      case 'track_cost':
        const costResult = await trackCost(data);
        return NextResponse.json(costResult);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI Eval POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
