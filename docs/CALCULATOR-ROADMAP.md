# Calculator Roadmap — gap analysis, additions, and hub layout fix

> Created 2026-06-11. Audit of the public Calculators page (`src/components/calculators.jsx`,
> `CalculatorsPage`) against the US personal-finance calculator market, scoped to Golden
> Anchor's actual audience: **low-income families + older low-tech users, bilingual EN/ES**.
> Owner complaint driving this: the page "feels unfinished — a lot of blank space… not well
> thought out."
>
> Rules that bind every item below: **D-3** (every new string in BOTH `T.en` and `T.es`),
> formulas documented in `.claude/skills/golden-anchor-logic/SKILL.md §4` **in the same change**
> that ships them, charts from the existing pure-SVG catalog (§5) or Recharts (D-8), build with
> the `primitives.jsx` kit (`CalcRow`, `Field`, `Row2`, `NumInp`, `MaskedNumInp`, `Tog`, `Pill`,
> `SHdr`) + `mCARD`/`ga-spot`/`ga-lift` styling.

---

## 1. What we have today (the real 9)

Verified from `CalculatorsPage` + logic skill §4 (2026-06-11, v0.72.3). Note this list
differs from older notes — there is **no standalone Budget, Emergency-fund, Savings-goal, or
Net-worth calculator**; those exist only as *client-profile* metrics (§3 of the logic skill),
invisible to a visitor who just wants a quick answer.

| # | Calculator | Category on page | What it covers |
|---|---|---|---|
| 1 | Retirement Planner | Plan & grow | FV with employer match, 3 market scenarios, 4% rule |
| 2 | Portfolio Calculator | Plan & grow | FV of Conservative/Growth/Aggressive portfolios, inflation overlay |
| 3 | High-Yield Savings | Plan & grow | FV at an APY with monthly deposits |
| 4 | Interest Calculator | Plan & grow | Compound (12/4/1 per yr) vs simple, inflation-adjusted |
| 5 | Debt Reduction | Tackle debt | Single-card payoff months + CC-vs-personal-loan consolidation compare |
| 6 | Car Loan | Tackle debt | Real payment w/ tax, fees, trade-in, rebate; amortization |
| 7 | Home Calculator | Home & affordability | 4 tabs: equity/HELOC, refinance break-even, amortization, equity projection |
| 8 | Affordability | Home & affordability | Max home price from income/DTI, full PITI |
| 9 | Income Calculator | Income | Take-home paycheck: 2025 federal brackets, FICA, flat state, pre/post-tax |

**The blank-space problem, diagnosed:** 9 cards split across 4 category rows inside a
1100px container with `repeat(auto-fill, minmax(260px,1fr))`. "Tackle debt" and
"Home & affordability" rows hold 2 cards (~40% of the row is empty rule-line), and
"Income" is a **single orphan card on its own row** — roughly two-thirds of the lower
half of the page is divider lines and whitespace. The page also ends after ~600px of
content with no footer block, CTA, or supporting copy. It reads unfinished because,
structurally, it is.

---

## 2. Gap analysis vs the market

