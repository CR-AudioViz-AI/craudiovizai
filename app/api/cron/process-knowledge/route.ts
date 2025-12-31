// app/api/cron/process-knowledge/route.ts
// CR AudioViz AI - Cron Job for Knowledge Processing & Alerts
// Henderson Standard: Fortune 50 Quality
// 
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/process-knowledge",
//     "schedule": "*/5 * * * *"
//   }]
// }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_KNOWLEDGE_ALERTS

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      filesProcessed: 0,
      knowledgeProcessed: 0,
      alertsSent: 0,
      errors: [] as string[]
    }

    // =====================================================
    // 1. PROCESS NEW FILE UPLOADS
    // =====================================================
    
    const { data: pendingFiles } = await supabase
      .from('storage_file_events')
      .select('*')
      .eq('processed', false)
      .limit(10)

    for (const file of pendingFiles || []) {
      try {
        // Check if it's an ebook in digital-products bucket
        if (file.bucket_id === 'digital-products' && 
            file.file_path.startsWith('ebooks/')) {
          
          // Create knowledge source if not exists
          const { data: existing } = await supabase
            .from('javari_knowledge_sources')
            .select('id')
            .eq('source_path', `${file.bucket_id}/${file.file_path}`)
            .single()

          if (!existing) {
            await supabase.from('javari_knowledge_sources').insert({
              source_type: 'ebook',
              source_name: file.file_name,
              source_path: `${file.bucket_id}/${file.file_path}`,
              title: file.file_name.replace(/\.[^.]+$/, ''),
              status: 'pending'
            })

            // Send alert
            await sendDiscordAlert({
              title: '📚 New eBook Uploaded',
              description: `**${file.file_name}** has been added to the digital products repository.`,
              color: 0x4CAF50, // Green
              fields: [
                { name: 'File', value: file.file_path, inline: true },
                { name: 'Size', value: formatBytes(file.file_size), inline: true },
                { name: 'Status', value: 'Queued for Javari AI learning', inline: false }
              ]
            })
            results.alertsSent++
          }

          // Mark file as processed
          await supabase
            .from('storage_file_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', file.id)

          results.filesProcessed++
        }
      } catch (error) {
        results.errors.push(`File ${file.id}: ${error}`)
      }
    }

    // =====================================================
    // 2. PROCESS KNOWLEDGE QUEUE
    // =====================================================

    const { data: pendingSources } = await supabase
      .from('javari_knowledge_sources')
      .select('*')
      .eq('status', 'pending')
      .limit(5)

    for (const source of pendingSources || []) {
      try {
        // Update status
        await supabase
          .from('javari_knowledge_sources')
          .update({ status: 'processing' })
          .eq('id', source.id)

        // In production, this would call the actual processor
        // For now, we'll mark it for manual processing
        console.log(`📚 Processing: ${source.source_name}`)

        // Note: Full processing would happen here with:
        // const processor = new JavariKnowledgeProcessor()
        // await processor.processSource(source.id)

        results.knowledgeProcessed++

      } catch (error) {
        await supabase
          .from('javari_knowledge_sources')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', source.id)

        results.errors.push(`Source ${source.id}: ${error}`)
      }
    }

    // =====================================================
    // 3. SEND PENDING ALERTS
    // =====================================================

    const { data: pendingAlerts } = await supabase
      .from('javari_knowledge_changelog')
      .select(`
        *,
        source:javari_knowledge_sources(source_name, source_type)
      `)
      .eq('alert_sent', false)
      .eq('change_type', 'completed')
      .limit(10)

    for (const alert of pendingAlerts || []) {
      try {
        await sendDiscordAlert({
          title: '🧠 Javari AI Knowledge Updated',
          description: `New knowledge has been processed and is now available.`,
          color: 0x2196F3, // Blue
          fields: [
            { name: 'Source', value: alert.source?.source_name || 'Unknown', inline: true },
            { name: 'Type', value: alert.source?.source_type || 'Unknown', inline: true },
            { name: 'Details', value: alert.change_description || 'No details', inline: false }
          ]
        })

        await supabase
          .from('javari_knowledge_changelog')
          .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
          .eq('id', alert.id)

        results.alertsSent++
      } catch (error) {
        results.errors.push(`Alert ${alert.id}: ${error}`)
      }
    }

    // =====================================================
    // 4. CHECK FOR FAILED ITEMS
    // =====================================================

    const { data: failedSources, count: failedCount } = await supabase
      .from('javari_knowledge_sources')
      .select('*', { count: 'exact' })
      .eq('status', 'failed')

    if (failedCount && failedCount > 0) {
      await sendDiscordAlert({
        title: '⚠️ Knowledge Processing Failures',
        description: `${failedCount} knowledge source(s) failed to process.`,
        color: 0xF44336, // Red
        fields: (failedSources || []).slice(0, 5).map(s => ({
          name: s.source_name,
          value: s.error_message || 'No error message',
          inline: false
        }))
      })
      results.alertsSent++
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('Cron error:', error)
    
    // Send error alert
    await sendDiscordAlert({
      title: '🚨 Knowledge Cron Job Failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 0xF44336
    })

    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Send Discord webhook
async function sendDiscordAlert(params: {
  title: string
  description: string
  color?: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord alert (no webhook configured):', params.title)
    return
  }

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: params.title,
        description: params.description,
        color: params.color || 0x7C3AED,
        fields: params.fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'CR AudioViz AI - Javari Knowledge System'
        }
      }]
    })
  })
}

// Format bytes helper
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}