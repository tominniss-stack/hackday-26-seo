-- Seed: March 2026 baseline report for Test Company
-- Creates a historical report with slightly worse metrics than May 2026
-- This establishes MoM comparison data for the frontend UI

DO $$
DECLARE
  v_client_id UUID;
  v_report_id UUID;
BEGIN
  -- Ensure a test client exists before inserting a report
  INSERT INTO clients (company_name, primary_color_hex)
  VALUES ('Test Company', '#3b82f6')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_client_id;
  
  IF v_client_id IS NULL THEN
      SELECT id INTO v_client_id FROM clients LIMIT 1;
  END IF;

  -- Insert the March 2026 report
  INSERT INTO reports (client_id, reporting_month, published_status, analyst_notes)
  VALUES (
    v_client_id,
    '2026-03-01',
    'published',
    '{"executive": "March was a strong month for organic growth despite the ongoing site migration.", "technical": "Several legacy redirect chains were identified and flagged for cleanup.", "traffic": "Organic search remained the dominant channel, with a notable uptick in branded queries."}'::jsonb
  )
  RETURNING id INTO v_report_id;

  -- Insert metrics snapshot (slightly worse than May 2026 to show MoM improvement)
  -- May 2026 baseline (from existing report): total_urls ~1200, non_indexable ~72, etc.
  -- March 2026 is intentionally worse to demonstrate positive MoM trend
  INSERT INTO metrics_snapshots (report_id, metric_category, data_json)
  VALUES (
    v_report_id,
    'full_site_audit',
    '{
      "total_urls": 1156,
      "non_indexable": 98,
      "client_errors_4xx": 34,
      "server_errors_5xx": 7,
      "redirects_3xx": 89,
      "missing_h1": 23,
      "ga4_sessions": 10820,
      "ga4_active_users": 8340,
      "ga4_channels": [
        {"channel": "Organic Search", "sessions": 9240, "users": 7180},
        {"channel": "Direct", "sessions": 3890, "users": 2910},
        {"channel": "Paid Search", "sessions": 3210, "users": 2840},
        {"channel": "Social", "sessions": 1780, "users": 1590},
        {"channel": "Referral", "sessions": 1320, "users": 1140}
      ],
      "gsc_top_queries": [
        {"query": "digital marketing agency uk", "clicks": 312, "impressions": 4820, "ctr": 0.065, "position": 4.2},
        {"query": "seo services edinburgh", "clicks": 198, "impressions": 2140, "ctr": 0.093, "position": 2.1},
        {"query": "ppc management services", "clicks": 87, "impressions": 3210, "ctr": 0.027, "position": 9.8},
        {"query": "content marketing strategy", "clicks": 143, "impressions": 5670, "ctr": 0.025, "position": 14.3},
        {"query": "web design agency scotland", "clicks": 76, "impressions": 1890, "ctr": 0.040, "position": 5.7}
      ]
    }'::jsonb
  );

  -- Insert 3 narrative rows (one per section)
  INSERT INTO narratives (report_id, section, final_text)
  VALUES
    (
      v_report_id,
      'executive',
      'March 2026 demonstrated solid organic performance with a 12% increase in sessions compared to February, driven primarily by improved rankings for core service terms. The technical audit identified 34 broken links and 89 redirect chains that have been prioritised for resolution in the coming sprint. Overall site health remains stable, with the indexability ratio holding at 91.5% despite the ongoing content expansion programme.'
    ),
    (
      v_report_id,
      'technical',
      'The technical crawl of 1,156 URLs revealed 98 non-indexable pages, the majority of which are intentional noindex tags on paginated archive content. The 34 client-side errors represent a 15% increase from February and are concentrated on legacy product pages scheduled for migration. Seven server errors were recorded, all transient and resolved within the reporting period.'
    ),
    (
      v_report_id,
      'traffic',
      'Organic search accounted for 85.4% of total sessions in March, with branded queries showing a 22% uplift following the Q1 PR campaign. The top-performing GSC query, "digital marketing agency uk", achieved an average position of 4.2 with a 6.5% click-through rate. Paid search delivered 3,210 sessions at an efficient cost-per-click, with the Google Brand campaign maintaining a 5.1x ROAS.'
    );

  RAISE NOTICE 'March 2026 seed report created with ID: %', v_report_id;
END $$;
