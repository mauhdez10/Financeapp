# Architecture & Cleanup Plan — financeapp → CRM/SaaS

> **Status: PLAN ONLY (2026-06-09). Nothing here has been executed.** No code moved, no
> docs changed, no files deleted. This is the write-up to review and approve before any
> work starts. The one decision that drives everything is **§0 (relax D-1)**.

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

> Reference for execution. Ranges approximate as of 2026-06-09 (v0.69.8); re-grep before moving.

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
