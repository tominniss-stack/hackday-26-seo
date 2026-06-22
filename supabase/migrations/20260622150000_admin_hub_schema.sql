-- Admin Hub Schema Updates
-- Adds: status constraint, analyst_notes, client integration fields, narrative section

-- =====================================================
-- REPORTS TABLE UPDATES
-- =====================================================

-- Add analyst_notes JSONB column for per-section analyst annotations
ALTER TABLE reports
ADD COLUMN analyst_notes JSONB DEFAULT '{}'::jsonb;

-- Add CHECK constraint on published_status
ALTER TABLE reports
ADD CONSTRAINT reports_published_status_check
CHECK (published_status IN ('draft', 'pending_approval', 'published'));

-- Update any existing rows that don't match the constraint
UPDATE reports
SET published_status = 'draft'
WHERE published_status NOT IN ('draft', 'pending_approval', 'published');

-- =====================================================
-- CLIENTS TABLE UPDATES
-- =====================================================

-- Jira integration fields
ALTER TABLE clients ADD COLUMN jira_api_key TEXT;
ALTER TABLE clients ADD COLUMN jira_email TEXT;
ALTER TABLE clients ADD COLUMN jira_project_key TEXT;

-- Google Analytics 4
ALTER TABLE clients ADD COLUMN ga4_property_id TEXT;

-- Google Search Console
ALTER TABLE clients ADD COLUMN gsc_property_url TEXT;

-- SE Ranking
ALTER TABLE clients ADD COLUMN seranking_api_key TEXT;

-- =====================================================
-- NARRATIVES TABLE UPDATES
-- =====================================================

-- Add section column to identify which AI section this narrative belongs to
ALTER TABLE narratives
ADD COLUMN section TEXT NOT NULL DEFAULT 'executive';

-- Add CHECK constraint on section
ALTER TABLE narratives
ADD CONSTRAINT narratives_section_check
CHECK (section IN ('executive', 'technical', 'traffic'));

-- Add unique constraint: one narrative per (report_id, section) pair
ALTER TABLE narratives
ADD CONSTRAINT narratives_report_section_unique
UNIQUE (report_id, section);
