# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

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
