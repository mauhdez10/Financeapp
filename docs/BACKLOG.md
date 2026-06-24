# BACKLOG.md — Golden Anchor Finance green-light queue

> THE single ordered execution queue for autonomous `/loop` work (cross-project PLAYBOOK §2).
> The autonomous loop reads this + `REVIEW_QUEUE.md` + the top `CHANGELOG.md` entry (the cursor)
> each iteration, takes the top 🟢 unblocked item, and works it to definition-of-done.
>
> **Status legend:** 🟢 green-light (pre-approved, no-ask) · 🔵 in progress · ✅ done ·
> ⛔ blocked (owner-only) · 💤 deferred (needs fresh context / bigger setup)
>
> **GREEN-LIGHT SCOPE (what the loop may ship with NO further ask):** build+runtime-verified
> refactors, bug fixes, UI/label/copy fixes, doc hygiene, additive non-destructive changes.
> **OUT OF SCOPE — require an explicit owner ask:** pricing/tiers (D-13b), permissions/roles/RLS,
> billing/Stripe behavior, any destructive DB change, removing a feature. Anything touching
> roles / portal / RLS / SSN / splits / visibility MUST consult `golden-anchor-logic` first.

## Cursor (where we are)
Live marker **v0.80.7** (`2026-06-24-v0807-phase2-report-blocks-extracted`). `App.jsx` = 3,023 lines
(down from 8,502). Phase 2 decomposition in progress — 5 slices shipped this run.

## Queue (top = next)

### Phase 2 decomposition — pure refactors, build + runtime verified (very green-light)
- ✅ **Import/backup/export cluster** → `utils/import.js` (13 helpers) + `components/clientData.jsx`
  (6 modals). Done v0.80.8 (2026-06-24); Import-Clients wizard + Export modal verified live.
  `ArchivedSection` moved but unused (dead — drop in a later sweep).
- 🟢 **Report views/tabs** → `components/clientReports.jsx` (`SummarySection, FullReport,
  SummaryReport, MonthlyTab, FinancialStatementsTab, InvestmentsTab, the *ReportTab family,
  CompleteReportTab, AssetsLiabilitiesTab, FinancialPlanTab, YearCompareView, CompareReportTab,
  ClientReport` + the report modals `NMModal/CmpModal/VHModal/EmailReportModal/ExportHoldingsModal`).
  Map deps with `scripts/_xtract.py` (auto-derives imports + flags dangling refs); verify each cut
  in the live app before committing. Likely needs a couple of shared helpers relocated to utils.
- 💤 **`ClientDetail` / `Dashboard` shells** — HIGHEST coupling (threads client state to every tab).
  Do LAST, in a fresh-context session.

### Doc hygiene (green-light)
- ✅ Backfill `CHANGELOG.md` entries for v0.80, v0.80.1, v0.80.2 (done 2026-06-24, autonomous loop).
- ✅ Refresh `AGENT.md §3` "Current version" v0.69.8 → v0.80.7 + Phase 2 status (done 2026-06-24).

### Owner-only (⛔ do NOT auto-do — needs a dashboard/key/decision)
- ⛔ Paste the 2 Vercel env vars (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`) → unlocks
  auto-activation, any-amount checkout, MRR panel.
- ⛔ Rotate all pasted secrets before launch (Stripe/Resend/GitHub PAT/Supabase `sbp_`).
- ⛔ GTM docs `[OWNER: fill]` metrics/ask.
- ⛔ Landing-motion design iteration (owner feedback vs his refero/mux refs).

## How items get added
Owner batches → triage into 🟢/⛔ here (bugfix/UI/doc-hygiene = 🟢; pricing/role/billing/
destructive = ⛔ until answered). Newest round on top. The loop refills from `REVIEW_QUEUE.md`
queued items when this drains.
