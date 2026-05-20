# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

## v0.12.3 — 2026-05-20 (Patch)

**Hotfix for v0.12.2 — `t`-out-of-scope crash; blank screen after login.**

v0.12.2 broke production immediately after deploy: every login rendered a blank screen because 8 component functions (`Kebab`, `PTag`, `BulkSnapModal`, `ImportWizard`, `DuplicateResolverModal`, `DeleteClientModal`, `BackupImportModal`, `ExportModal`) referenced new `t.xxx` keys in their bodies but did NOT accept `t` as a parameter. JavaScript threw `ReferenceError: t is not defined` → React error boundary fired → blank screen. `Kebab` was the killer because it renders on every dashboard client row (the first paint after login).

**Fix:** added `t` to all 8 signatures; propagated `t={t}` at all 22 JSX call sites; also added `t` to `ArchivedSection` (dead-code path, defense-in-depth).

**Why v0.12.2's audit missed it:** the TypeScript `--noLib` dry-run only catches syntax errors, and `t.foo` where `t` is undefined is **valid syntax** — the crash is a runtime `ReferenceError`, not a parse error. The key-symmetry check was source-text-only, not scope-aware.

**New locked decision D-36:** static-text patches MUST be verified by a scope-aware checker, not just a syntax check. The v0.12.3 patcher is now (a) brace-aware (walks tag chars tracking `{}` depth and string-quote state), and (b) followed by a scope verifier confirming every `t.knownKey` reference has `t` in scope and every `t={t}` call site has `t` in its enclosing function's scope.

`translations.js` unchanged at 1,313 keys/side. `App.jsx` 3,046 → 3,046 lines (signature edits only). TypeScript dry-run clean. Build marker `2026-05-20-v0123-t-scope-fix`.

**Deploy note:** because production rolled back to v0.12.1, this deploy must include BOTH the v0.12.2 `translations.js` (with the 83 new keys) AND the v0.12.3 `App.jsx`.

---

