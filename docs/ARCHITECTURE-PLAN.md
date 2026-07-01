# Architecture & Cleanup Plan — financeapp → CRM/SaaS

> **Status: IN EXECUTION (updated 2026-06-24).** D-1 was relaxed → **D-37** locked. Phase 0
> (constants/styles/utils/services/contexts/hooks) and Phase 1 (charts/primitives/calculators)
> shipped. **Phase 2 in progress** — `App.jsx` is down from 8,502 → **3,023 lines**. Extracted
> so far into `src/components/`: `clientModals` + `clientSections` (v0.80.4), `clientCalcs`
> (v0.80.5), `chartEditors` (v0.80.6), `reportBlocks` (v0.80.7). Each move is byte-exact,
> build-green, and runtime-verified in the live app.
>
> **Import/backup/export cluster — DONE (v0.80.8, 2026-06-24).** Helpers relocated to new
> `utils/import.js` (`findDuplicate, smartMerge, parseCRMCsv, parseWorkbook, validateBackup,
> expBackup` + the snapshot/month helpers), modals extracted to `components/clientData.jsx`.
> (`ArchivedSection` came along but is dead/unused — drop in a later sweep.)
>
> **Still remaining:** the report views/tabs (`SummarySection`, `FullReport`, `SummaryReport`,
> the `*Tab` family) and finally the `ClientDetail` / `Dashboard` shells — the highest-coupling
> pieces (§3 says do last; prefer a fresh-context session).

> One-paragraph intro: the app is one 8,502-line file (`src/App.jsx`) by locked decision
> **D-1**. That made sense for a solo tool managed through the GitHub web UI; it does **not**
> scale to a CRM/SaaS built via Claude Code + git. This plan lays out (a) why and how to
> relax D-1 and modularize in safe phases, (b) a stale/trash doc cleanup, and (c) a separate
> "logic library" skill so the calculators/charts/fields have documented human logic behind
> them (for the how-to guides). Everything is sequenced lowest-risk-first and stays
> build+run verified per the cross-project playbook §6/§7.

