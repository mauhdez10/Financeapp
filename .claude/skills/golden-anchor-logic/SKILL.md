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

## 4. Calculators bucket — staged (next session)

The 9 standalone calculators (Retirement, Portfolio, Home Equity, Income, Debt Reduction,
Car Loan, Affordability, Interest, High-Yield Savings) get the same treatment: inputs ·
formula/method · assumptions (rates, compounding) · outputs · edge cases · plain-English
why. **Do it while extracting them to `src/components/calculators/`** (ARCHITECTURE-PLAN
Phase 1b) — document each calc as it moves. They share `payM`/`mthPmt`/compound-growth
math above; portfolio defaults live in `src/constants/meta.js` (`DEF_PORT_RATES`:
conservative 5.5% / growth 8.5% / aggressive 11.0%; `PORTFOLIOS` holdings).

## 5. Chart & field buckets — staged

- Charts: what each of the 23 components in `src/components/charts.jsx` derives and the
  one-line takeaway (for captions/tooltips). Stage with the chart-grammar work
  (DESIGN-POLISH-PUNCHLIST item 20).
- Field dictionary: every client field + validation (source: `mk()` in utils/finance.js +
  `docs/CLIENT-PORTAL-EDIT-ALLOWLIST.md`).
