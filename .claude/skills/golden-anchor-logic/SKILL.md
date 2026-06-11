---
name: golden-anchor-logic
description: The canonical domain logic of Golden Anchor Finance — role/permission rules, the share-portal security model, and the exact formulas behind every derived metric (net worth, DSR, cash flow, emergency fund, payoff math). CONSULT BEFORE touching any code that computes money, gates a role, or exposes client data — these rules must not drift. Also the source of truth for tooltips, how-to guides, PDF captions, and portal copy.
---

# Golden Anchor — Domain Logic (consult before changing related code)

> Why this exists: logic that *looks* fine and passes a build can still violate the intended
> model (a formula silently changed, a role seeing one field too many). This file states the
> canonical model. **If a change contradicts it, stop and surface the conflict to Mauricio**
> — then update this file in the same change. Formulas below were extracted verbatim from
> `src/utils/finance.js` (Phase 0, 2026-06-10); that file is their implementation.

## 1. Roles & permissions (v0.69+)

- **Role source of truth = auth token:** `user.user_metadata.role` — `"client"` or absent
  (absent ⇒ advisor). Set at signUp (`options.data.role`). **NEVER store or read role from
  `settings`** — settings are client-cached in localStorage and once bled across accounts
  (AGENT.md pitfall #18).
- **Advisor** sees the full app: Dashboard (all their clients), Clients, Intake Forms,
  Calculators, Promotions, Pricing, Resources, About, plus avatar-menu pages.
- **Client** sees ONLY: Overview (their single self-profile rendered via ClientDetail
  `clientMode` — no Back button, kebab = Edit/Export only), Calculators, Resources, Pricing,
  About; avatar menu = Profile settings / Security / Billing & plan / Help / Sign out;
  Settings = the client variant (My profile, Appearance, Localization, Your plan — no
  advisor cards). A nav guard bounces any other nav/deep-link to "dashboard" (v0.71.1).
- **Client data model:** a client account owns ONE self-entered profile (their own
  `clients[0]`, auto-created on first login). There is NO advisor↔client account link —
  advisors and client accounts never see each other's data (RLS `auth.uid()=user_id` on
  every table + the client-side rules below).
- **Client-side cache rules (hard law):** every per-user localStorage cache is tagged with
  `ga_cache_uid`; an absent or mismatched tag = foreign ⇒ purge before any migrate/load;
  caches cleared on sign-out; session drafts are uid-tagged and never restored across users
  or into a client account. RLS being correct does NOT make the cache safe.
- **Adversarial proof obligation:** any change to roles/nav/portal re-runs the proof —
  drive the app as BOTH roles (advisor `test@goldenanchor.life`, client
  `clientdemo@goldenanchor.life`) and confirm each sees exactly its surfaces and ZERO of
  the other's data (nav, deep-links, localStorage after switching). Last run: 2026-06-10, green.

## 2. Token share-portal security model (v0.68–v0.71)

- Advisor generates a link per client (`portal_links` row: unguessable 32-byte base64url
  token, optional `expires_at` — Never/30/90 days, `revoked` flag, `modules` jsonb).
  Regenerating rotates the token and revokes prior links.
- `/portal?token=…` resolves through `api/resolve-portal.js` ONLY (service-role; anon
  browser never touches the tables; per-IP rate-limited, fail-open).
- **Sanitize allow-list (server-side, the security boundary):** only these client fields
  leave the server: id, firstName, lastName, partnerFirst/Last, clientType, email,
  incomeStreams, bills, cards, accounts, loans, customAssets, marketInvestments,
  properties, monthSnapshots, alloc, committed, efMonths, savedPortfolio, portfolioCustom,
  planStrategy, planOverrides, reportInclude, and `notes` reduced to
  goals/shortTerm/midTerm/longTerm. **SSN/social, DOB, phone, address, recommendedBy, and
  internal notes (general, setbacks) NEVER leave the server.** Extending the allow-list
  requires owner sign-off.
- `modules` ({cashflow, assets, trend, ef, goals}: bool) is a **display preference, not a
  security boundary** — the advisor picks which sections render; unchecked ≠ secret.
- Emailing the link (`api/send-portal-link.js`) requires the advisor's JWT AND verifies the
  token belongs to that advisor and is active — the endpoint cannot relay arbitrary links.

## 3. Derived metrics — exact formulas (implementation: `src/utils/finance.js`)

