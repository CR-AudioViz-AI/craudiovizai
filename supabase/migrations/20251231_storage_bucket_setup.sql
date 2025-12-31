-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create digital-products bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  false,
  524288000, -- 500MB
  ARRAY[
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
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for digital-products bucket

-- Allow admins to upload
CREATE POLICY "Admins can upload digital products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update
CREATE POLICY "Admins can update digital products"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete
CREATE POLICY "Admins can delete digital products"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated users to read (for downloads)
-- Note: We use signed URLs, so this is just for direct access if needed
CREATE POLICY "Authenticated users can read digital products"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'digital-products');

-- =====================================================
-- STORAGE EVENT TRIGGER
-- This captures all uploads to digital-products bucket
-- =====================================================

-- Function to log storage events
CREATE OR REPLACE FUNCTION log_storage_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'digital-products' THEN
    INSERT INTO storage_file_events (
      bucket_id,
      file_path,
      file_name,
      file_size,
      mime_type,
      event_type,
      metadata
    ) VALUES (
      NEW.bucket_id,
      NEW.name,
      split_part(NEW.name, '/', -1),
      NEW.metadata->>'size',
      NEW.metadata->>'mimetype',
      TG_OP,
      NEW.metadata
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on storage.objects
DROP TRIGGER IF EXISTS trigger_log_storage_event ON storage.objects;
CREATE TRIGGER trigger_log_storage_event
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION log_storage_event();

-- =====================================================
-- HELPER FUNCTION: Get knowledge stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_knowledge_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sources', (SELECT COUNT(*) FROM javari_knowledge_sources),
    'completed_sources', (SELECT COUNT(*) FROM javari_knowledge_sources WHERE status = 'completed'),
    'pending_sources', (SELECT COUNT(*) FROM javari_knowledge_sources WHERE status = 'pending'),
    'failed_sources', (SELECT COUNT(*) FROM javari_knowledge_sources WHERE status = 'failed'),
    'total_chunks', (SELECT COUNT(*) FROM javari_knowledge_chunks),
    'total_tokens', (SELECT COALESCE(SUM(total_tokens), 0) FROM javari_knowledge_sources),
    'by_type', (
      SELECT json_object_agg(source_type, cnt)
      FROM (
        SELECT source_type, COUNT(*) as cnt 
        FROM javari_knowledge_sources 
        GROUP BY source_type
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify setup
-- =====================================================

SELECT 
  'Storage Buckets' as check_type,
  COUNT(*) as count,
  array_agg(name) as items
FROM storage.buckets
WHERE name = 'digital-products'

UNION ALL

SELECT 
  'Knowledge Tables' as check_type,
  COUNT(*) as count,
  array_agg(tablename) as items
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE '%knowledge%'

UNION ALL

SELECT 
  'Digital Product Tables' as check_type,
  COUNT(*) as count,
  array_agg(tablename) as items
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE '%digital%';