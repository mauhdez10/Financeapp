# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

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
