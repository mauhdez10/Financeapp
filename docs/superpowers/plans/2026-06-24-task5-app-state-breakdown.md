# Task 5 — App-state rewire: turnkey decomposition

> Companion to `2026-06-24-scalable-data-layer.md`. Captures the EXACT App.jsx
> consumer map (discovered 2026-06-24) so the final, highest-risk task executes
> as small, independently-shippable, individually-verifiable cuts — never a
> big-bang spine refactor on a live prod deploy.

## What's already done + deployed (v0.81.0 → main)

- **Task 1** DB: summary columns + `client_monthly_summary` + 2 dashboard RPCs, RLS-scoped, anon-revoked. Verified.
- **Task 2** Write path: `gaSaveClient` derives summary cols + monthly rows on save. Verified live.
- **Backfill**: existing demo clients (3 on test acct) populated; matches app math.
- **Service layer** (additive, UNWIRED): `gaListClients({page,pageSize,sort,search,archived})`, `gaLoadClient(userId,localId)`, `gaDashboardSummary()`, `gaDashboardTrend()` in `src/services/supabase.js`. RPC aggregates verified (3 clients → debt 363550, income 30200).

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
