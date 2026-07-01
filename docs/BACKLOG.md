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
Live marker **v0.83.58** (`2026-07-01-v08358-xlsx-lazy-import-off-eager-path`). `App.jsx` = **926 lines**.
Shipped: scale layer + crash fixes (v0.83.1–7), docs-lifecycle + cruise infra, a day-long autonomous
sweep (~ISS-27→92: bug/i18n/a11y/calc), CC feature slice A (v0.83.55), and lucide+xlsx optimization
(~1.1MB off eager load). `npm audit` clean.

## Queue (top = next)

### CC "last-used / 0% APR + unused reminder" feature (2026-06-27, ROUND_01) — IN PROGRESS
- ✅ **Slice A** — card `lastUsed` + `apr0End` fields + CardModal inputs + DebtSection badge + i18n. Shipped v0.83.55.
- ⛔ **Slice B (attended, needs a small spec)** — client-facing "card unused X months" reminder.
  **Architecture note (2026-07-01):** `getClientRem(clients)` today feeds ONLY the advisor's "Client
  Due" panel (dashboard.jsx:85) — **there is NO client-role reminder surface.** So Slice B = (1) a new
  client-Overview reminders strip, (2) a client Settings toggle + `cardUnusedMonths` (default 3, opt-in),
  (3) `getClientRem` gains a `settings` param + `cardUnused` logic (months-since `cc.lastUsed` >= N).
  New surface → focused build, not autonomous.
- ⛔ **Slice C (attended)** — advisor "client's card unused" alert. **Gating ambiguity to resolve first:**
  `getAdvRem` gates on `settings.reminderAdvisor?.X` AND dashboard.jsx re-filters on `settings.alertTypes`
  via a task-keyword `typeKeyMap` — two layers; confirm which is live before adding `cardUnused` (else it
  silently never fires). Then add the `getAdvRem` branch + AlertsSettingsModal toggle + typeKeyMap entry.
  **Scale caveat (ISS-04 class):** advisor holds summary rows, not blobs → `lastUsed` (blob-only) means
  the alert only fires for loaded clients unless a `last_used`-derived summary column + backfill is added.
  ✅ Data foundation (card `lastUsed`/`apr0End` fields) already shipped in Slice A (v0.83.55).

### Optimization roadmap — top items (2026-06-27 research; full doc: OPTIMIZATION-ROADMAP.md)
- 🟢 **Deep-import lucide-react icons** (perf·high·S) — biggest bundle win, near-zero risk. **Loop-ok.**
- 🟢 **Dynamic-import XLSX behind import wizard** (perf·high·S) — advisor-only 122KB. **Loop-ok.**
- 🟢 **Route-split pages via React.lazy** (perf·high·M) — index chunk <800KB. **Loop-ok (verify each surface).**
- 🟢 **Vitest for the money layer** (arch·high·M) — port harnesses; catches the ISS-44…91 class. **Loop-ok.**
- ⛔ **Atomic client-save RPC** (fixes ISS-12/13/15) — the #1 priority but ⛔attended (live save path).
- 🟡 **Confirm Vercel Pro plan** — owner dashboard check (launch blocker).

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
- 🔵 **FG-3 — Daily habit / streak + micro-lessons** (bilingual) — **active, no cost. SPEC WRITTEN
  2026-06-26 (cron tick), awaiting owner review** → `docs/superpowers/specs/FG-3-habit-streak-microlessons.md`
  (queued in REVIEW_QUEUE + 7 open questions in CRUISE_QUESTIONS). Design: client-only Overview "Today"
  card, isolated `habit_state` table (never touches the live save path), static bilingual lesson
  library — no Claude API, no new Vercel function. **Build only after the owner answers the open
  questions / approves the spec.**
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
