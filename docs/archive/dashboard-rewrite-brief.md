> **⛔ ARCHIVED — do not use.** This work is DONE/SHIPPED or SUPERSEDED. Kept for history only; NOT in LOGIC_MAP. For current truth see [docs/STATE.md](STATE.md) + [CHANGELOG.md](../../CHANGELOG.md).

# Task brief — rewrite dashboard.jsx to render from server aggregates (no client blobs)

## Why
Golden Anchor Finance is making the advisor app scale to ~50k clients. The dashboard currently
computes every chart from the in-memory `clients` array (each a full blob). At scale we can't load
all blobs. A server-side **aggregation data layer** is already built, verified, and deployed — your
job is to rewrite `src/components/dashboard.jsx` so every CHART reads from a new `dashData` prop
(the RPC results) instead of iterating `clients`/`active`.

## Hard rules (project constraints — violating these wastes the work)
- **D-1:** single-file era; `dashboard.jsx` is one already-extracted component file. Do NOT split it.
- **#17:** NEVER define a React component inside another component's body (causes input remount). Keep
  all helpers as plain functions or inline IIFEs exactly as the existing file does.
- **D-3 / #9:** every visible string lives in BOTH `T.en` and `T.es`. You should need NO new strings
  (reuse the existing `t.*` keys already in the JSX). If you genuinely need one, STOP and report it.
- Preserve ALL styling, the slot system (`dashCharts` map + gear/slot swap), dual-mode (`useTh()`),
  responsive (`isMobile`), KPI deltas, chart components (Donut, Sankey, Waterfall, Treemap, RadialGauge,
  NetWorthBridge, SmoothAreaLine, RankedHBars, Sunburst, Radar5, ForecastCone, Dumbbell, etc.).
- `npm run build` MUST pass (vite, ~0.5s). Run it; fix any error.

## The data contract — new `dashData` prop
`Dashboard` gains a prop `dashData` (may be `null` while loading — render the existing empty/placeholder
states or zeros when null; never crash). Shape:

```
dashData = {
  summary: {                      // ga_dashboard_summary — practice-wide CURRENT totals (active clients)
    client_count, total_debt, total_income, total_bills, total_min, liquid, total_nw,
    finance_only, finance_health, nw_neg, nw_low, nw_mid, nw_high
  },
  trend: [                        // ga_dashboard_trend — one row per month, ascending by month_key "YYYY-MM"
    { month_key, debt, savings, income, spending, client_count,
      a_liquid, a_invest, a_property, a_other, l_cards, l_loans_all, l_loans_current }
  ],
  debts: [ { name, bal, kind /* "card"|"loan" */, ltype /* loan type or "" */, first } ],  // ga_dashboard_top_debts, desc by bal
  assets:[ { bucket /* "cash"|"invest"|"property" */, name, val } ],                        // ga_dashboard_asset_alloc
  deltas:[ { local_id, first_name, last_name, nw_first, nw_last, nw_now } ],               // ga_dashboard_client_deltas, desc by nw_now
}
```

Helper you may add at the top of the component (plain const, not a component):
- `const _mlabel = (mk) => { const [y,m]=String(mk).split("-"); const MON=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return (MON[+m]||"")+"’"+String(y).slice(-2); };` — turn a `month_key` into the existing `"Mon’YY"` label style.
- `const _win = (rows, range) => { const n = range==="3"?3:range==="6"?6:range==="12"?12:rows.length; return rows.slice(-n); };` — apply the existing `trendRange` window to a trend array.

## Signature + top-of-body changes
- Add `dashData` to the destructured props. KEEP `clients` in the signature — it stays ONLY for the
  Import/Export/Backup modals (`ImportWizard existingClients`, `ExportModal clients`, `BackupImportModal`)
  which are unrelated to charts. Charts must NOT read `clients`/`active`.
- **Remove the `dashSearch` box and its filtering** — aggregates are always practice-wide from the RPC,
  so a client-side search filter no longer applies. Remove `dashSearch` state, the `<input>`, and the
  `.filter(dashSearch...)` in the `active` definition. (Note this in your report for the CHANGELOG.)
- Replace the top-of-body derived values with dashData equivalents:
  - `const S = dashData?.summary || {};` and `const TR = dashData?.trend || [];`
  - `td = S.total_debt||0`, `ti = S.total_income||0`, `fO = S.finance_only||0`, `fH = S.finance_health||0`,
    `liqNow = S.liquid||0`, `clientCount = S.client_count||0`.
  - `_shownLabels` becomes derived from the windowed trend: `const _w = _win(TR, trendRange); const _shownLabels = _w.map(r=>r.month_key);` (keep label conversion via `_mlabel` where rendered).
  - KPI sparkline series (oldest→newest, current appended):
    `clientSeries = _w.map(r=>+r.client_count).concat([clientCount])`,
    `incomeSeries = _w.map(r=>+r.income).concat([ti])`,
    `debtSeries  = _w.map(r=>+r.debt).concat([td])`,
    `liqSeries   = _w.map(r=>+r.savings).concat([liqNow])`. (Keep the existing `dlt()` delta helper.)

