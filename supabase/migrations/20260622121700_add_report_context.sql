-- Add report_context_prompt column to reports table
-- This allows storing monthly-specific context for AI narrative generation

ALTER TABLE reports
ADD COLUMN report_context_prompt TEXT;

COMMENT ON COLUMN reports.report_context_prompt IS 'Monthly context and focus areas for AI narrative generation (e.g., specific actions taken, areas of focus)';
