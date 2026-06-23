-- Enrich the "Mock Demo - PPC" report with real campaign drill-down data so the
-- portal PPC view renders its collapsible campaign sections from the database
-- (metrics_data.ppc_campaigns) rather than purely from frontend mocks.

DO $$
DECLARE
  v_ppc_report_id UUID;
BEGIN
  SELECT id INTO v_ppc_report_id
  FROM reports
  WHERE reporting_month = '2026-06-01' AND report_category = 'PPC'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_ppc_report_id IS NULL THEN
    RAISE NOTICE 'No PPC demo report found; skipping ppc_campaigns seed.';
    RETURN;
  END IF;

  UPDATE metrics_snapshots
  SET data_json = data_json || jsonb_build_object(
    'ppc_campaigns', '[
      {
        "name": "Google Ads - Brand Search",
        "spend": 4250,
        "conversions": 142,
        "cpa": 29.93,
        "roas": 5.2,
        "keywords": [
          {"keyword": "northwind", "matchType": "Exact", "clicks": 890, "impressions": 12400, "ctr": "7.2%", "avgCpc": "£0.42", "conversions": 68},
          {"keyword": "northwind atlassian", "matchType": "Phrase", "clicks": 340, "impressions": 4200, "ctr": "8.1%", "avgCpc": "£0.38", "conversions": 31},
          {"keyword": "northwind workflow plugin", "matchType": "Exact", "clicks": 210, "impressions": 2800, "ctr": "7.5%", "avgCpc": "£0.45", "conversions": 22},
          {"keyword": "northwind reviews", "matchType": "Broad", "clicks": 180, "impressions": 3100, "ctr": "5.8%", "avgCpc": "£0.51", "conversions": 21}
        ],
        "creatives": [
          {"headline": "Northwind | Enterprise Atlassian Partner", "description": "Scale Jira & Confluence with expert tooling and consulting. Trusted by the Fortune 500. Book a demo.", "displayUrl": "northwind.example/solutions", "ctr": "8.4%", "conversions": 45},
          {"headline": "Northwind — Results That Scale", "description": "Workflow Plugin, automation & migration experts. 15+ years in the Atlassian ecosystem. Free consultation.", "displayUrl": "northwind.example/consulting", "ctr": "6.9%", "conversions": 38}
        ]
      },
      {
        "name": "LinkedIn - Lead Gen",
        "spend": 6800,
        "conversions": 89,
        "cpa": 76.40,
        "roas": 3.1,
        "keywords": [
          {"keyword": "B2B DevOps Decision Makers", "matchType": "Audience", "clicks": 420, "impressions": 18500, "ctr": "2.3%", "avgCpc": "£4.12", "conversions": 34},
          {"keyword": "CTO / VP Engineering", "matchType": "Audience", "clicks": 280, "impressions": 12200, "ctr": "2.3%", "avgCpc": "£5.80", "conversions": 28},
          {"keyword": "Atlassian Admins", "matchType": "Audience", "clicks": 190, "impressions": 9800, "ctr": "1.9%", "avgCpc": "£6.20", "conversions": 27}
        ],
        "creatives": [
          {"headline": "Stop Firefighting, Start Scaling", "description": "Download our 2026 Enterprise Atlassian Playbook. Data-backed strategies for platform teams.", "displayUrl": "northwind.example/playbook", "ctr": "2.8%", "conversions": 52},
          {"headline": "Your Atlassian Stack, Optimised", "description": "Join 500+ enterprises using Northwind to scale DevOps. Book a platform strategy call.", "displayUrl": "northwind.example/enterprise", "ctr": "2.1%", "conversions": 37}
        ]
      },
      {
        "name": "Meta - Retargeting",
        "spend": 2100,
        "conversions": 67,
        "cpa": 31.34,
        "roas": 4.8,
        "keywords": [
          {"keyword": "Website Visitors (7d)", "matchType": "Retarget", "clicks": 580, "impressions": 24000, "ctr": "2.4%", "avgCpc": "£1.20", "conversions": 32},
          {"keyword": "Engaged Social (30d)", "matchType": "Retarget", "clicks": 340, "impressions": 15600, "ctr": "2.2%", "avgCpc": "£1.45", "conversions": 20},
          {"keyword": "Email Subscribers", "matchType": "Custom", "clicks": 210, "impressions": 8900, "ctr": "2.4%", "avgCpc": "£1.10", "conversions": 15}
        ],
        "creatives": [
          {"headline": "Still Evaluating Your Options?", "description": "Come back and see what is new. Exclusive offer for returning visitors — extended trial available.", "displayUrl": "northwind.example/welcome-back", "ctr": "3.2%", "conversions": 38},
          {"headline": "Ready to Scale Your Platform?", "description": "You visited us for a reason. Let us pick up where we left off. Free 30-min strategy session.", "displayUrl": "northwind.example/book", "ctr": "2.7%", "conversions": 29}
        ]
      }
    ]'::jsonb
  )
  WHERE report_id = v_ppc_report_id;

  RAISE NOTICE 'PPC campaigns seeded for report %', v_ppc_report_id;
END $$;
