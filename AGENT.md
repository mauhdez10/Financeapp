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

The actual app is a **single React file**: `src/App.jsx` (~2,562 lines, ~627 KB as of v0.6.0 / 2026-05-15). PWA static assets (`public/manifest.json`, `public/sw.js`, `public/icon-*.png`, `public/apple-touch-icon.png`, `public/favicon-32.png`) sit alongside in the repo root + `public/`. The reference `index.html` was updated to register the service worker and link the manifest.

Everything else is supporting infrastructure (build config, deploy config, this doc, the changelog). When the user asks "update the app," they mean App.jsx.

When the user uploads App.jsx in a new chat, **read it before proposing changes**. Do not guess at its current state from memory.

---

## 3. Current version

**v0.12.2** — established 2026-05-19 (Patch — Spanish bleed-through fix; closes O-9 and O-10).

**What shipped:** Chat 8 of the parallel-chat workplan — a full Spanish review pass. A static audit of `App.jsx` against `src/translations.js` found **134 unique hardcoded English strings across 203 code sites** that never routed through the `t.key` lookup, so they stayed English when the UI was toggled to Spanish. `Field` renders `{label}` raw, so every `<Field label="literal">` was a real leak. Concentrated in: the calculator field labels (paycheck / debt / car — AGENT.md's "calculators are bilingual" claim from v0.5.0 was optimistic; the dense field labels were never wired), the client-data modals (income / bill / card / account / property editors), the Backfill / Import flow modal titles, the ClientList filter/sort chips, the Market Investments modal category options, and the nav tooltips.

**The fix:** all 203 sites now go through `t.key || "English fallback"`. **48 reused existing dictionary keys**; **83 new keys minted** (× EN/ES), using the dictionary's existing neutral Latin-American Spanish register (e.g. `Down`→"Enganche", `Taxable`→"Gravable", `Checking`→"Cuenta Corriente"). The two O-9 Financial Roadmap `PhaseCard`/`Phase` `sub` template literals are now fully bilingual. `PrintBtn`'s default parameter was reverted to a plain-string default (a function-parameter default cannot be a JSX expression or reference `t`) and all three `<PrintBtn/>` call sites now pass a translated label.

**Dictionary:** `src/translations.js` 1,230 → 1,313 keys per side (+83), EN/ES symmetry verified — zero orphans either direction. App.jsx 3,045 → 3,046 lines. **Build marker** `2026-05-19-v0122-spanish-bleedthrough`. No SQL migration. No new locked decisions; **O-9 and O-10 both closed** (see §5). No new pitfalls. D-1, D-7, D-18, D-27, D-30, D-31, D-34 preserved.

**O-10 production smoke test (Resend):** validated in production — two real intake invites (one EN, one ES) sent to Mauricio's inbox; the full open → prefill → submit → status-flip → submission-appears loop passed end-to-end on Gmail web and mobile.

**Out-of-app actions required:** none beyond the standard deploy. **Replace** `src/App.jsx`, `src/translations.js`, `AGENT.md`, `WORKPLAN.md`; append the `CHANGELOG.md` entry. No SQL, no env vars, no `api/*` changes, no `package.json` changes. Commit + push; Vercel auto-deploys. Hard-refresh; verify `window.__GA_BUILD__ === "2026-05-19-v0122-spanish-bleedthrough"`, then toggle to Spanish and confirm the calculators, client-data modals, and Backfill flow read fully in Spanish.

---

### Prior: v0.12.1 — 2026-05-19 (Patch — Vercel Chromium runtime fix for v0.12.0)

**What shipped:** v0.12.0 (Email Complete Report as PDF) deployed successfully but every send failed at runtime with `Failed to launch the browser process! /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file`. The bundled libs from `@sparticuz/chromium@131` didn't survive Vercel's serverless bundler tracing — possibly compounded by an accidental `npm install puppeteer` (full Puppeteer, ~280MB) that ran post-deploy and bloated the function bundle past the practical tracing limit.

**Fix (v0.12.1 patch):**

1. **Switched `@sparticuz/chromium` → `@sparticuz/chromium-min`.** The `-min` variant ships only the JS glue (~5MB); the Chromium tarball (libnss3 + everything else) is fetched at runtime from the official GitHub release URL and cached in `/tmp` between warm invocations. This sidesteps Vercel's bundle tracing entirely. First cold start downloads ~50MB once; warm starts use the cache. Net effect: tiny deployed bundle, working `libnss3.so`, no Vercel size-limit risk.
2. **Bumped versions to match the current Sparticuz/puppeteer-core compatibility matrix.** `@sparticuz/chromium-min@^140.0.0` paired with `puppeteer-core@^24.10.0`. `chromium-min` follows Chromium's release cycle (not semver) so this is a deliberate major-style bump, not a routine upgrade. Pinned URL `https://github.com/Sparticuz/chromium/releases/download/v140.0.0/chromium-v140.0.0-pack.x64.tar` — if the npm major bumps in future, this URL bumps with it.
3. **Modernized the `puppeteer.launch` call.** `headless: chromium.headless` → `headless: "shell"` (puppeteer-core 24's expected literal); added `--no-sandbox`, `--disable-setuid-sandbox`, `--hide-scrollbars`, `--disable-web-security` to the args spread — defensive belt for the Lambda runtime.
4. **Remove the accidental full `puppeteer` dependency.** `package.json` lists only `puppeteer-core` + `@sparticuz/chromium-min`. If the prior install added `puppeteer` to `node_modules`, the deploy steps below run `npm uninstall puppeteer` to remove it.

**No App.jsx logic changes, no translation changes.** Only the build marker bumps (`2026-05-19-v0121-chromium-min-fix`). `api/render-report-pdf.js` is rewritten in the runtime/launch section only — the JWT verify, client load, HTML builder, SVG charts, and Resend attach paths are unchanged.

**Cold-start expectation changes:** v0.12.0 claimed ~2–4s cold start. v0.12.1 (chromium-min) adds the one-time tarball download → ~5–8s on the first invocation after a new deploy. Warm starts remain ~1s. `maxDuration: 30` is unchanged.

**Build marker:** `2026-05-19-v0121-chromium-min-fix`. No SQL migration. No new pitfalls (the libnss3 + chromium-min lesson is captured in this entry; if it recurs in a future PDF/headless-browser feature, this section is the reference). D-1, D-7, D-18, D-27, D-30, D-31, D-34 preserved.

**Out-of-app actions required:**
- **Uninstall full Puppeteer if it got installed:** `cd /workspaces/Financeapp && npm uninstall puppeteer @sparticuz/chromium`. Leaves only `puppeteer-core` + `@sparticuz/chromium-min`.
- **Install the new deps:** `npm install @sparticuz/chromium-min@^140 puppeteer-core@^24`.
- **Replace** `src/App.jsx`, `api/render-report-pdf.js`, `package.json` (+ `package-lock.json` from the npm commands above), `AGENT.md`, `WORKPLAN.md`. Append the CHANGELOG entry. No changes to `src/translations.js`, `vercel.json`, or any other `api/*.js`.
- Commit + push; Vercel auto-deploys. The new function bundle should be ~5–10MB (was bloated before).
- Hard-refresh; verify `window.__GA_BUILD__ === "2026-05-19-v0121-chromium-min-fix"`.
- **Smoke test:** open the same client that failed in v0.12.0 → Reports → Complete Report → 📧 Email. First send will be the cold-start (5–8s, tarball download). Second send within the same minute should be ~1–2s. The PDF should arrive.
- If the cold start exceeds 30s, the tarball download is being throttled from GitHub — re-run the send; Vercel keeps the function warm for ~5 minutes so the tarball is already in `/tmp` for the retry.

---

### Prior: v0.12.0 — 2026-05-19 (Chat 10 — Email Complete Report as PDF, Puppeteer)

The advisor can now email a client their **Complete Report** as a real PDF attachment from inside the Complete Report tab. **O-11 RESOLVED → approach (a) Puppeteer rendering a self-contained print HTML server-side** (NOT driving the live SPA — see D-34 for the rationale). Chat 10 of the parallel-chat workplan.

1. **New Vercel Serverless Function** `api/render-report-pdf.js` (a D-30 `api/` server file):
   - Verifies the advisor JWT (`admin.auth.getUser(jwt)`) — same auth pattern as `send-intake-invite.js`.
   - Loads the one client row via the service-role key, matching on `local_id` first with a `data->>'id'` fallback (same pattern as `gaSaveClient` / `gaDeleteClient`, pitfall #15 avoided — uses two separate `.eq()` calls, not `.or()`).
   - Builds a self-contained printable HTML document from the client's data (no React, no SPA boot, no auth dance) — KPI strip, income / bills / debt / assets tables with hand-rolled inline SVG donut & bar charts in Golden Anchor palette.
   - Puppeteer renders the HTML to PDF at Letter size, 0.5in margins.
   - Resend (`noreply@finance.goldenanchor.life`, D-31) sends the email with the PDF as a base64 attachment. `reply_to` defaults to `RESEND_REPLY_TO` env var; if unset, falls back to the advisor's Profile & Settings email.
2. **App.jsx** (2,998 → 3,046 lines): new top-level helper `gaEmailCompleteReport` (line 28, fetches `/api/render-report-pdf` with Bearer JWT); new `EmailReportModal` component (line 643) with EN/ES default subject + body, recipient (auto-fills `client.email`, overridable), inline send status; in `CompleteReportTab` — new `settings` prop, new `emailOpen` state, new `Btn` "📧 Email" beside the existing `PrintBtn` (both wrapped in `ga-np` so they're hidden when the report is printed), modal mount. `ClientReport` signature gains `settings` and forwards it to `CompleteReportTab`; the `ClientDetail` call site also passes `settings` through.
3. **`src/translations.js`** (1,218 → 1,230 keys/side, symmetry intact): 12 new keys × 2 langs — `emailReportBtn`, `emailReportTitle`, `emailReportHelp`, `emailReportTo`, `emailReportSubject`, `emailReportMessage`, `emailReportSig`, `emailReportInvalidTo`, `emailReportSending`, `emailReportSendBtn`, `emailReportSent`, `emailReportFailed`. D-18 / pitfall #9 satisfied.
4. **`vercel.json`** picks up a `functions` block — `api/render-report-pdf.js` configured with `memory: 1024` and `maxDuration: 30`.
5. **One new locked decision D-34** (PDF rendering = print HTML + Puppeteer, NOT driving the live SPA). **O-11 CLOSED.** **O-13 CLOSED.**

**Original v0.12.0 deps (superseded by v0.12.1):** `puppeteer-core@^23` + `@sparticuz/chromium@^131`. **Original build marker:** `2026-05-19-v0120-email-report-pdf`. The runtime failure that prompted v0.12.1 was `libnss3.so` missing from the bundled Chromium — fixed by the chromium-min runtime-download approach.

**Out-of-app actions required before this build runs in production:**
- **Install deps**: in Codespace, `npm install puppeteer-core @sparticuz/chromium` — these become runtime deps for the Vercel function. Verify `package.json` already lists them after the install (it should).
- **No new Vercel env vars needed.** All env vars from v0.10.0 / v0.11.1 are reused: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`. The function reads them at request time.
- **Replace** `src/App.jsx`, `src/translations.js`, `vercel.json`, `package.json`, `AGENT.md`, `WORKPLAN.md`; append the `CHANGELOG.md` entry. **Add** `api/render-report-pdf.js`. Existing `api/send-intake-invite.js`, `api/resolve-intake-invite.js`, `api/mark-intake-invite-submitted.js` are unchanged.
- Commit + push. Vercel auto-deploys; new function picked up automatically.
- Hard-refresh production; verify `window.__GA_BUILD__ === "2026-05-19-v0120-email-report-pdf"`.
- **Smoke test:** open any client with non-empty income/bills/debt data → Reports tab → Complete Report → click "📧 Email" → enter your own email as recipient → click "Send PDF". First send is the cold-start (expect 5–8s); subsequent sends are 1–2s. Verify the email arrives with a `golden-anchor-report-<name>-<date>.pdf` attachment that opens and shows the expected sections + numbers. Verify the signature matches Profile & Settings.

---

### Prior: v0.11.1 — 2026-05-19 (Patch — intake-invite email signature from Profile & Settings)

The intake-invite email's signature (advisor name + contact email in the message body) was hard-coded to `Mauricio Hernandez` / `mauricio@goldenanchor.life` inside the server function `api/send-intake-invite.js`. Now: App.jsx passes `advisorName` / `advisorEmail` (from `settings`) in the `gaSendIntakeInvite` payload, `IntakeSubmissionsPage` gained the `settings` prop, and `buildEmailBody` in the server function builds the EN/ES signature from those fields with a fallback to the historical defaults. D-31 amended — Resend sender + reply-to are both `noreply@finance.goldenanchor.life`. Build marker `2026-05-19-v0111-invite-signature`.

### Prior: v0.11.0 — 2026-05-19 (Chat 9 — browser history / back-button)

In-app navigation (`nav` / open client / `selectedTab`) now pushes browser history so Back/Forward move within the app instead of unloading it. A navigation-signature `useEffect` calls `pushState` on each change (first run `replaceState` to seed the entry point); a `popstate` listener restores nav/selected/tab (no-state `popstate` falls back to the dashboard); a `_popstateRestoringRef` guard prevents re-push loops; an open mobile drawer is closed by the first Back. Both effects sit below all hooks and above the `isPublicIntakeRoute` early return (pitfall #13). Out of scope: deep-linkable `/clients/<id>` URLs (the URL bar does not change — Back/Forward work, links are not shareable; queued post-launch in WORKPLAN §4). New pitfall #16. Build marker `2026-05-19-v0110-history-backbutton`.

### Prior: v0.10.2 — 2026-05-18 (Patch — client delete fix)

`gaDeleteClient` rewritten. v0.10.1 had soft-deleted via a single `.or("local_id.eq.${id},data->>id.eq.${id}")` filter; PostgREST splits an `or` filter on `.`, so JSON paths and decimal client ids (e.g. `1776873994030.0803`) corrupt the query → 400 → the soft-delete silently no-ops → the client reappears on refresh. Fixed with two plain `.eq()` UPDATE calls. **Correction to the v0.10.1 record:** its "NULL `local_id`" root cause was wrong (`local_id` is populated on every row); `sql/v0.10.1_clients_local_id_repair.sql` was a no-op, correctly never committed. The "client duplication" launch-blocker was investigated against live data and found to be cross-account confusion (the same `local_id` value exists under Mauricio's account and the Playwright test account), not real duplicate rows. Build marker `2026-05-18-v0102-delete-fix`.

### Prior version — v0.10.0 (Minor)

**v0.10.0** — established 2026-05-18 (Minor). Server-side intake invite delivery via Resend, replacing the v0.7.3 mailto/SMS MVP. Adds a tracked-invite system so the advisor can send a personalized email invite to a prospect from `mauricio@finance.goldenanchor.life` (no more advisor mail client opening); the prospect receives a unique tokenized link that prefills their name and contact info and tracks open/submission status. Twilio SMS path is code-complete but feature-flagged OFF (`TWILIO_ENABLED=0`) until Mauricio completes Twilio business profile verification. TCPA consent attestation UI + persistent log are in place for when SMS goes live. Chat 7 of the parallel-chat workplan.

1. **Three new Vercel Serverless Functions** under `api/` at the repo root (the first instance of a D-1 carve-out for server code — see D-30):
   - **`api/send-intake-invite.js`** — accepts `{prospectName, prospectEmail, prospectPhone, lang, channelEmail, channelSms, smsConsent}`, verifies the caller's Supabase JWT, generates an unguessable `crypto.randomBytes(24).toString("base64url")` token, inserts an `intake_invites` row with the service-role key, then dispatches via Resend (email) and/or Twilio (SMS, if `TWILIO_ENABLED=1`). Returns per-channel success/failure. Resend `reply_to` defaults to `mauricio@goldenanchor.life` so prospect replies route to Workspace, not Resend.
   - **`api/resolve-intake-invite.js`** — anonymous endpoint called by the public intake page when `?invite=<token>` is present. Wraps a `SECURITY DEFINER` SQL function so the anon caller can read only the fields needed for prefill (advisor uuid, prospect name/email/phone, lang) plus an `expired` flag; never exposes the full invite row. Marks `opened_at` + IP hash on first read and flips status `sent`→`opened`.
   - **`api/mark-intake-invite-submitted.js`** — anonymous endpoint called by PublicIntake after a successful `gaSubmitIntake`. Wraps the `mark_invite_submitted` SECURITY DEFINER function to link the invite to the new `intake_submissions.id` and flip status to `submitted`.

2. **Two new Supabase tables** (`supabase/migrations/20260518_intake_invites.sql`):
   - **`intake_invites`** — `{id uuid pk, user_id uuid fk auth.users, token text unique, prospect_name/email/phone, lang, channel_email/sms bool, status check('sent','opened','submitted','expired','failed'), send_error, resend_message_id, twilio_sid, opened_at, opened_ip_hash, submission_id fk intake_submissions, created_at, expires_at default now()+30 days}`. RLS: advisor can SELECT/UPDATE/DELETE their own rows; INSERT only via service-role.
   - **`sms_consent_log`** — `{id, user_id, prospect_name, prospect_phone, consent_method check('advisor_attestation','prospect_initiated','written'), consented_at, advisor_attestation_at, invite_id fk, notes}`. One row written every time the advisor ticks the TCPA checkbox before sending SMS. RLS: SELECT/DELETE own rows; INSERT via service-role.
   - Two SECURITY DEFINER functions: `resolve_invite_token(p_token,p_ip_hash)` and `mark_invite_submitted(p_token,p_submission_id)`. Both granted to `anon` + `authenticated` so the public form can call them via RPC under service-role.

3. **App.jsx changes** (~62 net new lines, 2,900 → 2,962). Five touchpoints:
   - **5 new top-level async helpers** (lines 22-26): `gaLoadIntakeInvites`, `gaDeleteIntakeInvite`, `gaSendIntakeInvite` (fetches `/api/send-intake-invite` with Bearer JWT), `gaResolveIntakeInvite`, `gaMarkIntakeInviteSubmitted`. Existing `gaSubmitIntake` also now returns `submissionId` (used to link invite → submission).
   - **`PublicIntake` reads `?invite=<token>`** (new state `inviteToken`, `resolvedAdvisorId`, `inviteResolved`, `inviteError`; new `useEffect` that calls `/api/resolve-intake-invite` on mount, prefills `firstName`/`lastName`/`email`/`phone` in the draft, and switches language if the invite carried one). On successful submit, calls `gaMarkIntakeInviteSubmitted(token, submissionId)` to link back. Token-less `?advisor=<uuid>` URLs still work — falls back to the existing flow.
   - **`IntakeSubmissionsPage` send panel replaced** (lines 2530-2566 → ~2540-2655). The v0.7.3 mailto/sms/copy buttons are gone. New panel: name/email/phone/lang inputs (unchanged), Email/SMS channel checkboxes (SMS disabled with "coming soon" badge), TCPA attestation checkbox (only renders when SMS channel is on), single ⚓ "Send Invite" button, inline success/error status. After a successful send, the form clears and the Sent Invites list refreshes.
   - **New "Sent invites" collapsible section** below the send panel — shows up to 50 most-recent invites with prospect, channels (✉️ / 💬), language, status pill (Sent / Opened / Submitted / Failed / Expired), creation date, and a 🗑️ delete button. The list re-fetches after every send.
   - **Build marker** bumped to `2026-05-18-v0100-server-intake-delivery`.

4. **22 new translation keys × 2 langs** (`src/translations.js` 1,195 → 1,217 per side, symmetry intact). Includes the new TCPA copy in both languages. Also: existing `intakeSendTitle` value changed from "Send link to a prospect" / "Enviar enlace a un prospecto" → "Send invite to a prospect" / "Enviar invitación a un prospecto" since the action is now a server send, not a mail-client handoff. D-18 satisfied.

5. **Four new locked decisions added** (D-30 through D-33). Three open decisions affected:
   - **O-3** (locked as D-20 = Resend) — now actually active in code, not just DNS.
   - **O-11 / O-13** (PDF attachment for emails) — REMAIN OPEN. The v0.10.0 chat clarified that intake invites carry no PDF; PDF generation is a *report delivery* concern that belongs to a later "email Complete Report" feature. O-11's a/b/c choice is deferred to that chat.

**Build marker:** `2026-05-18-v0100-server-intake-delivery`. App.jsx 2,900 → **2,962 lines**. `src/translations.js` 1,195 → **1,217 keys/side**. New files: `api/send-intake-invite.js`, `api/resolve-intake-invite.js`, `api/mark-intake-invite-submitted.js`, `supabase/migrations/20260518_intake_invites.sql`. **SQL migration required** — see deploy steps.

**Out-of-app actions required before this build runs in production:**
- **Apply SQL migration**: in Supabase SQL Editor, run `supabase/migrations/20260518_intake_invites.sql`. Verify with `select count(*) from intake_invites;` (expect 0).
- **Install dependencies**: in Codespace, `npm install @supabase/supabase-js resend` (these become runtime deps for the Vercel functions). The `@supabase/supabase-js` is already used by App.jsx so it's likely already in `package.json`; verify `resend` is added.
- **Set Vercel environment variables** (Project Settings → Environment Variables, Production + Preview):
  - `SUPABASE_URL` — same value as `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API → service_role (KEEP SECRET, never expose to client)
  - `RESEND_API_KEY` — from Resend dashboard → API Keys
  - `RESEND_FROM` — e.g. `Mauricio Hernandez <mauricio@finance.goldenanchor.life>` (must be on the verified Resend domain)
  - `RESEND_REPLY_TO` — `mauricio@goldenanchor.life`
  - `PUBLIC_INTAKE_BASE_URL` — `https://finance.goldenanchor.life/intake`
  - `TWILIO_ENABLED` — `0` (keep SMS path disabled until Twilio business verification completes)
- **Replace** `src/App.jsx`, `src/translations.js`, `AGENT.md`, `CHANGELOG.md`, `WORKPLAN.md`. **Add** `api/send-intake-invite.js`, `api/resolve-intake-invite.js`, `api/mark-intake-invite-submitted.js`, `supabase/migrations/20260518_intake_invites.sql`.
- Commit + push. Vercel auto-deploys; the `api/` folder is picked up automatically as serverless functions.
- Hard refresh production; verify `window.__GA_BUILD__ === "2026-05-18-v0100-server-intake-delivery"` in the browser console.
- **Smoke test** (advisor side): Intake Forms → expand "Send invite to a prospect" → type your own email → check Email channel → click Send Invite → verify the invite arrives in your inbox, looks branded, and the link opens the public form with no prefill (since you didn't fill prospect_name).
- **Smoke test** (prefill): Send another invite with prospect_name + prospect_email set → click the link in the email → verify the form opens with name + email already filled.
- **Smoke test** (status tracking): In the Sent invites list, the just-clicked invite should show status "Opened" (after the form loads). Submit the form. The status should flip to "Submitted" and a corresponding row should appear in Intake Forms with the prospect's data.

---

## 4. Locked decisions

Decisions in this section have been agreed and should NOT be changed without the user explicitly saying "I want to reverse decision X." If something the user asks contradicts a locked decision, **stop and surface the conflict** before proceeding.

### Product

- **D-1 — Single file architecture (amended 2026-05-15, v0.6.2).** Single-file architecture for application logic. All React components, state, hooks, business logic, and side effects live in `src/App.jsx`. **EXCEPTION:** pure-data modules — translation dictionaries, static catalogs (`SVCS`, `PORTFOLIOS`, `TICKER_META`, etc.), and other literal-only exports with no JSX and no React imports — MAY live in sibling files in `src/` when their size impairs editing. The first instance of this carve-out is **D-29** (`translations.js`, v0.6.2). Future extractions of pure-data modules under this exception do not require re-opening D-1; just lock a new D-NN entry describing what was moved and why. Reason for keeping App.jsx single-file otherwise: easier for non-developer owner to manage uploads via GitHub web UI.
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
  - **Track A — UI strings in JSX (amended 2026-05-15, v0.6.2):** per-key `t.key || "English fallback"` wrap. `T.en` and `T.es` live in **`src/translations.js`** (per D-29), imported in App.jsx as `import { T } from "./translations";`. Dictionary access in `App()` body unchanged: `const t = T[lang] || T.en`. The `acctL` / `loanL` / `physL` inline fallback dictionaries stay in App.jsx — they're tiny, component-local, and used only for one helper each. Currently 1,146 keys per side, fully synced.
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

- **D-27 — Mobile-first responsive shell + PWA install (closes O-5, v0.6.0, 2026-05-15).** The advisor app responds to viewports < 720px by collapsing the sidebar into an off-canvas drawer with overlay, exposing a hamburger app-bar, stacking `Row2` to single column, and switching modals to bottom-sheet layout with `100dvh` + `env(safe-area-inset-bottom)`. Detection via a single `useViewport()` hook with `resize` + `orientationchange` listeners debounced through `requestAnimationFrame`. Desktop layout is unchanged when `width >= 720`. PWA install enabled via `public/manifest.json` + `public/sw.js`; SW caches static assets cache-first, app shell network-first, and explicitly bypasses any URL containing `supabase`/`stripe`/`resend` so D-2 (no caching of sensitive PII) is preserved. Reasoning: mobile prospects + Mauricio's own phone usage make the responsive shell the most direct conversion-rate improvement before launch; PWA "Add to Home Screen" gives an app-like feel without the cost of a native build (D-5). Stays inside the single-file architecture (D-1) — manifest/SW/icons are static files, not React modules. Forward note: when v0.7+ adds offline data caching, do NOT extend the SW to cache Supabase responses — that path requires per-user encryption that's deferred per O-15.

- **D-28 — Public intake form via `/intake` URL + anonymous-INSERT RLS (v0.6.0, 2026-05-15).** New `intake_submissions` table accepts unauthenticated POSTs from prospects who fill out the public `/intake?advisor=<uuid>&lang=<en|es>` URL. RLS policy `intake_anon_insert` grants `to anon` role `INSERT` with `check (true)` — the `advisor_id` flows in from the URL, not from `auth.uid()`, because by definition the submitter has no auth context. SELECT/UPDATE/DELETE remain gated by `advisor_id = auth.uid()`. The advisor's UUID is NOT secret (it's an identifier, not a credential) and exposing it in URLs is acceptable. Future: if rate-limiting becomes necessary, add a Postgres trigger that rejects inserts when the same `ip_hash` (SHA-256 of IP) has > N inserts in the last hour. For v1, manual moderation in the IntakeSubmissionsPage is sufficient. Forward note: when multi-tenant launches (D-23), the public URL becomes `/intake?agency=<slug>&advisor=<uuid>` and the table picks up `agency_id` — both new columns get RLS conditions extended.

- **D-29 — Translation dictionaries extracted to `src/translations.js` (v0.6.2, 2026-05-15).** `T.en` and `T.es` translation dictionaries live in `src/translations.js`, exported as `export const T`. Imported in App.jsx as `import { T } from "./translations";`. Both languages must be updated in the same edit (Pitfall #9 still applies). The file contains no JSX, no React imports, no logic — pure data only. First instance of the D-1 carve-out for pure-data modules. Rationale: at 1,146 keys per side the dictionary was ~80 KB of a 635 KB file; extracting it lets future Spanish translation audit chats upload `translations.js` alone (~80 KB) without loading the entire App.jsx. Mechanical extraction — no semantics change, no key additions, no key renames. Symmetry between EN and ES verified by parsing both `Object.keys(T.en).length === Object.keys(T.es).length` after extraction.
- **D-30 — Server code lives in `api/` (Vercel Serverless Functions), Node runtime (v0.10.0, 2026-05-18).** Second instance of a D-1 carve-out, this time for **server code** (not just pure data). Email and SMS API calls must run server-side so that `RESEND_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `TWILIO_AUTH_TOKEN` never reach the browser bundle. Functions live at `api/*.js` in the repo root, each is a default-export `async function handler(req, res)`, Vercel auto-discovers them. Authentication: client passes the Supabase auth JWT in `Authorization: Bearer <token>`; server verifies via `admin.auth.getUser(jwt)` before any privileged action. Service-role key is used ONLY inside these functions, never in App.jsx. Rationale for Vercel functions vs Supabase Edge Functions: same repo, same deploy, same domain, Node runtime (familiar), no extra deploy pipeline. Forward note: when v0.11+ adds more server endpoints (e.g. PDF report send), they go in the same `api/` directory under the same auth pattern.
- **D-31 — Email provider = Resend, verified on `finance.goldenanchor.life` (v0.10.0, 2026-05-18; sender/reply-to updated v0.11.1, 2026-05-19; refines D-20).** DNS records (SPF/DKIM/DMARC) are live on Cloudflare and the Resend dashboard shows the domain verified. **Sender: `noreply@finance.goldenanchor.life`** (set via `RESEND_FROM`, e.g. `Golden Anchor <noreply@finance.goldenanchor.life>`). **Reply-to: also `noreply@finance.goldenanchor.life`** (set via `RESEND_REPLY_TO`). Both must be on the Resend-verified domain. *History:* v0.10.0 originally specified `mauricio@finance.goldenanchor.life` as sender and `mauricio@goldenanchor.life` as reply-to; Mauricio switched both to the `noreply@` address in v0.11.1 — the apex `goldenanchor.life` was never verified in Resend, so sending from it failed ("API key is not authorized to send emails from goldenanchor.life"). Note: the *email signature* (advisor name + email shown in the message body) is separate from `RESEND_FROM` — as of v0.11.1 the signature is pulled from the advisor's Profile & Settings (`advisorName` / `advisorEmail`), not hard-coded, so Mauricio sets the visible contact address there independently of the technical sender. Inbound email handling at Resend stays disabled — outbound only. 3,000 emails/month free tier; upgrade to Resend Pro ($20/mo, 50k) if exceeded. Forward note: when Phase-2 features (engagement letters, monthly reports, payment receipts) start sending more transactional email, monitor volume.
- **D-32 — SMS provider = Twilio, code-complete but feature-flagged OFF until business verification (v0.10.0, 2026-05-18).** Twilio code path exists in `api/send-intake-invite.js` but is gated behind `TWILIO_ENABLED=1` env var. Until Twilio business profile + Toll-Free Verification (TFV) or 10DLC registration is complete, the UI shows the SMS checkbox as disabled with a "coming soon" badge. Sending business SMS in the US without TFV/10DLC will get the number blocked by carriers within hours — do NOT flip `TWILIO_ENABLED=1` until verification clears. Per-message cost ~$0.0083 (US 10DLC). When Mauricio is ready to activate, the steps are: (a) purchase phone number in Twilio, (b) submit business profile + brand registration, (c) wait 1-3 days for approval, (d) set `TWILIO_*` env vars + `TWILIO_ENABLED=1` in Vercel, (e) deploy. No App.jsx change required to enable — server-side flag flip + redeploy is sufficient. The TCPA UI (consent checkbox + log writes) already engages whenever `sendChSms` is true regardless of `TWILIO_ENABLED`, so the consent flow is testable in dev without flipping the flag.
- **D-33 — TCPA SMS consent: advisor attestation + opt-out footer + persistent log (v0.10.0, 2026-05-18).** Florida + federal TCPA require prior express consent before sending business SMS. Pattern: before any SMS send, the advisor MUST tick a checkbox attesting that the prospect gave verbal or written consent. Ticking + sending writes a row to `sms_consent_log` with `{user_id, prospect_name, prospect_phone, consent_method='advisor_attestation', consented_at, advisor_attestation_at, invite_id, notes}`. Every outbound SMS body includes a "Reply STOP to opt out. Msg & data rates may apply." (EN) / "Responde STOP para no recibir más mensajes." (ES) footer. Twilio handles STOP/UNSUBSCRIBE keywords automatically at the platform level (the carrier blocks future sends to that number). If a complaint ever arrives, `sms_consent_log` is the audit trail. Forward note: when client volume grows, consider migrating to **prospect-initiated consent** (a "Yes, send me texts" form on the public intake page) as the primary path, with attestation as a fallback for in-person verbal consent.
- **D-34 — PDF report rendering = self-contained print HTML + Puppeteer, NOT driving the live SPA (v0.12.0, 2026-05-19; chromium runtime spec amended v0.12.1, 2026-05-19; closes O-11 and O-13).** When a server function needs to produce a PDF of a Complete Report (or any future report), it MUST render a self-contained HTML document built server-side from the client data (no React, no SPA boot, no advisor login), then Puppeteer that HTML to PDF. Concretely: **`puppeteer-core` paired with `@sparticuz/chromium-min`** (NOT `@sparticuz/chromium`); the `-min` variant fetches the Chromium brotli tarball from the official GitHub release URL at runtime and caches it in `/tmp` between warm invocations, keeping the deployed bundle ~5MB and side-stepping the Vercel bundler-tracing failure that ate `libnss3.so` out of the regular `@sparticuz/chromium` package in v0.12.0. Function memory 1024 MB and `maxDuration: 30` in `vercel.json`; cold start ~5–8s (one-time tarball download), warm ~1s. Launch call: `headless: "shell"` (puppeteer-core 24 literal), args spread includes `--no-sandbox` + `--disable-setuid-sandbox` + `--hide-scrollbars`. Charts are hand-rolled inline SVG in the Golden Anchor palette — no Recharts, no chart library in the function bundle. **Version pinning rule:** `@sparticuz/chromium-min` follows Chromium's release cycle (not semver) so breaking changes happen at the patch level; pair it with the `puppeteer-core` major listed in the Sparticuz/chromium release notes (v140 ↔ puppeteer-core 24 as of 2026-05). When bumping the npm package version, bump the hard-coded `CHROMIUM_PACK_URL` constant in `api/render-report-pdf.js` to match — they must agree or the launch will fail with a Chromium-protocol mismatch. **Reasoning** (decided 2026-05-19 with Mauricio): driving `finance.goldenanchor.life` in a headless browser would require injecting a Supabase session into the page context (refresh token exposure), wait for Recharts animations + chart layout to settle, and silently break on any App.jsx layout drift. Print HTML is faster, more stable, smaller cold-start surface, and the auth model stays clean. **Lesson learned from v0.12.0 → v0.12.1:** the full `@sparticuz/chromium` package bundles its native libs into `node_modules` and depends on Vercel's bundler preserving them through tracing. That tracing is flaky — especially with adjacent large deps in `node_modules`. The `-min` runtime-download variant is the safer default. **Maintenance cost:** any Complete Report visual change must be mirrored in `buildPrintHTML()` inside `api/render-report-pdf.js`. For v1 the Complete Report is mostly tabular (income / bills / debt / assets / notes), so mirroring is cheap. **Delivery:** Resend email attachment (base64-encoded PDF). Considered + rejected for v1: upload to Supabase Storage bucket `client-reports` + signed-URL link in the email — adds storage surface and a "log in / click a link" step for the client; revisit if Resend's per-email size limit becomes a problem at scale (current PDFs are 100–500 KB, well under). **Forward note:** when v0.13+ adds monthly-statement PDFs or annual-summary PDFs, they extend `api/render-report-pdf.js` (or add a sibling `api/render-monthly-pdf.js`) under the same pattern; do NOT re-open the print-HTML-vs-SPA-driving question or the chromium-min decision without surfacing this entry.

---

## 5. Open decisions (not yet locked)

These are things being actively discussed. If the user weighs in on one, move it to Locked Decisions and update the version.

- ~~**O-5 — Mobile install (PWA) flow**~~ — *Closed v0.6.0, locked as **D-27** (mobile-first responsive shell + PWA install).*
- **O-6 — Marketing landing for `goldenanchor.life` apex.** Currently no site published (Wix subscription dropped). After DNS lands at Cloudflare, decide between: (a) dedicated Vercel project for the apex marketing site, separate from the Finance and Health apps (recommended); (b) Carrd one-pager; (c) keep apex parked and use subdomains only. Includes related routing question if the Finance app ever co-hosts a landing page.
- **O-7 — Referral attribution automation.** Manual via Google Form + cross-check for v1. When to automate inside App.jsx (capture referrer name → auto-issue $25 credit) is open.
- **O-8 — Snapshot data hygiene UX.** v0.3.0 added a stale-snapshot warning when debt scale changes >5x between snapshots. Open question: should the app proactively prompt to delete or refresh old snapshots that look scale-inconsistent, or just warn and let the advisor decide? Currently: warn only.
- ~~**O-9 — Phase-2 roadmap narrative translation.**~~ — *Closed v0.12.2 (2026-05-19, Chat 8).* The remaining English-only surface (the Financial Roadmap `PhaseCard`/`Phase` `sub` blocks — "Focus all extra cash on debt...", "Allocate 25% stocks + 20% retirement...") was fully translated; the surrounding template-literal glue words ("Applying ... /mo extra to fastest debt using") that mixed with the already-translated `extraToFastestDebt` fragment were wired through `t.key`. No remaining English-only narrative surface.
- ~~**O-10 — Spanish review pass.**~~ — *Closed v0.12.2 (2026-05-19, Chat 8).* A static EN→ES audit of every primary surface found 134 hardcoded English strings (203 code sites) — all wired through `t.key` in v0.12.2 (48 reused keys, 83 new). EN/ES dictionary symmetry verified. The Resend production delivery loop was smoke-tested with two real intake invites (EN + ES) to Mauricio's inbox — full open→submit→link-back loop confirmed on Gmail web and mobile.
- ~~**O-11 — PDF generation approach for *report* email automation.**~~ — *Closed v0.12.0 (2026-05-19), locked as **D-34** (print HTML + Puppeteer, NOT live-SPA-drive). Approach (a) chosen, refined to render a self-contained print HTML built server-side from client data rather than headlessly driving the React app — see D-34 for rationale.*
- **O-12 — Auto-logout duration.** *Closed v0.5.2a, kept here for traceability.* Locked at **30 minutes idle timeout with a 1-minute warning** (warning fires at 29:00, hard logout at 30:00). 15-min industry default was considered but rejected as too aggressive for an advisor working through reports. Reset events: `mousemove`, `keydown`, `touchstart`, `click`, `scroll`. Future: if users complain about being logged out mid-call, revisit. Configured as module-level constants `IDLE_TIMEOUT_MS` / `IDLE_WARN_MS` in App component for easy adjustment.
- ~~**O-13 — PDF generation timing for launch.**~~ — *Closed v0.12.0 (2026-05-19). PDF generation for the Complete Report shipped in v0.12.0 via D-34 (print HTML + Puppeteer). `window.print()` remains as the manual in-browser save-as-PDF flow; the new 📧 Email button on the Complete Report tab is the server-side delivery path. No further timing decision needed.*
- **O-14 — Terms of Service / Privacy Policy acceptance gate + Engagement Letter signature flow.** Legal docs are reviewed by counsel and on file (D-17). The app does not yet enforce one-time ToS click-through on first login, and does not track per-client engagement-letter signature dates. Deferred to v0.6+ (post-launch). For the first 1-2 paying clients, ToS/PP acceptance and engagement letter signing happen out-of-band via email + DocuSign / paper signature. Once that path proves the workflow, in-app gating gets added with: (a) ToS checkbox on first login (stored in `settings.tosAcceptedAt`, `settings.tosVersion`); (b) per-client `engagementLetter: {signedAt, signedBy, ipHash}` field; (c) optional Mauricio-side UI to upload his agent-specific PDF template (the agent-uploaded-form pattern Mauricio mentioned in the audit, which becomes the multi-agent default in D-23 later).
- **O-15 — Supabase data backup cadence + mechanism.** Decided v0.5.2a: **rely on Supabase's built-in Point-in-Time-Recovery (PITR) backups + a manual verification cadence**. Supabase free tier retains 7 days of PITR backups automatically — no custom export pipeline needed. Once Mauricio upgrades to a paid Supabase tier (likely Pro at $25/mo when client count grows), PITR retention extends to 14 or 30 days. v0.5.2b adds a `settings.lastBackupVerified` date field that Mauricio updates monthly after confirming he can see his clients in the Supabase Dashboard. Backup recovery procedure documented in §11 (v0.5.2b). Column-level encryption of SSN/phone/DOB via pgsodium considered but **deferred** — re-evaluate when (a) client count exceeds 25, or (b) regulatory requirements force HIPAA-shaped handling. Also rejected for launch: custom CSV-export-to-email pipeline — adds operational complexity, breaks if Resend fails, and PITR already covers the disaster-recovery case.

### Closed in v0.6.0 (2026-05-15)

- ~~O-5 (Mobile install / PWA flow)~~ → locked as **D-27**.
- *New:* **D-28** added (Public intake `/intake` route + RLS). No prior O-number — this was a feature additionally proposed and approved in the same chat that decided D-27.

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

13. **URL-based routing inside a single React function component.** The hooks rule says all hooks must be called in the same order on every render. So a route check like `if (path.startsWith("/intake")) return <PublicIntake/>` MUST come AFTER all `useState`/`useEffect`/`useViewport` declarations, not before. In v0.6.0 the `isPublicIntakeRoute` constant is computed inline with the state declarations (acceptable — no hook order changes), and the early return sits after all hooks and before the auth-state-machine gates (`!authReady` → `…`, `!authUser` → `<Login/>`, `bootstrapping` → ⚓ spinner). A consequence: the bootstrap useEffect still *registers* on the /intake route — it just doesn't matter because the early return runs before any of the rendered tree depends on its results. Don't try to "optimize" this by moving the route check up — it WILL break the rules of hooks the moment another hook gets added below it.

14. **CSS `zoom` traps `position:fixed` descendants in WebKit/iOS Safari.** The outer flex container in `App()` carries `zoom:(settings.appZoom||1)` to honour the user's app-zoom preference. In WebKit-family browsers (iOS Safari, Chrome on iOS, the Claude mobile app's WebView) the `zoom` property establishes a containing block for `position:fixed` children, so a fixed-position panel positioned `left:0` ends up at the left edge of the *zoomed parent*, not the viewport. v0.9.0 shipped the mobile drawer inside this zoomed flex container; it rendered clipped off the left edge of the screen. v0.9.1 fixed it by hoisting the drawer + scrim above the zoom container, into the top-level `<></>` fragment, so they're siblings of the zoomed element rather than descendants. **Rule:** any mobile-overlay/drawer/scrim/toast/modal that uses `position:fixed` to escape layout flow MUST be rendered as a sibling of the `zoom`-carrying container, not a descendant. Things that look broken because of this on iOS but fine on desktop Chrome are the giveaway — Chromium's behaviour matches the spec, WebKit's doesn't.

15. **Never put a JSON path or a dotted value inside a PostgREST `.or()` filter.** supabase-js `.or("col.op.val,col.op.val")` is parsed by splitting the string on `.`, so a JSON path like `data->>id` — and any value containing `.`, such as the decimal client ids in legacy data (`1776873994030.0803`) — corrupt the filter and the request 400s. v0.10.1's `gaDeleteClient` hit exactly this and silently failed every delete. **Rule:** to match on `local_id` and/or `data->>'id'`, use separate `.eq()` calls — `.eq()` URL-encodes the whole value, so dots are safe. For app-written rows `local_id` is reliably `String(client.id)`, so `.eq("local_id", String(client.id))` always matches; a second `.eq("data->>id", …)` pass covers any row whose `local_id` is unset. `gaLoadClients` de-dupes by client id on load. Fixed in v0.10.2. NOTE: v0.10.1 framed this pitfall as "NULL `local_id` legacy rows" — that root cause was wrong; the real bug was the `.or()` parsing described here.
16. **In-app navigation must push browser history or Back unloads the SPA.** Tab/section navigation is plain React state (`nav`, `selected`, `selectedTab`); without `history.pushState` the browser keeps no in-app entries and Back leaves the app. Fixed in v0.11.0 with a navigation-signature `useEffect` (push on `[nav, selected?.id, selectedTab]` change) plus a `popstate` listener. **Rule:** the push effect must run a first-render `replaceState` to seed the entry point; a `_popstateRestoringRef` guard must suppress the push on the render caused by a `popstate` restore, or Back/Forward spawn duplicate entries; and — per pitfall #13 — both effects belong in the effects block below every hook and above the `isPublicIntakeRoute` early return, with the push effect early-returning on the `/intake` route and while signed out.

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

## 11. External services baseline (v0.6.0)

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
| **Stripe** | Standard | ✅ Account active. **9 hosted Payment Links live** (2026-05-12 dashboard export). In-app integration: **wired in v0.6.0** — `settings.stripeLinks[service-id]` map holds URLs, About/Services page renders 💳 Pay Now buttons that open hosted Checkout in new tab. Webhook integration for `lastPaidAt` auto-updates is deferred (manual marking in Service Plan UI for now). | $0 base, 2.9% + $0.30/txn | Payment for each service. |
| **Calendly** | Free | ✅ Live — "Free Discovery Call 20 min" event type connected to Google Calendar. Public booking link saved. | $0 | Single event type. Paid upgrade deferred until volume justifies $12/mo. |
| **Resend** | Free | ✅ Live as of v0.10.0 (2026-05-18). Domain `finance.goldenanchor.life` verified, SPF/DKIM/DMARC live in Cloudflare. Sender: `mauricio@finance.goldenanchor.life`. Reply-to routes to `mauricio@goldenanchor.life` (Google Workspace). Wired into `api/send-intake-invite.js`. | $0 (3k emails/mo) | Server-side transactional emails. v0.10.0 ships the intake invite flow. Future: report delivery, payment receipts, engagement-letter notifications. |
| **Twilio** | Trial | 🟡 Account pending. Code path complete in `api/send-intake-invite.js`, feature-flagged OFF via `TWILIO_ENABLED=0` until Mauricio completes business profile + Toll-Free Verification or 10DLC registration (D-32). Activating early without verification will get the number carrier-blocked within hours. | ~$0.0083/SMS (US 10DLC) | Server-side SMS for intake invites + (future) appointment reminders. |
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

### Backup procedure (v0.5.2b)

Closes O-15 (decision: keep Supabase managed-backup + Mauricio-verified manual backups, defer PITR and column-level encryption). Run this **monthly**, or before any major Supabase schema change, or before any v0.x.0 (minor) deploy:

1. **Export.** Open the app in production (`finance.goldenanchor.life`) → Dashboard → ⋯ kebab → "💾 Backup All (JSON)". Browser downloads `golden_anchor_backup_YYYY-MM-DD.json` containing every client (incl. archived/soft-deleted), every snapshot, plus the full `settings` object including `stripeLinks` and `lastBackupVerified`.
2. **Save to secure storage.** Move the file out of the Downloads folder into one of:
   - 1Password vault (recommended — encrypted, syncs across devices).
   - An encrypted external drive (e.g. macOS APFS-encrypted USB).
   - **Do NOT** leave it in iCloud Drive, Google Drive, or Dropbox unencrypted — these have advisor-data exposure risk and would not satisfy a future SOC2-style review.
3. **Restore dry-run (this is the part most people skip — don't).** Open `finance.goldenanchor.life` in a **fresh private/incognito window** so it doesn't touch your real session. Don't log in. Open browser DevTools → Application → Local Storage → clear all `ga_*` keys (defensive — should be empty in incognito anyway). Log in with the dedicated test user `test@goldenanchor.life`. Dashboard → ⋯ → "📥 Restore Backup" → pick the JSON you just exported → choose "Replace" mode → confirm. **Open at least 2 random clients and verify their snapshots/income/debt match what you remember.** Close the incognito window when done (no need to clean up — it's the test user's tenant).
4. **Mark verified.** Back in your real session: Profile & Settings → 💾 Backup Verification → "✓ Mark Verified Today". This writes `settings.lastBackupVerified` and propagates through Supabase like any other setting.

### What to do if a restore fails

If step 3 throws a parse error or shows wrong data:
- **Don't panic and don't delete the backup file.** A bad restore doesn't mean a bad backup — it most often means a JSON-shape mismatch between the version that exported the file and the version trying to restore it. Check `window.__GA_BUILD__` in DevTools console on both the exporting and restoring tab; if they differ, that's the diagnosis.
- **Restore by opening the JSON manually.** The backup is plain JSON — open it in a text editor and confirm it has the expected shape: `{ "__ga_backup__": true, "v": 2, "ts": <number>, "clients": [...], "settings": {...} }`. If the structure is intact but the app rejected it, file a bug with the build marker mismatch.
- **Fall back to Supabase managed backups.** Supabase Free tier keeps **7 days of point-in-time snapshots** by default (visible in Supabase Dashboard → Database → Backups). Worst case, restore the entire database from a Supabase backup, accept up to 7 days of data loss, and tell affected clients the calendar week of impact. This is the documented worst-case recovery RPO.
- **Never** edit the JSON file by hand to fix a single client — restore the full file and re-enter just the affected client through the normal UI, otherwise you risk hash/checksum drift on future imports.

### Account credentials reminder
All service credentials (passwords, API keys, recovery codes) live in user's password manager, NOT in this repo, NOT in chat history. If a key appears in chat, rotate it immediately.

---

## 11.5. Pending work + sync map (v0.6.0)

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
| `utils/fixtures.ts` | Shared helpers — `appPage` fixture, `navTo`, `openClient`, `openCalculator`, `switchLang`, `fillNumberByLabel`, `getBuildMarker`. |
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

### Known issues (as of 2026-05-14, after selector-fix patch)

1. **WebKit disabled in `playwright.config.ts`.** The Codespace is missing 36 system libraries (`libgtk-4.so.1`, `libvulkan.so.1`, `libgstreamer-*`, `libflite-*`, etc) that WebKit needs. Chromium and Firefox give us adequate coverage. To re-enable WebKit, run `sudo npx playwright install-deps webkit` once in the Codespace, then uncomment the webkit project block in `playwright.config.ts`.
2. **3-browser run takes ~11 minutes serially** (was a hard cap when running with WebKit fail-loops; should drop to ~7-8 min with WebKit off and selectors fixed). Configured for 1 worker because Codespaces free tier has limited CPU. Acceptable for pre-deploy verification, too slow for "run after every save" loops. Use `npx playwright test --project=chromium tests/01-smoke.spec.ts` to scope individual runs during dev.

### What the test results actually mean

**Original first-run baseline (2026-05-14, before selector fixes):** ~30 passing / ~30 failing across Chromium + Firefox. All ~30 failures were test-code selector bugs in `02-calculators.spec.ts` (calculator card selectors), `04-translation.spec.ts` (language toggle), and the `navTo` chain in `utils/fixtures.ts` (overly-broad button-or-anchor matching). None were app bugs — the app worked correctly in production throughout.

**First selector-fix attempt (2026-05-14, later same day):** Rewrote `utils/fixtures.ts`, `02-calculators.spec.ts`, and `04-translation.spec.ts`. Fixed three real bugs (overly broad `navTo` regex, wrong language-toggle selector, calculator cards being divs not buttons), but the fix shipped with three new bugs that only surfaced on the first end-to-end run: (a) `switchLang` used `isVisible()` (non-blocking) for its language probe, which returned false during the brief pre-render window and caused the function to skip the click; (b) `openClient` waited on `🔍 Search clients…` (Dashboard's translated placeholder) when the test actually lands on `ClientList` which hardcodes `🔍 Search…` (line 1988); (c) `fillNumberByLabel` used Playwright's `getByLabel()` which requires a wrapping `<label>` or `htmlFor` pairing — but `Field` (line 157) renders the `<label>` as a sibling. Result: 24 passed / 36 failed.

**Second selector-fix attempt (2026-05-15):** Patched all three remaining bugs against the live failure log. `switchLang` now uses `Promise.race` between `waitFor({state:"visible"})` on both Dashboard and Tablero labels (4s each) to determine current language, then clicks `getByTitle("Language", {exact:true})` (stable across collapsed-sidebar state). `openClient` waits on `/🔍\s*Search/i` which matches both the Dashboard and ClientList placeholders. New `fillNumberByLabel` uses the `data-cf` attribute that `Field` writes on its wrapping div for test selectors. Also corrected `02-calculators.spec.ts`: Affordability assertion changed from `$3,100` (assumed 36% DTI) to `$3,800` (actual default 43% DTI from the slider); Debt Reduction assertion changed from `/Avalanche|Snowball/i` (which is the client-bound variant) to the actual standalone-calc result-panel labels "Payoff Time / Total Paid / Total Interest"; ambiguous input regexes anchored (`^APR \(%\)$`, `^Term$`, `^Years$`). Expected steady state now 60/60 passing on chromium + firefox. Run `rm -rf playwright/.auth && npm run test:e2e` to verify.

### Future work

- **CI workflow** (`.github/workflows/playwright.yml`). Run the test suite on every push to `main`, fail the deploy if regressions ship. Requires the GitHub Actions secrets listed in the test setup (`GA_TEST_EMAIL`, `GA_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Smoke test against production** (override `GA_BASE_URL=https://finance.goldenanchor.life`). Run after every Vercel deploy. Catches "the build deployed but the page is white" failure mode.
- **Re-enable WebKit** once `sudo npx playwright install-deps webkit` is run in the Codespace (one-time setup).

### Sensitive things NOT in this section

`.env` contents are NOT in this repo, this doc, or anywhere except your local Codespace `.env` file and the GitHub Actions secrets configuration. If you ever paste a `.env` into chat, rotate every key in it immediately.

---

---

*Last updated: 2026-05-19 — v0.12.2 (Patch — Spanish bleed-through fix, Chat 8; closes O-9 and O-10). Static EN→ES audit of App.jsx vs translations.js found 134 hardcoded English strings across 203 code sites that never routed through t.key. All 203 wired through `t.key||"fallback"`: 48 reused keys, 83 new keys × 2 langs (neutral Latin-American Spanish — e.g. Down→Enganche, Taxable→Gravable, Checking→Cuenta Corriente). translations.js 1,230→1,313 keys/side, EN/ES symmetry verified. The two O-9 Financial Roadmap PhaseCard/Phase `sub` template literals are now fully bilingual. PrintBtn default param reverted to a plain-string default (a function-parameter default cannot be a JSX expression); all 3 <PrintBtn/> call sites pass a translated label. O-10 Resend production smoke test passed — two real intake invites (EN+ES) to Mauricio's inbox, full open→submit→link-back loop confirmed. App.jsx 3,045→3,046 lines. Build marker `2026-05-19-v0122-spanish-bleedthrough`. No SQL, no env vars, no api/* or package.json changes. No new locked decisions, no new pitfalls. D-1, D-7, D-18, D-27, D-30, D-31, D-34 preserved.*

*Prior update: 2026-05-19 — v0.12.1 (Patch — Vercel Chromium runtime fix for v0.12.0). v0.12.0 deployed but every PDF send failed with `libnss3.so: cannot open shared object file`. Root cause: `@sparticuz/chromium@131`'s bundled libs didn't survive Vercel's serverless bundler tracing (compounded by an accidental `npm install puppeteer` that bloated `node_modules` past the practical tracing limit). Fix: switched to `@sparticuz/chromium-min@^140` + `puppeteer-core@^24.10`, with the Chromium tarball fetched at runtime from the official GitHub release URL and cached in `/tmp`. Tiny deployed bundle (~5MB), working libs, no size-limit risk. Modernized launch call: `headless:"shell"`, added `--no-sandbox` + `--disable-setuid-sandbox` to args. No App.jsx logic changes — only `api/render-report-pdf.js` (runtime/launch section) + `package.json` deps + build marker. Build marker `2026-05-19-v0121-chromium-min-fix`. Cold start expectation: ~5–8s on first invocation after a deploy (tarball download), ~1s warm. No SQL migration. No new pitfalls. D-1, D-7, D-18, D-27, D-30, D-31, D-34 preserved.*

*Prior update: 2026-05-19 — v0.12.0 (Minor — Email Complete Report as PDF, Chat 10). New Vercel function `api/render-report-pdf.js` (D-30 server file) verifies the advisor JWT, loads the client row via service-role + two `.eq()` calls (pitfall #15 avoided), builds a self-contained printable HTML document with inline SVG donut + bar charts in the Golden Anchor palette, Puppeteer renders it to PDF, Resend (D-31) attaches and emails. App.jsx 2,998 → 3,046 lines: new `gaEmailCompleteReport` helper, new `EmailReportModal` component (recipient auto-fills `client.email`, advisor can override; EN/ES defaults), `CompleteReportTab` gains `settings` prop + 📧 Email button beside `PrintBtn`; `ClientReport` + `ClientDetail` call sites forward `settings`. `translations.js` 1,218 → 1,230 keys/side (12 new × 2 langs, symmetry verified). New `vercel.json` `functions` block (memory 1024, maxDuration 30). One new locked decision **D-34** (print HTML + Puppeteer, NOT live-SPA-drive). **O-11 closed, O-13 closed.** Build marker `2026-05-19-v0120-email-report-pdf`. Runtime failure (libnss3.so) fixed in v0.12.1.*

*Prior update: 2026-05-19 — v0.11.1 (Patch — intake-invite email signature now pulled from Profile & Settings). App.jsx passes `advisorName`/`advisorEmail` (from `settings`) in the `gaSendIntakeInvite` payload; `IntakeSubmissionsPage` gained the `settings` prop; the server function `api/send-intake-invite.js` builds the EN/ES signature from those fields with a fallback to the historical defaults. D-31 amended — Resend sender + reply-to are both `noreply@finance.goldenanchor.life` (the apex `goldenanchor.life` was never verified, which caused the earlier send failure); the visible signature address is now settings-driven and independent of `RESEND_FROM`. translations.js unchanged. App.jsx 2,965 → 2,998 lines. Build marker `2026-05-19-v0111-invite-signature`. Prior: v0.11.0 (Chat 9 — browser history / back-button integration; new pitfall #16); v0.10.2 (Patch — `gaDeleteClient` `.or()` → two `.eq()` delete fix, corrected the v0.10.1 NULL-`local_id` misdiagnosis). D-1, D-7, D-18, D-27 preserved.*

*Prior update: 2026-05-18 — v0.10.0 (Minor — server-side intake invite delivery via Resend; 3 Vercel functions under `api/`; `intake_invites` + `sms_consent_log` tables; tracked invite tokens; TCPA attestation. D-30–D-33 locked. Build marker `2026-05-18-v0100-server-intake-delivery`).*

*Prior update: 2026-05-17 — v0.9.3 (Patch — three mobile KPI/portfolio grids fixed: ClientReport 4-up KPI strip (`Net Income / Bills / Total Debt / Net Worth`), AssetsLiabilitiesTab 4-up (`Total Assets / Total Liabilities / Net Worth / Current Ratio`), InvestmentsTab + standalone Portfolio calc 3-up package row (`Conservative / Growth / Aggressive`). All had hard-coded `gridTemplateColumns:"1fr 1fr 1fr"` or `"repeat(4,1fr)"` with no mobile branch, so cards spilled off-viewport on phones. Fix: global `@media(max-width:719px)` rule in `ga-styles` that targets `[data-ga-grid="kpi-3"]`, `[data-ga-grid="kpi-4"]`, `[data-ga-grid="portfolios"]` etc. and forces 2-up or 1-up with `!important` (needed to beat inline styles); 4 grids tagged with `data-ga-grid` attr; `SC` (stat card) component gets `className="ga-sc"` + `min-width:0` so cards can actually shrink inside the collapsed grid; labels/values inside SC get text-overflow:ellipsis for very long $ amounts. Forward-safe: future hard-coded grids just need a `data-ga-grid="..."` attr to auto-collapse on mobile, no `useViewport()` plumbing. Reported via 3 screenshots in same session as v0.9.1/v0.9.2). Build marker `2026-05-17-v093-mobile-grid-overflow`. App.jsx 2,880 → 2,900 lines. `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed, no new pitfalls. D-1, D-7, D-18, D-27 preserved.*

*Prior update: 2026-05-17 — v0.9.2 (Patch — `Kebab` dropdown auto-flips its anchor side. Before: menu was always `right:0` anchored to the button; on mobile this clipped the Chat 4 bulk-action ☰ on the Clients page (button at left of row, menu extended leftward off-viewport). Fix: `Kebab` now reads its button's `getBoundingClientRect().left` against `window.innerWidth/2` on open and picks `left:0` or `right:0` accordingly. One new state, one helper, computed-key style `[side]:0`. Pure presentational — every existing Kebab caller works unchanged. No new translation keys. Reported by Mauricio with a screenshot in the same session as v0.9.1). Build marker `2026-05-17-v092-kebab-flip`. App.jsx 2,879 → 2,880 lines. `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed. No new pitfalls (v0.9.1's pitfall #14 about `zoom`+`position:fixed` still applies but is unrelated to this fix). D-1, D-7, D-18, D-27 preserved.*

*Prior update: 2026-05-17 — v0.9.1 (Patch — two mobile bugs introduced by v0.9.0 fixed. (1) **Mobile drawer hoisted out of the zoom-applying flex container** — CSS `zoom` establishes a containing block for position:fixed descendants in WebKit/iOS Safari, so the drawer was being clipped off the left edge of the viewport; moved drawer+scrim to the top-level fragment as siblings of the zoomed container; the desktop sidebar is now gated behind `{!vp.isMobile&&...}` inside the flex container. (2) **`<html>` and `<body>` now painted with `theme.bg`** via a `useEffect` keyed on `theme.bg` in `App()` (same pattern as `PublicIntake` line ~2311); kills the white border / overscroll-bounce / iOS safe-area white tint that bled through on mobile in dark mode. Outer flex container also gets `width:"100%"` as a defensive belt. Drawer also got a small UX bump: explicit ✕ close button, 9-10px tap padding, fontSize 14. No new translation keys. Out-of-band patch — same day as v0.9.0 deploy, reported by Mauricio via screenshot). Build marker `2026-05-17-v091-mobile-fixes`. App.jsx 2,858 → 2,879 lines. `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed. New pitfall worth remembering: `zoom` traps `position:fixed` in WebKit — hoist mobile overlays above the zoom container. D-1, D-7, D-18, D-27 preserved.*

*Prior update: 2026-05-16 — v0.9.0 (Minor — mobile / responsive redesign of every primary surface. Mobile top bar drops the ⚓ to reclaim width; Dashboard KPI grid collapses to 2-up on mobile; Dashboard + ClientList client rows stack name-on-top, figures-below; Chat 4 bulk-action coloured bar `flex-wrap`s; ClientDetail 4-up KPIs → 2-up and the 8-tab strip gets contained `overflowX:auto`; Calculators/Resources/About grids switched to `auto-fit`; v0.8.1 Appearance preview tile re-sized to fit beside its pickers on narrow viewports; app main column gets `maxWidth:"100%"` safety. Layout primitives only — no data shape, no behavior, no new components. Chat 5 of the parallel-chat workplan). Build marker `2026-05-16-v090-mobile-responsive`. Zero new translation keys (D-18 trivially satisfied). App.jsx 2,856 → 2,858 lines (~595 KB). `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed. No new pitfalls. D-1, D-7, D-10, D-18, D-27 preserved; D-27 (mobile-first) meaningfully advanced.*

*Prior update: 2026-05-16 — v0.8.1 (Patch — customizable page-background and card-background colors in Profile & Settings, for both light and dark mode, with live preview and per-mode reset. New "Background Colors" section in `ProfileModal` with a `BgPicker` helper (preset shade swatches + custom color picker + hex field) and four preset arrays. `DEF_SETTINGS` gains `darkBg`/`darkCard`/`lightBg`/`lightCard` — properties inside the existing `ga-settings` object, no new top-level localStorage key (D-10 satisfied). The `App()` theme line spreads these over the `makeDark`/`makeLight` palette, overriding only `bg` and `card`; all other tokens untouched. Ad-hoc patch requested by Mauricio, not a queued workplan chat). Build marker `2026-05-16-v081-appearance-bg-settings`. +6 translation keys × 2 langs; dictionary 1,186 → 1,192 per side. App.jsx 2,854 → 2,856 lines. No SQL migration. No new locked decisions, none closed. No new pitfalls. v0.8.1 includes v0.8.0's bulk client actions.*

*Prior update: 2026-05-16 — v0.8.0 (Minor — bulk actions on the Clients tab, built action-first: the list looks unchanged until the advisor picks an operation from the ☰ menu. Five menu items — 📦 Archive / ↩ Restore / 🗑️ Delete / ✂️ Split / 🔗 Join, all always enabled. Archive/Restore/Delete enter a per-action selection mode (checkboxes scoped to the action: Archive→active, Restore→archived, Delete→either) with a coloured action bar and a confirmation modal listing affected clients; bulk Delete requires typing DELETE. Split/Join are selection-independent searchable pickers feeding the existing SplitAssignModal / JoinModal unchanged. Chat 4 of the parallel-chat workplan). Build marker `2026-05-16-v080-bulk-client-actions`. +28 translation keys × 2 langs; dictionary 1,158 → 1,186 per side. App.jsx 2,743 → 2,854 lines (`ClientList` rewritten multi-line). Four new App handlers (`archiveMany`/`restoreMany`/`deleteMany`/`splitClientPair`); `joinClients` reused; shared `Kebab` untouched. No SQL migration. No new locked decisions, none closed. No new pitfalls.*

*Prior update: 2026-05-16 — v0.7.3 (Patch — autofill suppression on public intake form, ClientType + RecommendedBy fields removed from intake, light/dark toggle on public intake page, MVP send-intake-link feature with mailto/SMS/copy-message buttons promoted from Chat 7 backlog and shipped early). Build marker `2026-05-16-v073-intake-polish-and-send-mvp`. +11 translation keys × 2 langs; dictionary 1,147 → 1,158 per side. App.jsx 2,696 → 2,743 lines. No SQL migration. No new locked decisions, no closed open decisions. No new pitfalls. Server-side email/SMS delivery (Resend + Twilio) remains backlog under "Server-side intake delivery (future)"; WhatsApp delivery explicitly deferred to long-term per Mauricio.*

*Prior update: 2026-05-16 — v0.7.2 (Patch — SSN format + theme fix + sort-arrow spacing). Build marker `2026-05-16-v072-intake-polish`.*

*Prior update: 2026-05-16 — v0.7.1 (Patch — full-parity public intake + Edit/Delete submissions). Build marker `2026-05-16-v071-full-parity-intake-edit-delete`.*

*Prior update: 2026-05-16 — v0.7.0 (Minor — IA refactor). Build marker 2026-05-16-v070-ia-refactor-intake-forms.*

*Prior update: 2026-05-16 — v0.6.3 (Patch — Service Plan editor trimmed, Pay Now/Pay Later buttons). Build marker 2026-05-16-v063-service-plan-trim-notes-tone.*

*Prior update: 2026-05-15 — v0.6.2 (Patch — pure mechanical refactor extracting `T.en`/`T.es` from App.jsx into `src/translations.js`, no behavior change). Two touchpoints in App.jsx (new import line at L5, removed `const T = {...}` block at L91–93 plus its comment header; build marker updated). New file: `src/translations.js` (~80 KB, single `export const T`). App.jsx shrank from 2,580 lines / ~635 KB → 2,577 lines / ~555 KB. No SQL migration. No new translation keys. One amended decision (D-1 carves out pure-data modules), one amended decision (D-18 Track A points at new file path, key count corrected to 1,146), one new locked decision (D-29 = `src/translations.js`). No new pitfalls. Build marker `2026-05-15-v062-translations-extracted`. Open decisions remaining unchanged: O-6, O-7, O-8, O-9, O-10, O-11. Docs accuracy note: v0.6.0 release notes claimed 1,147 keys per side; actual count is 1,146 (symmetry intact). Next: confirm Mauricio sees the EN/ES toggle still working identically to v0.6.1, then resume normal feature work — future Spanish-audit chats can now upload `translations.js` alone.*

*Prior update: 2026-05-15 — v0.6.1 (Patch — persist lang+theme across refresh, hide Pay Now on free Insurance Advisory card, link Resources guides to external authoritative sources, fix Intake Submissions EN/ES Copy + URL display + add `vercel.json` SPA rewrite so the public intake route resolves). Five touchpoints in App.jsx (DEF_SETTINGS, App state init, sync useEffect, AboutPage SVCS grid, ResourcesPage guides array, IntakeSubmissionsPage copyUrl + URL block). App.jsx grew from 2,562 lines / 627 KB → 2,580 lines / ~635 KB. New deployment file: `vercel.json` at repo root (catch-all rewrite to `/`). No SQL migration. No new translation keys. No new locked decisions, no closed open decisions. Build marker `2026-05-15-v061-prefs-and-intake-ux`. Open decisions remaining unchanged: O-6, O-7, O-8, O-9, O-10, O-11. Next: confirm Mauricio sees all four fixes working in production, then revisit O-6 marketing landing once Porkbun → Cloudflare DNS propagation completes.*

*Prior update: 2026-05-15 — v0.6.0 (Minor — mobile responsive shell + PWA install + Tier-3 public intake form). One bundled minor at user's explicit direction. App.jsx grew from 2,382 lines / 593 KB → 2,562 lines / 627 KB. New static assets in `public/`: `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon-32.png`. New SQL migration in `sql/v0.6.0_intake_submissions.sql` (one CREATE TABLE + five RLS policies + two indexes). Reference `index.html` updated for SW registration and PWA meta tags. Two new decisions locked: **D-27** (mobile-first responsive + PWA install, closes O-5) and **D-28** (public intake route + anonymous-INSERT RLS). New pitfall #13 (URL routing must come after hooks). 54 new bilingual translation keys (T.en and T.es both 1,093 → 1,147 — symmetry-verified by build script). Build marker `2026-05-15-v060-mobile-pwa-intake`.*
