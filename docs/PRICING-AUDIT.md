# Pricing & Plans Audit — 2026-06-11

> Requested by Mauricio before wiring client-account billing: "check the prices and what
> they offer, full audit, make sure plans are not duplicated — e.g. two initiation
> packages for two different clients should be one with a discount code."
>
> Sources compared: **(1)** the locked business pricing in AGENT.md **D-13** (year-1 plan),
> **(2)** the shipped in-app catalog (`SVCS` in `src/constants/meta.js` + `PLAN_FEATURES`
> in `src/pages/marketing.jsx`), **(3)** the Stripe payment links in
> `DEF_SETTINGS.stripeLinks`. ⚠️ The live Stripe **dashboard** could not be read (only a
> test-mode key is on file; the MCP was disconnected) — verifying the actual Stripe
> product prices against this table is the one remaining manual step (5 min in the
> dashboard, or drop the live restricted key in the credentials file and I'll do it).

## 1. Three-way comparison

| Service (app id) | D-13 locked plan | In-app catalog (what clients see) | Stripe link configured? |
|---|---|---|---|
| Initial Financial Checkup (`initial-checkup`) | **$149** (reg $249 strike) | **$149** | ✅ |
| Checkup — GA Client (`client-checkup`) | *(not in D-13)* | **$99** | ✅ |
| Quarterly Review (`quarterly-review`) | **$99** per checkup | **$199** ⚠️ | ✅ |
| Strategy Session (`strategy-session`) | **$99** (Home/Job), **$79** (Car) | **$129** flat ⚠️ | ✅ |
| Monthly Lite (`monthly-lite`) | **$29/mo** | **$49/mo** ⚠️ | ✅ |
| Monthly Lite+ (`monthly-lite-plus`) | *(not in D-13)* | **$79/mo** | ✅ |
| Annual Bundle (`annual-bundle`) | **$299** (save $97 on 4 quarterlies) | **$499/yr** ⚠️ | ✅ |
| Insurance Advisory (`insurance-consult`) | Free consult | Free | — (by design) |
| Donation (`donation`) | *(not in D-13)* | Any amount | ✅ |

## 2. Findings

**F1 — THE DUPLICATE INITIATION (your example).** `initial-checkup` ($149, "full snapshot
review") and `client-checkup` ($99, "returning-client snapshot review… tracks progress
against previous plan") are the same service differentiated only by who's buying.
**Recommendation:** merge into ONE "Financial Checkup — $149" product and give existing
clients a **discount code** (e.g. `GACLIENT50` → $50 off ⇒ $99 net; same mechanic as the
existing `REFERRED25` in D-15). One product, one price, codes carry the relationships.
Stripe payment links support promo codes natively (enable "Allow promotion codes" on the
link). App change after you confirm: drop `client-checkup` from SVCS + its link, surface
the code in the returning-client flow.

**F2 — PRICE DRIFT between the locked plan and the shipped catalog (4 services).**
Quarterly $99→$199, Strategy $99/79→$129, Lite $29→$49, Annual $299→$499. Either the
business plan moved on (likely — catalog prices look like the current intent) and **D-13
needs re-locking at the new numbers**, or the app is overcharging vs. plan. ⚠️ Also note
the internal math: at catalog prices the Annual Bundle ($499) vs 4× Quarterly ($796)
saves $297 — a strong pitch; at D-13 prices it saved $97. **Decide which column is truth
and I re-lock D-13 + align everything in one pass.**

**F3 — Annual bundle consistency.** Catalog copy says "4 quarterly reviews plus priority
strategy sessions and a year-end report"; `PLAN_FEATURES` matches. ✅ No duplication.

**F4 — Lite vs Lite+ differentiation is clean** (Lite+ = Lite + 1 Strategy Session/mo,
$79 vs $49 — the $30 delta vs the $129 standalone session is a sensible bundle discount).
✅ Keep.

**F5 — Strategy Session lost its Home/Job vs Car split** (D-13 had $99/$79; catalog has
one $129). If the split still matters, that's a second discount-code candidate
(`CARSESSION` → $50 off) rather than a second product. Otherwise re-lock flat.

**F6 — Stripe-link hygiene.** All 8 payable services have links; `insurance-consult`
correctly has none (free, commission-paid). `svcPayUrl()` fallback chain
(settings → catalog) works. ✅ No orphaned links found in the app. *(Dashboard-side
orphans — old products/prices not referenced by the app — can only be checked in the
Stripe dashboard: see header note.)*

## 3. What shipped with this audit (v0.72.3)

The client-account **"Your plan" card now has real Upgrade actions**: Lite, Lite+, and
Annual buttons that open the configured Stripe payment links (the light flow you chose —
you mark the client's plan manually after payment; full webhook-synced subscriptions are
a later build). The buttons read prices from the catalog, so they auto-correct when F2 is
resolved.

## 4. Decisions — RESOLVED 2026-06-11 (owner) + executed

1. **F1 = YES.** `client-checkup` removed from the catalog (SVCS + stripeLinks + pricing
   carousel). One Financial Checkup at $149; returning clients get a promo code. The
   pricing card now says "Already a Golden Anchor client? Ask your advisor for your
   discount code" (EN+ES) — safe wording until the code exists in Stripe.
2. **F2 = CATALOG.** D-13 re-locked in AGENT.md at $149/$199/$129/$49/$79/$499.
3. **F5 = ONE FLAT PRICE.** Strategy Session $129; Home/Job/Car split retired.
4. **Stripe dashboard (owner, ~10 min, any PC):** see the checklist in REVIEW_QUEUE.md —
   create the `GACLIENT50` promo code, archive the old Golden-Anchor-Client checkup
   product/link, confirm live prices match the re-locked D-13, enable "allow promotion
   codes" on the Checkup payment link.
5. **NEXT (master directive §A):** add Free + Premium (choose-your-price, $3 floor)
   products in Stripe when the plan-ladder build ships.
