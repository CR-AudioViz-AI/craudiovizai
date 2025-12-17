// CR AudioViz AI - Free API Health Check API Route
// File: /app/api/health/free-apis/route.ts
// Auto-deployed: Wednesday, December 17, 2025

import { NextRequest, NextResponse } from 'next/server';

interface APIHealthStatus {
  service: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  lastChecked: Date;
  message?: string;
  fallback?: string;
  isFree: boolean;
  annualValue: number;
}

interface APIConfig {
  name: string;
  category: string;
  testUrl: string;
  timeout: number;
  fallbacks: string[];
  isFree: boolean;
  annualValue: number;
}

const FREE_APIS: APIConfig[] = [
  { name: 'quickchart', category: 'Visualization', testUrl: 'https://quickchart.io/healthcheck', timeout: 3000, fallbacks: [], isFree: true, annualValue: 0 },
  { name: 'coincap', category: 'Financial', testUrl: 'https://api.coincap.io/v2/assets/bitcoin', timeout: 5000, fallbacks: ['coingecko'], isFree: true, annualValue: 0 },
  { name: 'coingecko', category: 'Financial', testUrl: 'https://api.coingecko.com/api/v3/ping', timeout: 5000, fallbacks: ['coincap'], isFree: true, annualValue: 240 },
  { name: 'scryfall', category: 'Gaming', testUrl: 'https://api.scryfall.com/cards/random', timeout: 5000, fallbacks: [], isFree: true, annualValue: 0 },
  { name: 'pokeapi', category: 'Gaming', testUrl: 'https://pokeapi.co/api/v2/pokemon/pikachu', timeout: 5000, fallbacks: [], isFree: true, annualValue: 0 },
  { name: 'ip_api', category: 'Geolocation', testUrl: 'http://ip-api.com/json/8.8.8.8', timeout: 3000, fallbacks: [], isFree: true, annualValue: 0 },
  { name: 'musicbrainz', category: 'Music', testUrl: 'https://musicbrainz.org/ws/2/artist/5b11f4ce-a62d-471e-81fc-a69a8278c7da?fmt=json', timeout: 5000, fallbacks: [], isFree: true, annualValue: 0 },
];

async function checkAPI(config: APIConfig): Promise<APIHealthStatus> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    const response = await fetch(config.testUrl, {
      method: 'GET',
      headers: config.name === 'musicbrainz' ? { 'User-Agent': 'CRAudioVizAI/1.0' } : {},
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    return {
      service: config.name,
      category: config.category,
      status: response.ok ? (latency < 1000 ? 'healthy' : 'degraded') : 'degraded',
      latency,
      lastChecked: new Date(),
      message: response.ok ? 'OK' : `HTTP ${response.status}`,
      fallback: config.fallbacks[0],
      isFree: config.isFree,
      annualValue: config.annualValue
    };
  } catch (error) {
    return {
      service: config.name,
      category: config.category,
      status: 'down',
      latency: Date.now() - startTime,
      lastChecked: new Date(),
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: config.fallbacks[0],
      isFree: config.isFree,
      annualValue: config.annualValue
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const service = searchParams.get('service');

  try {
    let results = await Promise.all(FREE_APIS.map(checkAPI));
    
    if (category) results = results.filter(r => r.category.toLowerCase() === category.toLowerCase());
    if (service) results = results.filter(r => r.service.toLowerCase() === service.toLowerCase());

    const summary = {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      down: results.filter(r => r.status === 'down').length,
      totalAnnualValue: results.reduce((sum, r) => sum + r.annualValue, 0)
    };

    const overallStatus = summary.down > 0 ? 'partial_outage' : summary.degraded > 0 ? 'degraded' : 'operational';

    return NextResponse.json({
      status: overallStatus,
      message: overallStatus === 'operational' ? 'All free APIs operational' : `${summary.down} down, ${summary.degraded} degraded`,
      results,
      summary,
      timestamp: new Date().toISOString()
    }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error instanceof Error ? error.message : 'Health check failed', timestamp: new Date().toISOString() }, { status: 500 });
  }
}
