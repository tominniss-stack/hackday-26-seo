# Enterprise Hub, Advanced SEO Data Ingestion, & Client Portal Dashboard

## Overview
This plan implements comprehensive enterprise features including dual SEO/PPC report generation, advanced Screaming Frog data extraction, 4-tier AI prompt amalgamation, client portal dashboard, contextual support system, and admin settings plumbing.

**Critical Rules:**
- Use strict surgical diffs (apply_diff tool)
- Execute sequentially, waiting for confirmation between steps
- Ensure `npm run build` passes cleanly with zero errors after each phase

---

## Phase 1: Database Category Extensions & Automatic Dual Report Generation

### 1.1 Database Schema Migration
**File:** `supabase/migrations/20260622200000_add_report_category.sql`

Add `report_category` column to reports table:
```sql
-- Add report_category column (SEO or PPC)
ALTER TABLE reports 
ADD COLUMN report_category TEXT NOT NULL DEFAULT 'SEO';

-- Add check constraint
ALTER TABLE reports 
ADD CONSTRAINT reports_category_check 
CHECK (report_category IN ('SEO', 'PPC'));

-- Create index for filtering
CREATE INDEX idx_reports_category ON reports(report_category);

-- Update unique constraint to include category
-- This allows same month to have both SEO and PPC reports
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_client_month_unique;

ALTER TABLE reports 
ADD CONSTRAINT reports_client_month_category_unique 
UNIQUE (client_id, reporting_month, report_category);
```

### 1.2 TypeScript Types Update
**File:** `my-app/lib/types.ts`

Update the `reports` table interface to include `report_category` field.

### 1.3 Dual Report Creation Logic
**File:** `my-app/app/api/sync/report-data/route.ts`

Automatically creates TWO reports (SEO + PPC) in parallel when analyst uploads data.

### 1.4 Report Title Formatting
Format: `{Month Year} - {Category}` (e.g., "March 2026 - SEO")

### 1.5 Category Filter in Admin Hub
Add filter dropdown in admin client hub reports table.

### 1.6 Create Report Modal Enhancement
Update dialog to show data sources: GA4, Search Console, SE Ranking MCP Server.

---

## Phase 2: Screaming Frog Advanced Extraction & Priority Ranking

### 2.1 Low Internal Links Tracking
Extract count of indexable pages with < 3 inlinks from Screaming Frog CSV.

### 2.2 Missing Meta Descriptions
Extract count where Meta Description 1 Length = 0 or empty.

### 2.3 Gifty's Priority Hierarchy
**CRITICAL:** Low internal links, 404s with link equity
**MEDIUM:** Missing meta descriptions, duplicate titles
**LOW:** Non-indexable pages, orphaned 404s

### 2.4 Metrics Schema Update
Add new fields to UnifiedMetrics interface.

### 2.5 UI Widget Updates
Surface new priority categories in admin widgets.

---

## Phase 3: 4-Tier Self-Learning Prompt Amalgamation

### 3.1 Report Context Input Field
Add rich text area at top of report editor for month-specific tactical context.

### 3.2 4-Tier Amalgamation API
**Tier 1:** Global system rules
**Tier 2:** Client-level guardrails  
**Tier 3:** Tactical context input
**Tier 4:** Historical feedback loop

### 3.3 Testing Strategy
Verify AI generation includes all 4 tiers and follows formatting rules.

---

## Phase 4: Client Portal Dashboard, Notifications, & Report Grid

### 4.1 Portal Dashboard Structure
Create `/report/dashboard` landing page with Brew Digital branding.

### 4.2 Brew Digital Branding
Already implemented with CDN logo.

### 4.3 Recent Reports Grid
Display SEO and PPC reports side-by-side with status-based interactivity.

### 4.4 Notifications Alerts Pane
Show report availability and Jira ticket tracking.

### 4.5 Active Requests Board
Embed RequestsView component on dashboard.

---

## Phase 5: Portal User Dropdown Cleanup & Contextual Support FAB

### 5.1 Remove Duplicate Support Link
Remove Support from user dropdown (keep in sidebar only).

### 5.2 Contextual FAB
Floating action button with question icon in bottom-right corner.

### 5.3 Intelligent Ticket Routing
Auto-tag questions with `[SEO Report Query - March 2026]` format.

---

## Phase 6: Admin Settings Plumbing & Production Verification

### 6.1 Tabs Control for Settings
**File:** `my-app/app/admin/settings/page.tsx`

Add tabbed interface with System Prompt and Agency Team tabs:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system-prompt');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Global Settings</h1>
            <p className="text-sm text-slate-500">System configuration and team management</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="agency-team">Agency Team</TabsTrigger>
          </TabsList>

          <TabsContent value="system-prompt">
            {/* Existing global prompt and priority weights cards */}
          </TabsContent>

          <TabsContent value="agency-team">
            <AgencyTeamManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### 6.2 Agency Team CRM Management Grid
**New File:** `my-app/components/admin/agency-team-management.tsx`

Full CRUD interface for agency users with:
- View all users in table
- Create new users
- Edit existing users
- Delete users
- Toggle `can_approve_reports` permission via clickable checkmark

### 6.3 Approval Permissions Toggle
Implemented in agency team management grid - clicking checkmark icon toggles the boolean.