## Index
| § | Section | For |
|---|---|---|
| 0 | [The core decision: relax D-1](#0-the-core-decision-relax-d-1) | The one approval that unlocks the rest |
| 1 | [Current state (grounded)](#1-current-state-grounded) | What App.jsx actually is today |
| 2 | [Target folder structure](#2-target-folder-structure-proposed) | Where things should live |
| 3 | [Extraction plan (phased)](#3-extraction-plan-phased) | Moving code out of App.jsx, by risk |
| 4 | [Doc & organization cleanup](#4-doc--organization-cleanup) | Stale/trash content + folder org |
| 5 | [Logic library (the skill)](#5-logic-library-the-skill) | Documented human logic, calculators first |
| 6 | [Verification discipline](#6-verification-discipline) | How every step is proven safe |
| 7 | [Recommended sequence](#7-recommended-sequence) | The order to actually do it |
| 8 | [Open decisions for the owner](#8-open-decisions-for-the-owner) | What needs your sign-off |
| A | [Appendix: extraction map (exact line ranges)](#appendix-extraction-map-exact-line-ranges) | Execution reference |

---

## 0. The core decision: relax D-1

**D-1 (locked):** "All React components, state, hooks, business logic, and side effects live
in `src/App.jsx`." Carve-out exists only for **pure-data** modules (no JSX/React) — that's why
`translations.js` and `engagementLetterTemplate.js` are already separate.

**Original rationale:** "easier for a non-developer owner to manage uploads via the GitHub web
UI." **That rationale is obsolete** — we build through Claude Code + git, not web uploads.

**Why it now blocks the SaaS direction:**
- 8,502 lines / ~245 components in one file → slow, error-prone edits (the "file modified
  since read" friction we hit repeatedly), painful onboarding, merge conflicts as a team grows.
- No route/feature code-splitting → the bundle already warns >800 KB; everything ships on first load.
- A CRM/SaaS needs clear module boundaries (charts, calculators, client features, public
  surfaces, services) to extend safely without re-reasoning about 8k lines each time.

**Recommendation: reverse D-1 and modularize incrementally.** This is a locked-decision change,
so it needs explicit owner sign-off. Once approved, log a new decision (e.g. **D-37**)
superseding D-1: *"App is modular under `src/` (components/pages/utils/services/constants/styles);
App.jsx is a thin router shell. Pure-data carve-outs remain."*

**Note:** even **without** reversing D-1, **Phase 0** below (pure data + helpers, no JSX/React)
is already permitted by the existing carve-out — so the leanest ~1,000 lines can come out
regardless of the decision.

---

## 1. Current state (grounded)

From a structural pass of `src/App.jsx` (line numbers approximate, drift as the file changes):
- **8,502 lines**, ~**245** top-level component/function declarations.
- Composition: **~82% components** (~7,000 lines), **~10% pure data** (~850), **~8% utils** (~650).
- Largest blocks: `App` router (~605), **`ClientDetail` ~2,000 (across tabs/sections)**, **charts
  library 1,351**, **calculators 1,295**, `Dashboard` 367, `PublicIntake` ~296, `Login` 189,
  `ImportWizard` 211, `ProfileModal` 146.
- Coupling: charts/utils/constants/themes are **zero-coupling** (props/pure). `ClientDetail`,
  `FullReport`, `Dashboard` are **high-coupling** (client state + many children).

---

## 2. Target folder structure (proposed)

```
src/
  App.jsx                 # ~600-line router shell: auth, routing, theme/context providers, layout
  main.jsx, index.css
  translations.js         # (already separate — pure data)
  engagementLetterTemplate.js  # (already separate)
  constants/              # catalogs/metadata: SVCS, PORTFOLIOS, ACCT_META, LOAN_META, CERTS,
                          #   DEF_SETTINGS, presets, MS/ML month names, ES label maps
  styles/                 # makeDark/makeLight, mCARD/mINP/etc., GOLD, accent arrays
  contexts/               # ThemeCtx/useTh, HideCtx/useHN, ChartConfigCtx/useChartConfig
  utils/                  # financial.js (totals/ratios/payments), formatting.js (fmt/fmtDate/…),
                          #   csv.js (export/import parsing), alerts.js
  services/               # supabase.js (all ga* DB helpers), portal/intake fetch wrappers
  components/
    primitives/           # Pill, KpiTile, SC, Field, Btn, Tog, Modal, SaveBar, Kebab, …
    charts/               # the 17 pure-SVG charts (Donut, Waterfall, SmoothAreaLine, …)
    calculators/          # the 9 calculators (RetirementCalc, AffordabilityCalc, …)
    client-sections/      # IncomeSection, BillsSection, DebtSection, AccountsSection, …
    modals/               # ClientForm, Income/Card/Bill/Account/Loan/Asset modals, Split/Join, …
    reports/              # SummaryReport, FullReport, statement tabs, PDF assembly
  pages/                  # Dashboard, ClientList, ClientDetail/ (shell + tab files),
                          #   CalculatorsPage, PricingPage, AboutPage, ResourcesPage,
                          #   PublicIntake, PublicPortal, Settings/* (Security/Billing/Backup/Help)
```
(Folder names are a proposal — `components/` vs `features/` is an open decision, §8.)

---

## 3. Extraction plan (phased)

Each phase is independently shippable and build+run verified (§6). Stop after any phase.

### Phase 0 — pure data + helpers (NO D-1 change needed; ~1,000 lines, risk: none)
Everything here has **no JSX and no React imports**, so it's allowed even under strict D-1.
| Move | To | Source (approx) |
|---|---|---|
| Catalogs/metadata (SVCS, PORTFOLIOS, ACCT_META, LOAN_META, MAIN_PACKS, RATIOS_META, TICKER_META, PHYS_CATS, CERTS, ES label maps, DEF_SETTINGS + presets) | `constants/` | ~174–243 |
| Theme factories + style helpers (makeDark/makeLight, mCARD/mINP/mTH/…, GOLD, DARK/LIGHT_ACCENTS) | `styles/themes.js` | ~107–172 |
| Financial + formatting + CSV utils (totalA/totalL/liquidA, sumB/sumN, fmt/fmtDate/fmtPh, ratFmt, genCSV/parseCSV) | `utils/` | ~243–297 |
| Supabase + portal/intake helpers (all `ga*`, genPortalToken) | `services/supabase.js` | ~37–103 |
**Why first:** every component imports these; moving them first makes later extractions clean.

### Phase 1 — leaf components (needs D-1 relaxed; ~2,650 lines, risk: low)
| Move | To | Source (approx) | Notes |
|---|---|---|---|
| **Charts** (17 pure-SVG: Donut, Waterfall, SmoothAreaLine, Sankey, Treemap, RadialGauge, RankedHBars, BulletChart, Sparkline, Radar5, NetWorthBridge, PayoffProgression, AmortizationArea, CompoundGrowthStack, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone, SlopeGraph, Sunburst, Dumbbell) + chart hooks | `components/charts/` | ~1032–2383 | **Highest impact, lowest risk** — props-only, no state/DB. Do this first of Phase 1. |
| **Calculators** (the 9 standalone + the client-scoped ones) + the calc gallery page | `components/calculators/` | ~2831–4126 | Self-contained; pairs with the logic library (§5). |

### Phase 2 — feature surfaces (needs D-1 relaxed; ~4,000 lines, risk: med→high)
| Move | To | Source (approx) | Notes |
|---|---|---|---|
| Client sections + data-entry modals | `components/client-sections/`, `components/modals/` | ~648–809 | Reduces ClientDetail size first. |
| **ClientDetail** → shell + per-tab files (Summary/Monthly/Statements/Investments/Calculators/Plan/Compare/Report) | `pages/ClientDetail/` | ~5841–7863 (+ embedded report/calc ranges) | **Highest coupling** — careful state/callback threading; do last. |
| Pages: Dashboard, ClientList, PublicIntake, PublicPortal, Pricing, About, Resources, Settings/* | `pages/` | various | Mostly isolated; medium effort. |
| Reports/PDF assembly (FullReport, statement tabs) | `components/reports/` | ~2431–2744 | Depends on charts → do after charts. |

---

## 4. Doc & organization cleanup

**Stale — refresh to current (live build is v0.69.8; these claim much older):**
- `AGENT.md §3` says "Current version v0.36.0" + an outdated build-marker check → update to v0.69.x.
- `CLAUDE.md` session handoff says v0.56 / "last update 2026-05-25" → refresh recent-ships table.
- `CHANGELOG.md` stops at v0.59.6 → append v0.60–v0.69.x (reconstruct from `git log`).

**Lean the bloat:** `AGENT.md` is ~167 KB, mostly line-by-line deep-dives of old versions
(v0.13–v0.16). That history belongs in `CHANGELOG.md`; trim AGENT.md to identity + locked
decisions + pitfalls + current-state + smoke tests.

**Archive (move, don't delete — preserve history) → new `docs/archive/`:**
- `WORKPLAN-archive-2026-05.md` (self-marked obsolete; says "do not read — read CLAUDE.md").
- `docs/AUDIT-2026-06-03.md` (dated snapshot; its findings shipped or moved to other docs).

**Keep (active, no trash):** README, both SKILL.md files (different purposes — root =
`finance-app-updater` edit procedures; `.claude/skills/golden-anchor-design-surface` = design
manual; add a cross-link), DESIGN-MODE/PICKS/TOOLKIT-STUDY, APP-MAP, CLIENT-PORTAL-LASTMILE,
CLIENT-PORTAL-EDIT-ALLOWLIST, all configs, `finance-credentials.md` (rotate pre-launch).

**Optional:** flatten `design-system/charts/MASTER.md` → `docs/CHARTS-SPEC.md` (the folder holds
nothing else).

**Organization for SaaS:** add `docs/_INDEX.md` (table of contents + reading order); group into
`docs/features/`, `docs/security/`, `docs/archive/`. Keep "one topic, one home."

---

## 5. Logic library (the skill)

**What:** a consulted skill `.claude/skills/golden-anchor-logic/` — the documented **human logic**
behind every calculator, chart, derived metric, and field. Today this lives only in code.
**Why:** powers the how-to/user guides with real reasoning; one source of truth for tooltips, PDF
captions, and the portal; and a **drift-prevention** spec the agent consults before changing a
formula (same bug class as the cross-account leak — logic that silently changes).

**Four buckets:**
1. **Calculators** (the 9) — inputs · formula/method · assumptions (rates, compounding) ·
   outputs · edge cases · plain-English "why."
2. **Derived metrics/ratios** — net worth, DSR, savings rate, emergency-fund months, liquid
   assets, cash flow — exact formula + what counts.
3. **Charts** — what each derives, from which fields, and the takeaway.
4. **Field dictionary** — what each client field means + validation.

**How:** extract from the real code (accurate, not invented); owner annotates the "why."
**Dovetails with Phase 1:** document each calculator/chart as it's pulled into its own file.
**First pass:** calculators only (your priority + tied to the how-to guides).

---

## 6. Verification discipline

Per the cross-project playbook (`mauricio-os/PLAYBOOK.md`) §6/§7 (the situational items this
project originated):
- **Small, verified steps.** One module group per commit; `npm run build` passes; **run the app
  and confirm the surface still works** (not just "it compiles"). Bump `__GA_BUILD__` each ship.
- **Bulk moves get the scope-aware check** — confirm every moved symbol's imports/exports resolve;
  no behavior change. No big-bang refactor.
- **Imports, not duplication.** Moved code is imported back; App.jsx keeps thin re-exports only if
  needed during transition.

---

## 7. Recommended sequence

1. **Doc cleanup** (refresh stale → v0.69, trim AGENT bloat into CHANGELOG, `docs/archive/` + move
   the 2 obsolete docs, `docs/_INDEX.md`). *Safe, no code risk.*
2. **Phase 0 extraction** (constants/styles/utils/services). *Allowed even under strict D-1.*
3. **Logic library** (calculators bucket).
4. **Decision: relax D-1** → **Phase 1** (charts first, then calculators — document logic as we go).
5. **Phase 2** (client-sections/modals → pages → ClientDetail decomposition). *Later, bigger.*

---

## 8. Open decisions for the owner

1. **Relax D-1?** (recommended **yes** — it's the SaaS-readiness call). Without it, only Phase 0 +
   docs + logic library proceed.
2. **Folder naming:** `components/` + `pages/` (classic) vs `features/<feature>/` (feature-sliced).
3. **`design-system/charts/`:** flatten `MASTER.md` → `docs/CHARTS-SPEC.md`, or keep the folder?
4. **Logic library home:** consulted **skill** (recommended — agent auto-reads it) vs plain
   `docs/LOGIC/` markdown.
5. **Tooling as it grows:** add a linter/formatter + (later) component tests once modular, so the
   gates in playbook §6 have teeth beyond `build`.

---

## Appendix: extraction map (exact line ranges)

> Reference for execution. Ranges approximate as of 2026-06-09 (v0.69.8) — **very stale** (App.jsx is now
> 926 lines, not thousands); ALWAYS re-grep before moving.

| Group | Approx lines | Class | Phase | Target |
|---|---|---|---|---|
| Supabase/portal helpers | 37–103 | helper | 0 | `services/supabase.js` |
| GOLD, theme factories, style helpers | 107–172 | const | 0 | `styles/themes.js` |
| Theme/Hide/ChartConfig contexts | 133–153 | hook | 0/1 | `contexts/` |
| Catalogs/metadata + ES maps + DEF_SETTINGS | 174–243 | data | 0 | `constants/` |
| Formatting/financial/CSV/alert utils | 243–297 | helper | 0 | `utils/` |
| Primitives (Pill, KpiTile, SC, Field, Btn, Modal, …) | 300–488 | component | 1 | `components/primitives/` |
| ProfileModal | 499–645 | component | 2 | `components/modals/ProfileModal.jsx` |
| Data-entry modals (ClientForm, Income/Card/Bill/Account/Loan/Asset, Split/Join) | 648–755 | component | 2 | `components/modals/` |
| Client sections (Income/Bills/Debt/Accounts/Loans/CustomAssets/Savings) | 738–809 | component | 2 | `components/client-sections/` |
| Report/PDF helpers + intake export | 809–989 | mixed | 2 | `components/reports/` |
| **Charts library (17 components + hooks)** | **1032–2383** | component | **1** | `components/charts/` |
| Report sections/tabs (SummarySection, FullReport, statements) | 2431–2744 | component | 2 | `components/reports/` |
| **Calculators (client-scoped + standalone + gallery)** | **2831–4126** | component | **1** | `components/calculators/` |
| Import/bulk (ImportWizard, CRM CSV, backup) | 4126–4550 | mixed | 2 | `services/import.js` + `components/modals/` |
| Dashboard + ClientList + gallery/chart-editor | 4550–5387 | component | 2 | `pages/` |
| Public pages (Pricing, About, Login, Engagement/ToS, SignaturePad) | 5590–6368 | component | 2 | `pages/` |
| PublicIntake (+ advisor intake submissions) | 6368–6995 | component | 2 | `pages/PublicIntake.jsx` |
| Settings/admin pages (Security/Billing/Backup/Help/SettingsCard/TopBar) | 7214–7788 | component | 2 | `pages/Settings/` |
| **ClientDetail (shell + tabs + embedded sections)** | **5841–7863** | component | **2** | `pages/ClientDetail/` |
| PublicPortal + App router shell | 7863–8502 | component | 2 | `pages/PublicPortal.jsx` + `App.jsx` (shell) |

---

## Advisor ↔ Client account linking — DESIGN ONLY (approved 2026-06-11, not built)

> **Status: DESIGN ONLY.** Owner decision: keep the two islands as they are today, build
> nothing yet — but lock the design now so the eventual build doesn't improvise. Today
> (per `golden-anchor-logic` §1) an advisor's client *record* and that person's own client
> *account* are completely separate: the client account owns its own `clients` row
> (`auth.uid()=user_id` RLS), and nothing connects it to the advisor's row for the same
> human. This section designs the bridge.

### L0. Principles

- **The advisor's client row is the source of truth** after linking. The client's island
  row is archived, not merged (no silent data mixing — same bug class as pitfall #18).
- **RLS alone cannot sanitize.** `clients.data` is ONE jsonb blob including SSN/DOB/
  internal notes. A direct cross-account SELECT policy would hand the client the whole
  blob. Therefore **linked reads go through a service-role endpoint that reuses the
  `resolve-portal.js` allow-list** — one sanitize boundary, not two that drift.
- **Single-writer per field group.** Disjoint ownership, no merge logic: client owns the
  contact group; advisor owns everything else. No field is two-writer.

### L1. Schema — `client_links`

Mirrors `portal_links` (advisor uid + `client_local_id` text key + unguessable token),
plus the accepting account's uid and a status lifecycle.

```sql
-- supabase-migrations/<date>-client-links.sql (SKETCH — not created)
-- Idempotent — safe to re-run. Paste into Supabase → SQL Editor → Run.
CREATE TABLE IF NOT EXISTS public.client_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_uid      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_local_id  text NOT NULL,            -- matches public.clients.local_id (advisor's record)
  client_uid       uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL until accepted
  invited_email    text NOT NULL,            -- must match the accepting account's auth email
  token            text NOT NULL UNIQUE,     -- 24-byte base64url, same as intake invites
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','revoked','expired')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,              -- default now()+interval '14 days' at insert
  accepted_at      timestamptz
);
CREATE INDEX IF NOT EXISTS client_links_token_idx  ON public.client_links(token);
CREATE INDEX IF NOT EXISTS client_links_client_idx ON public.client_links(client_uid);
-- One ACCEPTED link per advisor record, and per client account (1:1 both ways for v1):
CREATE UNIQUE INDEX IF NOT EXISTS client_links_one_per_record
  ON public.client_links(advisor_uid, client_local_id) WHERE status = 'accepted';
CREATE UNIQUE INDEX IF NOT EXISTS client_links_one_per_account
  ON public.client_links(client_uid) WHERE status = 'accepted';

ALTER TABLE public.client_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_links_advisor_all ON public.client_links;
CREATE POLICY client_links_advisor_all ON public.client_links
  FOR ALL USING (auth.uid() = advisor_uid) WITH CHECK (auth.uid() = advisor_uid);
DROP POLICY IF EXISTS client_links_client_read ON public.client_links;
CREATE POLICY client_links_client_read ON public.client_links
  FOR SELECT USING (auth.uid() = client_uid AND status = 'accepted');
-- Acceptance (setting client_uid) happens via SERVICE ROLE in api/accept-client-link.js,
-- never via an anon/client policy — same posture as portal_links.
```

Considered and rejected: an FK to `clients.id` (uuid) instead of `client_local_id` — the
whole app + `portal_links` key on `local_id`, and the save path re-resolves rows by it;
matching that convention avoids a second identity scheme.

### L2. Invite flow (the intake-invite pattern, reused)

1. **Advisor sends** — client kebab → "Invite to portal account". New
   `api/send-client-link-invite.js`, clone of `send-intake-invite.js`: verify advisor JWT
   → insert `client_links` row (`status='pending'`, token via `crypto.randomBytes(24)`,
   `invited_email` = the record's email) → Resend email with `/link?token=…` (EN/ES,
   advisor signature, same template skeleton).
2. **Client opens the link** — `/link?token=…` resolves via a rate-limited service-role
   endpoint (clone of `resolve-intake-invite.js`): returns advisor branding + invited
   email + first name only. If not signed in → signup (role `client` in `user_metadata`,
   email pre-filled and locked) or login.
3. **Accept** — `api/accept-client-link.js` (service-role): verify the client's JWT, check
   token is pending + unexpired, check `auth.email === invited_email` (case-insensitive)
   → set `client_uid = auth.uid()`, `status='accepted'`, `accepted_at=now()`. Email
   mismatch = hard reject (the token alone must not bind an arbitrary account).
4. **Island archive** — same endpoint soft-deletes the client account's own self-profile
   row (`deleted_at = now()` on `clients` where `user_id = client_uid`). Nothing is
   merged; the advisor can eyeball the archived row later if the client claims lost data.

### L3. Data flow after linking

- **Source of truth:** the advisor's `clients` row. The client's Overview stops rendering
  their island row and instead renders the **linked snapshot**.
- **Linked read:** `api/resolve-client-link.js` (service-role; client JWT required) —
  looks up the accepted link for `auth.uid()`, loads the advisor's row, returns it through
  the **same `ALLOW` set as `resolve-portal.js`** (factor the allow-list into a shared
  `api/_sanitize.js` so portal and link can't drift). SSN/DOB/internal notes still never
  leave the server, even to the linked client.
- **No direct RLS read on `clients`** for linked clients (see L0). If serverless latency
  ever hurts, the fallback is a `SECURITY DEFINER` RPC that returns the sanitized jsonb —
  same allow-list, still one boundary — not a SELECT policy.
- **Client-side cache:** the linked snapshot caches under the client's own
  `ga_cache_uid` tag like any other data; existing purge rules apply unchanged.

### L4. Edit policy (single-writer field groups)

| Group | Fields | Writer |
|---|---|---|
| **Contact** | email, phone, address (their own values) | **Client** — via `api/update-linked-client.js` with a server-side EDIT allow-list (seed from `docs/CLIENT-PORTAL-EDIT-ALLOWLIST.md`); server loads the row, patches ONLY these keys, saves. Advisor sees a "client updated contact info" flag. |
| **Goals notes** | notes.goals/shortTerm/midTerm/longTerm | **Client-editable candidate** — owner to confirm (open question 3). |
| **Everything else** | all financial data, plan, snapshots, internal notes, names, DOB/SSN | **Advisor only.** Client sees the sanitized subset read-only. |

Conflicts are avoided structurally: groups are disjoint, and the client's writes are a
server-side key-scoped patch (never a whole-blob save), so an advisor save and a client
contact edit can interleave without clobbering — worst case is last-write within the
same group by the same single writer.

### L5. Rollout (phased, each shippable)

1. **Link-R (read-only mirror):** migration + invite/accept endpoints + linked Overview
   read. Client gets zero new edit rights. Adversarial role proof re-run (logic skill §1):
   advisor, linked client, UNLINKED client, and a revoked link each see exactly their own.
2. **Link-W (scoped edits):** contact-group endpoint + advisor-side "updated" flag.
3. **Portal coexistence:** token portal (`portal_links`) stays for the unlinked —
   prospects, spouses, "just look at this" shares. For a linked client the share-portal
   modal shows "this client has an account" and de-emphasizes new tokens. Retire-per-client
   (auto-revoke tokens on accept) is open question 5. The portal feature itself is NOT
   retired.

### L6. Open questions for the owner

1. **Unlink/revoke semantics** — when an advisor revokes an accepted link, does the client
   account revert to an empty island (new blank self-profile) or keep a frozen copy?
2. **Island data on accept** — archive silently (designed above), or show the advisor a
   one-time "client had self-entered data, import anything?" review screen?
3. **Goals notes** — client-editable (it's their goals) or advisor-only like the rest?
4. **1:1 constraint** — is one advisor per client account permanent, or will households /
   second-opinion advisors eventually need 1:N (drop the `client_links_one_per_account`
   unique index then)?
5. **Auto-revoke portal tokens** for a client once their account link is accepted?
6. **Invite expiry** — 14 days proposed; confirm, and whether advisors can re-send (new
   token, old one expired — same rotation rule as portal regenerate).
