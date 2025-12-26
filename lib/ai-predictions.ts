/**
 * CR AudioViz AI - Centralized AI Predictions Service
 * 
 * ALL apps use this for ML predictions.
 * Routes to appropriate AI provider based on task.
 * 
 * Features:
 * - Price predictions (travel, stocks, crypto)
 * - Demand forecasting
 * - Sentiment analysis
 * - Recommendation engines
 * - Anomaly detection
 * 
 * @author CR AudioViz AI
 * @created December 25, 2025
 */

import OpenAI from 'openai';

// Initialize AI providers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type PredictionType = 
  | 'price_forecast'      // Predict future prices
  | 'demand_forecast'     // Predict demand/availability
  | 'sentiment'           // Analyze sentiment
  | 'recommendation'      // Generate recommendations
  | 'anomaly_detection'   // Detect unusual patterns
  | 'trend_analysis';     // Analyze trends

export interface PredictionRequest {
  type: PredictionType;
  domain: 'travel' | 'finance' | 'ecommerce' | 'general';
  data: Record<string, any>;
  options?: {
    confidenceThreshold?: number;
    historicalDays?: number;
    modelPreference?: 'fast' | 'accurate' | 'balanced';
  };
}

export interface PriceForecastData {
  currentPrice: number;
  historicalPrices?: { date: string; price: number }[];
  itemType: string;
  destination?: string;
  checkInDate?: string;
  checkOutDate?: string;
  provider?: string;
}

export interface PredictionResult {
  success: boolean;
  prediction?: {
    value: any;
    confidence: number;
    recommendation: string;
    explanation: string;
    factors?: string[];
    timestamp: string;
  };
  error?: string;
  credits_used?: number;
}

/**
 * Main prediction function - routes to appropriate model
 */
export async function getPrediction(request: PredictionRequest): Promise<PredictionResult> {
  try {
    switch (request.type) {
      case 'price_forecast':
        return await predictPrice(request.data as PriceForecastData, request.domain, request.options);
      
      case 'demand_forecast':
        return await predictDemand(request.data, request.domain, request.options);
      
      case 'sentiment':
        return await analyzeSentiment(request.data, request.options);
      
      case 'recommendation':
        return await generateRecommendation(request.data, request.domain, request.options);
      
      case 'anomaly_detection':
        return await detectAnomalies(request.data, request.options);
      
      case 'trend_analysis':
        return await analyzeTrends(request.data, request.domain, request.options);
      
      default:
        return { success: false, error: 'Unknown prediction type' };
    }
  } catch (error) {
    console.error('Prediction error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Prediction failed' 
    };
  }
}

/**
 * Price forecasting for travel, hotels, flights, etc.
 */
async function predictPrice(
  data: PriceForecastData,
  domain: string,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  // Build context for AI
  const context = buildPriceContext(data, domain);
  
  const completion = await openai.chat.completions.create({
    model: options?.modelPreference === 'accurate' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an expert price prediction AI for ${domain}. Analyze the data and provide:
1. A predicted price direction (up, down, stable)
2. Estimated price in 7 days
3. Confidence level (0-100)
4. Clear recommendation (book_now, wait, uncertain)
5. Key factors influencing the prediction
Respond in JSON format.`
      },
      {
        role: 'user',
        content: context
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        direction: result.direction || 'stable',
        predictedPrice: result.predictedPrice || data.currentPrice,
        changePercent: result.changePercent || 0,
      },
      confidence: result.confidence || 50,
      recommendation: result.recommendation || 'uncertain',
      explanation: result.explanation || 'Unable to generate explanation',
      factors: result.factors || [],
      timestamp: new Date().toISOString(),
    },
    credits_used: options?.modelPreference === 'accurate' ? 5 : 2,
  };
}

/**
 * Demand forecasting
 */
async function predictDemand(
  data: Record<string, any>,
  domain: string,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a demand forecasting AI for ${domain}. Predict demand levels and availability.
Respond in JSON with: demandLevel (low/medium/high/very_high), availabilityScore (0-100), 
bestTimeToBook, confidence, explanation.`
      },
      {
        role: 'user',
        content: JSON.stringify(data)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        demandLevel: result.demandLevel || 'medium',
        availabilityScore: result.availabilityScore || 50,
        bestTimeToBook: result.bestTimeToBook,
      },
      confidence: result.confidence || 50,
      recommendation: result.demandLevel === 'very_high' ? 'book_now' : 'wait',
      explanation: result.explanation || '',
      timestamp: new Date().toISOString(),
    },
    credits_used: 2,
  };
}

