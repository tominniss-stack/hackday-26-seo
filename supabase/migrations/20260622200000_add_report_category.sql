-- =====================================================
-- ADD REPORT CATEGORY COLUMN
-- =====================================================
-- This migration adds support for dual SEO/PPC reports
-- by adding a report_category column to the reports table.
-- This allows the same client to have both an SEO and PPC
-- report for the same reporting month.

-- Add report_category column (SEO or PPC)
ALTER TABLE reports 
ADD COLUMN report_category TEXT NOT NULL DEFAULT 'SEO';

-- Add check constraint to ensure only valid categories
ALTER TABLE reports 
ADD CONSTRAINT reports_category_check 
CHECK (report_category IN ('SEO', 'PPC'));

-- Create index for efficient filtering by category
CREATE INDEX idx_reports_category ON reports(report_category);

-- Update unique constraint to include category
-- This allows same month to have both SEO and PPC reports
-- Drop old constraint if it exists
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_client_month_unique;

-- Add new composite unique constraint
ALTER TABLE reports 
ADD CONSTRAINT reports_client_month_category_unique 
UNIQUE (client_id, reporting_month, report_category);

-- Add comment for documentation
COMMENT ON COLUMN reports.report_category IS 'Report category: SEO for organic search reports, PPC for paid media reports';