### 6.4 Production Build Verification
**Command:** `npm run build`

**Success Criteria:**
- Zero TypeScript errors
- Zero ESLint warnings
- All routes compile successfully
- Build completes in < 30 seconds

---

## Implementation Sequence

### Recommended Execution Order

**Week 1: Database & Core Logic**
1. Phase 1.1-1.2: Database migration and TypeScript types
2. Phase 1.3: Dual report creation logic
3. Phase 2.1-2.4: Screaming Frog parser enhancements and metrics schema
4. Phase 2.3: Priority calculator update
5. Build verification

**Week 2: UI & Editor Enhancements**
1. Phase 1.4-1.6: Report title formatting and filters
2. Phase 2.5: UI widgets for new metrics
3. Phase 3.1-3.2: Report context field and 4-tier AI amalgamation
4. Phase 3.3: AI testing
5. Build verification

**Week 3: Portal Dashboard & Support**
1. Phase 4.1-4.3: Portal dashboard structure and reports grid
2. Phase 4.4-4.5: Notifications and requests board
3. Phase 5.1-5.3: FAB and contextual support
4. Build verification

**Week 4: Admin Settings & Polish**
1. Phase 6.1-6.3: Settings tabs and agency team management
2. Full integration testing
3. Phase 6.4: Final production build
4. User acceptance testing

---

## Success Criteria

### Phase 1 Success
- [ ] Database migration runs successfully
- [ ] Creating one report automatically creates both SEO and PPC versions
- [ ] Report titles show category (e.g., "March 2026 - SEO")
- [ ] Category filter works in admin hub

### Phase 2 Success
- [ ] Screaming Frog parser extracts low internal links count
- [ ] Screaming Frog parser extracts missing meta descriptions count
- [ ] Priority calculator ranks issues per Gifty's hierarchy
- [ ] Top Priorities card shows new categories

### Phase 3 Success
- [ ] Report context field saves to database
- [ ] AI narrative generation includes all 4 tiers
- [ ] Generated text follows formatting rules
- [ ] Historical context influences recommendations

### Phase 4 Success
- [ ] Portal dashboard loads with client branding
- [ ] Published reports are clickable, drafts are disabled
- [ ] Notifications show recent report and Jira updates
- [ ] Active requests board displays correctly

### Phase 5 Success
- [ ] Support link removed from user dropdown
- [ ] FAB appears in bottom-right corner
- [ ] Clicking FAB opens question modal
- [ ] Submitted questions include auto-tagged prefix

### Phase 6 Success
- [ ] Settings page has tabs (System Prompt | Agency Team)
- [ ] Agency team grid shows all users
- [ ] Can create, edit, delete users
- [ ] Approval permission toggle works
- [ ] `npm run build` passes with zero errors

---

## Database Schema Changes Summary

### New Migration: `20260622200000_add_report_category.sql`
```sql
ALTER TABLE reports ADD COLUMN report_category TEXT NOT NULL DEFAULT 'SEO';
ALTER TABLE reports ADD CONSTRAINT reports_category_check CHECK (report_category IN ('SEO', 'PPC'));
CREATE INDEX idx_reports_category ON reports(report_category);
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_client_month_unique;
ALTER TABLE reports ADD CONSTRAINT reports_client_month_category_unique 
  UNIQUE (client_id, reporting_month, report_category);
```

---

## Component Architecture

### New Components
```
my-app/components/
├── portal/
│   ├── recent-reports-grid.tsx       # Phase 4.3
│   ├── notifications-pane.tsx        # Phase 4.4
│   └── contextual-fab.tsx            # Phase 5.2
└── admin/
    └── agency-team-management.tsx    # Phase 6.2
```

### New Pages
```
my-app/app/
└── report/
    └── dashboard/
        └── page.tsx                  # Phase 4.1
```

---

## Risk Mitigation

### High-Risk Areas
1. **Dual Report Creation:** Could create orphaned records if transaction fails
   - **Mitigation:** Use database transactions, add cleanup script

2. **Screaming Frog Parser:** Large files (50k+ rows) could timeout
   - **Mitigation:** Already using streaming parser, add progress indicator

3. **AI Generation:** Could exceed token limits with large datasets
   - **Mitigation:** Truncate metrics to top N items, add token counting

---

## Rollback Plan

### If Phase 1 Fails
1. Drop `report_category` column
2. Restore original unique constraint
3. Revert sync route changes

### If Phase 2 Fails
1. Revert CSV parser changes
2. Restore original priority calculator
3. Remove new metric fields from schema

---

## Conclusion

This comprehensive plan implements all 6 phases of the enterprise hub enhancement:

1. ✅ Dual SEO/PPC report generation with category tracking
2. ✅ Advanced Screaming Frog extraction with Gifty's priority hierarchy
3. ✅ 4-tier AI prompt amalgamation with historical learning
4. ✅ Client portal dashboard with notifications and status-based interactivity
5. ✅ Contextual support FAB with intelligent ticket routing
6. ✅ Admin settings with agency team CRM management

**Total Estimated Effort:** 3-4 weeks
**Risk Level:** Medium (well-scoped, incremental changes)
**Dependencies:** Existing database schema, Supabase, Anthropic API

**Ready for sequential implementation with surgical diffs and build verification at each phase.**
