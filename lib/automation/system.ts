/**
 * CR AudioViz AI - Central Automation System
 * 
 * This is the BRAIN of autonomous operations.
 * Handles: Error detection, auto-healing, ticket creation,
 * deployment monitoring, and proactive maintenance.
 * 
 * Per Henderson Standard: "AI handles 99% of operations"
 * 
 * @author CR AudioViz AI
 * @created December 26, 2025
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_Z0yef7NlFu1coCJWz8UmUdI5';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// TYPES
// ============================================================

interface HealthCheck {
  app: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

interface Ticket {
  id?: string;
  type: 'bug' | 'enhancement' | 'support' | 'security' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  description: string;
  app_id?: string;
  user_id?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  auto_created: boolean;
  created_at?: string;
}

interface DeploymentStatus {
  projectId: string;
  projectName: string;
  state: string;
  url: string;
  createdAt: number;
  error?: string;
}

// ============================================================
// HEALTH MONITORING
// ============================================================

const APPS_TO_MONITOR = [
  { name: 'Main Hub', url: 'https://craudiovizai.com' },
  { name: 'Javari AI', url: 'https://javariai.com' },
  { name: 'Orlando Deals', url: 'https://orlandotripdeal.com' },
  { name: 'CravBarrels', url: 'https://cravbarrels.com' },
  { name: 'CravCards', url: 'https://cravcards.com' },
  { name: 'CravGames', url: 'https://cravgameshub.com' },
  { name: 'CravKey', url: 'https://cravkey.com' },
  { name: 'Zoyzy', url: 'https://zoyzy.com' },
  { name: 'RateUnlock', url: 'https://rateunlock.com' },
];

export async function checkAppHealth(app: { name: string; url: string }): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const response = await fetch(app.url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    const responseTime = Date.now() - start;
    
    return {
      app: app.name,
      url: app.url,
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      app: app.name,
      url: app.url,
      status: 'down',
      responseTime: Date.now() - start,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function runAllHealthChecks(): Promise<HealthCheck[]> {
  const results = await Promise.all(APPS_TO_MONITOR.map(checkAppHealth));
  
  // Auto-create tickets for down apps
  for (const result of results) {
    if (result.status === 'down') {
      await createAutoTicket({
        type: 'bug',
        priority: 'critical',
        subject: `🚨 App Down: ${result.app}`,
        description: `
          The app "${result.app}" at ${result.url} is not responding.
          
          Error: ${result.error}
          Response Time: ${result.responseTime}ms
          Checked: ${result.lastChecked.toISOString()}
          
          Automated healing will be attempted.
        `,
        app_id: result.app.toLowerCase().replace(/\s/g, '-'),
        status: 'open',
        auto_created: true,
      });
      
      // Attempt auto-healing
      await attemptAutoHeal(result);
    }
  }
  
  // Log health check results
  await logActivity('health_check', 'system', {
    total: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    degraded: results.filter(r => r.status === 'degraded').length,
    down: results.filter(r => r.status === 'down').length,
    results,
  });
  
  return results;
}

// ============================================================
// AUTO-HEALING
// ============================================================

async function attemptAutoHeal(check: HealthCheck): Promise<boolean> {
  console.log(`🔧 Attempting auto-heal for ${check.app}...`);
  
  try {
    // 1. Try to redeploy the app
    const redeployResult = await triggerRedeploy(check.app);
    
    if (redeployResult.success) {
      await logActivity('auto_heal', check.app, {
        action: 'redeploy',
        success: true,
        deploymentId: redeployResult.deploymentId,
      });
      
      // Notify about the auto-heal
      await sendNotification(
        'Auto-Heal Triggered',
        `${check.app} was down. Auto-redeploy initiated. Deployment ID: ${redeployResult.deploymentId}`,
        'info'
      );
      
      return true;
    }
  } catch (error) {
    console.error(`Auto-heal failed for ${check.app}:`, error);
    
    // Escalate to human
    await escalateToHuman(check, error);
  }
  
  return false;
}

async function triggerRedeploy(appName: string): Promise<{ success: boolean; deploymentId?: string }> {
  // Map app names to project IDs
  const projectMapping: Record<string, string> = {
    'main-hub': 'prj_8hfU0qMGwpMBksJDmEK7GUqO8IVh',
    'javari-ai': 'prj_zxjzE2qvMWFWqV0AspGvago6aPV5',
    'orlando-deals': 'prj_YOUR_PROJECT_ID', // Add actual IDs
    'cravbarrels': 'prj_YOUR_PROJECT_ID',
  };
  
  const projectId = projectMapping[appName.toLowerCase().replace(/\s/g, '-')];
  if (!projectId) {
    console.log(`No project mapping for ${appName}`);
    return { success: false };
  }
  
  // Get latest deployment and redeploy
  const response = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${TEAM_ID}&limit=1`,
    {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    }
  );
  
  const data = await response.json();
  const latestDeployment = data.deployments?.[0];
  
  if (latestDeployment) {
    // Trigger a new deployment by creating one from the same source
    const createResponse = await fetch(
      `https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: latestDeployment.name,
          gitSource: latestDeployment.meta,
          target: 'production',
        }),
      }
    );
    
    const newDeployment = await createResponse.json();
    return { success: true, deploymentId: newDeployment.id };
  }
  
  return { success: false };
}

// ============================================================
// TICKETING SYSTEM
// ============================================================

export async function createAutoTicket(ticket: Ticket): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ...ticket,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    // Send notification
    await sendNotification(
      `Ticket Created: ${ticket.subject}`,
      `Priority: ${ticket.priority}\n${ticket.description}`,
      ticket.priority === 'critical' ? 'error' : 'warning'
    );
    
    return data?.id;
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return null;
  }
}

async function escalateToHuman(check: HealthCheck, error: unknown): Promise<void> {
  // Send urgent email to Roy
  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'alerts@craudiovizai.com',
        to: 'royhenderson@craudiovizai.com',
        subject: `🚨 ESCALATION: ${check.app} - Auto-heal FAILED`,
        html: `
          <h1>Critical: Auto-Heal Failed</h1>
          <p><strong>App:</strong> ${check.app}</p>
          <p><strong>URL:</strong> ${check.url}</p>
          <p><strong>Error:</strong> ${check.error}</p>
          <p><strong>Auto-heal Error:</strong> ${error instanceof Error ? error.message : 'Unknown'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>Manual intervention required.</p>
        `,
      }),
    });
  }
  
  // Create escalation ticket
  await createAutoTicket({
    type: 'bug',
    priority: 'critical',
    subject: `🚨 ESCALATION: ${check.app} - Manual intervention required`,
    description: `Auto-heal failed. Human intervention needed.\n\nError: ${check.error}`,
    app_id: check.app,
    status: 'open',
    auto_created: true,
  });
}

// ============================================================
// DEPLOYMENT MONITORING
// ============================================================

export async function monitorDeployments(): Promise<DeploymentStatus[]> {
  const response = await fetch(
    `https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=20`,
    {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    }
  );
  
  const data = await response.json();
  const deployments = data.deployments || [];
  
  // Check for failed deployments
  const failed = deployments.filter((d: any) => d.state === 'ERROR');
  
  for (const deployment of failed) {
    // Create ticket for failed deployment
    await createAutoTicket({
      type: 'bug',
      priority: 'high',
      subject: `Deployment Failed: ${deployment.name}`,
      description: `
        Deployment ${deployment.id} for ${deployment.name} failed.
        
        URL: ${deployment.url}
        Created: ${new Date(deployment.createdAt).toISOString()}
        
        Please investigate and fix.
      `,
      app_id: deployment.name,
      status: 'open',
      auto_created: true,
    });
  }
  
  return deployments.map((d: any) => ({
    projectId: d.projectId,
    projectName: d.name,
    state: d.state,
    url: d.url,
    createdAt: d.createdAt,
  }));
}

// ============================================================
// ACTIVITY LOGGING
// ============================================================

async function logActivity(
  action: string,
  resource: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      action,
      resource,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

async function sendNotification(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error'
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// ============================================================
// SCHEDULED TASKS (Cron Jobs)
// ============================================================

export async function runScheduledTasks(): Promise<void> {
  console.log('🕐 Running scheduled tasks...');
  
  // 1. Health checks every 5 minutes
  const healthResults = await runAllHealthChecks();
  console.log(`Health check complete: ${healthResults.filter(r => r.status === 'healthy').length}/${healthResults.length} healthy`);
  
  // 2. Monitor deployments every 10 minutes
  const deployments = await monitorDeployments();
  console.log(`Deployment check complete: ${deployments.length} recent deployments`);
  
  // 3. Check for stale tickets
  await checkStaleTickets();
  
  console.log('✅ Scheduled tasks complete');
}

async function checkStaleTickets(): Promise<void> {
  // Find tickets that have been open for more than 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: staleTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('status', 'open')
    .lt('created_at', yesterday);
  
  for (const ticket of staleTickets || []) {
    // Escalate stale tickets
    await supabase
      .from('tickets')
      .update({ 
        priority: 'high',
        notes: 'Auto-escalated due to being open > 24 hours'
      })
      .eq('id', ticket.id);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  checkAppHealth,
  runAllHealthChecks,
  createAutoTicket,
  monitorDeployments,
  runScheduledTasks,
};
