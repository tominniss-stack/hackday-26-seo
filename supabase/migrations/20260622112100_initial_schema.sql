-- Initial schema for SEO Dashboard
-- Creates tables: clients, reports, metrics_snapshots, narratives
-- Enables RLS with permissive policies for MVP testing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  primary_color_hex TEXT,
  logo_url TEXT,
  custom_ai_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- REPORTS TABLE
-- =====================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reporting_month DATE NOT NULL,
  published_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on client_id for faster lookups
CREATE INDEX idx_reports_client_id ON reports(client_id);

-- =====================================================
-- METRICS_SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  metric_category TEXT NOT NULL,
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on report_id for faster lookups
CREATE INDEX idx_metrics_snapshots_report_id ON metrics_snapshots(report_id);

-- =====================================================
-- NARRATIVES TABLE
-- =====================================================
CREATE TABLE narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  final_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on report_id for faster lookups
CREATE INDEX idx_narratives_report_id ON narratives(report_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PERMISSIVE FOR MVP TESTING
-- WARNING: These policies allow full public access
-- Replace with proper authentication policies before production
-- =====================================================

-- CLIENTS policies
CREATE POLICY "allow_all_select_clients" ON clients
  FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_clients" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update_clients" ON clients
  FOR UPDATE USING (true);

CREATE POLICY "allow_all_delete_clients" ON clients
  FOR DELETE USING (true);

-- REPORTS policies
CREATE POLICY "allow_all_select_reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_reports" ON reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update_reports" ON reports
  FOR UPDATE USING (true);

CREATE POLICY "allow_all_delete_reports" ON reports
  FOR DELETE USING (true);

-- METRICS_SNAPSHOTS policies
CREATE POLICY "allow_all_select_metrics_snapshots" ON metrics_snapshots
  FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_metrics_snapshots" ON metrics_snapshots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update_metrics_snapshots" ON metrics_snapshots
  FOR UPDATE USING (true);

CREATE POLICY "allow_all_delete_metrics_snapshots" ON metrics_snapshots
  FOR DELETE USING (true);

-- NARRATIVES policies
CREATE POLICY "allow_all_select_narratives" ON narratives
  FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_narratives" ON narratives
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update_narratives" ON narratives
  FOR UPDATE USING (true);

CREATE POLICY "allow_all_delete_narratives" ON narratives
  FOR DELETE USING (true);
