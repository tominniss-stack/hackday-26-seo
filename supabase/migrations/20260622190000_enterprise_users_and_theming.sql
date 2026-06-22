-- Enterprise Users & Theming Migration
-- Adds: agency_users, client_users tables, approval workflows, logo storage, theme overrides
-- Date: 2026-06-22

-- =====================================================
-- AGENCY STAFF TABLE
-- =====================================================

CREATE TABLE agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  can_approve_reports BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_users_email ON agency_users(email);

COMMENT ON TABLE agency_users IS 'Internal agency staff with report approval permissions';
COMMENT ON COLUMN agency_users.can_approve_reports IS 'Permission to approve and publish client reports';

-- =====================================================
-- CLIENTS TABLE UPDATES
-- =====================================================

-- Approval workflow flag
ALTER TABLE clients ADD COLUMN approval_required BOOLEAN NOT NULL DEFAULT true;

-- Logo storage path (works alongside logo_url for either/or functionality)
ALTER TABLE clients ADD COLUMN logo_storage_path TEXT;

-- Theme overrides (JSONB for secondary/accent colors)
ALTER TABLE clients ADD COLUMN theme_overrides JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN clients.approval_required IS 'Require agency approval before publishing reports';
COMMENT ON COLUMN clients.logo_storage_path IS 'Supabase storage path for uploaded logo files (alternative to logo_url)';
COMMENT ON COLUMN clients.theme_overrides IS 'Manual color overrides: {"secondary": "#hex", "accent": "#hex"}';

-- =====================================================
-- CLIENT USERS TABLE
-- =====================================================

CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, email)
);

CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_email ON client_users(email);

COMMENT ON TABLE client_users IS 'Client portal users with access to their company reports';
COMMENT ON COLUMN client_users.role IS 'User role: admin, member, viewer';
COMMENT ON COLUMN client_users.avatar_url IS 'Profile avatar (can be storage path or external URL)';

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Client logos bucket (public for easy rendering)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client_logos',
  'client_logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public for easy rendering)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user_avatars',
  'user_avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Client logos: allow upload/read/delete (anon key for MVP)
CREATE POLICY "allow_upload_client_logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client_logos');

CREATE POLICY "allow_read_client_logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'client_logos');

CREATE POLICY "allow_delete_client_logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'client_logos');

-- User avatars: allow upload/read/delete (anon key for MVP)
CREATE POLICY "allow_upload_user_avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user_avatars');

CREATE POLICY "allow_read_user_avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_avatars');

CREATE POLICY "allow_delete_user_avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'user_avatars');

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert a test agency user
INSERT INTO agency_users (email, name, can_approve_reports)
VALUES 
  ('admin@example.com', 'Admin User', true),
  ('analyst@example.com', 'Analyst User', false)
ON CONFLICT (email) DO NOTHING;