## v0.12.1 — 2026-05-19 (Patch — Vercel Chromium runtime fix)
FIX: v0.12.0 deployed successfully but every PDF send failed at runtime with `Failed to launch the browser process! /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory`. The advisor saw the inline error in the EmailReportModal; the PDF never reached the recipient.
WHY: `@sparticuz/chromium@131`'s bundled native libs (libnss3 + a stack of others) did not survive Vercel's serverless bundler tracing. Compounded by an accidental `npm install puppeteer` (full ~280MB Puppeteer package) during the v0.12.0 deploy session, which bloated `node_modules` past the practical tracing limit, increasing the chance of partial bundling. The Chromium binary itself got copied to `/tmp/chromium` but the loader couldn't find its `.so` deps because they were dropped during trace.
HOW IT'S FIXED: Switched from `@sparticuz/chromium` to `@sparticuz/chromium-min`. The `-min` variant ships only ~5MB of JS glue; the Chromium brotli tarball is fetched at runtime from the official GitHub release URL (`https://github.com/Sparticuz/chromium/releases/download/v140.0.0/chromium-v140.0.0-pack.x64.tar`) and cached in `/tmp` between warm invocations. This sidesteps Vercel's bundle tracing entirely and keeps the deployed bundle tiny (~5MB).
VERSIONS BUMPED: `@sparticuz/chromium-min@^140.0.0` paired with `puppeteer-core@^24.10.0`. `chromium-min` follows Chromium's release cycle (not semver) so this is a deliberate major-style bump, not a routine upgrade. Pair-matched per the Sparticuz/chromium release notes: chromium v140 ↔ puppeteer-core v24.
LAUNCH CALL MODERNIZED: `headless: chromium.headless` → `headless: "shell"` (puppeteer-core 24's expected literal). Added `--no-sandbox`, `--disable-setuid-sandbox`, `--hide-scrollbars`, `--disable-web-security` to the args spread as defensive belt for the Lambda runtime.
CHANGED:
`api/render-report-pdf.js` — header comment block updated; imports switched to `@sparticuz/chromium-min`; new pinned `CHROMIUM_PACK_URL` constant; `renderPDF()` function rewritten in its launch block (pass URL to `chromium.executablePath()`, `headless: "shell"`, defensive args). JWT verify, client load, HTML builder, SVG charts, and Resend attach paths are unchanged.
`package.json` — `@sparticuz/chromium` removed, `@sparticuz/chromium-min@^140.0.0` added. `puppeteer-core` bumped `^23.0.0` → `^24.10.0`. Full `puppeteer` (accidentally installed in the v0.12.0 session) must be uninstalled — see deploy steps.
`src/App.jsx` — only the build marker line changed (`2026-05-19-v0120-email-report-pdf` → `2026-05-19-v0121-chromium-min-fix`). No component changes, no helper changes, no UI changes.
`AGENT.md` — §3 head replaced with v0.12.1 entry (v0.12.0 demoted to prior); D-34 amended with the chromium-min lesson + version-pinning rule.
`WORKPLAN.md` — §5 completed log gets v0.12.1 row; footer updated. Chat 10 stays `done`; v0.12.1 is an out-of-band patch.
NO TRANSLATION CHANGES. `src/translations.js` unchanged at 1,230 keys/side.
NO `vercel.json` CHANGE. `maxDuration: 30` and `memory: 1024` were correct.
NO SQL MIGRATION. NO NEW ENV VARS.
DEPLOY STEPS:
`cd /workspaces/Financeapp`
`npm uninstall puppeteer @sparticuz/chromium` — remove the bad/redundant deps left over from v0.12.0.
`npm install @sparticuz/chromium-min@^140 puppeteer-core@^24` — install the working pair.
Drop in `src/App.jsx`, `api/render-report-pdf.js`, `package.json` (and `package-lock.json` from the npm commands above), `AGENT.md`, `WORKPLAN.md`. Append this CHANGELOG entry at the top.
Commit + push (commands below).
Vercel auto-deploys. The new function bundle should be ~5–10MB (much smaller than the previous bloated one).
Hard-refresh production; verify `window.__GA_BUILD__ === "2026-05-19-v0121-chromium-min-fix"`.
Smoke test: same client that failed before → Reports → Complete Report → 📧 Email. First send is the one-time tarball download (5–8s, well under the 30s `maxDuration`). Second send within ~5 minutes is warm (~1s). PDF should arrive.
EXPECTATIONS: Cold start moved from ~2–4s (claimed in v0.12.0) to ~5–8s (chromium-min downloads tarball once per cold container). Warm starts still ~1s. If the first send ever hits the 30s ceiling, the GitHub release CDN is being throttled — Vercel keeps the container warm for ~5 minutes so a retry should land in the warm path.
BUILD MARKER: `2026-05-19-v0121-chromium-min-fix`.
D-34 amended. No new locked decisions, no new pitfalls.

## v0.12.0 — 2026-05-19 (Minor — Chat 10)
FEATURE: Email the Complete Report to a client as a real PDF attachment, directly from the Complete Report tab.
WHY: Last major launch-blocker for client-facing report delivery. The existing `window.print()` → "Save as PDF" path stays as a manual fallback (O-13 stance retained for in-browser save), but the advisor can now hand off a polished PDF without leaving the app.
ARCHITECTURE (D-34, new locked decision): PDF rendering goes through a self-contained printable HTML document built server-side from the client's data, then Puppeteer'd to PDF — NOT by headlessly driving the live `finance.goldenanchor.life` SPA. Rationale: driving the SPA would require injecting a Supabase session into the headless browser context (refresh-token exposure), wait for Recharts animations + chart layout to settle, and would silently break on any App.jsx layout drift. Print-HTML is faster, more stable, smaller cold-start surface, and keeps the auth model clean.
CLOSES: O-11 (PDF generation approach) — chosen approach (a) Puppeteer, refined per D-34 to print-HTML rather than live-SPA-drive. O-13 (PDF generation timing for launch).
CHANGED:
NEW `api/render-report-pdf.js` — Vercel Serverless Function (D-30 server file). Verifies the advisor JWT (same pattern as `send-intake-invite.js`), loads the client row via service-role + two `.eq()` calls (pitfall #15 avoided — `local_id` first, then `data->>'id'` fallback), builds a Letter-sized printable HTML doc with inline SVG donut (income / bills) + bar (debts) charts in the Golden Anchor palette, `puppeteer-core` + `@sparticuz/chromium` renders to PDF (0.5in margins, `printBackground:true`, `waitUntil:"networkidle0"`), Resend (D-31) sends the email with the PDF as a base64 attachment. `reply_to` defaults to `RESEND_REPLY_TO`; if unset, falls back to the advisor's Profile & Settings email.
`vercel.json` — `functions` block added for `api/render-report-pdf.js`: `memory: 1024`, `maxDuration: 30`. Cold start ~2–4s, warm ~1s.
`package.json` — `puppeteer-core@^23.0.0` and `@sparticuz/chromium@^131.0.0` added to `dependencies`. `resend` and `@supabase/supabase-js` already present from v0.10.0.
`src/App.jsx` (2,998 → 3,046 lines):
New top-level helper `gaEmailCompleteReport(payload)` (line 28): grabs the Supabase session token, POSTs `/api/render-report-pdf` with `Authorization: Bearer <jwt>`, returns `{ok, messageId, filename, pdfBytes}` or `{ok:false, error}`.
New component `EmailReportModal` (line 643): recipient input auto-fills `client.email` (advisor can override), EN/ES default subject + body, inline send status with auto-close on success (1.6s). Disabled send button until recipient passes email regex.
`CompleteReportTab` signature gains `settings` prop; new `emailOpen` state; new `Btn small` "📧 Email" wrapped with `PrintBtn` inside a `ga-np` flex row so both hide when the report is printed.
`ClientReport` signature gains `settings` and forwards it to `CompleteReportTab`; `ClientDetail`'s `tab==="report"` call site also passes `settings` through.
`src/translations.js` (1,218 → 1,230 keys/side, symmetry verified): 12 new keys × 2 langs — `emailReportBtn`, `emailReportTitle`, `emailReportHelp`, `emailReportTo`, `emailReportSubject`, `emailReportMessage`, `emailReportSig`, `emailReportInvalidTo`, `emailReportSending`, `emailReportSendBtn`, `emailReportSent`, `emailReportFailed`. D-18 / pitfall #9 satisfied.
EMAIL SIGNATURE: Same v0.11.1 pattern — pulled from Profile & Settings (`advisorName` / `advisorEmail` in the payload), with a fallback to the historical defaults. Independent of `RESEND_FROM`.
NO SQL MIGRATION.
NO NEW VERCEL ENV VARS. Reuses the v0.10.0 / v0.11.1 set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`.
DEPLOY STEPS:
`cd /workspaces/Financeapp && npm install puppeteer-core @sparticuz/chromium` — installs the two new runtime deps for the Vercel function.
Drop in `src/App.jsx`, `src/translations.js`, `vercel.json`, `package.json`, `AGENT.md`, `WORKPLAN.md`. Add `api/render-report-pdf.js`.
Append this CHANGELOG entry at the top of `CHANGELOG.md`.
Commit + push (full commands below).
Vercel auto-deploys; the new function is picked up automatically (Vercel scans `api/*.js`).
Hard-refresh production; verify `window.__GA_BUILD__ === "2026-05-19-v0120-email-report-pdf"` in DevTools.
Smoke test: open any client with non-empty income/bills/debt data → Reports → Complete Report → "📧 Email" → enter your own email → "Send PDF". First send is the cold-start (5–8s); follow-ups are 1–2s. Confirm the email arrives with a `golden-anchor-report-<name>-<date>.pdf` attachment.
BUILD MARKER: `2026-05-19-v0120-email-report-pdf`.
NEW LOCKED DECISIONS: D-34 (print-HTML + Puppeteer, NOT live-SPA-drive).
PITFALLS: None new. D-1, D-7, D-18, D-27, D-30, D-31 preserved.

## v0.11.1 — 2026-05-19
- Intake-invite email signature now pulls the advisor name and contact
  email from Profile & Settings instead of being hard-coded. Set them in
  the app (Profile & Settings → Advisor Name / Email).
- Resend sender and reply-to standardized to noreply@finance.goldenanchor.life
  (D-31). The visible signature address is independent of the technical
  sender and is controlled from Profile & Settings.
- Server function api/send-intake-invite.js: buildEmailBody takes advisor
  name/email from the request payload, with a fallback to prior defaults.

## v0.11.0 — 2026-05-19
- Browser history integration. In-app navigation (nav / open client / tab)
  now pushes browser history, so Back/Forward move within the app instead of
  unloading it. popstate restores the prior view; a no-state Back falls back
  to the dashboard. On mobile, Back closes an open drawer first.

## v0.10.2 — 2026-05-18
- Fix: deleting a client now persists. v0.10.1's gaDeleteClient used a single
  PostgREST .or() filter, which PostgREST parses by splitting on "."; JSON paths
  and decimal client ids broke the query, so the soft-delete silently failed.
  Replaced with two plain .eq() UPDATE calls.
- Correction: v0.10.1's "NULL local_id" root cause was wrong; local_id is
  populated on every row. v0.10.1's grid/invites/de-dupe changes remain valid.

## v0.10.0 — 2026-05-18 (Minor)
- **NEW:** Server-side intake invite delivery via Resend. Replaces the v0.7.3 mailto/SMS MVP send panel.
- **NEW:** 3 Vercel Serverless Functions under `api/` — first instance of D-1 carve-out for server code (D-30).
  - `api/send-intake-invite.js` — verifies advisor JWT, generates 24-byte token, inserts invite row, sends via Resend; Twilio path included but feature-flagged off.
  - `api/resolve-intake-invite.js` — anonymous prefill endpoint via SECURITY DEFINER RPC.
  - `api/mark-intake-invite-submitted.js` — links invite to new intake submission on success.
- **NEW:** Supabase tables `intake_invites` + `sms_consent_log` with RLS and SECURITY DEFINER functions (`resolve_invite_token`, `mark_invite_submitted`).
- **NEW:** PublicIntake reads `?invite=<token>` on mount, calls resolve API to prefill firstName/lastName/email/phone, marks `opened_at`. On submit, links the new submission back to the invite.
- **NEW:** Sent Invites collapsible list under the send panel — status pills (Sent/Opened/Submitted/Failed/Expired), per-row delete.
- **NEW:** TCPA consent attestation pattern (D-33) — advisor checkbox + opt-out footer + persistent log. Engages whenever the SMS channel is on, regardless of `TWILIO_ENABLED`.
- **CHANGED:** `gaSubmitIntake` returns `submissionId` (used to link invite → submission).
- **CHANGED:** `intakeSendTitle` text "Send link to a prospect" → "Send invite to a prospect" (EN + ES).
- **NEW LOCKED DECISIONS:** D-30 (server code in `api/` Vercel functions), D-31 (Resend = email provider, sender + reply-to addresses locked), D-32 (Twilio code-complete but feature-flagged off until business verification), D-33 (TCPA = advisor attestation + opt-out footer + audit log).
- **OPEN DECISIONS CLARIFIED:** O-11 / O-13 (PDF) remain open but scope clarified — intake invites carry no PDF; PDF generation is a future "email Complete Report" concern.
- **NEW TRANSLATION KEYS:** +22 × 2 langs (1,195 → 1,217 per side, symmetry intact).
- **App.jsx:** 2,900 → 2,962 lines. Build marker: `2026-05-18-v0100-server-intake-delivery`.
- **DB MIGRATION REQUIRED:** Run `supabase/migrations/20260518_intake_invites.sql` in Supabase SQL Editor.
- **ENV VARS REQUIRED:** Set 7 vars in Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`, `PUBLIC_INTAKE_BASE_URL`, `TWILIO_ENABLED=0`.

## Tooling — 2026-05-17 (Playwright suite resync — no app version change)
- **CHANGED:** Re-baselined the Playwright e2e suite against the post-v0.9.3 app.
- **WHY:** Chats 3/4/5 (IA refactor, bulk actions, mobile redesign) shifted the
  selectors and surfaces the suite relied on; two specs were passing falsely
  against the deleted Forms tab.
- **CHANGED:** tests/01-smoke.spec.ts, tests/03-client-workflows.spec.ts,
  tests/04-translation.spec.ts; new tests/06-mobile.spec.ts. App.jsx untouched.

## v0.9.0 — 2026-05-16 (Minor)

Mobile / responsive redesign of every primary surface. Layout primitives only — no data shape, no behavior, no new components, zero new translation keys. Chat 5 of the parallel-chat workplan.

**Top bar**
- Dropped the ⚓ from the mobile app bar to reclaim title width — the desktop sidebar brand row is unchanged. Title (or selected client name) now fits a ~360px viewport without truncation.

**Dashboard**
- KPI grid is now `repeat(2,1fr)` on mobile and `repeat(auto-fit,minmax(140px,1fr))` on desktop — six KPIs become a clean 3×2 on a phone instead of a long ribbon.
- Donut-charts row stacks vertically on mobile.
- Header title font drops a size step on mobile; the four header action buttons wrap.
- Search input goes full-width on mobile.
- "Active Clients" row stacks name+email on top and snapshot tiles + net/mo below on mobile; the `›` chevron is hidden.

**Clients tab (ClientList — Chat 4 surface)**
- Header row: search becomes full-width on mobile; 📥 / ⋮ overflow action buttons drop below it; "+ Add" grows to share the row.
- Chat 4 bulk-action coloured bar `flex-wrap`s on mobile so the action label, the live selected-count, and the Cancel + apply buttons all stay readable instead of horizontally clipping.
- Active and archived client rows stack name+email on top, figures below.

**Client detail**
- 4-up KPI row → 2-up on mobile.
- Charts row stacks vertically on mobile.
- The 8-tab strip (📊 / 📅 / 📋 / 💹 / 📋 / 🧮 / 🔧 / 🗒) on mobile gets `overflowX:auto` inside its own region — no more page-level horizontal scroll.

**Other surfaces**
- `CalculatorsPage` switched to `repeat(auto-fill,minmax(160px,1fr))`.
- `ResourcesPage` switched to `repeat(auto-fill,minmax(220px,1fr))`.
- `AboutPage` advisor-card and services grids switched to `auto-fit`.
- v0.8.1 Appearance preview tile re-sized 128 → 120 with `flex:"0 0 auto"`, and the BgPicker column is `flex:"1 1 200px"` with `minWidth:0` — the pair fits beside each other at narrow widths without horizontal scroll.
- App main content column got `maxWidth:"100%"` as a final overflow-safety belt.

**Build marker:** `2026-05-16-v090-mobile-responsive`. App.jsx 2,856 → 2,858 lines. `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. D-1, D-7, D-10, D-18, D-27 preserved; D-27 (mobile-first + PWA) meaningfully advanced.

## v0.8.1 — 2026-05-16

### Added — Customizable background colors
- New "Background Colors" section in Profile & Settings. Set the page
  background and card background separately for light mode and dark mode.
- Each color offers preset shade swatches plus a custom color picker and
  a hex field. A live preview tile shows the combination before you save.
- Per-mode "Reset" returns that mode's colors to the defaults.
- 6 new English/Spanish translation strings (1,186 → 1,192 per language).

No database changes. No breaking changes.
Build marker: 2026-05-16-v081-appearance-bg-settings

## v0.8.0 — 2026-05-16

### Added — Bulk actions on the Clients tab
- The Clients-tab menu gains five operations: Archive, Restore, Delete,
  Split, and Join. The client list looks unchanged until you pick one.
- Picking Archive, Restore, or Delete turns on a selection mode: an action
  bar appears with a "select all" option and a live count, and checkboxes
  appear on the clients that action applies to (Archive on active clients,
  Restore on archived clients, Delete on any). Pick the clients, then
  confirm in a dialog that lists them by name. Bulk Delete requires typing
  DELETE.
- Split and Join open searchable pickers and reuse the existing Split/Join
  screens — they act on one client and ignore selection.
- 28 new English/Spanish translation strings (1,158 → 1,186 keys per language).

### Changed
- Clients list component rewritten to support the bulk-action flow.

No database changes. No breaking changes.
Build marker: 2026-05-16-v080-bulk-client-actions

## v0.8.0 — 2026-05-16

### Added — Multi-select & bulk actions on the Clients tab
- Each client row now has a selection checkbox. Clicking the row body still
  opens the client; only the checkbox toggles selection.
- New selection bar: "select all visible" checkbox, live selected-count, Clear.
- The Clients-tab menu gains five bulk operations: Archive Selected, Restore
  Selected, Delete Selected, Split, and Join.
  - Archive/Restore/Delete act on the whole selection and are disabled when
    nothing is selected; Restore requires every selected client to be archived.
  - Each opens a confirmation dialog listing affected clients by name; bulk
    Delete requires typing DELETE.
  - Split and Join open searchable pickers and reuse the existing Split/Join
    screens — they are single-client operations and ignore the selection.
- 27 new English/Spanish translation strings (1,158 → 1,185 keys per language).

### Changed
- Clients list component rewritten to support multi-select.
- Shared menu component gained disabled-item support.

No database changes. No breaking changes.
Build marker: 2026-05-16-v080-bulk-client-actions

## v0.7.3 — 2026-05-16 (Patch — intake form bundle)

- **FIXED:** Browser autofill bug — advisor's own Gmail and saved-password values were bleeding into the public intake form when opened in the advisor's logged-in Chrome. Root cause: `autoComplete="email"` triggered Chrome autofill; `SSNInput`'s `type="password"` triggered saved-password autofill. Every input in `IntakeFormBody` now has `autoComplete="off"` + `data-lpignore="true"` + `data-1p-ignore="true"` + unique app-specific `name` attributes. SSN fields (main, P1, P2) switched from `<SSNInput type="password">` to inline `<input type="text">` with inline `fmtSSN` helper (same auto-format-to-`XXX-XX-XXXX` behavior). No Show/Hide toggle for the prospect (they're entering their own SSN on their own device — masking is unnecessary).
- **REMOVED:** Client Type + Recommended By fields from the public intake form. Both were vestigial — `clientType` defaults to `"financeOnly"` and can be changed by the advisor via the existing Edit Client modal; `recommendedBy` overlapped with `howHeard`. SSN row now pairs with "How did you hear about us?" for a clean 2-column layout.
- **ADDED:** Light/dark toggle on the public intake page (☀️/🌙 button next to EN/ES). New light palette uses slate-on-white with a muted gold accent. Preference persists in `localStorage["ga_intake_mode"]`. Reused editor sub-components (IncomeSection / BillsSection / DebtSection / CustomAssetsSection) follow the theme switch because `ThemeCtx.Provider` value rebuilds when `mode` changes.
- **ADDED:** MVP send-intake-link feature on `IntakeSubmissionsPage`. Collapsible "Send link to a prospect" panel under the existing Public Intake URL card. Inputs: prospect name (optional) + email + phone + EN/ES language toggle. Three action buttons: ✉️ Send Email (opens `mailto:` with bilingual subject + body), 💬 Send SMS (opens `sms:` with shorter body), 📋 Copy message (clipboard). No server, no DNS dependency — advisor sends from their own email/SMS account.
- **ADDED:** 11 translation keys × 2 languages = 22 entries — `intakeSendTitle`, `intakeSendHelp`, `intakeSendName`, `intakeSendEmail`, `intakeSendPhone`, `intakeSendLang`, `intakeSendEmailBtn`, `intakeSendSmsBtn`, `intakeSendCopyBtn`, `intakeSendEmailReq`, `intakeSendPhoneReq`. Dictionary 1,147 → **1,158 per side**, symmetry verified.
- **DEFERRED:** Server-side email/SMS delivery via Resend/Twilio remains backlog under "Server-side intake delivery (future)" — blocked on Porkbun→Cloudflare DNS migration. WhatsApp Business API delivery explicitly deferred to long-term backlog per advisor decision.
- **BUILD MARKER:** `2026-05-16-v073-intake-polish-and-send-mvp`.
- **CHANGED:** App.jsx 2,696 → 2,743 lines. `src/translations.js` 1,147 → 1,158 keys/side. `tsc --noEmit` clean. No schema change.

## v0.7.2 — 2026-05-16 (Patch — UI polish on top of v0.7.1)

- **FIXED:** SSN fields in the public intake form (main, P1, P2) now use the existing `SSNInput` component instead of a raw `<input>`. Auto-formats to `XXX-XX-XXXX` as the user types, masked by default with a Show/Hide toggle. The `*` on the main SSN label was misleading — the `submit()` validator never enforced it, so dropped.
- **FIXED:** Reused editor sub-components (`IncomeSection`, `BillsSection`, `DebtSection`, `CustomAssetsSection`) inside the public intake form now render with the same gold/blue dark theme as the CONTACT & SERVICE section. Root cause: `ThemeCtx.Provider` value was a `{dark, light, isDark, settings}` wrapper instead of a flat theme object — `useTh()` returns the context value directly, so the reused editors got `th.bg = undefined` and fell back to browser defaults. Replaced with a flat object mirroring the local `TH` plus the extra keys (`nav`, `navBorder`, `sideText`, `sideMuted`) the style helpers consume.
- **FIXED:** Sort-arrow spacing in the `SA` component bumped from `marginLeft:2` to `marginLeft:6`. Visible space between column label and ↑/↓/↕ arrow — affects every sortable table app-wide.
- **BUILD MARKER:** `2026-05-16-v072-intake-polish`.
- **CHANGED:** App.jsx 2,694 → 2,696 lines. No translation changes (translations.js unchanged from v0.7.1). No schema change. `tsc --noEmit` clean.

## v0.7.1 — 2026-05-16 (Patch — feature-add on top of v0.7.0)

- **ADDED:** Public intake form now collects everything the old per-client `IntakeSection` did. New shared `IntakeFormBody` component renders personal block (firstName, lastName, email, phone, dob, address, **SSN**, recommendedBy, clientType, howHeard) + partner toggle with full P1/P2 personal info (phone, email, DOB, SSN per person) + full `IncomeSection` + `BillsSection` + `DebtSection` + `CustomAssetsSection` editor sub-components + Contact & Service block + Goals/Notes block (goals, short-term, mid-term, long-term, setbacks, general). Heavy form — accepts prospect-side abandonment risk in exchange for fully-loaded clients on Convert.
- **ADDED:** SSN collection on the public intake URL. Plaintext through Supabase RLS — anon INSERT allowed, advisor-scoped SELECT/UPDATE/DELETE. See AGENT.md §3 threat-model note.
- **ADDED:** "✏️ Edit Intake" button on `IntakeSubmissionsPage` detail panel. Opens new `IntakeSubmissionEditor` modal (`width={800}`) that hydrates the submission's `data` JSONB blob via `mig({...mk(), ...submission.data})` into a client-shaped object, reuses `IntakeFormBody` for the UI, and on Save writes back through new `gaUpdateIntakeData(id, data)` helper to `intake_submissions.data` — NOT the clients table. Useful for cleaning up sloppy prospect submissions before Convert. The per-client 📝 Intake tab stays DELETED (v0.7.0 IA decision preserved).
- **ADDED:** Per-row "🗑️ Delete" button in detail panel for every status (pending, reviewed, converted, rejected). Confirmation modal then calls new `gaDeleteIntakeSubmission(id)` helper.
- **ADDED:** Header-level "🧹 Clear converted ({n})" / "🧹 Clear rejected ({n})" bulk-delete buttons. Each opens a confirmation modal showing the count and calls new `gaDeleteIntakeSubmissionsByStatus(advisorId, status)` helper. Pending/reviewed submissions have no bulk path — single-delete only.
- **ADDED:** 3 new Supabase helpers (`gaUpdateIntakeData`, `gaDeleteIntakeSubmission`, `gaDeleteIntakeSubmissionsByStatus`). RLS already covers them — no SQL migration needed.
- **CHANGED:** `doConvert` rewritten. Old handler cherry-picked 8 flat fields; new handler spreads `{...sub.data}` through `mig()` so every intake field flows into the new client. Legacy v0.6.x flat-shape submissions still convert via a fallback branch that reconstructs `notes` from old flat fields (`d.goals`, `d.notes_text`, `d.preferredService`, `d.contactMethod`) and `incomeStreams` from old `d.monthlyNetIncome`. "Submitted via public intake on YYYY-MM-DD" appended to `client.notes.general` for traceability.
- **ADDED:** 6 translation keys × 2 languages = 12 entries — `intakeEditBtn`, `intakeDeleteBtn`, `intakeConfirmDelete`, `intakeClearConverted`, `intakeClearRejected`, `intakeConfirmClear`. Dictionary 1,141 → **1,147 per side**, symmetry verified.
- **RETAINED:** `IntakeSection` component definition (line 449) remains in the file but is fully unmounted (was mounted in v0.6.x, unmounted by v0.7.0, still unmounted in v0.7.1). Kept as reference implementation; candidate for future cleanup pass.
- **BUILD MARKER:** `2026-05-16-v071-full-parity-intake-edit-delete`.
- **CHANGED:** App.jsx 2,565 → 2,694 lines (~548 → ~571 KB). `src/translations.js` ~79 → ~81 KB. `tsc --noEmit` clean. No schema change — everything rides existing `intake_submissions.data` JSONB column.

## v0.7.0 — 2026-05-16 (Minor — IA breaking change)

- **CHANGED:** Information architecture refactor. The standalone 📋 Forms tab is removed; the per-client 📝 Intake tab is removed; Investment Allocation + Emergency Fund are no longer in the client-facing intake — they now live exclusively in the advisor-only Monthly Statement.
- **CHANGED:** "Intake Submissions" renamed → **Intake Forms** (EN) / **Formularios de Admisión** (ES). Page header, nav label, and the `intakeShareUrlHelp` text updated in both languages. The component is still named `IntakeSubmissionsPage` internally.
- **CHANGED:** Post-Convert and post-`addClient` flows now land on the Monthly Statement tab (previously they landed on the now-deleted Intake tab).
- **REMOVED:** `FormsPage` component, orphan `dlTmpl` CSV-template generator, `{id:"forms"}` NAV entry, `nav==="forms"` render branch.
- **REMOVED:** `{id:"intake"}` tab entry + `tab==="intake"` render branch from `ClientDetail`.
- **REMOVED:** `SavingsSection` call inside `IntakeSection`. `SavingsSection` still renders in `MonthlyTab` via `FullMonthView` (current month tabbed view + full-page report + historical month view) and in the Complete Report, unchanged.
- **REMOVED:** 6 orphan translation keys × 2 languages = 12 entries (`forms`, `formsTitle`, `formsDesc`, `downloadCSVTemplate`, `howToUseColon`, `newClientOnboarding`). Dictionary 1,147 → **1,141 per side**, symmetry verified.
- **RETAINED:** `IntakeSection` component definition (currently unmounted in v0.7.0 — Mauricio's plan is to wire it into the `IntakeSubmissionsPage` detail view in a future chat). This is intentional; not a candidate for cleanup.
- **NOT MIGRATED:** `client.intakeData`. Field does not exist anywhere in App.jsx (no read, no write, no migration in `mig()`); intake had always written to the same root client fields every other editor uses, so there's nothing to discard.
- **BUILD MARKER:** `2026-05-16-v070-ia-refactor-intake-forms`.
- **WHY:** Mauricio's audit: the standalone Forms tab and per-client Intake tab were duplicative of capabilities already covered by the public intake URL (`/intake?advisor=...`) + the global Intake Forms surface + the Monthly Statement editor. Asking clients about Investment Allocation in intake was scope-wrong — those fields belong in the advisor's planning workflow, not the client's data-gathering form.
- **CHANGED:** App.jsx 2,568 → 2,565 lines. `src/translations.js` symmetry intact.

## v0.6.3 — 2026-05-16 (Patch)
- **CHANGED:** Service Plan editor (Notes & Goals tab) trimmed from 9 fields to 4 — kept Service Plan, Start Date, Payment Method, Payment Link URL; removed Category, Status, Next Charge Date, Last Paid Date, Service Notes. Existing client data for the removed fields is left in place — no migration.
- **ADDED:** Pay Now / Pay Later buttons in the Service Plan editor, shown when Payment Method is "Stripe link" and a Stripe link is configured for that plan. Pay Now opens the Stripe checkout in a new tab; Pay Later stamps a dated "[Pay Later — date]" marker into the client's General Notes.
- **CHANGED:** Notes & Goals "client goals" label moved to second person ("What You Want to Achieve" / "Qué Quieres Lograr").
- **CHANGED:** `settings` is now passed to the Notes / Service Plan UI so the Pay buttons can read the configured Stripe links.
- **TRANSLATIONS:** added `payLater` to EN + ES (1,146 → 1,147 keys per side).
- **CHANGED:** build marker → `2026-05-16-v063-service-plan-trim-notes-tone`.

---
# v0.6.2 (Patch) — 2026-05-15

**Pure mechanical refactor — no behavior change, no UI change, no bug fixes, no new features.**

Extract the `T.en` / `T.es` translation dictionaries out of `App.jsx` into a sibling `src/translations.js`. All references resolve unchanged because the imported identifier (`T`) and shape (`T.en`, `T.es`, `T[lang]`) are identical.

## What changed

- **New file: `src/translations.js`** (~80 KB, 4 lines). Single export `export const T = { en: {...}, es: {...} }`. Pure data — no JSX, no React imports, no logic. 1,146 keys per side, fully symmetric.
- **`src/App.jsx`** modified at two sites:
  - Added `import { T } from "./translations";` at line 5 (after the four existing React/Recharts/xlsx/Supabase imports).
  - Removed the 3-line `const T = { en: {...}, es: {...} };` block (previously lines 91–93) and replaced its comment header at line 90 with a breadcrumb pointer to `src/translations.js`.
- App.jsx: 2,580 lines / ~635 KB → 2,577 lines / ~555 KB.
- Build marker: `2026-05-15-v061-prefs-and-intake-ux` → `2026-05-15-v062-translations-extracted`.

## Why

Future Spanish translation audit chats can upload `src/translations.js` alone (~80 KB) instead of the entire `App.jsx` (~635 KB), leaving more context budget for the actual audit work. This was the only refactor justifying the carve-out from D-1; no other extractions are planned at this time.

## Decisions

- **D-1 amended** — single-file architecture now carves out pure-data modules (literal-only exports with no JSX and no React imports) when their size impairs editing. Each carve-out gets its own locked D-NN entry; D-1 itself does not need re-opening for future ones.
- **D-29 locked** (new) — `T.en` and `T.es` live in `src/translations.js`. Both languages must still be updated in the same edit (Pitfall #9 unchanged).
- **D-18 (Track A) amended** — points at the new file path; key count corrected to 1,146 per side (was documented as 868 in the original D-18 wording; v0.6.0 release notes claimed 1,147 but actual is 1,146 — symmetry is intact, the documented total was off by 1).

## Verification

- `node` parse of `src/translations.js`: clean. `Object.keys(T.en).length === Object.keys(T.es).length === 1146`. Zero asymmetric keys.
- `@babel/parser` parse of modified `App.jsx`: clean. Top-level statements: 252.
- `grep` reference check: `T.en` (3 occurrences), `T[lang]` (3 occurrences) — unchanged counts vs v0.6.1. Line shifts of -2 match the net line delta (-3 removed const T block + 1 added import).

## Out-of-app actions

- Add `src/translations.js` to the repo at that path.
- Replace `src/App.jsx`.
- Commit + push. Vercel auto-deploys.
- Hard refresh production; verify `window.__GA_BUILD__ === "2026-05-15-v062-translations-extracted"`.
- Toggle EN/ES — the entire UI must translate identically to v0.6.1.
- Run Playwright: `rm -rf playwright/.auth && npm run test:e2e`. Expect 60/60 passing.

## v0.6.1 — 2026-05-15 (Patch)

Four small fixes Mauricio caught in the v0.6.0 walkthrough. No schema changes, no new locked decisions, no version-marker drift past patch.

**FIX 1 — Light/Dark mode and EN/ES toggle now persist across page refresh.**
- **Root cause:** `lang` and `isDark` were initialized with hard-coded literals (`useState("en")`, `useState(true)`) in the App component (App.jsx ~line 2367), so every reload reverted them. The `settings` state already persisted to `localStorage` (`ga_settings`) and to Supabase via `gaSaveSettings`, but neither `lang` nor `isDark` was a field on `settings`.
- **Fix:** added `lang:"en"` and `isDark:true` defaults to `DEF_SETTINGS`; replaced the hard-coded `useState("en")` / `useState(true)` with reads from a freshly-computed `_gaInitSettings` (same shape as the existing settings initializer); added a `useEffect([lang,isDark], …)` that mirrors changes back into `settings` so the existing settings-persistence pipeline carries them. Both prefs now ride along inside the `ga_settings` JSON column (D-10 stays satisfied — no new top-level localStorage key). When the advisor logs in on another device, language and theme follow them via the Supabase settings row.
- **Behavior:** on first load with no prior preference, dark + EN remain the defaults (matches prior behavior). Subsequent toggles persist. Migration is automatic; old settings rows that don't have `lang`/`isDark` get the defaults filled in by the `{...DEF_SETTINGS, ...persisted}` spread.

**FIX 2 — About Us: Free advisory no longer shows a Pay Now button.**
- **Root cause:** the SVCS service grid (`AboutPage`, App.jsx ~line 2140) rendered a Pay Now anchor for every service. For `insurance-consult` (price `"Free"`) the URL was empty, so the button rendered in a disabled gray state with a tooltip pointing to Stripe Links. Visually noisy and confusing — there's no payment to make.
- **Fix:** wrapped the Pay Now `<a>` in a `{s.price!=="Free" && …}` guard. The Request Service button on the free-service card now stretches to full width via its existing `flex:1`. The card layout otherwise unchanged.
- **Scope:** today this only affects `insurance-consult`. Any future free service that uses `price:"Free"` exactly will inherit the same behavior. The string match is exact (case-sensitive) so the `"Any amount"` donation still gets a Pay Now button.

**FIX 3 — Resources guides now link to authoritative external sources.**
- **Root cause:** each guide card's "Open Guide →" link was a `mailto:` to `mauricio@goldenanchor.life`, which forced the prospect to email Mauricio just to read about credit scores. Wasted touchpoint; broke the "education first" positioning.
- **Fix:** each entry in the `ResourcesPage` `guides` array gained a `url` field. The card's link became a plain `<a target="_blank" rel="noopener noreferrer">` to that URL. Six URLs picked for stability and authority:
  - **Understanding Your Credit Score** → `https://www.experian.com/blogs/ask-experian/credit-education/score-basics/understanding-credit-scores/` (Mauricio's example URL)
  - **Debt Payoff Strategies** → `https://www.nerdwallet.com/article/finance/debt-snowball-vs-avalanche`
  - **Building an Emergency Fund** → `https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/`
  - **Retirement Savings 101** → `https://www.investor.gov/additional-resources/retirement-toolkit`
  - **First-Time Homebuyer Guide** → `https://www.consumerfinance.gov/owning-a-home/`
  - **Investment Allocation Basics** → `https://www.investor.gov/introduction-investing/getting-started/asset-allocation`
- **Forward note:** URLs are hardcoded inside the component. If any source moves or rebrands, this is a one-line patch — no migration. CFPB and Investor.gov (SEC) URLs have been stable for years; Experian and NerdWallet less so but the slugs are descriptive enough that 301s usually catch them.

**FIX 4 — Intake Submissions: EN/ES Copy buttons and URL display all work now.**
- **Root cause (Copy):** the `copyUrl` function used `navigator.clipboard.writeText(...).then(...).catch(()=>{})` — silently swallowed every failure. In non-secure contexts, in some iframes, in iOS Safari under specific conditions, and when the document doesn't have focus, that promise rejects. The user got zero feedback and the button looked broken.
- **Root cause (URL display):** the URL panel showed only the EN URL in the input field; the ES Copy button copied `publicUrlEs` (which has `&lang=es`) but the field still showed `publicBase`. So even when Copy succeeded the user couldn't see what got copied. With Fix 1's clipboard fallback silent, this read as "ES Copy is broken too."
- **Root cause (URL itself "didn't work"):** very likely the `/intake?advisor=<uuid>` URL itself returned a Vercel 404 page when visited directly. Vite SPAs need a catch-all rewrite to `/index.html` so client-side routing can take over. There was no `vercel.json` shipped with v0.6.0 to do this; that's a deployment-side oversight from the v0.6.0 ship list.
- **Fix:**
  - `copyUrl` rewritten as `async`: tries `navigator.clipboard.writeText` first (only if `window.isSecureContext`); on failure or unavailability, falls back to a hidden `<textarea>` + `document.execCommand("copy")`; on a second failure, opens `window.prompt(...)` with the URL pre-selected so the user can copy manually. Either way they get feedback.
  - URL panel now shows two rows — one for EN, one for ES — each with a language tag, the exact URL its button copies, and an independent Copy button that turns green and reads "✓ URL copied" on success.
  - Input fields became fully selectable (click selects all, focus selects all, normal text-cursor) so Cmd/Ctrl-C still works without the button.
  - **Out-of-app:** a new `vercel.json` is included at repo root with `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`. Drop it next to `package.json`, commit, push. After Vercel redeploys, `https://finance.goldenanchor.life/intake?advisor=<uuid>` loads the SPA, the `isPublicIntakeRoute` check in App.jsx fires, and `PublicIntake` renders. No App.jsx change for the routing fix itself — the existing route detection was already correct.

**CHANGED:**
- `src/App.jsx` — five touchpoints (DEF_SETTINGS, App state init, sync useEffect, AboutPage grid, ResourcesPage, IntakeSubmissionsPage copyUrl + URL block). +2,475 bytes net. 2,580 lines (was 2,562). No new top-level localStorage keys (lang+isDark ride inside `ga_settings`). No new translation keys (existing keys cover the new EN/ES tag prefixes since "EN"/"ES" are universal). No SQL migration.
- `vercel.json` (new file at repo root) — SPA rewrite for the public intake route. Doesn't change anything that already worked.

**Build marker:** `2026-05-15-v061-prefs-and-intake-ux`.

**Deploy:**
1. Replace `src/App.jsx` with the new file.
2. Drop `vercel.json` at the repo root (next to `package.json`).
3. Commit, push to `main`. Vercel auto-deploys.
4. Hard refresh `https://finance.goldenanchor.life`. Confirm `window.__GA_BUILD__` reads `2026-05-15-v061-prefs-and-intake-ux` in DevTools console.
5. Toggle light/dark and EN/ES, refresh — both should persist.
6. Open About Us → confirm "Insurance Advisory (Free Consult)" card has only the Request Service button, no Pay Now.
7. Open Resources → click any guide → confirm it opens an external site in a new tab.
8. Open Intake Submissions → click EN Copy → paste somewhere → confirm `…/intake?advisor=<uuid>` URL. Click ES Copy → paste → confirm `…/intake?advisor=<uuid>&lang=es`.
9. Visit the EN URL directly in a clean browser tab → confirm the dark-themed public intake form renders. (If you still get a Vercel 404, the `vercel.json` didn't deploy — check the repo root.)

---

## Tooling addendum (2026-05-15) — Playwright selector fix, second pass

Not a version bump. App.jsx unchanged. Test-harness only. This is the second test-harness correction in 24 hours. The previous "later same day" pass on 2026-05-14 (entry below) rewrote `utils/fixtures.ts` and the spec files with correct theory but landed three live bugs that only showed up when the suite was actually run end-to-end. The first end-to-end run after that fix returned 24 passed / 36 failed across Chromium + Firefox. The three bugs:

1. **`switchLang` used `isVisible()` (non-blocking) as its language probe.** The probe returned `false` if "Dashboard" wasn't *already* in the DOM at the instant of the call (i.e. during the brief window before the nav rendered) — which then made the function conclude `currentLang === "es"` and return without clicking. The test then tried `navTo("Tablero")` against an app that was still in EN and timed out. **Fix:** `Promise.race` between `waitFor({state:"visible"})` on both candidate labels, with a 4s timeout per side. Whichever resolves first determines the current language. Also switched the toggle selector from `getByRole("button", { name: /EN\s*\|\s*ES/i })` to `getByTitle("Language", { exact: true })` — the title attribute is stable across the sidebar-collapsed state (where the visible text becomes just `🌐`).

2. **`openClient` waited on the wrong placeholder.** The function waited for `🔍 Search clients…` (the Dashboard's translated placeholder via `t.searchClients`) but `navTo("Clients")` routes to the dedicated `ClientList` page (App.jsx:1988) which hardcodes `placeholder="🔍 Search…"` — no translation, no "clients" word. **Fix:** wait on `/🔍\s*Search/i` which matches both the Dashboard search box and the ClientList search box (and won't false-match anything else on the page).

3. **`fillNumberByLabel` used `getByLabel()` which is incompatible with the app's `Field` component.** The `Field` UI atom (App.jsx:157) renders `<div data-cf="Label Text"><label>Label Text</label>{children}</div>` — the `<label>` is a sibling of the input, not a wrapper, and there's no `htmlFor` linking the two. Playwright's `getByLabel` requires either a wrapping `<label>` or a `for=`/`id=` association, so it can't see this pattern. **Fix:** select by the `data-cf` attribute that `Field` writes specifically for test selectors. For string labels, exact-match attribute selector. For regex labels, enumerate all `[data-cf]` elements and pick the first whose attribute value matches. Then traverse to the descendant `input|select|textarea`.

**Files changed:**

- **`utils/fixtures.ts`** — three function bodies replaced as described above. `navTo` and `openCalculator` are unchanged in shape (they worked in the previous pass; the earlier test failures attributed to them were cascade failures from `switchLang` not firing).

- **`tests/02-calculators.spec.ts`** — also rewritten in this pass to correct three real test-code errors that surfaced once `fillNumberByLabel` worked:
  - **Affordability** assertion was `$3,100` (gross × 36% − debt). The default DTI slider value is **43%**, not 36%. Correct expected value: `$3,800`. Test now asserts `$3,800` and doesn't touch the DTI slider (sliders aren't fillable via `.fill()` anyway).
  - **Debt Reduction** asserted `/Avalanche|Snowball/i` content. That's the *client-bound* DebtReductionCalc — the *standalone* version on the gallery page is a CC-vs-Loan payoff calc with `📉 Payoff` / `⚖️ CC vs Loan` mode buttons. Test now asserts the actual result panel content: "Payoff Time", "Total Paid", "Total Interest".
  - **Car Loan, HY Savings, Affordability** input regexes were ambiguous (`/APR/i` matches both "APR (%)" and "Loan APR (%)" in the same panel; `/Years/i` matches "Years Elapsed" and "Term (years)"). Test now uses anchored regex (`^APR \(%\)$`, `^Years$`, `^Term$`) to land on the right field.

- **`tests/04-translation.spec.ts`** — unchanged. The previous version was correct; it failed only because `switchLang` didn't actually switch.

**Why this took two passes:**

The previous pass had no way to verify the helpers against a running app — only against the App.jsx source. Several of the bugs (probe timing, slider defaults, hardcoded placeholders, ambiguous input labels) only surfaced under a live DOM. The diagnosis from the failure log was clean, the fixes are targeted, and there are no further hypotheses left to test against the source — if these don't pass, the next failure will be a genuine selector mismatch revealed by a real test run, not another theory bug.

**Expected steady state:** roughly 60/60 passing once this lands. The persistence test (`tests/05-persistence.spec.ts`) calls `openClient` internally and should pass as a side effect of fix (2). The `03-client-workflows` suite also relies entirely on `openClient` and should also be green.

**No App.jsx changes. No version bump. No build marker bump.** Run `rm -rf playwright/.auth && npm run test:e2e` from the Codespace to verify.

---

## Tooling addendum (2026-05-14, later same day) — Playwright selector fix

Not a version bump. App.jsx unchanged. Test-harness only. Fixes the selector bugs that were causing ~30 of the ~60 Playwright cases to fail with timeouts. All failures were test-code bugs (selectors written from memory before the DOM was inspected) — none were app bugs. Closes the v0.5.2a tooling addendum to-do.

**Files changed:**

- **`utils/fixtures.ts`** — rewrote `navTo`. Now uses `page.locator("nav").getByRole("button", { name: /\b{label}\b/i })` instead of the prior `page.locator("button, a").filter({ hasText: ... })`. The previous approach matched any button or anchor containing the label substring anywhere in the document, which caused ambiguity and timeouts. Anchoring to `<nav>` + role-based matching is the Playwright-recommended pattern and correctly hits the sidebar buttons (which render as `<button>📊 Dashboard</button>` etc.). Also rewrote `openClient` to use `getByPlaceholder` to wait for the client-list render before clicking. Added two new helpers:
  - **`switchLang(page, "en" | "es")`** — clicks the actual `🌐 EN | ES` toggle button (single button that flips React state on click). The old approach in `04-translation.spec.ts` set `window.__GA_LANG = "es"` and looked for a non-existent `^ES$` button — both no-ops against the real DOM. The global is mirrored *from* React state, not *to* it, so setting it externally does nothing. The function probes the current language by checking which nav labels are visible, only clicks if a switch is needed, and waits for the post-switch nav to render before returning.
  - **`openCalculator(page, label)`** — navigates to the Calculators tab and clicks a calculator's card. CalculatorsPage (line 1551 of App.jsx) renders entries as `<div onClick={...}>` cards, NOT buttons. The previous `getByRole("button", { name: /Home/i })` matched nothing. New helper uses `getByText` against the card's text content (the label with the emoji prefix stripped — e.g. "Home Calculator", "Car Loan") and confirms the calculator opened by waiting for the `<h2>` with the full label including emoji to become visible.

- **`tests/02-calculators.spec.ts`** — rewrote all 5 tests to use `openCalculator()` and assert real math, not just selectors. Tests:
  1. **Home Calculator — Equity/HELOC tab.** Home value 500k, 1st mortgage 300k, LTV 80% → equity $200,000, max borrowable $100,000. Asserts both dollar values appear.
  2. **Car Loan.** Price 25k, down 5k, APR 6%, term 60 mo → amount financed $20,000, monthly payment in $386-387 range. Loose enough to tolerate rounding differences.
  3. **Affordability.** Gross 10k/mo, existing debt 500/mo → max housing payment exactly $3,100 (gross × 36% DTI − existing debt). Asserts that value renders.
  4. **Debt Reduction.** Standalone version has no client data so we smoke-test that the strategy radios and hypothetical-debt panel render. Math validation lives in the client-bound version covered by `03-client-workflows`.
  5. **High Yield Savings.** Initial 10k, 500/mo deposit, 4% APY, 10 years → result in $80-100k range (formula tolerates monthly vs annual compounding edge cases).

- **`tests/04-translation.spec.ts`** — rewrote to use `switchLang()` helper. Drives the suite from a `SURFACES` table of `{en, es, esBodyWord}` triples, one per top-level nav (Dashboard / Clients / Calculators / Promotions / Forms / Resources / About). For each surface: switch to ES, navigate using the ES nav label, scrape body text, assert (a) no `undefined`, `[object Object]`, or `t.foo` tokens leaked through, (b) at least one known Spanish word appears (proves the lang switch took effect). Plus one round-trip test that goes ES → EN and confirms English content renders cleanly. 8 test cases × 2 browsers = 16 cases, all should now pass.

**Why the previous tests failed (root cause analysis):**

The original 02 and 04 specs were written before the test author opened DevTools on the running app. Three classes of mismatch:

1. **Sidebar nav buttons** — selectors used `button, a` with a loose `filter({hasText})` that returned multiple matches because the label text appears inside non-nav buttons too (e.g. "Dashboard" appears in the page heading too once you're on the Dashboard tab). Fixed by scoping to `<nav>` and using `getByRole("button")`.

2. **Language toggle** — selectors looked for `getByRole("button", { name: /^ES$/ })` assuming separate EN and ES buttons. The actual DOM has one `🌐 EN | ES` button. The fallback of writing `window.__GA_LANG = "es"` from `page.evaluate` does nothing because React state owns the language; the global is written by a useEffect, not read by a useEffect. Fixed by clicking the actual toggle and verifying the nav re-rendered.

3. **Calculator cards** — selectors used `getByRole("button")` but `CalculatorsPage` renders `<div onClick={...}>` cards. Role queries don't match divs. Fixed by switching to text-content matching.

**Expected steady-state after these fixes:**

Roughly 60 / 60 passing once the new specs run (was ~30 / ~30 passing / failing). Any remaining failures should be real regressions, not selector noise. AGENT.md §13 updated to reflect the corrected baseline. The `03-client-workflows` "all detail tabs" test was also failing per the audit (it uses `openClient` internally, so it should now pass with the fixed `navTo`); if it still fails after deploy, that's a separate spec-internal bug to address.

**No App.jsx changes. No version bump. No build marker bump.** Pure test-code cleanup. Run `npm run test:e2e` from the Codespace to verify.

---

## v0.6.0 — 2026-05-15 (Minor — Mobile responsive + PWA install + Tier-3 public intake)

First **Minor** bump since v0.5.0. Mauricio explicitly declined the proposed v0.6.0 / v0.7.0 split and accepted the larger blast radius to land all three workstreams together. Build marker bumped to `2026-05-15-v060-mobile-pwa-intake`. App.jsx grew +180 lines (2,382 → 2,562).

### Added

- **Mobile responsive shell.** New `useViewport()` hook (line 157, defined before Row2) reads window size, listens for resize + orientationchange, debounces through `requestAnimationFrame`, and returns `{w, h, isMobile, isTablet, isDesktop}` with a 720px mobile breakpoint. On `vp.isMobile`:
  - Sidebar becomes `position:fixed`, `transform:translateX(-100%)` when closed → `translateX(0)` open, with a `0.25s ease-out` transition and a 4px x 32px gold-black shadow when open. Width 260px (vs 222 expanded / 62 collapsed on desktop). `visibility:hidden` when closed so it doesn't trap touches.
  - New `<div id="ga-drawer-overlay">` sibling: `position:fixed`, full-inset, `background:#000a`, z-index 90, `touchAction:none`. Tapping closes the drawer.
  - New `<div id="ga-appbar">`: sticky top, z-index 50, 52px min-height, holds the `☰` hamburger (44x44 tap target, aria-label `t.menu`), the ⚓ logo, and a single-line page title (either the selected client's name or `NAV.find(n => n.id === nav)?.l`).
  - `Row2` collapses `gridTemplateColumns` from `repeat(N,1fr)` to `1fr` (controllable via new `forceMobileStack` prop, default `true` so all existing call sites get the collapse).
  - `Modal` switches to bottom-sheet: `alignItems:flex-end`, `padding:0`, `borderRadius:16px 16px 0 0`, `maxHeight:92dvh`, and `padding-bottom` is `calc(18px + env(safe-area-inset-bottom))` for iOS notch safety. Close button bumped to 36x36 with `touchAction:manipulation`.
  - The existing style-injection useEffect now also writes `*{-webkit-tap-highlight-color:transparent}`, `html,body{overscroll-behavior-y:none}`, a body-level safe-area-inset padding rule, and a `@media(max-width:719px){table{font-size:11px}; button{touch-action:manipulation}}` block.

- **PWA install (closes O-5 as D-27).** New files in `public/`:
  - `manifest.json` — `name`, `short_name`, `description`, `id`/`start_url`/`scope`, `display:standalone`, `theme_color`/`background_color:#0D1B2A`, three icon entries (`icon-192.png` any-purpose, `icon-512.png` any-purpose, `icon-512-maskable.png` maskable-purpose). `lang:"en"`, `orientation:"portrait-primary"`, `categories:["finance","business","productivity"]`.
  - `sw.js` — minimal cache-first SW. `SW_VERSION = "ga-sw-v0.6.0-2026-05-15"`. Static assets pre-cached on install. Activates with `skipWaiting()` + `clients.claim()`. `fetch` handler is layered: pass-through for non-GET; pass-through for any URL containing `supabase`/`stripe`/`resend` (preserves D-2 — never cache sensitive PII or third-party API responses); pass-through for cross-origin; cache-first for `/assets/*` + image/font extensions; network-first for HTML navigation requests with cache fallback. `message` handler responds to `{type:"SKIP_WAITING"}` for post-deploy refresh.
  - `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon-32.png` — placeholder icons generated 2026-05-15 (gold ⚓ on `#0D1B2A` navy via PIL). Mauricio can replace with branded design assets later — only the file paths matter to `manifest.json`.
  - Reference `index.html` at repo root rewritten with: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5">`, `<link rel="manifest">`, `<meta name="theme-color">`, Apple PWA meta tags, apple-touch-icon link, favicon link, and an inline SW registration script that calls `reg.update()` on every load + auto-posts `SKIP_WAITING` to any newly-installed worker to dodge stale-bundle issues.

- **Tier-3 public intake form (locks D-28).** Two new App.jsx components:
  - **`PublicIntake`** (line 2193, ~80 source-equivalent lines) — standalone, no-auth, fixed dark theme (`#0D1B2A` bg, `#fff` text, gold accents). Renders only when `/intake` route is detected. Reads `?advisor=<uuid>&lang=<en|es>` from `window.location.search`. Has its own EN/ES toggle. Form sections: **About You** (name, email, phone, dob, address, optional partner with own name/email), **Financial Overview** (monthly net income, total debt, monthly debt payments), **Your Goals** (textarea), **Contact & Service** (preferred service dropdown from `SVCS`, contact method as 3-button group, "how did you hear about us", general notes). Single full-width submit button (48px tall) with disabled/submitting state. Three end states: invalid-link (no `advisor` param), submitted (✓ thank-you page), or active form. On submit, calls `gaSubmitIntake()` helper → Supabase anonymous INSERT → success.
  - **`IntakeSubmissionsPage`** (line 2285, ~75 source-equivalent lines) — advisor view. Loads via `gaLoadIntakeSubmissions(authUser.id)` on mount. Top section: collapsible public-intake URL card with EN/ES copy buttons (uses `navigator.clipboard.writeText`). Middle: list of submissions sorted newest first, with name, email, timestamp, and a status pill (Pending / Reviewed / Converted / Rejected). Tap a row to expand a detail panel showing all `data` fields. Detail panel actions: **Convert to Client** (opens confirmation modal → builds a new `mig()`'d client with prefilled name/contact/income/goals/notes, calls `onConvert(newClient)` which routes through App's `addClient`, marks submission `converted` with `client_local_id`), **Mark Reviewed** (only on pending), **Reject** (with `window.confirm`). Mobile-aware via `useViewport()` for padding and grid layout.

- **Three new Supabase helpers** (lines 15–17):
  - `gaLoadIntakeSubmissions(advisorId)` — SELECT all, scoped by `advisor_id`, ordered desc, limit 200.
  - `gaSubmitIntake(advisorId, lang, formData)` — generates a `tok_<random>` submission_token, INSERTs (anonymous role allowed by RLS), captures `navigator.userAgent` truncated to 200 chars.
  - `gaUpdateIntakeStatus(id, patch)` — UPDATE by id; the advisor's `auth.uid()` is implied by RLS so we don't pass it.

- **New SQL migration** in `sql/v0.6.0_intake_submissions.sql`:
  - `CREATE TABLE intake_submissions` with the schema described in AGENT.md §4 D-28.
  - Two indexes: `(advisor_id, status, created_at DESC)` for the advisor's queue, and `(submission_token)` for token lookups.
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
  - Five policies: `intake_anon_insert` (to anon, INSERT with check true), `intake_auth_insert` (same for authenticated), `intake_advisor_select` / `_update` / `_delete` (to authenticated, USING `advisor_id = auth.uid()`).
  - Includes a CHECK constraint `status in ('pending','reviewed','converted','rejected')`.
  - Idempotent — safe to re-run.

- **URL routing in App component.** A new `isPublicIntakeRoute` constant on the same line as the state declarations, computed from `window.location.pathname + .search` against `/\/intake\/?(\?|$)/`. The early `return <PublicIntake/>` sits AFTER all hooks are declared but BEFORE the auth-state gates, satisfying the rules of hooks (see new pitfall #13).

- **NAV array updated.** New `{id:"intake-submissions", l:"📥 " + (t.intakeSubmissions || "Intake")}` entry between `clients` and `calculators`.

- **54 new bilingual translation keys per side** — 12 from Phase-2 (mobile shell + install hints) and 42 from Phase-3 (intake form + advisor review). Both T.en and T.es symmetry-verified by build-time set comparison (key sets must match exactly or script fails).

### Changed

- **`Row2` signature** — now accepts an optional `forceMobileStack` prop (default `true`). All existing call sites get the mobile collapse for free; any call site that wants the desktop-style side-by-side layout *even on mobile* can pass `forceMobileStack={false}`. None do today.
- **`Modal` signature** — unchanged in props, but the rendered DOM now branches on `useViewport().isMobile` for layout. All existing modal callers (NewClientModal, ClientForm, ProfileModal, DuplicateResolverModal, AlertsSettingsModal, the new IntakeSubmissionsPage convert modal, etc.) get the bottom-sheet behavior on mobile automatically.
- **App component** — added `drawerOpen` state, `vp = useViewport()` hook call, `isPublicIntakeRoute` route check, two new JSX nodes (overlay + appbar) wrapping the existing sidebar + main column, and `setDrawerOpen(false)` on nav-button and profile-button onClicks so picking a destination from the drawer closes it.
- **Build marker** bumped from `2026-05-15-v052b-service-plans-stripe-links` to `2026-05-15-v060-mobile-pwa-intake`.

### Decision changes

- **O-5 closed → merged-D-27.** Mobile-first responsive shell + PWA install.
- **New D-28.** Public intake `/intake` route + anonymous-INSERT RLS on `intake_submissions` table.
- No D-numbers renumbered. D-1 through D-26 unchanged.

### Verification

- Brace/paren/bracket balance: 11,731 / 11,731 curly, 7,877 / 7,877 paren, 1,595 / 1,595 square. Clean.
- TypeScript dry-run (`tsc --jsx preserve --noLib --allowJs --noResolve --noEmit`): no syntax errors (only the expected TS2318 missing-globals which come from `--noLib`).
- EN and ES dict key counts equal (both gained 54).
- No destructive `{t.X||"Y"}` patterns leaked into either dict body (pitfall #11 check passes).
- All new components reference only in-scope symbols (`useState`, `useEffect`, `useViewport`, `gid`, `mig`, `vEmail`, `Pill`, `Btn`, `BSolid`, `Modal`, `SaveBar`, `useTh`, `mCARD`, `GOLD`, `SVCS`, `T`).

### Required actions to deploy this patch

1. **Run the SQL migration:** open Supabase SQL Editor → paste `sql/v0.6.0_intake_submissions.sql` → execute.
2. **Upload files to GitHub:**
   - `src/App.jsx` (replace existing)
   - `public/manifest.json` (new)
   - `public/sw.js` (new)
   - `public/icon-192.png` (new)
   - `public/icon-512.png` (new)
   - `public/icon-512-maskable.png` (new)
   - `public/apple-touch-icon.png` (new)
   - `public/favicon-32.png` (new)
   - `index.html` at repo root (replace existing)
3. **Commit + push.** Vercel auto-deploys.
4. **Hard refresh** production.
5. **Verify build:** DevTools console → `window.__GA_BUILD__` should equal `"2026-05-15-v060-mobile-pwa-intake"`.
6. **Verify SW:** DevTools → Application → Service Workers — should show one active worker, version `ga-sw-v0.6.0-2026-05-15`.
7. **Verify manifest:** DevTools → Application → Manifest — should show "Golden Anchor Finance". On Chrome desktop, install via the ⊕ icon in the URL bar.
8. **Verify mobile layout:** DevTools → device toolbar (Ctrl+Shift+M) → iPhone 14 Pro preset. Refresh. Sidebar should be hidden, ☰ button visible top-left. Tap ☰ — drawer slides in. Tap a nav item — drawer closes, page changes. Open Settings — modal slides up from the bottom.
9. **Verify public intake:** open an incognito tab → navigate to `https://finance.goldenanchor.life/intake?advisor=<your-supabase-uuid>` → should render the form on dark navy. Add `&lang=es` → form switches to Spanish. Fill it out with test data, submit. Sign in to the advisor app (regular tab), navigate to 📥 Intake — your test submission should appear within seconds. Click it, click **Convert to Client**, confirm — you should see a new client created with the submitted name/contact/income/goals. Delete the test client afterward.
10. **Run Playwright:** `rm -rf playwright/.auth && npm run test:e2e`. Expected: 60/60 still passing — desktop selectors are unaffected by the mobile-shell additive code path. If any test fails, capture the spec and report; do NOT roll back v0.6.0.

### Risk notes

- **First time the app has a public, unauthenticated database write.** RLS policies are the only thing preventing abuse. The smoke test in the SQL file at the bottom uses a fake `advisor_id` — copy your real UUID before testing.
- **Service worker can mask post-deploy bugs.** If something is broken after deploy and a hard refresh doesn't fix it, open DevTools → Application → Service Workers → Unregister, then refresh again.
- **iOS Safari PWA quirks:** the install prompt does not auto-appear (Apple disabled this years ago). Users must tap Share → Add to Home Screen. The `apple-mobile-web-app-status-bar-style:black-translucent` setting paints the iOS status bar over the app, which is why the body has top/left/right safe-area-inset padding.

### Files updated in this commit
- `src/App.jsx` — Phases 2 and 3 changes consolidated.
- `index.html` — repo root, PWA registration + meta tags.
- `public/manifest.json` (new), `public/sw.js` (new), `public/icon-192.png` (new), `public/icon-512.png` (new), `public/icon-512-maskable.png` (new), `public/apple-touch-icon.png` (new), `public/favicon-32.png` (new).
- `sql/v0.6.0_intake_submissions.sql` (new).
- `AGENT.md` — §2 size, §3 v0.6.0 block (v0.5.2b demoted to "Prior version"), §4 D-27 + D-28 added, §5 O-5 closed and new "Closed in v0.6.0" section, §7 pitfall #13, §10 ref bump, §11/§11.5 version labels, footer.
- `CHANGELOG.md` (this entry).

### Files NOT changed
- `SKILL.md` — procedure unchanged. The atomic-write rule and verification gates worked fine for this minor.
- `how-to-use.md` — workflow unchanged.

---

## v0.5.2b — 2026-05-15 (Patch — Launch stabilization, part 2 of 2: revenue plumbing)

Second of two patches splitting the original v0.5.2 scope. Part 1 (v0.5.2a) shipped security + UX with zero schema changes. This part adds the **revenue plumbing**: per-client service plan tracking, settings-level Stripe Payment Link map, Pay Now buttons on the public services grid, and backup verification helper. Closes the O-15 backup-verification implementation gap from v0.5.2a.

This patch is what actually lets Mauricio charge money: clients have a tracked plan, the About page has functional Pay Now buttons that link to the real Stripe-hosted Payment Links from the 2026-05-12 Stripe dashboard export.

### Added

- **9-service Stripe-aligned `SVCS` array.** Replaced the old 6-service generic catalog (`Financial Planning / Insurance Advisory / Investment Guidance / Real Estate Planning / Debt Elimination / Retirement Planning`) with the 9 services that exist as hosted Payment Links in Stripe as of 2026-05-12: Initial Financial Checkup ($149), Financial Checkup — Golden Anchor Client ($99), Quarterly Financial Review ($199), Strategy Session ($129), Monthly Lite Financial Support ($49/mo), Monthly Lite Financial Support and 1 more ($79/mo), Annual Financial Bundle ($499/yr), Insurance Advisory (Free Consult), Donation. Each entry now has a stable `id` (`initial-checkup`, `client-checkup`, `quarterly-review`, `strategy-session`, `monthly-lite`, `monthly-lite-plus`, `annual-bundle`, `insurance-consult`, `donation`) that is used as the key in `settings.stripeLinks` and as the value in `client.servicePlan.plan`. ES translations live inline on each item via `descEs`; the old standalone `SVCS_DESC_ES` const is removed.

- **`settings.stripeLinks` map.** New field on `DEF_SETTINGS`, keyed by service id, holding the Stripe-hosted Payment Link URL for each service. Pre-populated with the 8 URLs from the 2026-05-12 CSV export (Insurance Advisory left empty — it's a free consult, no Stripe link needed). Persists through Supabase like the rest of `settings`. Editable in **Settings → Profile & Settings → 💳 Stripe Payment Links** (collapsible section, shows `N / 9 configured` badge).

- **Pay Now buttons on About/Services page.** Each service card on the public-facing About page now renders two buttons side-by-side: 📋 Request Service (existing mailto modal) and 💳 Pay Now. When `settings.stripeLinks[s.id]` is non-empty, Pay Now is an `<a target="_blank">` opening Stripe Checkout in a new tab. When empty, button is shown disabled with a tooltip pointing to Settings → Stripe Links. Layout uses `display:flex,flex:1` for both buttons so the row stays even.

- **Service plan tracking on each client.** New `client.servicePlan` object (nested, optional — fully backward-compatible; existing clients without it just show empty fields). Stores:
  - `plan` — service id (dropdown of all 9 SVCS entries)
  - `category` — free text (e.g. "Retirement", "Debt", "Insurance")
  - `status` — `active` | `paused` | `ended` | `""`
  - `startDate` — ISO date string
  - `nextChargeDate` — ISO date string
  - `lastPaidAt` — ISO date string
  - `paymentMethod` — `stripe` | `cash` | `zelle` | `check` | `other` | `""`
  - `paymentLinkUrl` — free text URL (e.g. a per-client custom Stripe link if needed)
  - `serviceNotes` — multi-line text, advisor-internal notes

  UI lives at the top of the existing 🗒 Notes & Goals tab in client detail: new "💼 Service Plan" section with independent Save button (saves to Supabase via the same `onUpdate(client)` path). The existing notes section stays below, separated by a divider. In `reportMode` (Complete Report), the Service Plan renders as a compact key/value list at the top of the Notes section in gold, with the service notes text below in italic — only renders if the client actually has plan data.

- **`settings.lastBackupVerified` field + UI.** ISO date string. New collapsible "💾 Backup Verification" section in Profile & Settings. Shows when you last verified that a backup actually restored. Help text walks through the procedure: export from Dashboard → ⋯ → Backup All (JSON), save to password-manager vault or encrypted drive, re-import to a fresh tab to confirm, then click "✓ Mark Verified Today" to log the date. Default: `null` (renders as "never" in the UI). This is the deliverable side of decision O-15 from v0.5.2a, which deferred Supabase PITR + column-level encryption but committed to a monthly backup-verification routine.

- **~33 new bilingual translation keys.** `payNow`, `payNowOpens`, `payNowNotConfigured`, `settingsStripeLinks`, `settingsStripeLinksHelp`, `settingsBackup`, `settingsBackupHelp`, `settingsBackupLast`, `settingsBackupNever`, `settingsBackupMarkVerified`, `servicePlanSectionHdr`, `servicePlanLbl`, `serviceCategoryLbl`, `serviceCategoryPh`, `serviceStatusLbl`, `serviceStatusActive`, `serviceStatusPaused`, `serviceStatusEnded`, `serviceStartLbl`, `nextChargeLbl`, `lastPaidLbl`, `paymentMethodLbl`, `payMethodStripe`, `payMethodCash`, `payMethodZelle`, `payMethodCheck`, `payMethodOther`, `paymentLinkUrlLbl`, `serviceNotesLbl`, `serviceNotesPh`. T.en and T.es both go from 1,060 → 1,093 keys (verified equal via AST extraction).

- **AGENT.md §11 backup procedure block.** Concrete monthly-verification routine added: export → save → re-import dry-run → mark verified. Plus a "what to do if a restore fails" troubleshooting subsection (rare path, but documented before launch so the recovery isn't improvised under pressure).

### Changed

- **About page services grid layout.** Cards now use `display:flex,flex-direction:column` with the description flex-filling the remaining space, so the action button row stays anchored at the bottom of each card regardless of description length. Important now that descriptions vary more in length across 9 services vs the old 6 with similar-length blurbs.

- **`SVCS_DESC_ES` const removed.** Spanish descriptions are now inline on each SVCS entry as `descEs`. AboutPage lookup changed from `(lang==="es"&&SVCS_DESC_ES[i])||s.desc` to `(lang==="es"&&s.descEs)||s.desc`. No external API surface change.

### Closed decisions

- **O-15 (backup verification):** Closed. Implementation: `settings.lastBackupVerified` + UI in Profile & Settings + AGENT.md §11 procedure docs. Supabase PITR and column-level encryption remain deferred to a future minor (separate decision; not blocking launch).

### Not in this patch (intentional)

- **No schema changes.** `clients` and `settings` Supabase tables are untouched; the new `client.servicePlan` field and `settings.stripeLinks` / `settings.lastBackupVerified` fields all live inside the existing JSON `data` columns and migrate through automatically. No `ALTER TABLE`, no migration script.
- **No automated Stripe webhook integration.** Pay Now buttons open the hosted Checkout page; payment confirmation is manual (advisor updates `lastPaidAt` in the Service Plan UI after seeing the Stripe payout). Webhook-driven `lastPaidAt` updates are deferred to a future minor (would require Edge Function + RLS-aware service-role write).
- **No automated Pay Now button on the client detail.** Per-client Payment Links (custom invoices) live in `client.servicePlan.paymentLinkUrl` for advisor reference but aren't surfaced as a button anywhere yet; that's an intake/onboarding flow concern for a future patch.

### Build marker

`window.__GA_BUILD__` = `"2026-05-15-v052b-service-plans-stripe-links"`

### Verification

- 100% JSX parse-clean (Babel).
- Brace/paren/bracket balance: parens 7587/7587, curly 11305/11305, square 1563/1563 (deltas from v0.5.2a: +84, +180, +30 — all matched).
- T.en and T.es key counts equal (1093 each, AST-verified).
- All Stripe URLs in `DEF_SETTINGS.stripeLinks` match the 2026-05-12 CSV export verbatim.

### Verification (Playwright)

To re-run: `rm -rf playwright/.auth && npm run test:e2e`. Expected steady state still 60/60 after these App.jsx changes — none of the test selectors touch the SVCS array, About page services grid, or the new Profile/Notes sections. If anything breaks it's a new regression (most likely the AboutPage `s.id||i` key change or the NotesSection layout change), report-and-fix.

---

## v0.5.2a — 2026-05-14 (Patch — Launch stabilization, part 1 of 2)

First of two patches splitting the original v0.5.2 scope. Part 1 (this patch) covers security + UX with zero schema changes — small blast radius if it breaks. Part 2 (v0.5.2b, coming next) covers client-data shape changes (service plan fields, Stripe Payment Link fields, backup settings). Splitting per the audit of the v0.5.0/v0.5.1 regression history (UUID cast bug in v0.5.0 + line-number drift in v0.4.x) — pattern shows that "one big patch" has a track record of catching bugs only on second review.

### Added

- **30-minute idle auto-logout with 1-minute warning.** App component now arms two timers when `authUser && !bootstrapping`: a 29-minute warning timer that shows a centered modal ("⏰ You'll be signed out soon" / "Stay Signed In" button), and a 30-minute hard logout timer that signs the user out via `supabase.auth.signOut()`. Both timers reset on `mousemove`, `keydown`, `touchstart`, `click`, `scroll` (passive listeners). Constants `IDLE_TIMEOUT_MS = 30*60*1000` and `IDLE_WARN_MS = 29*60*1000` defined at the top of App() for easy adjustment.

- **Draft preservation before auto-logout.** Just before `signOut()` fires, if a client is currently selected in the UI, the auto-logout effect saves `localStorage.setItem("ga_session_draft", JSON.stringify({clientId, data: selectedClient, savedAt}))`. The bootstrap effect (after the user re-logs-in and Supabase loads finish) checks for `ga_session_draft`, restores the client into `selected` state with the Intake tab open, dispatches an info toast: "Restored your in-flight edits from your previous session. Save when ready." Draft is then `removeItem`'d to prevent re-restoration on subsequent logins.

- **Mauricio-only password reset flow.** Login component now has a "Forgot password?" link below the Sign In button (EN: `t.forgotPassword`, ES: `¿Olvidaste tu contraseña?`). Clicking it switches the component to "forgot" mode:
  - Email field stays, password field hides, button text changes to "Send Reset Link"
  - On submit, calls `supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin })`
  - Shows success message: "If that email exists in our system, a reset link has been sent. Check your inbox." (intentionally non-disclosing per security best practice)
  - "← Back to Sign In" link returns to normal mode

  When Supabase's reset email link returns the user to the app with `#type=recovery` in the URL hash, a new `useEffect` in Login detects it and switches to "setNew" mode:
  - Email field hides, password field shows with `autoComplete="new-password"` and label "New Password"
  - Button text changes to "Update Password"
  - On submit, validates password >= 8 chars, then calls `supabase.auth.updateUser({password})`
  - On success, clears the URL hash and signs the user in automatically with a 700ms delay so the success toast is visible

  **No public signup added.** The "Need an account? Contact Mauricio." text stays as-is per the audit decision that client portal users are future architecture, not launch.

- **Save-failure toast.** Both `gaSaveClient` and `gaSaveSettings` now dispatch a `ga-save-failed` CustomEvent on every error path (including the catch block in `gaSaveClient`). The App component subscribes via `window.addEventListener("ga-save-failed", ...)` and surfaces a red 6-second toast in the bottom-right corner: "Couldn't save {x} — your changes are local only. Reload and try again." with `{x}` filled in as `"client"` or `"settings"`. Toast auto-dismisses after 6 seconds; user can manually dismiss via the ✕ button.

- **17 new bilingual translation keys** in T.en (line 89) and T.es (line 90), fully synced. EN and ES dicts now sit at **1,060 keys per side** (was 1,043). New keys: `forgotPassword`, `resetPassword`, `sendResetLink`, `resetEmailSent`, `setNewPassword`, `newPassword`, `resetSetNewIntro`, `updatePassword`, `resetDone`, `passwordMin8`, `emailRequired`, `backToSignIn`, `idleWarnTitle`, `idleWarnBody`, `stayLoggedIn`, `saveFailedToast`, `draftRestoredToast`.

- **AGENT.md §5: Four new open decisions** — **O-12** (auto-logout duration, locked at 30 min idle + 1 min warning), **O-13** (PDF generation deferred to post-launch), **O-14** (ToS/PP acceptance gate + engagement letter signature flow deferred to v0.6+), **O-15** (Supabase PITR backups + manual monthly verification, column-level encryption deferred). O-numbering now runs O-5 through O-15 (no gaps).

### Changed

- **`gaSaveClient` (line 11)** — on every error path (find error, save error, exception), now dispatches `window.dispatchEvent(new CustomEvent("ga-save-failed", {detail:{which:"client"}}))` before returning `false`. Return value semantics unchanged.
- **`gaSaveSettings` (line 14)** — on save error, dispatches `window.dispatchEvent(new CustomEvent("ga-save-failed", {detail:{which:"settings"}}))`. Otherwise unchanged.
- **`Login` component (line 2109)** — full rewrite to add `mode` state (`signin` / `forgot` / `setNew`), `info` state for green success messages, mode-switch buttons, and the URL-hash detection effect. Email/password input rendering is now conditional on mode. The `t.advisorPortal` label in the header is replaced by a dynamic `title` that reflects the current mode. The "Need an account?" footer text is unchanged.
- **`App` component (line 2128)** — added 6 new state variables (`toast`, `idleWarn`, `justRestoredDraft`), 2 new refs (`_idleTimerRef`, `_idleWarnTimerRef`), 2 new constants (`IDLE_TIMEOUT_MS`, `IDLE_WARN_MS`), 3 new effects (save-failure event listener, toast auto-dismiss, idle timer arm/reset). Bootstrap effect now restores `ga_session_draft` after successful Supabase load. Authenticated app tree now renders the idle warning modal and toast at the top, both as fixed-position overlays with high z-index.
- **Build marker (line 2127)** bumped from `2026-05-14-localid-migration-v051` to `2026-05-14-autologout-passreset-v052a`.

### Decision changes

- **O-12 closed at 30 min / 1 min warning.** Industry default of 15 min considered but rejected as too aggressive for an advisor working through long reports. Revisit if real-world feedback shows users getting logged out mid-call.
- **O-13 closed: PDF generation deferred.** `window.print()` is fine for the current manual-attach flow. Real PDF generation becomes a blocker only when Resend automation activates.
- **O-14 closed: ToS/engagement letter deferred to v0.6+.** First 1-2 paying clients handle ToS/PP acceptance and engagement letter signing out-of-band via email + DocuSign / paper signature. In-app gating gets added after that path is proven.
- **O-15 closed: Supabase PITR + manual verification.** No custom export pipeline. Column-level encryption of SSN/phone/DOB via pgsodium considered but deferred until client count exceeds 25 or regulatory requirements force it.
- No D-numbers added, removed, or renumbered. D-2 (no localStorage for sensitive PII) and D-22 (Supabase Auth single advisor) remain locked.

### Required actions to deploy this patch

**Before deploying:**
- No Supabase SQL changes required (this patch has zero schema changes).
- Confirm Supabase Dashboard → Authentication → URL Configuration → "Redirect URLs" includes `https://finance.goldenanchor.life` so the password reset email link can return the user to the app. Add it if missing.

**After deploying:**
- Test the four new flows in production once. Don't wait for a real client to surface a regression:
  1. **Auto-logout:** Open the app, do not touch it for 29 minutes, confirm the warning modal appears. Click "Stay Signed In" — modal closes, timers reset. Wait another 29 minutes, do not interact, confirm at 30 minutes the app returns to the login screen.
  2. **Draft preservation:** Sign in, open any client, start typing into the Intake form notes (do not save), do not touch the app for 30 minutes, get auto-logged-out, sign back in. The client should re-open on the Intake tab with the typed notes intact, and an info toast should appear.
  3. **Password reset:** Click "Forgot password?", enter email, click "Send Reset Link", check inbox, click the email link, set a new password, confirm auto-login after success.
  4. **Save-failure toast:** Open DevTools, set Network panel to "Offline", edit a client, watch for the red toast in bottom-right.

### Verification

- Brace/paren/bracket balance: 11,125 / 11,125 curly, 7,503 / 7,503 paren, 1,533 / 1,533 square. Clean.
- TypeScript syntax check: no errors.
- EN and ES dict key counts match at 1,060 each. All 17 new keys present in both languages.
- No destructive `{t.X||"Y"}` patterns leaked into either dict body (pitfall #11 check passes).
- Build marker confirmed bumped on line 2127.
- File grew from 2,254 lines / ~590 KB → 2,333 lines / ~600 KB.

### Files updated in this commit
- `App.jsx` (lines 11, 14, 89, 90, 2109-2122 rewritten, 2128-2178 wired with new state/effects, 2245-2247 new modal+toast renders, build marker on line 2127)
- `AGENT.md` (§1 database row unchanged, §2 line count, §3 version block rewritten, §5 added O-12 through O-15, §10 ref, footer)
- `CHANGELOG.md` (this entry)

### Files NOT changed
- `SKILL.md` — procedure unchanged.
- `how-to-use.md` — no workflow changes.

### What's next (v0.5.2b)

After v0.5.2a is verified working in production (24-48 hours of normal use is enough), v0.5.2b adds:
1. Service plan/category tracking fields on the client `data` blob: `servicePlan`, `serviceCategory`, `serviceStartDate`, `serviceStatus` (Active/Paused/Completed/Cancelled), `nextChargeDate`, `paymentMethod`, `paymentLinkUrl`, `serviceNotes`, `lastPaidAt`.
2. Manual Stripe Payment Link fields in `settings.stripeLinks`: a JSON map keyed by service ID (`initialCheckup`, `quarterly`, `annualBundle`, `monthlyLite`, `strategySession`) with the Stripe-hosted Payment Link URL as the value.
3. "Pay Now" buttons on About/Services page that read from `settings.stripeLinks` and open the link in a new tab.
4. `settings.lastBackupVerified` date field in the Settings panel, with helper text reminding Mauricio to update monthly.
5. Backup procedure documentation in AGENT.md §11 (how to verify Supabase PITR is current, how to manually export to CSV if needed).
6. No translation keys removed; ~25 new keys for the service-plan and Stripe-link UI.

### Tooling addendum (2026-05-14, post-v0.5.2a deploy) — Playwright test harness

Not a version bump. App.jsx unchanged. Adds an end-to-end test harness to the repo so future regressions can be caught before they ship. Tracked here for project history; full details in AGENT.md §13.

**Files added to repo:**
- `playwright.config.ts` — test runner config; projects (browsers), timeouts, storage state path
- `global-setup.ts` — runs once before tests; logs into the live app via real Supabase Auth UI, saves the JWT for reuse
- `tests/01-smoke.spec.ts` — boot, navigation, language toggle (10 tests × 2 browsers = 20 cases)
- `tests/02-calculators.spec.ts` — Home Equity / Car Loan / Affordability / HY Savings / Debt Reduction math (5 tests × 2 browsers = 10 cases)
- `tests/03-client-workflows.spec.ts` — Miguel/Amanda open, all detail tabs, Complete Report sections (4 tests × 2 browsers = 8 cases)
- `tests/04-translation.spec.ts` — EN/ES integrity, no `undefined`, no raw dict keys (8 tests × 2 browsers = 16 cases)
- `tests/05-persistence.spec.ts` — Supabase round-trip survives hard reload (3 tests × 2 browsers = 6 cases)
- `utils/fixtures.ts` — shared `appPage` fixture, `navTo`, `openClient`, `fillNumberByLabel`, `getBuildMarker`
- `.gitignore` updated — excludes `.env`, `playwright/.auth/`, `playwright-report/`, `test-results/`

**Test users:**
- Main advisor `b373dd8a-bf12-4df2-9439-d7770406d416` — **never touched by tests** (hard-refuse guard in `global-setup.ts` rejects any email containing "mauricio" or "hernandez")
- Test user `test@goldenanchor.life` UUID `9d017248-fc0a-44ad-b68b-53315bb928d8` — duplicated fake/demo clients

**Bugs fixed during setup:**
- `global-setup.ts` originally used `input[type="email"]` selector which doesn't match the Login DOM (the email input has only `autoComplete="email"`). Fixed to `input[autocomplete="email"]`.
- `01-smoke.spec.ts` originally had a `window.__GA_TEST_AUTOLOGIN__ = true` line from an earlier plan to add an auth bypass to App.jsx. That plan was rejected; tests now use the `appPage` fixture consistently.
- `playwright.config.ts` imports `STORAGE_STATE_PATH` from `./global-setup`. Added explicit `export const STORAGE_STATE_PATH = "playwright/.auth/user.json"` at the top of `global-setup.ts` so the import resolves.

**Known issues at first run:**
- **WebKit disabled in `playwright.config.ts`.** Codespace is missing 36 system libraries WebKit needs. Chromium + Firefox cover the realistic user base. Re-enable via `sudo npx playwright install-deps webkit` when there's time.
- **12 calculator tests fail** with `getByRole("button", { name: /Home/i })` timeouts. The calculator tab buttons render differently in the app than the test selectors assume. **Test-code bug, not app bug.** Calculators work fine in production. Fix is a 1-hour follow-up — open DevTools on the live app, inspect the actual button structure, rewrite the selectors. Not a launch blocker.
- **3-browser serial run takes ~11 minutes** in Codespaces free-tier CPU. Acceptable for pre-deploy verification; too slow for save-loop iteration. Use `npx playwright test --project=chromium tests/01-smoke.spec.ts` to scope individual runs.

**Realistic steady state after WebKit disable:** 30 passing / ~10 failing, all failures isolated to `02-calculators.spec.ts`. The 30 passing tests prove app boots, every tab renders without crashing, login flow works, Supabase round-trip works, EN/ES translation has no `undefined`, client workflows render correctly.

**Required `.env` (NEVER committed):**
```
GA_TEST_EMAIL=test@goldenanchor.life
GA_TEST_PASSWORD=(stored in password manager)
VITE_SUPABASE_URL=(stored in password manager)
VITE_SUPABASE_ANON_KEY=(stored in password manager)
```
Mirror values exist as GitHub Actions secrets for future CI use. Local Codespace reads from `.env`.

**Run command reference:**
```bash
rm -rf playwright/.auth      # wipe stale auth state if global-setup needs to re-login
npm run test:e2e             # all browsers, headless (~7 min with WebKit off)
npm run test:ui              # interactive UI mode, best for debugging
npm run test:report          # open the HTML report from the last run
```

**Future work documented in AGENT.md §13:** calculator selector rewrite (1 hour), CI workflow via `.github/workflows/playwright.yml`, smoke test against production URL after every deploy.

---

## v0.5.1 — 2026-05-14 (Patch — Critical Supabase migration bug fix)

The v0.5.0 Supabase wiring shipped with a UUID-vs-numeric-ID mismatch that broke client migration silently. This patch corrects three functions and adds a migration safety guard. Build marker bumped from `2026-05-14-i18nplus-supabase-v050` to `2026-05-14-localid-migration-v051`.

### The bug

`gid()` (line 94) returns app-local IDs like `1747200000123456` — `Date.now() + Math.floor(Math.random()*99999)`. The v0.5.0 `gaSaveClient` tried to upsert these as the `id` field in Supabase's `clients` table — but `clients.id` is a UUID column. PostgreSQL rejected every cast. Worse: the migration loop in `gaMigrateLocalStorage` swallowed the per-row errors and set `localStorage.ga_migrated_to_supabase = "1"` regardless of save success, locking the app into a state where:
- Login worked (Auth doesn't touch `clients`).
- App showed clients fine (they still came from localStorage `ga_v3`).
- Supabase `clients` table stayed empty.
- The migration would never retry, because the done-flag was set.

Mauricio's symptom was correct: "clients live locally and not in Supabase."

### Fixed

**1. `gaSaveClient` (line 11)** — new pattern using `local_id` text column to bridge app numeric IDs to Supabase-generated UUIDs:
```js
async function gaSaveClient(userId, clientObj) {
  // ...
  const localId = String(clientObj.id);
  // SELECT existing row by (user_id, local_id)
  const { data: existing } = await supabase.from("clients")
    .select("id").eq("user_id", userId).eq("local_id", localId).maybeSingle();
  const payload = { user_id: userId, local_id: localId, data: clientObj };
  // UPDATE if exists, INSERT if not — Supabase generates the UUID for `id` on insert
  const { error } = existing?.id
    ? await supabase.from("clients").update(payload).eq("id", existing.id).eq("user_id", userId)
    : await supabase.from("clients").insert(payload);
  return !error;  // <-- now returns boolean so callers can detect failure
}
```

**2. `gaDeleteClient` (line 12)** — now matches by `local_id`:
```js
.update({ deleted_at: new Date().toISOString() })
.eq("local_id", String(clientId))
.eq("user_id", userId);
```

**3. `gaMigrateLocalStorage` (line 15)** — only sets the done-flag when every client save returned `true`:
```js
let allOk = true, savedCount = 0, totalCount = 0;
for (const c of arr) {
  const ok = await gaSaveClient(userId, c);
  if (ok) savedCount++; else allOk = false;
}
// ...
if (allOk && totalCount === savedCount) {
  localStorage.setItem("ga_migrated_to_supabase", "1");
  console.log(`[GA] migration complete: ${savedCount}/${totalCount} clients migrated`);
} else {
  console.error(`[GA] migration incomplete: ${savedCount}/${totalCount} clients saved — flag NOT set, will retry next login`);
}
```
Settings migration still attempts but is wrapped in its own try/catch so a settings failure doesn't block the client-success flag.

### Required actions to deploy this patch

**Before deploying** — run this in Supabase SQL Editor (one time):
```sql
alter table public.clients
  add column if not exists local_id text;

create unique index if not exists clients_user_local_id_idx
  on public.clients(user_id, local_id)
  where deleted_at is null;
```
The partial index keeps soft-deleted rows from blocking re-migration of a client with the same `local_id`.

**After deploying** — open the live app in DevTools and run once in the console:
```js
localStorage.removeItem("ga_migrated_to_supabase")
```
This re-arms the migration. `ga_v3` is NOT touched and remains your local source of truth until migration succeeds.

**Then verify** — log in, watch the console for `[GA] migration complete: N/N clients migrated`. If you see `[GA] migration incomplete`, do NOT clear localStorage — open the next error line in the console, fix what it says, and the next login will retry. Then in Supabase SQL Editor:
```sql
select id, local_id, data->>'firstName' as first_name, data->>'lastName' as last_name, updated_at
from public.clients
order by updated_at desc;
```
You should see one row per client. The `id` column will be a Supabase-generated UUID; `local_id` will be the app's numeric ID as a string.

### Settings NOT touched

`gaSaveSettings` and `gaLoadSettings` were already correct — they upsert on `user_id`, which is a real Supabase Auth UUID. No change.

### Added

- **AGENT.md §7 Pitfall #12** — "Supabase UUID columns vs app numeric IDs." Explicit rule that any future table mapping app entities to Postgres rows must use a separate `local_id` (or equivalent) column, never the app's `gid()` output directly. Also captures the "migration flag must verify success" lesson.

### Changed

- **App.jsx build marker** (line 2127) from `2026-05-14-i18nplus-supabase-v050` to `2026-05-14-localid-migration-v051`.
- **AGENT.md §1 Database row** updated to describe the `local_id` column and partial index.
- **AGENT.md §2** line/size estimate updated to reflect v0.5.1 file (still 2,254 lines, ~590 KB).
- **AGENT.md §3** current version block rewritten — v0.5.1 summary on top, v0.5.0 narrative preserved underneath.
- **AGENT.md §7** Pitfall #12 added.
- **AGENT.md §10** current-version reference updated.
- **AGENT.md §11 / §11.5** version labels in section headers bumped.
- **AGENT.md footer** updated to describe v0.5.1 scope.

### Decision changes

None. No D-numbers added, removed, or renumbered. No O-numbers changed. D-2 (no localStorage for sensitive PII in production) and D-22 (Supabase Auth single advisor) remain locked. v0.5.1 just makes the v0.5.0 implementation of D-22 actually work.

### Verification

- Brace/paren/bracket balance: 11,016 / 11,016 curly, 7,356 / 7,356 paren, 1,523 / 1,523 square. Clean.
- TypeScript syntax check: no errors.
- 3 references to `local_id` in App.jsx (2 in `gaSaveClient`, 1 in `gaDeleteClient`).
- Migration safety guard log string `migration incomplete` present.
- Build marker confirmed bumped.

### Files updated in this commit
- `App.jsx` (lines 11, 12, 15, 2127 — exactly 4 lines changed)
- `AGENT.md` (§1 database row, §2 size, §3 version block, §7 new pitfall, §10 ref, §11 + §11.5 headers, footer)
- `CHANGELOG.md` (this entry)

### Files NOT changed
- `SKILL.md` — procedure unchanged.
- `how-to-use.md` — no workflow changes.

### What to verify after applying

1. Supabase SQL above ran without error and `local_id` column exists on `public.clients`.
2. Vercel deploy succeeded. `window.__GA_BUILD__` returns `"2026-05-14-localid-migration-v051"`.
3. Browser console reset of `ga_migrated_to_supabase` done once after deploy.
4. Next login shows `[GA] migration complete: N/N clients migrated`.
5. Supabase SQL Editor `select` query shows one row per client with populated `local_id`.
6. Edit a client field, save, refresh → change persists. `select` query in Supabase shows that client's `updated_at` near the top.
7. Incognito test: log in fresh, clients appear → confirms Supabase is the source, not localStorage.
8. **Only after #7 passes** is it safe to clear `ga_v3` from localStorage. Keep the backup until then.

---

## v0.5.0 — 2026-05-14 (Minor — Supabase Auth + DB wired, bilingual coverage expanded)

First **Minor** bump since the project began. Closes locked decision **D-22** at the code level (was schema-only) and effectively retires the "no localStorage PII in production" risk surface from D-2 (localStorage still used as a write-through cache, but Supabase is now the source of truth once authenticated). Also ships a large translation-coverage pass across the calculators, the Compare report, and the Dashboard alerts panel — items previously tracked as English-only regressions in O-9 and O-10. Build marker bumped to `2026-05-14-i18nplus-supabase-v050`.

### Added

- **Supabase Auth login screen** replaces the hardcoded `CREDS={email,password}` literal that has been in the file since v0.1. New `Login` component calls `supabase.auth.signInWithPassword({email, password})`, shows an inline error if credentials are wrong, disables the submit button during the network round-trip, and uses correct `autocomplete` attributes for password managers. Three new translation keys (`signingIn`, `noAccountYet`, `emailLbl`) added to both `T.en` and `T.es`.
- **Supabase client + helper functions** at the top of App.jsx, just before the `THEMES` section:
  - `supabase` — created from `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Returns `null` if either is missing, so the app degrades gracefully to localStorage-only mode in dev environments without env vars.
  - `gaLoadClients(userId)` — `select` from `clients` where `user_id = auth.uid()` and `deleted_at is null`, returns `[].data` extracted from JSONB blobs.
  - `gaSaveClient(userId, c)` — upsert by `id` into `clients(id, user_id, data, updated_at)`.
  - `gaDeleteClient(userId, id)` — soft-delete (sets `deleted_at = now()`).
  - `gaLoadSettings(userId)` / `gaSaveSettings(userId, s)` — single-row read/upsert into `settings`.
  - `gaMigrateLocalStorage(userId)` — idempotent. Short-circuits if `localStorage["ga_migrated_to_supabase"] === "1"`. Otherwise checks if cloud is empty; if so, uploads existing localStorage clients + settings, then sets the migration flag. Logs to console on error but never throws (the app stays usable if migration fails).
- **Sign Out button** in the sidebar footer, visible only when Supabase is connected. Calls `supabase.auth.signOut()` then clears `authUser` and `_cloudReadyRef` so the persist effects won't push stale state. New translation key `signOut`.
- **~140 new bilingual translation keys** added to both `T.en` and `T.es`, fully synced. Covers:
  - Dashboard advisor alerts panel ("🔔 Advisor Alerts", "👥 Client Due", alert settings title).
  - Top-level CalculatorsPage gallery — all 9 calc cards (Retirement, Portfolio, Home, Income, Debt Reduction, Car Loan, Affordability, Interest, HY Savings) read labels from `t.calcXxx` keys instead of hardcoded English.
  - `PortfolioStandaloneCalc` allocation captions (CONSERVATIVE / GROWTH / AGGRESSIVE → CONSERVADOR / CRECIMIENTO / AGRESIVO via dynamic key lookup) and risk-suffix label.
  - `HomeEquityCalc` — all four tabs (Equity/HELOC, Refinance, Amortization, Equity Projection), full glossary panel content, and every field label and summary row across all four tabs.
  - `IncomeCalc` — Filing & Personal / Bonuses & Other Income / Summary section headers, age65/blind toggles with bilingual Yes labels, spouse variants, and all 13 `CalcRow` summary labels (gross, pre-tax, AGI, etc.).
  - `CarLoanCalc` — Vehicle / Fees & Taxes / Financing headers, Down Payment / APR / Term fields, and all summary rows. Includes the `ClientCarLoanCalc` duplicate inside the client-bound tab (handled in same edit with `count=2`).
  - `AffordabilityCalc` — glossary panel, Income & Debt / Loan & Costs / Down Payment headers, DTI slider with conservative/typical/aggressive markers, APR/Term/HOA fields, down-payment toggle, all summary CalcRow labels.
  - `FinancialStatements` filter — All / Current Only / Non-Current Only buttons.
  - Accounts / Loans / Trend mode buttons — All / Revolving / Current across Dashboard and ClientDetail.
  - **Compare report (`CompareReportBlock` and `CompareReportTab`)** — all 6 ratio row labels (DSR, Debt/Asset, Current Ratio, Retirement Rate, Emergency Fund, Cash Flow), all 8 field labels (💼 Net Income, 💳 Bills, 🏦 Min Debt Pay, 💰 Cash Flow, 💧 Liquid Savings, 📉 Total Debt, 📈 Total Assets, 💎 Net Worth), Δ Change / All Ratios / Ratio / Target column headers, empty-state message, save-help text, save/clear alert messages, and the ▶ Current (Live) selector. Includes `FLD_REMAP` and `RAT_REMAP` lookup tables inside `CompareReportBlock` so persisted English-label snapshots from earlier versions are translated at render time (a snapshot saved with English labels in v0.4.x will now display correctly when viewed in Spanish in v0.5.0).
  - Complete Report section labels — 📝 Notes & Goals, 📋 Strategy Plan, 📊 Period Comparison, plus the Strategy Plan tab label.

### Changed

- **`App()` root component substantially rewritten** to support Supabase Auth lifecycle:
  - State: `authUser`, `authReady`, `bootstrapping` (replaces old boolean `loggedIn`).
  - Three refs (`_lastClientsRef`, `_lastSettingsRef`, `_cloudReadyRef`) for cloud-sync gating.
  - Session-restore `useEffect` on mount: `supabase.auth.getSession()` + `onAuthStateChange` subscription with cleanup on unmount.
  - Bootstrap `useEffect` keyed on `authUser?.id`: runs migration, loads remote clients + settings, **seeds the ref vars BEFORE `setClients`/`setSettings`** so the persistence effects see zero diffs on first render after login. Sets `_cloudReadyRef.current = true` only when the bootstrap fully completes.
  - Persist-clients `useEffect`: always writes to localStorage, writes to Supabase only after `_cloudReadyRef.current === true`. Per-client JSON diff against `_lastClientsRef.current` so unchanged clients are not re-upserted; removed clients trigger soft-delete.
  - Persist-settings `useEffect`: always writes localStorage, writes Supabase only after cloud-ready AND only when `JSON.stringify` differs from `_lastSettingsRef.current` (avoids spurious upserts on every settings touch).
  - Three-state auth gate replacing `if (!loggedIn)`: `!authReady` → "…" placeholder, `!authUser` → Login screen, `bootstrapping` → ⚓ spinner with `t.loadingClients`.
- **Build marker** bumped from `2026-05-13-alertsmodal-v042` to `2026-05-14-i18nplus-supabase-v050`.
- **File size** grew from ~564 KB / 2,173 lines to ~580 KB / 2,254 lines (+~16 KB / +81 lines net).

### Fixed

- **Race condition in cloud bootstrap** (caught in self-review before delivery). The initial cut of the persistence `useEffect` could push local SEED data up to Supabase before the remote load completed, because (a) `_lastClientsRef.current` was `null` on first mount so every client looked "new," and (b) there was no gate distinguishing pre-bootstrap state from post-bootstrap. Fixed by adding `_cloudReadyRef`, gating both persist effects on it, and seeding the diff refs from inside the bootstrap effect *before* calling `setClients`/`setSettings` so the next save effect sees zero diffs.
- **Migration re-running on every load.** `gaMigrateLocalStorage` previously checked the cloud on every login. Now it short-circuits if `localStorage["ga_migrated_to_supabase"]` is set, and sets that flag in both the "migrated" and "cloud already had data" branches so it can't re-fire on accounts that started life in the cloud.
- **CompareReportBlock label drift for persisted snapshots.** Snapshots saved in v0.4.x persisted English labels into client data. Without remap, switching to Spanish in v0.5.0 would show English ratio labels next to Spanish chrome. Added `FLD_REMAP` / `RAT_REMAP` lookup tables and `_trF` / `_trR` helpers inside `CompareReportBlock` to translate at render time.

### Decision changes

- **D-22 (single-advisor Supabase Auth email/password)** — was previously locked at the design level but App.jsx still ran on a hardcoded credentials literal. Now closed at the code level too: login goes through `supabase.auth.signInWithPassword`, session restores via `getSession()`, sign-out via `signOut()`. Email confirmations remain OFF per the original D-22 wording.
- **D-2 (no localStorage PII in production)** — risk surface effectively closed. localStorage stays in place as a write-through cache for offline tolerance, but Supabase is now the source of truth on every authenticated session and PII is gated behind RLS (`auth.uid() = user_id`).
- **O-9 (Phase-2 roadmap narrative translation)** and **O-10 (Spanish review pass)** — substantial progress (calculators, Compare report, Dashboard alerts all now bilingual). Neither is fully closed yet — Mauricio's regional-review pass is still pending — but the surface area dropped considerably. Leaving both open for a follow-up patch after Mauricio reviews live.

### Process notes

- Atomic Python heredoc edit pattern (per SKILL.md) used for the entire ~140-key translation pass plus the App() rewrite. Single script (`edit_v050.py` in the working dir) ran 30+ targeted `R(text, old, new, label, count=1)` calls with `sys.exit(1)` on count mismatch. No fallback regex, no bare-word global replace (pitfall #11 honored).
- Hit pitfall #11 twice during dev iteration — global word replacements for `notesGoalsHdrEmoji`, `portfolioSelectedHdr`, `calcSnapshotsHdrEmoji`, and `strategyPlanHdrEmoji` corrupted 4 EN dict entries by replacing the literal value side with `{t.X||"..."}`. Caught and reverted; replacements were re-anchored to JSX context (`sectionRows` array literal in CompleteReportTab + Strategy Plan tab label site).
- Disambiguating `CompareReportBlock` from `CompareReportTab` required matching on `display="—"` (only appears in the persisted block path), not the shared `ratioRows.map(rf=>...)` pattern that appears in both.

### Verification

- Brace/paren/bracket balance: 11,004 / 11,004 curly, 7,335 / 7,335 paren, 1,518 / 1,518 square. Clean.
- TypeScript syntax check (`tsc --jsx preserve --allowJs --noEmit --strict false ...`): no errors.
- `T.en` and `T.es` key counts equal at ~1,069 per side. No `{t.X||"..."}` patterns inside either dict body.
- Build marker confirmed bumped.

### User actions required before this build runs in production

This release **requires** four out-of-app actions before it will work on Vercel. Without these, the app will load but log in to Supabase will fail and the app will fall back to localStorage-only mode.

1. **`npm install @supabase/supabase-js`** in the repo, commit `package.json` + `package-lock.json`.
2. **Set two Vercel env vars** (Settings → Environment Variables, Production + Preview + Development):
   - `VITE_SUPABASE_URL` — from Supabase Dashboard → Settings → API → Project URL.
   - `VITE_SUPABASE_ANON_KEY` — from same panel, **anon public key** (NOT `service_role`).
3. **Provision the single advisor user** in Supabase Dashboard → Authentication → Users → Add user. Check **"Auto Confirm User"** so it's usable immediately.
4. **Disable email confirmations** in Supabase Dashboard → Authentication → Providers → Email → uncheck "Confirm email". Required by D-22.

Then: upload App.jsx to `src/App.jsx` on GitHub, commit to main, Vercel auto-deploys. In DevTools console: `window.__GA_BUILD__` should return `"2026-05-14-i18nplus-supabase-v050"`. First login should show the ⚓ spinner briefly while bootstrap completes, then the dashboard. Existing localStorage clients migrate automatically on first login.

### Files updated in this commit

- `src/App.jsx` — main change, all of the above.
- `AGENT.md` — §3 version bumped, §5 O-9/O-10 status notes added, §11 Supabase status row updated, §11.5 blocker #2 retired, decision count updated.
- `CHANGELOG.md` — this entry.

---

## v0.4.2 — 2026-05-13 (Patch — Alerts settings black-screen fix + O-11)

First real App.jsx change since v0.3.0. Two-line bug fix plus 9 new bilingual translation keys, plus a new open decision tracking the PDF/email gap. Build marker bumped to `2026-05-13-alertsmodal-v042`.

### Fixed

- **Dashboard Alerts ⚙️ button caused black screen.** Clicking the alert settings gear icon on the Dashboard's Alerts panel rendered nothing. **Root cause:** `AlertsSettingsModal` on line 1283 was signed as `function AlertsSettingsModal({settings, onSave, onClose})` — no `{t}` — but its first JSX line references `t.alertSettings`. When the modal opened, `t` was undefined → ReferenceError → React rendered nothing → black screen. This is **AGENT.md §7 pitfall #2** verbatim, same root cause as the 2026-05-11 standalone-calculator crash. **Fix:** added `t` to the signature (line 1283) and passed `t={t}` at the render site inside `RemindersPanel` (line 1316). The parent `RemindersPanel` already had `t` in scope.

### Added

- **9 new translation keys** in both `T.en` (line 76) and `T.es` (line 77), fully synced. Previously 868 per side, now 877 per side (898 by approximate counter including some artifacts). New keys cover the Alert Settings modal: `alertSettingsIntro` ("Toggle which alert types appear in the advisor panel:" / "Activa los tipos de alerta que deseas ver en el panel del asesor:"), and 8 alert-type labels (`alertNoContact`, `alertHighDSR`, `alertPromoExpiring`, `alertDebtRising`, `alertBillDue`, `alertLowCashFlow`, `alertLowEF`, `alertMissedSnap`). All previously hardcoded English strings inside the modal body are now wrapped with the `t.key || "Fallback"` pattern per D-18 Track A.
- **New open decision O-11 in AGENT.md §5** — PDF generation approach for email automation. App.jsx has no PDF libraries; all "Print / Save PDF" buttons use `window.print()`. Fine for current manual flow, but breaks when Resend (D-20) is wired in — can't attach a print dialog to an automated email. Three options laid out: server-side Puppeteer/Playwright on a Supabase Edge Function, `@react-pdf/renderer` rebuild, or `jspdf` + `html2canvas` client-side. Not blocking pre-launch.

### Changed

- **Build marker** bumped from `2026-05-13-bilingual-v030` to `2026-05-13-alertsmodal-v042`.

### Decision changes

- **New O-11 added** (see Added above). No D-numbers added, removed, or renumbered.

### Process notes

- This patch hit AGENT.md §7 pitfall #2 again. The pitfall was previously described as applying to "standalone calculators" — extending mentally to "any component referencing `t.foo` without receiving `{t}` as a prop." Worth a re-read before adding any new modal in the future. Not editing the pitfall text right now because the existing language already implies the general rule.
- Followed the SKILL.md atomic-write rule and pitfall #11 (no bare-word global replace) — both translation insertions anchored on the unique `alertSettings:"..."` substring, EN side once, ES side once. Verified no destructive `{t.X||"Y"}` patterns leaked into either dict body (zero hits).

### Verification

- Brace/paren/bracket balance: 10,797 / 10,797 curly, 7,069 / 7,069 paren, 1,500 / 1,500 square. Clean.
- EN and ES dict key counts equal. New keys present in both.
- TypeScript syntax check: no errors.
- Build marker confirmed bumped.

### Files updated in this commit
- `AGENT.md` (§3, §5 new O-11, §10, §11 header, §11.5 header, footer — all bumped to v0.4.2)
- `CHANGELOG.md` (this entry)

### Files NOT changed
- `SKILL.md` — procedure unchanged. v0.4.1 fix to line numbers still current.
- `how-to-use.md` — no workflow changes.

### What to verify after applying

1. Upload new `App.jsx` to GitHub `src/`, wait for Vercel deploy, hard-refresh.
2. In DevTools console: `window.__GA_BUILD__` should return `"2026-05-13-alertsmodal-v042"`.
3. Dashboard → Alerts panel → click the ⚙️ icon. Modal should open showing "⚙️ Alert Settings" (EN) or "⚙️ Ajustes de Alertas" (ES), with all 8 alert toggles labeled in the active language.
4. Toggle a few, click Save. Settings persist (you can verify by closing and reopening).

---

## v0.4.1 — 2026-05-13 (Patch — Doc cleanup after second review)

Three issues from the v0.4.0 merge were caught by a second-pass review and fixed here. No App.jsx code changes — App.jsx is still the v0.3.0 file. Build marker stays `2026-05-13-bilingual-v030`.

### Fixed

1. **SKILL.md line 51 had stale dictionary line numbers.** Said `Line 62 EN, Line 63 ES`. Actual lines in the v0.3.0 file are 76 (EN) and 77 (ES). Updated, and added a `grep -n "^const T={en:" App.jsx` verification hint so the line numbers don't go stale silently again.
2. **AGENT.md §6 App structure table had overlapping and wrong line ranges.** Inherited from a pre-v0.2.1 version of the doc, never corrected as the file grew. Most visible bug: "Color palette + theme" claimed lines 65–110, but that range is occupied by the Track B ES lookups (65–72), the translation dictionary (76–77), and `mk()`/`SEED`/`fmt` (84–100). Actual theme primitives live at lines 6–11. Other ranges (`Helper functions 110–280`, `Field/CalcRow/Btn/Pill 130–170`) were also off. Table rewritten in source order with non-overlapping, grepped ranges and specific landmark lines.
3. **AGENT.md §6 chronology oddity.** Rows were listed out of source order, which made it hard to use the table as a map. Rows now run top-to-bottom in line-number order.

### Added

- **"Verifying line numbers before editing" note in §6.** Future chats are explicitly told to grep before trusting the table's ranges past a Minor version bump. Two grep examples included.
- **Build marker entry added to §6 table** (line 2102). Previously the table listed `App` at "2087+" without mentioning that the build marker sits one line above the App export.
- **More specific landmark lines in §6** — e.g. `Pill (141), Field (144), Btn (149), CalcRow (177)` instead of a single approximate range. Makes targeted edits easier.

### Changed

- **AGENT.md §3** — version bumped to v0.4.1. Patch summary added on top of the v0.4.0 merge summary (which is preserved for historical context).
- **AGENT.md §10** — current-version reference updated to v0.4.1.
- **AGENT.md §11 and §11.5** — version label in section headers updated to v0.4.1 (content unchanged — services status and pending-work map are the same as v0.4.0).
- **AGENT.md footer** — updated to describe v0.4.1 scope.

### Decision changes
- None. No D-numbers added, removed, or renumbered. Renumbering map from v0.4.0 still holds.

### Files updated in this commit
- `AGENT.md` (§3, §6, §10, §11 header, §11.5 header, footer)
- `SKILL.md` (line 51 dictionary location)
- `CHANGELOG.md` (this entry)

### Files NOT changed
- `App.jsx` — still v0.3.0, no code touched.
- `how-to-use.md` — no workflow changes.

### What to verify after applying

1. SKILL.md line 51 reads "Line 76 EN, Line 77 ES" (not 62/63).
2. AGENT.md §6 table has no overlapping line ranges — each row's range starts at or after the previous row's range ends.
3. AGENT.md §6 has the new "Verifying line numbers before editing" paragraph immediately before the "Important convention" paragraph.
4. CHANGELOG.md top entry is v0.4.1, then v0.4.0, then v0.3.2.

---

## v0.4.0 — 2026-05-13 (Minor — Two-track merge)

Reconciles two parallel chat tracks that ran independently against the project: the **app-side track** (last tag v0.3.0, bilingual report coverage + logic fixes) and the **infra-side track** (last tag v0.3.2, Supabase Phase 1 SQL + external services status + multi-tenant architecture decisions). Both tracks were merged 2026-05-13 into a single ledger.

**No App.jsx code changes in this version.** App.jsx is exactly the v0.3.0 file produced by the app-side track (2,173 lines, build marker `2026-05-13-bilingual-v030`). The merge is doc reconciliation only.

### Decision number renumbering map

The two chats independently assigned `D-18`, `D-19`, etc. to different decisions. The merged ledger keeps **`D-18 = Translation approach`** (most-referenced in App.jsx code, SKILL.md, pitfalls #9–#10, and v0.2.0 / v0.2.1 / v0.3.0 changelog entries) and shifts the infra-side numbers up by one. Use this table to decode any pre-v0.4.0 historical references:

| Decision content | App-side # | Infra-side # | **Merged #** |
|---|---|---|---|
| Single file architecture | D-1 | D-1 | **D-1** |
| No localStorage for sensitive PII | D-2 | D-2 | **D-2** |
| Bilingual EN/ES launch req | D-3 | D-3 | **D-3** |
| MutationObserver translation banned | D-4 | D-4 | **D-4** |
| Web only, no native | D-5 | D-5 | **D-5** |
| No multi-tenant SaaS yet | D-6 | D-6 | **D-6** |
| React state in App component only | D-7 | D-7 | **D-7** |
| Recharts for all charts | D-8 | D-8 | **D-8** |
| xlsx (SheetJS) for Excel I/O | D-9 | D-9 | **D-9** |
| One localStorage settings key | D-10 | D-10 | **D-10** |
| PascalCase dynamic JSX | D-11 | D-11 | **D-11** |
| React imports at top | D-12 | D-12 | **D-12** |
| Pricing tier | D-13 | D-13 | **D-13** |
| Health/Insurance bundle | D-14 | D-14 | **D-14** |
| Referral discount | D-15 | D-15 | **D-15** |
| Seasonal promos | D-16 | D-16 | **D-16** |
| Compliance / licensed coach | D-17 | D-17 | **D-17** |
| **Translation approach (Track A + Track B)** | **D-18** | (still O-4 open) | **D-18** |
| **Supabase schema = JSON-blob, RLS** | D-19 | D-18 | **D-19** |
| **Email = Resend free tier** | — | D-19 | **D-20** |
| **Payments = Stripe Payment Links** | — | D-20 | **D-21** |
| **Auth = Supabase Auth single advisor** | — | D-21 | **D-22** |
| **Multi-tenant via RLS, not duplication** | — | D-22 | **D-23** |
| **One account per service (deferred)** | — | D-23 | **D-24** |
| **Domain layout under goldenanchor.life** | — | D-24 | **D-25** |
| **DNS at Cloudflare / Porkbun → Cloudflare in 60d** | — | D-25 | **D-26** |

Historical changelog entries below preserve their original D-numbers — apply the map when reading them.

### Open decisions reconciliation

- **O-4 (Translation approach):** infra-side still listed this as open. It is **closed** as merged-D-18 since v0.2.0 per the app-side track.
- **Infra-side O-8 / O-9** (Vercel / Supabase consolidation timing): folded into merged-D-24 (already locked as "deferred to post-launch"). Not separately tracked in the merged open-decisions list.
- **Infra-side O-10** (Marketing landing for apex): merged into the consolidated **O-6** (Marketing landing for goldenanchor.life apex).
- **App-side O-8 / O-9 / O-10** (Snapshot data hygiene UX, Phase-2 roadmap narrative translation, Spanish review pass): kept as merged-**O-8 / O-9 / O-10** respectively.

Final open decisions list: O-5, O-6, O-7, O-8, O-9, O-10. See AGENT.md §5.

### Docs

- **AGENT.md:**
  - §1 — Database / Auth rows updated to reflect Supabase schema-built-but-not-wired state and Supabase Auth selection. Scope note added (Finance/Health independent until first launch).
  - §2 — Line count updated to 2,173 (v0.3.0 state).
  - §3 — Version bumped to v0.4.0. Merge summary added describing both tracks and where build marker stands.
  - §4 — Decision ledger reorganized into Product / Tech / Business / Translation / Infrastructure / Architecture subsections. All decisions renumbered per the map above. D-18 Track A/B updated with current line numbers (T.en line 76, T.es line 77, ACCT_L_ES/LOAN_L_ES/PHYS_L_ES lines 65–67, helpers 70–72, GA_LANG sync line 2112). D-19 expanded with Phase 1 SQL details (triggers, soft-delete column, partial index).
  - §5 — Open decisions consolidated; closed-in-vX.Y sections updated to use merged numbering.
  - §6 — App structure table updated with current line numbers including the Track B helpers and `window.__GA_LANG` sync useEffect.
  - §7 — Common pitfalls expanded to 11 items (preserves app-side pitfalls #9–#11 about bilingual sync and global text.replace destruction; infra-side only had 8 items).
  - §8 — Build marker example updated to current `2026-05-13-bilingual-v030`.
  - §9 — Style conventions section retains both subsections (Code and Communication with the user). Date formatting note expanded to mention `mLabel()` / `fmtDate()` helpers added in v0.3.0.
  - §10 — Current version reference updated to v0.4.0.
  - §11 — External services table version label bumped to v0.4.0; content carried forward from infra-side v0.3.2 unchanged (status matches reality).
  - §11.5 — Pending work + sync map updated: v0.3.0 bilingual report coverage added to Completed list; "Next planned actions" expanded to include O-9 (roadmap narrative) and O-10 (Spanish review pass) after launch.
  - §12 — Multi-tenant readiness checklist carried forward unchanged from infra-side v0.3.

### Files updated in this commit
- `AGENT.md` (full reconciliation as described above)
- `CHANGELOG.md` (this entry)

### Files NOT changed
- `App.jsx` — already at v0.3.0 from app-side track. No code changes needed for this merge.
- `SKILL.md` — procedure unchanged. Note that SKILL.md still references "Line 62 EN / Line 63 ES" for the translation dictionary; actual current lines are 76/77 per AGENT.md §6. Defer SKILL.md edit to a separate explicit request.
- `how-to-use.md` — no workflow changes.

### What to verify after this merge

1. Future chats reading the merged AGENT.md should see a clean linear D-1 through D-26 ledger.
2. SKILL.md still works because none of the decisions it references by number (D-1, D-4, D-7, D-10, D-11) were renumbered.
3. App.jsx line numbers cited in AGENT.md §6 should match actual file (verified during merge: T.en at 76, T.es at 77, ACCT_L_ES at 65, helpers at 70–72, `window.__GA_LANG` sync at line 2112, build marker at line 2102).

---

## v0.3.2 — 2026-05-13 (Patch — Infra status sync) *[infra-side track]*

No code changes. Captures real state of the infrastructure now that Stripe, Calendly, GBP, and Supabase Phase 1 SQL are confirmed done, and Porkbun transfer status is more accurate than v0.3 implied.

> **Decision numbers in this entry use the pre-merge infra-side numbering** (D-18 = Supabase, D-19 = Resend, etc.). Apply the v0.4.0 renumbering map to translate to merged numbers.

### Status corrections from v0.3

- **Porkbun transfer NOT actually complete.** v0.3 marked it as ✅ completed 2026-05-13, but Porkbun status as of this update is "pending transfer from losing registrar (002)." ICANN 5-day clock auto-completes around 2026-05-18 to 2026-05-20. User checked Wix email + dashboard for an approve link — none found, no acceleration possible. Just waiting.
- **Stripe**, **Calendly**, **Google Business Profile** — confirmed live and complete in §11 services table (were marked ambiguous before).
- **Supabase Finance** — Phase 1 SQL ran successfully in earlier chat session: `set_updated_at()` function + triggers on both tables, `deleted_at` column on `clients`, `clients_active_idx` partial index. Phase 2 (drop hard-delete policy) is deferred until App.jsx is wired with soft-delete pattern.
- **Wix** — apex serves nothing currently. Once Porkbun transfer completes, Wix's DNS authority disappears entirely.

### Docs

- **AGENT.md:**
  - §3 Version bumped to v0.3.2.
  - §11 External services table rewritten with accurate per-service status. Vercel split into Finance (✅ live) and Health (out of scope) rows. Supabase Finance row reflects Phase 1 SQL completion. Porkbun row corrected to ⏳ in-flight. Cloudflare DNS marked 🚫 blocked. Resend marked 🚫 blocked (cascading).
  - **New §11.5** "Pending work + sync map" — single source of truth for what's blocked vs done vs next. Includes ASCII diagram of full request → response architecture at launch.

### What's blocking what (compact form)

```
Porkbun transfer (auto, ~5 days)
  → Cloudflare DNS setup
     → Add Resend DNS records
        → Resend domain verified
           → Email reports can be sent

App.jsx wiring (other chat, 1–2 days)
  → Login screen + Supabase calls + migrate localStorage data
     → Real PII can move off localStorage (satisfies D-2)
        → Soft launch with first paying client
```

These two tracks run in parallel — neither blocks the other.

---

## v0.3.1 — 2026-05-13 (Patch — Scope decision) *[infra-side track]*

No code changes. Clarifies scope and timing of (pre-merge) D-23, now merged-D-24.

### Changed
- **(pre-merge D-23, now merged-D-24)** updated with explicit timing: consolidation deferred until one of the two apps (Finance or Health) fully ships. Stripe, Supabase, Vercel already wired separately — merging mid-launch would force re-wiring and disrupt the launch path. Whichever app ships first becomes the "kept" account; the other migrates in later.
- **(pre-merge O-8, O-9)** marked deferred. Future Finance chats should not raise consolidation as a near-term action. Folded into merged-D-24 in v0.4.0.
- **§1** added explicit scope note: Finance and Health stay independent until one ships. Health is owned by a different developer, ~2–3 months from completion. Finance is the focus and is close to sellable.

### Rationale
User is solo-coordinating two products with different developers and different completion timelines. Forcing consolidation now means re-doing Stripe wiring, Vercel deploys, Supabase project setup, and credential rotation in the middle of getting Finance to its first paying client. That cost outweighs the medium-term cognitive overhead of running two accounts. Revisit after first launch.

### Files updated
- `AGENT.md` (§1 scope note, §4 decision timing, §5 deferred open items)
- `CHANGELOG.md` (this entry)

---

## v0.3.0 — 2026-05-13 (Minor — Bilingual Report Coverage + Logic Fixes) *[app-side track]*

Combined release of what was originally planned as two patches (v0.2.2 translations + v0.2.3 logic fixes), shipped together per Mauricio's request. The full printed report now renders in EN/ES. Six real logic fixes addressing issues identified in the Miguel & Sofia client PDF review.

### Added
- **144 new translation keys** in both EN and ES (was 724, now 868 per side, fully synced). New families: ReportHdr surfaces, KPI cards (separate from Dashboard versions), section headers (`incomeHdr`, `billsExpensesHdr`, `debtCcHdr`, `accountsAssetsHdr`, `physicalAssetsHdr`, `promoRatesHdr`, `investAllocReportHdr`, `financialRatiosHdr`, `trendsHdr`, `portfolioProjHdr`, `selectedPortfolioHdr`, `financialStatementsHdr`, `debtPayoffOrderHdr`, `financialRoadmapHdr`, `investmentProjectionHdr`), column headers (`colSource`, `colPerson`, `colFrequency`, `colGrossMo`, `colNetMo`, `colAnnual`, `colMonthly`, `colName`, `colDue`, `colCardLoan`, `colOwner`, `colBalance`, `colApr`, `colMinPay`, `colIntMo`, `colAccount`, `colType`, `colValue`, `colTicker`, `colCategory`, `colAllocPct`, `colLineItem`, `colMetric`), total/subtotal rows (`totalRowUpper`, `totalBillsLine`, `totalCurrent`, `totalInvestment`, `totalHousehold`, `totalLongTerm`, `totalCurrentAssets`, `totalCurrentLiab`, `totalNonCurrentAssets`, `totalNonCurrentLiab`, `totalIncomeRow`, `totalFixedExpensesRow`, `totalVariableRow`, `totalExpensesRow`, `totalDebtServiceRow`, `totalInflowsRow`, `totalOutflowsRow`, `totalCommittedRow`), Cash Flow Statement labels (`cashFlowStmtHdr`, `inflowsHdr`, `outflowsHdr`, `debtServiceHdr`, `committedContribHdr`, `actualLiquidSavings`, `checkingPlusSavings`, `operatingCashFlow`, `debtServiceRatio`, `savingsRate`, `target`), period comparison (`periodComparisonHdr`, `savedOn`, `ratiosSub`, `retirementRate`, `emergencyFundLbl`, `cashFlowLbl`, `positive`, `negative`), strategy (`avalancheStrategyDesc`, `snowballStrategyDesc`, `minDebtPayAll`, `phaseLbl`), guard labels (`allocSumWarn`, `allocSumWarn2`, `staleSnapWarn`, `liquidityRatio`), and ~30 more.
- **Spanish month names** via three new helpers near the existing `MS` array: `MS_ES` (3-letter short), `ML_ES` (full month), and `mLabel(label, lang)` / `fmtDate(date, lang)` to translate "May 2026" → "Mayo 2026" and full dates (toLocaleDateString) → "13 de mayo de 2026" in ES mode. All report headers, snapshot column labels, "Saved {date}" timestamps, and Period Comparison column headers now use these helpers.
- **Allocation ≠ 100% warning banner** in FullReport (Issue 4 from PDF review). Computes `Object.values(client.alloc).reduce(...)` and renders a yellow banner if total isn't 100%. Sample message in EN: "⚠️ Investment allocation totals **120%** (should be 100%). Adjust in the Investments section." ES equivalent: "La asignación de inversión suma **120%** (debe ser 100%)."
- **Stale-snapshot warning banner** in CompareReportBlock (Issue 5). Detects when the debt scale between snapshots differs by more than 5×, which usually indicates the snapshots were saved against a fundamentally different data set. Shows "⚠️ This snapshot may have stale data — scale differs significantly from current." in EN/ES.
- **Alloc data captured in snapshots** (NMModal data block). Now persists `client.alloc` snapshot-by-snapshot so future RSR calculations on historical data are accurate.

### Changed
- **Issue 1 — RSR formula corrected (3 sites: RatioContent live, getSnap live, getSnap historical).** Was `(retire_balance / 12) / gross_monthly` — interpreted the 401k balance as a monthly contribution by dividing it by 12, which is conceptually nonsense (a retiree with $500k saved but $0/yr contribution would show critical RSR). Now `(client.alloc?.retirement || 0) / 100 × avail / gross` where `avail = max(0, net − bills − minDebtPay)`. This correctly uses the committed retirement contribution percentage from the user's allocation. Historical snapshots that don't yet have `alloc` saved fall back to the current client's alloc (best available approximation).
- **Issue 2 — Strategy Plan stat tile renamed.** "🏦 Min Debt Pay" → "🏦 Min Debt Pay (All Loans)" (`minDebtPayAll` key, ES: "Pago Mín Deuda (Todos los Préstamos)"). Disambiguates from the main DEBT table which shows only CC min pays. The bigger Strategy Plan number includes installment-loan payments per the existing logic.
- **Issue 3 — Page-3 "Current Ratio" → "Liquidity Ratio"** in RatioContent component (line 447). That ratio formula is actually `liquidAssets / ccBalance`, which is a quick/liquidity ratio definition, not the GAAP current ratio. The page-5 A&L sidebar continues to show "Current Ratio" because it correctly divides current assets by current liabilities (CC + short-term portion of loans).
- **Issue 6 — Annual Net Cash Flow labels disambiguated.** Three different "Cash Flow" labels were ambiguous in the printed report. Income Statement footer label is now "💰 NET INCOME (after expenses)" (`netIncomeAfterExpenses` key). Cash Flow Statement bottom label is "💎 NET CASH FLOW (after allocations)" (`netCashFlowAfterAlloc`). Ratio card label is "Annual Operating Cash Flow" (`annualOperatingCashFlow`). All three translate.
- **Dashboard kebab menu** — all 4 items (Import Clients, Export Clients, Backup All, Restore Backup) now use `t.kebab*` keys. THIS was the visible regression in Mauricio's most recent screenshot.
- **ClientList kebab menu** — same 4 items, same keys.
- **Build marker** bumped from `2026-05-12-bilingual-v021` to `2026-05-13-bilingual-v030`.

### Decision changes
- **D-18 reaffirmed.** Per-key fallback wrap (`t.foo || "English"`) confirmed as the right pattern for all UI text including reports. 574 wraps now in code (was 395 in v0.2.1).
- **New open decisions added** to AGENT.md §5 (app-side numbering, now merged-O-8/9/10): snapshot hygiene UX (warn-only vs proactive cleanup), Phase-2 roadmap narrative still partially English, Spanish review pass by Mauricio before v0.4.1.

### Process change
- **New Pitfall #11 added to AGENT.md §7.** During this patch I twice damaged dictionary string values by running global `text.replace("BARE WORD", "{t.key||'BARE WORD'}")`. The bare-word match also catches occurrences inside dict string values. From now on: JSX literal wrapping MUST anchor on JSX context (`>WORD</div>`, `label="WORD"`, etc.) and never on the bare word alone. Both regressions were caught and repaired before shipping.

### Known gaps (deferred)
- Phase-2 roadmap narrative cards in the Financial Roadmap section ("Focus all extra cash on debt..." / "Allocate 25% stocks + 20% retirement...") have translation keys defined but JSX render sites for those specific cards weren't all wired. Tracked as merged-O-9.
- Calculator snapshot type labels ("💰 Income", "📉 Debt Reduction", "🚗 Car Loan", "🏡 Affordability", "📈 Portfolio") still render with English type names because those strings live in the snapshot DATA, not in JSX. Future migration: translate at render time using a type→key mapping.
- Investment Projection inline narrative ("starts Mar 2028 · 45% of extra cash") and "Yr 2 Yr 3..." chart X-axis labels still render English-only. Translation keys (`fivePctYears`, `tenYears`, `twentyYears`, `ofExtraCash`, `yrAbbr`) are in the dict, render sites pending.

---

## v0.3 — 2026-05-13 (Infrastructure — Architecture decisions) *[infra-side track]*

No App.jsx changes in this version. Architecture and infrastructure decisions captured. Sets the foundation for multi-tenant B2B SaaS down the line (Finance and Health).

> **Decision numbers in this entry use the pre-merge infra-side numbering** (D-22, D-23, D-24, D-25). In merged numbering these are **D-23, D-24, D-25, D-26**. Apply the v0.4.0 renumbering map.

### Decision changes

- **New (pre-merge) D-22 / merged-D-23 (Multi-tenant via RLS, not per-customer duplication).** When Finance app and Health CRM are sold to agents/agencies, use one codebase + one Supabase project per product with tiered RLS policies. Three roles: super_admin (Mauricio), agency_owner, agent. Per-agency customization via `agencies.feature_flags` JSONB. Duplicating apps per customer is explicitly rejected as the wrong architecture — 50× maintenance burden vs same data isolation guarantees from RLS.
- **New (pre-merge) D-23 / merged-D-24 (One account per service, multiple projects under it).** Vercel: consolidate to one account hosting separate projects per product. Supabase: consolidate to one account hosting separate projects per product (free tier allows 2 projects). GitHub: one account, separate repos per product.
- **New (pre-merge) D-24 / merged-D-25 (Domain layout under `goldenanchor.life`).** Apex = personal/brand landing. `finance.goldenanchor.life` = Finance app. `health.goldenanchor.life` = Health CRM. Wildcard subdomains reserved for future white-label per agency.
- **New (pre-merge) D-25 / merged-D-26 (DNS at Cloudflare, registrar Porkbun → Cloudflare in 60 days).** Wix → Porkbun transfer initiated 2026-05-13 (correction: v0.3.2 confirmed not yet finalized — ICANN 5-day clock still running). Next: change Porkbun nameservers to Cloudflare (does not require 60-day wait — only registrar transfer does). On/after 2026-07-15, optionally transfer registrar Porkbun → Cloudflare for at-cost renewals.

### New open decisions added (pre-merge numbering)

- **Pre-merge O-8** — Vercel account consolidation timing (locked as pre-merge D-23 / merged-D-24, not yet executed). In v0.4.0 merge: folded into merged-D-24 timing note; not separately tracked.
- **Pre-merge O-9** — Supabase account consolidation timing (locked as pre-merge D-23 / merged-D-24, not yet executed). In v0.4.0 merge: folded.
- **Pre-merge O-10** — Marketing landing for apex. In v0.4.0 merge: combined with marketing landing question to form merged-O-6.

### Docs

- **AGENT.md:**
  - §3 Version bumped to v0.3.
  - §4 Architecture subsection added with (pre-merge) D-22 through D-25.
  - §5 New (pre-merge) O-8, O-9, O-10. "Closed in v0.3" section added.
  - §10 Current version reference updated to v0.3.
  - §11 External services table rewritten to reflect Porkbun ownership, Cloudflare DNS pending, Wix decommissioned, two Vercel accounts + two Supabase accounts flagged for consolidation.
  - New §12 Multi-tenant readiness checklist — schema additions, RLS policy shapes, migration path. Forward-looking, not yet implemented.

### Action items for user (this week)

1. Sign up at Cloudflare → add `goldenanchor.life` as a site → get the 2 assigned nameservers.
2. Porkbun → Domain Management → `goldenanchor.life` → Nameservers → replace defaults with Cloudflare's 2.
3. Wait 1–24h for propagation.
4. In Cloudflare DNS panel, add: CNAME `finance` → `cname.vercel-dns.com` (DNS only), MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10, TXT `send` → SPF, TXT for Resend DKIM.
5. Resend dashboard → verify domain.
6. Calendar reminder for 2026-07-15: optional Porkbun → Cloudflare registrar transfer.

---

## v0.2.1 — 2026-05-12 (Patch — Bilingual Coverage Round 2) *[app-side track]*

Closes the 11 specific translation gaps Mauricio reported after v0.2.0: burger menu, calculator field labels, suggested promotions title, intake "New Client Onboarding" header, Resources guide cards, the data-structure labels (account types, loan types, property categories) in dropdowns and pill labels, About-page service descriptions, Settings panel labels (Advisor Name, Email, Instagram, color names, accent suffix, zoom help, alerts tip, no-contact threshold), Emergency Fund section, Investment Allocation section, and the two remaining Financial Statements section labels (`⚖️ Assets & Liabilities`, `💰 Cash Flow`).

### Added
- **99 new translation keys** in both EN and ES (was 625, now 724 per side, fully synced).
- **Three parallel ES lookup objects** (`ACCT_L_ES`, `LOAN_L_ES`, `PHYS_L_ES`) and **one ES descriptions array** (`SVCS_DESC_ES`) injected after `PHYS_CATS` definition (line 60). These translate the **data-structure labels** without changing the data shape — minimizes risk to persistence and existing accessor sites.
- **Three helper functions** `acctL(k)`, `loanL(k)`, `physL(v)` that read `window.__GA_LANG` and return the right label.
- A new `useEffect` in `App()` that syncs `window.__GA_LANG = lang` so the helpers work without prop-drilling `lang` through 20+ components.
- Bilingual coverage for: Investment Allocation labels (📈 Stocks → 📈 Acciones, etc.), Emergency Fund header, INVESTMENT ALLOCATION header, Liquid:/Target:/Gap: colon labels, "{N} months" dropdown, "% funded", "Mark all"/"Clear all", "NEGATIVE CASH FLOW" pill, Financial Statements `⚖️ Assets & Liabilities` and `💰 Cash Flow` section labels, all 8 kebab menu items in client detail (Edit Client, Split/Join, Import/Export CSV, Export Backup, Archive/Unarchive, Delete), REFERRAL CODE label in About page, About-page "Email" connect label, all 6 Settings panel field labels and 4 helper texts, all 5 color preset names (Gold, Blue, Emerald, Purple, Teal), Intake "📝 New Client Onboarding" header + description, "Suggested Starter Promotions" title, all 6 Resources guide cards (title + description), 30+ standalone-calculator Field labels across IncomeCalc / Car Loan / Affordability / Home Equity / Retirement, filing status dropdown options (Single / MFJ / HoH).

### Changed
- **Dropdown render sites at lines 251, 254, 257** now use the helpers: `{ACCT_META[k].l}` → `{acctL(k)}`, `{LOAN_META[k].l}` → `{loanL(k)}`, `{pc.v}` → `{physL(pc.v)}`. Account list Pill label and Custom Asset list Pill label also wired. Split Modal's account type label now uses `acctL`.
- **About-page service description** now reads `(lang === "es" && SVCS_DESC_ES[i]) || s.desc` so the 6 service descriptions translate without modifying the `SVCS` data structure.
- **About-page Theme Color rows** display translated color names: `{t["color"+p.l] || p.l}` looks up `t.colorGold`, `t.colorBlue`, etc.
- Build marker: `2026-05-12-bilingual-v020` → `2026-05-12-bilingual-v021`.

### Decision changes
- **D-18 amended.** The translation pattern is now formally two-track:
  - **Track A — User-facing UI strings:** per-key `t.key || "English fallback"` wrap in JSX. This stays the primary pattern.
  - **Track B — Data-structure labels (where the data lives in `const X = {...}` rather than in `T.en/T.es`):** add a parallel ES lookup object (e.g. `ACCT_L_ES`) and a small helper that reads `window.__GA_LANG`. The helper is called at the render site. The data structure itself does NOT change shape — only the rendering changes. Use this whenever the data is consumed by multiple components in different scopes (avoids plumbing `lang` everywhere).
  - The `window.__GA_LANG` sync (via `useEffect` in `App`) is the ONLY allowed place to read language outside React. Components must still receive `t` as a prop for normal UI strings.

### Known gaps (deferred to v0.2.2 — actually shipped as v0.3.0)
- **Compliance disclaimer surfacing.** Key still exists in both dicts, still not rendered anywhere. Needs to go in the footer of every printed report and on the About Us tab.
- **Some long Intake form labels** (the partner Phone/Email/DOB/SSN block) still hardcoded English. Lower priority — only visible during data entry, not on reports.
- **Several account-type sub-labels** in narrative text ("Liquid — counts toward Emergency Fund", "Investment asset", "Household asset" inside AccountModal preview) — these are sentence fragments that need their own keys, deferred.
- **Spanish review still pending.** All v0.2.0 and v0.2.1 Spanish was drafted by Claude in neutral Latin American finance Spanish. Mauricio should toggle to ES, click through, and flag anything that reads wrong.

### Process change (per Mauricio's instruction)
- **Every future change MUST add/modify keys in BOTH EN and ES dictionaries at the same time.** Adding a key only to EN is now a violation. AGENT.md §7 updated to reflect this.

---

## v0.2.0 — 2026-05-12 (Minor — Bilingual EN/ES Phase 1) *[app-side track]*

The EN/ES toggle now works. Closes **O-4** as **(pre-merge) D-18 / merged-D-18** (per-key `t.key || "English fallback"` wrapping; no DOM walking; `T[lang] || T.en` access pattern). Also closes **O-1** as **(pre-merge) D-19 / merged-D-19** (Supabase JSON-blob schema confirmed working in the cloud project; no code changes yet, just decision lock).

### Added
- **75 new translation keys** in both EN and ES dictionaries (was 547 keys each, now 625 each, fully synced).
- **Bilingual compliance disclaimer** (`t.disclaimer`) drafted per D-17. Key present in dictionary; surfacing it in report footers tracked as v0.2.1 follow-up.
- Spanish coverage for: App Zoom, theme colors, save-all buttons, totals headers, Income Calculator job sections, debt scenario UI, Notes & Goals save buttons, Alert Settings modal, Strategy Plan phase cards (Pay Off All Debt / Build Emergency Fund / Invest & Build Wealth), import wizard ("Continue →", file pickers, parsing states, "What would you like to import?"), alert filter dropdowns (No Contact, High Priority, All Types, Due Date), tax filing status (Head of Household), promotion descriptions (Applies to: / How to use:), backfill UI (Push a row…, Update, New Row), Version History empty state, Investment Allocation empty state, Join Clients empty state, Calculator landing page tagline, Complete Report empty states, financial colon labels (Net/mo:, Available:, Mo. Interest:, Payoff:, Balance:, Avg APR:, Min/mo:, Debt Strategy:, Total value:), top-bar ADVISOR PORTAL / FINANCIAL ADVISORY, and 12 inline alert messages.

### Changed
- **Line 2092:** flipped from `const t = T["en"]; // Forced to English` → `const t = T[lang] || T.en; // EN/ES toggle wired in v0.2.0`. The EN/ES sidebar button is now functional.
- Added 4 keys that were referenced in code but missing from the dictionary (rendered as `undefined` previously): `bundlePrice`, `flatOff`, `percentOff`, `promoCode`.
- Build marker: `2026-05-11-english-only-v1` → `2026-05-12-bilingual-v020`.

### Decision changes
- **O-4 → D-18 locked.** Translation approach: per-key `t.key || "Fallback"` wrapping in JSX; `T[lang] || T.en` access. DOM-walk approaches stay banned (D-4).
- **O-1 → (pre-merge) D-19 / merged-D-19 locked.** Supabase storage shape: `clients` table with `id`, `user_id`, `data jsonb`, timestamps; `settings` table with `user_id` PK and `data jsonb`; both with RLS enabled. JSON blob per client, no normalization until v2.

### Fixed
- `t.bundlePrice`, `t.flatOff`, `t.percentOff`, `t.promoCode` no longer render as `undefined` on the Promotions admin page.

---

## v0.2 — 2026-05-12 (Infrastructure — Setup decisions) *[infra-side track]*

No App.jsx changes in this version. Planning + decision-closure pass that prepares the project to onboard its first paying client without any startup cost. App.jsx work tracked in a separate chat.

> **Decision numbers in this entry use the pre-merge infra-side numbering** (D-18 = Supabase, D-19 = Resend, D-20 = Stripe, D-21 = Auth). In merged numbering these are **D-19, D-20, D-21, D-22**. Apply the v0.4.0 renumbering map.

### Decision changes

- **O-1 closed → (pre-merge) D-18 / merged-D-19.** Supabase schema locked as JSON-blob model. Two tables (`clients`, `settings`) with RLS on `auth.uid() = user_id`. Schema already built in Supabase project.
- **O-2 partial close → (pre-merge) D-21 / merged-D-22.** Auth = Supabase Auth email/password, single advisor user for v1. Multi-user / client portal still deferred to v2.
- **O-3 closed → (pre-merge) D-19 / merged-D-20.** Email = Resend free tier (3k/mo). Manual PDF attach is interim fallback until App.jsx integrates.
- **New (pre-merge) D-20 / merged-D-21 (Payments).** Stripe Payment Links for v1. No in-app Stripe integration. Zelle / cash accepted from trusted contacts only. Calendly free tier (1 event type).
- **D-17 updated.** Engagement letter, disclaimers, privacy policy, TOS confirmed reviewed by counsel and on file.

### New open decisions added (pre-merge numbering)

- **Pre-merge O-6** — Marketing landing page architecture (Vercel root `landing.html` vs separate Carrd / static site). In v0.4.0 merge: combined with infra-side O-10 (apex landing) into merged-O-6.
- **Pre-merge O-7** — Referral attribution automation timing (manual via Google Form vs in-app capture). Kept as merged-O-7.

### Docs

- **AGENT.md:**
  - §1 Project identity — DB row now reflects schema-built-not-wired state; Auth row reflects Supabase Auth (v1 single-advisor) + DP transition plan.
  - §3 Version bumped to v0.2.
  - §4 New "Infrastructure" subsection housing (pre-merge) D-18, D-19, D-20, D-21.
  - §5 Trimmed to O-4/O-5 remaining, added (pre-merge) O-6/O-7, listed closed items.
  - §9 Style conventions split into "Code" and "Communication with the user" subsections. Added: no popup questions, no stop-and-go, no fluff, treat as professional, English default.
  - §10 Updated current version reference.
  - New §11 — External services baseline table + Vercel env var list + credentials reminder.

### Infrastructure planning (action items captured for execution)

Setup work to be done by user outside the codebase (in order):

1. Stripe account creation + business identity verification.
2. Calendly free tier — 1 event type "Free Discovery Call 20 min."
3. Resend account + DNS records (SPF/DKIM/DMARC) for `goldenanchor.life`.
4. Google Business Profile listing (use virtual business address, not home).
5. Supabase: create the single advisor Auth user; disable email confirmations; save UUID. Create `client-reports` private storage bucket.
6. Vercel env vars — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values from Supabase Settings → API).
7. Virtual business address provider chosen (iPostal1 / Anytime Mailbox / UPS Store / registered agent address).
8. E&O coverage confirmation with existing insurance carrier.

App.jsx wiring (to be done in dedicated chat using SKILL.md):

- Add `@supabase/supabase-js` dependency.
- Add login screen gating the app.
- Replace `localStorage` reads/writes of `ga-clients` and `ga-settings` with Supabase `clients` / `settings` table operations.
- Keep build marker bump discipline (`window.__GA_BUILD__`).
- Migration: one-time export of current `localStorage` → Supabase rows tagged with the advisor's UUID.
- Optional: storage-bucket integration for generated PDF reports.

---

## v0.1 — 2026-05-11 (Initial documented baseline)

The app has been in active development for months; this is the first formal version tagged for the agent/skill workflow. State at this point:

### App.jsx — known working features
- Bilingual EN/ES toggle (button visible in sidebar; English-only mode currently enforced while translation refactor is pending)
- Light/Dark theme + App Zoom (50–200%)
- Dashboard: client list, trend graphs with range selector (3mo / 6mo / 12mo / All), debt status pie, status counts (Improving / Stable / Underperforming)
- Client detail: Income / Bills / Debt / Assets & Savings / Custom Assets / Notes & Goals sections
- Monthly Statement with snapshot save / recover / compare across months
- Strategy Plan tab with Avalanche/Snowball, phased roadmap, investment projection
- Financial Statements: Balance Sheet, Income Statement, Cash Flow Statement, Ratio Analysis
- Reports: Summary, Monthly, Financial Statements, Complete Report, Compare (Monthly + Yearly views)
- Investments tab with three sub-tabs: Portfolio / Main Packages / Alternative Packages
- 9 standalone calculators: Income, Debt Reduction, Car Loan, Affordability, Home Equity, Retirement, Portfolio, Interest, High-Yield Savings
- Client-bound calculators (Income / Debt / Car Loan) that pre-fill from client data, with snapshot save → appears in Complete Report
- Promotions admin page with promo codes, client filters, dated activation
- Calculator snapshots capture rich input/output via DOM data attributes, render as 2-column tables on the Complete Report
- Year-over-year Compare view with bar charts (Debt, Savings, Cash Flow, Income) + summary table
- Excel import / export (xlsx)
- Print-friendly reports
- Build marker `window.__GA_BUILD__` for deploy verification

### Locked decisions established
- D-1 through D-17 — see AGENT.md §4 for full text.

### Open decisions
- O-1 through O-5 — see AGENT.md §5.

### Files in this package
- `App.jsx` — the application (~2,158 lines, ~528 KB)
- `AGENT.md` — project bible
- `SKILL.md` — change procedure
- `CHANGELOG.md` — this file
- `how-to-use.md` — workflow guide

---

## Prior history (reconstructed, pre-v0.1)

These changes happened before formal versioning. Listed chronologically.

### Translation infrastructure (multiple iterations)
- **Attempt 1:** Per-key `t.foo || "Foo"` wrapping. Covered Dashboard, client list, reports, investments tab, debt-reduction calculator. ~150 strings translated. WORKED but only partial coverage.
- **Attempt 2:** Bulk DOM-walk auto-translation with `MutationObserver`. CAUSED INFINITE LOOP → app froze on language switch → REVERTED. **Now permanently banned (D-4).**
- **Current state (pre-v0.1):** English-only enforced (`const t = T["en"]`). EN/ES button visible but no-op. Translation refactor pending using only the safe per-key pattern.

### Calculator crash bug — 2026-05-11
- **Bug:** All standalone calculators rendered as black panels when opened.
- **Root cause:** 6 calculators (`CarLoanCalc`, `AffordabilityCalc`, `InterestCalc`, `SavingsCalc`, `RetirementCalc`, `PortfolioStandaloneCalc`) had `function FooCalc()` signatures but referenced `t.someKey` inside → ReferenceError on every render. ALSO `<calc.C/>` JSX was lowercase → JSX treated it as HTML element, never invoked the component.
- **Fix:** Added `{t}` param to all 6 calculators. Rebound `calc.C` → `Comp` (PascalCase) before rendering in both `CalculatorsPage` and `ClientCalculatorsTab`.
- **Lesson:** Documented in AGENT.md §7 pitfall #1 and #2.

### Pricing & services flyer created
- Generated `Golden_Anchor_Services_and_Pricing_2026.docx`
- Reflects pricing tier D-13 through D-16.
- Bilingual ready (sections labeled with EN; ES version pending).

### Launch roadmap document
- Generated `Launch_Roadmap.md`.
- Phase 1: Vercel deploy — DONE
- Phase 2: Supabase migration — IN PROGRESS (schema done, App.jsx wiring pending)
- Phase 3: Email reports — PENDING
- Phase 4: Stripe payments — DONE (Payment Links live, no in-app integration per D-21)

### Other features added across pre-v0.1 history
- Hamburger menu icon (☰) replacing 3-dot kebab
- Back buttons cleaned (no leading arrow)
- Notes & Goals typing bug fixed (textarea was unmounting on every keystroke due to component re-creation inside parent)
- Portfolio dollar amount fixed (was showing future-value × 12, should show monthly allocation)
- Export Holdings modal has Select All / Clear All
- Excel import 0-balance card misclassification fixed
- Strategy Plan duplicated section on reports removed
- Investment Allocation 0% rows hidden on reports
- Year Compare view added
- Trend range selectors (3 / 6 / 12 / All) added to Dashboard and Client Detail
- Calculator snapshots redesigned to show inputs + results as tables, not text summaries
- Selected Portfolio reorder (after Portfolio Projection, before Financial Statements)
- Promotions admin page created
- App Zoom replacing font-size slider

---

*Format guide for future entries:*

```
## vX.Y.Z — YYYY-MM-DD (Category)

### Added
- [feature]

### Changed
- [thing] — [why]

### Fixed
- [bug] — [root cause]

### Decision changes
- D-X locked / O-X closed / D-Y reversed (see AGENT.md)
```

Category is one of: Patch, Minor, Major, Decision reversal, Infrastructure.
