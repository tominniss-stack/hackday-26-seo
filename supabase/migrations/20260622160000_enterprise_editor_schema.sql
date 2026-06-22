-- Enterprise Editor Schema Expansion
-- Adds: report_type, visible_widgets to reports
-- Creates: app_settings table with seed data

-- =====================================================
-- REPORTS TABLE UPDATES
-- =====================================================

ALTER TABLE reports
ADD COLUMN report_type TEXT NOT NULL DEFAULT 'monthly';

ALTER TABLE reports
ADD CONSTRAINT reports_report_type_check
CHECK (report_type IN ('monthly', 'quarterly'));

ALTER TABLE reports
ADD COLUMN visible_widgets JSONB DEFAULT '{
  "technical_health": true,
  "indexability_chart": true,
  "status_code_chart": true,
  "ga4_traffic": true,
  "gsc_queries": true,
  "keyword_movements": true,
  "traffic_channels": true
}'::jsonb;

-- =====================================================
-- APP_SETTINGS TABLE
-- =====================================================

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_select_app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "allow_all_insert_app_settings" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update_app_settings" ON app_settings FOR UPDATE USING (true);

-- =====================================================
-- SEED: Global System Prompt
-- =====================================================

INSERT INTO app_settings (key, value) VALUES (
  'global_system_prompt',
  'You are an expert B2B SEO analyst at Brew Digital, a premium UK-based digital marketing agency. Your tone is professional, direct, and actionable. Avoid fluff.

CRITICAL FORMATTING RULES:
- You must strictly output ONLY the raw narrative paragraph text.
- Do NOT repeat the company name in your output.
- Do NOT append titles, and do NOT include headers like "Executive Summary" or "Technical Health Report" at the beginning of your response.
- Use strict UK English spelling and grammar throughout.
- Do NOT use em-dashes or en-dashes. Use commas or restructure the sentence instead.
- Do NOT use bullet points or numbered lists. Write in flowing prose only.
- Avoid passive voice. Write in active, direct sentences.
- Avoid hollow filler phrases such as "it is worth noting", "it is important to highlight", or "in conclusion".
- Limit each section to 2-3 sentences maximum. Be precise and commercially relevant.'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =====================================================
-- SEED: Priority Matrix Rules
-- =====================================================

INSERT INTO app_settings (key, value_json) VALUES (
  'priority_matrix_rules',
  '[
    {
      "issue_type": "broken_internal_links",
      "priority": 1,
      "label": "Broken Internal Links",
      "rationale": "Directly damages crawl efficiency and user experience. Fix immediately."
    },
    {
      "issue_type": "client_errors_4xx",
      "priority": 2,
      "label": "404 Client Errors",
      "rationale": "Wastes crawl budget and creates dead ends for users. Redirect or remove."
    },
    {
      "issue_type": "redirects_3xx",
      "priority": 3,
      "label": "3xx Redirect Chains",
      "rationale": "Each hop in a redirect chain dilutes PageRank. Consolidate to single redirects."
    },
    {
      "issue_type": "missing_h1",
      "priority": 4,
      "label": "Missing H1 Tags",
      "rationale": "Impacts content hierarchy and keyword relevance signals."
    },
    {
      "issue_type": "non_indexable",
      "priority": 5,
      "label": "Non-Indexable Pages",
      "rationale": "Review intentionality. Accidental noindex tags can suppress valuable content."
    },
    {
      "issue_type": "server_errors_5xx",
      "priority": 6,
      "label": "5xx Server Errors",
      "rationale": "Critical infrastructure issues. Escalate to development team immediately."
    }
  ]'::jsonb
);
