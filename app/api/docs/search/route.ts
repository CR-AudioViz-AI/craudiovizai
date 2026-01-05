// ================================================================================
// JAVARI DOCUMENT SEARCH & ASK API - /api/docs/search, /api/docs/ask
// RAG-powered document Q&A with citations
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// POST /api/docs/search - Search documents
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { query, user_id, project_id, limit = 10, document_ids } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Build search query
    let dbQuery = supabase
      .from('documents')
      .select('id, display_name, original_filename, mime_type, extracted_text, status, created_at')
      .eq('status', 'processed')
      .not('extracted_text', 'is', null);

    // Filter by user
    if (user_id) {
      dbQuery = dbQuery.eq('owner_id', user_id);
    }

    // Filter by project
    if (project_id) {
      dbQuery = dbQuery.eq('project_id', project_id);
    }

    // Filter by specific documents
    if (document_ids && document_ids.length > 0) {
      dbQuery = dbQuery.in('id', document_ids);
    }

    const { data: docs, error } = await dbQuery.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Simple text search (in production, use embeddings)
    const queryLower = query.toLowerCase();
    const results = docs
      ?.filter(doc => 
        doc.extracted_text?.toLowerCase().includes(queryLower) ||
        doc.display_name?.toLowerCase().includes(queryLower)
      )
      .slice(0, limit)
      .map(doc => {
        // Find matching snippets
        const text = doc.extracted_text || '';
        const index = text.toLowerCase().indexOf(queryLower);
        let snippet = '';
        if (index >= 0) {
          const start = Math.max(0, index - 100);
          const end = Math.min(text.length, index + query.length + 100);
          snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
        }

        return {
          document_id: doc.id,
          filename: doc.display_name,
          mime_type: doc.mime_type,
          snippet,
          relevance: index >= 0 ? 1 : 0.5,
        };
      });

    return NextResponse.json({
      query,
      results: results || [],
      total: results?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
