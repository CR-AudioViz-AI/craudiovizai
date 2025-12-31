// app/api/assets/upload/route.ts
// CR AudioViz AI - Javari Asset Upload API
// Henderson Standard: Fortune 50 Quality

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// FILE TYPE DETECTION RULES
// =====================================================

const CATEGORY_RULES: Record<string, {
  extensions: string[]
  mimePatterns: string[]
  keywords: string[]
}> = {
  // Documents
  'ebooks': {
    extensions: ['pdf', 'epub', 'mobi', 'azw3'],
    mimePatterns: ['application/pdf', 'application/epub'],
    keywords: ['ebook', 'book', 'guide', 'manual', 'chapter']
  },
  'documents': {
    extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'rtf', 'odt'],
    mimePatterns: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml', 'text/'],
    keywords: ['document', 'report', 'article', 'paper']
  },
  'templates': {
    extensions: ['psd', 'ai', 'fig', 'sketch', 'xd'],
    mimePatterns: ['application/'],
    keywords: ['template', 'layout', 'mockup', 'wireframe']
  },
  
  // Graphics
  'graphics': {
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
    mimePatterns: ['image/'],
    keywords: ['graphic', 'image', 'illustration', 'design', 'artwork']
  },
  'logos': {
    extensions: ['svg', 'png', 'ai', 'eps'],
    mimePatterns: ['image/svg', 'image/png'],
    keywords: ['logo', 'brand', 'identity', 'mark', 'icon', 'emblem']
  },
  'icons': {
    extensions: ['svg', 'png', 'ico', 'icns'],
    mimePatterns: ['image/svg', 'image/png', 'image/x-icon'],
    keywords: ['icon', 'iconset', 'ui', 'symbol']
  },
  'backgrounds': {
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    mimePatterns: ['image/'],
    keywords: ['background', 'wallpaper', 'pattern', 'texture', 'backdrop']
  },
  
  // Fonts
  'fonts': {
    extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    mimePatterns: ['font/', 'application/font', 'application/x-font'],
    keywords: ['font', 'typeface', 'typography']
  },
  
  // Audio
  'music': {
    extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'],
    mimePatterns: ['audio/'],
    keywords: ['music', 'song', 'track', 'album', 'soundtrack']
  },
  'sound-effects': {
    extensions: ['mp3', 'wav', 'ogg', 'aiff'],
    mimePatterns: ['audio/'],
    keywords: ['sfx', 'sound effect', 'foley', 'ambience', 'effect']
  },
  'voiceovers': {
    extensions: ['mp3', 'wav', 'aiff', 'm4a'],
    mimePatterns: ['audio/'],
    keywords: ['voiceover', 'narration', 'voice', 'speech', 'recording']
  },
  
  // Video
  'videos': {
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    mimePatterns: ['video/'],
    keywords: ['video', 'movie', 'clip', 'footage', 'film']
  },
  'animations': {
    extensions: ['gif', 'json', 'lottie'],
    mimePatterns: ['image/gif', 'application/json'],
    keywords: ['animation', 'animated', 'motion', 'lottie', 'gif']
  },
  
  // Code
  'code': {
    extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'css', 'html', 'vue', 'svelte'],
    mimePatterns: ['text/javascript', 'application/json', 'text/css', 'text/html'],
    keywords: ['code', 'script', 'source', 'component', 'module']
  },
  'software': {
    extensions: ['zip', 'dmg', 'exe', 'msi', 'deb', 'rpm', 'appimage'],
    mimePatterns: ['application/zip', 'application/octet-stream'],
    keywords: ['software', 'app', 'application', 'installer', 'package']
  },
  
  // Crafts
  'crochet-patterns': {
    extensions: ['pdf', 'docx', 'jpg', 'png'],
    mimePatterns: ['application/pdf', 'image/'],
    keywords: ['crochet', 'amigurumi', 'yarn', 'hook', 'stitch', 'granny']
  },
  'knitting-patterns': {
    extensions: ['pdf', 'docx', 'jpg', 'png'],
    mimePatterns: ['application/pdf', 'image/'],
    keywords: ['knitting', 'knit', 'yarn', 'needle', 'sweater', 'sock']
  },
  'sewing-patterns': {
    extensions: ['pdf', 'svg', 'dxf'],
    mimePatterns: ['application/pdf', 'image/svg'],
    keywords: ['sewing', 'quilt', 'fabric', 'dress', 'garment', 'pattern']
  },
  
  // 3D
  '3d-models': {
    extensions: ['obj', 'fbx', 'glb', 'gltf', 'stl', 'blend'],
    mimePatterns: ['model/', 'application/octet-stream'],
    keywords: ['3d', 'model', 'mesh', 'blender', 'unity', 'cad']
  },
  'printables': {
    extensions: ['stl', 'obj', 'gcode', '3mf'],
    mimePatterns: ['application/'],
    keywords: ['print', 'stl', '3d print', 'maker', 'filament']
  },
  
  // Data
  'spreadsheets': {
    extensions: ['xlsx', 'xls', 'csv', 'ods'],
    mimePatterns: ['application/vnd.openxmlformats-officedocument.spreadsheetml', 'text/csv'],
    keywords: ['spreadsheet', 'excel', 'csv', 'data', 'table']
  },
  'datasets': {
    extensions: ['json', 'csv', 'xml', 'sql', 'db'],
    mimePatterns: ['application/json', 'text/csv', 'application/xml'],
    keywords: ['dataset', 'data', 'database', 'records']
  },
  
  // Presentations
  'presentations': {
    extensions: ['pptx', 'ppt', 'key', 'odp'],
    mimePatterns: ['application/vnd.openxmlformats-officedocument.presentationml', 'application/vnd.ms-powerpoint'],
    keywords: ['presentation', 'slides', 'powerpoint', 'keynote', 'deck']
  },
  
  // Archives
  'archives': {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    mimePatterns: ['application/zip', 'application/x-rar', 'application/x-7z'],
    keywords: ['archive', 'zip', 'compressed', 'bundle']
  }
}

