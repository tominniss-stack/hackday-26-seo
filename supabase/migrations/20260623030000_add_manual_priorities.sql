-- Allow analysts to manually override the auto-calculated "Top Actionable
-- Priorities" for a report. When manual_priorities is non-null, the report
-- editor and client-facing report render these instead of the calculated set.
-- Shape: array of { id, title, description, severity, source }.
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS manual_priorities JSONB;

-- Ensure the API roles can read/write the new column (mirrors existing grants).
GRANT ALL ON public.reports TO anon, authenticated;
