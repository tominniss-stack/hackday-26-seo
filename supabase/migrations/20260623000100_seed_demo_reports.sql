-- Seed: Two polished demo reports for the pitch.
--   1. "Mock Demo - SEO"  (report_category = 'SEO')
--   2. "Mock Demo - PPC"  (report_category = 'PPC')
-- Each report receives a comprehensive metrics_snapshots.data_json payload so
-- the editor and portal views render beautifully end-to-end.
--
-- This migration is idempotent-ish: it targets the existing test client (or the
-- first client) and inserts fresh demo reports. Safe to run on a clean DB.

DO $$
DECLARE
  v_client_id UUID;
  v_seo_report_id UUID;
  v_ppc_report_id UUID;
BEGIN
  -- Resolve a client to attach the demo reports to.
  SELECT id INTO v_client_id FROM clients ORDER BY created_at ASC LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO clients (company_name, primary_color_hex, contact_name, seranking_domain)
    VALUES ('Northwind', '#6366f1', 'Jane Doe', 'northwind.example')
    RETURNING id INTO v_client_id;
  ELSE
    -- Ensure the demo client has a SE Ranking domain set for live-sync demos.
    UPDATE clients
      SET seranking_domain = COALESCE(seranking_domain, 'northwind.example')
      WHERE id = v_client_id;
  END IF;

  -- ===================================================================
  -- 1. SEO DEMO REPORT
  -- ===================================================================
  INSERT INTO reports (client_id, reporting_month, report_category, published_status, analyst_notes)
  VALUES (
    v_client_id,
    '2026-06-01',
    'SEO',
    'published',
    '{"executive": "Mock Demo - SEO: a standout month for organic visibility.", "technical": "Crawl health improved with redirect chains resolved.", "traffic": "Organic search led all channels with strong branded growth."}'::jsonb
  )
  RETURNING id INTO v_seo_report_id;

  INSERT INTO metrics_snapshots (report_id, metric_category, data_json)
  VALUES (
    v_seo_report_id,
    'full_site_audit',
    '{
      "total_urls": 2480,
      "non_indexable": 142,
      "client_errors_4xx": 18,
      "server_errors_5xx": 2,
      "redirects_3xx": 64,
      "missing_h1": 11,
      "low_internal_links": 27,
      "missing_meta_descriptions": 34,
      "ga4_sessions": 48230,
      "ga4_active_users": 36110,
      "ga4_sessions_prev": 44980,
      "ga4_active_users_prev": 34220,
      "gsc_impressions_prev": 712000,
      "ga4_channels": [
        {"channel": "Organic Search", "sessions": 31240, "users": 24180},
        {"channel": "Direct", "sessions": 7820, "users": 6010},
        {"channel": "Paid Search", "sessions": 4310, "users": 3920},
        {"channel": "Social", "sessions": 2980, "users": 2610},
        {"channel": "Referral", "sessions": 1880, "users": 1390}
      ],
      "gsc_top_queries": [
        {"query": "northwind", "clicks": 4120, "impressions": 38200, "ctr": 0.108, "position": 1.2},
        {"query": "jira automation", "clicks": 1980, "impressions": 52400, "ctr": 0.038, "position": 4.6},
        {"query": "confluence templates", "clicks": 1240, "impressions": 41300, "ctr": 0.030, "position": 6.1},
        {"query": "workflow plugin for jira", "clicks": 980, "impressions": 21800, "ctr": 0.045, "position": 3.4},
        {"query": "atlassian consulting partner", "clicks": 760, "impressions": 18900, "ctr": 0.040, "position": 5.2}
      ],
      "seranking_domain_trust": 71,
      "seranking_total_backlinks": 184320,
      "seranking_referring_domains": 4280,
      "seranking_keywords": [
        {"keyword": "jira automation", "position": 4, "change": 2, "volume": 8100, "url": "/solutions/automation"},
        {"keyword": "confluence templates", "position": 6, "change": 1, "volume": 6600, "url": "/solutions/confluence"},
        {"keyword": "workflow plugin for jira", "position": 3, "change": 3, "volume": 4400, "url": "/products/workflow-plugin"},
        {"keyword": "atlassian consulting partner", "position": 5, "change": -1, "volume": 2900, "url": "/services/consulting"},
        {"keyword": "enterprise devops tooling", "position": 12, "change": 5, "volume": 3300, "url": "/solutions/devops"},
        {"keyword": "jira cloud migration", "position": 7, "change": 0, "volume": 5200, "url": "/services/migration"}
      ],
      "data_sources": {"screaming_frog": "csv", "ga4": "api", "gsc": "api", "seranking": "api"}
    }'::jsonb
  );

  INSERT INTO narratives (report_id, section, final_text)
  VALUES
    (v_seo_report_id, 'executive', 'Mock Demo - SEO: June 2026 delivered a 7.2% month-on-month increase in organic sessions, underpinned by improved rankings across high-intent product terms. Domain authority climbed to 71 with 4,280 referring domains, reinforcing topical strength in the Atlassian ecosystem.'),
    (v_seo_report_id, 'technical', 'A crawl of 2,480 URLs returned a healthy profile: just 18 client errors and 2 transient server errors. Redirect chains were trimmed to 64, and only 11 pages remain without an H1. Non-indexable pages (142) are predominantly intentional noindex directives on faceted listings.'),
    (v_seo_report_id, 'traffic', 'Organic search drove 64.8% of total sessions, with branded demand for "northwind" maintaining a #1.2 average position at a 10.8% CTR. Paid search and social provided efficient incremental reach, while referral traffic grew on the back of partner co-marketing.');

  -- ===================================================================
  -- 2. PPC DEMO REPORT
  -- ===================================================================
  INSERT INTO reports (client_id, reporting_month, report_category, published_status, analyst_notes)
  VALUES (
    v_client_id,
    '2026-06-01',
    'PPC',
    'published',
    '{"executive": "Mock Demo - PPC: efficient spend with strong ROAS across brand and prospecting.", "technical": "Conversion tracking verified across all campaigns.", "traffic": "Paid channels delivered qualified pipeline at target CPA."}'::jsonb
  )
  RETURNING id INTO v_ppc_report_id;

  INSERT INTO metrics_snapshots (report_id, metric_category, data_json)
  VALUES (
    v_ppc_report_id,
    'full_site_audit',
    '{
      "ga4_sessions": 18940,
      "ga4_active_users": 15220,
      "ga4_sessions_prev": 17110,
      "ga4_active_users_prev": 14080,
      "gsc_impressions_prev": 0,
      "ga4_channels": [
        {"channel": "Paid Search", "sessions": 11240, "users": 9180},
        {"channel": "Paid Social", "sessions": 4310, "users": 3620},
        {"channel": "Display", "sessions": 2180, "users": 1810},
        {"channel": "Direct", "sessions": 1210, "users": 980}
      ],
      "gsc_top_queries": [
        {"query": "jira automation tool", "clicks": 820, "impressions": 14200, "ctr": 0.058, "position": 2.1},
        {"query": "buy workflow plugin", "clicks": 540, "impressions": 8900, "ctr": 0.061, "position": 1.8}
      ],
      "seranking_domain_trust": 71,
      "seranking_total_backlinks": 184320,
      "seranking_referring_domains": 4280,
      "data_sources": {"screaming_frog": "skipped", "ga4": "api", "gsc": "api", "seranking": "api"}
    }'::jsonb
  );

  INSERT INTO narratives (report_id, section, final_text)
  VALUES
    (v_ppc_report_id, 'executive', 'Mock Demo - PPC: paid media generated a blended 4.6x ROAS in June, with brand search protecting category demand and prospecting expanding qualified pipeline at an efficient cost-per-acquisition.'),
    (v_ppc_report_id, 'technical', 'Conversion tracking was validated end-to-end across Google Ads, LinkedIn, and Meta. Offline conversion imports reconciled within 2% of CRM-recorded opportunities.'),
    (v_ppc_report_id, 'traffic', 'Paid search contributed the majority of paid sessions at the lowest CPA, while paid social drove top-of-funnel awareness. Retargeting sustained a strong 4.8x ROAS on returning visitors.');

  RAISE NOTICE 'Demo reports seeded: SEO=% PPC=%', v_seo_report_id, v_ppc_report_id;
END $$;
