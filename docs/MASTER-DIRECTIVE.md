# MASTER DIRECTIVE — owner brief of 2026-06-11 ("next level" mandate)

> Mauricio's full directive, logged verbatim-in-spirit and divided into workstreams, per his
> instruction: "log everything I have told you… divide this prompt into sections, create a
> plan and structure, assess what we currently have… and start to work on it." Owner is on
> **Max 5x**; workflows/agents/credits explicitly authorized ("use everything you have in
> your power… don't be scared to try new things"). Standing goal: **accomplish as much as
> possible**, push back where something is wrong.
>
> Status legend: ✅ done · 🔨 in progress · 📋 queued · ❓ awaiting owner · 🧠 design/research

## 0. Decisions received this brief (unblocking earlier asks)

- **F1 = YES**: merge `initial-checkup` + `client-checkup` into ONE $149 product + a
  `GACLIENT50`-style promo code for returning clients.
- **F2 = CATALOG**: the shipped catalog prices ($149 / $199 / $129 / $49 / $79 / $499) are
  truth. Re-lock D-13 at these numbers.
- **F5 = ONE FLAT PRICE**: Strategy Session stays $129 flat; no Car code.
- **Stripe access**: owner HAS a PC (just not the repo machine) → he can use
  dashboard.stripe.com directly (checklist provided in REVIEW_QUEUE), or paste a live
  restricted key (write: Products, Prices, Coupons, Promotion codes, Payment links) in
  chat / credentials for me to do it via API. App-side ships now regardless.
- **Premium pricing = CHOOSE-YOUR-PRICE, $3 floor** (suggested $3/$10/$20 + warm
  professional thank-you copy). Stripe customer-chooses-price product.
- **Premium gates confirmed (all)**: in-profile calculators · Complete Report +
  month-compare · extra investment packages · PDF download of report/compare (in-app
  viewing free) · **the new useful-links master directory**. Public calculators free.
- **Linking design Q1–Q6 answered**: revoke → client keeps a **frozen copy**; island data
  on accept → advisor gets a **review screen** (import anything?); goals notes →
  **client-editable**; **1:1 for now**; **auto-revoke portal tokens on accept = yes**;
  **14-day invite expiry + re-send = yes**. Linking is fully specced → buildable
  (`docs/ARCHITECTURE-PLAN.md` §L1-L6).
- **clientdemo password shared** with owner (test account). New stray account
  `mau.hdez10@yahoo.com` → delete (owner-authorized).

## A. Business-model revision (THE core logic change) 🧠→📋

Owner's words: clients must be able to log in and use the app **without an advisor**. The
advisor exists to explain, help reach goals, and help set up the account — not as a gate.

**Plan ladder (to confirm final naming/pricing — see open questions):**

| Tier | Price | What it includes |
|---|---|---|
| **Free** | $0 | Account, self-profile, public calculators (no personal data), resources, useful links, pricing, about |
| **Premium (self-serve)** | pay-what-you-want or fixed (❓) | Free + the *inside-profile* premium features: in-profile calculators (use YOUR numbers), Complete Report, month-compare, extra investment packages — **no advisor** |
| **Monthly Lite** | $49/mo | Premium features + ongoing advisor support (check-ins, Q&A, accountability) |
| **Monthly Lite+** | $79/mo | Lite + 1 Strategy Session/mo |
| **À la carte** | per service | Checkup $149, Quarterly $199, Strategy $129, Annual $499, free insurance consult |

- PWYW idea (owner's example): "$3/mo you're gifting a coffee — thank you. $20/mo you're
  helping us maintain the site — you're amazing." Tone must stay professional.
- Premium-gated candidates (owner's examples): client-detail calculators, Complete Report,
  months compare, additional portfolio/investment packs. Public calculators stay free.
- Everyone can request services à la carte regardless of tier. "Best of both worlds."
- Mission constraint: serve **low-income families** and **older / low-tech users** —
  numbers + charts + plain descriptions, easy input, generous defaults.

## B. Pricing alignment (decided — execute now) 🔨

1. Drop `client-checkup` from `SVCS` + its Stripe link slot; returning-client price = code.
2. Re-lock **D-13** in AGENT.md at catalog numbers; note F1/F5 resolutions.
3. Sweep engagement letter / pricing page / PLAN_FEATURES for stale $ numbers.
4. Surface `GACLIENT50` in the returning-client flow once the code exists in Stripe (❓ B0).
5. Stripe-side (blocked on access path ❓): one Checkup product, promo code, "allow
   promotion codes" on links. Later: Free + Premium tiers as Stripe products.

## C. Account linking build (spec complete) 📋

Build per `docs/ARCHITECTURE-PLAN.md` §L1-L6 with the six answers above. Phases:
Link-R (read-only mirror + invite/accept) → Link-W (contact + goals-notes edits) →
portal coexistence (auto-revoke tokens on accept). Re-run the adversarial role proof.

## D. Signup, onboarding & verification 📋 (owner: "important")

Current bugs/gaps (owner tested with a fresh Yahoo account):
1. **No email verification** — signup mints an account without confirming the address.
   Fix: Supabase confirm-email ON + a designed "check your inbox" screen + resend.
2. **No onboarding** — new client lands cold. Build an onboarding wizard: welcome →
   basics (name, language) → goals questionnaire → **checkboxes: "free health-insurance
   consultation" + "car insurance interest"** (owner-specified) → tour of what's where.
3. The signup "signature" prompt is wrong/confusing — revisit what signup asks vs what
   the engagement letter flow asks. Signature belongs to engagement, not account creation.
4. Free tier must be explicit at signup ("start free").

## E. Landing page & routing 📋

1. **`/` = real landing page** (Origin-style marketing: screenshots of the app, what it
   does/serves, motion, CTA sign in/up). Advertising voice — no "this is not investment
   advice" disclaimers front-and-center (keep legal where it belongs, footer/ToS).
2. **`/login` route** shows the current login page (today login renders at `/` with no
   address). `/pricing` must be a real URL pre-auth. URLs must reflect EN/ES state.
3. Owner wants it to "look better than Origin… like a group of master designers built it."

## F. Design-excellence pass (owner's standing #1 complaint) 📋

Specific fixes named: pre-login Pricing background; About-Us right-side + bottom icons
"don't look well"; remove "not management" pill (it's said elsewhere); remove "What we do"
section; Contact-us icons need modern look; **contact links editable in Settings under
advisor info**. Overall: consistent, polished, fresh, modern, eye-catching motion — never
stiff, never childish. Full design pipeline authorized (DESIGN-MODE.md).

## G. Calculators 📋

1. The sectioned Calculators page: owner dislikes the sections layout + the page title is
   redundant with the top banner — kill the redundancy **across all tabs** (one title
   pattern app-wide).
2. Calculators have "a lot of blank space — seems unfinished": layout density pass.
3. Research + add missing calculators (auto loan, mortgage affordability, credit-card
   payoff vs avalanche/snowball, college, FSA/HSA, etc.) → fuller catalog.

## H. Stripe-driven commerce 📋🧠

1. **Promotions auto-update from Stripe** if possible (products/prices/promo codes via
   API → app reflects them; needs a server-side cached endpoint, no key in browser).
2. **Billing & plan page modifiable with Stripe** (customer portal / payment links).
3. Stripe links UI in Settings: **collapsible twice** — per section and per service (+/−).

## I. What's New per role 📋

Advisors see advisor-relevant entries; clients see client-relevant ones. Two curated
feeds (flag entries by audience), not one shared list.

## J. Advisor efficiency system (his portal) 🧠📋

1. **Reports fully populated** — no missing sections, any page count, **AI-readable**
   (clean text/structured export) so he can hand a report to an AI to speed advisement.
2. **Easier data entry** — evaluate bank-connected import (Plaid/Origin-style) vs CSV
   import vs guided questionnaire. ⚠️ PUSHBACK LOGGED: bank-credential asks can scare
   exactly his low-trust/low-tech demographic and add compliance/cost burden — recommend
   guided questionnaire + statement upload first, aggregator later as opt-in.
3. **Onboarding SOP + master questionnaire** capturing everything he needs in one pass —
   designed for low-income families and older clients (plain language, EN/ES, chunked).

## K. Resources, useful links & referral network (differentiator) 🧠📋

1. **Master useful-links directory** (in-app, not downloadable): cards/loans (NerdWallet-
   style studies, credit unions — Consumer CU, First Tech, Lendbuzz), state-by-state
   assistance (food stamps, first-time-homebuyer programs), travel guides (+ slot for the
   in-development travel app), tips & tricks. Legend + clickable links, organized by life
   situation. Needs **deep research** for completeness; reputable sources only.
2. **Referral contacts page** — his network (car insurance, realtors, services) with a
   disclosure; **editable per advisor in Settings**; lives near services/stripe links.
3. **Own easy-to-understand documents** in Resources (simple steps; OK to adapt from
   reputable sites with attribution).
4. Owner asked for **more differentiation ideas like these — "don't ignore this."**

## L. Go-to-market documents 📋 (after build)

Drafts to present to (a) clients, (b) prospective agents/advisors, (c) possible investors.
US-based now, not US-limited in framing.

## M. Standing instructions captured

- Question logic always; act like a company (MBA/PhD/Six-Sigma-level rigor); weigh pros/cons.
- Push back on what's wrong, push what's right.
- Owner is on Max 5x — scale effort up; delegate to agents/workflows freely.
- App must make sense **with or without an advisor**; users must feel good using it.
- Everything bilingual (D-3 unchanged). Mobile-friendly (D-27).

## N. Execution order (assessment of what we have → plan)

What exists today: solid advisor CRM core (clients, reports, charts), token share-portal,
client accounts (islands), designed pricing page, 9 public calculators, D-37 modular
codebase, design token system. What's missing vs the vision: the self-serve ladder (A),
onboarding/verification (D), real landing+routes (E), premium gating, Stripe sync (H),
linking (C), the differentiator content (K), and the final design polish (F/G).

Sequence (dependencies first, quick wins early):
1. **B** pricing alignment (decided, small) ✅ → ships immediately
2. **D** signup verification + onboarding wizard + insurance checkboxes (trust + legal)
3. **E** landing page + routing (the public face; feeds A's funnel)
4. **A** plan ladder + premium gating (needs D for clean signup; Stripe products ❓)
5. **C** linking Link-R → Link-W (spec ready)
6. **F+G** design excellence + calculators pass (continuous, design pipeline)
7. **H** Stripe sync (after A's products exist)
8. **I** What's New split (small)
9. **J** reports + questionnaire + SOP (advisor side)
10. **K** research-heavy content (parallel agents/workflows anytime)
11. **L** GTM docs (last)