**Frequency normalization** — everything is computed monthly:
`FREQ = {weekly: 52/12, biweekly: 26/12, semimonthly: 2, monthly2: 1, annual: 1/12}`;
`toM(amount, freq) = amount × FREQ[freq]`.

| Metric | Formula | Notes / why |
|---|---|---|
| **Net income /mo** `sumN` | Σ toM(stream.net, freq) | Take-home, not gross. `sumG` = same on gross. |
| **Active bills** `actB` | regular: always · temporary: until `maturity` · annual: only in its `dueMonth` | A December-only bill doesn't inflate June. |
| **Monthly bills** `sumB` | Σ toM(activeBill.cost, freq) | |
| **Card min payment** `effectiveMin` | balance>0 ? min(balance, max(25, min ?? round(1%·balance + monthly interest))) : 0 | Floor $25; never more than the balance. |
| **Min debt service** `sumMin` | Σ effectiveMin(card) | Cards only — loan payments live in bills. |
| **Card monthly interest** `cardMoInt` | (balance − Σpromo.balance)·APR/12 + Σ(promo.balance·promo.rate/12) | Promo balances accrue at their promo rate. |
| **Cash flow /mo** | sumN − sumB − sumMin | The dashboard/portal "leftover". |
| **Total assets** `totalA` | Σaccounts.value + Σproperties(=customAssets fallback).value + ΣmarketInvestments.value | |
| **Total liabilities** `totalL` | Σloans.balance + Σcards.balance | |
| **Net worth** | totalA − totalL | |
| **Liquid assets** `liquidA` | Σ accounts where type ∈ {checking, savings, money_market} | Retirement/IRA/brokerage are NOT liquid. |
| **Emergency fund target** | sumB × efMonths (client setting, default 3) | Gauge: liquid / target. |
| **Payoff months** `payM(bal, apr, pay)` | r=apr/1200; r=0 ⇒ ceil(bal/pay); else ceil(ln(pay/(pay−r·bal))/ln(1+r)) | Null when payment can't outrun interest. |
| **Loan payment** `mthPmt(P, r, n)` | r=0 ⇒ P/n; else P·(r/12)·(1+r/12)ⁿ/((1+r/12)ⁿ−1) | Standard amortization. |

**Financial ratios (`RATIOS_META`)** — thresholds are the coaching targets:
- `currentRatio` = liquid assets ÷ current liabilities — target **> 1.0×** (higher better)
- `dta` debt-to-assets = totalL ÷ totalA — target **< 40%** (lower better)
- `dsr` debt-service = debt payments ÷ net income — target **< 36%** (lower better; >50% critical)
- `rsr` retirement-savings = retirement contributions ÷ gross income — target **12–15%**
- `efr` emergency-fund = liquid ÷ monthly bills — target **3–6 months**
Color/status bands live in `ratColor/ratStatus` (red ≥ first threshold, amber to second, green past).

**Reminder engine:** bill/card "due soon" = within 7 days, keyed by YYYY-MM so a dismissal
auto-recycles next cycle; advisor alerts: noContact ≥ settings.noContactDays (default 30,
high >60d), highDSR > 36% (high >50%), promo expiring ≤ 60d (high ≤14d), debtRising =
latest snapshot debt > first snapshot debt.

<!-- TODO(owner): annotate any metric above with YOUR "why I coach it this way" — the
     how-to guides will quote those annotations verbatim. -->

## 4. The 9 standalone calculators (implementation: `src/components/calculators.jsx`)

> Documented from the actual code (2026-06-10). The math below is what ships — if a
> change alters any formula, update this section in the same change. Shared helpers
> referenced here (payM, mthPmt) are defined in §3. Portfolio defaults:
> `DEF_PORT_RATES` conservative 5.5% / growth 8.5% / aggressive 11.0%; holdings in
> `PORTFOLIOS` (constants/meta.js).
>
> InterestCalc's compound-frequency selector was decorative until v0.72.3 — it is WIRED
> now (owner-approved 2026-06-11): periods/year pf ∈ {12,4,1}; see InterestCalc below.

