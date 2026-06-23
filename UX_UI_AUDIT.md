# UX / UI Audit — SEO Reporting Platform

**Scope:** Admin Editor (`/admin/*`) and Client Portal (`/portal/*`, `/report/*`).
**Method:** Static review of the Tailwind utility classes across the page and
component layer. **This document is advisory only — no styling, layout, font, or
colour changes were made to the codebase as part of this audit.**

A quick orientation on where the styles live:
- Global shell + fonts: [`app/layout.tsx`](my-app/app/layout.tsx) (Geist Sans/Mono, `bg-slate-50`).
- Admin report editor: [`app/admin/reports/[id]/page.tsx`](my-app/app/admin/reports/[id]/page.tsx) and the `report-editor-*` components.
- Client hub: [`app/admin/client/[id]/page.tsx`](my-app/app/admin/client/[id]/page.tsx).
- Portal: `components/portal/*` (`seo-view`, `dashboard-view`, `metric-card`, etc.).

---

## 1. Information Hierarchy

**What works**
- A consistent type ramp exists: page titles use `text-xl`/`text-2xl font-semibold|bold`,
  card titles use `text-sm`, and helper text uses `text-[10px]`–`text-xs`. This
  reads as deliberate rather than accidental.
- The editor uses left-accent borders (`border-l-4`) to colour-code card intent
  (blue = context, amber = priorities, severity colours on the priorities card),
  which gives a fast visual scan path.

**Where it weakens**
- **Critical numbers do not command attention.** KPI values in
  [`report-editor-kpi-summary.tsx`](my-app/components/admin/report-editor-kpi-summary.tsx)
  render at `text-lg font-semibold`, the *same weight class* as ordinary card
  body text elsewhere. The single most important data on the page (sessions,
  clicks, avg position) should be visually dominant.
- **Card titles and KPI labels compete.** Card titles (`text-sm`) and the
  uppercase KPI labels (`text-[10px] uppercase tracking-wide`) are close enough
  in visual weight that the eye has to work to find the primary metric.
- **`h1` vs section headings.** The editor has a single `h1` (`text-xl`) but the
  per-section cards rely on `CardTitle` (`text-sm`) with no intermediate `h2`
  tier, so the document feels "flat" — every section header has equal weight.

---

## 2. Legibility & Contrast

**What works**
- Body copy is predominantly `text-slate-900`/`text-slate-700` on white/`slate-50`,
  which is comfortably above WCAG AA.
- The forced light theme ([`layout.tsx`](my-app/app/layout.tsx) `forcedTheme="light"`)
  removes dark-mode contrast surprises.

**Where it weakens**
- **`text-slate-400` helper text is borderline.** The pervasive `text-[10px] text-slate-400`
  helper captions (integration field hints, logo path, "Auto-generated"
  placeholders) sit near the AA threshold for small text on white and below it on
  `bg-slate-50`. At 10px this is the most at-risk text on the platform.
- **Coloured metric values on tinted chips.** In
  [`report-editor-technical-metrics.tsx`](my-app/components/admin/report-editor-technical-metrics.tsx),
  `text-yellow-600` on `bg-yellow-50` is the weakest pairing — readable but the
  lowest-contrast combination in the suite.
- **Placeholder-as-content.** Some "empty" affordances rely on light placeholder
  text (`placeholder:text-slate-500`) to convey meaning; for accessibility,
  important states should not depend on placeholder contrast.

---

## 3. Button Placement & Spacing

**What works**
- Primary actions are consistently bottom-right or top-right of their cards
  (`flex justify-end`), which matches user expectation for "commit" actions.
- Loading states are now consistent: primary buttons disable and swap to a
  spinner + "Saving…/Testing…/Deleting…" label.

**Where it weakens**
- **Primary vs secondary prominence is muted.** The primary button is shadcn's
  default dark `bg-slate-900`; secondary/outline buttons are also fairly heavy.
  On the report editor header, "Live Preview", "Sync Live Data", and "Generate AI
  Analysis" sit in a row of near-equal visual weight, so the *intended* primary
  (Generate) doesn't clearly win.
- **Dense action rows.** The editor header action cluster uses `gap-2` with
  `size="sm"` buttons; on smaller widths the three actions feel cramped.
