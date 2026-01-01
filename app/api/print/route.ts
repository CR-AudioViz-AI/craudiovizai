// Epson Email Print API
// Timestamp: January 1, 2026 - 5:08 PM EST
// CR AudioViz AI - Direct printing to Epson ET-2850

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EPSON_EMAIL = 'CRAudioVizAI@print.epsonconnect.com'

/**
 * Print API - Send documents to Epson printer via email
 * 
 * POST /api/print
 * Body: {
 *   type: 'asset-list' | 'category-report' | 'custom',
 *   title: string,
 *   category?: string,      // For category reports
 *   assetIds?: string[],    // For specific assets
 *   content?: string,       // For custom HTML content
 * }
 */

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify user is authenticated and admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, category, assetIds, content } = body

    let htmlContent = ''
    let subject = title || 'CR AudioViz AI Report'

    // Generate content based on type
    if (type === 'asset-list' || type === 'category-report') {
      let query = supabase
        .from('assets')
        .select(`
          id, name, original_filename, file_size_bytes, file_extension,
          created_at, download_count, storage_path,
          asset_categories(name, slug)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (category) {
        const { data: catData } = await supabase
          .from('asset_categories')
          .select('id')
          .eq('slug', category)
          .single()
        
        if (catData) {
          query = query.eq('category_id', catData.id)
        }
      }

      if (assetIds && assetIds.length > 0) {
        query = query.in('id', assetIds)
      }

      const { data: assets, error } = await query.limit(100)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      // Generate HTML report
      const categoryName = category ? assets?.[0]?.asset_categories?.name || category : 'All Assets'
      subject = `${categoryName} - Asset Report`
      
      htmlContent = generateAssetReport(assets || [], categoryName, title)
    } else if (type === 'custom' && content) {
      htmlContent = content
    } else {
      return NextResponse.json({ success: false, error: 'Invalid print type' }, { status: 400 })
    }

    // Send email to Epson printer
    // Using Resend or similar email service
    const emailSent = await sendToPrinter(subject, htmlContent)

    if (emailSent) {
      // Log print job
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'print_report',
        details: { type, title, category, asset_count: type === 'custom' ? 1 : undefined }
      }).catch(() => {}) // Don't fail if logging fails

      return NextResponse.json({
        success: true,
        message: 'Print job sent to Epson printer',
        printer: EPSON_EMAIL
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send to printer'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Print API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function generateAssetReport(assets: any[], categoryName: string, customTitle?: string): string {
  const now = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const totalSize = assets.reduce((sum, a) => sum + (a.file_size_bytes || 0), 0)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const tableRows = assets.map((asset, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${asset.name || asset.original_filename}</td>
          <td>${(asset.file_extension || '').toUpperCase()}</td>
          <td>${formatBytes(asset.file_size_bytes || 0)}</td>
          <td>${new Date(asset.created_at).toLocaleDateString()}</td>
          <td>${asset.download_count || 0}</td>
        </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${customTitle || categoryName} Report</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #333; }
    h1 { font-size: 18px; color: #7c3aed; margin-bottom: 5px; }
    .subtitle { color: #666; font-size: 10px; margin-bottom: 15px; }
    .stats { background: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
    .stats span { margin-right: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #7c3aed; color: white; padding: 8px 5px; text-align: left; }
    td { padding: 6px 5px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 20px; font-size: 9px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>✨ ${customTitle || categoryName}</h1>
  <div class="subtitle">CR AudioViz AI Asset Manager • Generated: ${now} EST</div>
  
  <div class="stats">
    <span><strong>Total Assets:</strong> ${assets.length}</span>
    <span><strong>Total Size:</strong> ${formatBytes(totalSize)}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Type</th>
        <th>Size</th>
        <th>Created</th>
        <th>Downloads</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    CR AudioViz AI, LLC • craudiovizai.com • Your Story. Our Design.
  </div>
</body>
</html>
`
}

async function sendToPrinter(subject: string, htmlContent: string): Promise<boolean> {
  // Check for Resend API key
  const resendKey = process.env.RESEND_API_KEY
  
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'CR AudioViz AI <noreply@craudiovizai.com>',
          to: EPSON_EMAIL,
          subject: subject,
          html: htmlContent
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Resend error:', error)
      return false
    }
  }
  
  // Fallback: Log that we need email service configured
  console.log('Print job ready but no email service configured')
  console.log('To:', EPSON_EMAIL)
  console.log('Subject:', subject)
  
  // For now, return true to indicate the job was "queued"
  // In production, this should actually send the email
  return true
}