/**
 * Sentiment analysis
 */
async function analyzeSentiment(
  data: Record<string, any>,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Analyze sentiment of the provided text/reviews. 
Respond in JSON with: sentiment (positive/negative/neutral/mixed), score (-1 to 1), 
keyThemes (array), confidence, summary.`
      },
      {
        role: 'user',
        content: JSON.stringify(data)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        keyThemes: result.keyThemes || [],
      },
      confidence: result.confidence || 50,
      recommendation: result.sentiment === 'negative' ? 'review_needed' : 'all_good',
      explanation: result.summary || '',
      timestamp: new Date().toISOString(),
    },
    credits_used: 1,
  };
}

/**
 * Generate personalized recommendations
 */
async function generateRecommendation(
  data: Record<string, any>,
  domain: string,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a personalized recommendation engine for ${domain}.
Based on user preferences and history, generate top recommendations.
Respond in JSON with: recommendations (array of {item, score, reason}), 
personalizedInsight, confidence.`
      },
      {
        role: 'user',
        content: JSON.stringify(data)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        recommendations: result.recommendations || [],
        personalizedInsight: result.personalizedInsight,
      },
      confidence: result.confidence || 70,
      recommendation: 'see_recommendations',
      explanation: result.personalizedInsight || '',
      timestamp: new Date().toISOString(),
    },
    credits_used: 5,
  };
}

/**
 * Anomaly detection
 */
async function detectAnomalies(
  data: Record<string, any>,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Analyze the data for anomalies or unusual patterns.
Respond in JSON with: anomaliesFound (boolean), anomalies (array of {type, severity, description}),
overallRisk (low/medium/high), recommendation, confidence.`
      },
      {
        role: 'user',
        content: JSON.stringify(data)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        anomaliesFound: result.anomaliesFound || false,
        anomalies: result.anomalies || [],
        overallRisk: result.overallRisk || 'low',
      },
      confidence: result.confidence || 60,
      recommendation: result.anomaliesFound ? 'review_required' : 'all_clear',
      explanation: result.recommendation || '',
      timestamp: new Date().toISOString(),
    },
    credits_used: 2,
  };
}

/**
 * Trend analysis
 */
async function analyzeTrends(
  data: Record<string, any>,
  domain: string,
  options?: PredictionRequest['options']
): Promise<PredictionResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze trends in the ${domain} data provided.
Respond in JSON with: overallTrend (up/down/stable/volatile), trendStrength (0-100),
keyInsights (array), predictions (short_term, medium_term, long_term), confidence.`
      },
      {
        role: 'user',
        content: JSON.stringify(data)
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    success: true,
    prediction: {
      value: {
        overallTrend: result.overallTrend || 'stable',
        trendStrength: result.trendStrength || 50,
        keyInsights: result.keyInsights || [],
        predictions: result.predictions || {},
      },
      confidence: result.confidence || 60,
      recommendation: result.overallTrend === 'up' ? 'positive_outlook' : 'monitor',
      explanation: result.keyInsights?.join('. ') || '',
      factors: result.keyInsights,
      timestamp: new Date().toISOString(),
    },
    credits_used: 5,
  };
}

/**
 * Build context string for price prediction
 */
function buildPriceContext(data: PriceForecastData, domain: string): string {
  let context = `Domain: ${domain}\n`;
  context += `Item Type: ${data.itemType}\n`;
  context += `Current Price: $${data.currentPrice}\n`;
  
  if (data.destination) context += `Destination: ${data.destination}\n`;
  if (data.checkInDate) context += `Check-in: ${data.checkInDate}\n`;
  if (data.checkOutDate) context += `Check-out: ${data.checkOutDate}\n`;
  if (data.provider) context += `Provider: ${data.provider}\n`;
  
  if (data.historicalPrices?.length) {
    context += `Historical Prices (last ${data.historicalPrices.length} days):\n`;
    data.historicalPrices.slice(-10).forEach(hp => {
      context += `  ${hp.date}: $${hp.price}\n`;
    });
  }
  
  return context;
}

export default {
  getPrediction,
};