// =====================================================
// AI CLASSIFICATION
// =====================================================

interface ClassificationResult {
  categorySlug: string
  confidence: number
  method: 'extension' | 'mime' | 'keyword' | 'ai' | 'default'
  analysis?: Record<string, unknown>
}

function classifyFile(filename: string, mimeType?: string): ClassificationResult {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const lowerFilename = filename.toLowerCase()
  
  // Method 1: Extension matching (highest confidence)
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    if (rules.extensions.includes(ext)) {
      // Double-check with keywords for specificity
      const hasKeyword = rules.keywords.some(kw => lowerFilename.includes(kw))
      return {
        categorySlug: category,
        confidence: hasKeyword ? 0.95 : 0.85,
        method: 'extension'
      }
    }
  }
  
  // Method 2: MIME type matching
  if (mimeType) {
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      if (rules.mimePatterns.some(pattern => mimeType.startsWith(pattern))) {
        return {
          categorySlug: category,
          confidence: 0.80,
          method: 'mime'
        }
      }
    }
  }
  
  // Method 3: Keyword matching in filename
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    if (rules.keywords.some(kw => lowerFilename.includes(kw))) {
      return {
        categorySlug: category,
        confidence: 0.70,
        method: 'keyword'
      }
    }
  }
  
  // Default: Other
  return {
    categorySlug: 'other',
    confidence: 0.30,
    method: 'default'
  }
}

