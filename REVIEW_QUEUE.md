# REVIEW_QUEUE.md — what Mauricio needs to check, in plain steps

> Running owner checklist (cross-project playbook §2). I append on every batch; items
> stay until YOU confirm them. Newest sprint on top. Hard-refresh first (Ctrl+Shift+R);
> confirm `window.__GA_BUILD__` ends in `v0723-…` in DevTools console.

## Master-directive batch 1 — 2026-06-11 (v0.72.4 → v0.73)

### MD-D: Signup is now real (verification + onboarding)
- [ ] **Sign up with a fresh email** (any address you own): you now land on a
      "Confirm your email" screen with a resend button; the account can't sign in
      until you click the link in the email. (Before: instant unverified account.)
- [ ] **Log in as clientdemo** (clientdemo@goldenanchor.life / `Miami2026!demo` —
      password you asked for): the new 4-step onboarding wizard appears (I reset the
      flag so YOU get to see it): name → goals → the **health-consult + car-insurance
      checkboxes you asked for** → done. Checking either box emails a lead to
      finance@goldenanchor.life. Also: the first-login Terms gate got the modern look.
- [ ] ⚠️ **One paste from you**: verification emails currently use Supabase's built-in
      sender (rate-limited ~2/hour, plain look). Paste the **RESEND_API_KEY** (Vercel →
      Financeapp → Settings → Environment Variables) in chat and I wire custom SMTP so
      they come from noreply@finance.goldenanchor.life, unlimited. (The Resend MCP key
      expired, so I can't mint one myself.)

### MD-F (named fixes): About + public pricing (v0.74.2)
- [ ] About Us: "not management" pill gone, "What we do" header gone, the spinning
      orbit on the right is now calm static rings, and Contact is clean rows showing
      the actual values. Your **Website link is now editable**: Settings → Advisor
      information → Website.
- [ ] Logged-out /pricing: background is the quiet glow now (no more cursor lines).

### MD-E: The marketing landing page is live at / (v0.74.1)
- [ ] Open https://finance.goldenanchor.life **logged out**: real landing page now —
      hero with live charts (not screenshots), how-it-works, features, the
      with-or-without-advisor section, pricing teaser. "Sign in" / "Start free" →
      **/login**; Pricing → **/pricing**. Check dark + light, EN + ES, and your phone.
- [ ] This is v1 of the "better than Origin" page — tell me what to push further
      (more motion? different headline? real screenshots?) and I iterate with the
      full design pipeline.

### MD-A: Free vs Premium is live (v0.74)
- [ ] Log in as **clientdemo** (I reset it again — you'll see the onboarding wizard
      first, then the FREE experience): open your profile → **Calculators tab**,
      **Client Report → Complete Report**, and **→ Compare** — each shows the
      choose-your-price upsell ($3 coffee / $10 sustainer / $20 champion, your copy,
      professionally worded). Portfolios → extra packages show a lock note.
- [ ] The upsell's "I already subscribed — activate" flips the account to Premium
      instantly and emails finance@ a verification lead (cross-check against Stripe —
      the checkout links carry the account id as `client_reference_id`). Try it once;
      tell me and I'll reset the demo back to free.
- [ ] **Pricing page** (logged out or in): new "Use the app with or without an advisor"
      section — Free + Premium cards above your advisory services.
- [ ] **Your advisor account is never gated** — verified adversarially.
- [ ] ⚠️ Annual Bundle is now a RECURRING yearly $499 subscription in Stripe (was
      one-time $299). Flag me if you want one-time instead.

### MD research docs ready for your read (no decisions blocking)
- [ ] `docs/USEFUL-LINKS-DIRECTORY.md` — 147 vetted links, 16 life situations (incl.
      the critic-added immigration/ITIN, disability, seniors+scams, life events,
      Florida disasters). This becomes the Premium in-app page (MD-K).
- [ ] `docs/DIFFERENTIATION-IDEAS.md` — 16 growth ideas, top-5 sequenced (WhatsApp
      coaching channel, benefits-screener SEO play, "Modo Sencillo" senior mode,
      referral network v2, Advisor-in-a-Box SaaS).
- [ ] `docs/CALCULATOR-ROADMAP.md` — P1: credit-card payoff (avalanche/snowball),
      life-insurance needs (feeds your insurance funnel), 50/30/20 budget, emergency
      fund, inflation. Plus the blank-space layout fix pick.

## Finish-everything batch 2026-06-11 (v0.72.3)

### A. Pricing audit — ✅ DECIDED (F1 yes / F2 catalog / F5 flat) & EXECUTED app-side
- [x] D-13 re-locked at catalog prices; `client-checkup` retired from the app; pricing
      card now tells returning clients to ask you for their code.
- [x] ~~Stripe checklist~~ **DONE VIA API with your key (2026-06-11).** What I found
      and fixed: live prices were still the OLD numbers (Quarterly $99, Lite $29,
      Annual $299 one-time, Strategy split) — buyers were being undercharged vs the
      page. Now: $149/$199/$129/$49/$79/**$499-per-year (recurring — flag me if you
      wanted one-time)**; real Lite+ product (the old "Lite+" link actually sold
      Lite + a $149 checkup!); duplicate checkup + Car-strategy products archived;
      **GACLIENT50 live** ($50 off the $149 Checkup, returning clients); 6 dead links
      replaced everywhere (code + your saved settings). **Golden Anchor Premium**
      created at $3/$10/$20-a-month choose-your-price for the coming Free/Premium
      ladder. Zero existing subscribers were affected (there were none).
- [ ] ⚠️ **Rotate both Stripe keys before launch** (they were pasted in chat) —
      Stripe dashboard → Developers → API keys → roll. Update finance-credentials.md.
- [ ] **Resend MCP re-auth** (for verification-email SMTP): in Claude Code type
      `/mcp` → resend → Authenticate. Once green I mint the SMTP key and finish
      email setup myself (your FROM/REPLY-TO values are saved).

### B. Client "Your plan" card now has real Upgrade buttons
- [ ] Log in as clientdemo@goldenanchor.life → Settings → flip the **Your plan** card:
      three buttons (Monthly Lite $49/mo, Lite+ $79/mo, Annual $499/yr) open your real
      Stripe payment links in a new tab. Verified live in EN and ES. You mark the plan
      manually after payment (webhook-synced subscriptions are a later build).

### C. Portal email LIVE-TESTED ✅ (closes the ⚠️ in §2 below)
- [ ] Sent through prod `api/send-portal-link.js` to finance@goldenanchor.life —
      Resend accepted it (message `d08de40d-515c-4d24-a0f7-6d0e452e0ca1`). Check that
      inbox once to eyeball the branded email; the client's address was reverted after.

### D. InterestCalc frequency is now real math (closes the §4b finding)
- [ ] Calculators → Interest: switching Monthly/Quarterly/Annual now changes the result
      (verified: $12,834 monthly vs $12,763 annual on the same inputs).

### E. Touch pass (moderate) + housekeeping
- [ ] On your phone: buttons/inputs are comfortably tappable (40-44px floors, touch
      devices only — desktop density unchanged). Worth a 2-minute phone smoke test.
- [ ] Advisor↔client linking: **design doc only** (your call — islands stay) appended to
      `docs/ARCHITECTURE-PLAN.md`; nothing shipped.
- [ ] Logic skill: charts + field-dictionary buckets filled in
      `.claude/skills/golden-anchor-logic/SKILL.md`.

## Sprint 2026-06-10 (Fable 5 autonomous run, v0.70 → v0.71.1)

### 1. Look & feel (design system pass — your top priority)
- [ ] **Dashboard, dark mode:** KPI numbers are now JetBrains Mono (the "private bank
      number" look), card borders are subtler hairlines, hover is a calm 2px lift +
      gold border (no more big glow bloom). Does it read more professional to you?
- [ ] **Light mode:** same check — hairlines visible but quiet, nothing washed out.
- [ ] **Hover any card:** ONE effect now (no stacked glow+spotlight). Pricing/Resources
      covers still have the cursor spotlight where they don't lift.
- [ ] **Sidebar:** active item is now quiet-grey bg + gold text (was a gold pill).
      Topbar has a hairline under it.
- [ ] Charts animate faster on data changes (300ms, was 800ms) — feel snappier, not jumpy?
- 📐 The full 38-item professional spec lives in `docs/DESIGN-POLISH-PUNCHLIST.md` —
  items A1 (7-size type scale), C18 (table spec), D25-29 (landing hero), E30-32
  (forms/buttons) are NEXT-session surface work; the system level is in.

### 2. Share portal v2 (open any client → ☰ kebab → Share portal)
- [ ] Modal now has **"Next link options"**: expiry (Never/30/90 days) + 5 section
      checkboxes (Cash flow, Assets, Trend, Emergency fund, Goals).
- [ ] Generate a link with **Goals unchecked** → click **Preview as client** → the
      portal should show everything EXCEPT the Goals section. (I verified the API
      end-to-end on prod with a real link; eyeball the page once yourself.)
- [ ] **Email link to client** — sends a branded bilingual email via Resend. ⚠️ I did
      NOT live-send (didn't want to email anyone unasked). Test once on a client whose
      email is YOURS. Button correctly disables when the client has no email.
- [ ] Active-link card shows the expiry date + view count; Revoke still works.

### 3. Client accounts (log in as clientdemo@goldenanchor.life / Miami2026!demo)
- [ ] **Settings** is now the client version: My profile (edits save to their own
      profile), Appearance, Localization, Your plan. No advisor cards (no Stripe links,
      no branding, no backup).
- [ ] Type `/promotions` or `/clients` in the URL as the client → bounces to their
      Overview (new role guard).
- [ ] Advisor account unchanged — full nav, all surfaces.

### 4. Architecture (invisible, but worth knowing)
- [ ] **D-37 locked (you approved):** App.jsx went 8,502 → ~6,800 lines; pure data/
      helpers/services + all 23 charts now live in `src/{constants,styles,contexts,
      utils,services,hooks,components}`. Whole app verified surface-by-surface after
      each move. Calculators/primitives extraction = next session (Phase 1b).
- [ ] Docs are truthful again: CHANGELOG covers v0.60→now, AGENT.md is lean + current
      (new pitfalls #17-19), `docs/_INDEX.md` maps everything, old docs in `docs/archive/`.
- [ ] New consulted skill `.claude/skills/golden-anchor-logic/` — the role rules,
      portal allow-list, and every money formula with targets. **Add your "why" notes
      where the TODO marks** — the how-to guides will quote you.

### 4b. Continuation batch (v0.71.2 → v0.72, same night)
- [ ] KPI deltas on the dashboard are now tinted mono chips. Table headers app-wide are
      uppercase micro-labels; every numeric (right-aligned) table cell is JetBrains Mono.
      Primary gold buttons have dark ink (were white-on-gold). Light-mode accent for
      accounts without a stored accent is gold now (was legacy blue).
- [ ] **Phase 1b extraction done:** UI primitives (33 components) + the 9 standalone
      calculators (21 exports) now live in src/components/. App.jsx is ~6,250 lines
      (from 8,502). Spot-check: Calculators page, Retirement, Home Calculator →
      Amortization tab (this one crashed during extraction and was fixed + re-verified),
      a Settings edit popup, dashboard.
- [ ] **Calculator math is now fully documented** in .claude/skills/golden-anchor-logic
      §4 (inputs/formulas/assumptions per calc). ⚠️ One finding for you: **InterestCalc's
      compound-frequency dropdown (Monthly/Quarterly/Annual) is decorative — the math
      always compounds monthly.** Decide: wire it or remove the dropdown.
      Also: IncomeCalc uses **hardcoded 2025 tax brackets** — annual maintenance item.

### 4c. Continuation batch 2 (v0.72.1 → v0.72.2)
- [ ] **Phase 2a+2b extraction:** marketing pages, landing/Login, legal components
      (SignaturePad/EngagementLetter/ToS), intake pages, admin/settings pages, and the
      portal pages all live in src/pages + src/components now. **App.jsx: 8,502 →
      ~3,790 lines (-55%).** Every extracted surface was driven live after the move
      (Resources, About, Pricing, landing+canvas, Promotions, Settings+signature popup,
      Intake admin, public /intake guard).
- [ ] **Pre-existing routing bug FIXED:** deep-linking or refreshing on /intake-submissions
      always bounced to the dashboard (the public-intake prefix check swallowed it —
      since v0.13). Refresh on the Intake Forms page now stays put. Try it.

### 5. Explicitly NOT done this sprint (so nothing is silent)
- Phase 1b/2 extraction (calculators, primitives, ClientDetail split into tabs).
- Design surface items: landing hero spec, table polish, type-scale snap, page-header
  pattern, empty states (punch-list A1, C18-24, D25-29, E30-32).
- Logic-library calculators/charts/fields buckets (staged in the skill, §4-5).
- Mobile polish pass (stretch goal — app remains responsive per D-27, not re-audited).
- Email send not live-tested (see 2 above). Calculators logic doc pending extraction.

## Older items
- (none carried — pre-sprint work was confirmed in session or shipped earlier)
