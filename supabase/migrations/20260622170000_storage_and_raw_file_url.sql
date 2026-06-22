-- Storage bucket for raw Screaming Frog CSV files
-- Adds raw_sf_file_url to reports for bucket reference

-- =====================================================
-- SUPABASE STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client_reports_data',
  'client_reports_data',
  false,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/csv', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow authenticated uploads (anon key for MVP)
CREATE POLICY "allow_upload_client_reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client_reports_data');

CREATE POLICY "allow_read_client_reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'client_reports_data');

CREATE POLICY "allow_delete_client_reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'client_reports_data');

-- =====================================================
-- REPORTS TABLE: raw_sf_file_url
-- =====================================================

ALTER TABLE reports
ADD COLUMN raw_sf_file_url TEXT;