### RetirementCalc
- **Inputs:** current age (30), retire age (65), balance ($25,000), monthly contribution ($500), employer match % (50), match limit (6% of salary), monthly gross salary ($5,000), worst/base/best annual returns (5/8/11%).
- **Method:** months = (retireAge−currentAge)×12. Employer match = min(monthly, salary×matchLimit%)×matchPct%. Projection per scenario: `balance·(1+r/12)^months + totalMonthly·((1+r/12)^months−1)/(r/12)`. Retirement income = balance×0.04/12 (4% rule, monthly).
- **Assumptions:** monthly compounding; three fixed scenarios; 4% safe-withdrawal rule; ForecastCone band uses 18% uncertainty.
- **Outputs:** balance at retirement per scenario, total contributed, growth, monthly income at 4%, scenario chart + ForecastCone.
- **Edge cases:** zero years → no chart; zero balance/monthly handled by the formulas.
- **Plain-English:** how much you'll have at retirement under three market scenarios, and the monthly income that supports at a conservative 4% withdrawal.

### PortfolioStandaloneCalc
- **Inputs:** portfolio (Conservative/Growth/Aggressive), editable return per portfolio, initial ($0), monthly ($500), years (1–40 slider, default 10).
- **Method:** FV = `initial·(1+r/12)^(y×12) + monthly·((1+r/12)^(y×12)−1)/(r/12)`. Real value = nominal/(1.03)^years. Growth = FV − contributed. Holdings/allocations from `PORTFOLIOS`, descriptions from `TICKER_META`.
- **Assumptions:** monthly compounding; fixed 3% inflation for the real-value overlay.
- **Outputs:** portfolio cards with editable rates, per-holding monthly allocation, FV, contributed, growth chart (nominal + inflation-adjusted).
- **Edge cases:** zero inputs → zero; zero-value holdings still render with their %.
- **Plain-English:** how a chosen portfolio grows at its expected return, shown both in tomorrow's dollars and in today's purchasing power.

### HomeEquityCalc (4 tabs)
- **Inputs:** home value ($400k), 1st/2nd mortgage + liens, max LTV (80%), HELOC APR (7.5%)/term (10y); refinance: balance/rates/terms/closing costs; amortization: payment + extra; projection: appreciation (3.5%/yr), years.
- **Method:** **Equity/HELOC:** maxLoan = max(0, homeValue×LTV% − totalOwed); payment = mthPmt(maxLoan, apr, term×12). **Refinance:** monthly savings = mthPmt(old) − mthPmt(new); break-even = ceil(closingCosts/monthlySavings); lifetime savings = savings×newTermMonths − closingCosts. **Amortization:** iterates monthly — interest = bal×apr/1200, principal = min(bal, payment−interest+extra) — yearly rollups. **Projection:** home value compounds annually while the mortgage amortizes monthly; equity = value − balance.
- **Assumptions:** monthly mortgage compounding; amortization stops at balance <$0.01; projection capped at 30 years.
- **Outputs:** current equity, max borrowable, HELOC payment; refi monthly/lifetime savings + break-even; paginated amortization table; equity-projection chart.
- **Edge cases:** maxLoan clamps at 0 when underwater; "N/A" break-even when refi doesn't save; loops terminate at zero balance.
- **Plain-English:** how much of your home you actually own, what you could borrow against it, whether refinancing pays off, and how equity builds over time.

### IncomeCalc
- **Inputs:** filing status (Single/MFJ/HOH), 65+/blind flags, state flat tax %, primary + secondary job (hourly/hours/OT/weeks or salary override), bonuses, other income, retirement % + fixed, HSA/FSA, health premium/mo, post-tax deductions, paychecks/yr (26).
- **Method:** wages = salary>0 ? salary : (hourly·hours + hourly·OTmult·OThours)·weeks. Gross = wages + bonuses + other. Pre-tax = gross·retire% + retireFixed + HSA + premium×12. AGI ≈ gross − pretax. Std deduction = 2025 table (S $15,750 / MFJ $31,500 / HOH $23,625) + 65/blind extras (+$2,000 or +$1,600 MFJ each) + senior bonus deduction (2025–28, up to $6k/$12k, phases out). Federal tax via hardcoded **2025 brackets** per filing status. State = AGI×flat rate. SS = min(gross, $176,100)×6.2%; Medicare = gross×1.45% + 0.9% above $200k/$250k. Net = gross − pretax − taxes − post-tax; per-paycheck = ÷ paychecks.
- **Assumptions:** **2025 federal brackets/deductions hardcoded** (annual maintenance item); flat state tax only; no itemizing, credits, or FICA on pre-tax 401k nuance.
- **Outputs:** paycheck breakdown donut, effective-tax-rate gauge, full summary (AGI, taxable, bracket, each tax, net annual, gross/net per check).
- **Edge cases:** MFJ reveals spouse flags; zero state rate → no state line; additional Medicare shown only when >0.
- **Plain-English:** what you actually take home per paycheck after federal, state, Social Security, and Medicare taxes — and which tax bracket you're really in.