Sources surveyed 2026-06-11:
[Bankrate calculator hub](https://www.bankrate.com/calculators/) ·
[Bankrate credit-card calculators](https://www.bankrate.com/credit-cards/tools/calculators/) ·
[Bankrate loan calculators](https://www.bankrate.com/loans/calculators/) ·
[Bankrate savings calculators](https://www.bankrate.com/banking/calculators/) ·
[NerdWallet calculator hub](https://www.nerdwallet.com/finance/calculators) ·
[NerdWallet budget calculator](https://www.nerdwallet.com/finance/calculators/nerdwallet-budget-calculator) ·
[NerdWallet investing calculators](https://www.nerdwallet.com/investing/calculators) ·
[Calculator.net financial index](https://www.calculator.net/financial-calculator.html) ·
[Origin Financial](https://useorigin.com/) ([forecasting](https://useorigin.com/products/forecasting), [spending](https://useorigin.com/products/spending)).

**What each competitor's catalog looks like:**

- **Bankrate** — 11 categories, ~50+ tools. Beyond ours: credit-card payoff / minimum-payment /
  balance-transfer / credit-utilization, personal & student loan, auto **lease-vs-buy** and
  payoff, down-payment, **rent-vs-buy**, savings-goal, college-savings, CD/CD-ladder,
  net-worth, cost-of-living, insurance (annuity, car, home).
- **NerdWallet** — 12 categories. Beyond ours: **monthly budget (50/30/20)** — their flagship
  entry tool, "debt-free date", CC payoff, 401(k), Roth IRA, **Social Security benefits**,
  **inflation**, closing costs, refinance, rent-vs-buy, cost-of-living, **life-insurance
  needs** (under Insurance), 8 tax tools.
- **Calculator.net** — the exhaustive index (~70 financial tools): everything above plus
  DTI, **take-home paycheck**, **currency**, **sales tax**, debt-consolidation, college cost,
  budget, commission. Useful as a completeness ceiling, not a UX model.
- **Origin Financial** — deliberately the opposite: no public calculator hub at all; budgeting/
  forecasting are *embedded, account-connected planning tools*. That is what our advisor-side
  client profile already is. The takeaway from Origin is aesthetic (airy, glassy, preview-rich
  tiles — already our north star per the modern-aesthetic memory), not catalog.

**Gap map — market staples we're missing, filtered for THIS audience:**

| Market staple | Bankrate | NerdWallet | Calc.net | Us | Relevance to low-income / older / EN-ES users |
|---|:-:|:-:|:-:|:-:|---|
| Budget split (50/30/20) | — | ✅ flagship | ✅ | ❌ | **Highest** — the first tool a coaching client needs |
| Credit-card payoff (multi-card, avalanche/snowball) | ✅ | ✅ | ✅ | ⚠️ single card only | **Highest** — CC debt is the #1 pain point |
| Emergency fund | partial | ✅ | — | ❌ public (✅ in client profile) | **Highest** — core of the coaching pitch |
| Life-insurance needs | — | ✅ | ✅ | ❌ | **Highest** — we SELL insurance consults |
| Inflation / purchasing power | ✅ | ✅ | ✅ | ⚠️ buried as 3% overlay | High — explains "why save at all" to skeptics |
| Savings goal ("when do I hit $X") | ✅ | ✅ | ✅ | ❌ (we only do forward FV) | High — goal-first framing fits coaching |
| Social Security claiming age | — | ✅ | ✅ | ❌ | High — *the* decision for the older segment |
| Rent vs buy | ✅ | ✅ | ✅ | ❌ | High — most of this audience rents |
| Remittance / money-transfer cost | — | — | ⚠️ currency only | ❌ | High — bilingual immigrant families send money home; **near-zero competition** |
| Debt-vs-invest tradeoff (incl. 401k match) | — | ⚠️ articles | — | ❌ | Medium — classic coaching question |
| College savings / 529 | ✅ | ✅ | ✅ | ❌ | Medium |
| Auto affordability ("how much car") | ✅ (lease-vs-buy) | ✅ | ✅ | ⚠️ payment only | Medium |
| Net worth (public quickie) | ✅ | ✅ | — | ❌ public | Medium — teaser for the full profile |
| Tip & sales-tax quickie | — | — | ✅ | ❌ | Low-effort daily-life hook for low-tech users |
| Tax withholding (W-4), Roth IRA, CD ladder, closing costs | ✅/— | ✅ | ✅ | ❌ | Low for this audience — skip for now |

Where we're already **at or above** market: paycheck/take-home (IncomeCalc rivals
NerdWallet's), home equity/refi/amortization (4-in-1 beats most), car-loan realism
(taxes+fees+trade-in), portfolio scenarios with inflation overlay.

---

## 3. Recommended additions (12), prioritized

Effort scale: **S** = one afternoon with the existing kit (CalcRow/NumInp + an existing chart);
**M** = new interaction or iteration loop, ~1 day; **L** = multi-tab or data-table heavy.
Every item: add EN+ES strings (D-3), a card description, an icon, a category slot, and a §4
entry in the logic skill.

### P1 — ship these to make the page feel complete (all reuse existing math/charts)

**1. Credit-Card Payoff — avalanche vs snowball (multi-card)** — Effort **M**
- *Inputs:* up to ~6 cards `{name, balance, APR, min payment}`, extra monthly $, strategy
  toggle (Avalanche = highest APR first / Snowball = smallest balance first).
- *Approach:* iterate monthly per card — interest `bal·apr/1200`, pay mins, pour extra into
  the strategy-ordered target; the `PayoffProgression` chart already simulates avalanche-order
  extra (§5) — add a sort-comparator prop for snowball. Output: debt-free date, total
  interest per strategy, side-by-side verdict ("Snowball costs $X more but first card dies
  in N months").
- *Why this audience:* multi-card revolving debt is the defining problem; the snowball's
  motivational framing is exactly coaching language. Bankrate and NerdWallet both lead their
  debt sections with this; our current DebtReductionCalc handles only one card.

**2. Life-Insurance Needs (DIME)** — Effort **S**
- *Inputs:* annual income, years to replace (slider 5–30), total debts, mortgage balance,
  number of children × education cost each, existing coverage, liquid savings.
- *Approach:* DIME — Need = **D**ebt + **I**ncome×years + **M**ortgage + **E**ducation −
  (existing coverage + savings). Pure arithmetic; render the composition as a `Donut` and the
  gap as a headline number.
- *Why:* **we sell insurance-advisory consults** (`clientType: financeAndHealth`) — this is
  the one calculator that converts a visitor into a booked consult. End the result card with
  a CTA → Pricing/contact. NerdWallet has it; Bankrate doesn't. Natural, non-pushy lead-in.

**3. Budget Splitter (50/30/20)** — Effort **S**
- *Inputs:* monthly take-home pay; optional custom split sliders (needs/wants/savings, must
  sum to 100).
- *Approach:* multiply. `needs = net×0.50` etc.; `Donut` + three big numbers; one line of
  coaching copy per bucket. Link the "take-home" input to "don't know it? → Income Calculator".
- *Why:* the single most-searched entry-level tool (NerdWallet's flagship); zero-intimidation
  for low-tech users; it's the first exercise of any coaching engagement anyway.

**4. Emergency-Fund Calculator** — Effort **S**
- *Inputs:* essential monthly bills, months of cushion (3–6 slider, default 3), current
  savings, monthly contribution, optional APY.
- *Approach:* the formula is already canonical (logic skill §3): target = `bills × months`;
  gap = target − saved; months-to-goal = solve the SavingsCalc FV for the target (or simple
  `gap/monthly` at 0%). `RadialGauge` for progress (it already renders the EF gauge in the
  share portal) + a goal-line chart.
- *Why:* emergency fund is the core of Golden Anchor's coaching model — embarrassing that the
  public page lacks it while the client profile computes it. Pure reuse.

**5. Inflation / Purchasing Power** — Effort **S**
- *Inputs:* amount, years, inflation rate (default 3%, editable), direction toggle ("what
  will $X buy in N years" / "what would $X from N years ago need to be today").
- *Approach:* `value/(1+i)^y` and `value·(1+i)^y`. We already hardcode the 3% deflator in
  two calculators — this just gives it its own front door. `Sparkline`/area decay chart.
- *Why:* older users feel inflation viscerally ("coffee used to cost…") — this is the tool
  that makes the case for the other eight. Trivially bilingual.

### P2 — round out the catalog (next sprint)

**6. Savings-Goal Timeline ("when do I reach $X?")** — Effort **S**
- *Inputs:* goal amount, current saved, monthly deposit, APY.
- *Approach:* inverse of SavingsCalc — solve months: `n = ln((goal·r+m)/(saved·r+m))/ln(1+r)`
  (r = APY/1200, m = monthly); show date, then "add $50/mo → N months sooner" sensitivity rows.
- *Why:* goal-first framing ("quinceañera, used car, deposit") fits coaching better than
  abstract FV; Bankrate/NerdWallet/Calculator.net all have it.

**7. Social Security Claiming Age** — Effort **M**
- *Inputs:* birth year (→ FRA from the SSA table), estimated monthly benefit at FRA (from the
  user's SSA statement), claim-age slider 62–70, optional life expectancy.
- *Approach:* early reduction 5/9% per month for the first 36 months before FRA, 5/12%
  beyond; delayed credits 8%/yr to 70. Output monthly benefit at each age + cumulative
  lifetime crossover chart (`SlopeGraph` or a two-line chart) — "claiming at 70 beats 62
  if you live past ~80".
- *Why:* the single biggest financial decision for the older low-tech segment, and almost no
  one explains it in Spanish. Mark clearly as estimate; link to ssa.gov.

**8. Rent vs Buy** — Effort **L**
- *Inputs:* rent + annual rent growth %, home price, down %, APR, term, property tax %,
  insurance, maintenance %/yr, appreciation %/yr, horizon (years), selling costs %.
- *Approach:* iterate yearly — renting cost = Σ growing rent; owning cost = Σ PITI +
  maintenance − (equity built + appreciation − selling costs). Reuse `mthPmt` + the
  HomeEquityCalc projection loop. Output: break-even year + dual-line chart.
- *Why:* most of this audience rents and is told "renting is throwing money away" — an
  honest break-even tool is genuine coaching. All three competitors have it.

**9. Remittance / Money-Transfer Cost** — Effort **S** ⭐ differentiator
- *Inputs:* amount to send, transfer fee, provider's exchange rate, mid-market rate (two
  fields with a help note: "compare your app's rate to the Google rate").
- *Approach:* true cost = fee + amount×(1 − provider/midmarket); output what actually
  arrives, effective cost %, and "sending $X monthly, that's $Y/yr". No live FX feed needed —
  user types both rates.
- *Why:* bilingual immigrant families send money home weekly; **none of the big three US hubs
  has this tool** — a genuinely ownable, audience-true feature that signals "this site is
  for you" to the ES audience.

**10. Debt vs Invest (incl. 401k match)** — Effort **S/M**
- *Inputs:* extra monthly $, debt APR, expected investment return (reuse `DEF_PORT_RATES`
  presets), employer match % + limit, horizon.
- *Approach:* rule-engine + projection: (1) always capture the match — that's a 50–100%
  instant return; (2) then compare debt APR vs expected return: FV of investing the extra vs
  interest saved by prepaying (reuse `payM` delta). Verdict sentence + two-bar comparison.
- *Why:* the classic coaching question, asked in every session; framing it as guided rules
  (match → high-APR debt → invest) is exactly the advisor's pitch, automated.

### P3 — nice-to-have / daily-life hooks

**11. Tip & Sales-Tax Quickie** — Effort **S**
- *Inputs:* bill amount, tip % (big 15/18/20/25 buttons), split-between-N, sales-tax %
  (default 7% FL, editable).
- *Approach:* multiplication; oversized type and buttons (older-user friendly), works great
  on mobile. Could double as the page's "try one now" embedded teaser (see §4).
- *Why:* zero financial-literacy barrier; makes the hub a daily-use bookmark, not a
  once-a-year visit.

**12. Auto Affordability ("how much car?")** — Effort **S**
- *Inputs:* monthly take-home, target payment % (10–15% slider), down payment, APR, term.
- *Approach:* budget payment = net×pct; max financed = present value of that annuity
  (inverse `mthPmt`, same trick AffordabilityCalc uses); max sticker ≈ financed + down,
  back out tax/fees with the CarLoanCalc constants. Cross-link: "now price a specific car →
  Car Loan".
- *Why:* low-income buyers get upsold at the dealership; CarLoanCalc answers "what does THIS
  car cost" but not "what SHOULD I spend". Completes the pair (mirrors home Affordability).

**Considered and deliberately skipped (for now):** Roth-IRA/401(k)-specific calculators
(RetirementCalc already covers match + scenarios; IRA tax nuance overserves this audience),
W-4 withholding (IRS estimator is canonical and IncomeCalc covers take-home), CD ladder,
closing costs, cost-of-living move, small-business tools (wrong audience), net-worth quickie
(better served by the real client profile — make signup the CTA instead).

**Resulting category map** (also fixes the orphan-row problem — every section gets ≥3 cards):

| Category | Cards after P1+P2 |
|---|---|
| Plan & grow | Retirement, Portfolio, HY Savings, Interest, **Savings Goal**, **Inflation** |
| Tackle debt | Debt Reduction, **CC Payoff (avalanche/snowball)**, **Debt vs Invest**, Car Loan, *(P3: Auto Affordability)* |
| Home & affordability | Home Calculator, Affordability, **Rent vs Buy** |
| Income & everyday | Income Calculator, **Budget 50/30/20**, **Remittance Cost**, *(P3: Tip & Tax)* |
| Protect & plan ahead *(new)* | **Emergency Fund**, **Life Insurance Needs**, **Social Security Age** |

---

## 4. Hub layout — fixing the blank space

How the competitors structure their hubs (fetched 2026-06-11):
- **Bankrate**: a featured row of 4 icon tools up top, then 11 category sections, each showing
  only its 3–4 best tools with a "see all" arrow. Curated showcase.
- **NerdWallet**: flat categorized link index — complete but visually plain; their actual
  calculator *pages* are the strong part: two-column, inputs left, **sticky live results
  panel right**, results update as you type.
- **Calculator.net**: pure index, six headings of bulleted links. Completeness over beauty —
  not our model.
- **Origin**: no hub; tools are embedded, preview-rich tiles inside the product. Aesthetic
  reference only.

Three concrete options on our token system (`mCARD(th)`, `ga-spot` spotlight glow, `ga-lift`,
`th.accent` chips, JetBrains Mono eyebrows):

**Option A — Featured row + dense merged categories (Bankrate pattern)**
Top: a 3-card "Start here" featured row — larger spotlight cards (`mCARD` + `ga-spot`,
~2× height) for Budget, CC Payoff, Life Insurance, each showing one live default-input
result number (e.g. "“$5,000 at 28% APR paying $200 → 32 months”") so the card *previews*
the answer. Below: the category sections kept, but grid tightened to `minmax(230px,1fr)`
and categories merged per the §3 map so every row holds 3+ cards. Footer: a full-width
`mCARD` CTA band — "Want this done with your real numbers? Create a free account / book a
consult." Cost: small CSS + copy change; works at 9 calculators *today*, scales to 21.

**Option B — Sticky category rail + continuous grid (hub) and two-column sticky results (detail)**
Hub becomes two-column: a slim sticky left rail (category anchors, mono-eyebrow styling)
beside one continuous card grid — no per-category row breaks, so no orphan rows ever.
Each calculator detail page adopts the NerdWallet pattern: inputs in a left `mCARD`, a
**sticky right results card** (headline number + chart) replacing today's single
`maxWidth:900` column. Best long-term UX; biggest lift (every calc's internal layout
touched; sticky needs the D-27 mobile fallback of stacking results above inputs).

**Option C — Bento grid with live mini-previews (Origin aesthetic)**
One uncategorized bento: flagship calcs get 2×1 tiles with an embedded `Sparkline`/`Donut`
rendered from default inputs (the charts are pure SVG and cheap), small calcs get 1×1
tiles with icon + description; category expressed as a small accent-colored chip on each
tile instead of row headers. Most visually striking and most on-brand with the
glassy/airy memory — but category chips scan worse than sections for low-tech users, and
default-input previews on 14+ tiles need a perf/clutter pass.

**Pick: Option A now, adopting Option B's sticky-results detail layout as a follow-up.**
A directly kills the blank-space complaint this week with near-zero structural risk, gives
the page a "front door" (featured row + CTA band = the missing top and bottom that make it
feel finished), and is the layout that gracefully absorbs the P1/P2 additions. B's
two-column detail pages are the right second step once the catalog justifies the rework;
C's bento sacrifices the category scanning that the older low-tech segment relies on.

---

## 5. Sequencing summary

1. **Layout Option A** + P1 calcs 2–5 (all S-effort) — one sprint; page goes from 9 sparse
   cards to 13 cards, featured row, CTA band. Feels finished.
2. P1 #1 (multi-card payoff, M) — the flagship debt tool, promoted into the featured row.
3. P2 (6, 7, 9, 10 then 8) — Remittance (#9) early: cheap and a genuine ES-market
   differentiator. Rent-vs-Buy (#8) last, it's the only L.
4. Option B sticky-results detail layout as part of the professional design pass already in
   the sprint queue (CLAUDE.md pending item 1).
5. P3 quickies as filler tasks; consider embedding Tip & Tax inline on the hub as a
   "try one right now" widget.

Per-calc checklist when building: EN+ES keys (D-3) · icon + DESCS entry + CATS slot ·
logic-skill §4 entry in the same change · `npm run build` · both-language smoke test.
