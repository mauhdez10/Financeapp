# REVIEW_QUEUE.md — what Mauricio needs to check, in plain steps

> Running owner checklist (cross-project playbook §2). I append on every batch; items
> stay until YOU confirm them. Newest sprint on top. Hard-refresh first (Ctrl+Shift+R);
> confirm `window.__GA_BUILD__` ends in `v0711-…` in DevTools console.

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

### 5. Explicitly NOT done this sprint (so nothing is silent)
- Phase 1b/2 extraction (calculators, primitives, ClientDetail split into tabs).
- Design surface items: landing hero spec, table polish, type-scale snap, page-header
  pattern, empty states (punch-list A1, C18-24, D25-29, E30-32).
- Logic-library calculators/charts/fields buckets (staged in the skill, §4-5).
- Mobile polish pass (stretch goal — app remains responsive per D-27, not re-audited).
- Email send not live-tested (see 2 above). Calculators logic doc pending extraction.

## Older items
- (none carried — pre-sprint work was confirmed in session or shipped earlier)
