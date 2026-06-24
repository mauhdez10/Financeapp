# Task 5 — App-state rewire: turnkey decomposition

> Companion to `2026-06-24-scalable-data-layer.md`. Captures the EXACT App.jsx
> consumer map (discovered 2026-06-24) so the final, highest-risk task executes
> as small, independently-shippable, individually-verifiable cuts — never a
> big-bang spine refactor on a live prod deploy.

## What's already done + deployed (v0.81.0 → main)

- **Task 1** DB: summary columns + `client_monthly_summary` + 2 dashboard RPCs, RLS-scoped, anon-revoked. Verified.
- **Task 2** Write path: `gaSaveClient` derives summary cols + monthly rows on save. Verified live.
- **Backfill**: existing demo clients (3 on test acct) populated; matches app math.
- **Service layer** (additive, UNWIRED): `gaListClients({page,pageSize,sort,search,archived})`, `gaLoadClient(userId,localId)`, `gaDashboardSummary()`, `gaDashboardTrend()` in `src/services/supabase.js`.
- **v0.81.2** Derived `monthly_bills`/`monthly_debt_min` summary columns (Sankey/Practice-Health inputs).
- **Dashboard RPCs extended + verified** (migration `extend_dashboard_rpcs_tiers_bills_counts`, anon-revoked):
  - `ga_dashboard_summary()` → adds `total_bills, total_min, total_nw` + net-worth tier counts
    `nw_neg/nw_low/nw_mid/nw_high` (buckets <0 / <50k / <250k / ≥250k — match dashboard.jsx:268).
  - `ga_dashboard_trend()` → adds per-month `client_count` (KPI sparkline). Verified live (tiers
    1/1/1/0, total_nw 237116, trend 6 months). **NOTE:** bills/min totals are currently PARTIAL —
    only re-saved clients carry the columns; backfill ALL clients first thing in the wiring session.

**⇒ The entire additive data layer (3 layers + write path + service wrappers + all dashboard
aggregates) is DONE, verified, secured. The ONLY remaining work is non-additive APP WIRING below.**

### Dashboard aggregation RPC layer — status (2026-06-24, full server aggregation)

All verified live (simulated test-user auth), all anon-revoked / authenticated-only:
- `ga_dashboard_summary()` ✓ — KPIs, Sankey, NW-tier donut, Practice-Health, Waterfall, Radar
  (client_count, total_debt/income/bills/min/liquid/nw, finance_only/health, nw_neg/low/mid/high).
- `ga_dashboard_trend()` ✓ — per month: debt/savings/income/spending/client_count **+ a_liquid/a_invest/
  a_property/a_other + l_cards/l_loans_all/l_loans_current**. Powers trend, KPI sparklines, NetWorthBridge,
  Forecast, debt-mode trend (revolving=l_cards, all=+l_loans_all, current=+l_loans_current), Cash-Flow.
- `ga_dashboard_top_debts(limit)` ✓ — Debts-by-Balance (from `clients.debts` jsonb).
- `ga_dashboard_asset_alloc()` ✓ — Asset-Sunburst by bucket+name (from `clients.assets` jsonb).
- Treemap / Ranked (top-N clients by net_worth) → `gaListClients({sort:'netWorth'})` (add netWorth sort).
- `ga_dashboard_client_deltas(limit)` ✓ — Dumbbell / Slope: top-N active clients with first/last-month
  asset-based NW `(a_*−l_*)` + current net_worth, from `client_monthly_summary`. Verified.

**⇒ DASHBOARD AGGREGATION DATA LAYER 100% COMPLETE + VERIFIED.** Every chart has a server-side source;
no dashboard chart needs a blob. **Remaining is purely non-additive APP WIRING:**
1. Backfill ALL clients (re-save each so every rollup column is populated, not just re-saved ones). For
   the 3 test clients: re-save via the app, or a node script copying the full derivers (note: sumB/sumMin
   pull in `actB`/`effectiveMin` — copy those too, or run through the app).
