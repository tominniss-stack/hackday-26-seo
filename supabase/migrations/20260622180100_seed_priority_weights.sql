-- Seed default priority weights for Top Actionable Priorities engine
-- Date: 2026-06-22

INSERT INTO app_settings (key, value_json)
VALUES (
  'priority_weights',
  '{
    "internal_linking": 100,
    "errors_404": 80,
    "redirects_302": 60,
    "errors_5xx": 90,
    "missing_h1": 40,
    "non_indexable": 50
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