## Per-chart mapping (apply to the `dashCharts` slot map; window via `_w`/`_win` + `trendRange`)
- **incomeVsSpending:** `_w.map(r=>({ m:_mlabel(r.month_key), income:+r.income, spending:+r.spending, net:+r.income-+r.spending }))`.
- **sankey:** totalI=`S.total_income`, totalB=`S.total_bills`, totalM=`S.total_min`, cashFlow=`Math.max(0,totalI-totalB-totalM)`.
- **netWorthDonut:** tiers `{neg:S.nw_neg, low:S.nw_low, mid:S.nw_mid, high:S.nw_high}`; totalNW=`S.total_nw`. (Keep the same tier labels/colors/order.)
- **clientsTreemap:** `(dashData?.deltas||[]).map(d=>({ label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""), value:Math.max(0,+d.nw_now), color: <same nw thresholds as today> })).filter(d=>d.value>0)`.
- **clientsRanked:** same source as treemap, already desc by nw_now; take top 8, keep the palette.
- **practiceHealth:** inc=`S.total_income`, bls=`S.total_bills`, mnd=`S.total_min`, liq=`S.liquid`; keep dsr/sr/ef formulas.
- **netWorthBridge:** `_w.map(r=>({ label:r.month_key, assets:{liquid:+r.a_liquid,invest:+r.a_invest,property:+r.a_property,other:+r.a_other}, liabilities:{cards:+r.l_cards, loans:+r.l_loans_all} }))`.
- **debtVsSavingsTrend:** `_w.map(r=>({ label:_mlabel(r.month_key), debt:+r.l_cards, savings:+r.savings }))` then push live `{label:"▶ Now", debt:?, savings:liqNow}` — for the live debt use `S` has no revolving-only total; use `td` is total debt. Closest live revolving = not in summary; use the last trend `l_cards` OR `td`. Use `td` and note the minor caveat in your report.
- **cashFlowTrend:** `_w.map(r=>({ label:_mlabel(r.month_key), cashFlow:+r.income-+r.spending, income:+r.income }))` + live `{label:"▶ Now", cashFlow:S.total_income-S.total_bills-S.total_min, income:S.total_income}`.
- **debtRanked:** `(dashData?.debts||[]).map(d=>({ label:d.name+" · "+d.first, value:+d.bal, color: d.kind==="card"?"#EF4444":(d.ltype==="mortgage"?"#DC2626":d.ltype==="vehicle"?"#F97316":"#3B82F6") }))` (already desc; chart caps at maxBars).
- **practiceWaterfall:** inc=`S.total_income`, bls=`S.total_bills`, mnd=`S.total_min`; free=inc-bls-mnd.
- **healthRadar:** inc/bls/mnd/liq from `S`; totL=`S.total_debt`; totA=`S.total_nw + S.total_debt`; keep the 5 axis formulas.
- **netWorthForecast:** history = `_w.map(r=>({ label:_mlabel(r.month_key), value:(+r.a_liquid+ +r.a_invest+ +r.a_property+ +r.a_other)-(+r.l_cards+ +r.l_loans_all) }))`; live value = `S.total_nw`; keep the growth/projection math.
- **assetSunburst:** group `(dashData?.assets||[])` by `bucket` into cash/invest/property parents; each parent's `children` = its rows mapped `{label:row.name, value:+row.val, color:<existing palette by index>}`. Keep the parent labels/colors.
- **clientsDumbbell:** `(dashData?.deltas||[]).map(d=>({ label:d.first_name+" "+(d.last_name?d.last_name[0]+".":""), a:+d.nw_first, b:+d.nw_now })).filter(d=>d.a||d.b)`; keep maxRows.
- **netWorthSlope:** same `deltas` source, prior=`nw_first`, current=`nw_now` (read the existing render to match its data shape).
- **ANY OTHER slot chart below** (read the whole file): if it aggregates `active`/`clients`, map it to the
  closest dashData source by the same patterns. If a chart needs per-client-per-line data that dashData
  does NOT provide, DO NOT load blobs — leave that ONE chart's existing code but guard it so it renders an
  empty/placeholder state when `clients` is empty, and LIST it explicitly in your report as "needs a new
  aggregate — not converted." Do not silently leave it reading `clients`.

## Debt-mode toggle (`trendMode` all/revolving/current) on the main trend
The main trend's `getDebtForMode` per month maps to: revolving=`l_cards`, all=`l_cards+l_loans_all`,
current=`l_cards+l_loans_current`. Rewrite `getDebtForMode` to read a trend ROW instead of a snapshot.

## Deliverable
- Edit ONLY `src/components/dashboard.jsx`. Run `npm run build` until green.
- Write a report to `docs/superpowers/dashboard-rewrite-report.md`: what you changed, the dashSearch
  removal, any chart you could NOT convert (and why), and any caveats (e.g. the debtVsSavingsTrend live
  value). Return a 3-line summary + the report path.
- Do NOT touch any other file. Do NOT commit. Do NOT run the dev server.
