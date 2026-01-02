// app/api/assets/folders/route.ts
// CR AudioViz AI - Asset Folder Registry API
// Henderson Standard: Fortune 50 Quality
//
// PURPOSE: Provides a universal registry of all asset folders
// so every app in the ecosystem knows where to find assets.
//
// USAGE:
//   GET /api/assets/folders - Get all folder locations
//   GET /api/assets/folders?category=ebooks - Get specific category
//   GET /api/assets/folders?type=graphics - Get by type group

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// FOLDER GROUPS (for filtering)
// =====================================================

const FOLDER_GROUPS: Record<string, string[]> = {
  documents: ['ebooks', 'documents', 'templates', 'presentations'],
  graphics: ['graphics', 'logos', 'icons', 'backgrounds'],
  audio: ['music', 'sound-effects', 'voiceovers'],
  video: ['videos', 'animations'],
  fonts: ['fonts'],
  code: ['code', 'software'],
  crafts: ['crochet-patterns', 'knitting-patterns', 'sewing-patterns'],
  '3d': ['3d-models', 'printables'],
  data: ['spreadsheets', 'datasets'],
  archives: ['archives']
}

// =====================================================
// GET HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const includeStats = searchParams.get('stats') !== 'false'
    
    // Base query
    let query = supabase.from('v_asset_folders').select('*')
    
    // Filter by specific category
    if (category) {
      query = query.eq('category_slug', category)
    }
    
    // Filter by type group
    if (type && FOLDER_GROUPS[type]) {
      query = query.in('category_slug', FOLDER_GROUPS[type])
    }
    
    const { data: folders, error } = await query.order('category_name')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Build response
    const result: Record<string, unknown> = {
      bucketName: 'assets',
      baseUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets`,
      folders: folders?.map(f => ({
        slug: f.category_slug,
        name: f.category_name,
        path: f.storage_folder,
        icon: f.icon,
        extensions: f.allowed_extensions,
        assetCount: includeStats ? f.asset_count : undefined,
        totalSize: includeStats ? f.total_size_bytes : undefined,
        lastUpload: includeStats ? f.last_upload_at : undefined,
        // Direct links
        storageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${f.storage_folder}`,
        dashboardUrl: `https://supabase.com/dashboard/project/kteobfyferrukqeolofj/storage/buckets/assets/${f.storage_folder}`
      })) || []
    }
    
    // Add summary stats
    if (includeStats && folders) {
      result.summary = {
        totalFolders: folders.length,
        totalAssets: folders.reduce((sum, f) => sum + (f.asset_count || 0), 0),
        totalSize: folders.reduce((sum, f) => sum + (f.total_size_bytes || 0), 0),
        groups: Object.entries(FOLDER_GROUPS).map(([name, slugs]) => ({
          name,
          folders: slugs,
          assetCount: folders
            .filter(f => slugs.includes(f.category_slug))
            .reduce((sum, f) => sum + (f.asset_count || 0), 0)
        }))
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Folder registry error:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

// =====================================================
// HELPER: Get specific folder path (for other apps)
// =====================================================

export async function getAssetFolder(categorySlug: string): Promise<string | null> {
  const { data } = await supabase
    .from('asset_categories')
    .select('storage_folder')
    .eq('slug', categorySlug)
    .single()
  
  return data?.storage_folder || null
}

// =====================================================
// HELPER: Get signed URL for private asset
// =====================================================

export async function getAssetUrl(
  storagePath: string, 
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('assets')
    .createSignedUrl(storagePath, expiresIn)
  
  if (error) return null
  return data.signedUrl
}
