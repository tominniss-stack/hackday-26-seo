-- Add SE Ranking domain + project identifiers to the clients table.
-- seranking_domain: the target domain used for backlink/authority lookups
--   (e.g. "northwind.example"). When null, the sync route skips SE Ranking.
-- seranking_project_id: optional SE Ranking project reference for future
--   project-scoped API calls.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS seranking_domain TEXT,
  ADD COLUMN IF NOT EXISTS seranking_project_id TEXT;
