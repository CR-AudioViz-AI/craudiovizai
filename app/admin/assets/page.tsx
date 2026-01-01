// Build trigger: 20251231212203
'use client'

// app/admin/assets/page.tsx
// CR AudioViz AI - Javari Asset Manager Dashboard
// Henderson Standard: Fortune 50 Quality

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, 
  FolderOpen, 
  FileText, 
  Image, 
  Music, 
  Video, 
  Code,
  Package,
  BookOpen,
  Scissors,
  Type,
  Database,
  Archive,
  Box,
  Presentation,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  MoveRight,
  Eye,
  Download,
  Sparkles
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface AssetCategory {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  storage_folder: string
  allowed_extensions: string[]
  asset_count?: number
  total_size_bytes?: number
}

interface LandingZoneItem {
  id: string
  original_filename: string
  file_size_bytes: number
  file_extension: string
  status: 'pending' | 'classified' | 'needs_input' | 'processing' | 'completed' | 'failed'
  detection_confidence: number
  detection_method: string
  uploaded_at: string
  detected_category_slug: string
  detected_category_name: string
  detected_category_icon: string
  detected_folder: string
  user_category_slug?: string
  user_category_name?: string
  final_category_slug: string
  final_category_name: string
  final_folder: string
}

// =====================================================
// ICON MAPPING
// =====================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  'file-text': FileText,
  'layout': Package,
  'image': Image,
  'award': Sparkles,
  'grid-3x3': Package,
  'maximize': Image,
  'type': Type,
  'music': Music,
  'volume-2': Music,
  'mic': Music,
  'video': Video,
  'play-circle': Video,
  'code': Code,
  'package': Package,
  'scissors': Scissors,
  'grip-vertical': Scissors,
  'ruler': Scissors,
  'box': Box,
  'printer': Box,
  'table': Database,
  'database': Database,
  'presentation': Presentation,
  'archive': Archive,
  'file': FileText,
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = iconMap[icon] || FileText
  return <Icon className={className} />
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AssetManagerPage() {
  const supabase = createClient()
  
  // State
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [landingZone, setLandingZone] = useState<LandingZoneItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('v_asset_folders')
      .select('*')
      .order('category_name')

    if (error) {
      console.error('Error fetching categories:', error)
      return
    }

    setCategories(data?.map(d => ({
      id: d.category_slug,
      slug: d.category_slug,
      name: d.category_name,
      description: '',
      icon: d.icon,
      storage_folder: d.storage_folder,
      allowed_extensions: d.allowed_extensions || [],
      asset_count: d.asset_count,
      total_size_bytes: d.total_size_bytes
    })) || [])
  }, [supabase])

  const fetchLandingZone = useCallback(async () => {
    const { data, error } = await supabase
      .from('v_landing_zone_dashboard')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching landing zone:', error)
      return
    }

    setLandingZone(data || [])
  }, [supabase])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchCategories(), fetchLandingZone()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchCategories, fetchLandingZone])

  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    await uploadFiles(files)
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    await uploadFiles(files)
  }, [])

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    
    setIsUploading(true)
    
    for (const file of files) {
      try {
        // Generate temp path
        const tempPath = `landing-zone/${Date.now()}-${file.name}`
        
        // Upload to landing zone bucket
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(tempPath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Create landing zone record
        const { error: insertError } = await supabase
          .from('asset_landing_zone')
          .insert({
            original_filename: file.name,
            file_size_bytes: file.size,
            mime_type: file.type,
            file_extension: file.name.split('.').pop()?.toLowerCase(),
            temp_storage_path: tempPath
          })

        if (insertError) {
          console.error('Insert error:', insertError)
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    setIsUploading(false)
    await fetchLandingZone()
  }

  // =====================================================
  // ACTIONS
  // =====================================================

  const approveFile = async (item: LandingZoneItem, categorySlug?: string) => {
    const { error } = await supabase.rpc('process_landing_zone_item', {
      p_landing_id: item.id,
      p_category_slug: categorySlug || item.final_category_slug
    })

    if (error) {
      console.error('Process error:', error)
      return
    }

    await Promise.all([fetchLandingZone(), fetchCategories()])
  }

  const rejectFile = async (item: LandingZoneItem) => {
    const { error } = await supabase
      .from('asset_landing_zone')
      .update({ status: 'rejected' })
      .eq('id', item.id)

    if (error) {
      console.error('Reject error:', error)
      return
    }

    // Delete from storage
    await supabase.storage
      .from('assets')
      .remove([item.id])

    await fetchLandingZone()
  }

  const changeCategory = async (item: LandingZoneItem, newCategorySlug: string) => {
    const category = categories.find(c => c.slug === newCategorySlug)
    if (!category) return

    const { error } = await supabase
      .from('asset_landing_zone')
      .update({ 
        user_selected_category_id: category.id,
        status: 'classified'
      })
      .eq('id', item.id)

    if (error) {
      console.error('Update error:', error)
      return
    }

    await fetchLandingZone()
  }

  // =====================================================
  // HELPERS
  // =====================================================

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'classified': return 'text-green-400 bg-green-500/20'
      case 'needs_input': return 'text-yellow-400 bg-yellow-500/20'
      case 'processing': return 'text-blue-400 bg-blue-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Javari Asset Manager
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              AI-powered asset organization • Upload anywhere, file automatically
            </p>
          </div>
          <button
            onClick={() => Promise.all([fetchCategories(), fetchLandingZone()])}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Categories */}
        <aside className="w-72 border-r border-gray-800 min-h-[calc(100vh-73px)] p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Asset Folders
          </h2>
          
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                selectedCategory === null 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="flex-1 text-left">All Assets</span>
              <span className="text-xs text-gray-500">
                {categories.reduce((sum, c) => sum + (c.asset_count || 0), 0)}
              </span>
            </button>

            {categories.map(category => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  selectedCategory === category.slug 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <CategoryIcon icon={category.icon} className="w-5 h-5" />
                <span className="flex-1 text-left truncate">{category.name}</span>
                <span className="text-xs text-gray-500">{category.asset_count || 0}</span>
              </button>
            ))}
          </div>

          {/* Storage Stats */}
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Storage Used</h3>
            <div className="text-2xl font-bold text-purple-400">
              {formatBytes(categories.reduce((sum, c) => sum + (c.total_size_bytes || 0), 0))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              across {categories.reduce((sum, c) => sum + (c.asset_count || 0), 0)} files
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            className={`
              border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-all
              ${isDragOver 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
              }
            `}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-purple-400' : 'text-gray-500'}`} />
              <p className="text-lg font-medium text-gray-300">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-purple-400 hover:underline">browse</span> to select files
              </p>
              <p className="text-xs text-gray-600 mt-3">
                Javari AI will automatically detect and organize your files
              </p>
            </label>
          </div>

          {/* Landing Zone - Pending Files */}
          {landingZone.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Pending Classification
                  <span className="text-sm font-normal text-gray-400">
                    ({landingZone.filter(i => i.status !== 'completed').length} files)
                  </span>
                </h2>
                <button
                  onClick={async () => { for (const item of landingZone.filter(i => i.status !== 'completed' && i.final_category_slug)) { await approveFile(item) } }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve All with Category
                </button>
              </div>

              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Detected Category</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingZone.map(item => (
                      <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <CategoryIcon 
                              icon={item.detected_category_icon} 
                              className="w-5 h-5 text-gray-400" 
                            />
                            <div>
                              <p className="font-medium truncate max-w-[200px]">
                                {item.original_filename}
                              </p>
                              <p className="text-xs text-gray-500">.{item.file_extension}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {formatBytes(item.file_size_bytes)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.final_category_slug}
                            onChange={(e) => changeCategory(item, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                          >
                            {categories.map(cat => (
                              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            → {item.final_folder}/
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${getConfidenceColor(item.detection_confidence)}`}>
                            {Math.round(item.detection_confidence * 100)}%
                          </span>
                          <p className="text-xs text-gray-500">{item.detection_method}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => approveFile(item)}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition"
                              title="Approve & File"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => rejectFile(item)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Links to Folders */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 12).map(category => (
                <a
                  key={category.slug}
                  href={`https://supabase.com/dashboard/project/kteobfyferrukqeolofj/storage/buckets/assets/${category.storage_folder}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition">
                    <CategoryIcon icon={category.icon} className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{category.name}</p>
                    <p className="text-xs text-gray-500">
                      {category.asset_count || 0} files • {formatBytes(category.total_size_bytes || 0)}
                    </p>
                  </div>
                  <MoveRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition" />
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
