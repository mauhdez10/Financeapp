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
> ⚠️ **Known quirk (surface to owner before "fixing"):** InterestCalc's compound-frequency
> selector (Monthly/Quarterly/Annual) is decorative — the math always compounds monthly.

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
- **Method:** compound: FV = `P·(1+r/12)^(y×12) + monthly·((1+r/12)^(y×12)−1)/(r/12)`; simple: FV = P·(1+r·y) (contributions ignored in simple mode). Real value = total/(1.03)^years.
- **Assumptions:** always monthly compounding in compound mode (the frequency dropdown is not wired); 3% inflation for real value.
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

## 5. Chart & field buckets — staged

- Charts: what each of the 23 components in `src/components/charts.jsx` derives and the
  one-line takeaway (for captions/tooltips). Stage with the chart-grammar work
  (DESIGN-POLISH-PUNCHLIST item 20).
- Field dictionary: every client field + validation (source: `mk()` in utils/finance.js +
  `docs/CLIENT-PORTAL-EDIT-ALLOWLIST.md`).
