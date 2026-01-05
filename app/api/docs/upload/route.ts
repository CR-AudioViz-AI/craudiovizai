// ================================================================================
// JAVARI DOCUMENT UPLOAD API - /api/docs/upload
// RULE: NEVER REJECT ANY FILE TYPE. ALWAYS STORE RAW FILE.
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const generateId = () => `doc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// NEVER reject - always attempt processing
const EXTRACTORS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'text/html': 'html',
  'application/json': 'json',
  'image/png': 'ocr',
  'image/jpeg': 'ocr',
  'image/gif': 'ocr',
  'image/webp': 'ocr',
  'application/zip': 'zip',
  'audio/mpeg': 'transcribe',
  'audio/wav': 'transcribe',
  'video/mp4': 'transcribe',
};

// POST - Upload document (NEVER REJECT)
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;
    const sessionId = formData.get('session_id') as string;
    const projectId = formData.get('project_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const docId = generateId();
    const filename = file.name;
    const mimeType = file.type || 'application/octet-stream';
    const fileSize = file.size;
    const extension = filename.split('.').pop()?.toLowerCase() || 'bin';
    
    // Generate storage path
    const storagePath = `uploads/${userId || 'anonymous'}/${docId}/${filename}`;

    // Convert to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ALWAYS store raw file first (never reject)
    const { error: uploadError } = await supabase.storage
      .from('docs')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    // If storage fails, still create record but mark as failed
    let storageSuccess = !uploadError;
    let rawFileUrl = null;
    
    if (storageSuccess) {
      const { data: urlData } = supabase.storage
        .from('docs')
        .getPublicUrl(storagePath);
      rawFileUrl = urlData?.publicUrl;
    }

    // Determine extractor
    const extractor = EXTRACTORS[mimeType] || 'unknown';

    // Create document record (ALWAYS - even if upload failed)
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        id: docId,
        owner_id: userId,
        project_id: projectId,
        original_filename: filename,
        display_name: filename,
        mime_type: mimeType,
        file_extension: extension,
        file_size_bytes: fileSize,
        storage_bucket: 'docs',
        storage_path: storagePath,
        raw_file_url: rawFileUrl,
        status: storageSuccess ? 'uploaded' : 'failed',
        processing_error: uploadError?.message || null,
        metadata: {
          session_id: sessionId,
          extractor,
          upload_timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (docError) {
      // Even if DB insert fails, we tried our best
      return NextResponse.json({
        success: false,
        stored: storageSuccess,
        document_id: docId,
        error: docError.message,
        message: 'File stored but record creation failed. Contact support for recovery.',
      }, { status: 500 });
    }

    // Queue for processing (async - don't wait)
    if (storageSuccess) {
      // In production, this would trigger a background job
      // For now, we'll process inline for text files
      if (['text', 'markdown', 'json', 'csv', 'html'].includes(extractor)) {
        try {
          const text = buffer.toString('utf-8');
          await supabase
            .from('documents')
            .update({
              status: 'processed',
              extracted_text: text.slice(0, 1000000), // 1MB limit
              extracted_text_length: text.length,
              word_count: text.split(/\s+/).length,
              processed_at: new Date().toISOString(),
            })
            .eq('id', docId);
        } catch (e) {
          // Mark as partial if text extraction fails
          await supabase
            .from('documents')
            .update({
              status: 'partial',
              processing_error: 'Text extraction failed, raw file available',
            })
            .eq('id', docId);
        }
      } else {
        // Mark for async processing
        await supabase
          .from('documents')
          .update({ status: 'processing' })
          .eq('id', docId);
      }
    }

    // Audit log
    await supabase.from('document_audit_log').insert({
      document_id: docId,
      user_id: userId,
      action: 'upload',
      action_details: {
        filename,
        mime_type: mimeType,
        file_size: fileSize,
        storage_success: storageSuccess,
      },
    });

    return NextResponse.json({
      success: true,
      document_id: docId,
      filename,
      mime_type: mimeType,
      file_size: fileSize,
      status: doc.status,
      raw_file_url: rawFileUrl,
      message: storageSuccess 
        ? 'Document uploaded successfully. Processing started.'
        : 'Document record created but storage failed. You can retry upload.',
      can_retry: !storageSuccess,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Upload failed but we never give up. Please try again.',
    }, { status: 500 });
  }
}

// GET - Check upload status
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id');

  if (!docId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', docId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({
    document: doc,
    can_reprocess: doc.status === 'failed' || doc.status === 'partial',
  });
}