2. WIRE dashboard.jsx → the 5 RPCs (App fetches on nav=dashboard for advisors, passes down; drop the
   `clients`-array computations). Verify each chart matches the current render.
3. ClientList paging + App-state flip + server bulk/pickers/export (the consumer table above).

NOTE on faithful port: dashboard `dashSearch` (filters which clients the aggregates cover) has no RPC
equivalent yet — either drop it or add a search arg to the summary/trend RPCs during wiring.

## The spine: every consumer of the full `clients` array (src/App.jsx)

The in-memory `clients` array is load-bearing. Each must be addressed before the
load-everything (`gaLoadClients`, App.jsx:307) can be dropped:

| # | Line | Consumer | Disposition |
|---|------|----------|-------------|
| 1 | 798 | `ClientList clients=` | → `gaListClients` paged + virtualized (Task 3 proper) |
| 2 | 797 | `Dashboard` | → `gaDashboardSummary`/`gaDashboardTrend` RPC |
| 3 | 796 | `ClientDetail allClients=` | split/join pickers → server `gaListClients` picker |
| 4 | 705 | `ProfileModal clients=` | confirm usage (advisor count?) — likely count only |
| 5 | 708 | `ImportWizard existingClients=` | dup-detection → server dup check or lazy load |
| 6 | 704 | `DuplicateResolverModal existing=` | same as #5 |
| 7 | 805 | `SettingsPage clients=` | client-role `clients[0]`; advisor maybe count |
| 8 | 808 | `BackupPage clients=` | export-all → paginate/stream (rare admin action) |
| 9 | 809 | `ArchivedClientsPage clients=` | → `gaListClients({archived:true})` |
| 10 | 804 | `UsefulLinksPage client={clients[0]}` | client-role single — no change |
| 11 | 699 | `PremiumCtx clients[0]` | client-role single — no change |
| 12 | 678 | `displayName clients[0]` | client-role single — no change |
| 13 | 378–444 | routing `clients.find(id)` | open by id → `gaLoadClient` |
| 14 | 634–641 | addClient/split/restoreBackup/join mutate array | re-derive current page after mutate |
| 15 | 791 | `archivedCount clients.filter` | → count from `gaListClients` total |

**Key risk-reducer:** scale is an ADVISOR-only concern. The client role holds ONE
self-record (`clients=[self]`, App.jsx:315/357). Leave the entire client-role path
untouched — only the advisor path paginates. This halves the blast radius.

## Safe sub-step order (each: build green → run-verify in app → commit → push)

