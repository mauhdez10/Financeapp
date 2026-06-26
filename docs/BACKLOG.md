> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Standing green-light queue. Items drain into shipped work; refills from REVIEW_QUEUE. The file persists; entries don't linger once done.

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
Live marker **v0.83.7** (`2026-06-25-v0837-chartsettingsmodal-dashchartoptions-fix`). `App.jsx` ≈ 3,023
lines. Scale data layer + crash fixes shipped; docs lifecycle + cruise infra in place; `npm audit` clean.

## Queue (top = next)

### Owner-approved features — 2026-06-26 (direction GREEN; each needs a spec/plan before code)
> Approved from the feature-gap scan. These are **large new surfaces** — each gets brainstorm → spec
> (`docs/superpowers/specs/`) → plan before implementation; build to spec, EN/ES (D-3), consult
> `golden-anchor-logic` for any client-data read.
- ⏸️ **FG-1 — In-app bilingual AI assistant** — **DEFERRED by owner 2026-06-26 ("no cost things right
  now").** Needs a Claude API key + cost sign-off → out of scope until the owner re-greens it. The
  cruise loop must NOT pursue this. (Spec note for later: server route in `api/`, mind the 12-function
  cap; scope data per role, never leak cross-client.)
- ⏸️ **FG-2 — Auto-generated personalized plan** — **DEFERRED by owner 2026-06-26 (same "no cost" call;
  same Claude-API dependency).** Cruise loop must NOT pursue. Reuses report/aiExport groundwork later.
- 🟢 **FG-3 — Daily habit / streak + micro-lessons** (bilingual) — **active, no cost.** Large new
  surface + streak persistence. **SPEC FIRST:** the loop (or an attended session) writes a spec to
  `docs/superpowers/specs/` and queues it for owner review — do NOT blind-build the full surface in an
  autonomous tick. Build only after the spec is approved.
- ⏸️ **FG-4 — Plaid auto bank-linking — HOLD** (owner decision: conflicts with the coaching/low-tech/
  advisor-entered model; revisit later as an optional Premium add-on).

### Phase 2 decomposition — pure refactors, build + runtime verified (very green-light)
- ✅ **Import/backup/export cluster** → `utils/import.js` (13 helpers) + `components/clientData.jsx`
  (6 modals). Done v0.80.8 (2026-06-24); Import-Clients wizard + Export modal verified live.
  `ArchivedSection` moved but unused (dead — drop in a later sweep).
- ✅ **Report views/tabs** → `components/clientReports.jsx` (~30 components incl. history modals +
  getClientForMonth/saveHistoricalUpdate helpers). Done v0.80.9 (2026-06-24); all 6 tabs + Client
  Report sub-views (Summary/Monthly/Complete/Compare) verified live. App.jsx → 1,852 lines.
- 💤 **`ClientDetail` / `Dashboard` shells** — HIGHEST coupling (threads client state to every tab).
  Do LAST, in a fresh-context session. After this, App.jsx is ~the shell + IntakeSection +
  RemindersPanel/AlertsSettingsModal + NewClientModal/ClientForm/ProfileModal + the App() router.

### Cleanup finds (green-light, low priority)
- ✅ Dead code: `ArchivedSection` removed (v0.80.10, 2026-06-24, autonomous loop).
- ✅ Pre-existing React warning: `CompareReportTab` (now in `clientReports.jsx`) rendered a whitespace
  text node inside `<tbody>` (stray space in `;})} </tbody>`, both tables). Fixed v0.83.5 (2026-06-24,
  cron tick) — committed LOCAL only (stacked behind the held v0.83.1; see CHANGELOG + REVIEW_QUEUE).

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
