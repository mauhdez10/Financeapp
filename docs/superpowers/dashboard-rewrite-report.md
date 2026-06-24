# Dashboard rewrite report — render from server aggregates (`dashData`)

Scope: rewrote `src/components/dashboard.jsx` so every CHART reads from the new
`dashData` prop (server RPC aggregates) instead of iterating the in-memory
`clients`/`active` array. `npm run build` passes (vite, ~0.44s). Only
`dashboard.jsx` was touched. No new translation strings were introduced (D-3 / #9
respected) and no nested component definitions were added (#17 respected).

## Signature + top-of-body changes
- Added `dashData` to the destructured props. **Kept `clients`** in the signature —
  it now backs ONLY: the Import/Export/Backup modals (`ImportWizard existingClients`,
  `ExportModal clients`, `BackupImportModal existingClients`) and the bottom client
  roster list (see caveat below). No chart reads `clients`/`active`.
- Added two top-of-file plain-const helpers (not components, per #17):
  - `_mlabel(mk)` — `"YYYY-MM"` month_key → existing `"Mon’YY"` label style.
  - `_win(rows, range)` — applies the `trendRange` window (last 3/6/12/all rows).
- Replaced the derived snapshot math with dashData equivalents:
  - `const S = dashData?.summary || {}; const TR = dashData?.trend || [];`
  - `td = S.total_debt`, `ti = S.total_income`, `fO = S.finance_only`,
    `fH = S.finance_health`, `liqNow = S.liquid`, `clientCount = S.client_count`
    (all `|| 0`).
  - `const _w = _win(TR, trendRange); const _shownLabels = _w.map(r=>r.month_key);`
  - `trend = _w.map(r => ({ m:_mlabel(r.month_key), debt:getDebtForMode(r), savings:+r.savings||0 }))`.
- `getDebtForMode` rewritten to read a **trend ROW** instead of a client snapshot:
  revolving=`l_cards`, all=`l_cards+l_loans_all`, current=`l_cards+l_loans_current`.
- KPI sparkline series now come from the windowed server trend with the live value
  appended: `clientSeries`/`incomeSeries`/`debtSeries`/`liqSeries` from
  `_w.map(...)` + `concat([clientCount/ti/td/liqNow])`. The existing `dlt()` delta
  helper and all KPI tile deltas are preserved unchanged. The Clients KPI tile now
  shows `clientCount` (was `clients.length`).

## dashSearch removal (note for CHANGELOG)
- Removed `dashSearch` state, the `<input>` search box in the roster header, and the
  `.filter(dashSearch...)` clause in the `active` definition. Aggregates are always
  practice-wide from the RPC, so a client-side search filter no longer applies to the
  charts. The roster header now shows just the client count; `active` is now simply
  `clients.filter(c=>!c.archived)`.

## Per-chart conversion status

Converted to `dashData` (exact mapping per brief):

| Chart | Source |
|---|---|
| incomeVsSpending | `_w` → income/spending/net |
| sankey | `S.total_income/total_bills/total_min` |
| netWorthDonut | `S.nw_neg/nw_low/nw_mid/nw_high`, `S.total_nw` |
| clientsTreemap | `dashData.deltas` (nw_now, same nw color thresholds) |
| clientsRanked | `dashData.deltas` (desc, top 8, same palette) |
| practiceHealth | `S` income/bills/min/liquid (dsr/sr/ef formulas kept) |
| netWorthBridge | `_w` a_liquid/a_invest/a_property/a_other, l_cards/l_loans_all |
| debtVsSavingsTrend | `_w` l_cards + savings, live `{td, liqNow}` |
| cashFlowTrend | `_w` income−spending, live `{income−bills−min}` |
| debtRanked | `dashData.debts` (kind/ltype colors) |
| practiceWaterfall | `S` income/bills/min |
| healthRadar | `S` (totL=total_debt, totA=total_nw+total_debt) |
| netWorthForecast | `_w` (a−l history), live=`S.total_nw` |
| assetSunburst | `dashData.assets` grouped by bucket (parent labels/colors + per-index palettes kept) |
| clientsDumbbell | `dashData.deltas` (nw_first→nw_now) |
| netWorthSlope | `dashData.deltas` (nw_first vs nw_now) |
| spendingHeatmap | full `TR` (year×month from `month_key` + `spending`) — uses the WHOLE trend, not windowed, since the heatmap spans all years |
| kpiSparklines | `_w` (nw/debt/savings/cashflow) + live `S` values |

### NOT converted — guarded to placeholder (need new aggregates)
These three need per-client-per-line-item data that `dashData` does NOT provide. Per
the brief, I did NOT load client blobs — each is guarded so it renders its existing
empty/placeholder state (data array forced empty), and the reason is commented inline:

1. **billsStacked** ("Bills by Category") — needs per-category bill line-items per
   month (housing/transport/insurance/food/other). `dashData.trend` only carries a
   total `spending` per month, no category split. **Needs a new aggregate** (e.g. a
   monthly bills-by-category RPC).
2. **billsYoY** ("Bills YoY") — needs per-category bill totals split by year. Same
   missing category dimension. **Needs a new aggregate.**
3. **payoffProgression** ("Debt Payoff Timeline") — the avalanche projection needs
   per-debt **APR and minimum payment**. `dashData.debts` only carries
   `name/bal/kind/ltype/first` (no apr/min/payment). **Needs an expanded debts
   aggregate** that includes apr + min payment.

## Caveats
- **debtVsSavingsTrend live point:** the summary has no revolving-only live total, so
  the `"▶ Now"` point uses `td` (TOTAL debt) for the debt value, while the historical
  trend points use `l_cards` (revolving only). Minor inconsistency at the final point —
  flagged per the brief. Resolvable later by adding a revolving-only live total to
  `ga_dashboard_summary`.
- **clientsDumbbell / netWorthSlope leftLabel:** `deltas` spans first→now without a
  per-month label, so `leftLabel` falls back to the first windowed `month_key`
  (`_mlabel`) or `"Prior"`. No new strings; uses the existing `"Prior"` literal that
  was already in the code.
- **Bottom client roster list** (the scrollable per-client cards below the charts) is
  NOT a chart and still renders from `clients`/`active` — it needs full per-client
  financials (`sumN`, `totalA`, `totalL`, snapshots) that `dashData.deltas` (name +
  net worth only) cannot supply. The brief scoped the rewrite to CHARTS and kept
  `clients` for non-chart surfaces, so this is intentional. At true 50k scale the
  roster would need its own paginated list endpoint; that is out of scope here and not
  a chart.
- **Parent wiring:** `App.jsx` does not yet pass `dashData` (separate, out-of-scope
  task). With `dashData` undefined, all guards default to `{}` / `[]` and the dashboard
  renders zero/empty states without crashing (verified: app loads, no blank screen).
- Removed now-unused imports (`ACCT_META`, `MS`, `liquidA`, `sumB`, `sumMin`, `toM`).
  `setTrendMode` remains declared-but-unused exactly as in the pre-rewrite file (no
  debt-mode toggle UI exists in this extracted component); left untouched to avoid
  scope creep.

## Verification
- `npm run build` → green (`✓ built in ~0.44s`).
- Static check: no chart render path references `active`/`clients` for data; the only
  remaining `active.` usages are the roster definition + roster render and label text.
- Preview server loaded the app without a blank/crash screen.
