# APP-MAP.md — navigating `src/App.jsx` (≈7,900 lines, single-file by D-1)

> The app is **one file** on purpose (locked decision **D-1**). Splitting into
> component files is off the table. This map is the substitute: jump straight to
> the right line range instead of scrolling or re-reading the whole file.
> **Keep line numbers approximate** — they drift as the file changes. Always
> `Grep` the symbol name to get the live line, then `Read` that range.
>
> Fast recipe: `Grep "function ComponentName"` → Read ±40 lines. Section banners
> in the file look like `/* ── NAME ─── */` — grep `'/\* ── '` to list them all.

---

## 0. The design-token / "glass" system (read this before any visual edit)

The modern v0.61 look is driven by **theme tokens**, not per-component styling.
Change the token once → every card updates.

| Thing | Line (approx) | Notes |
|---|---|---|
| `GOLD` constant | 100 | brand gold `#C9A84C` |
| `makeDark(accent)` | 102 | dark theme tokens — incl. **glass tokens** `glassBg`/`glassBorder`/`blur`/`cardShadow`/`glow1`/`glow2` |
| `makeLight(accent)` | 106 | light theme tokens (glass = solid white + soft shadow) |
| `mINP(th)` | 140 | input style helper |
| **`mCARD(th)`** | 141 | **the card style** — reads `th.glassBg/glassBorder/blur/cardShadow`. Used 180× |
| theme merge (`const theme=…`) | ~7494 | merges factory + user `settings` overrides. `glassBg` is pinned to factory glass so the redesign always shows; `th.card` still honors a custom solid color for direct users |
| app shell `<div>` w/ glow | ~7868 | `background:` = two `radial-gradient` glows (`theme.glow1/2`) + `theme.bg` |
| global `<style>` + `@media print` | 780, ~7746 | print resets cards to solid; emailed PDF uses a **separate** template (D-34) so screen glass is safe |

**To retexture cards app-wide:** edit the glass tokens in `makeDark`/`makeLight`
(line 102/106). Do **not** restyle individual cards.

---

## 1. Top of file — setup & data

| Area | Line | |
|---|---|---|
| imports (recharts, lucide) | 1–30 | |
| SUPABASE CLIENT | 36 | `supabase` may be `null` if env vars missing |
| THEMES | 99 | see §0 |
| STYLES (`mINP`/`mCARD`/`mTD`…) | 141 | |
| META / build marker | 153, `__GA_BUILD__` ~6016 | bump marker every ship |
| DATA MODEL (`mig`, totals) | 209 | client object shape, migrations |
| HELPERS / CSV / REMINDERS | 224 / 258 / 268 | money fmt, payoff math, alerts |

## 2. Primitives & modals

| Component | Line | |
|---|---|---|
| PRIMITIVES (`SC`, `KpiTile`, `Skel`, `Tog`, `Pill`, `InfoTip`…) | 278 | **`KpiTile`** 314 · **`SC`** 338 |
| `Modal` / `SaveBar` / `IAdd` | 453 | base modal shell |
| ProfileModal / ProfileToggleField | 462 | |
| New/Edit Client modals | 606 / 609 | |
| Income / Card / Bill / Account / Loan / Asset modals | 663–681 | per-record editors |

## 3. Client-detail sections (the per-client editor tabs)

| Section | Line |
|---|---|
| Income / Bills / Debt | 699 / 702 / 705 |
| Accounts & Loans / Custom Assets / Savings | 708 / 712 / 716 |
| Notes | 720 |
| INTAKE (advisor-side body) | 769 |
| SUMMARY (P1/P2/Both) | 907 |

## 4. Charts — the pure-SVG library (D-8: Recharts is the only *lib*; these are hand-rolled SVG)

All under "Phase 5 Charts". Grep the name to land on it.

| Chart | Line | Chart | Line |
|---|---|---|---|
| chart anim foundation (`useTweenedData`) | 944 | Donut | 1011 |
| Waterfall | 1058 | LiveTrendCard (wraps next two) | 1120 |
| **PairedBars** (bar mode) | 1127 | **SmoothAreaLine** (area/line) | 1252 |
| Sankey | 1377 | Treemap | 1479 |
| RadialGauge | 1555 | RankedHBars | 1610 |
| BulletChart | 1651 | **Sparkline** | 1684 |
| Radar5 | 1720 | NetWorthBridge | 1757 |
| PayoffProgression | 1847 | AmortizationArea | 1918 |
| CompoundGrowthStack | 1969 | StackedBars | 2059 |
| HeatmapCalendar | 2102 | GroupedYoY | 2133 |
| ForecastCone | 2175 | SlopeGraph | 2229 |
| Sunburst | 2282 | Dumbbell | 2342 |

## 5. Reports

| Area | Line |
|---|---|
| Monthly tab / Cash Flow Statement / Financial Statements | 2456 / 2484 / 2529 |
| Investments tab | 2545 |
| Full Detailed Report / Client Report / new report tab comps | 2635 / 2659 / 2661 |
| Year Compare / Compare report tab | 3490 / 3544 |

## 6. Dashboard & lists

| Area | Line | |
|---|---|---|
| Reminders panel (Advisor Alerts + Client Due) | 3565 | |
| Calculators (client-scoped) | 3719 | tab header ~3144 |
| Excel/CSV importer / Import wizard | 4077 / 4282 | |
| Dashboard chart **catalog** (slot options) | 4501 | add a slot option here |
| ChartSettingsModal / Chart Gallery | 4530 | audit surface for all charts |
| DashSlotPicker (gear per card) | 4828 | |
| **DASHBOARD** (main render) | 4844 | **incomeVsSpending chart** ~4874, bars ~4894 |
| Client list | 5207 | |
| **Client Detail** | 5507 | |

## 7. Auth, app root, public surfaces

| Area | Line | |
|---|---|---|
| **LOGIN / landing** (modern glass + line-field canvas) | 5539 | the reference for the modern look; `P`/`glass`/glow defined ~5642 |
| **APP()** (root component, all state) | 5772 | hooks first, then route checks (pitfall #13) |
| app shell `<div>` (sidebar + main + glow bg) | ~7862 | |
| SignaturePad / ToSModal / EngagementLetter | 5789 / 5848 / 5876 | |
| Public Intake (5-stage) | 6065 | helpers 6066 |
| New Invite modal / Intake submissions admin | 6511 / 6644 | |
| Settings / Security / Billing / Backup / Archived / What's New / Help | 7321 / 6954 / 6988 / 7020 / 7042 / 7064 / 7206 | |
| TopBar | 7403 | |
| global `<style>` injection + `@media print` | ~7746 | |

---

## Working rules (so edits stay safe)

- **D-1** single file. **D-3 / pitfall #9** every visible string in BOTH `T.en` and
  `T.es` (`src/translations.js`) in the same edit.
- **Pitfall #17** never define a component inside another component's body — it
  remounts inputs and steals focus. All components top-level.
- **Pitfall #13** in `APP()`, all `useState`/`useEffect` come before any route
  check / conditional return.
- After any edit: `npm run build` (≈1s, catches JSX errors). Then verify the
  **build marker** live, not the docs.
- Visual edits: change **tokens** (§0), not 180 call sites.
