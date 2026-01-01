// Universal Asset Registry API
// Timestamp: January 1, 2026 - 4:50 AM EST
// CR AudioViz AI - Central asset access for all apps

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Universal Asset Registry API
 * 
 * GET /api/assets
 *   ?category=ebooks         - Filter by category slug
 *   ?search=whiskey          - Search by name/filename
 *   ?type=docx               - Filter by file extension
 *   ?limit=50                - Limit results (default 100)
 *   ?offset=0                - Pagination offset
 *   ?sort=created_at         - Sort field
 *   &order=desc              - Sort order
 * 
 * Response:
 * {
 *   success: true,
 *   data: Asset[],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     category?: string
 *   }
 * }
 */

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    
    // Build query
    let query = supabase
      .from('assets')
      .select(`
        id, name, slug, original_filename, file_size_bytes, mime_type,
        file_extension, storage_path, category_id, status, created_at,
        updated_at, download_count, view_count, is_public, is_free, tags,
        asset_categories!inner(slug, name, storage_folder)
      `, { count: 'exact' })
      .eq('status', 'active')
    
    // Category filter
    if (category) {
      query = query.eq('asset_categories.slug', category)
    }
    
    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,original_filename.ilike.%${search}%`)
    }
    
    // Type filter
    if (type) {
      query = query.eq('file_extension', type.toLowerCase())
    }
    
    // Sorting
    const validSorts = ['created_at', 'updated_at', 'name', 'file_size_bytes', 'download_count']
    if (validSorts.includes(sort)) {
      query = query.order(sort, { ascending: order === 'asc' })
    }
    
    // Pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    // Format response
    const assets = data?.map(asset => ({
      id: asset.id,
      name: asset.name,
      slug: asset.slug,
      filename: asset.original_filename,
      size: asset.file_size_bytes,
      sizeFormatted: formatBytes(asset.file_size_bytes),
      mimeType: asset.mime_type,
      extension: asset.file_extension,
      path: asset.storage_path,
      category: {
        slug: asset.asset_categories?.slug,
        name: asset.asset_categories?.name,
        folder: asset.asset_categories?.storage_folder
      },
      isPublic: asset.is_public,
      isFree: asset.is_free,
      downloads: asset.download_count || 0,
      views: asset.view_count || 0,
      tags: asset.tags || [],
      createdAt: asset.created_at,
      updatedAt: asset.updated_at
    })) || []
    
    return NextResponse.json({
      success: true,
      data: assets,
      meta: {
        total: count || 0,
        limit,
        offset,
        category: category || undefined,
        search: search || undefined
      }
    })
    
  } catch (error) {
    console.error('Asset registry error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