### DebtReductionCalc (Payoff + CC-vs-Loan)
- **Inputs:** card balance ($5,000), APR (28%), payment ($200); compare mode: loan APR (12%), term (36 mo), origination fee (% of balance or flat).
- **Method:** payoff months = payM(balance, apr, payment); total = payment×months. Compare: loanAmount = balance + origination; loanPayment = mthPmt(loanAmount, loanApr, term); savings = ccTotal − loanTotal. PayoffProgression iterates balance − (payment − monthly interest), capped 120 months.
- **Assumptions:** fixed payment; fee either % or flat; monthly compounding.
- **Outputs:** payoff time, total paid, total interest; side-by-side CC vs loan cards + "saved with loan/CC" verdict; payoff curve.
- **Edge cases:** payment ≤ monthly interest → payM null → "—" (never pays off); zero guards throughout.
- **Plain-English:** how long your card takes to pay off at this payment, and whether consolidating into a personal loan (fees included) actually saves money.

### CarLoanCalc
- **Inputs:** price ($30,000), rebate, trade-in value + payoff, sales tax (7%), title/dealer/doc fees, GAP, warranty, down ($5,000), APR (6.9%), term (12–84 mo slider).
- **Method:** salesTax = max(0, price − tradeIn − rebate)×rate. Total = price + tax + fees − rebate. Financed = max(0, total − down − tradeIn + tradeInPayoff). Payment = mthPmt(financed, apr, term).
- **Assumptions:** tax on price-minus-trade-minus-rebate (FL-style); trade-in payoff is added back to the financed amount.
- **Outputs:** amount financed, monthly payment, total interest, total cost, amortization chart.
- **Edge cases:** negative bases clamp to 0; chart hidden when nothing is financed.
- **Plain-English:** your real monthly car payment once taxes, fees, trade-in, and rebate are all counted — not just the sticker price.

### AffordabilityCalc
- **Inputs:** gross monthly income ($6,000), existing debt ($500), max DTI (28–50% slider, default 43%), APR (7%), term (30y), property tax (1.2%/yr), insurance ($150/mo), HOA, down payment (% or $).
- **Method:** max housing payment = income×DTI% − existing debt. Max price solved by 5-round iteration: estimate price → monthly tax = price×taxRate/12 → P&I budget = maxPayment − tax − insurance − HOA → loan = present-value of that annuity → price = loan/(1−down%). Final PITI = mthPmt(loan) + tax + insurance + HOA.
- **Assumptions:** DTI counts PITI + existing debt over gross income; 5 iterations converge; monthly compounding.
- **Outputs:** max home price, down payment $ and %, loan amount, full PITI breakdown donut, DTI gauge (≤36% target).
- **Edge cases:** zero income → zero everything; converges to 0 when payment can't cover taxes+insurance.
- **Plain-English:** the most home you can afford at your income and debt level — with taxes, insurance, and HOA included, not just the mortgage.

### InterestCalc
- **Inputs:** principal ($10,000), rate (5%), years (5), type (compound/simple), monthly contribution, compound frequency selector (see quirk above).
- **Method:** compound (v0.72.3): pf = selected periods/year (12/4/1); per-period deposit = monthly·(12/pf); FV = `P·(1+r/pf)^(y×pf) + perDep·((1+r/pf)^(y×pf)−1)/(r/pf)`. Simple: FV = P·(1+r·y) (contributions ignored). Real value = total/(1.03)^years. The growth-stack chart still draws the monthly approximation.
- **Assumptions:** deposits accumulate into each compounding period; 3% inflation for real value.
- **Outputs:** final value, interest earned, inflation-adjusted value, CompoundGrowthStack (principal/contributions/interest layers).
- **Edge cases:** zero-rate → arithmetic sums; division-by-zero guarded.
- **Plain-English:** how money grows with compounding versus simple interest, and what that growth is worth after inflation.