- **5a. Drop the `ga_v3` localStorage full-cache.** App.jsx:246 (init) + :341 (write).
  This is the NEAREST hard wall (~5 MB quota blows at a few hundred snapshot-heavy
  clients). Keep `ga_cache_uid` foreign-purge (302–304, pitfall #18) and the small
  `ga_session_draft`. Lowest risk, highest near-term value. Init `clients` from
  `SEED`/`[]` instead of `ga_v3`.
- **5b. Dashboard → RPC.** Isolated; fixes continuous dashboard degradation (#4).
  Verify totals match the current client-side numbers (already cross-checked: debt
  363550, income 30200).
- **5c. ArchivedClientsPage → `gaListClients({archived:true})`.** Isolated.
- **5d. ClientList → paged/virtualized `gaListClients` + open-row `gaLoadClient`.**
  THE big one. Advisor `clients` becomes `clientsPage` (≈50 summary rows) + `openClient`
  (one full blob). Routing lookups (#13) load on demand. Re-derive page after mutations (#14).
- **5e. All-iterating consumers** (split/join pickers, import dup-check, backup export-all)
  → server queries. Hardest; do last, with care.
- **5f. Adversarial RLS re-proof** across new columns/table/RPC: advisor, linked client,
  unlinked client, revoked link each see only their own (logic skill §6).

## Verification gate (per spec §8)

Synthetic 10k–50k seed through the real save path (`scripts/seed_synthetic.mjs`, dev-only,
service-role or test-user auth — see backfill pattern). Success = sub-second list +
dashboard + flat memory regardless of client count. EN/ES symmetry on any new strings (D-3).

## Constraints (carry into every cut)

D-1 single file · D-3 EN+ES same edit · pitfall #12 (local_id is the app id) · #15 (no
dotted values in `.or()` — search already sanitized) · #17 (no nested component defs) ·
#18 (uid-namespace any cache) · #20 (Vercel 12-function cap — NO new `api/*.js`).

## ⚠️ Coupling reality (deeper read, 2026-06-24) — this is ONE coordinated flip

Reading `dashboard.jsx` and `clientList.jsx` in full shows 5b/5c/5d are NOT independently
shippable. Converting any single consumer to server-fetch while `App()` still loads the full
array adds code for **zero** scale benefit — the win only lands when the load-everything
(`gaLoadClients`, App.jsx:307) is removed, which requires EVERY advisor-path consumer below to
no longer need the full array, all in the same change. Do it as one coordinated, preview-verified
unit (client-role path untouched), not piecemeal-to-prod.

**`Dashboard` (dashboard.jsx) full-array uses — needs more than the 2 RPCs:**
- KPI headline numbers (debt/income/liquid/counts) → `ga_dashboard_summary` ✅ covered.
- Trend chart (per-month debt/savings across all clients) → `ga_dashboard_trend` ✅ covered.
- **Sankey** (aggregate income/bills/min) — `monthly_bills`/`monthly_debt_min` summary columns now
  derived on save (v0.81.2); an aggregate RPC can `sum()` them + `monthly_income`. (income already covered.)
- **Practice-Health gauges** (DSR/savings/EF from inc/bills/min/liquid) — same columns; aggregate RPC.
- **Net-worth donut** (tier counts: nw<0 / <50k / <250k / ≥250k from `net_worth`) — needs tier-count RPC.
- **Ranked / Treemap** (top-N active clients by net_worth) — `gaListClients` sort=netWorth, limit N (NOT all).
- **KPI sparklines** (per-month client-count / income / debt / savings series) — partly from trend;
  client-count-per-month series needs `client_monthly_summary` presence counts.
- Dashboard search box + Import/Backup/Export modals also take the full `clients`.
→ Full 5b requires EXTENDING the dashboard RPCs (Sankey totals, NW tiers, per-month counts) so the
  screen renders with no blob array. Until then, Dashboard pins the load-everything.

**`ClientList` (clientList.jsx) full-array uses — far more than display:**
- search + 5 sort modes (name/recent/debt/income/netWorth) → already in `gaListClients` (add netWorth sort).
- **Bulk archive/restore/delete**: select pool, select-all, `selClients=ids.map(find)` — needs
  server-side selection semantics across pages (select-all-matching, not select-all-loaded).
- **Split/Join pickers** (`partnered`/`singles`, `JoinModal allClients=`) — must search ALL clients
  server-side, not filter the page.
- **Import** (`existingClients=` for dup-detection), **Export/Backup-all** (`expBackup(clients)`,
  `ExportModal clients=`) — need server pagination/stream over all rows (rare admin action).
- render `filtered.map` = one DOM node per client → **virtualize** (windowing) for #3.

**Files the coordinated flip touches:** `App.jsx` (clientsPage/openClient state + load effects +
mutation handlers + the ~15 props), `dashboard.jsx` (RPC + extended RPCs), `clientList.jsx`
(paged/virtualized + server bulk/pickers), `clientData.jsx` (import/export/backup over server),
`clientModals.jsx` (Join `allClients`), plus DB (new aggregate RPCs for Sankey/NW/counts).

**Recommended execution:** a focused session — extend the dashboard RPCs first (DB, additive,
safe), then flip `App()` + all advisor consumers together behind the preview gate (verify login,
load, list+search+sort, bulk ops, split/join, import/export/backup, dashboard, open, save — ALL
green) before a single push to main. Seed 10k–50k synthetic first (Task 0) so the flip is measured,
not assumed.
