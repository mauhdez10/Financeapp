# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

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