### SavingsCalc (High-Yield Savings)
- **Inputs:** initial ($1,000), monthly ($200), APY (4.5%), years (10).
- **Method:** r = APY/1200; FV = `initial·(1+r)^(y×12) + monthly·((1+r)^(y×12)−1)/r`; interest = FV − contributions. Yearly chart points for value vs cumulative contributions.
- **Assumptions:** monthly compounding of APY; yearly chart resolution.
- **Outputs:** future value, total contributed, interest earned, dual-line growth chart.
- **Edge cases:** zero APY/monthly degrade to simple sums; zero years → empty chart.
- **Plain-English:** what a high-yield savings account earns you over time beyond what you put in.

## 5. Chart catalog — the 23 pure-SVG components (`src/components/charts.jsx`)

> Documented from code 2026-06-11. All are theme-aware (`useTh()`), tween values via
> `useTweenedData`, and render empty-state placeholders on no data. "Gallery" = the
> ChartGallery previews in ChartSettingsModal (App.jsx ~2395); "Dashboard slot" = the
> DashSlotPicker slot renderer in Dashboard (App.jsx ~2605); calculators per §4.

- **Donut** — proportional slices with optional center KPI, per-slice radial gradient; props `{data:[{label,value,color}], centerLabel, centerValue}`; used: Cash Flow Statement, Dashboard slots (net-worth donut etc.), IncomeCalc paycheck breakdown, AffordabilityCalc PITI, HomeEquityCalc, gallery, share portal.
- **Waterfall** — signed cash-flow steps (Income → −Bills → −Debt → Net) with running cumulative and `kind:"total"` bars resetting to zero; props `{segments:[{label,value,kind?,color}]}`; used: Cash Flow Statement, Dashboard slot, gallery, share portal.
- **PairedBars** — combo: savings/income bars above zero, debt/bills mirrored below, dashed gold cumulative-net line; props `{data, debtKey, savingsKey, debtColor, savingsColor}`; used: LiveTrendCard bar mode only.
- **LiveTrendCard** — wrapper card: line/bar toggle persisted to `localStorage[client.{id}.live-view.{templateId}]`, footer row = last debt/savings + first→last % deltas + crossover month or net; props `{client, trendData, debtKey, savingsKey, templateId, t}`; used: ClientDetail header trend cards.
- **SmoothAreaLine** — two Catmull-Rom area curves (debt vs savings), crossover dots where the series flip, pulsing live dot when last label matches /Now|▶/; colors/stroke/legend overridable per `templateId` via chart-config context; props `{data:[{label,debt,savings}], debtKey, savingsKey, templateId}`; used: SummarySection trend, Dashboard trend slots (×2), LiveTrendCard line mode, gallery, share portal.
- **Sankey** — layered flow bands (nodes carry `layer` column index), node height ∝ max(in,out); props `{nodes:[{id,layer,label,color}], links:[{from,to,value}]}`; used: Dashboard income→spending→savings flow slot.
- **Treemap** — squarified proportional tiles, labels render only when the tile fits; props `{data:[{label,value,color}], valuePrefix}`; used: Dashboard allocation slot, gallery.
- **RadialGauge** — 270° arc with optional target tick; threshold coloring `thresholds:[good,warn]` + `direction:"higher"|"lower"`; props `{value, max, target, label, fmt}`; used: SummarySection ratio trio, Dashboard ratio trio, IncomeCalc effective-tax, AffordabilityCalc DTI, gallery, share portal EF gauge.
- **RankedHBars** — horizontal bars sorted desc, top `maxBars=10`; props `{data:[{label,value,color}]}`; used: ClientDebtCalc debt ranking, AssetsLiabilitiesTab (assets + liabilities ×2), Dashboard slot, gallery.
- **BulletChart** — Tufte bullet: progress fill vs target tick on a range bar; props `{value, target, max, label, sublabel}`; used: gallery only (goal-progress preview — no live surface yet).
- **Sparkline** — axis-less mini trend with endpoint dot, optional area fill; props `{data:[number], color, fill, strokeWidth}`; used: KpiTile (primitives.jsx) KPI strips, Dashboard KPI row, gallery.
- **Radar5** — up-to-5-axis polygon, values clamped 0–1, optional dashed target ring; props `{axes:[string], values:[0..1], target}`; used: SummarySection financial-health (DSR/Savings/EF/D-A/Cash), Dashboard slot, gallery.
- **NetWorthBridge** — stacked asset bands above zero, liability bands below, gold net-worth line on top; props `{data:[{label, assets:{checking,savings,...}, liabilities:{cards,loans,...}}]}`; used: Dashboard slot, gallery.
- **PayoffProgression** — simulates monthly interest + min payments (extra applied avalanche-order, cap `maxMonths=120`), stacked declining balance bands; props `{debts:[{name,balance,apr,min,color}], extraPay}`; used: ClientDebtCalc, DebtReductionCalc, Dashboard slot, gallery.
- **AmortizationArea** — single loan balance decay area; computes the payment internally from principal/apr/term; props `{principal, apr, termMonths, extraPay}`; used: ClientCarLoanCalc, CarLoanCalc, gallery.
- **CompoundGrowthStack** — three stacked bands (principal flat / contributions linear / interest exponential) + marker at the year interest > principal+contributions; props `{principal, monthly, rate, years, simple}`; used: InterestCalc only.
- **StackedBars** — vertical stacked bars per period across category keys; props `{data:[{label, ...categoryValues}], categories:[keys], colors:{}}`; used: Dashboard bills-by-category slot, gallery.
- **HeatmapCalendar** — year-rows × month-cols intensity grid, cream→amber lerp by value/max; props `{data:[{year, month(1-12), value}], colorScale}`; used: Dashboard spending-heatmap slot, gallery.
- **GroupedYoY** — side-by-side current-vs-prior bars per category with legend; props `{data:[{label,current,prior}], curLabel, priorLabel}`; used: Dashboard slot, gallery.
- **ForecastCone** — solid history line + dashed projection with confidence band widening ∝ value·confidence·√months; props `{history:[{label,value}], projection:[{label,value}], confidence=0.2}`; used: RetirementCalc (18% band), Dashboard projection slot, gallery.
- **SlopeGraph** — two-period per-category slope lines, sorted by current value, right side shows value + % change; props `{data:[{label,a,b,color}], leftLabel, rightLabel}`; used: Dashboard month-compare slot, gallery.
- **Sunburst** — two-ring nested radial: inner = parent categories, outer = children proportioned within the parent arc; props `{data:[{label,color,children:[{label,value,color}]}]}`; used: Dashboard nested-allocation slot, gallery.
- **Dumbbell** — was→now dot pairs per row (max 8), green connector when decreasing (good for debt), red when increasing; props `{data:[{label,a,b,color}], leftLabel, rightLabel}`; used: Dashboard debt-progress slot, gallery.

