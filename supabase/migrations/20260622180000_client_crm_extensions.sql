-- Client CRM Extensions Migration
-- Adds contact management fields and archival system to clients table
-- Date: 2026-06-22

-- =====================================================
-- ADD CRM CONTACT FIELDS TO CLIENTS TABLE
-- =====================================================

-- Add contact name field for primary client contact
ALTER TABLE clients ADD COLUMN contact_name TEXT;

-- Add contact email field for primary client contact
ALTER TABLE clients ADD COLUMN contact_email TEXT;

-- Add archival flag for soft deletion (default: not archived)
ALTER TABLE clients ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- =====================================================
-- CREATE INDEX FOR PERFORMANCE
-- =====================================================

-- Index on is_archived for efficient filtering of active clients
CREATE INDEX idx_clients_is_archived ON clients(is_archived);

-- =====================================================
-- VERIFICATION NOTE
-- =====================================================
-- The reports table already has ON DELETE CASCADE constraint from initial schema:
-- REFERENCES clients(id) ON DELETE CASCADE (line 25 of 20260622112100_initial_schema.sql)
-- This ensures report deletion cascades to metrics_snapshots and narratives.
-- No additional changes needed for cascade behavior.
