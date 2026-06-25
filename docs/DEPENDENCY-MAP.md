# DEPENDENCY-MAP.md — Golden Anchor Finance (what-touches-what)

> The forward/backward impact-check reads this before any change (`finance-review-mode` §4c step 2).
> Two layers: **code entry points** (module graph) and **data** (tables/RPCs ↔ service functions).
> Seeded 2026-06-25 from the live import graph + `src/services/supabase.js`. Regenerate on big
> changes (`graphify-out/GRAPH_REPORT.md` is the machine source). One owner per topic — when this
> drifts, regenerate rather than hand-patch every row.

## Code layers (import direction → depends on)

```
App.jsx  ── the shell/router; imports EVERY page + component + service + util + constants
  ├─ services/supabase.js ............ ALL data I/O (see data layer below)
  ├─ translations.js ................. T.en / T.es (D-3 — every visible string, both langs)
  ├─ constants/{meta,chartOptions} ... pure data factories (no React, no cycles)
  ├─ styles/theme · contexts/theme · hooks/anim ... theming + animation primitives
  ├─ utils/{finance,import,aiExport} . pure helpers (finance = the money formulas)
  ├─ components/* .................... see below
  └─ pages/* ......................... admin, intake, landing, links, marketing, members,
                                        onboarding, portal, public
```

**Component sub-graph (the edges that bite):**
- `dashboard.jsx` → imports `chartEditors.jsx` (ChartSettingsModal, DashSlotPicker). **One-way.**
  Both read `dashChartOptions` from `constants/chartOptions.js` — extracted there specifically to
  avoid a dashboard ⇄ chartEditors **cycle** (see ISS-02 / v0.83.7). Don't reintroduce the cycle.
- `clientList.jsx` → `clientData.jsx` + `clientModals.jsx`; `clientCalcs.jsx` → `calculators.jsx`.
- Nearly every component → `components/primitives.jsx` (Btn/BSolid/Modal/KpiTile/…) +
  `utils/finance.js` (fmt, sums, ratios) + `contexts/theme.js` (`useTh`) + `styles/theme.js`
  (`mCARD`/`mTH`/tokens). **`primitives`, `finance`, and the theme pair are load-bearing — a change
  there is high blast-radius; grep every importer first.**
- `utils/import.js` (Excel/CSV importer) → `utils/finance.js` + `constants/meta.js` (`MS`). Consumed
  by `clientData.jsx` + `clientList.jsx`.

## Data layer (DB ↔ service function ↔ purpose)

Service functions live in `src/services/supabase.js` (the `ga*` family); the app imports them in
`App.jsx`. **All DB I/O goes through here — no component queries Supabase directly.**

| Table | Written by | Read by | Notes |
|---|---|---|---|
| `clients` | `gaSaveClient`, `ga_set_archived`, delete/split/join | `gaLoadClients`, `gaLoadClientSummaries`, `gaLoadClient`, `gaLoadAllClientBlobs` | JSONB blob = source of truth + derived summary columns. **THE live save path.** |
| `client_monthly_summary` | derived on save (`gaSaveClient`) | dashboard RPCs, `ga_advisor_reminders` | per-month time-series for scale. |
| `settings` | `gaSaveSettings` | `gaLoadSettings` | per-user app settings. |
| `intake_submissions` | `gaSubmitIntake`, status/data updates | `gaLoadIntakeSubmissions` | public intake. |
| `intake_invites` | `gaSendIntakeInvite`, mark-submitted | `gaLoadIntakeInvites`, `gaResolveIntakeInvite` | advisor-issued invites. |
| `portal_links` | `gaCreatePortalLink`, `gaRevokePortalLink` | `gaListPortalLinks`, `gaResolvePortal` | read-only share portal (server-sanitized allow-list). |
| `client_links` | account-linking (Link-R) | linked-client resolution | client↔advisor account link. |

**RPCs (RLS-scoped, anon-revoked):** `ga_dashboard_summary` / `_trend` / `_top_debts` /
`_asset_alloc` / `_client_deltas` (the 5 dashboard aggregates), `ga_advisor_reminders`
(No-Contact + High-DSR + Debt-Rising), `ga_set_archived` (archive column + blob flag).

## ⚠️ The fragile path — change only with the push discipline (§6)
`gaSaveClient` → the array-diff persist effect → `clients` row + derived summary + monthly summary.
Plus archive/split/join/delete and `gaLoadClient`/`gaLoadClientSummaries`/bootstrap. A subtle bug
here silently breaks saving **in production**. Any change you can't verify headlessly → commit
local, do NOT push, stage in `REVIEW_QUEUE.md`. Consult `golden-anchor-logic` first.

## Shared intents with multiple UI entry points (forward-trace targets)
When changing one of these, redirect/remove **every** entry point (don't leave an old default):
- **Export / backup:** `ExportModal` (Dashboard + ClientList) + ClientList "Backup All" kebab +
  `BackupPage` — all route through `gaLoadAllClientBlobs` + `expBackup`.
- **Dashboard chart slots:** `DashSlotPicker` (per-chart ⚙, dashboard) + `ChartSettingsModal`
  (avatar menu → Chart Settings) — both consume `dashChartOptions`.
- **Reminders:** `RemindersPanel` (server `ga_advisor_reminders`, falls back to client-side
  No-Contact).
