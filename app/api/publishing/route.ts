/**
 * CR AudioViz AI - Central Publishing API
 * Books, chapters, ebook management
 * 
 * @author CR AudioViz AI, LLC
 * @created December 31, 2025
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const book_id = searchParams.get('book_id');
    const chapter_id = searchParams.get('chapter_id');

    if (chapter_id) {
      const { data, error } = await supabase.from('chapters').select('*').eq('id', chapter_id).single();
      if (error) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      return NextResponse.json({ chapter: data });
    }

    if (book_id) {
      const { data, error } = await supabase.from('books').select('*, chapters(*)').eq('id', book_id).single();
      if (error) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      return NextResponse.json({ book: data });
    }

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const { data: books } = await supabase.from('books').select('*, chapters(count)').eq('user_id', user_id).order('updated_at', { ascending: false });
    return NextResponse.json({ books: books || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id, ...data } = body;

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    switch (type) {
      case 'book':
        const { data: book, error: bookError } = await supabase.from('books').insert({
          ...data, user_id, status: 'draft', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).select().single();
        if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 });
        return NextResponse.json({ success: true, book });

      case 'chapter':
        if (!data.book_id) return NextResponse.json({ error: 'book_id required' }, { status: 400 });
        const { data: chapter, error: chapterError } = await supabase.from('chapters').insert({
          ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).select().single();
        if (chapterError) return NextResponse.json({ error: chapterError.message }, { status: 500 });
        await supabase.from('books').update({ updated_at: new Date().toISOString() }).eq('id', data.book_id);
        return NextResponse.json({ success: true, chapter });

      default:
        return NextResponse.json({ error: 'Invalid type. Use: book, chapter' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const table = type === 'chapter' ? 'chapters' : 'books';
    const { data, error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, [type || 'book']: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const table = type === 'chapter' ? 'chapters' : 'books';
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
