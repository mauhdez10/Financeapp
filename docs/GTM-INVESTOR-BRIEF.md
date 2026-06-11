# GTM — Investor Brief

> Audience: prospective angel / pre-seed investors. Honest by design: live product,
> pre-revenue/early. No invented metrics — placeholders are marked [OWNER: fill].
> US-based today; the model and the demographic are not US-limited.

---

## 1. The problem — a large segment no one actually serves

US Hispanic families are systematically underserved by every category of financial
product (full sourcing in `docs/DIFFERENTIATION-IDEAS.md`):

- **Mainstream budgeting apps are English-only.** Monarch, YNAB, and Albert ship no
  Spanish product. Origin is $12.99/mo, English-first, with $119/session CFP calls.
- **Human advice is priced for the mass-affluent.** Facet starts at ~$2,350/yr.
  Traditional advisors won't take small accounts.
- **The two LatinX fintechs each cover half the picture.** SUMA Wealth (~1M users,
  $12.1M raised) has culture-aware content and AI coaches but no human advisor
  relationship, no insurance arm, no CRM. Finhabits is a Spanish-first robo-advisor —
  investing rails, not coaching — and notably cross-sells health insurance because
  that's what its users ask for.
- **Nonprofit credit counseling is free but transactional** — one-off debt plans,
  inconsistent Spanish coverage, no ongoing relationship or app.
- **The structural gap is documented:** Hispanic unbanked rate ~8.4% vs 1.7% for white
  households; the typical white family holds ~5× the wealth of the typical Hispanic
  family; language is a documented barrier to seeking financial services (Fed 2025,
  Synchrony, CFP Board 2025).

The segment is large, loyal, word-of-mouth-driven — and structurally ignored because
serving it requires bilingual humans plus low price points, which neither VC-scale
robo-apps nor traditional advisories can deliver.

## 2. The solution — and what exists today (honest state)

**Golden Anchor Finance**: a bilingual (EN/ES) self-serve money app **plus** a real
bilingual human advisor **plus** licensed insurance advisory, in one product. The
combination — app + human + insurance license + vetted referral network + choose-your-
price — is a position no competitor occupies (SUMA has no human/insurance; Finhabits
has no coaching; Origin/Facet have no Spanish and no low-income price point).

**Live in production** (finance.goldenanchor.life, daily use by the founding practice):

- Full advisor CRM: clients, profiles, reports with charts, month-to-month comparison,
  PDF generation, intake invites, secure share portals
- Client accounts with role isolation, email verification, plain-language onboarding
  wizard (with insurance-interest lead capture), Free/Premium gating
- Choose-your-price Premium with Stripe checkout + payment webhook (auto-activation),
  payment links for the full service catalog, promo-code mechanics
- 9 public calculators, learning resources, a researched useful-links directory
  (147 links, 16 categories), public marketing site — everything bilingual, dual-theme,
  mobile-first
- Admin members console with MRR readout and complimentary-grant tooling

**Honest stage:** pre-revenue / first-dollar stage. The platform launched its
self-serve tiers in June 2026; the Stripe audit at realignment found zero active
subscriptions — revenue counters effectively start now. Current users: the founding
practice and early test clients. [OWNER: fill current client/account counts and any
insurance-commission revenue run-rate.]

**Founder:** Mauricio Hernandez — MBA, FPWMP, licensed FL Life & Health agent
(#FL0215), bilingual, Miami-based, building for the community he is from and sells to.

## 3. Business model — four stacked revenue lines

| Line | Mechanics | Status |
|---|---|---|
| **Subscriptions** | Premium: choose-your-price, $3/mo floor (suggested $3/$10/$20 — pay-what-you-want converts mission into margin at near-zero marginal cost). Advisor plans: Monthly Lite $49/mo, Lite+ $79/mo. | Live (Stripe products + webhook) |
| **Services à la carte** | Financial Checkup $149 · Strategy Session $129 · Quarterly Review $199 · Annual Bundle $499/yr. | Live (payment links) |
| **Insurance commissions** | Free consultation is the acquisition hook; carrier-paid commissions on placed life/health policies. Zero CAC overlap — the coaching relationship surfaces the need honestly. | Live (founder's existing practice) |
| **Per-seat advisor SaaS — the ceiling** | "Advisor-in-a-Box": productize the entire stack (branded portal, CRM, reports, intake, Stripe links, referral page) for the thousands of bilingual agents and coaches who have none of it. Planned $49–99/agent/mo. This converts a practice into a platform: **the operating system for bilingual financial coaches.** | Roadmap (architecture already per-advisor) |

Future expansion validated by analogues: employer-paid financial wellness for small
Hispanic-owned businesses (SmartDollar proved the B2B2C channel; nobody runs it
bilingually) and a remittance-aware planning layer as the LatAm bridge — planning
around money flows, never moving money (no transmitter licensing, ever).

## 4. Moat

1. **Regulatory positioning as strategy (D-17):** educational coaching, never
   investment advice, never money movement. No RIA registration burden, no
   money-transmitter exposure — competitors crossing into the segment with investing
   products carry compliance costs Golden Anchor structurally avoids. Counsel-reviewed
   disclaimers, ToS, and engagement letter are in place.
2. **The human + license combo is hard to copy.** An app can be cloned; a trusted
   bilingual licensed advisor with a community reputation cannot. The insurance license
   monetizes trust without charging the family.
3. **Trust infrastructure for a low-trust market:** vetted, per-contact-disclosed
   referral directory (anti-notario-fraud positioning), no bank-credential asks, no
   dark patterns — deliberate product choices that match how this demographic actually
   adopts financial tools.
4. **Bilingual depth, not translation:** every screen, report, calculator, and document
   is built EN/ES from day one (1,100+ translation keys), with a simple-mode roadmap
   for older/low-tech users. Retrofitting this onto an English-first codebase is a
   multi-year tax competitors won't pay for a segment they undervalue.
5. **Compounding data/content:** the benefits-navigator + useful-links directory is an
   SEO/acquisition asset that compounds monthly; the advisor's coaching corpus becomes
   training data for a differentiated AI assist later (backstage, never the headline).

## 5. Roadmap (next 12 months, sequenced — detail in DIFFERENTIATION-IDEAS §3)

1. **Public bilingual Life-Situations navigator + benefits-eligibility screener** —
   acquisition engine; "we found you $X/yr in benefits" as the testimonial machine.
2. **WhatsApp coaching channel** — meet the demographic where it lives; the retention
   lever for subscription revenue.
3. **Referral network v2** — vetted + per-contact disclosure; the compliant revenue
   surface future advisors plug into.
4. **Simple Mode + family co-pilot** — adult child manages a parent's profile with
   consent; rides the account-linking architecture now in development.
5. **Advisor-in-a-Box pilot** — 2–3 bilingual agents on per-seat pricing once 1–4
   prove the client experience. This is the venture-scale story: not another budgeting
   app — the advisor OS for a market the incumbents can't enter cheaply.

## 6. The ask

[OWNER: fill — amount raising, instrument (SAFE/priced), valuation cap, use of funds
(suggested buckets: founder full-time transition, advisor-pilot build-out, content/SEO
engine, WhatsApp infrastructure, compliance counsel), runway target, and any committed
checks or advisors already on board.]

**Contact:** Mauricio Hernandez — [OWNER: fill investor-contact email / deck link]

---

*Internal note: keep every claim here synced with docs/DIFFERENTIATION-IDEAS.md (market
data + sources), docs/PRICING-AUDIT.md §4 (pricing truth), and AGENT.md D-13/D-13b/D-17.
Update the "honest state" section as real metrics accrue — never let it overstate.*
