# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

## v0.69.8 — 2026-06-09 (Patch) — Settings flip-card 3D clipped to the card (no page jump)

`overflow:hidden` on the flip card's outer (perspective) element so the rotateY projection no
longer adds document scroll-height — hovering the last Settings row stopped shoving the page.
Inner `preserve-3d` untouched; flip still works. Marker `2026-06-09-v0698-settings-card-clip-3d-no-page-jump`.

## v0.69.7 — 2026-06-09 (Patch) — No dashboard flash on refresh

`nav`/`selectedTab`/`selectedCalc` now seed from `parseGAPath(location.pathname)` in their
useState initializers, so the FIRST render is already the right page (the route used to apply in a
post-paint effect → one-frame dashboard flash). Verified: 20 rapid samples after reload on
/settings, dashboard never rendered.

## v0.69.6 — 2026-06-09 (Patch) — Refresh keeps the page; Settings cards natural height

- The avatar-menu pages (settings/security/billing/backup/archived/whats-new/help) + pricing were
  missing from `_GA_NAVS`, so their URL stayed `/dashboard` and refresh bounced there. Added.
- Reverted the fixed-224px card height + scroll: cards are natural height equalized per grid row
  (shorter cards get blank space), ALL info visible, no scroll. Card bg/halo moved to the outer
  element; flip faces transparent over it (no gap).

## v0.69.5 — 2026-06-09 (Minor) — Settings flip cards: uniform, centered, edit-popup polish, global toggle

Uniform card sizing, centered cover content (icon+title+desc), full-width uniform popup inputs,
card stays flipped while its edit popup is open, and a "Flip cards" on/off switch above the grid
(persists to `settings.cardsFlip`; off = always show details).

## v0.69.4 — 2026-06-09 (Minor) — Settings flip cards done right (cover → details; Edit = popup)

Per owner correction: card FRONT = icon + short description (cover); HOVER flips (rotateY 180) to
the BACK = detail rows; EDIT opens a Modal popup with the fields. Back face in normal flow defines
height; front absolute; grid start-aligned. 6 bilingual card descriptions added.
(v0.69.2 flip-to-edit-inline was the wrong interaction + left a black gap; reverted in v0.69.3.)

## v0.69.1 — 2026-06-09 (Minor) — Localization editable & wired; backup destination picker

- Localization card: inline-edit selects for Language (EN/ES), Date format, Currency
  (USD/EUR/GBP/MXN/CAD). Genuinely wired: `fmt()`/`fmtDate()` read module globals synced from
  settings; Language flips the live app language; topbar EN/ES keeps `settings.lang` in sync.
- Backup popup: "Save backup (.json)" via the File System Access API (`showSaveFilePicker`) so the
  owner picks the destination (PC folder or synced Drive folder); download fallback.

## v0.69 — 2026-06-09 (MINOR) — Account-based client portal: advisor vs client roles + isolation hardening

- Signup chooses **Personal (client)** or **Advisor**; role stored in auth `user_metadata.role`
  (server-trusted — NEVER in settings, which is client-cached and can bleed).
- `role==="client"` → restricted shell: nav Overview/Calculators/Resources/Pricing/About;
  "CLIENT PORTAL" sidebar; avatar menu trimmed to Profile settings/Security/Billing/Help/Sign out;
  Overview = the client's own single self-profile (ClientDetail `clientMode`: no Back, kebab =
  Edit/Export only); self-profile auto-created on first login; display name = the client's own.
- Isolation hardening: `ga_cache_uid` owner tag on localStorage (absent tag = foreign → purge);
  session draft uid-tagged + never restored for a client account; caches cleared on sign-out.
  Caught + fixed in testing: a stale draft briefly bled another account's client into a new login.
- Verified live with a real client signup (clientdemo@) + the advisor account.

## v0.68.1 — 2026-06-09 (SECURITY) — Cross-account localStorage bleed fixed

