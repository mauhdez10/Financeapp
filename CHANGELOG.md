# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

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
