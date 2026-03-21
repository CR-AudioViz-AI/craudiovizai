// app/api/tools/ebook-creator/route.ts
// CR AudioViz AI — E-book Creator API
// Route: /api/tools/ebook-creator
// Generate formatted e-books from text content.
// Updated: March 21, 2026 — Pre-charge pattern: deduct BEFORE generation, refund on failure.
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const dynamic = 'force-dynamic'

const EBOOK_COST = 5  // credits — established before any execution

interface EbookRequest {
  title:                  string
  author:                 string
  content:                string
  format:                 'pdf' | 'epub' | 'mobi'
  fontSize:               number
  fontFamily:             string
  includeTableOfContents: boolean
  chapters?: Array<{ title: string; content: string }>
}

export async function POST(request: Request) {
  const supabase = createClient()
  let userId: string | null = null
  let creditDeducted = false

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized — please sign in to use E-book Creator' },
        { status: 401 }
      )
    }
    userId = session.user.id

    const body: EbookRequest = await request.json()
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // ── Pre-charge: check and deduct BEFORE any generation work ──────────
    // If generation fails, we refund. This prevents free usage on partial runs.
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < EBOOK_COST) {
      return NextResponse.json(
        {
          error:     'Insufficient credits',
          required:  EBOOK_COST,
          available: profile?.credits ?? 0,
          message:   `E-book creation costs ${EBOOK_COST} credits.`,
          upgrade_url: '/pricing',
        },
        { status: 402 }
      )
    }

    // Deduct now — before generation begins
    const { error: deductErr } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - EBOOK_COST })
      .eq('id', userId)

    if (deductErr) {
      return NextResponse.json(
        { error: 'Failed to deduct credits — please retry' },
        { status: 500 }
      )
    }
    creditDeducted = true

    // Record pre-charge transaction
    await supabase.from('credit_transactions').insert({
      user_id:       userId,
      amount:        -EBOOK_COST,
      type:          'usage',
      description:   `E-book generation started: ${body.title}`,
      balance_after: profile.credits - EBOOK_COST,
    })

    console.log('CREDITS_USED', {
      route:     'ebook-creator',
      cost:      EBOOK_COST,
      userId:    userId.slice(0, 8) + '…',
      timestamp: new Date().toISOString(),
    })

    // ── Format validation ─────────────────────────────────────────────────
    if (body.format !== 'pdf' && body.format !== 'epub') {
      // Refund — unsupported format is our fault, not user error
      await refundCredits(supabase, userId, EBOOK_COST, profile.credits, 'Unsupported format')
      return NextResponse.json(
        { error: 'Unsupported format. Currently supporting PDF and EPUB.' },
        { status: 400 }
      )
    }

    // ── Generation ────────────────────────────────────────────────────────
    let ebookBuffer: Buffer
    let mimeType: string
    let filename: string

    if (body.format === 'pdf') {
      ebookBuffer = await generatePDF(body)
      mimeType    = 'application/pdf'
      filename    = `${body.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
    } else {
      ebookBuffer = await generateEPUB(body)
      mimeType    = 'application/epub+zip'
      filename    = `${body.title.replace(/[^a-z0-9]/gi, '_')}.epub`
    }

    // ── Upload to Supabase Storage ────────────────────────────────────────
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(`ebooks/${userId}/${filename}`, ebookBuffer, {
        contentType: mimeType,
        upsert:      true,
      })

    if (uploadError) throw uploadError

    // ── Save asset record ─────────────────────────────────────────────────
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        user_id:      userId,
        type:         'ebook',
        filename,
        storage_path: uploadData.path,
        size:         ebookBuffer.length,
        metadata:     { title: body.title, author: body.author, format: body.format },
      })
      .select()
      .single()

    if (assetError) throw assetError

    // ── Signed download URL ───────────────────────────────────────────────
    const { data: signedUrl } = await supabase.storage
      .from('assets')
      .createSignedUrl(uploadData.path, 3600)

    return NextResponse.json({
      success:           true,
      asset_id:          asset.id,
      download_url:      signedUrl?.signedUrl,
      filename,
      credits_used:      EBOOK_COST,
      credits_remaining: profile.credits - EBOOK_COST,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ebook-creator] generation error:', msg)

    // ── Auto-refund on platform error — Henderson Standard customer policy ─
    if (creditDeducted && userId) {
      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        if (currentProfile) {
          await refundCredits(supabase, userId, EBOOK_COST, currentProfile.credits, `Generation failed: ${msg}`)
          return NextResponse.json(
            { error: 'Failed to generate e-book. Credits have been automatically refunded.', details: msg },
            { status: 500 }
          )
        }
      } catch (refundErr) {
        console.error('[ebook-creator] refund failed after generation error:', refundErr)
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate e-book', details: msg },
      { status: 500 }
    )
  }
}

// ── Refund helper ────────────────────────────────────────────────────────────
async function refundCredits(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
  currentBalance: number,
  reason: string,
): Promise<void> {
  await supabase.from('profiles')
    .update({ credits: currentBalance + amount })
    .eq('id', userId)

  await supabase.from('credit_transactions').insert({
    user_id:       userId,
    amount:        amount,
    type:          'refund',
    description:   `Auto-refund: ${reason}`,
    balance_after: currentBalance + amount,
  })

  console.log('CREDITS_REFUNDED', {
    route:  'ebook-creator',
    amount,
    userId: userId.slice(0, 8) + '…',
    reason,
  })
}

// ── PDF generator ────────────────────────────────────────────────────────────
async function generatePDF(data: EbookRequest): Promise<Buffer> {
  const pdfDoc         = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  const fontSize  = data.fontSize || 12
  const margin    = 50
  const pageWidth  = 595.28
  const pageHeight = 841.89
  const maxWidth   = pageWidth - (2 * margin)

  // Title page
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  page.drawText(data.title, {
    x: margin, y: pageHeight - 100,
    size: 24, font: timesRomanBold, color: rgb(0, 0, 0),
  })
  if (data.author) {
    page.drawText(`by ${data.author}`, {
      x: margin, y: pageHeight - 140,
      size: 16, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3),
    })
  }

  // Content pages
  let yPosition = pageHeight - margin
  page = pdfDoc.addPage([pageWidth, pageHeight])

  for (const line of data.content.split('\n')) {
    if (!line.trim()) { yPosition -= fontSize * 1.5; continue }
    const words = line.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine  = currentLine + word + ' '
      const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize)
      if (textWidth > maxWidth && currentLine.length > 0) {
        page.drawText(currentLine, { x: margin, y: yPosition, size: fontSize, font: timesRomanFont, color: rgb(0, 0, 0) })
        yPosition -= fontSize * 1.5
        currentLine = word + ' '
        if (yPosition < margin) { page = pdfDoc.addPage([pageWidth, pageHeight]); yPosition = pageHeight - margin }
      } else { currentLine = testLine }
    }
    if (currentLine.trim()) {
      page.drawText(currentLine, { x: margin, y: yPosition, size: fontSize, font: timesRomanFont, color: rgb(0, 0, 0) })
      yPosition -= fontSize * 1.5
    }
    if (yPosition < margin) { page = pdfDoc.addPage([pageWidth, pageHeight]); yPosition = pageHeight - margin }
  }

  return Buffer.from(await pdfDoc.save())
}

// ── EPUB generator ───────────────────────────────────────────────────────────
async function generateEPUB(data: EbookRequest): Promise<Buffer> {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <meta charset="UTF-8">
  <style>
    body { font-family: serif; font-size: ${data.fontSize}px; line-height: 1.6; margin: 2em; }
    h1   { text-align: center; margin-bottom: 0.5em; }
    .author { text-align: center; color: #666; margin-bottom: 2em; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  ${data.author ? `<div class="author">by ${data.author}</div>` : ''}
  <div>${data.content.split('\n').map(l => `<p>${l}</p>`).join('')}</div>
</body>
</html>`
  return Buffer.from(htmlContent, 'utf-8')
}
