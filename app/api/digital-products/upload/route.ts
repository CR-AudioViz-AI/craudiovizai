// app/api/digital-products/upload/route.ts
// CR AudioViz AI - Digital Product Upload API
// Henderson Standard: Fortune 50 Quality

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'video/mp4',
  'audio/mpeg',
  'audio/mp3',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp'
]

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'ebooks'
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priceInDollars = parseFloat(formData.get('price') as string || '0')
    const tags = (formData.get('tags') as string || '').split(',').filter(Boolean)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed: ${file.type}`,
        allowed: ALLOWED_MIME_TYPES 
      }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Generate file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const slug = title 
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : uuidv4()
    const filePath = `${category}/${slug}.${fileExt}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('digital-products')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
    }

    // Get category ID
    const { data: categoryData } = await supabase
      .from('digital_product_categories')
      .select('id')
      .eq('slug', category)
      .single()

    // Create product record
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .insert({
        slug,
        title: title || file.name.replace(/\.[^.]+$/, ''),
        description,
        category_id: categoryData?.id,
        tags,
        price_cents: Math.round(priceInDollars * 100),
        file_path: filePath,
        file_type: fileExt,
        file_size_bytes: file.size,
        is_active: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (productError) {
      console.error('Product creation error:', productError)
      // Clean up uploaded file
      await supabase.storage.from('digital-products').remove([filePath])
      return NextResponse.json({ error: 'Product creation failed', details: productError.message }, { status: 500 })
    }

    // Log file event for Javari processing
    await supabase.from('storage_file_events').insert({
      bucket_id: 'digital-products',
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      event_type: 'INSERT',
      metadata: { product_id: product.id, uploaded_by: user.id }
    })

    return NextResponse.json({
      success: true,
      product,
      message: 'Product uploaded successfully. Javari AI will process it for knowledge base.',
      storage_path: filePath
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET: List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('v_digital_products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category_slug', category)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: data,
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('List API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}