// =====================================================
// API HANDLERS
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    
    const results = []
    
    for (const file of files) {
      // Classify the file
      const classification = classifyFile(file.name, file.type)
      
      // Generate temp path
      const tempPath = `landing-zone/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${file.name}`
      
      // Upload to landing zone
      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(tempPath, arrayBuffer, {
          contentType: file.type,
          upsert: false
        })
      
      if (uploadError) {
        results.push({
          filename: file.name,
          success: false,
          error: uploadError.message
        })
        continue
      }
      
      // Get category ID
      const { data: category } = await supabase
        .from('asset_categories')
        .select('id')
        .eq('slug', classification.categorySlug)
        .single()
      
      // Create landing zone record
      const { data: landing, error: insertError } = await supabase
        .from('asset_landing_zone')
        .insert({
          original_filename: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          file_extension: file.name.split('.').pop()?.toLowerCase(),
          temp_storage_path: tempPath,
          detected_category_id: category?.id,
          detection_confidence: classification.confidence,
          detection_method: classification.method,
          ai_analysis: classification.analysis || {},
          status: classification.confidence >= 0.80 ? 'classified' : 'needs_input'
        })
        .select()
        .single()
      
      if (insertError) {
        results.push({
          filename: file.name,
          success: false,
          error: insertError.message
        })
        continue
      }
      
      results.push({
        filename: file.name,
        success: true,
        id: landing?.id,
        classification: {
          category: classification.categorySlug,
          confidence: Math.round(classification.confidence * 100),
          method: classification.method
        },
        status: landing?.status
      })
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// =====================================================
// PROCESS LANDING ZONE ITEM
// =====================================================

export async function PUT(request: NextRequest) {
  try {
    const { landingId, categorySlug, action } = await request.json()
    
    if (!landingId) {
      return NextResponse.json({ error: 'Missing landingId' }, { status: 400 })
    }
    
    // Get landing zone item
    const { data: landing, error: fetchError } = await supabase
      .from('asset_landing_zone')
      .select('*, detected_category:asset_categories!detected_category_id(*)')
      .eq('id', landingId)
      .single()
    
    if (fetchError || !landing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    // Handle actions
    switch (action) {
      case 'approve': {
        // Get target category
        const targetSlug = categorySlug || landing.detected_category?.slug
        const { data: category } = await supabase
          .from('asset_categories')
          .select('*')
          .eq('slug', targetSlug)
          .single()
        
        if (!category) {
          return NextResponse.json({ error: 'Category not found' }, { status: 400 })
        }
        
        // Generate final path
        const finalPath = `${category.storage_folder}/${landing.original_filename}`
        
        // Move file in storage
        const { error: moveError } = await supabase.storage
          .from('assets')
          .move(landing.temp_storage_path, finalPath)
        
        if (moveError) {
          return NextResponse.json({ error: 'Failed to move file', details: moveError.message }, { status: 500 })
        }
        
        // Create asset record
        const { data: asset, error: assetError } = await supabase
          .from('assets')
          .insert({
            name: landing.original_filename.replace(/\.[^.]+$/, ''),
            slug: landing.original_filename.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            category_id: category.id,
            original_filename: landing.original_filename,
            storage_path: finalPath,
            file_size_bytes: landing.file_size_bytes,
            mime_type: landing.mime_type,
            file_extension: landing.file_extension,
            ai_analysis: landing.ai_analysis
          })
          .select()
          .single()
        
        if (assetError) {
          return NextResponse.json({ error: 'Failed to create asset', details: assetError.message }, { status: 500 })
        }
        
        // Update landing zone
        await supabase
          .from('asset_landing_zone')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            final_asset_id: asset?.id
          })
          .eq('id', landingId)
        
        return NextResponse.json({
          success: true,
          asset,
          finalPath,
          category: category.name
        })
      }
      
      case 'reject': {
        // Delete from storage
        await supabase.storage
          .from('assets')
          .remove([landing.temp_storage_path])
        
        // Update status
        await supabase
          .from('asset_landing_zone')
          .update({ status: 'rejected' })
          .eq('id', landingId)
        
        return NextResponse.json({ success: true, action: 'rejected' })
      }
      
      case 'reclassify': {
        if (!categorySlug) {
          return NextResponse.json({ error: 'Missing categorySlug for reclassify' }, { status: 400 })
        }
        
        const { data: newCategory } = await supabase
          .from('asset_categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        
        await supabase
          .from('asset_landing_zone')
          .update({
            user_selected_category_id: newCategory?.id,
            status: 'classified'
          })
          .eq('id', landingId)
        
        return NextResponse.json({ success: true, action: 'reclassified', newCategory: categorySlug })
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json({
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// =====================================================
// GET LANDING ZONE STATUS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = supabase
      .from('v_landing_zone_dashboard')
      .select('*')
      .order('uploaded_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.not('status', 'in', '(completed,rejected)')
    }
    
    const { data, error } = await query.limit(100)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Also get category summary
    const { data: categories } = await supabase
      .from('v_asset_folders')
      .select('*')
      .order('category_name')
    
    return NextResponse.json({
      landingZone: data || [],
      categories: categories || [],
      stats: {
        pending: data?.filter(d => d.status === 'pending').length || 0,
        classified: data?.filter(d => d.status === 'classified').length || 0,
        needsInput: data?.filter(d => d.status === 'needs_input').length || 0
      }
    })
    
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
