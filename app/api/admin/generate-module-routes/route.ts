/**
 * CR AudioViz AI - Module Route Generator API
 * ==========================================
 * 
 * Generates placeholder routes for all registered modules
 * 
 * @version 1.0.1
 * @date January 1, 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ModuleInfo {
  module_slug: string
  module_name: string
  definition: {
    icon?: string
    description?: string
    family?: string
    revenueModel?: string
  }
}

export async function GET() {
  try {
    const { data: modules, error } = await supabase
      .from('module_registry')
      .select('module_slug, module_name, definition')
      .order('module_slug')
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    const moduleList = (modules || []).map(m => ({
      slug: m.module_slug,
      name: m.module_name,
      pageRoute: '/' + m.module_slug,
      apiRoute: '/api/' + m.module_slug
    }))
    
    return NextResponse.json({
      success: true,
      modules: modules?.length || 0,
      message: 'POST to generate route files for all modules',
      moduleList,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: modules, error } = await supabase
      .from('module_registry')
      .select('module_slug, module_name, definition')
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    const generated: Array<{
      module: string
      page: string
      api: string
    }> = []
    
    for (const mod of modules || []) {
      generated.push({
        module: mod.module_slug,
        page: 'app/' + mod.module_slug + '/page.tsx',
        api: 'app/api/' + mod.module_slug + '/route.ts'
      })
    }
    
    return NextResponse.json({
      success: true,
      generated: generated.length,
      routes: generated,
      note: 'Route files need to be created via GitHub API or manual deployment',
      nextStep: 'Call /api/admin/deploy-module-routes to push files to GitHub',
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
