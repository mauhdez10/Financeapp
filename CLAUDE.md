# CLAUDE.md — Golden Anchor Finance App

> Auto-loaded by Claude Code on every session in this folder. Read this FIRST.
> Pair with `claude-mem` plugin (installed) — between the two, you should not
> need to re-upload AGENT/SKILL/WORKPLAN files at the start of new sessions.

> ## 🔑 CREDENTIALS — check here first (until launch)
> **The canonical file for every password, token, key, login, project ref, and
> setup detail is `C:\Users\mauhd\finance-credentials.md`** (in the home folder,
> outside all git repos so it's never committed). **Before asking the user for any
> credential, env var, account login, Supabase/Stripe/Resend/GitHub key, or "where
> do I find X" — READ THAT FILE.** It has the Supabase management token (`sbp_…`),
> the active GitHub PAT, project refs, dashboard links, and the env-var map.
> This is a temporary pre-launch convenience; the file says to move everything to
> 1Password before launch and rotate the pasted secrets. Treat it as sensitive —
> never print full secret values back, never commit it.
>
> Finance Supabase is also reachable via the **`supabase-finance` MCP** (added
> 2026-06-05, scoped to project `ukqqcrupyooqyksotieu` only — separate from Velo's
> Supabase MCP). Use `mcp__supabase-finance__*` tools for finance DB work.

> ## 📁 SINGLE FOLDER NOW — two-folder workflow RETIRED (2026-06-05)
> **There is ONE folder: `C:\Users\mauhd\Projects\financeapp-deploy`** — it is the
> git repo, the working copy, and where the dev server runs. **Edit, `npm run dev`,
> `npm run build`, commit, and push all from here.** Its `.env.local` is in place.
> **Ignore every "edit in `golden-anchor/`, copy to `financeapp-deploy/`"
> instruction below** — that drift-prone two-folder dance is gone. No more `cp`
> between folders. The old working copy is archived at
> `C:\Users\mauhd\Projects\golden-anchor-ARCHIVE` (reference only — safe to delete
> once confirmed unneeded; it holds old screenshots + `ui_kits/` design reference).

---

## 🗓 Session handoff — last update 2026-05-25

### Currently shipped (live on Vercel)

**v0.56.0** — `2026-05-25-v0560-pills-spark-promos-cashflow-swatches`

Shipped via the `v0.56-preview` branch + `--no-ff` merge into main (commit `d137dbf`). Highlights:
- Animated SVG hero on landing (Lottie infra wired, `LOTTIE_HERO_URL` slot left empty)
- Landing pills white on dark + sentence case (match Sign-In typography)
- Monthly Report health row: 4-up gauges + radar (was 2-card with blank padding)
- Global `SC` card compaction (JetBrains Mono values, tabular nums, smaller padding)
- Dashboard KPI tiles: inline sparklines + delta arrows
- KPI Sparklines slot: sparkline now extends to touch the value
- Promotions: table layout per design ref + Stripe-sync info banner
- Profile → Appearance summary card: actual color swatches (was hex strings)
- Trend bar mode: combo positive/negative bars + dashed cumulative net line
- Asset/Liability maps: Treemap → RankedHBars (per "blocks don't read as data")
- Cash Flow Statement: split into 3 panels (Waterfall + Donut + KPI tiles)
- Calculators tile grid: 300px tiles, 48px icon square, hover lift

**Earlier:** v0.54.0 — `2026-05-25-v0540-big-batch-prs-1-2-4-5-7-8-9`

Verify the live build is current:
```bash
curl -s "https://finance.goldenanchor.life/" | grep -oE 'index-[A-Za-z0-9_-]+\.js'
curl -s "https://finance.goldenanchor.life/assets/<that-hash>.js" | grep -oE 'v[0-9]{3,4}-[a-z0-9-]+' | sort -u
```

### Recent versions (newest first)

| Version | What shipped |
|---|---|
| **v0.52.0** | PDF — Portfolio + Compare + Calc Snapshots sections added. Miguel-Torres-style fix: server template (`api/render-report-pdf.js`) was missing 3 sections that exist on the SPA Complete Report. Now renders Selected Portfolio (`client.savedPortfolio`), Period Comparison (`client.savedCompare`), Calculator Snapshots (`client.savedCalcs[]`). All warm-palette, JetBrains Mono numerals, `.sect-head` amber hairline. New `inc.portfolio`/`inc.compare`/`inc.calcs` toggles default ON for `complete` reportType, OFF for monthly/financial. 12 new bilingual L keys. Verification harness at `preview/_test-pdf-sections.mjs` + `preview/_test-pdf-render.mjs` — 17/17 source + 14/14 render checks green. `buildPrintHTML` is now exported. |
| **v0.51.0** | Download PDF replaces in-app Print. Backend `api/render-report-pdf.js` now accepts `mode:"email"\|"download"`. Email mode unchanged (Resend send). Download mode returns the same PDF buffer as `application/pdf` with `Content-Disposition: attachment`. Frontend `DownloadPdfBtn` replaces `PrintBtn` on Monthly + Financial Statements + Complete report tabs — same gold pill, busy state "⏳ Preparing PDF…", inline error surfacing. `PrintBtn` kept defined (unwired) for a future "Print raw data" surface. Also imported `HANDOFF-v0.46.md` + 11 new `preview/*.html` design mockups (PRs 1, 4-9 approved; 23/24 pending). New bilingual keys: `downloadPdfBtn`, `downloadPdfBusy`, `downloadPdfFailed`. |
| **v0.50.0** | Email PDF warm palette. `api/render-report-pdf.js` palette ported from `preview/18-pdf-reports.html` + v0.45 in-app print. Page bg `#FAFAF7` warm linen (was `#F1F5F9` cool slate). Pos `#047857` deep green, Neg `#B91C1C` deep red, Net Worth `#B8901E` deep amber. Section cards lost the white-with-border treatment — claude `.sect-head` pattern (8pt amber uppercase, `::after` hairline). Report title centered Newsreader italic 22px, no card. Disclaimer slim italic with gold top rule. KPI strip 3px-radius compact cards, JetBrains Mono 13px values. Tables hairline grey with gold totals top rule. Verification mockup at `preview/email-pdf-warm-preview.html`. |
| **v0.48.0** | Chart customization MVP — SmoothAreaLine slice. New `ChartConfigCtx` + `useChartConfig(templateId,defaults)` hook merges per-template saved overrides with built-in defaults. Each gallery card with a `templateId` grows an ✏️ Edit pill → opens `ChartEditModal` with color pickers (per slot), 0.5-4px stroke slider, legend label inputs, display name, Reset to Default. Changes auto-apply (no Save button), persist to `settings.chartCustomizations`, propagate live to every use-site (ClientDetail trend pair, Dashboard slots, gallery). Wired for `smoothAreaLine.debtVsSavings` + `smoothAreaLine.cashFlowTrend`. Remaining 18 chart families queued for v0.49. 10 new translation keys × EN+ES. |
| **v0.47.0** | Red/green trends + Dashboard slot expansion. ClientDetail Debt vs Savings live trend restored to RED (`#EF4444`) for debt + GREEN (`#10B981`) for savings (was orange/gold during v0.34). Cash Flow Trend kept green/gold. Gallery split SmoothAreaLine into two cards (Debt vs Savings + Cash Flow Trend), total 21 cards. Dashboard slot dropdown expanded 6 → 20 options — each new option renders practice-aggregated data: Debt vs Savings Trend, Cash Flow Trend, Debts by Balance, Practice Cash Flow Waterfall, Practice Health (Radar), Net Worth Forecast, Asset Allocation (Sunburst), Client Net Worth Δ (Dumbbell), Net Worth Prior vs Current (Slope), Bills by Category, Bills YoY, Spending Heatmap, Debt Payoff Timeline, KPI Sparklines. 31 new translation keys × EN+ES. |
| **v0.46.0** | Chart Gallery (temporary audit section). Topbar avatar "Chart Settings" → "Chart Gallery" — a 20-card showcase of every chart component (Sparkline, RadialGauge, BulletChart, Donut, Treemap, Sunburst, RankedHBars, Waterfall, Sankey, SmoothAreaLine, Radar5, SlopeGraph, Dumbbell, GroupedYoY, StackedBars, NetWorthBridge, PayoffProgression, AmortizationArea, ForecastCone, HeatmapCalendar) rendered with Amanda-Chen-style sample data. Three amber NEW pills (Sunburst, SlopeGraph, Dumbbell — built in v0.45 but unwired); 17 gold WIRED pills. 3-slot Dashboard picker preserved below the gallery. Modal width 480→920. Three new translation keys × EN+ES (`chartGalleryWired`, `chartGalleryNew`, `chartGallerySlotsHdr`). |
| **v0.45.0** | Compact print stylesheet matching claude design template (multi-section per page, claude `.sect-head` pattern, hairline tables, warm linen `#FAFAF7` bg) — Complete Report now ~6-7 pages instead of ~14. Three new chart components: **SlopeGraph** (Tufte two-period comparison), **Sunburst** (nested radial allocations), **Dumbbell** (before/after comparison with auto-color by direction). Standalone calc wires: CarLoanCalc → AmortizationArea, IncomeCalc → paycheck Donut + effective-tax-rate RadialGauge, HomeEquityCalc equity tab → Donut showing home value composition (owed / borrowable / locked equity). |
| **v0.44.0** | Gradient polish on the remaining 8 chart components (BulletChart, NetWorthBridge, PayoffProgression, AmortizationArea, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone) following the v0.42 pattern. Plus Lucide icon vocabulary wired into sidebar nav (desktop + mobile) and topbar avatar menu via a new `GAIcon` wrapper. HeatmapCalendar switched from opacity-only to RGB color gradient (cream → amber). Remaining ~150 in-content emojis (KPI labels, section headers, modal titles) deferred to v0.45+. |
| **v0.43.0** | Landing page (Enterprise Gateway with corner sign-in) + reduced-motion hook + bundle splitting. New marketing landing replaces full-screen Login: italic Newsreader hero left, compact sign-in card top-right, 3 feature cards, credentials pills, disclaimer footer. Warm cream `#FFFBEB` + amber `#D97706` palette (matches v0.41 print). `useReducedMotion` hook gates SMIL `<animate>` + tween hook so charts respect prefers-reduced-motion. Vite manualChunks splits recharts/xlsx/supabase/react-vendor into separate async chunks — initial bundle 1909KB → 848KB (-55%). Lucide-react installed but icon vocabulary swap deferred to v0.44. `design-system/golden-anchor/MASTER.md` persisted via ui-ux-pro-max `--persist`. |
| **v0.42.0** | Gradient chart polish pass — replaced flat fills with gradients + reduced stroke weights across 9 chart components (Donut, Waterfall, SmoothAreaLine, Sankey, Treemap, RadialGauge, Radar5, RankedHBars, Sparkline). ui-ux-pro-max alignment: tabular numerals everywhere, 0.04em letter-spaced uppercase labels, hairline gridlines, thinner strokes (1.25-1.75px). Drop-shadow filters removed where they read as chunky. 12 gradient elements verified rendering live. |
| **v0.41.0** | Premium print PDF — warm cream/amber palette + per-section page breaks. Print/Save PDF on the Complete Report now produces a designer-grade document: section cards with `4px solid #F59E0B` (amber) top rules + `#FDE68A` borders, warm-amber section headers (`#B45309`) on gold underlines, deep-walnut italic title in Newsreader. Every `RS` block in `FullReport` plus the Financial Statements / Compare / Calcs / Notes / Plan outer wrappers get `.ga-print-page` so each section prints on its own page (~14 pages typical). Print-only branded header (anchor + client + advisor) at top, disclaimer card + watermark at bottom. Browser print path only — server-side email PDF still uses its own template. |
| **v0.40.0** | PDF chart embeds. Four new server-side pure-SVG-string functions in `api/render-report-pdf.js`: `waterfallSVG`, `treemapSVG`, `radialGaugeSVG`, `radarSVG` (ported from the React chart components). Wired into Cash Flow Statement (Waterfall top), Financial Ratios (3 Radial Gauges + Radar Health Score row above table), and Assets (paired Asset/Liability Treemaps above table). `ACCT_COLORS` + `LOAN_COLORS` maps added so PDF colors match the live app. Section toggles (`inc.financialRatios`, `inc.cashFlow`, `inc.assets`) still respected. Verified with isolated SVG function tests. |
| **v0.39.0** | Dashboard chart picker + topbar menu entry. Per-card gear ⚙ icon on each Dashboard slot opens a dropdown of 6 chart options (Income vs Spending, Sankey, Net Worth Donut, Clients Treemap, Practice Health gauges, Net Worth Bridge) — swap any slot, persists to `settings.dashboardSlots`. New "📊 Chart Settings" entry in the topbar avatar menu opens a modal with 3 dropdowns (same picker as gear). Default slots match v0.38 (Income vs Spending / Sankey / Donut). 31 new translation keys × EN+ES. |
| **v0.38.0** | Charts wave 2 — full component library + wires across calcs/sections. 12 new pure-SVG charts (RadialGauge, RankedHBars, BulletChart, Sparkline, Radar5, NetWorthBridge, PayoffProgression, AmortizationArea, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone). Wired into ClientDetail SummarySection (3 gauges + Radar5 health row), CashFlowStatement (Waterfall), Balance Sheet (paired Asset/Liability Treemaps), ClientDebtCalc (RankedHBars + PayoffProgression), ClientCarLoanCalc (AmortizationArea), AffordabilityCalc (PITI Donut + DTI Gauge), RetirementCalc (ForecastCone). Lighter visual style (50-70% fill, 1.5-1.75px strokes, no drop-shadow filters) — refinement coming via design review. |
| **v0.37.0** | Charts wave 1 — animation foundation + Sankey + Treemap. New `useTweenedData` hook (~800ms easeOutCubic) wired into Donut, Waterfall, SmoothAreaLine so values morph instead of snapping. Gold glow filter + pulsing "live" dot on SmoothAreaLine's last point. Two brand-new components: `Sankey` (flow diagram, pure-SVG, ~150 lines) wired into Dashboard as a new middle column between Income vs Spending and Net Worth Donut; `Treemap` (squarified, pure-SVG, ~80 lines) wired into AssetsLiabilitiesTab as an "Asset Map" card above the four tables. Dashboard grid now 3 columns with `minmax(0,Nfr)`. 6 new translation keys × EN+ES. |
| **v0.36.0** | Doc hygiene + dead-code pass. Deduped 3 silent-overwrite translations (`totalLbl` / `partnerEmailLbl` / `close`). Added 11 missing EN+ES keys. Backfilled WHATS_NEW_ENTRIES for v0.29-v0.35. Deleted IntakeFormV2 (~64 lines dead code from the v0.31 restore). Refreshed AGENT.md §3 + this handoff. No behavior changes. |
| **v0.35.1** | Hotfix: `fmtSSN` was a local const inside `SSNInput`, throwing `ReferenceError` on every keystroke into the prospect SSN field on public intake. Hoisted to module scope alongside `fmtPh`. |
| **v0.35.0** | Phase 5 + 6. New pure-SVG `Donut` (replaces Recharts PieChart on Dashboard's Net Worth Distribution) + `Waterfall` component (built, not yet wired). `.ga-print-page` wrappers around the 6 FullMonthView sections — each prints on its own page. |
| **v0.34.0** | Phase 5 first chart. New pure-SVG `SmoothAreaLine` (Catmull-Rom-to-Bezier, gold area gradient, JetBrains Mono Y-ticks, crossover dot marker). Replaces 3 Recharts AreaCharts on ClientDetail's "● live" trend pair + SummarySection. |
| **v0.33.0** | Public intake unified on the gold palette regardless of light/dark mode. `synthTheme.accent` / `.blue` hard-pinned to `GOLD`. |
| **v0.32.0** | Couple invites end-to-end — partner fields in New Invite modal, ferry through `send-intake-invite.js` + `resolve-intake-invite.js`, populate `draft.partnerFirst` etc. on the prospect side. Removed duplicate FL Lic + redundant disclaimer from engagement-copy email. Required Supabase migration `2026-05-23-invite-partner.sql`. |
| **v0.31.0** | Intake hardening pass — typed-only signature with inline cursive display, Pay Now always clickable, Done modal cleanup ("you can close this tab"), browser back walks stages, post-submit engagement-copy email (`api/send-engagement-copy.js`), Tab 4 restored to advisor-style IntakeFormBody. Required Supabase migration `2026-05-22-engagement-emailed.sql`. |
| **v0.30.0** | Public intake redesign — 5-stage flow (Welcome → Service → Engagement → Your information → Done modal). |
| v0.29.1 | Hotfix: SignaturePad auto-commits prefilled `defaultName` on mount. |
| v0.29.0 | Intake Forms admin rebuild + New Invite modal (Phase 1+2+3 of Claude Design workplan). Required Supabase migration `2026-05-22-intake-status.sql`. |
| v0.28.0 | Per-row ✕ dismiss on advisor + client-due alerts. Month-keyed dismissals so "paid the credit card" auto-recycles next billing cycle. |
| v0.27.0 | Bootstrap shimmer skeleton, KPI count-up tween, pulse on critical alert pills, aria-label on placeholder-only search inputs. |

### Pending work (priority order)

The chart vocabulary is now in place (v0.37→v0.45) and the Chart Gallery
(v0.46) lets Mauricio audit every component in one place. Next passes
target landing-page hygiene, chart visual polish based on his feedback,
and email-PDF palette parity.

1. **v0.47 — Landing page rework.** Strip Mauricio's personal credentials (MBA / FPWMP / FL0215 / advisor name pills) from the Login page; re-pitch as a product, not an advisor. Fix the light/dark toggle so it actually theme-switches the landing. Resolve the sign-in card color story (currently reads yellow button + grey labels + white inputs random — pick one warm-palette story).
2. **v0.48 — Chart visual fixes (bundle).** Debt/Savings + Cash Flow Trend pair: thinner lines, line↔bar toggle, RED for debt + GREEN for savings (not orange + yellow). Waterfall on Cash Flow Statement: shrink dramatically — cap bars at ~36px, drop labels to 9pt, overall height ~140-160px. CC vs Loan cards in ClientDebtCalc: tighten padding. Portfolio standalone calc bottom chart: swap (AmortizationArea or ForecastCone). Asset Map + Liability Map Treemaps: replace with Sunburst (Assets) + paired Donuts or stacked segment bar (Liabilities) — gallery v0.46 will help compare.
3. **v0.49 — Standalone calc charts.** Port the "Debts by Balance" RankedHBars from `ClientDebtCalc` into the standalone `/calculators` → Debt Reduction tab. Interest calc: add an AmortizationArea-style compound-growth chart.
4. **v0.50 — Email PDF warm palette.** Port the v0.45 warm linen (`#FAFAF7`) + amber + Newsreader/Source-Serif typography from the in-app print stylesheet into `api/render-report-pdf.js`. Current emailed PDF still uses cool slate.
5. **v0.51 — Intake form warm palette.** Recolor `PublicIntake` to cream `#FFFBEB` + amber `#D97706` (claude design Boutique style). **Color-only** — keep the 5-stage structure intact.

**Polish backlog (revisit after the series):**

- Sankey on the Dashboard is small relative to its slot — the SVG honors aspect ratio but the row auto-equalizes height to match the taller Income vs Spending card. Consider wrapping in a flex:1 container or increasing native viewBox height.
- Sankey gradient colors lean brown/gold when the source is green and the sinks are red/orange/gold — the green source isn't very visible. Consider stronger source color or wider source band.
- Emoji-strip refactor (deferred from v0.35.0). Wrap ~200 leading emojis in report headers with `<span class="ga-emoji">…</span>` so the existing `@media print { .ga-emoji { display:none } }` rule actually fires. Cleaner emoji-free PDF exports.
- Three-up KPI strip on Monthly Snapshot print view.

**Open bugs (low-confidence — needs Mauricio reproduction):**

- **Hide-numbers ON by default on first login** — likely data, not code (the test account's `settings.hideNumbers` is `true` in Supabase). One toggle fixes it for the account.

### Infrastructure ready in this folder

- **`CLAUDE.md`** (this file) — auto-loaded by Claude Code
- **`.env.local`** — Supabase URL + anon key set; dev server can log in. NEVER edit/commit this file. `.env.local.example` is the template that ships in repo.
- **`AGENT.md`** — full decision log + locked decisions (D-1 to D-36) + pitfalls (#1-#17). Read on demand. `SKILL.md` is the design-system manifest (Claude.ai/design only). `WORKPLAN-archive-2026-05.md` is preserved historical only.
- **Two-folder workflow**: edit in `golden-anchor/` (working copy, has design system extras), then copy + push from `financeapp-deploy/` (real git clone).
- **Plugins installed**: `claude-mem`, `vercel`, `playwright`, `ui-ux-pro-max`, `github`, `gitlab`. The vercel + playwright MCPs may need a Claude Code restart to load. Once active, USE them to verify deploys + run e2e tests instead of manual.

### Communication shortcuts (per WORKPLAN §1)

- **Direct, no compliments, no "Great question!"**
- Treat as finance professional. Don't over-explain.
- Default English. Spanish only if Mauricio writes Spanish first.
- Numbered shorthand answers are valid (e.g. "1. yes 2. a 3. skip").
- NEVER date-suffix or version-suffix files. One canonical name per file.
- **Always `git pull origin main` before editing** (parallel chats push too).
- **Always `npm run build` after edits.**
- **Always verify with the build marker**, not the docs — docs sometimes lag the code.

### First moves in a new session

1. `cd C:\Users\mauhd\Projects\financeapp-deploy && git pull origin main && git log --oneline -5`
2. Open `C:\Users\mauhd\Projects\golden-anchor\CLAUDE.md` (this file)
3. Confirm current build marker: `grep -o '__GA_BUILD__="[^"]*"' src/App.jsx`
4. Ask Mauricio: which pending item to tackle, or wait for new bugs from his testing.

---

## What this is

**Golden Anchor Finance** — a single-file React/Vite SPA + Vercel Serverless Functions + Supabase, deployed at **https://finance.goldenanchor.life**.

Owner: Mauricio Hernandez (MBA, FPWMP), Miami, FL. Bilingual (EN/ES) financial-coaching + insurance-advisory product. **Not** investment management — educational coaching only.

GitHub repo: **https://github.com/mauhdez10/Financeapp** (`main` branch only).

---

## Source-of-truth files (read these on demand, don't load all at once)

| File | What it has | When to read |
|---|---|---|
| `src/App.jsx` (~4,300 lines) | The whole app — every screen, every component | When making code edits — but `Grep` first to find the right line range |
| `src/translations.js` (~1,300 keys × EN/ES) | UI strings | When adding/changing any visible text |
| `src/engagementLetterTemplate.js` | Engagement letter body + token substitutions | Only when the engagement letter itself changes |
| `api/*.js` | 5 Vercel serverless functions (intake invites, support email, PDF render, etc.) | When server-side work is needed |
| `AGENT.md` | **Project architectural truth** — locked decisions (D-1 through D-36), pitfalls (#1 through #17), current version, smoke tests | Read §1 + §3 + §4 + §7 on first session; otherwise grep for specific D-NN or pitfall numbers |
| `SKILL.md` | **Design-system skill** (`golden-anchor-design`) — brand colors, type, asset paths, UI-kit references. Used by Claude.ai/design when generating brand-correct mocks. Not an editing procedure. | Only when working on brand/visual design artifacts — not for code edits |
| `WORKPLAN-archive-2026-05.md` | **Archived.** Old chat-upload workflow notes from the claude.ai-with-uploads era. No longer current — superseded by this `CLAUDE.md`. | Don't read for procedure — kept for history only |
| `CHANGELOG.md` | Per-version release notes — newest on top | Skim the top 1-2 entries to know what just shipped |
| `package.json` | Deps + scripts | Rarely |
| `vercel.json` | SPA rewrite + per-function memory/timeout config | When touching `api/` or routing |

**`ui_kits/`, `preview/`, `HANDOFF.md`, `SKILL.md` (the design-system one at root)** — these are **design-system reference docs from claude.ai/design**, NOT app code. Don't load unless explicitly working on brand/visual port.

---

## Current version state

Find it fast: `grep -o '__GA_BUILD__="[^"]*"' src/App.jsx`. As of this writing the live build marker is `v0230-header-dedup-clientdue-search-tos-gate-portal-welcome` (2026-05-22). AGENT.md §3 may lag — trust the build marker.

**Versioning:** patch for behavior change with no structural change; minor for new surface/component; major TBD at v1.0.

---

## The working-copy / deploy-clone split

Mauricio works in **`C:\Users\mauhd\Projects\golden-anchor`** — this is NOT a git repo, it's a local working copy with extras (`ui_kits/`, `preview/`, `HANDOFF.md`, etc.) that don't belong in production.

I push from **`C:\Users\mauhd\Projects\financeapp-deploy`** — a real `git clone` of `mauhdez10/Financeapp`. After making edits in `golden-anchor/`:

```bash
cp /c/Users/mauhd/Projects/golden-anchor/src/App.jsx /c/Users/mauhd/Projects/financeapp-deploy/src/App.jsx
# any other changed files...
cd /c/Users/mauhd/Projects/financeapp-deploy
git pull origin main  # ALWAYS pull first — Mauricio sometimes works on the side
git add <files>
git commit -m "..."
git push origin main
```

Vercel auto-deploys on push (~30s).

**`git pull` BEFORE editing** — Mauricio runs parallel chats and occasionally pushes from other sessions. Skipping this has burned us before (we found a `v0.23.0` on `main` that we didn't have locally).

**Sync working copy after pulling:**
```bash
cp /c/Users/mauhd/Projects/financeapp-deploy/src/App.jsx /c/Users/mauhd/Projects/golden-anchor/src/App.jsx
cp /c/Users/mauhd/Projects/financeapp-deploy/CHANGELOG.md /c/Users/mauhd/Projects/golden-anchor/CHANGELOG.md
```

---

## Dev / build / verify

```bash
# In golden-anchor/:
npm run build       # vite build — ALWAYS run this after any edit; ~1s
npm run dev         # vite dev server → http://localhost:5173 (needs .env.local — see below)
npx playwright test # the existing e2e suite (chromium + firefox)
```

**ALWAYS `npm run build` after edits.** Bundle goes to `dist/`. App.jsx is ~4,300 lines — Vite catches JSX/TS errors in <1s and saves us from shipping syntax breakage.

---

## .env.local needed for the local dev server

The Supabase client is initialized from `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Without these, `supabase` is `null` and login fails with "Connection error. (env vars missing)".

Create `golden-anchor/.env.local` (gitignored, never committed):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your.anon.public.key...
```

Both values live in Vercel → Financeapp project → Settings → Environment Variables. The anon key is the **public** key — safe in `.env.local`. The `SUPABASE_SERVICE_ROLE_KEY` is server-only — never put it here.

---

## Production deploy + cache pitfall

Vercel auto-deploys on `git push origin main`. To verify what's live:

1. Hard refresh (Ctrl+Shift+R) on https://finance.goldenanchor.life
2. DevTools console: `window.__GA_BUILD__` — should match the marker in `src/App.jsx`
3. If it doesn't match: **unregister the service worker** — DevTools → Application → Service Workers → Unregister → Clear site data → hard refresh again. `public/sw.js` aggressively caches the bundle. This bit us multiple times in May 2026.

To check live bundle from CLI:
```bash
curl -s "https://finance.goldenanchor.life/" | grep -oE 'index-[A-Za-z0-9_-]+\.js'
curl -s "https://finance.goldenanchor.life/assets/<that-hash>.js" | grep -oE 'v[0-9]{3,4}-[a-z0-9-]+' | sort -u
```

---

## Locked decisions (top of mind)

Full list in `AGENT.md §4`. The ones that bite most often:

- **D-1** — Single-file architecture. `src/App.jsx` holds every component. Pure-data carve-outs allowed (`translations.js`, `engagementLetterTemplate.js`). Don't propose splitting into multiple component files.
- **D-3** — Bilingual EN/ES is launch-required. Any new visible string MUST land in BOTH `T.en` AND `T.es` in the same edit.
- **D-7** — React state lives in `App()` only. No Redux/Zustand/Context outside `ThemeCtx`/`HideCtx`/`useTh`.
- **D-8** — Recharts for all charts. Don't propose other chart libs.
- **D-27** (amended) — Mobile-first. Modals are centered on mobile (12px edge padding, 16px radius, 85dvh max-height), not bottom-sheet.
- **D-30** — Server code lives in `api/*.js` (Vercel Serverless Functions, Node runtime). Service-role keys never reach the browser.
- **D-34** — PDFs render via self-contained print HTML + `puppeteer-core` + `@sparticuz/chromium-min`. Do NOT drive the live SPA headlessly.
- **D-36** — Bulk source-text patches MUST be verified by a scope-aware checker, not just `tsc --noLib`. `t.foo` where `t` is undefined is valid JS syntax — the crash is runtime, not a parse error.

---

## Common pitfalls (top of mind)

Full list in `AGENT.md §7`. The ones most likely to recur:

- **#9** — 🌐 **BOTH languages, ALWAYS.** Translation symmetry is hard-locked.
- **#11** — Bare-word global replace also matches inside dict strings. Anchor replacements to JSX context (`>WORD</div>`, `label="WORD"`).
- **#13** — Hook order. Route checks and conditional returns MUST come after all `useState`/`useEffect` declarations in `App()`.
- **#14** — `zoom` CSS traps `position:fixed` descendants in WebKit. Mobile drawer/scrim must be siblings of, not descendants of, the zoom container.
- **#15** — PostgREST `.or()` filter — never put a JSON path or a dotted value inside it. Use separate `.eq()` calls instead.
- **#16** — In-app navigation must call `history.pushState` or Back unloads the SPA.
- **#17** (informal, post v0.20.0) — Components defined inside other components' bodies cause `<input>` re-mount on every parent render → "one-character-at-a-time" focus loss. Always define components at top level.

---

## Communication preferences (from WORKPLAN §1)

- **Be direct.** Skip compliments. Don't open with "Great question!"
- Treat as finance professional. Don't over-explain basics.
- Default language English. Switch to Spanish only if Mauricio writes in Spanish first.
- Numbered shorthand ("1. yes 2. a") is fine — read as answers to the questions just asked.
- **Acknowledge constraints:** major life transition, fiancée with health limitations, growing business, exiting day job in 2026.
- **Never date-suffix or version-suffix filenames.** No `App-v0.6.2.jsx`, no `App-backup.jsx`. One canonical name per file. History lives in git.

---

## Test account

`test@goldenanchor.life` / `Miami2020@` — for the local dev server. **Do not** use this account for real client data.

---

## Plugins installed (as of 2026-05-22)

- `github@claude-plugins-official`
- `gitlab@claude-plugins-official`
- `ui-ux-pro-max@ui-ux-pro-max-skill`
- `vercel@claude-plugins-official` (newly installed — auth via `/mcp` → vercel → Authenticate)
- `playwright@claude-plugins-official` (newly installed)
- `claude-mem@claude-mem` (memory across sessions)

---

## When in doubt

1. Read `AGENT.md §3` for the current version + smoke tests
2. Grep before reading large chunks of App.jsx
3. `git pull origin main` in `financeapp-deploy/` before editing
4. `npm run build` after every edit
5. Trust the build marker, not the docs — docs sometimes lag the code