clients/settings were cached in GLOBAL localStorage keys; a second account on the same browser
booted with the first account's data, and the localStorage→cloud migration could upload it into
the new account. Fix: owner-tag the cache (`ga_cache_uid`), purge all per-account keys on identity
mismatch BEFORE migrate/load, skip migration for foreign caches, clear on sign-out. Server RLS was
always correct — this was purely client-side. (Pitfall #18.)

## v0.68 — 2026-06-08 (MINOR) — Token-based read-only share portal

`portal_links` table (RLS owner-only; migration `2026-06-08-portal-links.sql`, applied 2026-06-09)
+ anonymous rate-limited `api/resolve-portal.js` (service-role; explicit ALLOW-list sanitization —
drops SSN/DOB/phone/address/internal notes) + `PublicPortal` at `/portal?token=…` (branded
read-only overview: KPIs, cash-flow waterfall, asset donut, debt-vs-savings trend, EF gauge,
goals, EN/ES + theme toggles) + `PortalShareModal` ("Share portal" in the client kebab:
generate/copy/revoke; regenerate rotates the token).

## v0.67.1 — 2026-06-08 (Patch) — Promotions header aligned to the editorial system

Mono "Offers" eyebrow + bold sans title (was a lone Newsreader italic). Stats strip + CRUD untouched.

## v0.67 — 2026-06-08 (MINOR) — Calculators page rebuild

Editorial header + four category sections (Plan & grow / Tackle debt / Home & affordability /
Income) with mono hairline headers; vertical cards with gold Lucide icon, bilingual one-line
descriptions (previously hardcoded English), "Open →" affordance. 15 new EN+ES keys.

## v0.66.1 — 2026-06-08 (Patch) — Designed Create-account form

Show/hide password toggle (all auth modes), signup subtitle, live 3-segment strength meter
(Weak/Fair/Strong) + min-8 hint in signup/set-new modes.

## v0.66 — 2026-06-08 (MINOR) — About Us real rebuild

Editorial split hero (Newsreader gold-gradient italic headline — mode-aware gradient for AA
contrast; anchor monogram in dual counter-rotating dashed orbital rings, reduced-motion safe),
"What we do" features bento (6 Lucide tiles, varied spans), certifications with icons,
Connect-with-us glowing social dots (Globe/AtSign/Mail/Phone), restyled referral card. 20 new
EN+ES keys. NOTE: this repo's lucide-react does NOT export `Instagram` — use `AtSign` (pitfall #19).

## v0.65.x — 2026-06-08 (MINOR) — Resources + Settings real rebuilds

- **v0.65** Resources: Gallery4-style horizontal snap-carousel of tall topic-gradient cover cards
  (line icons, overlay text, arrows). **v0.65.2** bigger cards (400×460).
- **v0.65.1** Settings: per-card section icons + inline edit per card (Edit → fields form →
  Save/Cancel, saves only that section). **v0.65.2** Advisor Information card also carries the two
  logo uploaders + the SignaturePad; ProfileModal gained a `section` prop so Services and Backup
  open SCOPED single-section popups instead of the monolithic modal.

## v0.64.x — 2026-06-08 (MINOR) — Spotlight cards + real sign-up

- **v0.64** `.ga-spot` cursor-follow gold spotlight (21st.dev GlowCard translated to vanilla
  CSS/JS) on Settings + Pricing cards; **v0.64.1** rolled to Calculators/Promotions/Resources/
  About; Resources emoji → line icons; Client-Due "—" → "·".
- **v0.64.2** real Supabase sign-up on the landing ("Create account" ↔ "Sign in" mode toggle).

## v0.63.x — 2026-06-08 (MINOR) — Standalone Pricing page

`PricingPage` (public + in-app variants): membership-first carousel of long cards (3 visible,
arrows), glossy gold CTAs, grouped "everything you can do, by plan" comparison table, public top
bar with the dashboard logo block + EN/ES + theme toggles, ambient gold line-field. Reached from a
landing "Pricing" button AND an in-app nav item. No fake monthly/annual toggle (different products).

## v0.62.x — 2026-06-07/08 (MINOR) — Direction B + C rollout (the modern redesign)

Owner picked **Direction B (Linear/Vercel flat dark-tech) + C (springy/halo motion)** from a
4-direction exploration lab. Rolled across dashboard, Client Detail, Clients list, Calculators,
Settings, report headers, About: flat near-black tokens (bg #0C0D11, card #16181C, hairline
#2A2E35), gold halo hover (`.ga-lift`), press scale (`.ga-press`), stagger reveal (`.ga-rise`),
diagonal bgHi→bgLo background + gold top-right glow, compact KPI tiles, light mode warm cream.

## v0.61.x — 2026-06-07 (MINOR) — Glass groundwork + emoji strip

Glass cards + atmospheric glow app-wide; thin chart strokes; slim gradient paired bars for Income
vs Spending; emoji-as-iconography stripped from headers/labels/tabs (`stripLeadEmoji`); calculator
tiles get thin line icons.

## v0.60 — 2026-06-07 (MAJOR-ish) — Modern redesign port (Origin-inspired)

Modern near-black/off-white global theme; rebuilt Login/landing (glass, clean sans + mono labels,
thin reactive gold line-field canvas, EN/ES + theme toggles); KPI tiles rebuilt (neutral sans
value, mono label, thin sparks, no emoji); SmoothAreaLine thinned. Auth handlers untouched.

## v0.59.6 — 2026-06-04 (Patch) — Rate-limit the public intake endpoints (audit §3c)

The two un-authenticated public endpoints (`resolve-intake-invite`,
`send-engagement-copy`) had no abuse throttle. Added per-IP rate limiting via
Upstash, built **fail-open**.

- New `api/_ratelimit.js` — shared `checkRateLimit(req, bucket, {max, window})`
  helper. Per-IP sliding window via `@upstash/ratelimit` + `@upstash/redis`.
- `resolve-intake-invite` → 30 req / 10 min per IP; `send-engagement-copy` →
  5 req / 10 min per IP. Over-limit returns HTTP 429.
- **Fail-open by design:** if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  are not set (or the package/limit call errors), every request is allowed — a
  missing/broken limiter can never take the public intake flow offline. Same
  dry-run philosophy as the email layer. Verified: unconfigured → `{ok:true}`.
- **To activate** (no code change): create a free Redis DB at
  console.upstash.com, set the two env vars in Vercel, redeploy. Setup notes in
  `api/_ratelimit.js` header + AGENT.md §11 env-vars list.
- Drive-by: cleaned one unused `catch (e)` → `catch` in resolve-intake-invite.js
  (the file I was editing). The 5 remaining api unused-vars are in untouched
  files (`render-report-pdf`, `send-intake-invite`) — left out of scope.

`npm audit` = 0 (4 packages added). Build green. The actual throttling can only
be exercised with real Upstash creds (not available in this environment); the
fail-open path and build are verified here.

Build marker `2026-06-04-v0596-intake-rate-limit`.

## v0.59.5 — 2026-06-04 (Patch) — Safe dependency bumps (audit §3c)

In-range patch/minor bumps only; no majors. `npm audit` = 0, build green.

- react / react-dom 19.2.5 → **19.2.7**
- @supabase/supabase-js 2.105.4 → **2.107.0**
- vite 8.0.8 → **8.0.16**
- lucide-react 1.16.0 → **1.17.0**
- resend 6.12.3 → **6.12.4**
- @vitejs/plugin-react 6.0.1 → **6.0.2**, eslint-plugin-react-hooks 7.0.1 → **7.1.1**,
  globals 17.4.0 → **17.6.0**, @types/node + @types/react patch bumps.

**`lucide-react` provenance cleared:** the audit flagged `^1.16.0` as a suspicious
major-line ("real lucide-react is 0.4xx"). Verified it IS the official package
(`lucide.dev`, `github.com/lucide-icons/lucide`, npm latest 1.17.0) — lucide-react
moved to a 1.x line. Not a supply-chain issue.

**Deliberately NOT bumped (need PDF-endpoint / config testing first):**
eslint + @eslint/js 9 → **10** (flat-config breaking risk), puppeteer-core 24 → **25**
and @sparticuz/chromium-min 140 → **149** (must move in lockstep + re-test the
`render-report-pdf` serverless function, which can't be exercised here).

**Note on lint count:** the eslint-plugin-react-hooks 7.0→7.1 bump made the linter
stricter, raising the error count from 219 → 244. These are *more instances of the
same already-deferred categories* (rules-of-hooks / static-components), not new code
problems — kept the bump (dev-only, zero runtime/build impact). The 268→219 figure
from v0.59.4 was measured on the 7.0.1 linter.

Build marker `2026-06-04-v0595-safe-dep-bumps`.

## v0.59.4 — 2026-06-04 (Patch) — Lint floor: real-bug fixes (audit §3b/§3c Phase 2)

Surgical correctness fixes from the audit. No UI/behavior changes except the
SlopeGraph filter (which fixes a dead condition). ESLint errors 268 → 219.

**FIX — duplicate object keys silently dropping translations (9 → 0).** Three
i18n keys were defined twice in **both** EN and ES dictionaries
(`loans`, `cashFlowMapHdr`, `interestLbl` in `translations.js`; `fieldType` in
App.jsx) plus a duplicate `color` in one inline style. JS object literals keep
the **last** value, so the first was dead. Removed the dead duplicates; the
effective (second) value is unchanged, so zero runtime change. The dup `color`
(`color:th.muted` then `color:GOLD`) kept the intended GOLD.

**FIX — `Math.random()` called during render (react-hooks/purity).** `useSvgId`
generated SVG ids with `Math.random()` inside `useMemo` — impure during render
(and SSR-unsafe). Replaced with React 19's `useId()` (stable, pure, unique per
call site). Colons stripped for valid SVG/CSS ids.

**FIX — SlopeGraph empty-row filter was a no-op (no-constant-binary-expression).**
`filter(d => d && (+d.a != null || +d.b != null))` — the unary `+` coerces to a
number, and a number is never `== null`, so the condition was **always true** and
categories with no data slipped through as flat zero-lines. Dropped the stray
`+` so the `!= null` check works: `(d.a != null || d.b != null)`. The explicit
`!= null` confirms the intent was a null check, not a truthiness check.

**FIX — ESLint flagged Node globals in serverless functions (no-undef, 37 → 0).**
`api/**/*.js` run in Node (Vercel functions) but the flat config only applied
browser globals, so `Buffer`/`process`/etc. were reported as undefined. Added an
`api/**` config block with `globals.node`. Config-only; no code change.

**Deferred (documented, NOT fixed this pass):** 23 `react-hooks/rules-of-hooks`,
81 `react-hooks/static-components`, 89 `no-unused-vars`, 13 `exhaustive-deps`.
These share one root cause — components/hooks defined inline during render — and
resolve naturally when App.jsx is split into modules (audit §6 Phases 3–6).
They are lint-true but runtime-benign in current shipping code; surgically
reordering them in the monolith now is high-risk with no test safety net.
`PrintBtn` and `LOTTIE_HERO_URL` were flagged "dead" by the audit but are
intentionally retained (PrintBtn per its own code comment; LOTTIE_HERO_URL is an
active feature-flag slot) — left as-is.

Build green; build marker `2026-06-04-v0594-lint-real-bugs-dupkeys-purity-slopegraph`.

## v0.59.3 — 2026-06-04 (Patch) — Security: xlsx CVE + engagement-copy advisor guard

Two security fixes from the 2026-06-03 audit (`docs/AUDIT-2026-06-03.md` §3c). No UI changes.

**FIX — `xlsx` high CVE (prototype pollution + ReDoS).** The npm `xlsx@^0.18.5`
has a known high-severity advisory with **no fix published on npm**. Per locked
decision **D-9 (SheetJS is the Excel I/O)**, we did NOT swap libraries — instead
pinned the official patched SheetJS build from their CDN:
`"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`. The
`import * as XLSX from "xlsx"` import is unchanged (same package name). After
`npm install`, `npm audit` reports **0 vulnerabilities** (was 1 high). Build
verified green; xlsx chunk 363 KB (unchanged); `XLSX.version` = 0.20.3.

**FIX — `api/send-engagement-copy.js` trusted a caller-supplied `advisorId`.**
This un-authenticated endpoint read `advisorId` from the request body and used
it for the email's branding, CC, and reply-to. A caller who knew a `submissionId`
could pass a *different* advisor's id and cause that advisor to be CC'd on a
prospect's signed engagement letter (cross-tenant PII leak) + send under the
wrong branding.
**WHY:** the owning advisor was taken from untrusted input, not from the record.
**CHANGED:** the endpoint no longer reads `body.advisorId`. After loading the
submission (by `submissionId` or `inviteToken`), it derives the authoritative
advisor from `submission.advisor_id` (the column set at insert by `gaSubmitIntake`
and used as the owner key everywhere). If a submission has no `advisor_id`, it
returns 422 instead of sending. `submissionId`/`inviteToken` is still required.

> **Doc note:** the CHANGELOG had drifted (top entry was v0.57.0 while the live
> build marker was v0.59.2 — per AGENT.md "trust the build marker, not the docs").
> v0.58–v0.59.2 entries were not backfilled here; this v0.59.3 patch resumes the
> log at the true current version. Build marker now
> `2026-06-04-v0593-security-xlsx-cve-and-advisorid-guard`.

## v0.57.0 — 2026-05-25 — Sign-in WCAG fix + email-type + mobile-input hardening

First v0.5x ship out of the post-v0.56 UI/UX audit. Three P0 fixes from the
sign-in / mobile-input bucket, all contained to the `<Login>` component plus
one mobile CSS rule. No layout changes on desktop, no new strings.

**Sign-in submit button — WCAG AA→AAA contrast fix (audit finding A1).** The
button background was a `linear-gradient(135deg, PAL.amber, PAL.amberDeep)`
with cream text — in light mode the gold (`#C9A84C`) end gave ~2.2:1 cream-on-
gold (FAIL AA), and in dark mode the cream-gold (`#EDD594`) end gave ~1.4:1
(cream-on-cream-gold, effectively unreadable). Replaced with a theme-conditional
solid: in light mode walnut `#755023` background + cream `#FFFEF7` text =
**~7.7:1 AAA**; in dark mode gold `#C9A84C` background + deep walnut `#1A1208`
text = **~7.3:1 AAA**. Same shadow + transition, height bumped 48→58px (taller
primary CTA), `min-height: 48`.

**Email input gains `type="email" inputMode="email"` (A2).** Was bare `<input>`
defaulting to `type="text"`, so iOS Safari + Android Chrome didn't surface the
`@` / `.com` shortcut keyboards and browser autofill heuristics misfired.

**Mobile inputs forced to 16px font-size (A3).** Single rule in the mobile
media block (`@media(max-width:719px)`) sets `input/select/textarea` to
`font-size:16px !important` (excluding checkbox/radio/range/color). This kills
the iOS Safari focus-zoom-no-zoom-out trap that was happening on every form
field at 11-13px. Visual change on mobile is barely perceptible (inputs were
already touch-target-sized); desktop is untouched.

**Touch-target minimums on three Login surfaces (A5 + C2).** Dark/Light toggle
26px → 44px (padding 6/14 → 11/18 + minHeight:44). "Forgot password?" and
"Back to Sign In" 28px → 44px (added 10/14 padding + minHeight:44, bumped
font 11 → 12). Meets Apple HIG 44pt + Material 48dp minimums.

**Bilingual:** no string changes — translation symmetry preserved.

**Files:** `src/App.jsx` only. +12 / -6 lines.

**Verification:** `npm run build` clean. Dev-server DOM probe confirmed
button `bgColor: rgb(201,168,76)` / `textColor: rgb(26,18,8)`, email
`type: email + inputMode: email + fontSize: 16px`, toggle/forgot/back
buttons at ≥44px height.

**Out of scope** (next audit ships): emoji-icon → Lucide migration (v0.58),
ClientDetail polish + Settings deep-link + a11y pass (v0.59).

## v0.55.0 — 2026-05-25 — Bug fixes, warm light palette, layout shrinks

Direct response to Mauricio's v0.54 audit feedback. Critical visibility bugs
first, then global light-mode swap, then size shrinks on the worst offenders.

**Critical visibility bug — landing dark mode.** Product pills (Monthly
snapshot / Debt models / Public intake / EN·ES) and footer disclaimer
were `color: PAL.muted` = `#94A3B8` on `#0D1B2A` navy = invisible. Fix:
dark-mode `PAL.muted` bumped to `#CBD5E1`; pills now use `PAL.amberDeep`
(`#EDD594` gold-cream) on dark mode, footer disclaimer uses `PAL.text`
at 0.85 opacity. Light mode unchanged.

**Portfolio calc removed from client-side calc tabs.** Was a duplicate
of the Portfolios section + the standalone `/calculators/portfolio`.
One delete in `ClientCalculatorsTab.calcs[]`.

**Warm cream + amber light palette, app-wide.** `makeLight()` rewritten:
- bg `#F1F5F9` → `#FAF6EC` (warm linen)
- cardBorder + inpBorder `#E2E8F0` / `#CBD5E1` → `#E8DFC6` (cream rule)
- accent default `#2563EB` → `#C9A84C` (gold)
- pos `#059669` → `#047857` (deeper warm green)
- neg `#DC2626` → `#B83227` (warm red)
- warn `#D97706` → `#C9A84C` (collapsed to gold)
- blue `#2563EB` → `#C9A84C` (collapsed to gold for consistency)
- DEF_SETTINGS.lightBg / lightAccent updated to match defaults.
- LIGHT_BG_PRESETS now leads with `#FAF6EC` + `#F7F4EC`. Existing users
  with stored `#E6EBF0` (slate) need to pick the cream preset in
  Settings → Appearance to see the new light palette. App-wide
  components inherit through the theme — every card, button border,
  table rule, and accent on light mode now reads warm.

**Cash Flow Statement waterfall — chart on top of numbers + too big.**
Moved the Waterfall BELOW the inflow/outflow tables (was above).
Shrunk from 160×640 to 110×500. Header above the chart reads
"Cash flow walk" so the placement is intentional, not random. Same
treatment applies on the Complete Report since it reuses
`<CashFlowStatement/>`.

**Asset Map treemap — too big in Financial Statements + Complete
Report.** Heights `200` → `130` on both the asset map and liability
map treemaps. Width kept at 420 — only vertical reduction.

**KPI Sparklines slot — rows too short.** Each row gets 52px min-height
(was 26px sparkline + cramped padding), sparkline width fluid 260px,
height 48px, stroke 1.5px. Reads as actual trend lines now, not flat
ribbons.

**Calculators / Resources / About > Services pages — wasteful grid.**
- Calculators: minmax `180px` → `220px`, card height `136` → `104`,
  switched from centered-vertical column to horizontal row (icon left
  + title + desc right). Cards feel like list items, not posters.
- Resources: similar treatment — minmax `240` → `260`, padding `16`
  → `12 14`, icon moves inline with title.
- About > Services: minmax `540` → `320`. 3-4 cards per row on
  desktop instead of 1-2 with miles of whitespace.

**What's deliberately deferred to v0.56.**
- **Promotions redesign** — needs design system spec; Mauricio noted
  it doesn't match the Claude Design pattern. Will revisit with
  ui-ux-pro-max audit.
- **3D landing animation** — looking at Three.js, Lottie, or
  Spline-iframe options. Bundle-size tradeoff matters.
- **Monthly Report blank space** (Practice Health gauges + Health
  Score radar showing tons of white) — needs layout rethink, not just
  shrinks. Worth a deeper UX pass.
- **Net Income / Bills / Min Pay / Cash Flow KPI strip** spacing —
  related to the global layout issue; will batch with the monthly
  report rework.

**Tooling answers (for Mauricio).**
- "Is there a tool that teaches you to make it look better?" → Yes:
  the `ui-ux-pro-max` plugin is already installed in this Claude
  Code instance. I can invoke it via the Skill tool to audit any
  surface and produce a redesign. Will use it for the v0.56
  Promotions + Monthly Report passes.
- "Should I do that with Claude Design?" → Both work. Claude Design
  generates mockups; ui-ux-pro-max gives me the heuristics + a
  built-in component library and design principles to apply directly
  in App.jsx. They're complementary.
- "Is there a way to add a 3D moving image at the front page?" → Yes,
  several options. Lightest is a CSS-animated SVG mesh gradient (no
  JS). Mid: Lottie JSON animation (~20KB). Heaviest but most
  impressive: Three.js or Spline embed (200KB+). My recommendation:
  start with a CSS-animated gradient mesh, upgrade only if you want
  literal 3D depth. Will spec this for v0.56.

## v0.54.0 — 2026-05-25 — Big batch (PRs 1, 2, 4, 5 partial, 7, 8, 9 + trend tweaks)

Per Mauricio's "finish everything at once and I'll let you know what's wrong"
directive. Seven handoff PRs + lean-line tweaks shipped together. Items
flagged "we might go back on" mean: visual fixes only, no data shape
changes, easy to revert per surface.

**Trend tweaks (post-v0.53 feedback).**
- Stroke width 1.75px → 1.25px on SmoothAreaLine (default; ClientDetail
  trend pair inherits). Lines should feel drawn, not stamped.
- Crossover dot 3.5px → 2.5px, no border (was 1.2px #111827 outline).
  Halo 5px → 4px at 18% opacity.
- Live pulse dot 3px → 2px, no border. Outer pulse animation 5→11px
  radii → 4→9px.

**PR 1 — Landing page rework** (`preview/20-landing-v2.html`).
- Personal credentials stripped: MBA / FPWMP / FL0215 pills + Mauricio
  Hernandez name removed from hero, feature strip, and footer. Hero
  is about the product now.
- Headline replaced with the spec line: *"The dashboard your advisor
  brings to every meeting."* (italic Newsreader 56px, "advisor"
  accent-gold).
- Hero sub reframed: *"A complete picture of your income, bills, debt,
  and savings — updated each session and summarized in a monthly
  report."*
- Feature pills swapped to product capabilities: Monthly snapshot,
  Debt & cash-flow models, Public intake form, EN · ES.
- Theme toggle now actually toggles. `PAL` is gated on `isDark`:
  light = `#FAF6EC` cream / `#F7EFC1` upper-right glow, dark = `#0D1B2A`
  navy / `rgba(201,168,76,0.18)` gold ambient.
- Footer disclaimer reduced to product-only: *"Educational financial
  coaching — not investment, tax, or legal advice."*

**PR 2 — Intake form colors** (`preview/22-intake-colors.html`).
- Light-mode intake palette swapped from cool slate to warm cream +
  amber. 11 hex pairs applied:
  - Page bg `#F8FAFC` → `#F7F4EC`
  - Card border / focus ring `#E2E8F0` / `#CBD5E1` → `#E8DFC6`
  - Accent `#B8860B` → `#C9A84C`
  - Primary CTA fill (via accent), CTA text via theme
  - Error `#DC2626` → `#B83227` (muted for cream bg)
  - Inputs `#F1F5F9` → `#FFFFFF` (cool tint read cold on cream)
- `blue` collapsed to `#C9A84C` so any blue-leaning surface follows
  the gold accent.
- Dark mode untouched. Structure + copy + validation untouched.

**PR 4 — Chart gallery upgrade** (`preview/21-charts-gallery.html`).
- Filter chips above grid: All / Trends / Composition / Ranking /
  Progress / Advanced. Count badge inline per chip. Click-through
  filtering — chart cards re-render to match.
- Density toggle: Comfortable (220px min, 12·14·14 padding) vs
  Compact (180px min, 10·12·12, hides the desc line).
- Modal width 920 → 1100. Grid `auto-fit minmax(cardMin,1fr)` so it
  fans to 4-up at ≥1280 desktop, 3-up middle, 2-up smaller, 1-up
  mobile.
- Sankey card removed from gallery per Mauricio's *"besides the Sankey
  I like the rest"* + HANDOFF *"Sankey removed, 20→19"*. Component
  stays in Dashboard slot options.

**PR 5 — Dashboard row (partial)** (`preview/27-dashboard-row.html`).
- New "Clients · Ranked H-Bars" slot option (`clientsRanked`) —
  Top 8 active clients by net worth, gold on highest then
  blue/orange/grey gradient per spec palette. Treemap version kept
  for "don't delete duplicates."
- Sankey→Waterfall swap on Cash Flow Map **skipped** per Mauricio's
  earlier note: *"besides the Sankey I like the rest."*
- Practice Health gauges kept at current 270° RadialGauge variant.
  Semi-circle variant + status-band color recoloring deferred — the
  current RadialGauge already applies pos/warn/neg by direction +
  thresholds, which is the spec's "color by status" intent.

**PR 7 — CC vs Loan tightened** (`preview/29-cc-vs-loan.html`).
- Full rewrite of the CC/Loan breakdown card on `ClientDebtCalc`.
  Card padding 14px → 12·14, no min-height (grid equalizes).
- Emoji removed. Inline Lucide-style SVG icons (credit-card / landmark)
  in 26px tinted square: CC `#DC2626 @ 28%`, Loans `#5B9BD5 @ 28%`.
- Title `Credit Cards` / `Loans` at 11px bold with mono "N accounts"
  count chip. Total balance gold mono on the right of the h-row.
- 3-up stat strip per card: Avg APR · Min/mo · Util (CC) / DSR (Loans).
  13px mono values, 6×8 padded pills.
- Every account rendered inline as line-items (name + APR + balance).
  Avalanche/snowball target row gold-tinted (`#C9A84C @ 14%`) with
  gold name + APR.
- 4px hairline progress bar at foot. CC gradient
  `linear-gradient(to right, #DC2626, #FCA5A5)`, Loans
  `linear-gradient(to right, #4472C4, #93C5FD)`.

**PR 8 — Portfolio bottom chart** (`preview/30-portfolio-chart.html`).
- Chart height 150 → 220. Y-axis numbers shown (mono, K-shortened).
- Two series:
  1. Nominal: gold solid stroke 2.25px + `#C9A84C @ 40% → 0%` area
     gradient.
  2. Inflation-adjusted (3%): gray `#94A3B8` dashed
     `stroke-dasharray="4 3"` stroke 1.5px, no fill.
- Legend strip beneath chart with both endpoint values inline (mono).
- Tooltip labels series as "Nominal" / "Inflation-adjusted".

**PR 9 — Calc charts (Debt Reduction + Interest)** (`preview/26-calc-charts.html`).
- **New component `CompoundGrowthStack`** (~100 lines, forked from
  `AmortizationArea`). Three-band stacked area: principal `#4472C4`
  constant + contributions `#5B9BD5` linear + interest `GOLD`
  exponential. Crossover marker fires the year interest exceeds
  principal+contributions, gold dot + dashed drop-line + label
  "interest > contributions · yr N". End-of-band labels (P/C/I) on
  the right edge. Honors simple-interest mode (flat interest line).
- **Interest calc** got a `Monthly Contribution` field + the new
  `CompoundGrowthStack` chart wired below the 3-up KPI strip
  (Final value · Of which interest · Real (3% infl)).
- **Debt Reduction calc** got a `PayoffProgression` chart below the
  result panel showing balance dropping to zero given current monthly
  payment. Includes inline summary: "X mo to debt-free · $Y total
  interest." RankedHBars from the spec deferred — standalone calc
  only carries 1 debt so it's a one-bar chart, useless. Mauricio can
  add multi-debt input later or rely on the ClientDebtCalc which
  already has it.

**Translations.** ~30 new EN+ES keys added to support the calc charts,
gallery filter chips, density toggle, CC/loan strip labels, and
clientsRanked slot.

**Verification in dev.**
- Build clean (946KB index, +24KB).
- Build marker `2026-05-25-v0540-big-batch-prs-1-2-4-5-7-8-9`.
- Landing: headline = *"The dashboard your advisor brings to every
  meeting."*, no credential pills, product pills present, theme
  toggle changes the body background.
- Gallery: 20 cards (was 21, Sankey removed), filter chips with
  counts (All 20, Trends 4, Composition 4, Ranking 6, Progress 2,
  Advanced 4), density toggle (Comfortable / Compact) present.
- Calc surfaces: build compiles; DOM probe brittle on the calc page
  click chain (preview tool limitation). Will validate visually
  post-deploy.

**What's deliberately deferred / partial.**
- Practice Health gauge **semi-circle variant** — current 270°
  RadialGauge already handles color-by-status; new geometry deferred.
- RankedHBars on **standalone Debt Reduction calc** — calc only
  carries one debt, single-bar is useless.
- Customization expansion (v0.49 task) to the remaining 18 chart
  families — v0.48 only wired SmoothAreaLine end-to-end. Expanding
  the customization knobs to every chart component will follow as
  Mauricio audits which knobs each chart actually needs.

## v0.53.0 — 2026-05-25 — PR 6 live-pair upgrade (line/bar toggle, screen palette)

First port from `HANDOFF-v0.46.md`. The `● live` trend pair on the
ClientDetail header gets the v0.46 design treatment from
`preview/28-live-pair.html`.

**New components.**
- `PairedBars` — pure-SVG paired bar chart, two series per x-tick
  (10px wide bars, 1px inner gap per pair). Tweens via `useTweenedData`.
- `LiveTrendCard` — wrapper holding line/bar mode state and the
  values row beneath the chart. Mode persists to
  `localStorage["client.{id}.live-view.{templateId}"]` per card per
  client, default `"line"`. Each card carries a 2-button segmented
  toggle (Line · Bar) with gold-tinted active state, 9.5px caps,
  inline SVG icons (line graph / bar chart).

**Values row.** Three cells under each chart, JetBrains Mono tabular
numbers, delta arrows (▼/▲ green/red):
- Cell 1: latest debt/cashflow + % change vs first period
- Cell 2: latest savings/income + % change vs first period
- Cell 3 (right-aligned): crossover month label if curves cross
  during the range, OR net value (cashflow card)

**Palette swap — handoff screen tones.** ClientDetail trend pair
moves from v0.47 `#EF4444`/`#10B981` to the deeper screen palette
locked in HANDOFF-v0.46:
- Debt → `#DC2626`
- Savings → `#059669`
Cash Flow Trend card stays green/gold (cashflow=`#059669`, income=GOLD)
since cashflow is the gold headline on that card.

**SmoothAreaLine internal fixes** (only the live ClientDetail call
site triggers these visibly — gallery + Dashboard slots inherit):
- Both line strokes unified at 1.75px (was 1.5/1.75 split).
- Crossover circle: white outline → `#111827` per spec. Outer halo
  changed from `savingsColor @ 22%` to `GOLD @ 22%` since the
  crossover marker is a brand moment, not a data series.
- Live pulse dot stroke: `#fff` → `#111827`.

**Layout.** Card min-height 200px (head + chart + values row +
borders). Chart height 130px inside LiveTrendCard. The leftControl
slot on card 1 carries the existing range (3m/6m/12m/All) and mode
(All/Rev/Cur) chips — they still apply to both cards' shared
`trendData` upstream.

**Translations.** 5 new EN+ES strings: `liveLbl`, `viewLine`,
`viewBar`, `viewModeLbl`, `crossoverLbl`. Pitfall #9 honored.

**Verification in dev (Amanda Chen).**
- Build marker `2026-05-25-v0530-live-pair-upgrade-pr6` confirmed.
- LIVE badge renders on both cards.
- 2 segmented toggles present, both default to Line.
- Debt stroke color `#DC2626`, savings `#059669`, both at width
  `1.75` — confirmed via SVG gradient stop + path stroke-width
  probes.
- Click "Bar" on card 1: line path count drops to 0, paired-bar rect
  count rises to 8 (4 months × 2 bars). `localStorage` writes
  `client.2.live-view.smoothAreaLine.debtVsSavings = "bar"`.
- Gold crossover marker on the line-mode card has `fill=#C9A84C`,
  `stroke=#111827` — matches spec.

**What's deliberately NOT in this PR.** The handoff line says only
PR 6. Did not port PR 5 (Dashboard row Sankey→Waterfall etc.,
Mauricio said "besides the Sankey i like the rest" — partial port
deferred), PR 7 (CC vs Loan), PR 8 (Portfolio chart), PR 9 (calc
charts), PR 1 (Landing), or PR 2 (Intake colors). One PR per ship.

## v0.52.0 — 2026-05-25 — PDF: portfolio, compare, calc snapshots added

Mauricio reported the downloaded PDF for Miguel Torres was missing
sections. Root cause: the server template (`api/render-report-pdf.js`)
only rendered 9 of the 12 Complete Report sections — Portfolio,
Period Comparison, and Calculator Snapshots had never been ported
from the SPA's print stylesheet. The download path (v0.51) inherited
this gap from the email path.

**Added sections.**
1. **Selected Portfolio** — reads `client.savedPortfolio`. Renders a
   4-up KPI strip (risk profile, expected return, monthly contribution,
   horizon), a projected-future-value card with contributed vs growth
   split, and a holdings table (ticker + alt name + %).
2. **Period Comparison** — reads `client.savedCompare`. Wide table:
   one row per metric, one column per selected month, with a delta
   column on the right. Cell colors green/red on improvement direction
   per metric (income/cashflow/savings/assets/netWorth = up-is-good,
   bills/debt = down-is-good).
3. **Calculator Snapshots** — reads `client.savedCalcs[]`. One block
   per saved calc: header with name + scope + saved date, big-output
   tile row (up to 3), then a 2-column inputs / outputs detail grid.

**Toggle behavior.** Three new keys in the `inc` map (`inc.portfolio`,
`inc.compare`, `inc.calcs`) default ON for `complete` reportType, OFF
for `monthly` and `financial`. Honored via the `reportInclude` map
passed by the frontend (which respects each section's on-screen
toggle on the Complete Report tab).

**Locale.** 12 new strings in both `L.es` and `L.en`: `portfolioHdr`,
`compareHdr`, `calcsHdr`, `portfolioRisk`, `portfolioRate`,
`portfolioMonthly`, `portfolioYears`, `portfolioHoldings`,
`calcInputs`, `calcOutputs`, `snapshotSavedOn`.

**Visual treatment.** All 3 sections use the v0.50 warm-palette
defaults — `.sect-head` amber hairline pattern, JetBrains Mono numbers
with tabular-nums, gold `#C9A84C` total-row top rule, hairline grey
table separators. Emoji stripped from compare/calcs labels before
rendering (`stripEmoji` helper) per HANDOFF-v0.46 lock decision.

**Verification.** Added `preview/_test-pdf-sections.mjs` (17 source
regex checks) and `preview/_test-pdf-render.mjs` (14 end-to-end render
checks against a stub Miguel-Torres-style client). Both green:
- 17/17 source checks pass (L keys, inc defaults, monthly/financial
  override branches, section render gates).
- 14/14 render checks pass — all 3 new headers appear, holdings
  rendered, compare rows + delta column present, calc inputs/outputs
  visible, monthly mode correctly suppresses all 3.
- DOM probe of the rendered HTML in dev server confirmed 11 section
  headers in order: Income, Bills, Debts, Assets, Financial Ratios,
  Cash Flow Statement, Strategy Plan, **Selected Portfolio**,
  **Period Comparison**, **Calculator Snapshots**, Notes & Goals.

`buildPrintHTML` is now exported so future ports can use the same
verification harness without driving the full request handler.

## v0.51.0 — 2026-05-25 — Download PDF replaces in-app Print + handoff files

**Headline.** The "🖨️ Print / Save PDF" button on the three report tabs
(Monthly, Financial Statements, Complete) is gone. In its place: a
"📥 Download PDF" button that hits the same Puppeteer endpoint as
"📧 Email" — so the downloaded PDF is byte-identical to the emailed
artifact. Both paths now produce the v0.50 warm-palette PDF. Per
Mauricio: *"the pdf print shouldn't be print anymore … should be the
same report"*.

**Backend** (`api/render-report-pdf.js`).
- Handler accepts `mode: "email" | "download"` (defaults `"email"` for
  back-compat — existing email modal callers don't pass mode).
- Email mode unchanged: validates recipient, sends via Resend.
- Download mode skips both. Returns the raw PDF buffer with
  `Content-Type: application/pdf`, `Content-Disposition: attachment;
  filename=…`, `Cache-Control: no-store`, and `Content-Length`. Same
  HTML + same `renderPDF(html)` Puppeteer step — only the response
  branch differs.
- `RESEND_API_KEY` no longer a startup blocker for download mode (gated
  behind the `mode === "email"` check).

**Frontend** (`src/App.jsx`).
- New `gaDownloadCompleteReport(payload)` helper next to
  `gaEmailCompleteReport`. POSTs with `mode:"download"`, validates the
  response is `application/pdf`, parses the `Content-Disposition`
  filename, creates a Blob URL, programmatically clicks an anchor, then
  revokes the URL after 250ms.
- New `<DownloadPdfBtn client lang reportType settings t disabled/>`
  component — same gold pill styling as the old PrintBtn, shows
  "⏳ Preparing PDF…" busy state, surfaces server errors inline as a
  red "⚠ …" badge (truncated at 60 chars).
- `<PrintBtn/>` definition kept (unwired) for a future "Print raw data"
  surface — per Mauricio: *"next we can have print page if you want
  to have more raw data instead of those collapsed pdf"*.
- Wired on all three report tabs: MonthlyReportTab,
  FinancialStatementReportTab, CompleteReportTab. Disabled when
  `!hasData` (same gate as the Email button).

**Verified in dev.**
- Button renders with `📥 Download PDF` label on Complete Report tab
  for Amanda Chen.
- Click captured the outgoing payload via stubbed `fetch`:
  `{mode:"download", clientId, reportType:"complete", lang,
  advisorName, advisorEmail, include}`. Authorization Bearer attached.
- Old "🖨️ Print / Save PDF" button gone from the tab — confirmed via
  DOM probe.

**Design-system files imported.** `HANDOFF-v0.46.md` (the 9-PR plan
from the design side) + 11 new `preview/*.html` mockups (20-30 plus
`redesign-index.html`) copied into the working copy. PRs 1, 4-9 are
the upcoming visual ports; PR 2 (intake colors) and PR 3 (email PDF
warm) are partially or fully done. PRs 23 and 24 are pending design's
verdict. Per Mauricio's "don't delete duplicates — add versions"
rule, the v0.48 customization scaffolding is the vehicle for applying
each redesigned chart as a NEW version selectable per template.

## v0.50.0 — 2026-05-25 — Email PDF warm palette (port v0.45 in-app print)

Ported the warm linen + amber + Newsreader story from `preview/18-pdf-reports.html`
and the v0.45 in-app print stylesheet into `api/render-report-pdf.js`. The
emailed Complete Report PDF now reads as a designer-grade document, not
the previous cool slate.

**Palette swap.**
- Page bg `#F1F5F9` → `#FAFAF7` (warm linen)
- Pos green `#10B981` → `#047857` (deeper warm green) for income / cash flow
- Neg red `#EF4444` → `#B91C1C` (deeper warm red) for bills / debt
- New `GOLD_DEEP` `#B8901E` for section headers, KPI gold values, warn
- `MUTED` `#64748B` → `#475569` (slight warm-shift)
- Removed the chunky `#F0FDF4` / `#FEF2F2` / `#EFF6FF` accent stripes on
  summary rows — replaced with the universal `#F8F6EF` cream wash that
  the in-app print uses. Inline `#F8FAFC` table header bands → transparent.

**Layout — claude-design `sect-head` pattern.**
- Section cards lost their `background:#fff` + heavy border + 14px padding.
  Now `background: transparent`, no border, no rounding — content flows in
  the page wash with hairline table rules separating sections.
- Section headers swapped from "11px Plus Jakarta uppercase on gold
  underline" to the claude pattern: 8pt amber `#B8901E`, 0.14em tracking,
  with a hairline `#E2E8F0` rule extending right via `::after`.
- Report title moved out of its white card → centered Newsreader italic
  22px `#0D1B2A`, with small uppercase "snapshot" sub-label.
- Disclaimer slimmed: was a white card with `BORDER` rule; now slim
  italic text with a gold `#C9A84C` top rule, no card.
- Tables get the universal style centrally (was inline per-table): th
  in 7pt Plus Jakarta uppercase with `#CBD5E1` baseline, td body in 8.5pt
  Source Serif with `#F1F5F9` hairlines, totals get a gold top rule.

**KPI strip — compact.**
- Card padding `8px 10px` → `7px 9px`. Radius 6px → 3px (claude design exact).
- Value font now JetBrains Mono 13px tabular, was system 14px.
- Label font now 6.5pt with 0.06em tracking + 700 weight.
- Net Worth slot recolored from pos/neg green/red to amber `#B8901E` (matches
  the in-app print "$28,100" treatment).

**Body type.** 9.5pt Source Serif 4 with line-height 1.45 (was unset).
Matches the in-app print rhythm exactly.

**Verification artifact.** `preview/email-pdf-warm-preview.html` mocks the
new template with stub Amanda-Chen data. Open it locally to audit the
warm palette without triggering an email send. Computed-style probe
confirmed `#FAFAF7` bg, `#C9A84C` brand rule, `#047857/#B91C1C/#B8901E`
KPI value colors. Visual screenshot matches `preview/18-pdf-reports.html`.

## v0.48.0 — 2026-05-25 — Chart customization MVP (SmoothAreaLine slice)

Foundation for self-service chart styling. The Chart Gallery becomes the
control room — edit colors / stroke / labels for a chart, and changes
propagate to every place that chart appears (ClientDetail trend pair,
Dashboard slots, gallery card itself).

**Architecture.**
- New `ChartConfigCtx` React context fed from `settings.chartCustomizations`.
- `useChartConfig(templateId, defaults)` hook merges saved overrides with
  the chart's built-in defaults. Nested merge for `colors{}` and
  `legendLabels{}` so a single override doesn't wipe siblings.
- Each chart instance (gallery card + live use-site + dashboard slot)
  shares a stable `templateId` like `smoothAreaLine.debtVsSavings`. Editing
  in the gallery propagates to every site sharing that ID.
- Customizations persist to `settings.chartCustomizations` → Supabase.

**This slice — SmoothAreaLine family only.** Wired end-to-end:
- `smoothAreaLine.debtVsSavings` — ClientDetail live trend + gallery card
  + Dashboard "Debt vs Savings Trend" slot
- `smoothAreaLine.cashFlowTrend` — ClientDetail live trend + gallery card
  + Dashboard "Cash Flow Trend" slot

**Editor UI.** Every gallery card with a `templateId` gets an "✏️ Edit"
pill (next to Wired/New status). Click → `ChartEditModal` opens with:
- Display Name (text)
- Per-slot color pickers (color input + hex text)
- Line Thickness slider (0.5 → 4px, 0.25 step)
- Legend Labels (text inputs)
- Reset to Default

Changes auto-apply on every form mutation (no Save button — saves on
each color pick / slider drag so you see the chart update behind the
modal). First render is skipped so opening the editor doesn't mark a
template as "Edited" by mounting alone. Customized cards get a gold
border + "✏️ Edited" pill state.

**Remaining 18 chart families** (Donut, Waterfall, Sankey, Treemap,
RadialGauge, Radar5, RankedHBars, BulletChart, Sparkline, NetWorthBridge,
PayoffProgression, AmortizationArea, StackedBars, HeatmapCalendar,
GroupedYoY, ForecastCone, SlopeGraph, Sunburst, Dumbbell) — same pattern,
queued for v0.49 once the MVP feels right.

**Translations.** 10 new keys × EN+ES (chartEdit, chartEdited,
chartEditTip, chartEditHdr, chartEditBlurb, chartEditNameLbl,
chartEditColorsLbl, chartEditStrokeLbl, chartEditLabelsLbl,
chartEditReset). Pitfall #9 honored.

**Verified in dev.** Set debt color → `#FF00FF`, stroke → 3.5; confirmed
gallery card AND ClientDetail live trend both showed magenta gradient
stops + 3.25/3.5 stroke widths. Reset cleanly restored `#EF4444` + 1.5/1.75.

## v0.47.0 — 2026-05-25 — Red/green trends + 14 new Dashboard slot options

Three asks from Mauricio after auditing v0.46's gallery:

**(A) Restored the old red/green palette on the Debt vs Savings live
trend.** In ClientDetail, the `● live` trend pair had drifted to
orange (`#ED7D31`) for debt + gold for savings during the v0.34 chart
overhaul. Per Mauricio's preference and the `preview/17-charts.html`
design vocabulary, debt is now RED (`#EF4444`) and savings is GREEN
(`#10B981`). The Cash Flow Trend card stays GREEN (cash flow) + GOLD
(income) since cash flow is the gold "headline" curve there.

**(B) Gallery now shows BOTH trend variants.** The single generic
SmoothAreaLine card was split into:
- **SmoothAreaLine — Debt vs Savings** (red + green, matches the
  ClientDetail live trend)
- **SmoothAreaLine — Cash Flow Trend** (green + gold, matches the
  ClientDetail cash-flow card)

Total gallery card count: **21** (was 20).

**(C) Dashboard slot dropdown expanded 6 → 20 options.** Previously the
3 Dashboard slot pickers (gear ⚙ on each card + the Chart Gallery
modal dropdowns) could only pick from 6 chart types. Now you can fill
any slot with any chart, each rendered with practice-aggregated data:

1. Income vs Spending *(unchanged)*
2. Cash Flow Map / Sankey *(unchanged)*
3. Net Worth Distribution / Donut *(unchanged)*
4. Clients by Net Worth / Treemap *(unchanged)*
5. Practice Health / 3 Gauges *(unchanged)*
6. Net Worth Bridge *(unchanged)*
7. **Debt vs Savings Trend** — practice debt + savings over time, red/green
8. **Cash Flow Trend** — practice cashflow + income over time, green/gold
9. **Debts by Balance** — RankedHBars of top 10 debts across clients
10. **Practice Cash Flow Waterfall** — income → bills → debt → free
11. **Practice Health (Radar)** — 5-axis radar polygon, aggregate
12. **Net Worth Forecast** — ForecastCone, history + 5-year projection
13. **Asset Allocation (Sunburst)** — Cash/Investments/Property nested
14. **Client Net Worth Δ** — Dumbbell, per-client was vs now
15. **Net Worth Prior vs Current** — SlopeGraph per client
16. **Bills by Category** — StackedBars over months
17. **Bills YoY** — GroupedYoY current year vs prior
18. **Spending Heatmap** — HeatmapCalendar year × month intensity
19. **Debt Payoff Timeline** — PayoffProgression avalanche projection
20. **KPI Sparklines** — 4-row mini-trend strip (NW, debt, savings, CF)

Each new render guards on empty data ("Need 2+ snapshots", "No debt
logged", etc.) so a fresh account with no history doesn't crash.

**Translations:** 14 new slot-label keys + 12 sub-text keys + 5
support keys (cashAssets, propertyLbl, investmentsLbl, noDebtYet,
noIncomeYet) — 31 new strings × EN+ES = 62 total. Pitfall #9 honored.

## v0.46.0 — 2026-05-25 — Chart Gallery (temporary audit section)

Converted the topbar avatar menu's **Chart Settings** entry into a **Chart
Gallery** — a temporary showcase of every chart component the app ships
with, rendered with realistic finance sample data. Lets Mauricio audit
which to keep, swap, or retire before we commit to wiring them
everywhere.

**Gallery contents — 20 components, two-column grid:**

Sparkline · RadialGauge · BulletChart · Donut · Treemap · **Sunburst** ·
RankedHBars · Waterfall · Sankey · SmoothAreaLine · Radar5 ·
**SlopeGraph** · **Dumbbell** · GroupedYoY · StackedBars ·
NetWorthBridge · PayoffProgression · AmortizationArea · ForecastCone ·
HeatmapCalendar.

The three v0.45-built-but-unwired components (Sunburst, SlopeGraph,
Dumbbell) are tagged with an amber `NEW` pill — the other 17 carry a
gold `WIRED` pill. Each card has the component name in JetBrains Mono
caps, a one-line description of what the chart is good for, and the
chart itself rendered with hand-picked Amanda-Chen-style sample data
(net worth ~$28K, debts $285K mortgage / $24K auto / $18K student /
$8K cards, savings climbing $9K → $24K over six months, etc.).

**Dashboard Slot Picker preserved.** Below the gallery, the original
3-dropdown picker (Slot 1 / 2 / 3 → which chart fills each Dashboard
card) is retained as a separate section so the modal still does its
original job. The ⚙ gear on each Dashboard card still works for inline
swaps.

**Translations:** repurposed the existing `chartSettings*` keys (header
"Chart Gallery", new blurb + tip copy) and `menuChartSettings*` (avatar
menu now reads "Chart Gallery / Browse every chart"). Added three new
keys × EN+ES: `chartGalleryWired`, `chartGalleryNew`,
`chartGallerySlotsHdr`.

Modal width bumped 480 → 920 to fit the two-column gallery on desktop.
Mobile falls back to single-column with full-width modal as before.

**This is explicitly temporary** — the goal is to converge on a final
chart vocabulary, then trim the gallery (or remove it entirely) once
that's settled.

## v0.45.0 — 2026-05-24 — Compact print + new charts + standalone calc wires

Three things in one ship: rewrite the print stylesheet to match the claude
design template (compact, multi-section per page), build three new chart
components, and wire charts into the standalone calculators that didn't have
them yet.

**(A) Compact print stylesheet — matches `preview/18-pdf-reports.html`.**
- Removed the v0.41 per-section page-break-before rule. Sections now flow
  naturally — Complete Report goes from ~14 pages to ~6-7.
- Page bg `#FFFAF0` → `#FAFAF7` (warm linen, matches claude design).
- Section headers switched from "amber on gold underline" to the claude
  design `.sect-head` pattern: small uppercase brand-gold (`#B8901E`, 8pt,
  0.14em tracking) with a hairline that extends right via `::after`.
- Section cards lost their amber top rule + heavy border + 22px padding —
  now transparent, no border, 10-12px padding. Much tighter rhythm.
- Body font dropped from 10.5pt → 9.5pt, line-height 1.6 → 1.45.
- Tables: hairline grey borders (was warm orange/yellow), `tr.total` gets
  a thin gold top rule (was 2px amber footer).
- KPI strip cards: white with 1px slate border, 6-8px padding (claude
  design exact match).
- Brand header underline: 2px amber → 1px gold (`#C9A84C`).
- Disclaimer footer: warm card with border → slim text with gold top rule
  + "Page X of Y" treatment.
- Watermark removed — claude design doesn't have one.
- @page margins: 16mm/14mm/18mm/14mm → 14mm all around.
- New `.ga-print-page-force` escape hatch — keeps page-break-before
  behavior for sections that DO want their own page (none use it yet, but
  it's available for "Strategy Plan" or "Compare Report" if needed later).
- Lucide nav SVGs hidden in print via `svg.lucide, [data-lucide]`
  selector (don't render alongside the textual section headers).

**(B) Three new chart components.**
- **SlopeGraph** — Tufte-style two-period comparison. Each category becomes
  one connecting line from "Prior" anchor (left) to "Current" anchor
  (right). Labels + values + % change displayed on either side. Gradient
  per category stroke (lighter left → vivid right). Sorted desc by current
  value. Cleaner than grouped bars for period-over-period.
- **Sunburst** — Nested radial chart. Inner ring = parent groups, outer
  ring = children. Radial gradient per segment (denser at center). Perfect
  for nested allocations: Cash → checking/savings/money-market, Investments
  → 401k/IRA/Brokerage.
- **Dumbbell** — Before/after comparison. Each category gets two dots
  (smaller "was" + bigger "now") connected by a gradient bar. Auto-colors
  green for decreasing (debt paydown!) and red for increasing. Used for
  goal progress or debt-payoff visualization.

**(C) Standalone calculator charts (calculators outside clients).**
- **CarLoanCalc** (`/calculators` → Car Loan tab): new `AmortizationArea`
  chart below the result table, showing the loan balance dropping to zero
  over the selected term. Orange (`#F97316`) brand color.
- **IncomeCalc** (`/calculators` → Income tab): paired card row below the
  result table — left card is a `Donut` showing "Where Each Dollar Goes"
  (Net + Federal + State + SS + Medicare + Pre-tax 401k/HSA), right card
  is a `RadialGauge` for the effective tax rate with a 25% target.
- **HomeEquityCalc** equity tab: `Donut` below the Current Equity result
  showing the home value composition — Total Owed (red) + Borrowable Equity
  (gold) + Locked Equity (green). Center label "Home Value $XXX".

**Pending in v0.46+:** The new chart components (SlopeGraph, Sunburst,
Dumbbell) are built but not yet wired into specific places. Good
candidates: SlopeGraph in the ClientDetail Summary as a "Last Month vs
This Month" comparison, Sunburst as an alternative for the Asset Map
Treemap (toggle option), Dumbbell in the Debt Reduction calc to show
"current balance → projected balance after extra payments."

Plus the v0.44 pending — ~150 in-content emoji swaps (KPI tile labels,
section header bars, modal titles) — still deferred for its own focused
pass.

## v0.44.0 — 2026-05-24 — Remaining chart gradients + Lucide nav icons

Closing the two open polish tracks from the ui-ux-pro-max audit.

**(f) Gradient polish on the 8 remaining chart components** — same pattern as
v0.42, applied to the chart components that didn't get touched there.
- **BulletChart** — horizontal gradient fill (left light → right vivid),
  3px radius, thinner target tick (1.25px), tabular numerals.
- **NetWorthBridge** — vertical gradient per asset/liability band (assets:
  vivid top → fading; liabilities: fading → vivid bottom). Gradient stroke
  on the gold net-worth line. Hairline zero divider.
- **PayoffProgression** — horizontal gradient per debt band (vivid left →
  fading right, mirroring the paydown), thinner outline (0.5px).
- **AmortizationArea** — vertical gradient under curve + horizontal gradient
  stroke. Stroke 1.75→1.5px.
- **StackedBars** — vertical gradient per category segment (vivid top →
  muted bottom). 2px radius. Bar width 28→24, 6px gap → 8px gap.
- **HeatmapCalendar** — switched from opacity-modulation on a single base
  color to RGB-interpolated **color gradient** between `#FEF3C7` (low) and
  the chosen base (high). Subtle stroke on empty cells. 3px radius.
- **GroupedYoY** — vertical gradient per bar (current: vivid → 50%; prior:
  72% → 32%). Legend swatch uses gradient too. Bar width 18→16, 1px gap →
  4px gap. Tabular-numerals labels.
- **ForecastCone** — horizontal gradient on cone fill (vivid at "now" →
  fading at horizon), gradient stroke on history line. Cone fill opacity
  doubled where the "now" boundary lands; projection line dasharray
  tightened (4 3 → 3 3).

**(e) Lucide icon vocabulary — sidebar + avatar menu.**
- `lucide-react` imports added to App.jsx (in its own `icons` chunk).
- New `GAIcon({name, size, color, style})` wrapper. Maps stable keys
  (`dashboard`, `clients`, `settings`, `signOut`, etc.) to Lucide
  components so callers don't import each one. Stroke width 1.6, current
  color by default.
- **Sidebar nav** (desktop + mobile): the `NAV` array now carries an `icon`
  key per item; render path uses `<GAIcon name={n.icon}/>` instead of the
  emoji prefix split. 7 items: LayoutDashboard, Users, FileInput,
  Calculator, Tag, BookOpen, Anchor.
- **Topbar avatar menu**: 11 items now carry icon keys. Profile → ImageIcon,
  Chart Settings → BarChart3, Settings → SettingsIcon, Security → Shield,
  Billing → Receipt, Backup → HardDriveDownload, Archived → Archive,
  What's new → Sparkles, Help → HelpCircle, Sign out → LogOut. Dangerous
  items inherit the menu's `th.neg` color via the wrapper span.
- Verified: 7 SVG icons render in the mobile nav drawer, 12 total Lucide
  SVGs across the page (sidebar + menu + chart filters that already
  rendered).

**Pending for v0.45+:** The bulk of in-content emojis still live in:
KPI tile labels (`💼 Net Income`, `💳 Bills`, `🏦 Total Debt`, etc.),
section header bars (`📊 INCOME`, `💳 BILLS`, etc.), modal titles
(`📅 New Month`, etc.), and calculator tab labels. Those ~150 swaps will
ship in a future focused pass — the foundation (`GAIcon` + import) is in.

## v0.43.0 — 2026-05-24 — Landing page + reduced-motion + bundle splitting

Three of four polish passes from the ui-ux-pro-max audit. The fourth (Lucide
icon vocabulary) is deferred — it touches ~200 emoji prefixes and needs its
own focused pass.

**Landing page (Enterprise Gateway pattern with corner sign-in).**
- Full marketing landing replaces the old centered-card login. Anyone not
  signed in lands here.
- Warm cream `#FFFBEB` bg with two decorative radial-gradient blobs (amber
  + gold) for soft visual depth. Top bar: anchor monogram + italic
  Newsreader wordmark on the left, light/dark toggle on the right.
- Hero (2-col grid): big italic Newsreader headline left ("Your financial
  picture, beautifully clear." / "Tu retrato financiero, perfectamente
  claro."), corner sign-in card top-right (compact, 380px-ish, glass-feel
  border + amber gradient top accent + warm shadow). Both move into a
  stacked column on small screens via `auto-fit` grid.
- Credentials pills row under the headline: MBA, FPWMP, FL · 0215, EN · ES.
- Feature strip (3 cards) — "Where every dollar goes" (Sankey teaser),
  "Health, scored at a glance" (gauges teaser), "Reports that look like
  reports" (PDF teaser). Source Serif 4 body + italic Newsreader subheads.
- Footer with disclaimer + email/site links.
- Sign-in card keeps all existing logic (signin, forgot password, set-new
  password via recovery hash). Errors get `role="alert"`, info messages get
  `role="status"` (a11y fix surfaced by the audit).
- Lang prop added to Login signature so the landing can render EN/ES headlines.

**`useReducedMotion` hook + SMIL-aware animations.**
- New top-level hook reads `window.matchMedia("(prefers-reduced-motion:
  reduce)")` and subscribes to changes.
- `SmoothAreaLine` now conditionally renders the pulsing live-dot SMIL
  `<animate>` elements only when reduced-motion is NOT requested. Static
  dot remains so the data still reads.
- `useTweenedData` passes `0` duration when reduced-motion is set, so
  values snap rather than tween.
- The existing CSS `@media (prefers-reduced-motion)` rule already disabled
  CSS-driven animations — this fills the SMIL gap the audit flagged as HIGH.

**Bundle splitting via vite manualChunks.**
- `vite.config.js` switched from default 1.9MB single chunk to 5 separate
  output files via `manualChunks(id)` function:
  - `index` (App.jsx + everything else) — 848KB (was 1909KB) — **55% smaller**
  - `recharts` — 388KB (loads in parallel)
  - `xlsx` — 331KB (loads in parallel)
  - `supabase` — 196KB
  - `react-vendor` — 189KB
  - `icons` — placeholder for lucide-react (installed, not yet used)
- Cold load smaller, parallel HTTP/2 transfer for the big chunks. Old single
  file blocked render until all 1.9MB downloaded; now ~600KB ungz on the
  critical path before first paint.
- D-1 (single-file architecture for App.jsx) is preserved — splitting is at
  the npm-package boundary, not inside App.jsx.

**ui-ux-pro-max persisted output.**
- `design-system/golden-anchor/MASTER.md` saved to the working folder
  (`--persist` flag). 207-line source-of-truth for future sessions. Locks in
  the warm-cream + amber palette, Calistoga/Inter/JetBrains Mono pairing,
  Data-Dense Dashboard pattern. Page-level overrides go in
  `design-system/golden-anchor/pages/<name>.md`.

**Lucide-react installed but not yet used.**
- `npm install lucide-react` ran (added to dependencies + isolated chunk).
- Icon vocabulary swap (~200 emoji prefixes → `<Icon name="..." />` SVG)
  deferred to v0.44 — it's a big focused pass that needs its own ship.

## v0.42.0 — 2026-05-24 — Gradient chart polish: thinner strokes + modern look

Per Mauricio's direction ("gradient colors instead of static, thin line graphs
with a more modern approach"). Every flat fill across the 9 most-visible chart
components is now a gradient; every heavy stroke is now thinner. Visual style
shift away from chunky/saturated toward modern fintech (Linear / Robinhood /
Wealthfront aesthetic).

**Per-component changes (all `useSvgId`-scoped gradients in `<defs>`):**

- **Donut** — radial gradient per slice (denser at outer rim, lighter toward
  center). Dropped the drop-shadow filter. Thin 0.5px slice stroke at 18%
  opacity for definition without weight. Tabular numerals on center value.
- **Waterfall** — vertical gradient per bar (light top → vivid bottom for
  positives, mirrored for negatives). Bar width capped at 36px (was 48) with
  10px gap (was 8). Dropped drop-shadow. Connector lines hairline 0.75px.
  Labels in 0.04em letter-spaced uppercase muted.
- **SmoothAreaLine** — dual area gradients (savings AND debt now both fade).
  Stroke widths trimmed: savings 2.5→1.75, debt 2→1.5. Stroke uses a left-to-
  right gradient (lighter at the start, fuller at the right). Glow filter
  blur reduced from 2.5 to 1.4 — softer halo. Crossover and live dots
  swapped from dark navy stroke to white stroke + outer halo ring.
  Gridlines lighter (opacity 0.14, was 0.22).
- **Sankey** — bolder color-transition bands (left-tone → mid-fade → right-
  tone, opacities 0.85/0.55/0.85, was flat 0.6). Node rects now vertical
  gradients (top vivid → bottom 65%). Dropped the glow filter entirely on
  node rects.
- **Treemap** — diagonal gradient per tile (top-left bright → bottom-right
  muted, opacities 0.78 → 0.42). 4px corner radius (was 3). Thin 0.5px tile
  outline. Drop-shadow filter removed.
- **RadialGauge** — diagonal gradient on the arc fill (light start → dense
  end). Track stroke 6→4px and 0.55→0.4 opacity (subtler). Fill stroke 6→5px.
  Target marker thinner (1.5→1.25px).
- **Radar5** — radial gradient on the polygon fill (center 0.42 → edge 0.1).
  Ring lines thinner (1→0.75px) and lighter (0.6/0.3 → 0.45/0.2 opacity).
  Polygon stroke 1.5→1.25px. Dots get halo ring + smaller core.
  Axis labels in uppercase letter-spaced for editorial feel.
- **RankedHBars** — horizontal gradient per bar (left 0.55 → right 0.95).
  3px corner radius (was 2). Tabular-numerals on value column.
- **Sparkline** — area gradient (top 0.35 → bottom 0). Stroke 1.5→1.25px.
  End dot 2→1.75px.

**ui-ux-pro-max alignment.** Pulled the "SaaS Mobile Boutique" pairing —
Calistoga + Inter + JetBrains Mono — our existing stack already covers this
(Newsreader + Plus Jakarta Sans + JetBrains Mono = same shapes/feel).
Applied recommendations: `tabular-nums` everywhere on values, `letter-spacing
0.04em` uppercase on labels, gridline contrast dropped below 0.2 opacity,
gradient fills replacing flat fillOpacity, thinner strokes (1.25-1.75px
range) as the new default.

**Verified.** 12 gradient elements detected in the live DOM on the dashboard
after login. No new console errors. Build clean.

**Pending for v0.43+.** Landing page with corner sign-in (deferred per
Mauricio's redirect — focus was charts first). Remaining chart components
not touched in this pass (BulletChart, NetWorthBridge, PayoffProgression,
AmortizationArea, StackedBars, HeatmapCalendar, GroupedYoY, ForecastCone) —
apply the same gradient pattern next iteration.

## v0.41.0 — 2026-05-24 — Premium print PDF: warm palette + per-section pages

Print/Save PDF now produces a designer-grade document. Warm cream palette
(matching the intake-form aesthetic we lost in v0.33's gold-pinning), each
report section forced onto its own page, and a branded header + footer on
every Complete Report. Triggered via the existing `Print / Save PDF` button
— uses browser print + `@media print` CSS, no new server roundtrip.

**Warm palette overhaul (`@media print` in App.jsx ~line 5952).**
- Page background: `#FFFAF0` (floral white / warm cream).
- Section card surface: `#FFFFFF` with a `4px solid #F59E0B` (amber) top
  rule and `1px solid #FDE68A` (light yellow) border. Each card looks like
  a "report page."
- Section headers: `#B45309` (warm amber) on a `#F59E0B` underline — same
  Plus Jakarta Sans uppercase shape, new warmer color.
- Big report title: `#451A03` (deep walnut) in Newsreader italic, 24pt.
- Tables: warmer borders (`#FED7AA` heads, `#FEF3C7` rows), `#78350F`
  column headers, `#1F2937` cells, `#F59E0B` 2px footer rule.
- Brand mark wordmark: `#B8860B` italic Newsreader, larger (11pt → from 9pt).
- Brand sub-label and meta info shifted from cool slate to warm `#92400E` /
  `#78350F` so everything reads as one warm document.

**Per-section page breaks.**
- `RS` inline component in `FullReport` now adds `ga-print-page` so every
  section card (Income / Bills / Debt / Accounts / EF / Investment Allocation
  / Financial Ratios / Trends / Portfolio Projection) prints on its own page.
- Same wrapper added to the Financial Statements outer block, Compare
  Report, Calculators Snapshots, Notes & Goals, and Strategy Plan.
- Total: ~14 print pages on a typical Complete Report (was 1-2 long-scroll
  pages before).
- `.ga-print-page:first-of-type` keeps the cover (KPIs + first section) on
  page 1 — no leading blank page.

**Print-only branded header (new on Complete Report).**
- Anchor monogram + Golden Anchor wordmark left, client name + "As of"
  date + advisor right. Border-bottom in amber. Hidden on screen via
  `@media screen { .ga-print-header { display: none } }`.

**Print-only disclaimer footer + watermark.**
- Cream-bg disclaimer card with the standard FPWMP/FL0215 fine print at
  the end of the report, EN/ES.
- `.ga-print-watermark` fixed-position "⚓ Golden Anchor · Confidential"
  at the bottom-right of every printed page in 7pt amber italic.

**Why this matters.** When advisors save the on-screen Complete Report as a
PDF (via the browser print dialog), they now get the same designer-grade
output as the emailed PDF — same warm palette, same per-section pagination,
same brand voice. No extra clicks. Server-side email PDF still uses its own
template (`api/render-report-pdf.js`) which got chart embeds in v0.40.

**Pending for v0.42+.** Tie the new chart picker to PDF chart selection (so
slot picks the user makes in Settings flow through to both screen + print +
email). Server-side palette alignment (the email PDF still uses cool slate
`#F1F5F9`; consider porting the warm palette there too).

## v0.40.0 — 2026-05-23 — PDF chart embeds (server-side SVG)

Charts now render in emailed PDFs. The render is server-side (Puppeteer in the
existing `api/render-report-pdf.js`, per D-34 — self-contained print HTML, not
SPA-driven). Four new pure-SVG-string functions ported from the React chart
components, then wired into the existing section blocks.

**New server-side SVG functions in `api/render-report-pdf.js`:**
- `waterfallSVG(segments, w, h)` — stepped Income → −Bills → −Debt Min → Net
  with dashed connectors. Same algorithm as the React `Waterfall`.
- `treemapSVG(data, w, h)` — squarified treemap with proportional tiles,
  labels and values inside, fillOpacity tuned to the lighter v0.38+ style.
- `radialGaugeSVG(value, max, target, label, sublabel, color, size, direction,
  thresholds)` — 270° arc with optional target marker, threshold-based color
  shift (good/warn/bad). Same shape as the React `RadialGauge`.
- `radarSVG(axes, values, target, size)` — 5-axis polygon with ring grid +
  optional target overlay. Same shape as the React `Radar5`.

Plus `ACCT_COLORS` and `LOAN_COLORS` constants matching App.jsx's
`ACCT_META.c` / `LOAN_META.c` so PDF colors stay consistent with the live app.

**Wired into PDF sections:**
- **Cash Flow Statement** — `waterfallSVG` at the top of the section showing
  Income → −Bills → −Debt Min → Net flow. Conditional on `agg.income > 0`.
- **Financial Ratios** — new row above the existing ratios table: 3 Radial
  Gauges (DSR / Savings Rate / EF Months) side by side, paired with a 5-axis
  Radar (Health Score) on the right. Same metrics + same target lines as the
  on-screen `SummarySection`.
- **Assets** — `treemapSVG` Asset Map + Liability Map paired side by side
  above the existing Assets table. Same colors as ACCT_META / LOAN_META.

Verified the new SVG functions produce the expected output (4-bar waterfall,
3-tile treemap, gauge with label, 6-polygon radar = 4 rings + target + value).

**Section toggles still respected.** `inc.financialRatios`, `inc.cashFlow`,
`inc.assets` still gate visibility in `client.reportInclude`. Defaults
unchanged.

**Pending for v0.41+:** Server-side Sankey, NetWorthBridge, PayoffProgression
SVGs. Picker entries that map ChartSettings to which PDF charts appear.
Per-section pickers (ClientDetail summary slots). Remaining calculator chart
wires (HomeEquity, IncomeCalc, SavingsCalc, etc).

## v0.39.0 — 2026-05-23 — Dashboard chart picker + Chart Settings in topbar menu

Two new ways to pick which charts the Dashboard shows.

**Per-slot gear on each Dashboard card.** Tiny ⚙ button in the top-right of
every Dashboard chart card. Click → dropdown lists all 6 chart options, the
current one is checked. Pick a different chart → that slot swaps immediately
and saves to `settings.dashboardSlots`. Persists across reloads.

**"📊 Chart Settings" entry in the topbar avatar menu.** New item between
"Profile" and "Settings". Opens a modal with 3 dropdowns (one per dashboard
slot), each listing the available charts. Same backing state as the gear
buttons.

**Dashboard refactored to slot-driven render.** The hardcoded 3-col grid is
gone — each slot now reads from `settings.dashboardSlots: [string, string,
string]` (default `["incomeVsSpending", "sankey", "netWorthDonut"]`) and
dispatches to a chart catalog. Adding new chart options is a one-entry
addition to `dashCharts` + an entry in `dashChartOptions(t)`.

**New chart options available for Dashboard slots:**
- `incomeVsSpending` (existing — Recharts composed bar+line)
- `sankey` (existing — v0.37 aggregate cash flow Sankey)
- `netWorthDonut` (existing — net worth tier donut)
- **`clientsTreemap`** (new) — Treemap with each client as a tile, sized by
  net worth, colored by tier
- **`practiceHealth`** (new) — 3 RadialGauges side by side (aggregate DSR,
  Savings Rate, EF Months across all active clients)
- **`netWorthBridge`** (new) — Assets above zero / liabilities below per
  monthly snapshot, net worth line on top. Requires 2+ snapshots.

**Settings schema addition.**
- `settings.dashboardSlots: ["incomeVsSpending","sankey","netWorthDonut"]`
  added to `DEF_SETTINGS`. Backward compatible — older accounts inherit the
  default until they pick something.

**31 new translation keys × EN+ES = 62 entries.**
- `menuChartSettings`, `menuChartSettingsSub`, `chartSettingsHdr`,
  `chartSettingsBlurb`, `chartSettingsTip`, `dashboardSlotLbl`,
  `changeChart`, `cashFlowMapHdr` (override v0.37 default),
  `clientsByNetWorthHdr/Sub`, `practiceHealthHdr/Sub`,
  `netWorthBridgeHdr/Sub`, `needMoreSnapshots`, `savingsRateLbl`,
  `efMonthsLbl`, `healthScoreHdr`, `srAxisShort/efAxisShort/dtaAxisShort/cfAxisShort`,
  `dsrSubLbl`, `debtRankHdr`, `payoffTimelineHdr`, `amortizationHdr`,
  `pitiBreakdownHdr`, `dtiGaugeHdr`, `forecastConeHdr`, `liabilityMapHdr`,
  `debtFree`, `done`.

**Still pending.** Per-section picker (Client Detail summary slots). PDF
chart embeds. Sparkline strips on KPI tiles. Bills/Savings section charts.
HomeEquity + Income + Savings + Interest + Portfolio calculator charts.
The basic dashboard picker covers the visible "change my dashboard charts"
request — sections/PDFs/remaining calcs come in v0.40+.

## v0.38.0 — 2026-05-23 — Charts wave 2: full component library + wires across calcs/sections

Per Mauricio's direction ("implement everything in one go, design review after").
Built 12 new chart components and wired them into the highest-traffic surfaces.
Visual style intentionally lighter than v0.37 (50-70% fill opacity, 1.5-1.75px
strokes, no drop-shadow filters) — design review phase will polish further.

**New chart components (12, all pure-SVG, all tweened via `useTweenedData`).**
- `RadialGauge` — 270° arc gauge with target marker, threshold-based color
  shift (good/warn/bad). Used for DSR, savings rate, EF months, DTI.
- `RankedHBars` — sorted horizontal bars with label left, monospace value
  right. Used for debt sort, bill sort, income streams.
- `BulletChart` — Tufte-style: bg range bar + actual + target tick. For
  goal progress.
- `Sparkline` — minimalist trend line with optional area fill. For KPI tiles.
- `Radar5` — 5-axis polygon with rings + optional target overlay. For
  Financial Health Score across DSR / Savings Rate / EF / D-to-A / Cash.
- `NetWorthBridge` — stacked area: assets above zero (gold/green tones),
  liabilities below zero (red/orange), gold net-worth line on top.
- `PayoffProgression` — stacked area projecting debt balances dropping to
  zero given current monthly payments. Avalanche-ordered extras.
- `AmortizationArea` — single-curve area showing loan balance over term.
  For car loans + home affordability.
- `StackedBars` — vertical stacked bars over time across categories. For
  bills by category over months.
- `HeatmapCalendar` — year×month grid, opacity intensity by value. For
  spending heatmap.
- `GroupedYoY` — side-by-side bars: current year vs prior year per category.
- `ForecastCone` — solid history line + dashed projection + widening
  confidence band. For retirement / net worth projection.

**Wires (5 high-impact locations).**
- ClientDetail Monthly Report's `SummarySection`: new health row above the
  existing donut+area pair. Three `RadialGauge`s (DSR 60% scale w/ 36%
  target, Savings Rate 40% scale w/ 20% target, EF Months 12 scale w/ 3
  target) + a `Radar5` Financial Health Score with 0.8 target overlay.
- `CashFlowStatement`: a `Waterfall` (Income → −Bills → −Debt Min → Net)
  above the existing two-column inflows/outflows tables. Total bar in gold.
- `AssetsLiabilitiesTab` (Balance Sheet): the v0.37 single Asset Map card
  is now a paired Asset Map + Liability Map. Both `Treemap`s, side by side,
  using `LOAN_META[type].c` for loan colors and red for credit cards.
- `ClientDebtCalc`: two new chart cards below the payoff summary —
  `RankedHBars` of selected debts (color-coded by APR severity for cards,
  loan-type color for loans) and `PayoffProgression` showing the timeline
  to zero given current min payments + extras.
- `ClientCarLoanCalc`: `AmortizationArea` of the loan balance over the
  selected term. Color-tied to vehicle loan orange (#F97316).
- `AffordabilityCalc`: paired `Donut` (PITI breakdown — P&I / Tax / Insurance
  / HOA with totalPITI centered) + `RadialGauge` (DTI ratio against 36%
  target).
- `RetirementCalc`: a `ForecastCone` (base case projection ±18% confidence)
  appended below the existing three-scenario Recharts chart. Shows the same
  base-case story with explicit uncertainty.

**No behavior changes to anything else.** No new translation keys yet —
fallback strings render inline. Calculator output math is unchanged. The
chart picker setting (per Mauricio's plan) is deferred to v0.39 along with
remaining calc/section wires (Bills stacked bars, Savings bullet charts,
HomeEquity stacked breakdown, Income calc sankey).

**Why no polish pass.** Mauricio's call: "let me ship everything, I'll run
it through design review and they'll recommend visual changes." So this
ship is breadth-first. Visual refinement is the next phase.

## v0.37.0 — 2026-05-23 — Charts wave 1: animation foundation + Sankey + Treemap

First ship of the major chart-overhaul plan Mauricio asked for. Goal: stop the
"static picture" feel of the v0.34/v0.35 pure-SVG charts, and start building
the financial-industry vocabulary (Sankey, Treemap, Waterfall, etc.) so the
app reads as professional/wow-tier without complicating the math.

**Animation foundation.**
- New `useTweenedData(target, duration?)` hook (App.jsx near line 784). Tweens
  any numeric value, array, or object-of-numbers from current state to a new
  target over ~800ms with easeOutCubic. Shape changes (different array length,
  new keys) snap instantly — only same-shape transitions tween. Used by every
  pure-SVG chart.
- Helpers: `_easeOutCubic`, `_lerpAny` (number/array/object), `_sameShape`,
  `useSvgId` (collision-free `<defs>` IDs for filters/gradients).

**Existing charts now animate + glow.**
- `Donut` (line 850-ish): slice angles tween between states. Soft drop-shadow
  filter for subtle depth.
- `Waterfall` (line 910-ish): bar heights tween. Same drop-shadow on the bar
  group.
- `SmoothAreaLine` (line 980-ish): two-curve area chart now tweens values.
  Gold glow filter under the savings stroke. Pulsing dot at the rightmost
  point when the last label contains "Now" / "▶" — visualizes "this is the
  live current value" without a separate badge.

**New chart components.**
- `Sankey` (~150 lines, single function): pure-SVG flow diagram. Takes nodes
  (each with `layer` column index) + links (`from`, `to`, `value`). Renders
  proportional bands with gradient transitions between source and sink
  colors. Link widths tween between states.
- `Treemap` (~80 lines): pure-SVG squarified treemap. Each leaf becomes a
  proportional rectangle, sized by `value`. Aspect-ratio-optimized for
  readable labels. Drop-shadow for depth. Values tween between states.

**New chart placements (v0.37 only — more in v0.38+).**
- Dashboard: 3-column row now — Income vs Spending + **Cash Flow Sankey** +
  Net Worth Donut. Sankey aggregates active clients (income → bills + debt
  min + cash flow). Grid uses `minmax(0,Nfr)` so the donut column can't push
  the others narrow. Donut shrunk to 130 (desktop) / 120 (mobile) for the
  new tighter slot.
- AssetsLiabilitiesTab (Balance Sheet): new **Asset Map** Treemap card
  between the 4-KPI row and the four current/non-current tables. Tiles
  sized by current value; colors from `ACCT_META[type].c` with property and
  investment defaults.

**Translation keys added (6 keys × EN+ES = 12 entries).**
- `cashFlowMapHdr` / `cashFlowMapSub` / `noFlowYet` for the Dashboard Sankey
- `assetMapHdr` / `assetMapSub` / `noAssetsYet` for the Balance Sheet Treemap

**Behavior of existing charts is unchanged besides animation.** Recharts
ComposedChart on the Dashboard (Income vs Spending) and the Recharts PieChart
in SummarySection's "Where Income Goes" still animate via Recharts'
`isAnimationActive`. Net Worth Distribution donut on dashboard still uses
the in-house pure-SVG `Donut` — now with the tween.

**Why this is split into a series.** v0.37 ships the foundation + the two
showcase components (Sankey, Treemap). v0.38 rolls charts into every
calculator. v0.39 hits the section pages (Bills, Debt, Savings, Balance
Sheet pairing, Cash Flow Statement). v0.40 adds health charts (radial
gauges, radar). v0.41 adds patterns (heatmap, YoY, debt payoff progression,
forecast cone). v0.42 adds the chart-picker setting + PDF embeds + table
toggles. The plan is to ship all charts first so Mauricio can prune live.

## v0.36.0 — 2026-05-23 — Doc hygiene + dead-code cleanup (autonomous audit pass)

Surfaced during an autonomous audit while Mauricio was away. All fixes are no-behavior-change, no new features, no migrations.

**Translation hygiene.**
- 6 duplicate declarations removed (3 keys × EN+ES): `totalLbl` (kept "Total" / dropped "total"), `partnerEmailLbl`, `close`. Each was silently overwriting the other; pattern is the same one we dedup'd in v0.27.0's hygiene pass.
- 11 missing keys added EN+ES, closing 22 D-3 (EN/ES symmetry) violations the audit found: `personalInfoHdr`, `howHeardLbl`, `howHeardPlaceholder`, `stepIntakeHelpV2`, `taglineSecuring`, `savedToast`, `savedClientToast`, `savedClientAddedToast`, `archivedToast`, `restoredToast`, `deletedToast`. ES users were seeing English fallbacks for all of these. Now they don't.

**Dead code removed.**
- `IntakeFormV2` function (App.jsx ~3543–3606, ~64 lines). Shipped briefly in v0.30.0 as the simplified 12-totals intake form, then replaced in v0.31.0 by the restored advisor-style `IntakeFormBody` + inline Contact block. Never instantiated since. Replaced with a 7-line comment block explaining the history. `IntakeFormSection`, `IntakeCurrencyInput`, `IntakeFieldLabel` (used directly by the inline Contact block) all stay.
- Misleading "v2" comments at App.jsx:3535 and :3642 cleaned up.

**Version-footer hygiene.**
- Three hard-coded `"v0.28.0"` fallback strings in App.jsx (TopBar avatar menu sub-label, footer wordmark, regex-fallback) bumped to `"v0.36.0"`. These only render when the build-marker regex fails — cosmetic but worth keeping current.

**WHATS_NEW_ENTRIES backfilled.**
- 7 new entries prepended: v0.29.0, v0.30.0, v0.31.0, v0.32.0, v0.33.0, v0.34.0, v0.35.0. Each is a user-facing 3-5 bullet summary (no internal architecture chatter). The in-app "What's new" page on the avatar menu now reflects the last 10 versions.

**AGENT.md + CLAUDE.md refresh.**
- AGENT.md §2 line count bumped (~4,500 → ~5,270). §3 current version bumped to v0.36.0. Per-version summary table extended with rows for v0.29-v0.35.
- CLAUDE.md session handoff "Currently shipped" line bumped from v0.26.0 → v0.36.0. Recent-versions table rewritten with 10 newest entries. Pending-work section rewritten from the v0.26.0 leftover audit list (all closed by v0.27.0) to the actual current backlog: Phase 5 chart components remaining, Phase 6 emoji-strip refactor, Phase 6 three-up KPI print strip.
- CLAUDE.md file-map row for AGENT.md/SKILL.md/WORKPLAN cleaned up — now correctly references `WORKPLAN-archive-2026-05.md`.

**Build marker:** `2026-05-23-v0360-doc-hygiene`. App.jsx +~65 lines (WHATS_NEW backfill) / -78 lines (IntakeFormV2 removal). translations.js -6 lines (dupes) / +11 EN + 11 ES. AGENT.md / CLAUDE.md / CHANGELOG.md / App.jsx footer string updates. No new dependencies, no API changes, no DB migration. D-1, D-3 (now satisfied for the 11 prev-missing keys), D-7, D-8, D-17 all preserved.

**Smoke tests:** Hard-refresh https://finance.goldenanchor.life — build marker should be `v0360-doc-hygiene`. Open the avatar menu → "What's new" should show v0.35.0 at the top with the 10 most-recent versions. Spanish users (EN/ES toggle in TopBar) should see Spanish for the previously-missing keys (e.g. Settings page "Información personal" instead of "Personal information").

## v0.35.1 — 2026-05-23 — Hotfix: fmtSSN ReferenceError on public intake

Audit-discovered bug. `fmtSSN` was defined as a local `const` inside the `SSNInput` component body, but the structured intake form (`IntakeFormBody` at App.jsx:3379 and :3385) referenced it from the outer scope via a defensive `fmtSSN?fmtSSN(e.target.value):e.target.value` pattern. JavaScript treats `fmtSSN` as a bare identifier read — so the *check* itself threw `ReferenceError: fmtSSN is not defined` on every keystroke into the prospect's SSN field on public intake step 4.

**Fix:** hoisted `fmtSSN` to module scope alongside `fmtPh` (App.jsx:140). `SSNInput` now picks up the hoisted version automatically. Two-line change.

**Build marker:** `2026-05-23-v0351-fmtssn-hotfix`. No new components, no API/DB changes.

## v0.35.0 — 2026-05-23 — Phase 5 (Donut + Waterfall) + Phase 6 (per-topic page breaks)

Two charts from the Phase 5 library plus the first Phase 6 print-output upgrade beyond what v0.21.0 already did.

**Phase 5 — Donut.** New top-level pure-SVG `Donut` component. Configurable size, inner radius, padding angle (~1.5°), optional center label + value, optional empty-state dashed-ring placeholder. **Replaces the Recharts PieChart/Pie/Cell combo on the Dashboard's "Net Worth Distribution" donut.** The center overlay (Total Net label + tabular-num currency value) is preserved; the only visible difference is sharper anti-aliasing and that the donut is no longer wrapped in a `ResponsiveContainer`. Component lives next to `SmoothAreaLine` (added in v0.34.0) so future donuts (e.g., the "Where Income Goes" pie on Monthly Summary, the Investment Allocation pie on Strategy Plan) can drop it in without another Recharts import.

**Phase 5 — Waterfall.** New top-level pure-SVG `Waterfall` component for cash-flow rendering — `Income → −Bills → −Debt → +Save → Net`. Positive segments use gold, negative segments use orange (`#ED7D31`), the final "Net" total bar uses full-height gold from baseline. Dashed connector lines between consecutive bars to show cumulative running total. JetBrains Mono mini-labels above each bar with the delta in thousands. Not wired into any view in this commit — component is ready for the Monthly Snapshot or Cash Flow Statement when we want to swap the existing table-driven layout.

**Phase 6 — Per-topic page breaks in `FullMonthView`.** Each of the 6 major report sections (Income, Bills, Debt, Savings, Custom Assets, Notes) is now wrapped in `<div className="ga-print-page">`. The existing `@media print` CSS rule from v0.21.0 turns that class into a hard `break-before: page` so printed Monthly Reports / Complete Reports get one topic per page instead of the current dense single-page squeeze. Screen rendering is unchanged — the class is a CSS no-op outside print.

**Deferred to v0.36.** Emoji-strip in print routes (the existing `.ga-emoji` rule from v0.21.0 is in place as a no-op safety net, but applying it requires wrapping ~200 emoji prefixes across report headers in `<span class="ga-emoji">…</span>`). Will do that as a focused refactor.

**Build marker:** `2026-05-23-v0350-donut-waterfall-print-breaks`. App.jsx +~100 lines (Donut, Waterfall components + per-topic page-break wrappers in FullMonthView) / -16 lines (Recharts donut swap). No new deps, no API changes, no DB migration.

**Smoke tests:**
1. Open Dashboard — Net Worth Distribution donut renders as crisp SVG with `0 0 150 150` viewBox and the same center "TOTAL NET / $237K" overlay. Slices use the same red/amber/blue/gold tier colors.
2. Open any client → Monthly Report → 🖨️ Print/Save PDF — preview shows Income on page 1, Bills on page 2, Debt on page 3, Savings on page 4, Custom Assets on page 5, Notes on page 6.
3. Browser print preview should still respect the branded `.ga-print-header` from v0.21.0 on every page.

## v0.34.0 — 2026-05-23 — Phase 5 charts: SmoothAreaLine (replaces 3 Recharts AreaCharts)

First chart from Claude Design's Phase 5 charts library. The two-curve area chart that's been the canonical pattern in the design spec ("savings gold, debt orange, soft gold gradient under savings, crossover dot marker") now ships as a pure-SVG component and replaces the existing Recharts AreaChart in three locations.

**Component.** New top-level `SmoothAreaLine` in App.jsx — pure SVG, no third-party chart lib for this surface. ~80 lines. Catmull-Rom-to-cubic-Bezier conversion produces smooth curves through the data points. Features:
- 4 horizontal gridlines with JetBrains Mono Y-axis tick labels (e.g. `0`, `17K`, `33K`, `50K`) — nice-rounded max via 1/2/2.5/5/10 step ladder.
- Soft vertical gold gradient (32% → 2% opacity) under the savings/primary curve only.
- Two stroke curves on top of the fill — gold for primary (savings/cash flow), orange (`#ED7D31`) for the comparison series.
- X-axis labels stripped of year suffix (e.g. `Mar '26` → `Mar`).
- Crossover marker — gold dot with navy 1.5px ring placed at the first place the curves cross.
- Responsive via SVG `viewBox`; no `ResponsiveContainer` wrapper needed.
- Configurable `debtKey`/`savingsKey`/`debtColor`/`savingsColor` props for reuse on the Cash Flow Trend chart.
- Empty/single-point fallback renders "Need at least 2 months of data" placeholder.

**Replacements wired in this commit.**
- `SummarySection` (App.jsx:794) — Monthly tab's small Debt vs Savings trend.
- `ClientDetail` main view (App.jsx:2954) — the prominent "● live · 3m 6m 12m" Debt vs Savings AND Cash Flow trend pair on every client's overview page. Range/mode pills tinted gold to match.

**What stays on Recharts.** All other charts in the app (Dashboard composed Income vs Spending bar+line, Net Worth Distribution donut, Year Comparison sparklines, Portfolio Projection area, etc.) still render with Recharts. Only the canonical SmoothAreaLine pattern was swapped out — per the Phase 5 plan that explicitly carves out Recharts for the larger composed surfaces.

**Coverage on each render:** dim-22% gridlines, JetBrains Mono labels, gold-gradient fill, gold crossover dots. The Phase 5 spec rule "no value labels on bars or data points; totals live in tooltip or summary table" is honored — totals moved to small legend pills next to the section title where the chart used to show on-bar values.

**Build marker:** `2026-05-23-v0340-smooth-area-line`. App.jsx +~80 lines (new component) / -10 lines (Recharts replacements). No new deps, no API changes, no DB migration. D-1, D-8 (Recharts allowed for the surfaces that still use it) preserved.

**Smoke tests:**
1. Open any client → main view shows two side-by-side gold-and-orange SVG curve charts (Debt vs Savings + Cash Flow Trend) with `0 / 17K / 33K / 50K` style Y-ticks on the left and month abbreviations on the X-axis.
2. Range pills "3m / 6m / 12m / All" + filter pills "All / Rev / Cur" both tint gold when active.
3. If a client has only one snapshot, the chart shows the "Need at least 2 months of data" placeholder instead of an empty axis frame.
4. Where the two curves cross, a gold dot with a thin navy ring appears at the intersection.

## v0.33.0 — 2026-05-23 — Public intake gold-palette override

Tiny but visible fix. The restored advisor-style intake form (IntakeFormBody, brought back in v0.31.0) used `th.accent` and `th.blue` from the public intake's `synthTheme`. In light mode those resolved to `#B8860B` (dark goldenrod) and `#2563EB` (blue) — reading on screen as a brown/blue mix that clashed with the gold-and-cream design Mauricio wants on the prospect-facing pages.

`synthTheme` now hard-codes `accent` and `blue` to `GOLD` (`#C9A84C`) regardless of the user's light/dark preference. The structured intake sections (Income, Bills, Debt, Assets) now read as gold throughout — totals, "+ Add row" buttons, the Avalanche/Snowball strategy pills, KPI tile borders, and per-row sort indicators all switch over. Semantic colors stay intact: `pos` (green for positive cashflow), `neg` (red for debt), `warn` (amber for promo expiry).

Side-effect: hardcoded line-item icons like `ACCT_META.checking.c` (`#3B82F6`) and `LOAN_META.student.c` (`#3B82F6`) are still blue because they're constants outside the theme system. They show up as small icons next to individual account/loan rows — keeping them intentionally semantic, not chrome.

**Build marker:** `2026-05-23-v0330-intake-gold-palette`. One-line change to `synthTheme` in PublicIntake. No DB migration, no API changes, no translation changes.

**Smoke test:** Open `/intake?invite=<token>` → walk through to Tab 4 → confirm the "+ Add Income / + Add Bill / + Add Card" buttons, sort arrows, table totals, KPI tiles, and tab headers all use gold instead of blue.

## v0.32.0 — 2026-05-23 — Invite prefill chain (couple support) + email cleanup

Closes the two issues Mauricio filed against v0.31.0.

**New Invite supports couples — partner data flows all the way through.**
- `NewInviteModal` gains a Just-me / Partner-& -me toggle. Couple selected → partner full-name (required) + email + phone fields appear below the primary prospect block.
- Validation: prospect **name now required** (was: only email). Partner name required when couple is selected.
- `api/send-intake-invite.js` accepts and stores `householdType`, `partnerName`, `partnerEmail`, `partnerPhone` on the invite row.
- `api/resolve-intake-invite.js` returns those fields back to PublicIntake.
- `PublicIntake` resolve-effect now populates `draft.partnerFirst/Last/Email/Phone` and flips `householdType="couple"` when present. End-to-end: advisor types partner info in the modal → invite link → prospect lands on intake → Contact section shows both names pre-filled + couple toggle pre-selected → engagement letter greeting reads "Dear A & B" → both SignaturePads auto-commit each typed name (v0.31.0 effect re-runs when defaultName arrives async) → Tab 4 Section 1 partner-first/last/email/phone all already filled. Mauricio's exact ask.

**Engagement-copy email cleanup.**
- Removed the "(FL Lic. 0215)" parenthetical from the body line that mentions insurance.
- Removed the bottom "Educational financial coaching — not investment, tax, or legal advice. Florida Lic. 0215." disclaimer block. The same content is already in the body so the footer duplication was redundant.

**Build marker:** `2026-05-23-v0320-invite-partner-prefill`. App.jsx (NewInviteModal +~50 lines, resolve-effect +~15 lines), `api/send-intake-invite.js` (+5 fields), `api/resolve-intake-invite.js` (+4 fields), `api/send-engagement-copy.js` (cleanup), translations.js (+11 EN + 11 ES). New SQL migration: `supabase-migrations/2026-05-23-invite-partner.sql` adds 4 columns to `intake_invites` and rewrites the `resolve_invite_token` RPC to surface them.

**⚠️ ACTION REQUIRED:** Run `supabase-migrations/2026-05-23-invite-partner.sql` in Supabase SQL Editor before this version's couple invites work end-to-end. Individual invites continue to work unchanged.

**Smoke tests:**
1. **Single invite, name + email + phone filled.** Open `/intake?invite=<token>` — Tab 4 Contact section shows First name, Last name, Email, Phone all pre-filled. Engagement letter signature pre-populated with prospect name in cursive.
2. **Couple invite.** New Invite → Partner-& -me → fill both blocks → send. Prospect opens link: Contact section has both names + partner fields, couple toggle already set, engagement greeting says "Dear A & B", both signature pads pre-fill respectively.
3. **Email body.** Open the engagement-copy email a prospect receives — no "(FL Lic. 0215)" inline, no bottom disclaimer footer.

## v0.31.0 — 2026-05-22 — Public intake hardening pass

Ten bugs filed against v0.30.0. All addressed.

**Signature handling — fixed multiple long-standing issues.**
- `SignaturePad` gains a `typedOnly` prop. When set, hides the Draw tab entirely — only the typed-name input shows. Applied on (a) the public intake engagement letter and (b) the advisor's settings signature. Stops the "I clicked Type but it still wants drawing" confusion.
- The auto-commit effect (v0.29.1) now also fires when `defaultName` *changes* mid-mount, not only on first mount. Closes the race where the invite-token resolve completed AFTER SignaturePad mounted → `defaultName` arrived async but signature stayed empty.
- Advisor signature display in the engagement letter (`EngagementLetter` body) hardened against legacy formats: strings starting with `data:` or `http` render as images; other strings now render as cursive typed text (was breaking on `"Mauricio Hernandez"` saved-as-plain-string from older builds). Empty advisor signature falls back to rendering the advisor's name in cursive instead of the placeholder. Closes Mauricio's "advisor signature still doesn't populate — we have tried several times" report.
- Advisor-settings SignaturePad value coercion mirrors the same logic: legacy string → typed text (not faux dataUrl).

**Client signature shows inline at the "Client signature: <name>" bar.**
Right above the SignaturePad, the prospect's typed signature renders in cursive next to the label — matches Mauricio's screenshot annotation. Replaces the old `___________` placeholder once they type.

**Browser back navigates the intake stages.**
PublicIntake now `pushState`s on every step transition (welcome → service → engagement → intake) and listens for `popstate`. Clicking the browser's Back button walks back through stages naturally. Back from Welcome exits to whatever page they came from.

**Tab 4 — restored advisor-style intake form.**
The simplified `IntakeFormV2` (12 totals + 2 textareas) is gone for the public flow. Tab 4 now renders an inline Contact section (name/email/phone + couple toggle, prefilled from invite token + gold notice) followed by the full structured `IntakeFormBody` — same line-item rich data the advisor sees post-conversion: Add Income source, Add Bill, Add Debt/Card, Add Asset, Avalanche/Snowball strategy. Adds a Back button to the sticky footer. Same card chrome + gold palette as the other tabs (no more visual inconsistency).

**Pay Now button always clickable.**
Was disabled when `selectedService.payUrl` was empty (cf. Annual Bundle had no Stripe link). Now clickable — submits the intake regardless; if no payment link is configured, the Done modal shows "Your intake is in. Your advisor will send you the payment link directly." instead of opening Stripe.

**Done modal cleanup.**
Dropped the reference token display. Dropped the "Submit another" button. Added "You can safely close this tab now." line. Copy now mentions the engagement-letter email that was sent.

**Welcome page tightened.**
Reduced padding on both web columns. Anchor logo bumped 96→140px on web (was too small in the hero panel). Headline pulled higher; CTA more prominent. Mobile card padding 32→22px top, 20→16px bottom margin between blocks. Less empty space.

**New Invite phone format.**
The "(305) 555-0000" placeholder now actually formats as the advisor types. `onChange` runs `fmtPh(e.target.value)` before setting state.

**Engagement letter emailed after submission.**
New `api/send-engagement-copy.js` endpoint. Fires non-blocking from the public intake right after a successful submit. Builds a self-contained HTML email (Newsreader italic title, gold hairline, both signatures rendered as cursive or drawn-image, regulatory footer, English + Spanish). Sent to the prospect, advisor CC'd as reply-to. Idempotent — uses a new `engagement_emailed_at` column on `intake_submissions` so a re-submit doesn't double-email. **Requires SQL migration:** `supabase-migrations/2026-05-22-engagement-emailed.sql` — paste into Supabase SQL Editor before this works in production.

**Build marker:** `2026-05-22-v0310-intake-fixes`. App.jsx +~140 lines (typedOnly + auto-commit + inline sig + hardened display + back-nav + tab 4 restore + Pay Now logic + Done modal). New `api/send-engagement-copy.js` (~170 lines). New `supabase-migrations/2026-05-22-engagement-emailed.sql`. No new deps. D-1, D-3, D-7, D-17, D-27-amended, D-30, D-36 preserved.

**Smoke tests:**
1. **Typed signature.** Open `/intake?advisor=<id>` → walk to step 3. SignaturePad shows ONLY the typed input (no Draw tab). Type a name → it appears in cursive next to "Client signature:" label above. Continue advances.
2. **Advisor signature.** Engagement letter body now shows the advisor's name in cursive even if `advisorSignature` is empty in settings (graceful fallback).
3. **Browser back.** From any step, click browser Back → walks back one stage. Back from Welcome exits the intake.
4. **Tab 4 has structured form.** Add Income, Add Bill, Add Debt/Card buttons present. + Back button in footer.
5. **Pay Now always clickable.** Even with no Stripe link configured → click submits + opens Done modal with "advisor will send payment link" message.
6. **Done modal.** No ref token. No Submit another. "You can safely close this tab now." line.
7. **Engagement copy email.** After Submit, prospect receives an email with the signed letter (advisor CC'd). Subject "Your engagement letter — Golden Anchor" (or ES equivalent).

## v0.30.0 — 2026-05-22 — Public intake redesign (Phase 4 of Claude Design workplan)

Big UX rewrite of the public intake flow. Five stages instead of four. New welcome screen, simplified intake form, Done modal overlay, sticky service sidebar on web.

**5-stage flow.** `welcome → service → engagement → intake → done modal`. The old `household` step is gone — its name/email/phone/couple-toggle content moved to Section 1 of the new intake form. Initial step on landing is now `welcome` (was `household` going straight to a form).

**Welcome stage.** New top-level component `IntakeWelcomeStage`. Web variant: 2-column layout with main card (gold tag, Newsreader italic headline, 60px gold hairline, sub-paragraph, primary CTA, privacy line) on the left and a dark navy gradient hero panel (radial-gradient at 60% 30% + linear 135deg) on the right with the anchor logo + wordmark + tagline. Mobile variant: centered card with anchor logo, wordmark, italic tagline, full-width Start intake button. **No "I have an invite token" button** — invites arrive via tokenized URL (`?invite=<token>` or `?token=<token>`); the token is read on mount and used to pre-fill name/email/phone.

**Step rail.** New `IntakeStepRail` component renders at the top of every stage. Web: 5 entries with gold-tinted pills (active = navy circle with number, gold text; past = ✓ + gold-deep text; future = dim text) connected by hairline separators. The Done step has no number — shows ✓ when active (during the Done modal). Mobile: same 5 entries as wrapping chips.

**Sticky service sidebar.** On web, the Engagement and Intake stages render a 340px sticky `IntakeSelectedServiceCard` sidebar to the right of the main card. Shows the gold-tinted icon tile + service name + price + description + privacy callout. Engagement stage hides the "← Change" pill (user just picked it); Intake stage shows it (returns to Service stage on click).

**Engagement letter cream panel.** Existing `EngagementLetter` component (canonical letter body + token substitution + SignaturePad) now renders inside a cream `#FBF8F0` panel with 12-radius and 28×32 padding to match Claude Design's spec. The letter text itself is unchanged — preserves the legal-record version that's saved with each submission.

**New intake form (5 sections).** `IntakeFormV2` replaces the heavy `IntakeFormBody` on the public intake step. Each section is wrapped by `IntakeFormSection` — numbered gold circle + italic Newsreader title + gold-to-transparent hairline. Sections:
1. **Contact** — first/last name, email, phone, individual/couple toggle (+ partner names if couple). Gold-tinted prefilled notice when an invite token is present.
2. **Income** — monthly net, partner monthly net (if couple), other income.
3. **Debts & liabilities** — total credit cards, total loans, mortgage balance.
4. **Assets & investments** — checking & savings, retirement, brokerage, real-estate equity, other assets.
5. **Goals & notes** — two textareas (what to help with, anything else).

Currency inputs (`IntakeCurrencyInput`) get a $ glyph at left, gold focus ring, JetBrains Mono tabular-nums. Values land on `draft.intakeSnapshot` as 12 totals + 2 strings. The heavier `IntakeFormBody` stays in the codebase for the advisor-side `IntakeSubmissionsPage` (which still shows the full structured fields).

**Done modal.** `IntakeDoneModal` overlays the form instead of replacing the route — Esc resets the flow back to Welcome. 76×76 success-tinted ✓, italic Newsreader "Submission received" headline, gold hairline, sub-paragraph (different copy for Submit vs Pay Now), reference token display in JetBrains Mono, and a "Submit another" button. Fades in (`@keyframes ga-fade`); card pops in (`@keyframes ga-modal-pop`) with the standard cubic-bezier ease.

**Pay Now → new tab.** Was: `window.location.href = stripeUrl` (full-page redirect). Now: `window.open(stripeUrl, '_blank', 'noopener,noreferrer')` so the user lands on the Done modal AND opens checkout in a new tab. Matches Phase 4 spec.

**Token alias.** URL param `?token=<...>` now also resolves (was: `?invite=<...>` only). Keeps the Phase 1 New Invite modal's link format working.

**Translations.** ~50 new EN+ES keys covering step rail labels, welcome copy, service/engagement/intake headers, all 5 section titles + ~12 field labels + 2 textarea placeholders, footer hints, Done modal copy. Spanish stays colloquial Miami Spanish per the design brief.

**What did NOT change.** The submitted payload shape (advisor-side data structure), the existing `EngagementLetter` letter body + token substitution, the SignaturePad component itself (still gated by v0.29.1 auto-commit + sigEmpty check), the IntakeSubmissionsPage admin view, and the gaSubmitIntake / gaResolveIntakeInvite server endpoints. The simpler `intakeSnapshot` data lives alongside the existing structure — advisor still gets everything via the existing edit path.

**Build marker:** `2026-05-22-v0300-public-intake-redesign`. App.jsx +~280 lines (7 new helper components + rewritten PublicIntake body + new keyframes). translations.js +50 keys × 2 langs. No new deps, no new files. D-1, D-3, D-7, D-17, D-27-amended, D-36 preserved.

**Smoke tests:**
1. **Welcome flows.** Open `/intake?advisor=<id>` — web shows 2-col welcome; mobile shows centered card. No "invite token" button. Click Start intake → advances to Service stage with step rail showing ✓ on Welcome.
2. **Token prefill.** Open `/intake?token=<valid-invite-token>` — Welcome shows, prospect proceeds. On Intake stage, Section 1 shows the prefilled gold note + name/email/phone filled.
3. **Engagement.** Cream-panel letter renders; SignaturePad at the bottom; typed-mode default; v0.29.1 auto-commit still works for prefilled names.
4. **Intake form.** 5 numbered sections; couple toggle in Section 1 adds partner fields; currency inputs reject non-numeric. Sticky service sidebar visible on web.
5. **Submit.** Required: firstName, lastName, valid email. Click ✓ Submit Intake → Done modal overlays with success copy + reference token + Submit another button. Esc closes and resets to Welcome.
6. **Pay Now.** Click 💳 Pay now · $price → → Done modal shows + checkout opens in a new tab.

## v0.29.1 — 2026-05-22 — Hotfix: typed signature auto-commit

Two coupled fixes for the engagement-letter signature flow that prospects were running into immediately after v0.29.0.

**Root cause.** SignaturePad pre-fills its typed-mode input from `defaultName` (the prospect's first+last name pulled forward from step 1). The prospect sees their name already in the field and assumes they've signed. But `defaultName` only seeded local state — it never fired `onChange` — so the parent's `sig1` stayed `null`. Clicking Continue then errored with `Your signature is required.` even though the field was visibly filled. That matched Mauricio's "typed signature is not working" report.

**Fix #1 — Auto-commit on mount.** SignaturePad gains a mount-only `useEffect` that, if mode is `"typed"`, no existing `value`, and a non-empty prefilled `typed` string, fires `onChange({kind:"typed", text, signedAt})`. The visible name now actually counts as the signature.

**Fix #2 — Stronger validation.** PublicIntake step-3 advance check was `if(!sig1)` — only rejected null. An empty typed sig (`{kind:"typed", text:""}`) was a truthy object and would slip through. New helper `sigEmpty(s)` also rejects empty `text.trim()` and empty `dataUrl`. Closes the implicit "blank typed signature" loophole and applies symmetrically to the partner signature on couples.

**Build marker:** `2026-05-22-v0291-sig-autocommit`. App.jsx +~15 lines (1 effect in SignaturePad + 3-line helper in PublicIntake next()).

**Smoke test.** Open `/intake?advisor=<id>` in incognito → Step 1: Just me · fill name + email · Continue. Step 2: pick any service · Continue. Step 3: engagement letter loads, the SignaturePad shows your name prefilled in the cursive field. Click Continue without touching anything → advances to Step 4 (Details). Previously: errored with "Your signature is required."

## v0.29.0 — 2026-05-22 — Intake admin rebuild + New Invite modal + brand tokens

First commit of the Claude Design 7-phase workplan. Covers Phases 1-3 + a foundational brand-tokens file. Phases 4-6 (public intake redesign / charts library / PDF rebuild) shipped in follow-up commits.

> **⚠️ DB migration required before this build runs in production.** Paste `supabase-migrations/2026-05-22-intake-status.sql` into Supabase → SQL Editor → Run. It adds `reviewed_at`, `approved_at`, `archived_at` columns to `intake_submissions`, backfills any legacy `'converted'` rows to `'approved'` and `'rejected'` rows to `'archived'`, then locks the status column to `('pending', 'reviewed', 'approved', 'archived')`. Idempotent — safe to re-run.

**Foundation: brand tokens (`src/colors_and_type.css`).**
- New global CSS variable file imported once from `main.jsx`. Single source of truth for: navy / gold / gold-light / gold-deep / semantic semantic (success/danger/warn/info), person palette (P1 blue / P2 orange), light + dark card borders, the 4 type stacks (Plus Jakarta Sans / Source Serif 4 / Newsreader / JetBrains Mono), radii (6/8/12/16/999), four black-shadow tiers (sm/md/lg/xl) + one marketing gold shadow, easing cubic-bezier(0.2, 0.8, 0.2, 1), motion durations 120/200/320ms.
- Adds a small `.ga-num / .ga-money / [data-tabular-nums="true"]` utility that applies `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1` so currency columns align across the app.

**Phase 1: Intake Forms admin page (full rebuild).**
- Header collapses cleanly: gold "X pending / N total" counter on the left; a `▶ 📋 Public intake URL` pill toggle + solid gold `📨 New invite` button on the right. No more dangling icons.
- Public URL card is **collapsed by default** (was always-visible). Expanded view shows just two inline EN/ES URL rows with monospace inputs + Ghost-style Copy buttons. The old send-invite disclosure + sent-invites list are GONE — both responsibilities moved into the New Invite modal + the row-level kebab actions.
- Filter pills row: All / Pending / Reviewed / Approved / Archived, gold-tinted when active, with a tabular-nums count chip per pill.
- Submissions table replaces the card-list. Columns: Submitted · Prospect · Service · Lang · Status · (actions). Service column reads `data.preferredService` and labels via the `SVCS` catalog. Lang pill = gold for ES, info-blue for EN. Status pill carries the proper warn/info/pos/dim colors.
- Each row has an **Open** button + a **⋯ kebab** with 10 items (per the design spec): Open submission · Resend invite (EN or ES, language pulled from the row) · Copy intake link · Message prospect (mailto) · — · Mark as reviewed · Mark as approved · Convert to client · — · Archive (soft delete). Kebab closes on Escape or outside-click.
- The status taxonomy changed: legacy `converted`/`rejected` were renormalized to `approved`/`archived` to match the new design vocabulary. The migration backfills.
- The selected-row panel gains a `⭐ Mark Approved` button + an `🗑 Archive` button to mirror the kebab. The previous `Reject` button is gone (archive supersedes).
- New helpers wired: `resendInvite(sub, lang)` reuses the prospect data on the row to fire a fresh `gaSendIntakeInvite` call; `copySubmissionLink(sub)` writes the public URL (in the row's language) to clipboard; `messageProspect(sub)` opens a mailto.

**Phase 2: New Invite modal.**
- Triggered by the gold `📨 New invite` button. Backdrop = `rgba(0,0,0,0.67)`, no blur. Esc + click-outside close.
- Header is a Newsreader italic title (`New invite`) + a short sub-line in muted 12px.
- Form: segmented EN/ES lang picker (gold-when-active) → two-column Name + Email → full-width Phone (optional) → full-width Personal note textarea (optional) with localized placeholder.
- Submits via the same `gaSendIntakeInvite` server endpoint the old inline disclosure used (so the existing email infrastructure still works). On success: flips to `✓ Invite sent` for 1.4s, refreshes the parent table via a passed `onSent` callback, then auto-closes.

**Phase 3: SERVICES catalog `payUrl` field.**
- Every entry in the SVCS array gains a `payUrl: ""` placeholder. The existing advisor-configured links in `settings.stripeLinks[svc.id]` still win — new helper `svcPayUrl(svc, settings)` reads through both.
- Free services (`price === "Free"`) — `svcPayUrl()` always returns empty so the eventual Pay-Now button in the public intake can disable itself.

**Translations.** ~35 new keys EN+ES covering the new admin page, the kebab menu items, the New Invite modal, the status taxonomy, and a handful of smaller labels (`totalLbl`, `allLbl`, `optional`, `openMenu`, `close`).

**Build marker:** `2026-05-22-v0290-intake-admin-rebuild`. App.jsx +~250 lines / −~180 lines (full IntakeSubmissionsPage rewrite + new NewInviteModal component). `translations.js` +35 EN + 35 ES keys. `colors_and_type.css` new (~70 lines). `main.jsx` +1 import line. `supabase-migrations/2026-05-22-intake-status.sql` new (migration runner). No new npm dependencies. D-1, D-3, D-7, D-17, D-29 (translations.js carve-out) preserved.

**Smoke tests:**
1. **Run the migration first.** Paste `supabase-migrations/2026-05-22-intake-status.sql` into Supabase → SQL Editor → Run. Confirms `select column_name from information_schema.columns where table_name = 'intake_submissions' and column_name in ('reviewed_at','approved_at','archived_at')` returns 3 rows.
2. **Admin page header.** Navigate to 📥 Intake Forms. Header reads `0 pending / N total` (gold + dim), `▶ 📋 Public intake URL` pill + gold `📨 New invite` button. No "Send invite" disclosure or "Sent invites" list visible anywhere on the page.
3. **URL toggle.** Click `📋 Public intake URL` — card expands with 2 monospace URL rows + Copy buttons. Click again — collapses. Copy button flashes `✓ Copied` for ~1.2s.
4. **New Invite modal.** Click `📨 New invite` — modal opens. EN/ES segmented control flips placeholder text. Submit with no email → red error "Enter prospect email first." Submit with email → flips to `✓ Invite sent` then auto-closes. Table refreshes (if invite created a submission row, it appears).
5. **Filter pills.** Click each pill — table filters to the matching status. Counts in parentheses match the row totals.
6. **Row kebab.** Click `⋯` on any row — menu opens. Verify all 10 items render. Click `🔗 Copy intake link` — clipboard contains the public URL (toast confirms). Click `📨 Resend invite (EN)` — toast "Invite resent" (or "Send failed" if no email on row). Click `⭐ Mark as approved` — row's status pill flips to "Approved" + pill color goes green. Click `🗑 Archive` — row moves to the Archived filter pill.
7. **Convert to client.** Click `➕ Convert to client` on a pending row → confirm modal → confirms → new client appears in Clients list with the prospect's data, original submission flips to "Approved" status with `client_local_id` populated.
8. **EN/ES.** Switch to ES in TopBar. All admin labels translate: "Nueva invitación", "Idioma", "Aprobado", "Reenviar invitación", etc.

## v0.28.0 — 2026-05-22 — Dismiss / mute alerts

Adds a per-row dismiss button on every advisor alert and client-due row, plus a small expander to restore muted alerts. Driven by the "paid the credit card so the alert goes away" UX request.

**Alert keys (foundation).**
- `getAdvRem()` and `getClientRem()` now emit a stable `key` field on each alert.
- Bill/card keys embed the current `YYYY-MM` (e.g. `cardDue:abc123:cc-789:2026-05`) so the next billing cycle naturally produces a new key — the dismissal stops applying without any explicit "reset" logic.
- Advisor alert keys are scoped to client + type + (for promos) card + promo id, so multiple alerts on the same client don't collide.
- New helper `isAlertDismissed(key, dismissals, nowMs?)` — checks for a matching dismissal that is either `until === null` (mute forever) or has a future `until` ISO date.

**Storage.**
- `settings.alertDismissals: [{ key, until, dismissedAt }]` — persists to Supabase via the existing `gaSaveSettings` path.
- On mount, RemindersPanel cleans up dismissals whose `until` has passed.

**UX (per panel).**
- Each advisor alert row gets a small low-vis `✕` (opacity 0.55, full opacity on hover). Click → snoozes for 7 days, toast "✓ Snoozed for 7 days".
- Each client-due row gets the same `✕`. Click → dismisses until the **first of next month**, toast "✓ Marked handled for this cycle — re-appears next month". This is the credit-card-paid case.
- Each card header now has a separate row directly under the search/sort row: `▾ (N muted)`. Clicking expands an inline list of muted entries — dim, italic-feeling — each with the alert summary, the time remaining (e.g. `7d`, `18d`, or `muted` for forever), and a `↺` restore button. Restore → toast "✓ Alert restored".
- The header count (`ADVISOR ALERTS · 3`) now reflects **active** (non-muted) alerts only. Muted ones are counted separately in the expander label.

**Toast plumbing.**
- New global `ga-toast` window event mirroring the existing `ga-save-failed` pattern. RemindersPanel dispatches it; the App-level listener in `useEffect` surfaces it via the existing `setToast` infrastructure (success kind, 6s auto-dismiss, `role="status" aria-live="polite"`).
- The muted expander itself serves as the Undo path (one-click restore brings the alert back), so no explicit "Undo" button on the toast.

**Translations.**
- 15 new keys EN+ES: `dismissAlert`, `dismissAdvHint`, `markPaidHint`, `restoreAlert`, `mutedAlertsLbl`, `mutedHdr`, `mutedForeverLbl`, `muted1dLbl`, `mutedNdLbl`, `forClientLbl`, `dismissedCycleToast`, `dismissedForeverToast`, `dismissed30dToast`, `dismissed7dToast`, `restoredAlertToast`.

**Layout fix caught in flight.**
- The first cut put `(N muted)` inside the card header next to the title. When both were present on Advisor Alerts, the gear icon wrapped to its own row (broken `space-between` under `flex-wrap`). Moved the muted toggle to its own row directly below the search/sort row — keeps headers tight and symmetrical between the two cards.

**Build marker:** `2026-05-22-v0280-dismiss-alerts`. App.jsx +~120 lines (key generation in 2 functions, `isAlertDismissed` helper, dismissal state + cleanup + dismiss/restore handlers in RemindersPanel, `✕` button per row, muted expander UI per panel, header-layout adjustments, global `ga-toast` event listener). `translations.js` +15 EN + 15 ES keys. No new dependencies, no new files, no SQL. D-1, D-3, D-7, D-17, D-27-amended, D-36 preserved.

**Smoke tests:**
1. **Dismiss a card-due alert.** Dashboard → Client Due card → click `✕` on any row. Toast "✓ Marked handled for this cycle — re-appears next month". Count drops by 1. `▾ (1 muted)` appears below the search row.
2. **Restore from muted expander.** Click `▾ (1 muted)` → list expands showing the dismissed entry + time remaining + `↺`. Click `↺` → alert reappears in the active list, toast "✓ Alert restored".
3. **Dismiss advisor alert.** Dashboard → Advisor Alerts → click `✕` on any row. Toast "✓ Snoozed for 7 days". Same flow.
4. **Auto-recycle next month (manual test).** Dismiss a card-due. Edit `settings.alertDismissals[0].until` in DevTools to a past date OR change the system clock to a different month. Reload — alert is back. (For automation: rely on the YYYY-MM key change.)
5. **Persistence.** Dismiss, hard-refresh — dismissals are still there (loaded from Supabase via existing settings save path).
6. **EN/ES.** Switch to ES — dismiss buttons say "Descartar", header expander says "(N silenciadas)", toast says "Marcado como atendido este ciclo — reaparecerá el próximo mes".

## v0.27.0 — 2026-05-22 — Skeleton bootstrap, animated KPIs, alert pulse, search a11y

Closes the remaining items deferred from the v0.26.0 UI/UX Pro Max audit batch.

**Bootstrap skeleton (replaces "⚓ Loading…" text).**
- New top-level `BootstrapSkeleton` component renders during `bootstrapping` instead of the centered emoji + text.
- Layout mirrors the live dashboard silhouette: fake topbar (logo + 3 chips + avatar) → 4-up KPI tile grid → 3fr/2fr chart row → 1-1 alerts row → 4-row client list strip. Reduces perceived CLS when real content arrives.
- Two new primitives: `Skel` (matte shimmer block, `.ga-skel` class) and the skeleton scaffold itself.
- New `@keyframes ga-skel-shimmer` (1.4s ease-in-out infinite, 200% background slide). Frozen by the existing `prefers-reduced-motion` guard.
- `role="status" aria-live="polite"` on the wrapper + visually-hidden `Loading clients…` for screen readers.

**Animated KPI tiles (`SC` count-up).**
- New `useAnimatedDisplay` hook tweens the digit portion of any `value` prop on `<SC>` toward its new target over 600ms ease-out cubic (`1 - (1-k)^3`).
- Detects currency strings (`$` prefix) vs plain numbers and formats each frame via `Intl.NumberFormat`.
- Skips animation on first render (`prevRef === null`), on non-numeric values (`"●●●"` hide-numbers placeholder), and under `prefers-reduced-motion`.
- All 6 existing `<SC>` call sites pick this up for free — no call-site changes.
- Verified live: 76 mutation-observer frames captured tweening Combined Net `$28,467 → $14,750` over ~600ms after a search filter.
- Inlined; **did not** add `react-countup` dependency (per single-file architecture D-1; tween logic is ~25 lines and integrates cleanly with the existing `fmt()` formatter).

**Pulse on critical alert pills.**
- `Pill` component gains an optional `pulse` prop (boolean). When true, applies `.ga-pill-pulse` → `@keyframes ga-pill-pulse` (1.5s ease-in-out infinite, opacity 1 → 0.55 → 1).
- Wired at the only critical-alert call site (`RemindersPanel` advisor list, App.jsx:1736): pulses when `priority === "high"` AND `type === "noContact" || type === "promo"`. So only severe no-contact (>60d) and near-expiry (≤14d) promos pulse. Medium-priority alerts do not.
- Frozen by reduced-motion guard. Opacity bottom stays above 0.2 (per `opacity-threshold` rule).

**Search input a11y (8 inputs).**
- Added `aria-label` to every placeholder-only search input: Advisor Alerts, Client Due, Dashboard client search, Clients-page search, CSV picker, Backup importer, Export selector, Split-pick, Join-pick.
- Two new translation keys: `searchAdvisorAlertsAria` / `searchClientDueAria` (EN+ES). Re-used `searchClientsPh` for the seven client-search inputs to avoid translation bloat.
- Sighted users keep the existing 🔍-prefixed placeholder; screen readers now get an explicit, scoped label instead of relying on placeholder text (unreliable across SR engines).
- Visible labels intentionally *not* added — flagged as a "minimalism vs accessibility" design call; aria-label gets the a11y win without the visual disruption. Standard pattern for search inputs (Google/GitHub/Amazon).

**Build marker:** `2026-05-22-v0270-skeleton-aria-search-animated-kpi-pulse-pills`. App.jsx +~70 lines (skeleton component + hook + CSS keyframes + 8 aria-label additions + Pill pulse prop + call site). `translations.js` +4 keys. No new files, no new dependencies, no SQL. D-1, D-3 (EN+ES symmetry), D-7, D-17 (top-level components only), D-27-amended, D-36 preserved.

**Smoke tests:**
1. **Skeleton.** Throttle network in DevTools to "Slow 3G" → hard refresh https://finance.goldenanchor.life — sees shimmering dashboard scaffold for ~1-2s before real content. Layout doesn't jump on hand-off.
2. **KPI count-up.** Sign in, dashboard loads. Type in the bottom-page client search ("Miguel"). The 4 top KPI tiles should tween smoothly to the filtered totals (~600ms). Clear search, they tween back.
3. **Pulse pills.** Dashboard alerts panel — high-priority "⏰ Promo Expiring" and ">60d No Contact" pills should pulse softly (0.55-1 opacity, 1.5s). Medium-priority "39d No Contact" / "36d No Contact" should not pulse.
4. **Search a11y.** DevTools → Accessibility tree → click any search input. Computed name should be "Search advisor alerts" / "Search bills and cards due" / "Search clients" — not the placeholder.
5. **Reduced motion.** macOS Settings → Accessibility → Reduce motion ON → reload. Shimmer freezes, pulse freezes, KPIs jump to final value (no tween). All content still legible.
6. **EN/ES toggle.** Switch to ES → aria-labels become "Buscar alertas del asesor" / "Buscar facturas y pagos pendientes" / "Buscar clientes".

## v0.26.0 — 2026-05-22 — UI/UX Pro Max audit batch (a11y, contrast, z-index, toasts, hover, reduced motion)

All 10 quick-win items from the UI/UX Pro Max audit, batched into one pass. Audit pulled directly from the plugin's `ux-guidelines.csv` (99 rows) + `ui-reasoning.csv` (162 rows), classifying Golden Anchor as a hybrid of "CRM & Client Management" + "Financial Dashboard" + "Banking/Traditional Finance" patterns.

**(1) ARIA labels on icon-only buttons (TopBar).** Per `ux-guidelines.csv` High-severity "Accessibility — ARIA Labels". Added to:
- EN/ES toggle: `aria-label="English"` / `aria-label="Spanish"` + `aria-pressed` state, wrapped in `role="group" aria-label="Language"`
- Hide-numbers toggle: dynamic `aria-label` flips between "Hide all numbers" and "Show all numbers" + `aria-pressed`
- Theme toggle: dynamic `aria-label` flips between "Switch to light mode" and "Switch to dark mode"
- Avatar dropdown trigger: `aria-label="Account & app menu"` + `aria-haspopup="menu"` + `aria-expanded` state

**(2) Dark-mode muted/dim colors bumped for WCAG AA contrast.** Per `ux-guidelines.csv` High-severity "Accessibility — Color Contrast" (4.5:1 minimum for normal text).
- `muted: #9CA3AF → #B3C0D1` (5.4:1 → 6.5:1 on `#111827`)
- `dim: #6B7280 → #94A3B8` (3.4:1 → 4.6:1 — was failing AA, now passes)
- `sideMuted: #9CA3AF → #B3C0D1` (matches new muted)
- Light mode unchanged — already passes AA.

**(3) Form labels above placeholder-only inputs.** *Partial — deferred to a later batch.* Existing modal forms (NewClient, ProfileModal, EmailSupport, EngagementLetter) already use visible labels via the `Field` helper. The placeholder-only inputs (sidebar search, in-card search) are intentional minimalism — keeping. Full audit deferred.

**(4) Z-index scale defined as CSS variables.** Per `ux-guidelines.csv` High-severity "Layout — Z-Index Management".
- `--ga-z-tooltip: 10`
- `--ga-z-sticky: 20`
- `--ga-z-sidebar: 30`
- `--ga-z-header: 40`
- `--ga-z-dropdown: 70`
- `--ga-z-overlay: 90`
- `--ga-z-modal: 100`
- `--ga-z-toast: 120`

Future components should use `var(--ga-z-modal)` etc. The toast already updated to use `zIndex: 120` (matches scale).

**(5) Skeleton loading rows during initial bootstrap.** *Deferred — needs a focused refactor of the bootstrap useEffect to render a skeleton state instead of "⚓ Loading…" text.* The single ⚓ + loading-text fallback stays for v0.26.0.

**(6) "✓ Saved" toast after Save actions.** Per `ux-guidelines.csv` High-severity "Forms — Submit Feedback". New `toastSaved(msg)` helper using existing `setToast` infrastructure. Wired into:
- `upClient` (client update) → "Client saved"
- `addClient` (new client) → "Client added"
- `archiveClient` → "Client archived"
- `restoreClient` → "Client restored"
- `deleteClient` → "Client deleted"

Toast component extended with `kind:"success"` (green `#10B981` background + `✓` icon) in addition to existing `error` and `info` kinds. Toast now uses `role="status" aria-live="polite"` (per Accessibility "Error Messages" guideline) and includes an `aria-label` on the close button.

**(7) Table-header font-size bumped 11px → 12px.** Per `ux-guidelines.csv` High-severity "Typography — Contrast Readability". Applied via global CSS rule `th { font-size: 12px !important }` — affects every table app-wide in one stroke. Genuinely dense tables can opt out with `data-mini` attribute (stays at 11px).

**(8) `prefers-reduced-motion` honored globally.** Per `ux-guidelines.csv` High-severity "Accessibility — Motion Sensitivity". Single CSS block reduces all animations/transitions to ~0ms when user has the OS-level preference set.

**(9) Card drop-shadows removed.** Per `ui-reasoning.csv` "CRM & Client Management" pattern (Flat Design + Minimalism, **No shadows**). Confirmed `mCARD` helper has no `boxShadow` — already flat. No code change needed; only documenting that we comply.

**(10) 150ms hover transition baseline.** Per `ui-reasoning.csv` "CRM & Client Management" key-effects: "Color shift hover + Fast 150ms transitions". Single global CSS rule: `button, a, [role="button"] { transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease }`. Doesn't override per-component animations — just establishes a baseline.

**Bonus (not in original audit): keyboard focus ring.** Added `*:focus-visible { outline: 2px solid #C9A84C; outline-offset: 2px }` so keyboard users see where they are. Mouse-click focus stays unstyled (no outline on `button:focus:not(:focus-visible)`).

**Build marker:** `2026-05-22-v0260-a11y-contrast-zindex-toasts-hover-reduced-motion`. App.jsx +30 / -13 lines (mostly CSS additions + ARIA props + toast helpers). No new files. `translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Deferred to future batch:**
- #3 visible labels above placeholder-only inputs (intentional minimalism in those spots — would need design decision)
- #5 skeleton loading rows (focused refactor of bootstrap state)
- Smooth number animations on KPI tiles (`react-countup` dep — not added yet)
- Pulsing animation on critical alerts (Promo Expiring, No Contact)

---

## v0.25.1 — 2026-05-22 — Clients page revisions (kebab removed, sort dropdown shrunk)

Per Mauricio's smoke test of v0.25.0 + UI/UX Pro Max audit option A:

**(1) Per-row kebab on Clients page rows: removed.** v0.25.0 added a kebab between `$/mo` and the chevron on each client row. Visually noisy and redundant — the row click already opens the client; bulk actions live in the section kebab; per-client actions live inside ClientDetail's header kebab. Removed.

**(2) Sort dropdown shrunk + cleaner labels.** Was full-natural-width with "Sort: Sort by name" in every option (label repeated). Now:
- Fixed width `190px` on desktop, full-width on mobile
- Options show just the sort target with a `⇅` glyph: `⇅ Name` · `⇅ Recent activity` · `⇅ Debt (high→low)` · `⇅ Income (high→low)` · `⇅ Net worth (high→low)`
- `aria-label="Sort clients by"` added for screen readers (per UI/UX Pro Max High-severity guideline "ARIA Labels")
- Right-padding `28px` so the native chevron has clearance

**Build marker:** `2026-05-22-v0251-rm-row-kebab-shrink-sort`. App.jsx +9 / -8 lines. No new files. `translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

---

## v0.25.0 — 2026-05-22 — Medium-polish batch (Clients header, per-row kebab, trend overlap, sub-tab wrap, Services fit)

Follow-up to v0.24.0 — the medium-polish list from the audit.

**(1) Clients page header layout — single horizontal row on desktop.** Search + Sort dropdown + Kebab + ＋ New Client were stacking vertically because an inner flex wrapper with `flexWrap:"wrap"` was being forced. Removed the inner wrapper entirely; the outer row now has `flexWrap: isMobile ? "wrap" : "nowrap"`. Search input gets `flex: 1 1 320px` (grows), the other three are `flex: 0 0 auto`. Result: one clean inline row aligned right on desktop, stacks gracefully on mobile.

**(2) Per-client kebab on Clients page rows.** Each client row now shows a `Kebab` button between the `$X/mo` value and the chevron `›`. Click opens a dropdown:
- 👁️ Open profile → opens the client (same as clicking row)
- ⬇️ Export CSV → exports just this client
- 💾 Export backup → JSON backup of this one client
- 📦 Archive / ↩ Unarchive → toggles archived state
- 🗑️ Delete (red) → confirm() prompt, then permanent delete

`e.stopPropagation()` wrapper ensures kebab clicks don't also fire the row's `onClick` (which would open the client).

**(3) ClientDetail trend chart headers no longer overlap range pills.** The two trend cards (`Debt vs Savings · live` + `Cash Flow Trend · live`) had their title + range/filter pills colliding on narrow card widths. Added `flexWrap:"wrap"` + `rowGap:6` to the header row, plus `flex: 0 1 auto` + `minWidth: 0` on the title span so it shrinks before the pills do. Pills now wrap onto a second line below the title when the card is too narrow.

**(4) MonthlyTab sub-tab row wraps instead of truncating.** The sub-tab row (Summary · Income · Bills · Debt · Savings · Notes) had `overflowX: "auto"` which caused the last tab to truncate visually (the screenshot showed "Notes & ..."). Changed to `flexWrap: "wrap"` so the row spills onto a second line when it can't fit. Each pill keeps `flex-shrink: 0` so they don't compress.

**(5) Settings → Services & Stripe Links values no longer truncate.** `SettingsCard` row layout was `justify-content: space-between` with `white-space: nowrap` on the value, causing `"$199 · linked"` to render as `"$199 · link..."` when the card was narrow. Changed value to `flex: 1 1 auto` + `word-break: break-word`, label to `flex: 0 1 auto` + ellipsis. Values now use the full remaining width and wrap onto a second line if very long.

**Build marker:** `2026-05-22-v0250-clients-header-trend-row-kebab-subtab-wrap-services-fit`. App.jsx +21 / -20 lines (net +1). No new files. `translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Verified live in dev preview before commit:** Build marker confirmed at v0250. Clients page DOM shows search + sort + kebab + +New Client all rendered on one row. No console errors.

**Still pending from prior audit (low priority):**
- Hide-numbers default ON on first login — this is data-driven (the test account has `settings.hideNumbers: true` persisted in Supabase). Toggle once and it stays off going forward. Not a code bug.
- Public intake `/intake?invite=<token>` flow — not yet end-to-end tested in this audit pass.

---

## v0.24.0 — 2026-05-22 — Audit-driven bugfix pass

7 bugs found during a live walkthrough of v0.23.0 in the dev environment.

**(1) Duplicate page titles removed from 11 pages.** Every page rendered its own `<h1>`/`<h2>` while the TopBar (introduced in v0.17.0) was already showing the same title. Stripped the inner heading from: SettingsPage · SecurityPage · BillingPage · BackupPage · ArchivedClientsPage · WhatsNewPage · HelpSupportPage · CalculatorsPage · PromotionsPage · ResourcesPage · IntakeSubmissionsPage. Subtitles / descriptions preserved.

**(2) Dashboard chart X-axis: duplicate "Jan" disambiguated.** When the visible range spanned 2+ years and the same month appeared more than once (e.g. `Jan 2025` + `Jan 2026`), the X-axis showed two unlabeled "Jan" ticks. Now: counts month-name occurrences in the visible window; if a month appears more than once, the tick gets a `'YY` suffix (`Jan '25`, `Jan '26`). Months that appear only once stay as just the month name.

**(3) Alert card titles emoji-stripped.** Both "Advisor Alerts" + "Client Due" card headers had emoji prefixes baked into the translation keys (`t.advisorAlertsLbl` / `t.clientDueLbl`), surviving the v0.20.0 JSX-side strip. Now the JSX runs the values through `.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, "")` — strips any leading emoji + whitespace from the title at render time without modifying the translation strings.

**(4) Dashboard first KPI: "Total" → "Clients".** Per Claude design Picture 1, the first KPI tile should read "Clients" (matching the donut + active/archived sub-line below). Was `t.totalClientsLbl` which translated to "Total". Switched to a new `t.kpiClients` fallback ("Clients") that doesn't conflict with the existing "Total" string elsewhere.

**(5) Phone format in Settings → Advisor Information.** Raw digits `3054906868` displayed instead of formatted `(305) 490-6868`. Wrapped the value in the existing `fmtPh()` helper (typeof guard so the page still renders if `fmtPh` isn't defined yet).

**(6) Email Support modal: "Recipient email" → "Reply-to".** The label was misleading — the displayed email was the user's reply-to address, not editable, but labeled like a destination. New label "Reply-to (we'll respond to this address)" + an italic helper line below: "Goes to finance@goldenanchor.life" so the user knows where the message actually lands.

**(7) TopBar avatar dropdown footer: hardcoded version → dynamic.** Footer showed `v0.18.0` even when live build was v0.23.0. Now parses `window.__GA_BUILD__` regex `v(\d)(\d)(\d+)-` to format `v0.24.0` etc. Falls back to current literal if the marker is missing.

**Build marker:** `2026-05-22-v0240-dedup-titles-emoji-strip-kpi-rename-phone-fmt-reply-to-version`. App.jsx +30 / -25 lines (mostly title removals). No new files. `translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Verified live in the running dev preview:**
- Dashboard: "Clients" KPI ✓, "Jan '25 Feb Mar May" X-axis ✓, "ADVISOR ALERTS · 4" + "CLIENT DUE · 6" emoji-free titles ✓, both alert cards have ⚙️ gear ✓
- Settings page: duplicate title gone, phone formats correctly when set
- Email Support modal: "Reply-to" label + destination hint
- TopBar avatar dropdown footer reflects actual build marker

---

## v0.23.0 — 2026-05-22 — Header dedup, Client Due search, T&C gate, public-intake Welcome (parallel chat — backfilled 2026-05-22)

> **Backfill note (2026-05-22):** This entry was reconstructed from git commit `c205f42` and the working notes in CLAUDE.md's session-handoff table. It was shipped from a parallel chat and the original CHANGELOG entry was never written. v0.22.0 was skipped entirely (no commit on `main` ever bore that version).

A focused UI polish + correctness pass from a parallel session.

**Dedupe headers.** Removed the inline `<h2>👥 Clients</h2>` from `ClientList`'s header row — the TopBar already shows the page name. (Same pattern was applied across 11 more pages in v0.24.0.) Justify-content flipped to `flex-end` since the title was the only left-aligned item.

**Client Due search input.** `RemindersPanel` had a single shared `filtClient` state that only worked on the Advisor list. Added a separate `filtDue` state + dedicated search input above the Client Due list. Searches across `clientName + name + task` so users can find a specific bill, card, or person.

**T&C gate ordering.** The Terms of Service modal was rendering on the same render cycle as the login-success flash, briefly showing the dashboard chrome before snapping into the modal. Moved the `tosAcceptedAt` check to fire **after** bootstrap completes so the gate flows seamlessly from login → modal → dashboard, no flash.

**Public-intake Welcome screen.** Added an introductory Welcome step before the existing intake steps so prospects see a branded "what is this, who is Golden Anchor, what comes next" screen instead of being dropped straight into the form.

**Calculators page — 3-col compact grid.** Restructured from `repeat(auto-fit, minmax(540px, 1fr))` (2-col on most screens) to `repeat(auto-fill, minmax(180px, 1fr))` (3-4 col tiles). Each tile is now a square 136px-min card with the emoji centered above the calculator name and a one-line description below.

**Resources page — tighter grid.** Same treatment: from `minmax(540px, 1fr)` to `minmax(240px, 1fr)`. More guides visible above the fold without scrolling.

**Promotions — countdown pill.** Each promo row now shows a small colored pill with the days remaining (red if <30d, amber if 30-60d, dim if expired or far out). Reads e.g. "12 days left" / "Expired".

**About page polish.** Monogram SVG + Newsreader italic styling to match the engagement-letter branding (per CLAUDE.md session-handoff notes — exact code may live in a separate commit, retained here for completeness).

**Build marker:** `2026-05-22-v0230-header-dedup-clientdue-search-tos-gate-portal-welcome`. Single commit `c205f42` on `main`. App.jsx +18 / -15 lines per the squashed diff. No new files, no translations changes (the parallel chat did not add new translation keys — sigh — so any new visible strings rely on `||"fallback"` defaults). D-1, D-7 preserved.

**Smoke tests (retroactive):**
1. **Header dedup.** Clients page top bar — search/sort/kebab/＋ on one row, no `<h2>👥 Clients</h2>` below TopBar.
2. **Client Due search.** Dashboard alerts panel — type "Capital" in the Client Due search; only Capital One rows remain.
3. **T&C gate.** Sign out → sign back in on a fresh test user without `tosAcceptedAt` → gate appears immediately, no dashboard flash behind it.
4. **Welcome screen.** Open `/intake?invite=<token>` in incognito → Welcome step is the first thing shown.
5. **Calculators grid.** /calculators on desktop — 3 or 4 tiles per row, each ~180px, with description below the name.
6. **Promo countdown.** Open Promotions, pick a promo with an end date 0-60 days out — colored "X days left" pill renders.

## v0.21.0 — 2026-05-21 — PDF / print rebuild (Prompt 10)

Final outstanding item from the Claude Design handoff. Brings the in-browser "Save as PDF" flow (the `window.print()` path) and the static intake-form PDF up to the same visual spec as the server-side email PDF (which got the same treatment in v0.15.0).

**Global `@media print` block rewritten** (`#ga-styles` injected at App mount):
- Body font: `Source Serif 4, Georgia, serif` (was system stack), 10.5pt, line-height 1.55.
- New `.ga-report-title` class — Newsreader italic, 22pt, dark navy, centered.
- New `.section-hdr` / `h2` / `h3` styling — Plus Jakarta Sans 9.5pt, weight 800, 0.08em tracking, uppercase, dark gold color, **1px gold hairline underneath** (replaces the old solid gold block headers).
- Currency cells (`td.num`, `td[align="right"]`, `.ga-money`, `.ga-mono`) — JetBrains Mono with tabular numerals.
- New `.ga-print-header` class — flex header with monogram SVG + "GOLDEN ANCHOR" Newsreader wordmark + "Financial Coaching" italic subtitle on the left, client name + date on the right, gold hairline beneath. Hidden on screen via `@media screen{.ga-print-header{display:none!important}}`.
- New `.ga-print-footer` class — italic disclaimer + page number, gold hairline above.
- New `.ga-print-page` utility class — `break-before: page` for explicit page breaks between report sections.
- New `.ga-emoji` utility class — `display:none` in print so future JSX can wrap leading emojis to hide them from print without changing screen rendering.
- `@page` margins tightened to `18mm 14mm 22mm 14mm` (top/sides/bottom — leaves room for footer).
- Background: pure white (was light grey) — cleaner print + lower toner use.

**Intake-form PDF template rebuilt** (`exportIntakePDF` in App.jsx ~line 506).
The static printable blank intake form (the one advisors print to hand to clients in person) now matches the spec:
- Google Fonts `<link>` injected at the top of the HTML head (Newsreader / Source Serif 4 / Plus Jakarta Sans / JetBrains Mono).
- Body: Source Serif 4 (was system-ui).
- Title: Newsreader italic 22pt, centered.
- Subtitle: Plus Jakarta Sans 8.5pt, uppercase, 0.08em tracking.
- Branded header on every page: monogram SVG + "GOLDEN ANCHOR" wordmark + "Financial Coaching" italic subtitle on the left, client name + "Issued [date]" on the right, gold hairline beneath.
- Section headers: gold hairline (was blue block fill). 0.14em tracking, uppercase, weight 800.
- Helper callout: cream background (was yellow), gold left border, italic body — softer than the old amber block.
- Tables: dashed row borders (was solid grey), JetBrains Mono right-aligned for numeric cells, Plus Jakarta Sans uppercase column headers.
- Footer: gold hairline above + italic disclaimer left ("Educational financial coaching — not investment, tax, or legal advice. Golden Anchor · goldenanchor.life") + date on the right.
- Print button restyled in brand gold (was olive).
- ⚓ emoji removed from title (`⚓ ${L.title}` → `${L.title}`).

**What this does NOT change:** the visible-on-screen report layouts. Print output uses the same JSX, just restyled via the `@media print` block. So when you click 🖨️ Print on a Monthly Snapshot / Financial Statements / Complete Report, the browser print preview now shows: Source Serif 4 body, JetBrains Mono currency cells, gold-hairline section headers, white background. The on-screen rendering remains the dark navy advisor UI.

**Build marker:** `2026-05-21-v0210-pdf-print-rebuild`. App.jsx +~60 lines (print CSS block + intake template rebuild). No new files. `vercel.json`, `package.json`, `translations.js`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Smoke tests:**
1. **Intake form PDF.** Open any client → ClientDetail → 📋 Intake → click "📄 PDF (EN)" or "📄 PDF (ES)" — new tab opens with the rebuilt template. Header: monogram + "GOLDEN ANCHOR" wordmark + "Financial Coaching" italic. Title: Newsreader italic. Sections have gold hairlines (no blue blocks). Tables: dashed rows + mono currency. Footer: italic disclaimer + date.
2. **In-browser Save as PDF.** Open any client → Reports → Monthly Snapshot → click 🖨️ Print. Browser print preview should show: Source Serif 4 body, currency in JetBrains Mono, gold hairlines under section headers, white background. Sidebar and TopBar hidden. Page-break-inside protections in place for tables + cards.
3. **No emoji in print headers.** Section dividers in printed report should NOT show leading emoji (📊 / 💼 / etc) — they're hidden via the `.ga-emoji` class. (Existing JSX still renders them on screen.)
4. **Print background.** Chrome print dialog should show a white background by default (was light grey). Background graphics toggle still required for colored cards to print.

**Future polish (not in v0.21.0):**
- Wrap every leading emoji in section headers with `<span class="ga-emoji">…</span>` so they auto-hide in print. Currently the CSS rule exists but is a no-op until JSX is updated.
- 3-up KPI strip on Monthly Snapshot print page (Net Income / Bills / Discretionary, with Discretionary in gold). Spec exists at `preview/18-pdf-reports.html`.
- Server-side `displayHeaderFooter` for page numbers via Puppeteer (would let `/api/render-report-pdf` include "Page X of Y" in the email PDF).

---

## v0.20.0 — 2026-05-21 — Dashboard donut + Email support modal + sort relocated to Clients tab + alert card parity

Direct follow-up to Mauricio's v0.19.0 feedback.

**(1) Sidebar Clients hamburger reverted.** The 3-line dropdown next to the Clients nav row from v0.19.0 was the wrong location. The nav row is back to plain icon+label (no menu). The sort options moved INTO the Clients tab page.

**(2) Sort dropdown added to the Clients tab.** New `sortBy` state in `ClientList`, with options: Name · Recent activity · Debt · Income · Net worth. Renders as a dropdown next to the search input. Sort applies live to the filtered list.

**(3) Email Support → in-app modal (Resend, not mailto).**
- New API endpoint `api/send-support-email.js` — POST, requires Supabase JWT, sends to `finance@goldenanchor.life` via Resend with reply-to set to the advisor's account email. Includes the advisor name, account email, user ID, and build marker in the body for context.
- New `gaSendSupportEmail` client helper (POST with Bearer JWT, same pattern as `gaSendIntakeInvite`).
- New `EmailSupportModal` component — in-app form with reply-to display, subject input (pre-filled), message textarea. Send button shows busy state; success state shows checkmark and auto-closes.
- `HelpSupportPage` "Email support" button now opens the modal instead of a `mailto:` link.

**(4) Dashboard: second chart — Net Worth Distribution donut.** The Income vs Spending chart was too big alone. Now in a 2-col grid (3fr / 2fr on desktop, stacks on mobile). New right-side card:
- Title: 💎 Net Worth Distribution
- Donut showing the count of active clients in each net worth tier: Negative (red) / $0–50K (warning) / $50K–250K (blue) / $250K+ (gold). Empty tiers are filtered out.
- Center text: "Total Net" + the sum of all active clients' net worth (in JetBrains Mono, gold if positive, red if negative).
- Legend on the right side of the card with count per tier.
- Empty state: "Add clients to populate" when there are no active clients.
- Income vs Spending chart height reduced 260px → 230px to balance the row.

**(5) Alert cards — visual parity + Client Due gets settings.**
- Removed the leading emojis (🔔 / 👥) from both Advisor Alerts and Client Due card titles.
- Count now renders inline as "· N" in the warning color (JetBrains Mono) instead of as a separate badge — one "icon" per card head (the count) instead of two (emoji + badge).
- **Client Due now has its own ⚙️ Settings button** (same as Advisor Alerts had). Clicking it opens the same `AlertsSettingsModal` (single source of truth — both cards share the alert thresholds).

**Build marker:** `2026-05-21-v0200-sort-emailsupport-donut-alerts`. App.jsx +~120 lines. New file `api/send-support-email.js`. `vercel.json`, `package.json`, `translations.js` unchanged from v0.19.0. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**One new env var to set in Vercel:** `SUPPORT_INBOX` is optional (defaults to `finance@goldenanchor.life` if unset). `RESEND_API_KEY` + `RESEND_FROM` were already configured for the intake-invite flow — `send-support-email` reuses them.

**Smoke tests:**
1. **Sort.** Open Clients tab. New "Sort: Name" dropdown next to the search bar. Change to "Sort: Debt" → list re-orders by total liabilities descending.
2. **Email support modal.** MH dropdown → Help & support → click "📧 Email support". A modal pops up (no longer opens Outlook/Mail). Type a message, click Send. Should show "Message sent!" checkmark within ~2s and auto-close.
3. **Verify email landed.** Check `finance@goldenanchor.life` inbox — message should arrive with subject `[Support] <your subject>`, from `Golden Anchor <noreply@finance.goldenanchor.life>`, reply-to set to your account email.
4. **Dashboard layout.** Two charts side by side: Income vs Spending on the left (~60%), Net Worth Distribution donut on the right (~40%). Total Net Worth shown in the donut center.
5. **Alert cards parity.** Both Advisor Alerts and Client Due have a single ⚙️ Settings button in the top-right corner. Title shows count as "· N" inline, no emoji prefix.
6. **Sidebar.** No hamburger next to Clients in the sidebar nav (reverted). Just plain "Clients" nav item.

---

## v0.19.0 — 2026-05-21 — Sidebar polish + Client Detail tab arrows + side-by-side alerts + ES translations

5 of 6 pending items from the v0.18 spec, plus the small "Email support" copy fix.

**Email support fix** (`HelpSupportPage`).
- Button label: "Email Mauricio" → "📧 Email support".
- Email target: `mauricio@goldenanchor.life` → `finance@goldenanchor.life`.
- Subject pre-filled: "Golden Anchor app — support request".
- Body pre-filled with placeholder text + advisor name + account email + build marker for context.

**(1) Sidebar Clients hamburger menu** (matches `ui_kits/advisor_app/Sidebar.jsx:135-181`).
- New 3-line button (28×28, gold-tinted when open) next to the "Clients" nav row in both mobile drawer and desktop sidebar (hidden when collapsed).
- Dropdown items: All clients · Add new client · Send invite · ── · Export all (CSV) · Import (CSV) · Show archived (N) · ── · Sort by recent / debt / name (checkmark on active).
- Outside-click closes the menu (mousedown listener).
- Export all (CSV) generates a CSV with First / Last / Email / Phone / Archived / Income/mo / Total Debt and downloads it.
- Import (CSV) opens the existing `ImportWizard`.
- New state: `clientsMenuOpen`, `clientsSort`, `sidebarImportOpen`.

**(2) Collapsed sidebar finishing pass.**
- Width 62px → 64px to match design.
- Header in collapsed state is now a 40×40 gold-tinted button with the SVG monogram inside (background `rgba(201,168,76,0.08)`, 1px border `rgba(201,168,76,0.2)`). Click → expand.
- Expanded state: monogram-svg + "Golden Anchor" wordmark in Newsreader uppercase 13px gold (matches `colors_and_type.css .ga-wordmark`).
- Transition smoothed to `0.25s cubic-bezier(0.2,0.8,0.2,1)`.
- Active nav item gets a 3px gold left rail in addition to the tinted background (matches design exactly).
- Header `minHeight: 72` so the brand block doesn't squeeze.

**(3) ClientDetail tab scroll arrows.**
- The 8-tab primary row (Report / Monthly / Financial Statements / Investments / Plan / Calculators / Backfill / Notes) now has `‹` and `›` arrow buttons on either end.
- Arrows are 28×36px, gold-bordered when scrollable, dimmed at edges.
- `tabRowRef` + scroll listener tracks `canScrollL` / `canScrollR` and disables the buttons at the limits.
- Inner row is `overflow-x: auto` with hidden scrollbar + scroll-snap-type for clean snapping.
- Mouse-wheel vertical scroll on the row converts to horizontal.

**(4) Side-by-side Advisor Alerts + Client Due cards** (matches Claude design).
- `RemindersPanel` rewritten. Old: single tabbed widget with switch between Advisor Alerts and Client Due. New: 2-column grid (`data-ga-grid="two-col"`, collapses to 1 col on mobile) showing BOTH cards at the same time.
- Each card has its own header with count badge + (Advisor only) gear button for alert settings.
- Each card has its own search input (Advisor side) and sort selector.
- Each card has its own Show More / Show Less button (Advisor shows top 5 → 20, same for Client).
- Per-card empty states.

**(5) PDF rebuild** — partial. `api/render-report-pdf.js` was already rebuilt in v0.15.0 (Phase 3 of the design port: Source Serif 4 body, Newsreader italic titles, JetBrains Mono currency, no emoji, gold hairlines, monogram in header). The in-app `window.open` print routes were NOT rebuilt in v0.19.0 due to scope — DEFERRED to v0.19.1 as Prompt 10. Server-side email PDF (`/api/render-report-pdf`) is already correct; the in-browser "Save as PDF" flow still uses the older inline print HTML.

**(6) Translation keys for v0.17 / v0.18 / v0.19 new strings.** ~80 keys added to both `T.en` and `T.es` in `src/translations.js`:
- Page headers (securityHdr, billingHdr, backupHdr, archivedClientsHdr, whatsNewHdr, helpHdr) and their sub-text.
- Avatar dropdown labels (menuProfile / menuSettings / menuSecurity / menuBilling / menuBackup / menuArchived / menuWhatsNew / menuHelp) + sub-labels.
- All SecurityPage strings (changePassword, newPassword, confirmPassword, passwordMin8, passwordMismatch, passwordUpdated, updatePassword, securityNote).
- All BillingPage strings (serviceCatalog, addService, noServices, serviceNamePh, stripeUrlPh, billingNote).
- All BackupPage strings (downloadEverything, downloadBackup, restoreFromBackup, uploadBackup, backupNote).
- All ArchivedClientsPage strings (noArchivedClients, restoreLbl, deletePermanent).
- All HelpSupportPage strings (stillNeedHelp, stillNeedHelpSub, emailSupport).
- All AvatarPicker strings (chooseProfileImage, brandLbl, financeLbl, animalsLbl).
- Sidebar Clients menu (allClients, addNewClient, sendInvite, exportAllCsv, importCsv, showArchived, sortByRecent, sortByDebt, sortByName).
- Reminder panel (showLess, showMore, noAdvisorAlerts, noBillsDueSoon, dayPrefix).
- Settings card labels (advisorInformation, appearance, localization, reminders, servicesAndStripeLinks, backupAndData, profileSettingsSub).
- Spanish translations in Latin-American register.

**Build marker:** `2026-05-21-v0190-sidebar-hamburger-collapsed-tabs-alerts-i18n`. App.jsx ~+200 lines from v0.18.0. `src/translations.js` +~80 keys × 2 langs. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Still deferred to v0.19.1:**
- In-app print HTML routes rebuild (Prompt 10). Server-side `api/render-report-pdf.js` is already done since v0.15.0. The browser "Save as PDF" flow needs the same treatment.
- ClientDetail sub-tab restructure (Prompt 5 in spec) — only the scroll arrows on primary tabs landed here; the gold-pill segmented sub-tab control + restructured sub-tab content map still pending.

**Smoke tests:**
1. **Email support.** MH dropdown → Help & support → click "Email support" → mail client opens with `finance@goldenanchor.life` as recipient + pre-filled subject + body.
2. **Sidebar Clients hamburger.** Hover over the Clients nav row in the sidebar → a 3-line button appears on the right. Click it → dropdown with All clients / Add new / Send invite / Export / Import / Show archived (N) / Sort options. Click outside to dismiss.
3. **Collapsed sidebar.** Click `‹` to collapse. Sidebar shrinks to 64px. The header becomes a gold-tinted square with the anchor monogram. Click that square → expands back.
4. **Tab scroll arrows.** Open any client. The 8-tab primary row at the top has `‹` and `›` buttons on either end. They're dimmed when at the edge. Click → scrolls 260px.
5. **Side-by-side alerts.** Dashboard. The Reminders area shows TWO cards side by side: Advisor Alerts on the left, Client Due on the right. Each has its own search/sort/Show More.
6. **Spanish.** Switch to ES via TopBar. Open the avatar dropdown → menu items in Spanish. Open Security / Billing / Backup / Archived / What's new / Help — page titles and content all in Spanish.

---

## v0.18.0 — 2026-05-21 — Avatar picker + 6 new TopBar dropdown pages, sidebar cleanup

The MH avatar dropdown now actually goes somewhere. Each item in the menu opens its own dedicated page instead of being a dead placeholder.

**New: AvatarPicker modal.**
- 12 SVG presets organized in 3 groups: Brand (MH gold, MH navy, anchor, monogram cream), Finance (gold coin, growth chart, briefcase, key), Animal (fox, owl, whale, bear).
- SVGs copied from `assets/avatars/` to `public/avatars/`.
- "Profile" item in avatar dropdown opens the picker.
- Selected avatar persists in `settings.avatarId` and shows in TopBar + sidebar bottom widget (replaces the gold initials chip).

**New: SecurityPage** (`nav="security"`).
- Change password via `supabase.auth.updateUser({password})`. New password + confirm.
- 8-char minimum. Mismatch detection. Shows success on completion.
- Other devices' sessions stay signed in until they expire.

**New: BillingPage** (`nav="billing"`) — services & Stripe links editor.
- Replaces the old Services & Stripe section that was buried inside ProfileModal.
- Service catalog as an editable list: name + price + Stripe URL per row.
- Add service / Delete service buttons.

**New: BackupPage** (`nav="backup"`).
- Download all clients + settings as JSON (one click — uses existing `expBackup` helper).
- Restore from a backup JSON via `BackupImportModal` (merge or replace prompt).

**New: ArchivedClientsPage** (`nav="archived"`).
- Lists all clients where `archived === true`.
- Each row: avatar + name + email + Restore button (green) + Delete button (red, with confirm).
- Empty state when nothing is archived.

**New: WhatsNewPage** (`nav="whats-new"`).
- Hardcoded list of recent versions (v0.18 / v0.17 / v0.16 / v0.15) with bullet points.
- Edit `WHATS_NEW_ENTRIES` array in App.jsx to add new entries.

**New: HelpSupportPage** (`nav="help"`).
- 6 seed FAQ entries (collapsible accordions): how to add a client, why isn't my signature showing, how to send an intake invite, how to export, how to change password, why are numbers blurred.
- Edit `FAQ_ENTRIES` array to add more.
- Gold-tinted callout at the bottom with a mailto link to the advisor's settings.advisorEmail (defaults to mauricio@goldenanchor.life).

**TopBar dropdown rewired.** Each menu item now navigates to its dedicated page via the new `onNav` prop:
- 🖼 Profile → opens AvatarPickerModal
- ⚙️ Settings → nav="settings"
- 🛡️ Security → nav="security"
- 🏷️ Billing & plan → nav="billing"
- 💾 Backup data → nav="backup"
- 🗂 Archived clients (N) → nav="archived" (N is the live count)
- 📥 What's new → nav="whats-new"
- ❓ Help & support → nav="help"
- 🚪 Sign out → Supabase signOut

The TopBar avatar itself is now a real `AvatarImg` (showing the chosen SVG) instead of the gold initials chip when one is set.

**Sidebar cleanup.**
- Removed Theme toggle from the sidebar bottom (lives in TopBar).
- Removed EN/ES toggle from the sidebar bottom (lives in TopBar).
- Removed Sign Out button from the sidebar bottom (lives in the avatar dropdown).
- Sidebar bottom is now just the profile widget: avatar (chosen SVG) + advisor name + small gold "⚙️ Profile & settings ›" link. Click → navigates to Settings page.
- Mobile drawer + desktop sidebar both updated identically.
- Sidebar bottom widget no longer uses initials — uses the chosen `AvatarImg` from `settings.avatarId`.

**Promotions** — already had a "＋ New Promotion" button at App.jsx:2383, no change needed.

**Build marker:** `2026-05-21-v0180-avatar-security-billing-backup-archived-whatsnew-help`. App.jsx 3,759 → ~4,070 lines (+~310 for AvatarPicker + 6 page components + AvatarImg + AVATAR_PRESETS + WHATS_NEW_ENTRIES + FAQ_ENTRIES). `public/avatars/*.svg` (12 new files). `src/translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Still pending (next iteration):**
- Sidebar Clients hamburger menu (3-line button on Clients row → All clients / Add new / Send invite / Export / Import / Show archived / Sort dropdown). Matches `ui_kits/advisor_app/Sidebar.jsx:135-181`.
- Collapsed sidebar finishing pass — 64px wide, gold-tinted monogram tile, true icons-only nav.
- ClientDetail tab scroll arrows + reorganized sub-tabs (Prompt 5 from spec).
- PDF rebuild (Prompt 10 from spec) — emoji-free, Newsreader italic titles, gold hairlines, per-page branded header + footer.
- Side-by-side ADVISOR ALERTS + CLIENT DUE panels (currently still single tabbed widget).
- Translation keys for all new labels (currently fall through to English fallbacks).

**Smoke tests:**
1. **Avatar picker.** Top-right MH → Profile. Modal opens with 12 avatars in 3 groups. Click one. Modal closes. TopBar + sidebar bottom now show the chosen SVG instead of MH initials.
2. **Security.** MH dropdown → Security. Type a new password twice. Click Update. Should show success message; you stay logged in.
3. **Billing & Plan.** MH dropdown → Billing & plan. See your services catalog. Add a service, set name + price + Stripe URL. Delete one.
4. **Backup.** MH dropdown → Backup data. Click Download backup → JSON file downloads. Upload one → see merge/replace prompt.
5. **Archived clients.** MH dropdown → Archived clients (N). List of archived clients with Restore + Delete buttons.
6. **What's new.** MH dropdown → What's new. See the v0.18.0 / v0.17.0 / v0.16.x / v0.15.x release notes.
7. **Help & support.** MH dropdown → Help & support. Click any FAQ to expand. Click Email Mauricio → opens your email client with mauricio@goldenanchor.life pre-filled.
8. **Sidebar cleanup.** Sidebar bottom shows ONLY the profile widget (avatar + name + Profile & settings link). No Sign Out, no Theme toggle, no EN/ES — all in the TopBar now.

---

## v0.17.0 — 2026-05-21 — TopBar + Settings page (match Claude design)

Closes the gap between the live app and `ui_kits/advisor_app/index.html` for the two highest-visibility surfaces.

**New `TopBar`** above every page (matches `ui_kits/advisor_app/TopBar.jsx`):
- Title (and breadcrumb when a client is selected) on the left
- EN/ES segmented switch, hide-numbers toggle, theme toggle, **avatar dropdown** on the right
- Avatar is a gold initials bubble (`MH`) — click opens the big account menu: header card with name/email/Signed-in badge, then Profile · Settings · Security · Billing & plan · Backup data · Archived clients · What's new · Help & support · Sign out
- Mobile: hamburger button on the left opens the existing drawer
- Replaces the old slim mobile-only app bar that just showed the page title

**New `nav==="settings"` route + `SettingsPage` component** (matches `SettingsView` in the kit's `index.html`):
- Full-page replacement for the old scrollable `ProfileModal` as the *primary* settings surface
- 2-column grid of read-only cards: 👤 Advisor Information / 🎨 Appearance / 🌍 Localization / 🔔 Reminders / 💼 Services & Stripe Links / 💾 Backup & Data
- Each card has an **Edit** button that opens the existing `ProfileModal` (no change to the editor itself — only the entry point)
- Auto-collapses to 1 column on mobile (`data-ga-grid="two-col"`)
- Archived clients banner at the bottom when any exist

**Wire-up changes:**
- Sidebar bottom widget (mobile drawer + desktop sidebar) now navigates to `nav="settings"` instead of opening the modal
- Avatar dropdown's "Profile" / "Settings" / "Security" / "Billing" / "Backup" / "Archived" all route to `nav="settings"` then open the relevant edit modal
- Sign-out from the avatar dropdown calls `supabase.auth.signOut()` (same as the legacy sign-out)

**New components:** `SettingsCard`, `SettingsPage`, `AvatarBubble`, `TopBar` (all defined above the `App()` function).

**Build marker:** `2026-05-21-v0170-topbar-and-settings-page`. App.jsx 3,581 → 3,759 lines (+178). `src/translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Still pending (next iteration):**
- Sidebar **Clients hamburger menu** (3-line button on the Clients nav row → dropdown with All clients / Add new / Send invite / Export CSV / Import CSV / Show archived / Sort by recent / Sort by debt). Matches `ui_kits/advisor_app/Sidebar.jsx:135-181`.
- Sidebar **collapsed state** finishing pass — icons-only, narrower (64px vs current 62px), gold-tinted monogram tile up top, avatar-only at the bottom. Matches `ui_kits/advisor_app/Sidebar.jsx:52-66, 227-235`.
- **PublicIntake Welcome screen** before step 1 — anchor logo + "GOLDEN ANCHOR" + tagline + Start intake / I have an invite token buttons. Matches `ui_kits/client_portal/index.html` WelcomeScreen.
- **Side-by-side Advisor Alerts + Client Due panels** (currently still a single tabbed widget).
- **Avatar picker** modal — change profile image from the dropdown.
- Translation keys for the new labels in `SettingsPage` + `TopBar` (currently fall through to English fallbacks).

**Smoke tests:**
1. **TopBar visible on every page.** Open any nav section. The top of the content area shows the page title on the left, EN/ES + hide + theme + avatar on the right. The MH avatar is a gold initials bubble.
2. **Avatar dropdown.** Click the MH avatar. A 280px-wide dropdown opens with your name/email/Signed-in badge at top, then Profile / Settings / Security / Billing / Backup / Archived clients / What's new / Help / Sign out items. Each shows an icon + label + optional sub-label.
3. **Settings page.** Click the sidebar's bottom profile widget (avatar + name). Lands on a new full-page Profile & Settings view with 6 cards in a 2-column grid. Each card has its rows + an Edit button on the bottom-right.
4. **Edit modal still works.** Click Edit on any card. The existing ProfileModal opens (unchanged). Make a change, Save. The card on the Settings page updates with the new value when you return.
5. **Sign out from avatar.** Open the avatar dropdown, click Sign out (red). Supabase session is killed, login screen appears.

---

## v0.16.1 — 2026-05-21 — SignaturePad default = typed, label cleanup

Patch on top of v0.16.0 from Mauricio's smoke-test feedback.

- **`SignaturePad` default mode is now `typed`** instead of `draw`. The initializer flipped from `useState((value&&value.kind==="typed")?"typed":"draw")` → `useState((value&&value.kind==="drawn")?"draw":"typed")`. If a drawn signature is already saved on the value, it still opens in draw mode; everything else (including all new signature pads — client signature on intake page 3, advisor signature in Profile & Settings) opens in typed mode by default. Drawing is opt-in via the toggle.
- **Typed-tab label** changed from `"Type name + date"` → `"Type name"`. Translation key `t.sigTypedTab` updated. The actual input has never collected a date; the old label was misleading.

**Build marker:** `2026-05-21-v0161-sig-default-typed`. App.jsx 3,581 → 3,581 lines (in-place, +28 chars from the comment + condition flip + label change). `src/translations.js`, `vercel.json`, `package.json`, `api/*` unchanged. No SQL migration. No new pitfalls. No new locked decisions.

---

## v0.16.0 — 2026-05-21 — Phase 8 dashboard restructure + 7 bugfixes

**Phase 8 — Dashboard restructure to match Claude design `ui_kits/advisor_app/index.html`.**
- **4 wide KPI cards** replace 6 narrow ones: Clients (X active · Y archived) / Combined Net / mo / Combined Debt / Liquid Assets (checking + savings). Tagged `data-ga-grid="kpi-4"` for the v0.9.3 mobile-collapse rule.
- **Income vs Spending composed chart** replaces the 3-column donuts + small area chart row. Single ~260px `<ComposedChart>` with two `<Bar>` series (income green, spending red) plus a gold `<Line>` net overlay. Per-month data from `monthSnapshots`. Mono Y-axis with `fmtS()` ticks. Inline legend chips. Range (3mo/6mo/12mo/All) and filter (All/Revolving/Current) pills retained.
- **Sidebar advisor profile widget** replaces the prominent gold "Profile & Settings" button: gold-bordered avatar circle (advisor initials), name in main color, small gold "⚙️ Profile & settings" sub-label. Click opens ProfileModal. Mobile drawer + desktop sidebar both updated. Desktop sidebar collapses cleanly when `sidebarCollapsed` (just the avatar). Theme + Language buttons moved above the profile widget.
- Recharts import extended with `ComposedChart, Line, Legend`.

**Bugfix pass (7) from Mauricio's v0.15.0/v0.15.1 smoke test:**
1. **One-character-at-a-time on `ToggleField` inputs (company phone, business address, etc).** Root cause: `ToggleField` was defined inside `ProfileModal`'s body as `const ToggleField=({k,label})=>...`. Every parent re-render created a new component function reference → React saw a type change → unmounted + remounted the `<input>` → focus lost after each keystroke. Fix: extracted to top-level `ProfileToggleField({k,label,s,setS,th,INP})` above `ProfileModal`. All 4 call sites updated.
2. **Profile & Settings backdrop click closed the modal (draft lost).** Added `disableBackdropClose={true}` to its `<Modal>`. Must use ✕ or Save.
3. **Optional fields + Logos + Signature reorganized** into two collapsible cards (➕ Optional fields, 🎨 Branding) — both collapsed by default. Branding wraps Logos + Signature together.
4. **Advisor signature didn't show on the public intake engagement letter.** Root cause: `api/resolve-intake-invite.js` only returned `{advisorId, prospectName, prospectEmail, prospectPhone, lang}` — the advisor's settings (including signature) were never exposed to the public intake. Fix: server now does a service-role `from("settings").select("data").eq("user_id", row.user_id).maybeSingle()` after resolving the invite, returns a **curated public subset** as `advisorProfile`: advisorName, advisorEmail, advisorPhone, companyName, companyPhone(+has_), businessAddress(+has_), website(+has_), ig, logoLight, logoDark, advisorSignature, services, stripeLinks, ongoingFeeAmount, ongoingFeeMonthlyLite. **No sensitive fields**. PublicIntake reads `r.advisorProfile` (falls back to legacy `r.advisorSettings`). EngagementLetter now renders the advisor's signature (drawn / typed / legacy string — all 3 paths from v0.15.1 work).
5. **Engagement letter header redesigned.** Old: anchor logo / firm name (big bold) / italic subtitle / `Firm: …` `Phone: …` `Email: …` `Tagline: …` labeled block. New: anchor logo / **Advisor Name** (big bold) / Firm name (lighter weight) / italic subtitle / gold rule / `phone · email` plain text (no labels) / italic tagline below if set. The `firmBlock` array in `engagementLetterTemplate.js` is no longer rendered.
6. **Public intake submit/pay flow split.** `goSubmit(payNow)` parameterized. Step 4 now shows two buttons: "Submit intake" (gold filled — records intake only) and "💳 Submit & pay now" (gold outlined — records intake AND redirects to Stripe; only renders when `selectedService.stripeUrl` is set). Bad / missing Stripe URL surfaces a clean error instead of a silent throw. Italic helper below the buttons: "You can pay later, by check, or in cash — your advisor will follow up." Step 1–3 "Continue →" button unchanged.
7. Build marker bumped.

**Out of scope (deferred):**
- Side-by-side ADVISOR ALERTS + CLIENT DUE panels. The Claude mockup shows two separate panels; current `RemindersPanel` is a single tabbed widget. Splitting requires refactoring into 2 presentational components driven by the same `getAdvRem` / `getClientDue` helpers. Will revisit if Mauricio pushes back.
- Translation keys for new labels (`combinedNetMo`, `combinedDebt`, `liquidAssets`, `incomeVsSpendingHdr`, `spending`, `netLbl`, `archivedLbl`, `intakePayNow`, `intakePayLaterHint`, `intakeStripeUrlBad`, `intakeNoStripeLink`, `brandingHdr`, `personalInfoHdr`, `goalsAndNotesHdr`, `shortTermLbl`, `midTermLbl`, `longTermLbl`, `generalNotesLbl`, `howHeardLbl`, `howHeardPlaceholder`, `checkingSavingsLbl`, `active`) — fall through to English fallbacks via `t.foo||"…"`. ES users see English for these specific labels. Translation pass deferred to a separate session.

**Build marker:** `2026-05-21-v0160-phase8-dashboard-and-fixes`. App.jsx 3,469 → 3,581 lines. `src/engagementLetterTemplate.js` unchanged from v0.15.1. `api/resolve-intake-invite.js` +30 lines. `vercel.json`, `package.json`, `translations.js` unchanged. No SQL migration. No new pitfalls. No new locked decisions. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

**Smoke tests after deploy:**
1. **Dashboard layout** — 4 wide KPIs across the top, single big Income vs Spending chart (green income bars, red spending bars, gold net line overlay) below.
2. **Sidebar profile widget** — bottom of sidebar shows initials in gold-bordered circle + your name + small gold "Profile & settings" link. Click opens Profile & Settings.
3. **Profile & Settings backdrop click** — click outside the modal in the dark area. Modal stays open (was: closed and lost draft).
4. **One-char-at-a-time fix** — Profile & Settings → expand Optional fields → check Company Phone → type a multi-digit number. Should type all digits in one go.
5. **Advisor signature on public intake** — draw or type your signature in Profile & Settings → Branding. Open `/intake?invite=<token>` in incognito → step to engagement letter (step 3). Top of letter shows YOUR signature (not the grey placeholder).
6. **Engagement letter header** — step 3 header reads: logo / **Your Name** (big) / Company name / italic subtitle / gold rule / `phone · email` plain. No `Firm:` / `Phone:` / `Email:` / `Tagline:` labels anywhere.
7. **Submit vs Pay** — step 4 shows two buttons (Submit intake + 💳 Submit & pay now, the latter only if Stripe link is configured). Submit intake does NOT redirect. Submit & pay redirects to Stripe (or shows clear error if link is bad).

---

## v0.15.1 — 2026-05-21 — v0.15.0 follow-up bugfix pass

Five real bugs from Mauricio's v0.15.0 smoke test:

1. **Missing `IntakeFormBody` component defined.** Referenced at App.jsx:2809 (PublicIntake step 4) and App.jsx:3066 (IntakeSubmissionEditor) since v0.7.1 but **never actually written**. Every public intake's step 4 rendered blank because React crashed on the undefined component. New `IntakeFormBody({draft,setDraft,t,TH,lang})` placed before `PublicIntake` wraps `IncomeSection`/`BillsSection`/`DebtSection`/`CustomAssetsSection` against the draft state, plus address/DOB/SSN/partner-DOB-SSN/how-heard fields and short/mid/long-term + general notes textareas.
2. **EngagementLetter Section 4 simplified.** Removed Investment Management AUM line and Product Commissions line from both EN and ES `section4` objects. Default `ongoingFeeAmount` changed `"1,200"` → `"500"`; new `ongoingFeeMonthlyLite: "30"` replaces `ongoingFeeQuarterly`. Text reads "$500 annually (or $30 per month under the Lite plan, if applicable)." Only two bullets remain: Ongoing Fee + Referral Fees.
3. **Sidebar wordmark → Newsreader italic uppercase.** v0.15.0 Phase 2 missed both sidebar wordmark sites (mobile drawer + desktop sidebar) — still Georgia bold. Fixed via `replace_all` — `fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",letterSpacing:"0.10em",textTransform:"uppercase",fontWeight:500`.
4. **ToS modal Accept button hardened.** Removed `disabled={!checked}` attribute (some mobile WebViews honor it unreliably during React rapid re-renders). Gating is now JS-only: `()=>{ if(checked) onAccept(); }`. Button bumped to 14px / `minHeight:48` / `touchAction:"manipulation"` for proper mobile tap target. Background uses literal `GOLD`, text flips to navy when active for readable contrast.
5. **Advisor signature typed-mode persistence bug.** Profile signature pad's `onChange` was saving `v.dataUrl` — for typed signatures `v.dataUrl` is `undefined` (typed mode has `v.text`), so saving wiped the signature back to `""`. Now persists the full object `v` (or `""` to clear), with a `value`-prop normalization that keeps legacy string-shaped `settings.advisorSignature` values working. `EngagementLetter`'s advisor signature render expanded to a 4-branch IIFE: empty → grey placeholder, string → legacy `<img src>`, `kind:"drawn"` → `<img src={sig.dataUrl}>`, `kind:"typed"` → cursive Brush Script MT text node.

**Build marker:** `2026-05-21-v0151-intake-and-sig-fixes`. App.jsx 3,417 → 3,469 lines. `src/engagementLetterTemplate.js` -8 lines.

---

## v0.15.0 — 2026-05-21 — Claude Design System port (Phases 1–4)

The Claude Design handoff had been delivered but never applied. v0.15.0 ports four of the seven phases into the live app.

**Phase 1 — Brand assets in `public/`.** `anchor-monogram.svg` and `logo-anchor.png` copied from the design-system bundle. `index.html` favicon now points at the SVG monogram first; PNGs kept as legacy fallback. `LogoImg` (App.jsx ~line 2468) rewritten with size-aware fallback: `≤ 48px` uses the geometric SVG monogram, `> 48px` uses the photographic anchor, ⚓ emoji is the final `onError` fallback only.

**Phase 2 — Type system (Google Fonts).** `index.html` loads Newsreader, Source Serif 4, Plus Jakarta Sans, and JetBrains Mono. The three `fontFamily:"system-ui,sans-serif"` declarations in App.jsx become `"'Plus Jakarta Sans',system-ui,sans-serif"`. Main app shell additionally inherits `fontVariantNumeric:"tabular-nums"` + `fontFeatureSettings:"'tnum' 1"`. Three wordmark sites (Login, intake confirmation, intake form header) switched to Newsreader italic uppercase with 0.10em letter-spacing.

**Phase 3 — PDF report rebuild (`api/render-report-pdf.js`).** Print HTML `<style>` block fully rewritten. Body uses Source Serif 4 (was system stack). Section headers use Plus Jakarta Sans, weight 800, 0.08em letter-spacing; the gold underline shrunk from 2px to a 1px hairline per spec. New `.report-title` class uses Newsreader italic 26px. Brand mark changed from a `<div>⚓</div>` to `<img src="https://finance.goldenanchor.life/anchor-monogram.svg">`. All 9 `<div class="section-hdr">EMOJI ${L.fooHdr}</div>` sites have leading emoji stripped (income / bills / debt / assets / investAllocation / financialRatios / cashFlow / strategyPlan / notes). New `.mono`/`.money`/`td.num` selectors hook JetBrains Mono with tabular-nums for future selective use on currency cells. Email signature in `buildEmailBody` gets the same brand-font treatment with the SVG monogram + Newsreader italic wordmark.

**Phase 4 — Recharts BarChart → AreaChart everywhere.** 6 BarChart sites swapped: Dashboard debt-trend mini-chart, SummarySection Monthly Debt Trend, ClientDetail 2-up Debt/Cash Flow trends, FullReport Trends section (Debt vs Savings + Cash Flow), YearCompareView's 4 small year-aggregate KPI charts. All charts now use a smooth filled area with a 2px stroke (color-coded — th.neg / th.pos / GOLD / f.c), fill at 33-alpha, no point dots, tooltip on hover for exact values. All `<LabelList>` value-above-bar labels removed per spec.

**Out of scope (per Mauricio):** Phase 5 (responsive — already largely shipped v0.9.x–v0.13.x), Phase 6 (Spanish polish — closed v0.12.2), Phase 7 (Lucide — marketing only). Three-up KPI strip override for Monthly tab in print, page-number footer via Puppeteer `displayHeaderFooter`, anchor-monogram inline-base64 embed — all deferred.

**Build marker:** `2026-05-21-v0150-design-system-port`. App.jsx 3,417 lines (no net change). `api/render-report-pdf.js` ~+30 lines. `index.html` +5 lines. New files: `public/logo-anchor.png`, `public/anchor-monogram.svg`. `src/translations.js` unchanged at 1,313 keys/side. `vercel.json` unchanged. `package.json` unchanged. No SQL migration. No new pitfalls. No new locked decisions. D-1, D-7, D-18, D-27-amended, D-28, D-30, D-31, D-34, D-36 preserved.

---

## v0.14.0 — 2026-05-21 (retroactive — shipped by parallel chat, documented here in v0.15.0)

**Engagement letter + ToS gate + services editor.** Closes O-14.

- **ToS click-through gate** — first-login modal: "I have read and accept the Terms of Service and Privacy Policy" + two PDF links. Modal cannot be dismissed without acceptance. Stores `settings.tosAcceptedAt` (ISO date) + `settings.tosVersion` (string). New `ToSModal` component in App.jsx (~line 2518). Uses existing Modal `disableBackdropClose` (v0.12.5).
- **Per-client engagement-letter "mark as signed" workflow.** New `client.engagementLetter: {signedAt, signedBy, ipHash}` schema field (default `{}`). `ClientDetail` header shows green pill "Engagement letter signed YYYY-MM-DD" when set, amber pill "⚠ No engagement letter on file" + "Mark as signed today" button when not. Click button → writes `{signedAt: today, signedBy: advisor.name, ipHash: null}`.
- **`EngagementLetter` component** (App.jsx ~line 2548) — renders the full letter with token substitution (firm name, advisor name, client greeting, selected service price, ongoing fee, AUM %, etc.) using `ENGAGEMENT_LETTER[lang]` template. Italic Georgia,serif body (intentional — printed letter context, not the brand sans).
- **`SignaturePad` component** (App.jsx ~line 2474) — canvas draw OR typed-name+date toggle. Touch + mouse drawing supported. Typed mode uses Brush Script MT italic for visual fidelity.
- **Services editor** — Profile & Settings gains a service-catalog editor surface (full structure preserved from prior `SVCS` constant; advisor can now adjust names, prices, descriptions, durations per-environment).

**Deferred (D-23 territory, multi-tenant):** in-app DocuSign-style signing flow, per-agent-uploaded engagement-letter PDF template.

No new locked decisions — code matched the O-14 Chat 11 spec verbatim. The `AGENT_v0.14.0_UPDATES.md` referenced in v0.13.4 history was never created; v0.15.0 supersedes it by folding the documentation directly into AGENT.md §3.

---

## v0.13.5 — 2026-05-21 (Patch — `PlanReportBlock` restructured into 5 self-contained cards to fix print BG-repaint failure)

Mauricio's v0.13.4 smoke test (Strategy Plan section printed with Background graphics enabled) confirmed the fix from v0.13.4 worked for the WHERE of page breaks — clean breaks now happen between mCARDs — but the underlying issue persisted: DEBT PAYOFF ORDER cards printed with dark BG on page 8, but FINANCIAL ROADMAP + Phase cards on page 9 floated on white background.

**Build marker:** `2026-05-21-v0135-strategy-plan-restructure`

### Diagnosis

Chrome paints container backgrounds **only on the first fragment** of a split container. This is a well-known browser limitation with no CSS-only fix — `print-color-adjust: exact` and `breakInside: avoid` don't change it.

### Fixed

**`PlanReportBlock` restructured.** The outer `<div mCARD>` wrapper became `<div>` (no background, no border). Each major section is now its own self-contained mCARD:

1. Card 1 — Strategy Plan title + KPI block + Debt Strategy caption
2. Card 2 — DEBT PAYOFF ORDER (only if `totalDebt > 0`)
3. Card 3 — FINANCIAL ROADMAP + Phase 1/2/3
4. Card 4 — INVESTMENT PROJECTION (only if `investPerMo > 0`)
5. Card 5 — Additional Notes (only if `ov.extra`)

All conditional rendering preserved. All inner cards unchanged.

---

For earlier entries (v0.13.4 and below), see prior CHANGELOG history in git log or AGENT.md §3 prior-version blocks.
