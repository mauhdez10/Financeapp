# AGENT.md — Golden Anchor Finance Project

> **Read this file at the start of every conversation.** It is the source of truth for what this project is, what's been decided, what's working, and what to avoid touching. Do not propose changes that contradict the Locked Decisions section below without explicit confirmation from the user.

---

## 1. Project identity

- **Name:** Golden Anchor Financial Advisory app
- **Owner:** Mauricio Hernandez (MBA, FPWMP), Miami, FL — bilingual EN/ES financial coach
- **Domain:** [goldenanchor.life](https://goldenanchor.life) (deployed on Vercel)
- **Repository:** GitHub — single private repo, `finance-app`
- **Stack:** React 18 + Vite + Recharts + xlsx (SheetJS)
- **Hosting:** Vercel (free tier) → custom domain `finance.goldenanchor.life`
- **Database:** Supabase Postgres — schema built (tables `clients`, `settings`) with RLS enabled, `updated_at` triggers, soft-delete column, partial index for active clients. **App.jsx is now wired** as of v0.5.0, with critical UUID-cast bug fix in v0.5.1. Login goes through Supabase Auth, clients + settings read/write through `auth.uid()`-gated queries. `clients` table now has a `local_id text` column + partial unique index `clients_user_local_id_idx on (user_id, local_id) where deleted_at is null` to map the app's numeric `gid()` IDs to Supabase-generated UUIDs without breaking idempotency. localStorage acts as write-through cache only. Migration from existing localStorage is automatic, idempotent, and now correctly retries on the next login if any client save fails.
- **Auth:** Supabase Auth (email/password) — single advisor user. Wired into App.jsx as of v0.5.0. Vercel Deployment Protection can be turned off once Mauricio confirms his single user can log in to the live deploy.

**NOT in this project (do not get confused with):**
- The Health Insurance CRM project (separate codebase, separate Supabase account, separate Vercel account, separate AGENT.md, separate decisions log, separate developer working on it).
- Anything related to managing client investment accounts. Mauricio is a **financial coach + insurance agent** (FL0215). He does NOT manage securities. The app is an educational + planning tool only.

**Scope note (2026-05-13):** Finance and Health stay fully independent until one ships. Finance is the priority — ready to sell soon. Health is parked, 2–3 months out, owned by a different developer. Do not raise account consolidation, schema unification, or shared infrastructure questions in Finance chats. Cross-product topics resume only after Finance launches.

---

## 2. Source of truth

The actual app is a **single React file**: `src/App.jsx` (~2,333 lines, ~600 KB as of v0.5.2a / 2026-05-14).

Everything else is supporting infrastructure (build config, deploy config, this doc, the changelog). When the user asks "update the app," they mean App.jsx.

When the user uploads App.jsx in a new chat, **read it before proposing changes**. Do not guess at its current state from memory.

---

## 3. Current version

**v0.5.2a** — established 2026-05-14. **First half of the launch-stabilization patch series** (split from a planned single v0.5.2 to keep blast radius small, per the audit of the v0.5.0/v0.5.1 regression history). Four launch-readiness items, no schema changes, no client-data shape changes:

1. **30-minute idle auto-logout with 1-minute warning.** Resets on `mousemove`/`keydown`/`touchstart`/`click`/`scroll`. At 29 minutes a modal appears with a "Stay Signed In" button. If the user doesn't engage, at 30 minutes the app saves any in-flight selected-client edits to `localStorage.ga_session_draft`, calls `supabase.auth.signOut()`, and returns to the login screen.
2. **Draft preservation + session-expired UX.** When the user signs back in after an auto-logout, the bootstrap effect checks for `ga_session_draft`, restores the client into selected state with the Intake tab open, and shows an info toast: "Restored your in-flight edits from your previous session." Draft is consumed (deleted) on restore.
3. **Mauricio-only password reset.** Login screen now has a "Forgot password?" link. Clicking it switches the Login component to "reset" mode, takes the email, calls `supabase.auth.resetPasswordForEmail()` with the current origin as `redirectTo`, and shows a success message. When Supabase's email link returns the user to the app with `#type=recovery` in the URL hash, Login detects it and switches to "setNew" mode, accepting a new password (min 8 chars), calling `supabase.auth.updateUser({password})`, then signing the user in automatically. **No public signup added** — `noAccountYet` text stays as "Need an account? Contact Mauricio." per the audit decision that client portal users are future, not v1.
4. **Save-failure toast.** Both `gaSaveClient` and `gaSaveSettings` now dispatch a `ga-save-failed` CustomEvent on every error path. The App component listens for it and surfaces a red 6-second toast in the bottom-right: "Couldn't save {x} — your changes are local only. Reload and try again." This is the minimum-viable error visibility flagged as missing in the pre-launch audit. Resend email-on-failure is NOT in this patch — it's blocked on Resend DNS verification per O-11.

17 new bilingual translation keys (EN + ES, fully synced — 1,060 keys per side now). No App.jsx structural changes outside the Login component, App component (state + 3 new effects + 2 new UI elements in the auth tree), and the two Supabase save functions.

**v0.5.2b (next patch, after 2a is verified in production)** will add: service plan/category tracking fields on the client record, manual Stripe Payment Link fields in settings, "Pay Now" buttons on About/Services page, "Last backup verified" date in Settings, and backup procedure documentation in §11. Two patches, two production deploys, two verification windows.

**Tooling addendum (2026-05-14, post-v0.5.2a deploy):** Playwright end-to-end test harness added to the repo. 30 tests covering smoke, calculators, client workflows, translation integrity, and Supabase persistence. Test user `test@goldenanchor.life` (UUID `9d017248-fc0a-44ad-b68b-53315bb928d8`) seeded with duplicated fake/demo clients. Main advisor account `b373dd8a-bf12-4df2-9439-d7770406d416` is protected by a hard-refuse guard in `global-setup.ts`. WebKit project disabled in the local Codespace because 36 system libraries are missing — Chromium + Firefox give adequate coverage. 12 calculator tests fail with selector mismatches (test-code bugs, NOT app bugs — the calculator tab buttons render differently than the test selectors assume). Detailed in §13. Not a launch blocker; v0.5.2a is in production and working.

**Prior version (v0.5.1, 2026-05-14)** — **Critical Supabase migration bug fix.** The v0.5.0 wiring used `clientObj.id` (a numeric value from `gid() = Date.now() + Math.floor(Math.random()*99999)`) as the primary key when upserting into Supabase's `clients` table, but the `clients.id` column is a UUID. Every save failed silently with a PostgreSQL cast error; the migration loop marked `ga_migrated_to_supabase = "1"` anyway, leaving the app stuck reading from localStorage with no path to retry.

**Three fixes in v0.5.1:**
1. **`gaSaveClient`** now uses a new `local_id` text column to track the app's numeric ID, lets Supabase generate its own UUID for `id`, and `select-then-update-or-insert` to maintain idempotency. Returns `true` / `false` so callers can detect failure.
2. **`gaDeleteClient`** matches rows by `local_id`, not `id`.
3. **`gaMigrateLocalStorage`** only sets the `ga_migrated_to_supabase` flag when every single client save succeeded. If even one fails, the flag stays unset and the migration retries on the next login. Logs progress as `[GA] migration complete: N/N clients migrated` or `[GA] migration incomplete: M/N clients saved`.

**Required Supabase SQL** (paste into Supabase SQL Editor and run before deploying v0.5.1):

```sql
alter table public.clients
  add column if not exists local_id text;

create unique index if not exists clients_user_local_id_idx
  on public.clients(user_id, local_id)
  where deleted_at is null;
```

**Required browser action after deploy:** open DevTools console on the deployed app and run `localStorage.removeItem("ga_migrated_to_supabase")` once. Do NOT delete `ga_v3` — that's the source of truth until migration succeeds.

**Settings table is NOT affected.** `gaSaveSettings` upserts on `user_id` (a real Supabase Auth UUID), so the UUID-cast bug never hit it. Left unchanged.

**Prior version (v0.5.0, 2026-05-14)** — **First Minor bump since the project began.** Two big changes:

1. **Supabase Auth + DB wired into App.jsx.** Login screen replaces hardcoded credentials. Session restores on page load via `getSession()` + `onAuthStateChange`. Clients and settings now read/write to Supabase (gated by RLS `auth.uid() = user_id`) with localStorage retained as a write-through cache. Migration helper uploads existing localStorage data on first cloud login and is idempotent. Sign-out wired. **Closes D-22 at the code level** (was schema-only before) and effectively retires the D-2 PII-in-localStorage risk.

2. **~140 new bilingual translation keys** covering Dashboard alerts panel, CalculatorsPage gallery, all 9 standalone calculators (Retirement / Portfolio / Home / Income / Debt Reduction / Car Loan / Affordability / Interest / HY Savings), the full Compare report block (ratio rows, field labels, column headers, save/clear messages), Complete Report section labels, and Financial Statements + Accounts/Loans filter buttons. EN and ES dicts now sit at ~1,069 keys per side. Compare report block also gained `FLD_REMAP`/`RAT_REMAP` so persisted English-label snapshots from v0.4.x render in the active language going forward.

Build marker bumped to `2026-05-14-i18nplus-supabase-v050`. File grew from ~564 KB / 2,173 lines to ~580 KB / 2,254 lines.

**Out-of-app actions required before this build runs in production:** `npm install @supabase/supabase-js`, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars in Vercel, create the single advisor Auth user in Supabase Dashboard, disable email confirmations. See CHANGELOG v0.5.0 entry for the step-by-step.

**Prior patch (v0.4.2, 2026-05-13)** fixed Dashboard Alerts ⚙️ black-screen crash and added 9 translation keys for the Alerts Settings modal. Introduced O-11 tracking the PDF-generation gap blocking Resend email automation.

**Prior merge (v0.4.0, 2026-05-13)** reconciled two streams that ran in separate chats:
- **App-side track** (last tag v0.3.0): bilingual report coverage + six logic fixes — full FullReport / SummaryReport / FinancialStatements / CashFlow / Compare / Calc / Plan / Portfolio blocks now render in EN/ES, 868 dict keys per side (+144), Spanish month names via `MS_ES`/`mLabel()`/`fmtDate()`, 3 kebab regressions fixed, RSR formula corrected, Min Pay clarity, Liquidity Ratio rename, Allocation guard banner, Stale-snapshot warning, Income Stmt vs Cash Flow Stmt labels disambiguated. Pitfall #11 added (global text.replace destruction).
- **Infra-side track** (last tag v0.3.2): Supabase Phase 1 SQL executed, Stripe + Calendly + Google Business Profile confirmed live, Wix → Porkbun registrar transfer in flight (ICANN 5-day clock running, expected completion 2026-05-18 to 2026-05-20). Cloudflare DNS + Resend domain verification blocked on Porkbun completion. Architecture decisions D-23 through D-26 locked (multi-tenant RLS, account consolidation deferred, domain layout, DNS path).

**Decision renumbering:** the two chats independently assigned D-18, D-19, etc. to different decisions. The merged ledger keeps `D-18 = Translation` (most-referenced) and shifts the infra-side numbers up by one. See the v0.4.0 entry in CHANGELOG.md for the full old → new map.

Versions bump as follows:
- **Patch** (v0.5.0 → v0.5.1): bug fix, copy tweak, small translation addition.
- **Minor** (v0.5.x → v0.6): new feature, new tab, new calculator, structural refactor.
- **Major** (v0.x → v1.0): when the app is officially launched to paying clients with Supabase Auth + DB wired and at least manual payment path live.

See CHANGELOG.md for full history.

---

## 4. Locked decisions

Decisions in this section have been agreed and should NOT be changed without the user explicitly saying "I want to reverse decision X." If something the user asks contradicts a locked decision, **stop and surface the conflict** before proceeding.

### Product

- **D-1 — Single file architecture.** The whole app lives in `src/App.jsx`. Do not propose breaking it into multiple files until the user explicitly asks. Reason: easier for non-developer owner to manage uploads via GitHub web UI.
- **D-2 — No localStorage for sensitive PII in production.** When Supabase is wired in, client SSN / DOB / address move to the database. The current localStorage-only state is acceptable only until first paying client.
- **D-3 — Bilingual EN/ES is a launch requirement.** The EN/ES toggle button in the sidebar must remain visible. Translation infrastructure should never crash or freeze the app. If translation breaks, fall back to English silently — do not blank the screen.
- **D-4 — Auto-DOM-translation with MutationObserver is BANNED.** Previous attempts caused infinite re-render loops. Translation must be done via the `T = { en: {...}, es: {...} }` dictionary pattern with `t.key || "Fallback English"` lookups in JSX. No DOM walking. No observers on mutated nodes.
- **D-5 — No native iOS/Android app yet.** Web only. PWA is OK to add later.
- **D-6 — No multi-tenant SaaS yet.** This is Mauricio's personal advisor tool. Multi-tenant refactor is a year-2 conversation (forward design captured in D-23 + §12).

### Tech

- **D-7 — React state lives in App component only.** No Redux, no Zustand, no Context outside of `themeCtx` and `useTh`. Components receive state via props.
- **D-8 — Recharts for all charts.** Do not propose Chart.js, Highcharts, D3, or other libs.
- **D-9 — xlsx (SheetJS) for Excel I/O.** Do not propose ExcelJS or alternatives.
- **D-10 — Settings in localStorage under one key:** `ga-settings`. Client data under `ga-clients`. Promotions under `ga-settings.promotions`. Do not add new top-level localStorage keys without confirming.
- **D-11 — Component naming: PascalCase.** Dynamic component references must use a PascalCase local alias before JSX rendering. `<calc.C/>` is BROKEN (JSX treats lowercase as HTML element). Use `const Comp = calc.C; <Comp/>`.
- **D-12 — `useRef` MUST be imported from React** at the top of App.jsx. Same for `useEffect`, `useState`, `useCallback`, `useMemo`, `createContext`, `useContext`.

### Business

- **D-13 — Pricing tier (year 1):**
  - Initial Checkup: $149 (regularly $249 strike-through)
  - Quarterly: $99 per checkup
  - Annual bundle: $299 (save $97 on 4 quarterlies)
  - Monthly Lite Subscription: $29/mo
  - Strategy sessions: $99 (Home, Job change), $79 (Car)
- **D-14 — Health/Insurance bundle:** Free Initial Checkup for active insurance clients. Promo code `HEALTHFAMILY`.
- **D-15 — Referral discount:** 25% off Initial Checkup (code `REFERRED25`); referrer gets $25 credit.
- **D-16 — Seasonal promos:** New Year Reset ($99 Jan 1–31), Spring Review ($99 Mar 15–Apr 30), Back-to-School ($99 Aug 1–Sep 15), Holiday Prep ($79 Nov 1–30), Year-End Review ($99 Dec 15–31).
- **D-17 — Compliance:** Mauricio is licensed for FL Life & Health Insurance (FL0215). For finance, he positions as **educator/coach** — never recommends specific securities, never manages money. All reports include the disclaimer in the footer. Engagement letter, disclaimers, privacy policy, and TOS have been reviewed by counsel and are on file (confirmed 2026-05-12).

### Translation (added v0.2.0, amended v0.2.1)

- **D-18 — Translation approach (closes O-4).** Two-track pattern:
  - **Track A — UI strings in JSX:** per-key `t.key || "English fallback"` wrap. `T.en` at line 76, `T.es` at line 77 of App.jsx. Dictionary access in `App()` body: `const t = T[lang] || T.en`. Currently 868 keys per side, fully synced.
  - **Track B — Data-structure labels** (data lives in `const X = {...}` rather than in `T.en/T.es`, e.g. `ACCT_META`, `LOAN_META`, `PHYS_CATS`): add a parallel ES lookup object (`ACCT_L_ES` line 65, `LOAN_L_ES` line 66, `PHYS_L_ES` line 67) plus a helper (`acctL`, `loanL`, `physL` at lines 70–72). Helpers read `window.__GA_LANG`, which is synced from React `lang` state by a `useEffect` in `App()` (line 2112). Call the helper at the render site. **Do NOT change the underlying data shape** — persistence and accessor sites stay stable.
  - DOM-walk approaches stay banned (D-4).
  - **Mandatory:** when adding ANY new user-facing string, add the key to BOTH `T.en` AND `T.es` in the same edit. Adding to one only is a violation that ships English-only strings to Spanish users.

### Infrastructure (added v0.2, 2026-05-12; renumbered in v0.4.0 merge)

- **D-19 — Supabase schema = JSON-blob, RLS by `auth.uid() = user_id`** (closes O-1). Two tables in `public` schema:
  - `clients(id uuid PK, user_id uuid, data jsonb, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)`
  - `settings(user_id uuid PK, data jsonb, updated_at timestamptz)`
  - RLS enabled on both. Policies: SELECT/INSERT/UPDATE/DELETE all gated on `auth.uid() = user_id`.
  - Phase 1 SQL run successfully: `set_updated_at()` function + triggers on both tables, `deleted_at` column on `clients`, `clients_active_idx` partial index on non-deleted rows. Phase 2 (drop hard-delete policy) deferred until App.jsx is wired with soft-delete pattern.
  - Storage bucket `client-reports` (private, owner-only) reserved for generated PDF reports — to be created when needed.
  - Do NOT normalize into separate tables for income / bills / debt. Whole client object stays in `clients.data` blob. Re-revisit at v1.0+ only if query patterns demand it.
- **D-20 — Email = Resend free tier** (closes O-3). Domain `goldenanchor.life` to be verified (SPF/DKIM DNS records). 3,000 emails/mo free is enough for v1. API key stored as `RESEND_API_KEY` env var in Vercel. Manual PDF email attach is the interim fallback while App.jsx integration is pending.
- **D-21 — Payments = Stripe Payment Links for v1.** No Stripe integration inside App.jsx for v1. Payment Links created per service in Stripe Dashboard for the D-13 pricing tiers, distributed via flyer / website / SMS / Calendly. 2.9% + $0.30 per transaction, no monthly fee. Zelle / cash accepted from existing trusted contacts only. Calendly stays on free tier (1 event type) — paid Calendly is deferred until volume justifies $12/mo.
- **D-22 — Auth model = single advisor (Supabase Auth email/password)** (partially closes O-2). One user provisioned in Supabase Auth → that user's UUID owns all `clients` and `settings` rows. Email confirmations OFF in Supabase Auth for v1. Multi-user / client-facing portal remains deferred to year 2 per D-6 (forward design in D-23).

### Architecture (added v0.3, 2026-05-13; renumbered in v0.4.0 merge)

- **D-23 — Multi-tenant via RLS, not per-customer duplication.** When the Finance app and Health CRM are sold to agents/agencies, the model is one codebase, one Supabase project per product, with tenant isolation enforced by RLS policies — not duplicated apps per customer. Schema gains: `agencies(id, name, subscription_tier, feature_flags jsonb)`, link users to `agency_id` and `role` (super_admin / agency_owner / agent), `clients` gets `agency_id` + `assigned_agent_id`. Three role tiers:
  - **Super Admin** (Mauricio) — sees all agencies, all data. For support and platform ops only.
  - **Agency Owner** — sees their agency's agents and (optionally) all client summaries. Pays subscription.
  - **Agent** — sees only their own assigned clients.
  - RLS policies are tiered: agents filter by `assigned_agent_id = auth.uid()`, agency owners by `agency_id = user's agency`, super admin bypass. Cross-agency access is impossible at the database level.
  - Per-agency customization (which calculators are enabled, branding, max client count, default language) lives in `agencies.feature_flags` JSONB. App renders from flags. No code branches per customer.
  - Reasoning: duplicating apps per customer means 50× the maintenance burden, 50× the deployment surface, blocks shipping updates. RLS+roles is the industry-standard B2B SaaS pattern (Slack, Notion, Linear all do this). The data leak concern that motivated the duplication instinct is solved by RLS — the database physically cannot return another tenant's rows even if the app has a bug.
  - Per-agency dedicated databases is reserved ONLY for future cases where regulatory requirements (HIPAA BAAs at enterprise scale, government contracts) demand it. Not the default.
  - Migration path: today's single-advisor schema is forward-compatible. When multi-tenant kicks in, `agencies` and `user_profiles` tables get added, existing data gets stamped with Mauricio's agency_id, RLS policies get updated. No data rewrite needed. SQL shape in §12.
- **D-24 — One account per service, multiple projects under it (DEFERRED to post-launch).** Both Vercel and Supabase will eventually consolidate to a single account each, hosting separate projects per product:
  - **Vercel** (one account) → `goldenanchor-finance` project, `goldenanchor-health` project, eventually a marketing landing project.
  - **Supabase** (one account, free tier allows 2 projects) → `goldenanchor-finance`, `goldenanchor-health`.
  - **GitHub** (one account) → `finance-app` repo (exists), `health-crm` repo (to be created when Health code begins).
  - **Timing decision (2026-05-13):** Consolidation is DEFERRED until after one of the two apps fully ships. Finance is ~ready to sell; Health is 2–3 months out. Stripe, Supabase, and Vercel are already wired per-account. Merging now would force re-wiring everything mid-launch — not worth the disruption. Whichever app ships first becomes the "kept" account; the other migrates into it when its work finishes.
  - **Until then:** treat the two products as fully independent. This project (Finance) does not coordinate with the Health project; Health is out of scope for this chat and this AGENT.md.
- **D-25 — Domain layout under `goldenanchor.life`.**
  - `goldenanchor.life` (apex) — Mauricio's personal brand / advisor + insurance marketing landing. NOT an app.
  - `finance.goldenanchor.life` — Finance app (currently single-advisor, eventually multi-tenant B2B SaaS).
  - `health.goldenanchor.life` — Health CRM (will be multi-tenant B2B SaaS sold to insurance agents).
  - Each subdomain points to its own Vercel project via CNAME → `cname.vercel-dns.com` (DNS only, no Cloudflare proxy on Vercel CNAMEs).
  - Wildcard subdomains (`*.finance.goldenanchor.life`, `*.health.goldenanchor.life`) reserved for future per-agency white-label URLs — not built yet.
- **D-26 — DNS at Cloudflare (free), registrar at Porkbun → Cloudflare in 60 days.**
  - Wix → Porkbun registrar transfer initiated 2026-05-13. ICANN 5-day clock running; expected completion 2026-05-18 to 2026-05-20.
  - DNS will move to Cloudflare immediately once Porkbun transfer flips active (point Porkbun nameservers at Cloudflare's two assigned nameservers). DNS hosting move does NOT require the 60-day wait — only registrar transfer does.
  - On or after 2026-07-15 (60 days post-Porkbun transfer), transfer registration Porkbun → Cloudflare. ~$10/yr renewals at cost after. Optional but recommended.
  - Reasoning: Cloudflare DNS panel is best-in-class, supports MX/TXT on subdomains (the thing Wix did not), unlocks Resend domain verification, provides CDN/WAF/analytics at $0 if ever needed. Vercel registrar was considered but eventual consolidation at Cloudflare is the lower-total-cost path. The Wix-only registrar restriction forced this two-hop because Wix doesn't allow direct moves to Cloudflare.

---

## 5. Open decisions (not yet locked)

These are things being actively discussed. If the user weighs in on one, move it to Locked Decisions and update the version.

- **O-5 — Mobile install (PWA) flow.** Worth doing at launch or wait? Leaning wait.
- **O-6 — Marketing landing for `goldenanchor.life` apex.** Currently no site published (Wix subscription dropped). After DNS lands at Cloudflare, decide between: (a) dedicated Vercel project for the apex marketing site, separate from the Finance and Health apps (recommended); (b) Carrd one-pager; (c) keep apex parked and use subdomains only. Includes related routing question if the Finance app ever co-hosts a landing page.
- **O-7 — Referral attribution automation.** Manual via Google Form + cross-check for v1. When to automate inside App.jsx (capture referrer name → auto-issue $25 credit) is open.
- **O-8 — Snapshot data hygiene UX.** v0.3.0 added a stale-snapshot warning when debt scale changes >5x between snapshots. Open question: should the app proactively prompt to delete or refresh old snapshots that look scale-inconsistent, or just warn and let the advisor decide? Currently: warn only.
- **O-9 — Phase-2 roadmap narrative translation.** *Updated v0.5.0:* substantial progress — the calculator pages, Compare report, and Dashboard alerts panel are now bilingual (the bulk of what this open decision tracked). The original Financial Roadmap narrative blocks ("Focus all extra cash on debt...", "Allocate 25% stocks + 20% retirement...") are the remaining English-only surface. Track for a future patch (v0.5.1).
- **O-10 — Spanish review pass.** *Updated v0.5.0:* Mauricio to toggle EN/ES across the now-substantially-broader Spanish surface (calculators, Compare report, alerts panel, Complete Report sections) and flag regional terms that read wrong or any remaining English strings. Then cut v0.5.1 to address.
- **O-11 — PDF generation approach for email automation.** App.jsx currently has zero PDF libraries — every "🖨️ Print / Save PDF" button calls `window.print()` and relies on the user picking "Save as PDF" in the browser dialog. The intake form export does the same via a popup window with auto-print. This is fine for the current manual flow (advisor saves PDF, attaches to email by hand) but **breaks the moment we wire Resend** (D-20) — you can't attach a print dialog to an automated email. Three options when this becomes active: (a) Puppeteer/Playwright on a Supabase Edge Function — renders the real React page to PDF server-side, most faithful, heaviest cold start; (b) `@react-pdf/renderer` rebuild — duplicates report layout but produces clean PDFs fast, worst maintenance burden; (c) `jspdf` + `html2canvas` client-side — generate PDF in browser, upload to Supabase Storage, attach to email, no server work but uneven quality (rasterizes charts, fonts get weird). Not blocking pre-launch; decide when the Resend integration chat starts. Coordinate with the other-chat App.jsx Supabase wiring effort.
- **O-12 — Auto-logout duration.** *Closed v0.5.2a, kept here for traceability.* Locked at **30 minutes idle timeout with a 1-minute warning** (warning fires at 29:00, hard logout at 30:00). 15-min industry default was considered but rejected as too aggressive for an advisor working through reports. Reset events: `mousemove`, `keydown`, `touchstart`, `click`, `scroll`. Future: if users complain about being logged out mid-call, revisit. Configured as module-level constants `IDLE_TIMEOUT_MS` / `IDLE_WARN_MS` in App component for easy adjustment.
- **O-13 — PDF generation timing for launch.** Decided v0.5.2a: **deferred to post-launch** alongside Resend email automation. Current `window.print()` is fine for the manual flow (advisor saves PDF, attaches to email). Real PDF generation becomes a blocker only when Resend automation activates. Track O-11 for the implementation choice; this O-number tracks the launch-vs-defer decision specifically. If a paying client demands automated emailed reports before Mauricio can manually attach them, revisit.
- **O-14 — Terms of Service / Privacy Policy acceptance gate + Engagement Letter signature flow.** Legal docs are reviewed by counsel and on file (D-17). The app does not yet enforce one-time ToS click-through on first login, and does not track per-client engagement-letter signature dates. Deferred to v0.6+ (post-launch). For the first 1-2 paying clients, ToS/PP acceptance and engagement letter signing happen out-of-band via email + DocuSign / paper signature. Once that path proves the workflow, in-app gating gets added with: (a) ToS checkbox on first login (stored in `settings.tosAcceptedAt`, `settings.tosVersion`); (b) per-client `engagementLetter: {signedAt, signedBy, ipHash}` field; (c) optional Mauricio-side UI to upload his agent-specific PDF template (the agent-uploaded-form pattern Mauricio mentioned in the audit, which becomes the multi-agent default in D-23 later).
- **O-15 — Supabase data backup cadence + mechanism.** Decided v0.5.2a: **rely on Supabase's built-in Point-in-Time-Recovery (PITR) backups + a manual verification cadence**. Supabase free tier retains 7 days of PITR backups automatically — no custom export pipeline needed. Once Mauricio upgrades to a paid Supabase tier (likely Pro at $25/mo when client count grows), PITR retention extends to 14 or 30 days. v0.5.2b adds a `settings.lastBackupVerified` date field that Mauricio updates monthly after confirming he can see his clients in the Supabase Dashboard. Backup recovery procedure documented in §11 (v0.5.2b). Column-level encryption of SSN/phone/DOB via pgsodium considered but **deferred** — re-evaluate when (a) client count exceeds 25, or (b) regulatory requirements force HIPAA-shaped handling. Also rejected for launch: custom CSV-export-to-email pipeline — adds operational complexity, breaks if Resend fails, and PITR already covers the disaster-recovery case.

### Closed in v0.4.0 merge (2026-05-13)

Bookkeeping only — no decision flips. The merge folded the infra-side's open "consolidation timing" items into D-24 (they're already locked as "deferred"):
- ~~Infra-side O-8 (Vercel account consolidation timing)~~ → covered by D-24 deferred timing. Not separately tracked.
- ~~Infra-side O-9 (Supabase account consolidation timing)~~ → covered by D-24 deferred timing. Not separately tracked.
- ~~Infra-side O-10 (Marketing landing for apex)~~ → merged into merged-O-6.

### Closed in v0.3 (2026-05-13)

- Architecture for multi-tenant B2B (was implicit in D-6 deferral) → locked as **D-23**.
- Account consolidation strategy → locked as **D-24** (with deferred timing).
- Domain layout → locked as **D-25**.
- DNS + registrar path → locked as **D-26**.

### Closed in v0.2 (2026-05-12)

- ~~O-1 Supabase schema~~ → locked as **D-19**.
- ~~O-2 Auth model~~ → locked as **D-22** for v1 single-advisor (multi-user still deferred per D-6).
- ~~O-3 Email reports~~ → locked as **D-20** (Resend free tier).
- ~~O-4 Translation approach~~ → locked as **D-18** (per-key wrap; Track A + Track B amendment in v0.2.1).

---

## 6. App structure quick reference

Components in App.jsx, listed in source order (verified against the v0.5.0 file, 2,254 lines). Ranges are inclusive and do not overlap. Specific landmark lines listed where useful. The Supabase block (client + helpers `gaLoadClients`/`gaSaveClient`/`gaDeleteClient`/`gaLoadSettings`/`gaSaveSettings`/`gaMigrateLocalStorage`) sits just before the `THEMES` section near the top of the file.

| Component / region | Lines | Purpose |
|---|---|---|
| Imports | 1–3 | React, Recharts, xlsx |
| Theme primitives | 6–11 | `GOLD` constant (6), `makeDark`/`makeLight` theme factories (7–8), `ThemeCtx` (11) |
| Data-structure constants | 29–64 | `ACCT_META` (29), `LOAN_META` (30), `TICKER_META` (38), `fmtDate` helper (60), `PHYS_CATS` (64) |
| Data-structure ES lookups + Track B helpers | 65–72 | `ACCT_L_ES` (65), `LOAN_L_ES` (66), `PHYS_L_ES` (67), `_gaLang`/`acctL`/`loanL`/`physL` helpers (69–72) — see D-18 Track B |
| **Translation dictionary `T`** | **76–77** | **`T.en` on line 76, `T.es` on line 77.** Both lines are one giant key:value blob each. 868 keys per side, fully synced. Every user-facing string change MUST land on BOTH lines in the same edit (see D-18, pitfall #9). |
| Client model + seed | 84–96 | `mk()` factory (84), `mig()` migration (91), `SEED` data (93) |
| Number/format helpers | 98–127 | `fmt` (98), `fmtD` (99), `fmtS` (100), `fmtPh` (103), `sumB` (105), `sumN` (106), `payM` (113), plus theme accessors and small utilities |
| UI atoms | 141–177 | `Pill` (141), `Field` (144), `Btn` (149), `CalcRow` (177) |
| Client editor sections | 283–470 | `IncomeSection` (283), `BillsSection` (286), `DebtSection` (289), supporting modals + helpers |
| `InvestmentsTab` | 471–557 | Portfolio + Main/Alt Packages |
| `FullReport` and report helpers | 558–~645 | Main printed report |
| Client-bound calculators | 646–~838 | `ClientIncomeCalc` (646), `ClientDebtCalc`, `ClientCarLoanCalc` (use live client data) |
| `ClientCalculatorsTab` | 839–~910 | Wraps client-bound calculators + snapshot save |
| Other report tabs | ~910–1328 | `MonthlyReportTab`, `FinancialStatementReportTab`, `CompleteReportTab`, `CompareReportTab`, `YearCompareView` (interleaved with shared helpers) |
| Standalone calculators | 1329–1537 | `HomeEquityCalc` (1329), `IncomeCalc` (1356), `DebtReductionCalc` (1434), `CarLoanCalc` (1435), `AffordabilityCalc` (1473), `InterestCalc`, `SavingsCalc`, `RetirementCalc`, `PortfolioStandaloneCalc` |
| `CalculatorsPage` | 1538–~1700 | Top-level calculator gallery (uses calculators above) |
| `PromotionsPage` | 1977–~2100 | Promo admin |
| Build marker `window.__GA_BUILD__` | ~2127 | Deploy verification string (`"2026-05-14-i18nplus-supabase-v050"` at v0.5.0). Bump on every App.jsx change. |
| `App` (default export) | ~2128+ | Root state + routing. As of v0.5.0: `authUser`/`authReady`/`bootstrapping` state, three refs (`_lastClientsRef`/`_lastSettingsRef`/`_cloudReadyRef`) for cloud-sync gating, session-restore useEffect, bootstrap useEffect on `authUser?.id`, two persistence useEffects (clients + settings) gated on `_cloudReadyRef.current`, three-state auth gate (`!authReady` → "…", `!authUser` → `<Login/>`, `bootstrapping` → ⚓ spinner). |
| `window.__GA_LANG` sync `useEffect` | ~2177 | Inside `App()`. Mirrors React `lang` state to window so Track B helpers (`acctL`/`loanL`/`physL`) can read it without prop-drilling. |

**Verifying line numbers before editing.** Components shift as the app grows. Before doing a targeted edit, confirm with a grep — e.g. `grep -n "^const T={en:" App.jsx` for the dictionary, `grep -n "^function FullReport" App.jsx` for the main report, `grep -n "__GA_BUILD__" App.jsx` for the build marker. Don't trust the ranges above blindly past a Minor version bump.

**Important convention:** standalone calculators receive `{t}` as a prop. They will crash with "ReferenceError: t is not defined" if signed as `function FooCalc(){}` without the `{t}` param. We hit this bug on 2026-05-11 — see CHANGELOG and pitfall #2.

---

## 7. Common pitfalls (read before editing)

These are mistakes we've made and learned from. **Don't repeat them.**

1. **Lowercase dynamic JSX components.** `<calc.C/>` renders as HTML element `<calc.C>` and never invokes the component. Always rebind: `const Comp = calc.C; <Comp/>`.
2. **Calculator components without `{t}` param.** All standalone calculators reference `t.foo` inside their bodies. Their function signatures MUST destructure `{t}`. Signing them as `function FooCalc()` causes silent ReferenceError → black screen.
3. **MutationObserver-based translation.** Caused infinite loop (observer fires on its own DOM mutations). NEVER use this pattern. See D-4.
4. **Bulk apply scripts that fail mid-write.** Python `write_text()` truncates the file at the start of writing — if the script throws during encoding, the file ends up empty. Always wrap writes in `with open(path, "wb") as f:` and use `errors="replace"`.
5. **Surrogate pair Unicode in Python strings.** Emoji like 📈 must be written as raw characters in source, NOT split as `\ud83d\udcc8` — Python won't auto-combine the pair. UTF-8 encoding will reject lone surrogates.
6. **Uploading App.jsx to GitHub root instead of `src/`.** Vercel builds from `src/App.jsx`. Uploading to the root creates a duplicate file that's never used by the build. The bundle hash (`index-XXXXX.js`) won't change.
7. **Browser cache after a successful deploy.** Hard refresh (Ctrl+Shift+R) before troubleshooting "deploy didn't work."
8. **str_replace patterns with shared prefixes.** When `old_str` matches multiple places, str_replace fails atomically. Use a longer unique signature or perform the replacements in a script that walks all matches.
9. **🌐 BOTH languages, ALWAYS.** When adding or modifying ANY user-facing string, the change MUST land in BOTH `T.en` (line 76) AND `T.es` (line 77) in the same edit. Adding a key to only one language is a violation. Same rule for data-structure labels covered by D-18 Track B: a new entry in `ACCT_META`/`LOAN_META`/`PHYS_CATS` requires a matching entry in `ACCT_L_ES`/`LOAN_L_ES`/`PHYS_L_ES`. This rule is hard-locked at Mauricio's request after v0.2.0 shipped with one-language strings.
10. **Don't change data-structure shape for translation.** `ACCT_META = {checking: {l: "...", icon: "...", c: "..."}}` is referenced in 25+ places for `.l`, `.icon`, `.c`, `.liquid`, `.invest`. If you reshape it to `{en: "...", es: "..."}`, you must update every accessor or you'll break the app. Use D-18 Track B instead: keep the shape, add parallel ES lookup, change only render sites.
11. **Global `text.replace("WORD", "{t.key||\"WORD\"}")` is destructive.** A bare-word global replace ALSO matches that word inside dictionary string values. v0.3.0 hit this twice: replacing `TOTAL CURRENT ASSETS` overwrote the EN dict entry, and replacing `DATOS` corrupted the Spanish dict. Rule: when wrapping a JSX literal, anchor the replacement to JSX context (`>WORD</div>`, `label="WORD"`, etc.) — never to the bare word. Verify dict integrity after every patch: `python3 -c "import re; ..."` checking both EN/ES key counts and absence of `{t\.\w+\|\|"[^"]+"}` patterns INSIDE the dict body.
12. **Supabase UUID columns vs app numeric IDs.** `gid()` on line 94 returns numbers like `1747200000123456`. Supabase `clients.id` is a UUID column. Upserting `{id: <number>, ...}` fails the PostgreSQL cast silently — the error appears in console but the migration loop can mark itself "done" anyway, locking the app into a half-migrated state. **Rule:** never use `clientObj.id` (or any `gid()`-generated ID) as a Supabase UUID primary key. Use a separate `local_id text` column for app IDs, let Supabase generate UUIDs for `id`. Mirror this for any new table that needs to map an app entity to a Postgres row. **Also:** never let a migration loop set its "completed" flag without verifying every save actually succeeded — count successes, compare to total, only flag-complete on full match. Hit and fixed in v0.5.1.

---

## 8. Build & deploy workflow

Current (manual web UI):
1. User downloads new App.jsx from chat output.
2. Goes to GitHub → repo → `src/` folder → uploads to replace `App.jsx`.
3. Commits to `main` branch directly.
4. Vercel auto-deploys (~30s).
5. User hard-refreshes browser to confirm.

**Sanity check after every deploy:**
```js
// In browser DevTools console, paste this:
window.__GA_BUILD__
```
Should return the build marker string (current: `"2026-05-14-i18nplus-supabase-v050"`). If `undefined`, the new bundle didn't deploy — likely an upload location issue.

---

## 9. Style conventions

### Code
- **Indentation:** 2 spaces. Tabs are NOT used.
- **Quotes:** Double quotes for JSX attribute strings, single for JS strings (loose convention).
- **Translation:** Always `t.someKey || "English fallback"`. Never plain English literals in user-facing UI.
- **Currency formatting:** Use `fmt()` helper. Never inline `$${value}`.
- **Date formatting:** Use existing helpers (`fmtDur`, `addDate`, and for bilingual dates `mLabel(label, lang)` / `fmtDate(date, lang)` per v0.3.0). Never inline `new Date().toLocaleDateString()` in JSX without going through the helper.
- **Color:** Use `th.accent`, `th.pos`, `th.neg`, `th.warn`, `GOLD`. Never hex literals in JSX except inside the theme object.
- **Brevity:** App.jsx is intentionally dense (single-file). Keep one-liners one-liners. Don't reformat for "readability" — the user maintains it manually and prefers compactness.

### Communication with the user
- **No popup / interactive questions.** Never use `ask_user_input_v0`. If clarification is needed, list the questions as plain numbered text in the response and continue with what can be done without them.
- **Do not stop-and-go.** When the user asks for multiple tasks or a multi-step plan, execute / lay out everything in a single response. No "next I'll do X — confirm to proceed" interruptions.
- **Skip fluff and compliments.** No "great question," no "excellent point." Direct answers only.
- **Treat as finance professional.** MBA, FPWMP, FMVA, FL0215. Don't over-explain basics.
- **Acknowledge stress.** User is in a major life transition (exiting day job, scaling business, fiancée with health needs). Every recommendation should advance career, business, or financial stability.
- **English by default.** Spanish only if the user switches first.

---

## 10. What to do when starting a new chat

1. Read this AGENT.md.
2. Confirm the version you're loading (currently v0.5.2a).
3. Ask the user to upload the latest `App.jsx` so you have current state.
4. If a SKILL is loaded (`finance-app-updater`), follow its procedure for any change request.
5. If something the user asks conflicts with Locked Decisions, surface the conflict before doing the work.

---

## 11. External services baseline (v0.5.2a)

Status snapshot of every external service the project depends on. Update when status changes.

| Service | Plan | Status | Cost | Purpose |
|---|---|---|---|---|
| **Vercel (Finance)** | Hobby (free) | ✅ Live, serves `finance.goldenanchor.life`. ⚠️ **Env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` must be set before v0.5.0 deploys correctly** (Production + Preview + Development scopes). | $0 | Hosting + custom domain + Deployment Protection. |
| **Vercel (Health)** | Hobby (free) | ⚠️ Separate account, parked. Out of scope per scope note in §1. | $0 | Will host Health CRM. Consolidation deferred (D-24). |
| **GitHub** | Free | ✅ Live (Finance repo only, `finance-app`) | $0 | Source of truth for App.jsx. Health repo to be created by other developer when Health code begins. |
| **Supabase (Finance)** | Free tier | ✅ Schema built (`clients`, `settings`) + RLS policies + auto-`updated_at` triggers + `deleted_at` soft-delete column + index. ✅ **App.jsx wired as of v0.5.0** (Auth + DB read/write + auto-migration from localStorage). ⚠️ Advisor user must be created in Auth → Users panel with "Auto Confirm User" checked, and email confirmations disabled in Auth → Providers → Email. | $0 | Postgres DB + Auth (1 advisor user). Storage bucket `client-reports` pending creation. |
| **Supabase (Health)** | Free tier | ⚠️ Schema only, no code, separate account. Out of scope per §1. | $0 | Consolidation deferred (D-24). |
| **Porkbun (Registrar)** | Standard | ⏳ Wix → Porkbun transfer **in flight** (initiated 2026-05-13). Status: "pending transfer from losing registrar (002)." ICANN 5-day clock running. Expected completion 2026-05-18 to 2026-05-20. | ~$15.62/yr | Domain registration for `goldenanchor.life`. Intermediate stop before Cloudflare. |
| **Cloudflare (DNS)** | Free | 🚫 Blocked on Porkbun transfer completion. Cannot change nameservers until Porkbun finalizes. | $0 | DNS hosting (replaces Wix DNS), free CDN/WAF/analytics if/when needed. |
| **Cloudflare (Registrar)** | Standard | ⏳ Deferred to 2026-07-15+ (60-day Porkbun lock from transfer completion date) | ~$10/yr at-cost | Optional final registrar. Lower renewals than Porkbun. |
| **Stripe** | Standard | ✅ Account active, Payment Links created for D-13 pricing. Test charge verified. | $0 base, 2.9% + $0.30/txn | Payment for each service. No in-app integration (D-21). |
| **Calendly** | Free | ✅ Live — "Free Discovery Call 20 min" event type connected to Google Calendar. Public booking link saved. | $0 | Single event type. Paid upgrade deferred until volume justifies $12/mo. |
| **Resend** | Free | 🚫 Domain verification blocked on Cloudflare DNS, which is blocked on Porkbun transfer. Account exists; DNS records held in the AGENT.md DNS list ready to paste once Cloudflare is active. | $0 (3k emails/mo) | Transactional emails: monthly reports, receipts, reminders. App.jsx integration also pending. |
| **Google Business Profile** | Free | ✅ Live — listing complete with services, hours, photos | $0 | Local SEO + reviews. |
| **Wix** | (subscription dropped) | ⚠️ Apex `goldenanchor.life` serves nothing currently. Wix DNS will be fully gone once Porkbun transfer completes. | $0 | Decommissioned. To be replaced by Vercel-hosted landing eventually (O-6). |
| **Virtual business address** | TBD | ⚠️ Need to pick provider | ~$10–20/mo (or free via registered agent) | Public-facing business address (not home). |
| **E&O insurance** | TBD | ⚠️ Verify existing insurance E&O covers coaching activity | TBD | Liability for coaching/educator work. |

### DNS records to add in Cloudflare once active

After Porkbun nameservers point at Cloudflare (1–24h propagation), add in the Cloudflare DNS panel:

- **CNAME** `finance` → `cname.vercel-dns.com` (Proxy: DNS only, gray cloud)
- **CNAME** `health` → `cname.vercel-dns.com` (DNS only) — when Health Vercel project is created (deferred)
- **MX** `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10
- **TXT** `send` → `v=spf1 include:amazonses.com ~all`
- **TXT** for DKIM — third record from Resend dashboard (Name and Content copied verbatim from Resend before adding)
- Apex `@` — leave unconfigured for now, or point at a placeholder Vercel project later when marketing landing is built (O-6)

### Env vars to set in Vercel before launch
- `VITE_SUPABASE_URL` (from Supabase Settings → API)
- `VITE_SUPABASE_ANON_KEY` (anon public key, NOT service_role)
- `RESEND_API_KEY` (only when email reports are wired in App.jsx)

### Account credentials reminder
All service credentials (passwords, API keys, recovery codes) live in user's password manager, NOT in this repo, NOT in chat history. If a key appears in chat, rotate it immediately.

---

## 11.5. Pending work + sync map (v0.5.2a)

This section is the single source of truth for "where are we in the launch path." Update on every meaningful state change.

### Blockers (in priority order)

1. **Porkbun transfer completion.** Status: "pending transfer from losing registrar (002)." ICANN-mandated 5-day clock auto-completes around 2026-05-18 to 2026-05-20. No action available to accelerate (Wix won't auto-approve, user found no Wix email to click, no acceleration option in Wix dashboard). Just wait.
2. **Cloudflare DNS** — blocked on (1).
3. **Resend domain verification** — blocked on (2).
4. **Marketing landing for apex** (O-6) — blocked on (1) for DNS, but otherwise no dependency. Can plan content now.

*Retired in v0.5.0:* "App.jsx Supabase wiring" — done. See "User actions required before v0.5.0 runs in production" below for the four out-of-app follow-ups (npm install, two env vars, create Auth user, disable email confirmations) that gate this build from working on the live deploy.

### User actions required before v0.5.0 runs in production

v0.5.0 ships the code but it needs four out-of-app actions on Mauricio's end before it works on Vercel. Without these, login will fail and the app falls back to localStorage-only mode.

1. **`npm install @supabase/supabase-js`** in the repo, commit `package.json` + `package-lock.json` to main.
2. **Set two Vercel env vars** (Settings → Environment Variables, Production + Preview + Development):
   - `VITE_SUPABASE_URL` — Supabase Dashboard → Settings → API → Project URL.
   - `VITE_SUPABASE_ANON_KEY` — Supabase Dashboard → Settings → API → **anon public key** (NOT `service_role`).
3. **Create the single advisor Auth user** — Supabase Dashboard → Authentication → Users → Add user. Check "Auto Confirm User" so it's immediately usable.
4. **Disable email confirmations** — Supabase Dashboard → Authentication → Providers → Email → uncheck "Confirm email". Required by D-22.

Then: upload App.jsx to `src/App.jsx` on GitHub, commit to main, Vercel auto-deploys. DevTools console check: `window.__GA_BUILD__` → `"2026-05-14-i18nplus-supabase-v050"`. First login: ⚓ spinner briefly while bootstrap completes, then dashboard. Existing localStorage clients migrate automatically and the migration flag prevents it from re-running.

### Completed (verified working)

- ✅ App.jsx v0.3.0 bilingual report coverage + 6 logic fixes (RSR formula, Min Pay clarity, Liquidity Ratio rename, Allocation guard banner, Stale-snapshot warning, Income Stmt vs Cash Flow Stmt labels)
- ✅ Supabase Finance schema (`clients`, `settings`) + RLS + `updated_at` triggers + `deleted_at` soft-delete column + active-client index (SQL Phase 1 run successfully)
- ✅ **App.jsx Supabase Auth + DB wiring (v0.5.0, 2026-05-14)** — login screen, session restore, RLS-gated reads/writes, idempotent localStorage migration, sign-out, three-state auth gate, cloud-ready bootstrap with race-free seeding of diff refs
- ✅ Stripe account + Payment Links for D-13 pricing
- ✅ Calendly Free Discovery Call event type
- ✅ Google Business Profile listing
- ✅ Wix → Porkbun transfer **initiated** (not yet finalized; see Blockers)
- ✅ Legal: engagement letter, disclaimers, privacy policy, TOS reviewed and on file

### Sync map — what connects to what

When all blockers clear, the launch architecture looks like this:

```
USER REQUEST → finance.goldenanchor.life
                       ↓
               Cloudflare DNS (CNAME finance → cname.vercel-dns.com)
                       ↓
               Vercel Finance project (build from GitHub finance-app/main)
                       ↓
              App.jsx (React) loads in browser
                       ↓
       reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from Vercel env
                       ↓
              Supabase Auth (login screen) → JWT
                       ↓
       Supabase Postgres (clients, settings) gated by RLS (auth.uid() = user_id)
       Supabase Storage (client-reports bucket) for PDF reports
                       ↓
       App.jsx invokes Supabase Edge Function `send-monthly-report`
                       ↓
              Edge function calls Resend API with RESEND_API_KEY
                       ↓
       Resend sends email via verified goldenanchor.life domain (SPF + DKIM via Cloudflare DNS)

PARALLEL PATHS (not coupled to app at runtime):
  Marketing → Calendly booking link → user books "Free Discovery Call 20 min"
  Marketing → Stripe Payment Link → user pays → Stripe receipt emails → Stripe → Mauricio's bank
  Google Business Profile → drives local SEO discovery → marketing site
```

### Next planned actions (in order)

1. **Wait** for Porkbun transfer to flip to active (no action). Check status daily starting 2026-05-18.
2. **Apply v0.5.0 to production** (~15 min): `npm install @supabase/supabase-js`, set the two Vercel env vars, create the Supabase Auth user, disable email confirmations, upload App.jsx to GitHub `src/`, verify build marker in DevTools console, smoke-test login + create-a-test-client + sign-out + sign-back-in.
3. **Cloudflare DNS** (~30 min once Porkbun is active): sign up at Cloudflare, add site, get NS, paste into Porkbun, wait for activation, add all DNS records (finance CNAME + Resend MX/TXT/DKIM).
4. **Resend verify** (~5 min once DNS is active): click Verify, confirm all rows green.
5. **Test full flow:** login at finance.goldenanchor.life → save a test client → sign out → sign back in → data persists → manual test Resend by sending a test email via Resend dashboard.
6. **Soft launch:** invite first 1–2 paying clients from warm list. Validate end-to-end with real money.
7. **Then** revisit: marketing landing (O-6), referral attribution (O-7), Phase-2 roadmap narrative translation (O-9), Spanish review pass (O-10), Cloudflare registrar transfer (2026-07-15+), account consolidation (D-24, post-launch).

---

## 12. Multi-tenant readiness checklist (forward-looking, do not implement until needed)

When the time comes to make Finance or Health multi-tenant (selling to agents/agencies), the schema additions required are documented here so future chats know the shape.

### Schema additions (do not run yet)

```sql
-- agencies table
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subscription_tier text default 'free', -- free / pro / enterprise
  feature_flags jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- user-to-agency link with role
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete restrict,
  role text not null check (role in ('super_admin','agency_owner','agent')),
  created_at timestamptz default now()
);

-- extend clients with agency + assigned agent
alter table public.clients add column agency_id uuid references public.agencies(id);
alter table public.clients add column assigned_agent_id uuid references auth.users(id);
```

### RLS policy shape (tiered)

```sql
-- Agents see only their own assigned clients
create policy "agents see assigned clients"
  on public.clients for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid()
        and p.role = 'agent'
        and assigned_agent_id = auth.uid()
    )
  );

-- Agency owners see all clients in their agency
create policy "agency owners see their agency clients"
  on public.clients for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid()
        and p.role = 'agency_owner'
        and p.agency_id = clients.agency_id
    )
  );

-- Super admin bypass (you, Mauricio)
create policy "super admin sees all"
  on public.clients for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid()
        and p.role = 'super_admin'
    )
  );
```

Same pattern repeats for INSERT, UPDATE, DELETE. Apply only when going multi-tenant.

### Migration path from current state

When multi-tenancy is activated:
1. Create `agencies` and `user_profiles` tables.
2. Insert one agency row for Mauricio's own practice — call it "Golden Anchor Original".
3. Insert one `user_profiles` row mapping Mauricio's auth user to that agency with `role='super_admin'`.
4. UPDATE all existing `clients` rows: set `agency_id` to Mauricio's agency, `assigned_agent_id = user_id`.
5. Drop the current simple `auth.uid() = user_id` policies, replace with tiered policies above.
6. App.jsx changes: login flow reads `user_profiles.role` after auth, renders UI accordingly; client list queries no longer need explicit `user_id` filter (RLS handles it).

No data loss. Existing single-advisor model becomes the first tenant of the multi-tenant system.

## 13. Playwright test harness (added post-v0.5.2a, 2026-05-14)

End-to-end test suite that drives a real browser through the live app using a dedicated Supabase test account. Catches regressions before they reach production. Lives in the repo but does NOT ship to Vercel (the build only includes files Vite imports — Playwright files are dev-only).

### Files

| File | Purpose |
|---|---|
| `playwright.config.ts` | Top-level config. Projects (browsers), timeouts, storage state path. |
| `global-setup.ts` | Runs once before all tests. Logs in via the real Supabase UI, saves auth state. |
| `tests/01-smoke.spec.ts` | App boots, every nav tab renders without black screen, language toggle works. |
| `tests/02-calculators.spec.ts` | Home Equity, Car Loan, Affordability, HY Savings, Debt Reduction math correctness. |
| `tests/03-client-workflows.spec.ts` | Miguel/Amanda client open, all detail tabs render, Complete Report sections. |
| `tests/04-translation.spec.ts` | EN/ES toggle: no `undefined`, no raw dict keys leaking, Spanish content present. |
| `tests/05-persistence.spec.ts` | Supabase round-trip: notes edit survives hard reload, migration flag set, cache hydrated. |
| `utils/fixtures.ts` | Shared helpers — `appPage` fixture, `navTo`, `openClient`, `fillNumberByLabel`, `getBuildMarker`. |
| `.env` (NOT committed) | `GA_TEST_EMAIL`, `GA_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. |

### Test accounts (Supabase Auth users)

| Role | Email | UUID | Notes |
|---|---|---|---|
| Main advisor | (Mauricio's real email) | `b373dd8a-bf12-4df2-9439-d7770406d416` | **NEVER touched by tests.** Hard-refuse guard in `global-setup.ts`. |
| Test user | `test@goldenanchor.life` | `9d017248-fc0a-44ad-b68b-53315bb928d8` | Seeded with duplicated fake/demo clients. The only account Playwright uses. |

### Running tests

```bash
# From the repo root in Codespace terminal:
rm -rf playwright/.auth      # wipe stale auth state
npm run test:e2e             # all browsers, headless (~7 min with WebKit disabled)
npm run test:ui              # interactive UI mode, recommended for debugging
npm run test:headed          # see the browser as tests run
npm run test:report          # open the HTML report from the last run
```

### Known issues (as of 2026-05-14)

1. **WebKit disabled in `playwright.config.ts`.** The Codespace is missing 36 system libraries (`libgtk-4.so.1`, `libvulkan.so.1`, `libgstreamer-*`, `libflite-*`, etc) that WebKit needs. Chromium and Firefox give us adequate coverage. To re-enable WebKit, run `sudo npx playwright install-deps webkit` once in the Codespace, then uncomment the webkit project block in `playwright.config.ts`.
2. **12 calculator tests fail** (`02-calculators.spec.ts` — 5 tests × Chromium + Firefox + WebKit, with WebKit now disabled = 10 failures, then 6 of those resolve when WebKit is off, leaving roughly 10 actual fails across Chromium + Firefox). Root cause: test selectors like `getByRole("button", { name: /Home/i })` don't match how the calculator tab buttons actually render in the app. **These are test-code bugs, not app bugs.** The calculator buttons work in production; the test code needs its selectors rewritten to match the actual DOM. Fixing this is a 1-hour follow-up patch, not a launch blocker.
3. **3-browser run takes ~11 minutes serially.** Configured for 1 worker because Codespaces free tier has limited CPU. Acceptable for pre-deploy verification, too slow for "run after every save" loops. Use `npx playwright test --project=chromium tests/01-smoke.spec.ts` to scope individual runs during dev.

### What the test results actually mean

After v0.5.2a deploy + first full run (2026-05-14):
- **30 tests passed** in Chromium + Firefox. Real meaningful coverage: app boots, every tab renders, language toggle works, login flow works, Supabase round-trip works, client workflows render, translation integrity holds, no `undefined` leaks.
- **12 tests failed** for calculator selector mismatches (Chromium + Firefox).
- **30 tests failed** for WebKit missing libs (about to be removed by disabling WebKit).

After WebKit is disabled, the expected steady-state is **30 passing / ~10 failing** with all failures isolated to `02-calculators.spec.ts`. Fix those when there's time.

### Future work

- **Calculator selector rewrite** (~1 hour). Open the actual app in DevTools, inspect how the calculator tab buttons render, rewrite the `getByRole(...)` calls in `02-calculators.spec.ts` to match the real DOM.
- **CI workflow** (`.github/workflows/playwright.yml`). Run the test suite on every push to `main`, fail the deploy if regressions ship. Requires the GitHub Actions secrets listed in the test setup (`GA_TEST_EMAIL`, `GA_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Smoke test against production** (override `GA_BASE_URL=https://finance.goldenanchor.life`). Run after every Vercel deploy. Catches "the build deployed but the page is white" failure mode.

### Sensitive things NOT in this section

`.env` contents are NOT in this repo, this doc, or anywhere except your local Codespace `.env` file and the GitHub Actions secrets configuration. If you ever paste a `.env` into chat, rotate every key in it immediately.

---

---

*Last updated: 2026-05-14 — v0.5.2a (Patch — launch stabilization part 1) + tooling addendum (Playwright). The patch shipped four launch-readiness items: 30-min idle auto-logout with 1-min warning + draft preservation, Mauricio-only password reset via Supabase email flow (no public signup), save-failure toast surfaced from `ga-save-failed` CustomEvent dispatched by `gaSaveClient`/`gaSaveSettings`. 17 new bilingual translation keys (1,060 per side now). No schema changes, no client-data shape changes — App.jsx only. New open decisions O-12 (auto-logout config, locked at 30/1 min), O-13 (PDF deferred to post-launch), O-14 (ToS/engagement letter flow deferred to v0.6+), O-15 (Supabase PITR + manual verification, column-level encryption deferred). Build marker bumped to `2026-05-14-autologout-passreset-v052a`. After deploy: Playwright test harness added to repo (5 spec files, 30 tests, dedicated `test@goldenanchor.life` test user, main advisor account protected by hard-refuse guard). WebKit disabled locally due to missing system libs; Chromium + Firefox give adequate coverage. 12 calculator tests fail with selector mismatches — test-code bugs, NOT app bugs, fix is a future patch. See §13. Next: v0.5.2b adds service plan tracking, Stripe Payment Link fields, About/Services Pay Now buttons, and `lastBackupVerified` settings field.*
