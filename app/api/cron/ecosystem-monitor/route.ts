import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const ECOSYSTEM_APPS = [
  { name: "CR AudioViz AI", url: "https://craudiovizai.com", critical: true },
  { name: "Javari AI", url: "https://javariai.com", critical: true },
  { name: "CravBarrels", url: "https://barrelverse.vercel.app", critical: true },
  { name: "CravCards", url: "https://crav-cardverse.vercel.app", critical: true },
  { name: "Market Oracle", url: "https://crav-market-oracle.vercel.app", critical: false },
  { name: "Orlando Deals", url: "https://crav-orlando-deals.vercel.app", critical: false },
  { name: "Invoice Generator", url: "https://crav-invoice-generator.vercel.app", critical: false },
  { name: "Social Graphics", url: "https://crav-social-graphics.vercel.app", critical: false },
  { name: "PDF Builder", url: "https://crav-pdf-builder.vercel.app", critical: false },
]

async function checkApp(app: typeof ECOSYSTEM_APPS[0]) {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    const res = await fetch(app.url, { signal: controller.signal })
    clearTimeout(timeout)
    
    // Also try health endpoint
    let healthStatus = null
    try {
      const healthRes = await fetch(`${app.url}/api/health`, { signal: AbortSignal.timeout(5000) })
      if (healthRes.ok) {
        healthStatus = await healthRes.json()
      }
    } catch {}
    
    return {
      name: app.name,
      url: app.url,
      status: res.ok ? "healthy" : "unhealthy",
      httpCode: res.status,
      latency_ms: Date.now() - start,
      critical: app.critical,
      healthCheck: healthStatus
    }
  } catch (e: any) {
    return {
      name: app.name,
      url: app.url,
      status: "error",
      error: e.message,
      latency_ms: Date.now() - start,
      critical: app.critical
    }
  }
}

async function sendDiscordAlert(message: string, severity: "info" | "warning" | "critical") {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return
  
  const colors = { info: 0x00ff00, warning: 0xffff00, critical: 0xff0000 }
  
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: severity === "critical" ? "🚨 CRITICAL ALERT" : severity === "warning" ? "⚠️ Warning" : "ℹ️ Info",
          description: message,
          color: colors[severity],
          timestamp: new Date().toISOString(),
          footer: { text: "CR AudioViz AI Ecosystem Monitor" }
        }]
      })
    })
  } catch {}
}

export async function GET(request: Request) {
  // Verify cron secret for scheduled runs
  const authHeader = request.headers.get("authorization")
  const isScheduled = authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  // Check all apps in parallel
  const results = await Promise.all(ECOSYSTEM_APPS.map(checkApp))
  
  // Analyze results
  const healthy = results.filter(r => r.status === "healthy")
  const unhealthy = results.filter(r => r.status !== "healthy")
  const criticalDown = unhealthy.filter(r => r.critical)
  
  // Store in database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase.from("ecosystem_health_logs").insert({
      timestamp: new Date().toISOString(),
      total_apps: results.length,
      healthy_count: healthy.length,
      unhealthy_count: unhealthy.length,
      critical_down: criticalDown.length,
      results: results,
      overall_status: criticalDown.length > 0 ? "critical" : unhealthy.length > 0 ? "degraded" : "healthy"
    })
  } catch {}
  
  // Send alerts if issues detected (only on scheduled runs)
  if (isScheduled && criticalDown.length > 0) {
    const message = criticalDown.map(a => `❌ ${a.name}: ${a.error || a.httpCode}`).join("\n")
    await sendDiscordAlert(`Critical services down:\n${message}`, "critical")
  } else if (isScheduled && unhealthy.length > 0) {
    const message = unhealthy.map(a => `⚠️ ${a.name}: ${a.error || a.httpCode}`).join("\n")
    await sendDiscordAlert(`Services degraded:\n${message}`, "warning")
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall_status: criticalDown.length > 0 ? "critical" : unhealthy.length > 0 ? "degraded" : "healthy",
    summary: {
      total: results.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      critical_down: criticalDown.length
    },
    apps: results
  })
}
