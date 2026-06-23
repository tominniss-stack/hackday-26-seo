-- Add a fully-dynamic SE Ranking endpoint URL to the clients table.
-- seranking_endpoint_url: when set, the SE Ranking fetcher uses this URL
--   EXACTLY as-is (the admin is expected to supply a fully-qualified URL
--   already containing any required project ID in the path). When null, the
--   fetcher falls back to a default base URL constructed from
--   seranking_project_id, and skips entirely if neither is configured.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS seranking_endpoint_url TEXT;