## 6. Client field dictionary (source: `mk()`/`mig()` in `src/utils/finance.js`)

> Every client record passes through `mig()` on load — it back-fills missing keys with
> `mk()` defaults, so the shapes below are guaranteed at runtime. Ids come from
> `gid() = Date.now()+random` (numbers, not uuids). **Money math laws:** every currency
> field is a plain number (USD; `fmt` renders 0 decimals); every `apr`/`rate` is an
> ANNUAL percent (28 = 28%, monthly = apr/100/12); every `freq` ∈
> `{weekly, biweekly, semimonthly, monthly2, annual}` — monthly is spelled **`monthly2`**
> (legacy name; do not "fix" it). Validation helpers: `vEmail`, `fmtPh` (10-digit US),
> `fmtSSN`, `bE` (blocks e/E/+/− in number inputs).

**Identity & contact** — edited via ClientForm / ProfileModal / intake form; portal-editable per `docs/CLIENT-PORTAL-EDIT-ALLOWLIST.md` (contact only, Option A):
- `id` num — system id, never edited. `firstName`/`lastName` str. `partnerFirst`/`partnerLast` str|null — null ⇒ single (p2 surfaces hidden).
- `email`, `phone`, `address`, `dob` str — primary contact. `social` str — SSN; **NEVER leaves the server in the portal (§2)**.
- `p1Phone/p1Email/p1Dob/p1Social` + `p2*` str — per-person variants (intake captures both partners).
- `clientType` `"financeOnly"|"financeAndHealth"` — service scope; advisor-only. `recommendedBy` str — referral; advisor-only, never in portal.
- `color1` (#4472C4) / `color2` (#ED7D31) — person tag colors used by PTag/charts.

**Income** — IncomeModal/IncomeSection: `incomeStreams[]` `{id, person:"p1"|"p2", label, gross, net, freq}` — gross/net are per-`freq` amounts; all metrics use `toM()` monthly normalization (§3).

**Bills** — BillModal/BillsSection: `bills[]` `{id, name, assignedTo:"p1"|"p2"|"joint", dueDay(1-31), cost, type:"regular"|"temporary"|"annual", freq, split:{p1,p2}}` — `split` = % shares (mig defaults 50/50); `maturity` (date) ends a temporary bill; `dueMonth` (1-12) scopes an annual bill; activity rule = `actB` (§3).

**Cards (revolving debt)** — CardModal/DebtSection: `cards[]` `{id, name, balance, apr, min, limit, owedBy:"p1"|"p2"|"joint", dueDay, promos:[]}` — `min` is the stated minimum (`effectiveMin` floors $25 and caps at balance); `promos[]` `{id, label, balance, rate, end(date)}` accrue at their own rate (§3 cardMoInt). `migrateCard` converts legacy single `promo*` fields into `promos[]`.

**Loans (installment debt)** — LoanModal/LoansSection: `loans[]` `{id, name, type:vehicle|student|personal|mortgage|business|other (LOAN_META), balance, owner, apr, term?, linkedAssetId?}` — loans with `linkedAssetId` are auto-managed by `syncAssetLoans` from physical-asset debt; loan *payments* live in bills, only card mins count in `sumMin`.

**Accounts (financial assets)** — AccountModal/AccountsSection, `mkAcct` factory: `accounts[]` `{id, name, type, value, owner}` — `type` ∈ ACCT_META: `checking/savings/money_market` are `liquid:true` (count toward EF + currentRatio); `retirement/ira/brokerage` are `invest:true` (NOT liquid); `other`. Legacy `vehicle`/`realEstate` account types are migrated out to customAssets; legacy `investment` → `brokerage`.

**Physical assets** — AssetModal/CustomAssetsSection: `customAssets[]` `{id, name, value, desc, cat ∈ PHYS_CATS (Real Estate|Vehicle|Precious Metals|Business|Collectible|Other), currentDebt?, debtApr?}` — `currentDebt > 0` spawns/updates a linked loan named "{name} (Asset Debt)" via `syncAssetLoans`. `properties[]` is the newer alias — `getProperties(c)` prefers `properties`, falls back to `customAssets`; totalA counts properties-or-customAssets once, never both.

**Market investments** — MarketInvestmentModal: `marketInvestments[]` `{id, ticker (required, uppercased), name (required), value, cat ("US Large Cap"…"Crypto"|"Individual Stock"|"Investment"), shares, costBasis}` — `value` counts in totalA; not liquid.

**Goals & notes** — NotesSection: `notes` `{shortTerm, midTerm, longTerm, goals, setbacks, general}` str — portal sees ONLY goals/shortTerm/midTerm/longTerm; **setbacks + general are advisor-private (§2 sanitize)**.

**Plan & allocation** — SavingsSection / FinancialPlanTab / InvestmentsTab:
- `alloc` `{stocks,retirement,realEstate,savings,vacation,other,debtRepayment}` — % split of leftover cash, defaults 25/15/15/15/5/5/20.
- `committed` — same keys, booleans (advisor marks an allocation as committed).
- `savedPortfolio` null|obj, `portfolioCustom` `{holdings:[], overrides:{}, rates:{}}`, `savedCalcs:[]`, `savedCompare:null` — saved advisor work artifacts; exact inner shapes are defined by their save flows (Portfolio/Compare/Calculators report blocks), not by `mk()`.
- Runtime-added keys (absent from `mk()`, appear after first touch, advisor-set): `servicePlan` (ClientForm), `planStrategy` + `planOverrides` (FinancialPlanTab), `reportInclude` (report section toggles).

**History** — Monthly tab save / BulkSnapModal; **client never edits (read-only law, allowlist doc)**: `monthSnapshots[]` month-record shape:
`{label:"Mon YYYY", year, month(1-12), income, bills, debt, savings, cashFlow, savedAt(ISO), previousVersions:[], data:null|object}`
— income/bills/debt/savings/cashFlow are MONTHLY totals frozen at save time (the live formulas in §3 produce them); `data` holds an optional full client deep-copy for the detail view (null ⇒ summary-only, NoDataMsg renders); `previousVersions[]` keeps overwritten saves.

**Per-client flags** — Settings-ish, advisor-set:
- `efMonths` num, default 3 — emergency-fund target multiplier (§3).
- `currentMonthLabel` str (e.g. "May 2026") — the working month shown in MonthSelector.
- `archived` bool — moves the client to ArchivedSection.
- `hideNumbers` bool — blurs all money values for this client (FH component).