- **Inconsistent vertical rhythm.** Cards mix `space-y-3`, `space-y-4`, and
  `space-y-8` between sections; the jumps are noticeable when scrolling the
  editor end-to-end.

---

## 4. Actionable Recommendations (Tailwind adjustments for V2)

These are concrete, low-risk class swaps to make the platform feel more premium.
**They are recommendations only — not applied in this pass.**

1. **Make hero numbers dominant.** In the KPI summary, bump values from
   `text-lg font-semibold` to `text-3xl font-bold tracking-tight tabular-nums`
   and demote labels to `text-[11px] font-medium text-slate-500`. `tabular-nums`
   keeps figures aligned as they change.
2. **Introduce a real `h2` tier.** Give section `CardTitle`s `text-base font-semibold text-slate-800`
   (up from `text-sm`) so sections outrank body copy and the page gains rhythm.
3. **Lift helper-text contrast.** Replace `text-slate-400` micro-copy with
   `text-slate-500`, and raise the smallest captions from `text-[10px]` to
   `text-xs` for AA compliance on `bg-slate-50`.
4. **Differentiate primary buttons.** Brand the primary action with the client
   colour (e.g. `bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white shadow-sm`)
   and downgrade secondary actions to `variant="ghost"` so one button clearly leads.
5. **Standardise card padding & gaps.** Adopt one scale: `p-5` inside cards and
   `gap-6` between sibling cards; reserve `space-y-8` only for top-level row groups.
6. **Soften card surfaces for depth.** Add `rounded-xl border border-slate-200/70 shadow-sm`
   to cards (currently flat) for a more premium, layered feel.
7. **Tighten numeric typography globally.** Apply `tabular-nums` to all metric
   chips in `report-editor-technical-metrics.tsx` so columns don't shift width.
8. **Improve low-contrast chips.** For the medium-severity chip, switch
   `text-yellow-600 bg-yellow-50` to `text-amber-700 bg-amber-50` for a clearer pairing.
9. **Add focus-visible polish.** Ensure interactive rows (report table, priority
   rows) use `focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none`
   for keyboard users.
10. **Consistent empty states.** Replace ad-hoc "No data" `text-slate-400` blocks
    with a shared pattern: a muted icon + `text-sm text-slate-500` line, centered
    with `py-12`, so every empty widget feels intentional.

---

## 5. Manual Testing Script (Human, In-Browser)

Run these five steps against the local dev server (`http://localhost:3000`) to
confirm the end-to-end flow feels smooth.

1. **Upload & parse.** Go to a client → **Reports → New Report → Manual Upload**.
   Drop a Screaming Frog "Internal All" CSV (and optionally GA4 "Traffic
   acquisition" + GSC "Queries" exports, including a MoM export with
   `dd/mm/yyyy - dd/mm/yyyy Clicks` headers). Confirm the dialog shows progress
   and closes without an "Upload failed" alert, and that re-uploading the **same
   month** updates rather than erroring.

2. **Verify parsed metrics.** Open the new report in the editor
   (`/admin/reports/[id]`). Confirm the **Technical Health** card shows non-zero
   counts, **GA4 Traffic by Channel** and **GSC Top Queries** charts render (not
   "No data"), and the **KPI summary** shows real Sessions/Clicks/Avg Position —
   no `NaN` or blank values.

3. **LLM interpretation.** Click **Generate AI Analysis**. Confirm a toast tracks
   progress and the Executive / Traffic / Technical narrative sections populate
   with text. Re-running should overwrite cleanly without duplicate-row errors.

4. **Edit Top Priorities.** In the **Top Actionable Priorities** card, add a known
   issue from the dropdown, then add **"Other (manually enter)"** and type a custom
   title + fix copy. Reorder, save (expect a success toast), reload the page, and
   confirm the manual list persists. Open the client report
   (`/report/[id]?preview=true&key=…`) and confirm the client sees your curated list.

5. **Test integration + broken assets.** Go to **Integrations**, enter SE Ranking
   credentials, and click **Test Connection** — confirm the button disables and a
   success/`Failed: …` toast appears with the real message. Finally, set the
   client logo URL to an invalid value and confirm the avatar and portal header
   degrade gracefully (fallback icon / hidden logo) instead of showing a broken
   image that breaks the layout.
