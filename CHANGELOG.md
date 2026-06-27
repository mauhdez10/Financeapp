# CHANGELOG.md — Golden Anchor Finance App

All notable changes to App.jsx and the supporting docs. Newest entries on top. Follows AGENT.md §3 versioning.

## v0.83.38 — 2026-06-27 — fix(i18n): PromotionsPage "Suggested Starter Promotions" bilingual (ISS-71)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–70 class):** the **"Suggested Starter Promotions"**
example block in `PromotionsPage` (`src/pages/marketing.jsx`) rendered its section header via
`t.suggestedTitle` (localized) but the **6 suggested-promo bullet lines** beneath it were hardcoded
English `<div>`s — so a Spanish advisor saw a Spanish heading over 6 English example promos.

- **No new translation keys** — all six full-line strings already existed in BOTH `T.en` and `T.es`
  (`welcomeDiscountSugg`, `healthClientSugg`, `referralRewardSugg`, `newYearSugg`, `springSugg`,
  `annualBundleSugg`); they were pre-staged but never wired into the page. (`newYearSugg` was
  single-quoted, which is why an earlier double-quote scan missed it.)
- **WIRED:** replaced the 6 static `<div>`s with a `.map()` over the 6 keys (each `t.key||"<English
  fallback>"`), rendering by splitting on the em-dash (`indexOf(" — ")`) so the **bold title** is
  preserved (`• <b>{title}</b> — {body}`). The split is em-dash-only, so the en-dash (`–`) date
  ranges in the bodies ("January 1 – January 31", "March 15 – April 30") stay intact; node-verified
  on EN + ES (incl. ES "Año Nuevo" title).
- **Pure display** — these are static suggestion examples (no promo data, no `onSave`, no save path)
  → autonomous-safe push (matches ISS-61–70).

**Gates:** `npm run build` clean; `npm run lint` 427 (408 err / 19 warn) = baseline (0 new); EN/ES
symmetry unchanged (2048/2048 — zero translations.js edits, reused-keys-only). Found in the item-1/4
advisor-surface hardcoded-JSX-text i18n scan (the marketing.jsx full-text-node hit).

## v0.83.37 — 2026-06-27 — fix(i18n): ClientDetail archive/restore modal bilingual (ISS-70)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–69 class):** the `ClientDetail` archive/restore
**confirmation modal** (`src/App.jsx` — opened from the client-detail kebab → 📦 Archive / ↩ Unarchive)
rendered fully hardcoded English regardless of language — the last named sub-scope ISS-68/69 left
queued ("ClientDetail archive/restore modal body text in App.jsx — a separate sweep"). A Spanish
advisor archiving/restoring a client saw an English title, body prose, and buttons. Localized:

- the modal **title** — `↩ Restore Client` / `📦 Archive Client` (emoji kept inline; text via
  `archiveModalRestoreTitle` / `archiveModalArchiveTitle`);
- the **restore body** "Restore **{name}** to your active client list?" — split
  `archiveModalRestoreA` + `<b>{name}</b>` + `archiveModalRestoreB` to preserve the mid-sentence bold
  (ES wraps the bold inside the `¿…?` question: "¿Restaurar a **{name}** a tu lista de clientes activos?");
- the **archive body** "Archive **{name}**? Data is preserved and can be restored." — same A/B split
  ("¿Archivar a **{name}**? Los datos se conservan y se pueden restaurar.");
- the **Cancel** button (reused `cancel`);
- the dynamic action button — **Restore** (`restoreBtn`) / **Archive** (reused `kebabArchive`).

**+7 new EN/ES keys** (`archiveModalArchiveTitle`, `archiveModalRestoreTitle`, `archiveModalArchiveA/B`,
`archiveModalRestoreA/B`, `restoreBtn`) + 2 reused (`cancel`, `kebabArchive`). Every string carries an
English fallback (`t.key||"…"`).

**Pure display — not the save path.** The `onArchive(client.id)` mutation callback, the `client.archived`
boolean gate driving which branch renders, and all stored payloads are untouched; only displayed text
changed. → autonomous-safe push (matches ISS-61/64/68/69). Build clean; lint 427 (408 err) = baseline
(0 new); EN/ES 2048/2048 (0 asymmetry). **Completes the ISS-68/69 out-of-scope queue** — the
ClientDetail archive/restore modal was the last hardcoded confirmation surface in that batch. Found in
the item-1/4 advisor-surface i18n sweep.

## v0.83.36 — 2026-06-27 — fix(i18n): ExportHoldingsModal body bilingual (ISS-69)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–68 class):** `ExportHoldingsModal`
(`components/clientReports.jsx` — the advisor "Export Holdings → Market Investments" modal opened
from the Investments tab) wired only its title + a few keys (`exportHoldingsTitle`,
`snapCurrentProfile`, `totalValueColon`, `cancel`, `selectOneHolding`); the rest of the modal body
rendered hardcoded English regardless of language. This was the exact out-of-scope item ISS-68 queued
for a later tick. Localized:

- the intro paragraph ("Select holdings and enter their current dollar amounts. Each selected
  holding will be added as a **Market Investment** on the chosen month's snapshot.") — split into
  `expHoldIntroA` + bolded `marketInvestmentWord` + `expHoldIntroB` to preserve the mid-sentence bold;
- the **TARGET MONTH** label (`targetMonthLbl`) and **HOLDINGS** label (`holdingsLbl`);
- the **Select All** / **Clear All** buttons (reused `selectAllVisible` / `clearAll`);
- the "across {n} holding(s)" summary line (`acrossHoldings` with `{n}`/`{u}` tokens +
  `holdingWord`/`holdingsWord` for EN/ES-correct singular·plural — EN holding/holdings,
  ES tenencia/tenencias);
- the dynamic action button "Add to {Profile | month}" (`addToLabel` + `profileWord`).

**+10 new EN/ES keys** + 5 reused. ES aligns to the existing `exportHoldingsTitle` wording
("Tenencias" / "Inversiones de Mercado"). Global-token `.replace()` interpolation.

**Pure display — `apply`/`onSave`/`exportHoldings` payloads, the selection/amount state, the
`current`/snapshot target value, and the SSN-free holding objects untouched → not save path →
autonomous-safe push (matches ISS-61/64/68).** Gates: build clean; lint 427 (408 err) = baseline
(0 new, 0 `no-undef`); EN/ES 2041/2041 (0 asym); node interpolation harness clean (EN/ES plurals
correct, no leftover tokens). Found completing the ISS-68 out-of-scope queue (item-1/4 advisor-surface
i18n sweep).

## v0.83.35 — 2026-06-27 — fix(i18n): hardcoded-English alert()/confirm() browser dialogs bilingual (ISS-68)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–67 class):** every remaining hardcoded-English native
`alert()` / `confirm()` browser dialog rendered English regardless of language — a Spanish advisor
got English confirmation/notification popups. Sibling dialogs were already localized
(`profileModal` `confirmRemoveSvc`/`logoTooLarge`, `admin` `refConfirmRemove`, `portal` revoke,
`clientReports` `tickerReqErr`), so the surface was inconsistent. Localized all of them:

- **`components/clientReports.jsx`** — the "✓ Portfolio included in report." notice
  (`portfolioInclReport`); the three Complete-Report clear confirms (`confirmRemovePortfolio` ×2,
  `confirmRemoveCompare`, `confirmRemoveCalcs`); "Select at least one month." (`selectOneMonth`);
  "Applied to {n} month(s)." (`appliedToMonths`); the two export-holdings notices
  (`addedHoldingsProfile`/`addedHoldingsMonth`); `ExportHoldingsModal`'s "Select at least one
  holding." (`selectOneHolding`).
- **`components/clientCalcs.jsx`** — scenario "Name and Balance required." (reused `nameBalanceReq`);
  the snapshot-saved notice (`snapshotSavedMsg` — distinct from the short `snapshotSaved` button
  label); the two clear-snapshot confirms (`confirmClearSnap`/`confirmClearAllSnaps`).
- **`pages/admin.jsx`** — "Delete this service?" (reused `confirmRemoveSvc`); the permanent
  client-delete confirm (`confirmDeleteClient`).
- **`pages/marketing.jsx`** — "Promotion name is required." (reused `promoNameReq`); "Delete this
  promotion?" (`confirmDeletePromo`).
- **`src/App.jsx`** (`ClientDetail`) — CSV import "Imported!"/"Invalid CSV." (`csvImported`/
  `invalidCsv`); "Copy failed: " prefix on both AI-summary copy handlers (`copyFailed`).

**+17 new EN/ES keys** + 3 reused (`nameBalanceReq`/`confirmRemoveSvc`/`promoNameReq`, present in
both dictionaries). Full-phrase `.replace()` token interpolation (`{n}`/`{m}`/`{x}`/`{name}`).

**WHY:** D-3 is hard-locked — every visible string must exist in both `T.en` and `T.es`. Native
browser dialogs are visible strings; these were the last cluster still bypassing the dictionary.

**Pure display — autonomous-safe push.** Each `confirm()` boolean gate, each mutation payload
(`onUpdate`/`onDelete`/`onSettingsChange`/`parseCSV`), and each `alert()` trigger condition is
**untouched**; only the displayed text changed, each with an English fallback. Not the save path
(matches ISS-61/64 disposition). Gates: build clean; lint 427 (408 err/19 warn) = baseline, 0 new,
0 `no-undef`; EN/ES 2031/2031 symmetric (0 asym); node interpolation harness clean (no leftover
tokens, both languages). Found in the item-1 cross-surface `alert`/`confirm` i18n scan.

## v0.83.34 — 2026-06-27 — fix(i18n): interactive Financial Plan tab bilingual (ISS-67, ISS-66 sub-scope)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–66 class):** the **interactive** `FinancialPlanTab`
(`components/clientReports.jsx`, the advisor-editable "Plan" tab) shared every Strategy-Plan string
with the read-only `PlanReportBlock` localized in v0.83.33 (ISS-66), but rendered them **hardcoded
English regardless of language** — the live editing surface lagged the report/PDF it feeds. Wired
all of them, reusing the 14 ISS-66 keys verbatim:

- `fmtDur` ("Now"/"mo"/"yr" → `durNow`/`moAbbr`/`yrAbbr`) and `addDate` (hardcoded `en-US` →
  `_gaLang()`-locale) now bilingual, mirroring `reportBlocks.jsx` exactly.
- The **"Phase N"** label (`phaseLbl`), the **🗺️ FINANCIAL ROADMAP (editable)** header
  (`financialRoadmapHdr` + new `editableLbl`), the **🎉 Debt Free** callout (`debtFreeFocus`), the
  **DEBT PAYOFF ORDER** "Min {x}/mo" line (`minPerMo`), all three **phase subs** + **note defaults**
  (`phase1/2/3Sub`, `phase1/2/3NoteDefault`; interpolated `{strat}` resolves to localized
  `avalanche`/`snowball`), the **INVESTMENT PROJECTION** row (`startsLbl`/`ofExtraCash`/
  `fivePctYears`/`tenYears`/`twentyYears`/`growthSuffix`), the **"Start now"** badge (`startNow`).
- Editable-UI bits the read-only block lacks: the **Avalanche/Snowball** toggle labels + their
  short hints (new `avalancheHint`/`snowballHint`), the per-phase **✏️ Edit**/Cancel/Save-Note
  buttons (reused `editLabel`/`cancel`/`saveNoteBtn`) + empty-note prompt (new `clickEditRec`), the
  **ADDITIONAL NOTES / RECOMMENDATIONS** header (`additionalNotesRecsHdr.toUpperCase()`) + empty
  state (new `noAddlNotes`), and the **CLIENT GOALS** block (new `clientGoalsHdr` + `goalShortTerm`/
  `goalMidTerm`/`goalLongTerm`/`goalsLbl`, reused `noGoalsSet`/`saveGoalsBtn`).

**WHY:** D-3 hard-lock — a Spanish advisor/client saw an English plan-editing UI even though the
PDF it produces was already bilingual (ISS-66). **+10 new EN/ES keys** + 14 reused ISS-66 keys.
**Pure display — the plan math (`calcPayoff`/`investFV`/`effectiveMin`) and the `onUpdate` save
payloads (`planOverrides`/`planStrategy`/`notes`) are untouched; localized strings are defaults/
labels never persisted (drafts initialize from `override||""`, goals save by key not label) → not
the save path → autonomous-safe push.** **CHANGED:** `src/translations.js` (10 keys ×EN/ES),
`src/components/clientReports.jsx` (26 display edits), `src/App.jsx` (marker). Gates: build clean;
lint 408 err/19 warn = baseline (0 new); EN/ES 2014/2014.

## v0.83.33 — 2026-06-26 — fix(i18n): Strategy Plan report/PDF block bilingual (ISS-66)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61–65 class):** `PlanReportBlock`
(`components/reportBlocks.jsx`) — the **Strategy Plan** block rendered in the Monthly Report tab,
the Financial-Statement Report tab, and the Full Report (so it ships in the **client-facing PDF
report**) — wired only the KPI labels + strategy-caption keys; the entire roadmap body rendered
**hardcoded English regardless of language**. A Spanish-speaking client received an English strategy
plan. Localized every remaining string:

- The **"Phase N"** label (reused `phaseLbl`), the **🗺️ FINANCIAL ROADMAP** header (reused
  `financialRoadmapHdr`), the **🎉 Debt Free** callout, the **DEBT PAYOFF ORDER** per-debt
  "Min {x}/mo" line, all three **phase subs** (Pay Off Debt / Build Emergency Fund / Invest), all
  three **phase note defaults** (the coaching prose shown when the advisor hasn't typed an override),
  the **INVESTMENT PROJECTION** row ("starts … · …% of extra cash", the 5/10/20-year labels,
  "growth"), the **"Start now"** badge, and the **📝 Additional Notes / Recommendations** header.
- **`fmtDur`** ("Now"/"mo"/"yr" → `durNow`/`moAbbr`/`yrAbbr`) and **`addDate`** (hardcoded `en-US`
  locale → `_gaLang()`-driven, so month abbreviations localize) are now bilingual.
- The interpolated `{strat}` word ("avalanche"/"snowball") resolves to the localized `avalanche`/
  `snowball` key rather than the raw English strategy slug.

**+11 EN/ES keys** (`debtFreeFocus`, `minPerMo`, `applyingExtraSub`, `phase1NoteDefault`,
`phase2Sub`, `phase2NoteDefault`, `phase3Sub`, `startNow`, `phase3NoteDefault`,
`additionalNotesRecsHdr`, `durNow`); **reused 14 pre-staged keys** (`phaseLbl`,
`financialRoadmapHdr`, `avalanche`/`snowball`, `startsLbl`, `fivePctYears`/`tenYears`/`twentyYears`,
`growthSuffix`, `ofExtraCash`, `moAbbr`/`yrAbbr`, plus the already-wired KPI/strategy keys). The
full-phrase keys use global-token `.replace()` interpolation (`{amt}`/`{n}`/`{dur}`/`{strat}`/
`{pct}`/`{s}`/`{r}`).

**Pure display — no plan math (`calcPayoff`/`investFV`/`effectiveMin`), no stored payloads, no save
path touched → autonomous-safe push.** Gates: build clean; lint 427/408 = baseline (0 new); EN/ES
**2004/2004**; node symmetry+interpolation harness clean (zero asymmetry, zero leftover tokens).
**Remaining sub-scope (next tick):** the interactive `PlanContent` (`clientReports.jsx`) shares the
same strings — the keys added here are reused there. Found in the item-1/4 report-surface i18n scan.

## v0.83.32 — 2026-06-26 — fix(a11y+i18n): chart accessible names bilingual (ISS-65)

**FIX (WCAG 4.1.2 accessible-name + D-3 bilingual — ISS-41 a11y class):** four pure-SVG chart
primitives in `components/charts.jsx` carried **hardcoded-English `aria-label`s** — `Waterfall`
("Cash flow waterfall"), `SmoothAreaLine` ("Trend line chart"), `RankedHBars` ("Ranked horizontal
bars"), `Radar5` ("Radar chart"). These are the accessible name a screen reader announces for the
`role="img"` SVG, so the chart's name stayed English even in Spanish (an a11y + i18n gap). Also
`profileModal.jsx` had two hardcoded `title` tooltips on the Stripe-link status dots ("Stripe link
set" / "No Stripe link").

- **Charts:** none of the four components receive `t` (shared primitives — the ISS-41 footgun).
  Added a **local `gaLabel(key,fallback)`** to `charts.jsx` that resolves the label from the active
  `document.documentElement.lang` (kept in sync with the language state since v0.83.12), identical to
  the helper in `primitives.jsx`. Defined locally rather than imported because `primitives.jsx`
  already imports from `charts.jsx` — importing back would create a circular dependency. `charts.jsx`
  now imports `T` from the pure-data `../translations` module (no cycle).
- **profileModal:** `t` is already in scope (`t.svcUnnamed`), so the two tooltips use `t.stripeLinkSet`
  / `t.noStripeLink` directly.

**+6 EN/ES keys** (`chartCashFlowWaterfall`, `chartTrendLine`, `chartRankedBars`, `chartRadar`,
`stripeLinkSet`, `noStripeLink`). **Pure display — no chart data, geometry, or save path touched →
autonomous-safe push.** Guard: `golden-anchor-logic` not implicated (no money/role/RLS/SSN). Gates:
build clean (530ms); lint 427/408 = baseline (0 new); EN/ES symmetry 1993/1993; node resolver harness
confirms EN/ES + fallbacks. Found in the item-4 a11y/i18n attribute scan (charts/profileModal).

**CHANGED:** `src/components/charts.jsx`, `src/components/profileModal.jsx`, `src/translations.js`,
`src/App.jsx` (build marker).

## v0.83.31 — 2026-06-26 — fix(i18n): Export Clients modal bilingual (ISS-64)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61/62/63 class):** `ExportModal` (`components/clientData.jsx`)
— the advisor "Export Clients" modal — wired only its **title** + the search input through `t`;
every other body string rendered hardcoded English regardless of language. Localized:

- **Format section:** the "Format" group label; both format tiles — "💾 Full Backup (.json)" +
  "Includes all financial data, snapshots — re-importable", "👤 Profile CSV" + "Names, email,
  phone, DOB — importable as CRM profiles" (emoji kept in JSX, text in keys, mirroring the title's
  `"⬇️ "+t.exportClientsTitle` pattern).
- **Which-clients section:** the "Which clients" group label; the "All Active" / "Select Clients"
  mode toggle; the "All" / "None" selection buttons (reused `t.impAll`/`t.impNone`); the
  "{n} selected" count (global-token `.replace()`).
- **Footer:** "Cancel" (reused `t.cancel`); the dynamic action button "💾 Export Backup" /
  "📄 Export CSV" (emoji in JSX). The busy state already used `t.preparingBackup`.

**+11 EN/ES keys** (`expFormatLbl`, `expFullBackup`, `expFullBackupDesc`, `expProfileCsv`,
`expProfileCsvDesc`, `expWhichClients`, `expAllActive`, `expSelectClients`, `expNSelected`,
`exportBackupBtn`, `exportCsvBtn`); reused `exportClientsTitle`/`preparingBackup`/`searchPh`/
`searchClientsPh`/`impAll`/`impNone`/`cancel`.

**The CSV column-header row (`Name,Email,Phone,DOB,Address,SSN,Type,Referred By`) stays English on
purpose** — it is a data-interchange format consumed on re-import (Profile CSV → CRM profiles);
translating it would break the round-trip. **Pure display — `doExport`, the CSV row builder, the
`c.social` (SSN) field, and the export payloads are untouched → not the save path → autonomous-safe
push (matches ISS-61/62/63).** SSN guard (`golden-anchor-logic §2/§6`) consulted: this is advisor-side
export of the advisor's own client data (SSN they already own), distinct from the portal where SSN
never leaves the server — the i18n change touches no SSN handling. **Completes the `clientData.jsx`
advisor-surface i18n sweep** (ImportWizard/BackupImportModal/Duplicate/Delete already done).

**Gates:** build clean; lint 427/408 = baseline (0 new); EN/ES **1987/1987**; node interpolation
harness clean (`{n}` → "3 selected" / "3 seleccionados"). Found in the item-1/4 advisor-surface
i18n scan.

## v0.83.30 — 2026-06-26 — fix(i18n): Import Wizard fully bilingual (ISS-63)

**FIX (D-3 bilingual — ISS-30–33/55/57/58/61/62 class):** `ImportWizard` (`components/clientData.jsx`)
— the advisor multi-step "Import Client Data" flow — wired only its step **titles** and a handful of
helper keys through `t`; **~30 hardcoded-English body strings across all six steps rendered regardless
of language.** Localized every step:

- **choose:** the three import-type tiles (Financial Excel File / CRM Client List / Link Both) titles
  + descriptions.
- **upload:** the modal title ("Upload File"/"Upload Files"), "EXCEL FILE (.xlsx)" + "CRM CSV FILE" /
  "OPTIONAL: CRM CSV FILE" headers, "{n} months found", "{n} clients found", the
  "Couple:"/"Single:" prefix, the "cards · bills · income streams" unit line, "Back", "Skip CSV →".
- **names:** "Names detected from the file — edit as needed.", "Partner (detected in file)", the
  "{name} Color" picker labels, "Back".
- **cards:** the couple/single ownership hint, the "Joint" option label (reused `t.joint`), "Back".
- **csv_pick:** "Select ONE client to link…" / "Select which clients to import:", the All/None
  buttons, "{s} of {n} selected" / "1 client selected" / "Select 1 client to link", the dynamic
  action button ("Import {n} Client{ps}" / "Link & Continue →" / "Select 1 to link"), "Back".
- **confirm:** the "{n} months of data / credit cards / bills / /mo income" summary grid units,
  "Profile linked:", the "Accounts, loans, and physical assets are not in the Excel…" note, the
  duplicate-name warning (pre/post bold split), "✅ Import Client", "Back".

**+42 new EN/ES keys** (reused `back`/`continueArrow`/`joint`/`firstName`/`lastName`/`partnerFirst`/
`partnerLast`/`whatImport`/`parsingMonths`/`clickSelectXlsx`/`clickSelectCsv`/`googleSheetsExport`/
`noClientsMatch`/`searchClientsPh` + the step-title keys already present). Global-token `.replace()`
pluralization (`{n}`/`{s}`/`{ps}`) keeps one key/language correct singular+plural in both EN+ES.

**WHY:** D-3 hard-lock — every visible string must exist in both `T.en` and `T.es`. The Import Wizard
was the last large advisor surface still rendering English-only body copy.

**SCOPE — pure display, NOT the save path:** only JSX text nodes/labels were rewired; the import logic
(`doImport`, `parseWorkbook`, `mig`/`mk` blob construction, `onImport` payloads, the `'Unnamed'`/
`'Client'` data fallbacks) is byte-for-byte unchanged → autonomous-safe push (matches ISS-57/58/61/62).

**Gates:** build clean; lint 427/408 = baseline (0 new); EN/ES symmetry 1976/1976; node interpolation
harness clean (no leftover tokens; EN/ES singular+plural correct). **Remaining sub-scope (future tick):**
`ExportModal` (SSN CSV export → needs `golden-anchor-logic` guard). Found in the item-4 advisor-surface
i18n scan.

## v0.83.29 — 2026-06-26 — fix(i18n): Restore-Backup modal bilingual (ISS-62)

**FIX (D-3 bilingual — ISS-58/61 class):** `BackupImportModal` (`components/clientData.jsx`) — the advisor
backup-restore flow — wired only its **title** through `t?.restoreBackupTitle` and the search placeholder;
**all other body text rendered hardcoded English** regardless of language. Localized:

- The "Invalid backup file. Must be a Golden Anchor .json backup." validation error (`setErr`).
- The "N clients in backup" count + "From {date}" stamp on the file-drop card, and the
  "Select .json backup file" prompt.
- The mode toggle ("🔄 Restore (select clients)" / "⚠️ Replace All"), the **Select All / Clear** buttons.
- Per-client badges ("⚑ exists — will update" / "new"), the "Nmo" snapshot suffix.
- The restore summary line ("S of N selected · U will update · A will be added"), the
  "⚠️ Replace All will permanently delete…" warning, the "{name} · {n} months" replace-list rows.
- The **Cancel** + the dynamic action button ("⚠️ Replace All" / "✅ Restore N Clients").

**+12 new EN/ES keys** (reused `cancel`/`clear`/`months`/`selectAllVisible`/`searchClientsPh`/
`restoreBackupTitle`). Count/plural interpolation uses the established global-token `.replace()` pattern
(`{n}`/`{s}`/`{u}`/`{a}` counts, `{ps}` plural suffix driven by `count!==1`, `{d}` date) — one key/language
stays correct singular+plural. **Pure display — the restore/replace import logic, stored payloads, and
`onImport(...,"restore"/"replace")` calls are untouched** → not the save path → autonomous-safe push
(matches ISS-57/58/61). `ExportModal` (SSN CSV → needs the `golden-anchor-logic` guard) + `ImportWizard`
steps remain for future ticks.

**Gates:** build clean; lint 427/408 = baseline (0 new); EN/ES 1934/1934; node interpolation harness clean
(no leftover tokens, EN/ES plurals correct singular+plural). Found in the item-4 advisor-surface i18n scan.

**CHANGED:** `src/components/clientData.jsx` (14 string sites), `src/translations.js` (+12 EN/ES keys),
`src/App.jsx` (build marker), `CHANGELOG.md`, `docs/ISSUES_LEDGER.md`, `docs/STATE.md`.

## v0.83.28 — 2026-06-26 — fix(i18n): client-management confirmation modals bilingual (ISS-61)

**FIX (D-3 bilingual — ISS-58 class):** the advisor data-management modals in `components/clientData.jsx`
wired their **titles** through `t?.x||…` but rendered **all body content hardcoded English** regardless of
language. This batch localizes the two client-management **confirmation** modals (the destructive/decision
surfaces shown most prominently):

- **DuplicateResolverModal** — the "Found N possible duplicates and M new clients…" summary, the
  "POSSIBLE DUPLICATES" header, the 📥 Incoming / 📂 Existing column captions, the `partner:` inline label,
  the three action buttons (🔄 Merge (update empty fields) / ⏭️ Skip / ➕ Import as New), the
  "N new clients will be imported." line, and the Cancel / Apply footer.
- **DeleteClientModal** — "⚠️ This action is permanent", the "All data for {name} including {n} months of
  snapshots will be permanently deleted. This cannot be undone." warning, Cancel, and 🗑️ Delete Forever.

**+14 new EN/ES keys** (reused `cancel`). Pluralization/number interpolation done with a global-token
`.replace()` pattern (`{n}`/`{m}` counts; `{ps}`/`{ms}`/`{pe}`/`{mv}` plural/verb suffixes all driven by
`count!==1`) so one key per language stays correct across singular and plural — EN duplicate→duplicates,
ES posible→posibles / duplicado→duplicados / cliente→clientes / nuevo→nuevos / mes→meses, verb
importará→importarán. The `<b>{name}</b>` emphasis is preserved by splitting the delete warning into a
pre-name (`deleteClientWarnA`) and post-name (`deleteClientWarnB`) fragment.

**WHY:** D-3 hard-locks EN/ES symmetry for every visible string; these advisor modals violated it for their
bodies. **Pure display** — stored `onSave`/import payloads, the delete/merge logic, and all save paths are
untouched (only labels + fallbacks changed) → autonomous-safe push (matches ISS-57/58). **Remaining
sub-scope (clientData.jsx, future ticks):** `BackupImportModal`, `ExportModal` (touches SSN CSV export →
needs the `golden-anchor-logic` SSN guard), and the `ImportWizard` step screens.

**Gates:** build clean; lint 427/408 = baseline (0 new); EN/ES symmetry 1922/1922; node interpolation
harness verified no leftover `{tokens}` and correct EN/ES pluralization in both singular and plural.
**CHANGED:** `src/components/clientData.jsx` (12 string sites, 2 modals), `src/translations.js` (+14×2 keys),
`src/App.jsx` (marker). Found in the item-4 (website/UX) advisor-surface i18n scan.

## v0.83.27 — 2026-06-26 — fix(reports): Cash Flow Statement + Full Report per-card debt-service uses canonical effectiveMin (ISS-59)

**FIX (money / display — ISS-56 class):** two report surfaces in `components/clientReports.jsx` itemized
the per-card minimum from **raw `c.min`** while their own footer/total used canonical `sumMin`
(= Σ `effectiveMin`), so the breakdown rows did not reconcile to the total directly below them:

- **CashFlowStatement (`:156`)** — the "DEBT SERVICE" list filtered `c.min>0` and showed `value={c.min}`,
  sitting immediately above "Total Debt Service" = `minD` (`sumMin`).
- **FullReport (`:307`)** — the per-card "Min Pay" column showed `fmtD(c.min)` while the table footer
  showed `fmtD(minD)` (`sumMin`).

Four divergence modes (per `golden-anchor-logic §3` `effectiveMin` = `balance>0 ? min(balance, max(25,
min ?? derived)) : 0`): (1) card with a balance but **unset** `min` → row **hidden** yet counted in the
total; (2) **paid-off** card with a stale `min>0` → **phantom** row for a $0-balance card; (3) min below
the **$25 floor** shown raw; (4) min **above balance** shown uncapped. Fix: both surfaces use
`effectiveMin(c)` for the filter and the value. **Pure display — not the save path** (NMModal/monthlyRows
already use `sumMin`; the raw-min save-path snapshot is the separate ⛔ ISS-48). node harness
`scratchpad/iss_cfmin.mjs` (4 cases): OLD rows sum $205 ≠ $230 footer → NEW rows sum $230 = footer.
Gates: build clean; lint 427/408 = baseline (0 new); no new strings (EN/ES symmetry unchanged). Found in
the item-1 `clientReports.jsx` raw-`.min` correctness scan.

## v0.83.26 — 2026-06-26 — fix(i18n): full bilingual sweep of clientModals.jsx (ISS-58)

**FIX (D-3):** ISS-57 fixed the owner dropdowns in `components/clientModals.jsx` but left **~30 other
hardcoded-English strings** scattered across the same data-entry modals — visible English regardless of
the language toggle. This is the same omission class as ISS-30–33 / ISS-55 / ISS-57 (hardcoded English in
Phase-2-extracted components). All instances are **pure display** (modal titles, field labels,
placeholders, footer copy, and validation/alert messages); the stored `onSave` payloads, the `np.label||
"Promo"` stored default, and the `/mo` abbreviation are untouched.

**CHANGED — `clientModals.jsx`:**
- **Modal titles (edit case):** `${t.editLabel} Card/Account/Loan/Bill/Asset` → `${t.editLabel} ${t.card/
  account/loan/bill/asset}` (mirrors `IncomeModal`'s existing `${t.editLabel} ${t.income}` pattern).
- **CardModal:** the 4 promo-validation `setErr(...)` messages, the save-time over-balance error, the
  "Suggested:" hint, the "Limit ($)" field label, the "(1-31, optional)" due-day hint, the "e.g. 15"
  placeholder, the "No promotional rates. All balance at {apr}% APR." empty state, the "at … % APR · ends
  …" promo-list line, the "e.g. Balance Transfer" placeholder, and the "Add" promo button — all wired to
  `t`.
- **IncomeModal:** footer "Annual:" → `{t.annual}:`.
- **AccountModal:** "e.g. Chase Checking" placeholder + the liquid/investment/household asset-class
  caption ("Liquid — counts toward Emergency Fund" / "Investment asset" / "Household asset").
- **LoanModal:** "e.g. Honda Accord" placeholder.
- **AssetModal:** "Equity:" / "Gain:" inline labels.
- **SplitAssignModal:** the "Personal items automatically go to their owner…" note, the per-bill "Day"
  label, and the "{n} items" tallies.
- **JoinModal:** "becomes Person 1. Select Person 2:" sentence + the "Select a client first." alert.

**TRANSLATIONS:** +27 new keys in **both** `T.en` and `T.es` (`card`, `account`, `loan`, `bill`, `asset`,
`promoBalReq`, `promoBalGtTotal`, `promoBalsExceed`, `suggestedColon`, `dueDayHint`, `egDueDayPh`,
`noPromoRates`, `atLbl`, `endsLbl`, `egPromoPh`, `addBtn`, `liquidEmergency`, `investmentAsset`,
`householdAsset`, `egAcctPh`, `egLoanPh`, `equityColon`, `gainColon`, `splitAutoNote`, `joinBecomesP1`,
`selectClientFirst`, `itemsLbl`); reused existing `editLabel`, `annual`, `dayLbl`, `limitField` (the last
two already existed — the initial insert duplicated them and `no-dupe-keys` caught it; dupes removed).

**SAFETY/GATES:** pure display, not the save path → autonomous-safe push (same disposition as ISS-57).
Build clean; lint 427/408 = baseline (0 new); EN/ES symmetry 1908/1908. Found in the item-1
`clientModals.jsx` i18n correctness scan (2026-06-26).

## v0.83.25 — 2026-06-26 — fix(i18n): owner-dropdown labels in Card/Account/Loan modals bilingual (ISS-57)

**FIX (D-3):** `CardModal`, `AccountModal`, and `LoanModal` (`components/clientModals.jsx`) built their
person/owner `<select>` options from **hardcoded English** — `[["joint","Joint"],["p1",
client?.firstName||"Person 1"],["p2",client?.partnerFirst||"Person 2"]]` — so the "Owed by" / "Owner"
dropdown rendered **"Joint" / "Person 1" / "Person 2" in English regardless of language**. The sibling
`IncomeModal` and `BillModal` already wire these to `t.joint`/`t.p1`/`t.p2`, so the same data-entry
surface was inconsistent: an income's person dropdown localized, a card's owner dropdown did not. Same
class as ISS-30–33 / ISS-55 (hardcoded English in extracted components). Also: `CardModal.save` raised a
bare `setErr("Name required.")` while every sibling modal uses `t.nameReqErr||"Name required."`.

**CHANGED:**
- `clientModals.jsx` — all three owner dropdowns now read `t?.joint||"Joint"`,
  `client?.firstName||t?.p1||"Person 1"`, `client?.partnerFirst||t?.p2||"Person 2"` (mirrors
  Income/Bill modals; English literal kept as a final defensive fallback).
- `clientModals.jsx` — `CardModal` "Name required." validation now reuses `t.nameReqErr`.
- `App.jsx` — build marker → `2026-06-26-v08325-modal-owner-dropdown-i18n`.

**SCOPE / SAFETY:** Pure display wiring — the stored values (`owedBy`/`owner` = `"joint"`/`"p1"`/`"p2"`)
are unchanged; only the option **labels** localize. **Not the save path** → autonomous-safe push.
**Zero new translation keys** — reused `joint`/`p1`/`p2`/`nameReqErr`, all already present in both `T.en`
and `T.es` → EN/ES symmetry unchanged by construction. Found in the item-1 `clientModals.jsx` i18n scan
(continuation of the ISS-55 D-3 sweep).

**GATES:** build clean (565ms); lint 427/408 = baseline (0 new); no new strings (EN/ES symmetry intact).

## v0.83.24 — 2026-06-26 — fix(reminders): client "Card Min" reminder uses canonical effectiveMin (ISS-56)

**FIX:** `getClientRem` (`utils/finance.js:87`) — the **client-side** reminder engine that feeds the
dashboard "Client Due" panel — gated and displayed the per-card "Card Min" reminder from **raw `cc.min`**
(`if(cc.min>0)` … `amount:cc.min`) instead of canonical `effectiveMin(cc)` (golden-anchor-logic §3:
`balance>0 ? min(balance, max(25, min ?? round(1%·bal + moInt))) : 0`). The **advisor** path (`getAdvRem`
highDSR) already uses `sumMin`/`effectiveMin`, so the two reminder surfaces disagreed on the same data.

**Four divergences (node harness `scratchpad/iss56.mjs`, 5 cases):**
- **Real reminder hidden** — a card with a balance but no stated `min` (`min:0`) had no reminder emitted,
  even though a minimum is genuinely due (`effectiveMin` computes 1%·balance + interest).
- **Phantom reminder shown** — a paid-off card (`balance:0`) with a **stale** `min` still emitted a
  "Card Min" reminder for a $0-balance card (`effectiveMin` returns 0 → now correctly suppressed).
- **Below-$25 floor** — a stated `min` of $10 displayed `$10`; canonical floors to `$25`.
- **Min exceeds balance** — a $200 stated min on a $40 balance displayed `$200`; canonical caps at the
  balance (`$40`).

**Fix:** `const em=effectiveMin(cc); if(em>0) … amount:em` (one-line; `effectiveMin` already in module
scope, `finance.js:48`). Same divergence class as ISS-45/46/48/50 (raw `card.min` vs `effectiveMin`),
here in the client reminder surface.

**Scope/safety:** pure read-only **display** derivation (the panel sorts/filters/dismisses; the dismissal
key is `cardDue:{cid}:{cardId}:{YYYY-MM}`, **independent of the amount**, so existing dismissals are
unaffected). **NOT** the save path → autonomous-safe push (same disposition as ISS-44, which fixed
`getClientRem` date math in v0.83.16). No new visible string (`amount` renders through existing `fmt`;
`task:"Card Min"` unchanged) → no EN/ES change.

**Gates:** build clean (446ms); lint 427 problems / 408 errors = baseline, 0 new; EN/ES symmetry
unchanged. Found in the item-1 `utils/finance.js` reminder-engine correctness scan (2026-06-26).

## v0.83.23 — 2026-06-26 — fix(i18n): Market Investments section + modal now bilingual (ISS-55, D-3)

**FIX:** `MarketInvestmentsSection` and `MarketInvestmentModal` (`components/clientSections.jsx`) rendered
several visible strings in **hardcoded English** only, violating D-3 (bilingual EN/ES is launch-required).
The advisor's Savings → Market Investments editor showed English text regardless of the user's language.

**Strings wired to `T` (7 keys, EN+ES added to `src/translations.js`):**
- Modal title `Edit / Add Market Investment` → `t.editMarketInv` / `t.addMarketInv`
- "＋ Add Investment" button → `t.addInvestment`
- Empty state "No market investments yet…" → `t.noMarketInv`
- Footer "Value:" / "Gain/Loss:" → `t.valueColon` / `t.gainLoss`
- Inline "{n} shares" unit → `t.sharesUnit`
- The "Ticker and name required." save alert now uses the **already-existing** `t.tickerNameReq`
  key (was hardcoded despite the key existing) — no new key needed.

**WHY:** Same omission class as ISS-30–33 (calculator hardcoded-English, fixed v0.83.10) — the section
was only partially internationalized (header used `t.marketInvestments`, the rest did not). The modal's
field/category keys (`tickerField`, `catUSLarge`, …) already existed; only these surface strings lagged.

**CHANGED:** `src/components/clientSections.jsx` (6 edits, display-only — no save-path, no money/role
logic touched), `src/translations.js` (+7 keys × EN/ES = symmetric 1881/1881), build marker
→ `v08323-market-investments-i18n`. Gates: build clean; lint 408 errors (no new vs baseline); EN/ES
symmetry verified. Pure display i18n, not the live save path → autonomous-safe push. Found in the
item-1 `clientSections.jsx` correctness/i18n scan (2026-06-26 cruise tick).

## v0.83.22 — 2026-06-26 — fix(portal): asset-allocation donut no longer double-counts property (ISS-54)

**FIX:** The share-portal overview (`pages/portal.jsx`, the `/portal?token=…` page) and the linked-client
`LinkedOverview` both computed the "Property & assets" donut slice (`propV`) as
`[].concat(c.customAssets||[], c.properties||[])` — i.e. the **union** of both arrays. But `customAssets`
and `properties` are **mutually-exclusive aliases**: `getProperties(c)` (`utils/finance.js:59`) picks
`properties` when non-empty, else falls back to `customAssets`, and canonical `totalA` counts
properties-**or**-customAssets **once, never both** (`golden-anchor-logic §6`, stated verbatim).

**WHY it mattered:** the donut's center value is canonical `totalA(c)`, but a slice that unions both arrays
overstates property value whenever `c.properties` is non-empty — so the allocation slices won't reconcile
to the donut's own center total. Reachable for any ISS-49-class legacy blob whose `properties` was frozen
non-empty (the slice sums to ~2× the property value), and it would become **universal** for every client
with custom assets once the recommended ISS-49 `mig` fix lands (which makes `properties` always equal
`customAssets`). Same root as ISS-49 (the `properties`/`customAssets` alias) but a distinct,
independent **display double-count**.

**CHANGED:** both `propV` derivations now use canonical `getProperties(c)` (added to the `utils/finance`
import) — exactly the chooser `totalA` uses, so the slices reconcile to the donut center. Pure display
derivation on sanitized/linked read data — **not** the save path. node harness (`scratchpad/iss54.mjs`,
replicates the exact code): fresh client (`properties:[]`) unchanged; legacy non-empty `properties` $200k
home → current slices sum $480k vs canonical $280k center (−$200k double-count) → fixed reconciles to
$280k; post-ISS-49-fix world → fixed reconciles $685k vs current $1.29M. No new visible strings (slice
labels already EN/ES — D-3 N/A). Found in the item-1 portal/LinkedOverview correctness scan.

## v0.83.21 — 2026-06-26 — fix(aiExport): market investments now itemized in the AI client export (ISS-52)

**FIX:** The AI-readable client export (`utils/aiExport.js`, `gaClientAIText`) never listed the client's
**market investments**. Its "Investments" section keyed on `c.investments` and "Physical assets" on
`c.physicalAssets` and "Portfolio model" on `c.portfolio` — **none of which exist** in the data model
(`golden-anchor-logic §6`: the canonical fields are `c.marketInvestments`, `c.customAssets`, and
`c.savedPortfolio`). So both guessed sections never fired.

**WHY it mattered:** `marketInvestments[].value` IS counted in canonical `totalA` (the "Total assets"
metric the export prints), so the export showed a Total-assets number that the AI could not reconcile
against the itemized holdings — e.g. $68k total assets but only $8k of assets actually listed, the $60k
of stock/crypto holdings invisible. Same omission class as ISS-36 (aiExport wrong field) and ISS-47/50
(marketInvestments dropped from asset totals).

**CHANGED:** rewrote the Investments section to read `c.marketInvestments` (ticker — name, value, category,
shares, cost basis, gain/loss) and `c.savedPortfolio` (model name + holding count); dropped the dead
`c.physicalAssets` branch (customAssets are the physical assets — now surfaced with their `cat` under
"Accounts & savings"). Pure read-only export serialization — **not** the save path. node harness
(`_aiexport_harness.mjs`, replicates the section verbatim): current omits $60k MI → fixed itemizes both
holdings and the listed assets reconcile exactly to `totalA` ($68k). English-only AI-prompt content (no
new translation keys — D-3 N/A). Found in the item-1 `utils/aiExport.js` correctness scan.

## v0.83.20 — 2026-06-26 — fix(summary): SummarySection uses effectiveMin + includes marketInvestments

`SummarySection` (the advisor's **Summary** report tab, `clientReports.jsx:52`) was the last report
surface still using the **raw, non-canonical** money basis that ISS-46/ISS-47 already fixed elsewhere.
Two recurrences (ISS-50):
- **Min debt service** (`:60`) summed **raw `c.min`** (`Σ c.min`) instead of canonical `Σ effectiveMin(c)`.
  `mnd` feeds the Summary's **DSR**, **cash flow**, the **Min Pay KPI**, the "Where Income Goes" pie, and
  the DSR-based recommendation text — all diverged from `golden-anchor-logic §3` for no-min cards
  (under-counted), **paid-off cards carrying a stale `min`** (over-counted), and below-$25-floor mins.
  This also contradicted the Financial-Statements DSR on the very next tab (canonical since ISS-46).
- **Total assets** for the Health-Score radar (`:72`) computed `totA = liquid + non-liquid accounts +
  customAssets` and **omitted `marketInvestments`** (ISS-47 class). `totA` drives the radar's **D/A axis**
  (`radarVals[3]=1−dta/0.8`) → DTA overstated → health understated for any client holding market
  investments.
- **Fix:** `mnd` → `Σ effectiveMin(c)` (preserves the p1/p2 view filtering); `totA` → `+ Σ
  marketInvestments.value`. Both are pure display derivations in a report component — **not** the save
  path (NMModal already saves `sumMin`; `saveHistoricalUpdate`'s raw-min path is the separate ⛔attended
  ISS-48). No new strings (numeric only) → D-3 N/A. node harness (`iss50.mjs`): raw `mnd 160 → 125`,
  `totA 491k → 611k` (+120k MI). Build clean, lint 427 (0 new).

## v0.83.19 — 2026-06-26 — fix(statements): totalA includes marketInvestments in RatioContent + balance sheet

`RatioContent` (Financial Statements → Ratios, `clientReports.jsx:189`, also the Full Report) and the
**Balance Sheet** of `FinancialStatementsTab` (`:190-191`) computed `totalA` as **accounts + customAssets
only** — `marketInvestments` was omitted from both. (ISS-47.)
- **Why it's wrong:** `golden-anchor-logic §3` defines `totalA = Σaccounts + Σproperties(=customAssets
  fallback) + ΣmarketInvestments`, and the sibling `AssetsLiabilitiesTab` (`:562/:566`) already includes
  `miAcct` correctly. Effect for any client holding market investments: the **Total-Assets KPI**, **Net
  Worth**, and the **debt-to-assets (DTA) ratio** were all understated, and the holdings didn't even appear
  as a balance-sheet line — contradicting the Summary/Full Report (which call canonical `totalA()`) and the
  A/L tab on the same screen.
- **FIX:**
  - `RatioContent`: `tA` now adds `Σ marketInvestments.value`, view-scaled by the same `_vMul`
    (1 for Both / no-partner, 0.5 for a single-person filter) already applied to `customAssets`.
  - `FinancialStatementsTab`: new `miA` (gated to the Both/no-partner view like its `customAssets`) folded
    into `tA = curA+invA+miA+hhA`; market-investment holdings now render as `📈 {ticker} {name}` rows inside
    the existing **Investment Assets** section, and the **Total Investment** subtotal is `invA+miA` so the
    section reconciles with the rows shown.
- **WHY:** objective money-display correctness bug found in the 2026-06-26 cruise item-1 deep scan of the
  financial-statement derivations (same scan as ISS-45/46). **Pure presentation — does not touch the live
  save/load path.** Folded into the existing `Investment Assets` section, so **no new visible strings**
  (ticker/name are client data, the header already uses `t.investmentAssets`) → D-3/EN-ES not engaged.
- **VERIFIED:** node harness (accounts 10k liquid + 50k brokerage, customAssets 300k, MI 25k VOO + 8k BTC,
  liabilities 205k): both derivations `360k → 393k` (= canonical `totalA`); DTA `56.94% → 52.16%`; Net Worth
  `155k → 188k`; the Total-Investment subtotal `83k` reconciles with its three displayed rows; RatioContent
  and the Balance Sheet now agree on the same screen. Build clean (448ms); full-repo lint **427 problems
  (0 new vs baseline)**. **Owner eyeball (optional):** open a client holding market investments → Financial
  Statements → Balance Sheet — the MI holdings now appear under Investment Assets and Total Assets / Net
  Worth match the A/L tab and the Summary.

## v0.83.18 — 2026-06-26 — fix(ratios): DSR numerator uses effectiveMin, not raw card min

`RatioContent` (Financial Statements → Ratios card, `clientReports.jsx:189`; also the Full Report
"Financial Ratios" section, `:311`) computed the **debt-service ratio numerator** from the raw stored
`card.min` field — `minD = cards.reduce((s,c)=>s+(+c.min||0),0)` — instead of the canonical
`effectiveMin(card)`.
- **Why it's wrong:** `golden-anchor-logic §3` defines DSR's debt payments as `sumMin = Σ effectiveMin`,
  and `effectiveMin = balance>0 ? min(balance, max(25, min ?? round(1%·bal + monthly interest))) : 0`.
  The raw-`min` path diverges in three real cases: (a) a card with **no stated min** contributes `0` here
  but a computed floor everywhere else → DSR **understated**; (b) a **paid-off card** (balance 0) carrying
  a stale `min` value contributes that min here but `0` elsewhere → DSR **overstated**; (c) a `min`
  **below the $25 floor** is undercounted. The same `minD` also feeds the RSR card's available-cash base
  (`net − bills − minD`), so that drifted too.
- **The contradiction:** the **Cash Flow Statement** in the *same* Financial-Statements tab
  (`clientReports.jsx:144`) already uses `sumMin(client.cards)` for its DSR, as do the live/historical
  ratio snapshots in Compare (`getSnap`, `:750`/`:752`, via `sumMin`/`effectiveMin`). So one client could
  see two different DSR values on adjacent sections of the same screen — the same ISS-45 class of a
  `clientReports` display derivation drifting from the canonical model.
- **FIX:** `minD = cards.reduce((s,c)=>s+effectiveMin(c),0)` (`effectiveMin` was already imported). One
  expression; `currentRatio`/`dta`/`efr` denominators (card *balances*, not mins) are untouched.
- **WHY:** objective display-correctness bug found in the cruise item-1 deep scan of the financial-statement
  derivations. **Pure presentation — does not touch the live save/load path**; the ratio numerator is the
  only thing that changes, no money is persisted. No new visible strings, so D-3/EN-ES is not engaged.
- **VERIFIED:** node harness (net $5k) — no-min $4k@24% card: DSR `0% → 2.4%`; paid-off card w/ stale
  min=35: `0.7% → 0%`; below-floor min=10: `0.2% → 0.5%`; normal min=120: `2.4%` unchanged. Build clean
  (470ms); full-repo lint **427 problems (0 new vs baseline)**. **Owner eyeball (optional):** open a client
  with a card that has no stated minimum → Financial Statements → Ratios — the DSR now matches the Cash
  Flow Statement's DSR on the same tab. 🟢loop-ok

## v0.83.17 — 2026-06-26 — fix(ratios): DSR now displays as a percentage, not a "×" multiple

`ratFmt("dsr", v)` rendered the debt-service ratio as **`0.36x`** instead of **`36%`**. Root cause: in
`src/utils/finance.js` the `dsr` key was grouped with `currentRatio` in the formatter
(`if(key==="currentRatio"||key==="dsr") … `${v.toFixed(2)}x``) — correct for a liquidity *multiple*, wrong
for a debt-service *percentage*.
- **Where it showed:** `RatioContent` (Financial Statements → Ratios, `clientReports.jsx:189`) renders the
  DSR value via `RATIOS_META.dsr.fmt(minD/net)`. The card displayed **`0.36x`** sitting right next to its
  own benchmark label **`< 36%`** — internally contradictory, and inconsistent with **every other DSR
  surface** (the `RadialGauge` trio uses `dsr*100 + "%"`, the advisor "High DSR" reminder uses
  `(dsr*100).toFixed(0)+"%"`). The canonical model (`golden-anchor-logic §3`: "dsr = debt payments ÷ net
  income — target < 36%") defines DSR as a percentage, so the code had drifted from the documented logic.
- **FIX:** split the branch — `currentRatio` keeps its exact `×` formatting (incl. the legacy `99+`
  no-debt sentinel, **byte-for-byte unchanged**); `dsr` now formats as `` `${(v*100).toFixed(0)}%` ``, with
  `v>=1 → "99+%"` so the rare "no income, has debt" sentinel (`99`) and any >100% DSR read as
  off-the-charts rather than a broken `9900%`. Also dropped the dead `const abs=Math.abs(v)` in that branch
  (already documented as harmless; removing it clears one `no-unused-vars`).
- **WHY:** objective display-correctness bug found in the cruise item-1 deep scan of `utils/finance.js`.
  Pure presentation — **does not touch the live save/load path**, no money *computation*, role, or RLS
  change; the ratio value itself is untouched. No new visible word strings (`%`/`99+%` are
  language-neutral symbols), so D-3/EN-ES symmetry is not engaged.
- **VERIFIED:** node harness — DSR `0.36 → "36%"`, `0.50 → "50%"`, sentinel `99 → "99+%"`; `currentRatio`
  proven unchanged across `[0, 0.5, 1, 1.5, 2.34, 99, 100, 999]`. Build clean (484ms); full-repo lint
  **427 problems (−1 vs 428 baseline, 0 new)**. **Owner eyeball (optional):** open any client → Financial
  Statements → Ratios — the DSR card now reads e.g. `36%` matching its `< 36%` benchmark. 🟢loop-ok

## v0.83.16 — 2026-06-26 — fix(reminders): exact "days until due" — real month lengths, not hardcoded 31

`getClientRem()` (the dashboard "Client Due" reminders feed) computed each bill/card's days-until-due
with two off-by-N bugs, both rooted in ignoring real month lengths:
- **Bills:** `diff = dueDay >= today ? dueDay - today : dueDay + (31 - today)` — the wrap branch
  **hardcoded 31**. In a 28/30-day month it over-counts: e.g. **Feb 25 → a bill due the 3rd** is 6 real
  days away but computed as **9**, so the `if(diff<=7)` filter **hides the reminder** (and a 31-day month
  computes fine, masking it). Near month-end this silently **drops bills due within a week** — a real
  under-reminding defect for an advisor coaching tool.
- **Cards:** `daysUntil: Math.max(0, dueDay - today)` — **no wrap at all**. A card already past its
  due-day this month (e.g. due the 5th, viewed the 20th) reported **0 days** instead of the ~15 to next
  cycle, so it mislabeled and sorted to the **top** of the panel (default sort is `daysUntil` ascending,
  `dashboard.jsx:90`).
- **FIX:** one shared `_daysUntilDue(dueDay, today)` helper computes the exact day delta to the next
  occurrence of `dueDay`, respecting the target month's real length (`new Date(y,m+1,0).getDate()`),
  **clamping** `dueDay` to that length (a `31` due-day lands on Feb 28), and naturally rolling **Dec→Jan
  of the next year**. Both the bill `diff` and the card `daysUntil` now call it.
- **WHY:** objective correctness bug found in the cruise item-1 deep scan of `utils/finance.js` pure
  helpers. Read-only display derivation — **does not touch the live save/load path**, no money/role/RLS
  change, no new strings (the rendered value is already `daysUntil`). Keys/dismissals are unaffected
  (they embed `YYYY-MM`, not the day delta).
- **VERIFIED:** node harness, 8/8 edge cases pass (short-month wrap, year rollover, `due==today`,
  day-31 clamp on 30- and 28-day months); each old formula reproduced and shown wrong on the same input.
  Build clean (540ms); full-repo lint **428 problems, 0 new** (removed the now-unused `day` var, so no
  added `no-unused-vars`). EN/ES symmetry intact. **Owner eyeball (optional):** dashboard reminders near
  a month boundary should now show bills due within 7 *real* days and accurate "Xd" on cards. 🟢loop-ok
  (objective correctness, fix-and-push).
- **CHANGED:** `src/utils/finance.js` (`_daysUntilDue` helper + `getClientRem` bill/card paths),
  `src/App.jsx` (marker → `v08316`).

## v0.83.15 — 2026-06-26 — fix(i18n): abbreviated values (`fmtS`) honor the active currency

The `fmtS` helper (compact `$5K` / `$1.2M` rendering, used in **13 places** — dashboard slots,
calculators, client reports, primitives, intake) **hardcoded a `"$"` prefix** in its K and M branches,
while its companion `fmt()` correctly renders the user's selected currency via `_GA_CCY`
(`settings.currency` → `setLocale`, wired in v0.69 localization). So when an advisor picks a non-USD
currency from the Localization selector (USD/EUR/GBP/MXN/CAD all offered, `pages/admin.jsx:606`), every
abbreviated value still showed `$` while non-abbreviated values showed `€`/`£`/`MX$` — an inconsistent,
objectively-wrong display.
- **FIX:** `fmtS` now derives its symbol from a tiny `_ccySym()` that reads the **same** Intl currency
  config `fmt()` uses (`formatToParts(0)` → the `currency` part), so the K/M prefix matches `fmt()`'s
  output exactly: USD→`$`, EUR→`€`, GBP→`£`, MXN→`MX$`, CAD→`CA$`. K/M rounding (`toFixed(0)`/`toFixed(1)`)
  is **unchanged** — only the symbol was wrong. Falls back to `"$"` on any Intl error.
- **WHY:** objective i18n display bug found in the cruise item-1 deep scan of `utils/finance.js` pure
  helpers (after the full EN/ES key+value symmetry audit came back clean, 1874/1874). Aligns `fmtS` with
  the canonical `fmt()` per `golden-anchor-logic §6` (currency is presentational; `fmt` is the renderer).
  Pure display — no formula, no save-path, no role/data change.
- **VERIFIED:** node check confirms `_ccySym()` returns the exact symbol prefix `fmt()` emits for all 5
  offered currencies (`$5K`↔`$5,200`, `€5K`↔`€5,200`, `£5K`, `MX$5K`, `CA$5K`). Build clean; full-repo
  lint **428 problems, 0 new** (the added `_ccySym` is used). No new visible strings → EN/ES symmetry
  intact. **Owner eyeball (optional):** Settings → Localization → set Currency = EUR, glance at any
  dashboard KPI/abbreviated figure — symbols should all read `€`. 🟢loop-ok (objective i18n, fix-and-push).
- **CHANGED:** `src/utils/finance.js` (`_ccySym` helper + `fmtS` symbol), `src/App.jsx` (marker → `v08315`).

## v0.83.14 — 2026-06-26 — a11y: accessible names for icon-only close buttons (WCAG 4.1.2)

Three icon-only buttons rendered just a `×` glyph with **no accessible name** (no `aria-label`, no
`title`) — a WCAG 2.1 SC 4.1.2 (Name, Role, Value) failure: a screen reader announces "button" with no
purpose. The biggest was the shared `Modal` primitive's close button, which renders inside **all 44
modals** app-wide (Profile & Settings, Alert Settings, every data-entry modal, etc.).
- **FIX:** added a bilingual `aria-label` + `title` to the three no-name buttons:
  `Modal` close + `IAdd` (inline add-row) cancel in `components/primitives.jsx`, and the Intake
  detail-panel close in `pages/intake.jsx`. The intake one had `t` in scope (`t?.close||"Close"`). The
  two shared primitives don't receive `t`, so a tiny `gaLabel(key,fallback)` helper resolves the label
  from `T[…]` keyed on the active `document.documentElement.lang` (which the app keeps in sync with the
  language state since v0.83.12). Reused existing keys — `close` (Close/Cerrar) and `cancel`
  (Cancel/Cancelar); **no new translation keys**.
- **WHY:** objective a11y fix from the cruise website/UX scan (ordered-map item 4). Purely additive
  (adds two static attributes per button); no logic, no save-path, no visible-layout change.
- **VERIFIED:** headless preview, logged-in advisor. Opened the Alert Settings modal → the `Modal` close
  button reports `aria-label="Close"` / `title="Close"` in EN and, with `<html lang>="es"`,
  `aria-label="Cerrar"` / `title="Cerrar"` — confirming `gaLabel` resolves EN+ES from the live lang.
  Zero console errors (the new `T` import resolves).
- **CHANGED:** `src/components/primitives.jsx` (T import + `gaLabel` helper + 2 buttons),
  `src/pages/intake.jsx` (1 button), `src/App.jsx` (marker → `v08314`). Build clean; full-repo lint **428
  problems, 0 new** (added symbols are all used). No new strings → EN/ES symmetry intact. 🟢loop-ok
  (objective a11y, fix-and-push). Tracks as ISS-41.

## v0.83.13 — 2026-06-26 — fix: calculator view flash on browser back/forward + cascading-render lint

`CalculatorsPage` held local `active` state but synced it to the `activeCalc` prop inside a `useEffect`
that called `setActive` synchronously after commit. When `activeCalc` changed while the page stayed
mounted — i.e. on browser **back/forward** (popstate) between the grid and an open calculator — the
component first re-rendered with the *stale* view, then the effect fired and swapped: a one-frame flash
of the previous view. ESLint flagged the same code as `react-hooks` "Calling setState synchronously
within an effect can trigger cascading renders" plus a missing-`active` dep warning.
- **FIX:** replaced the effect with React's documented "adjust state on a prop change" pattern — derive
  the sync **during render** via a `prevAC` guard (`if(activeCalc!==prevAC){setPrevAC(activeCalc);
  setActive(activeCalc||null);}`). React restarts the render with the corrected state before painting, so
  the right view shows on the first frame — no flash, no effect, no cascading render. Behavior is otherwise
  identical (verified). Dropped the now-unused `useEffect` and the already-unused `useRef` from the import.
- **WHY:** objective UX/correctness fix from the cruise bugs/correctness scan (ordered-map item 1). The old
  pattern is a React anti-pattern ("You Might Not Need an Effect"); the new one is the canonical fix.
- **VERIFIED:** local dev server + headless preview, logged in as the test advisor. Deep-link mount
  (`/calculators/retirement`) renders the calc; calc Back → grid; tile click → calc (pushState to
  `/calculators/portfolio`); **browser back → grid with no calc remnant** (the popstate path the fix
  targets); browser forward → calc. Zero console errors (no render loop).
- **CHANGED:** `src/components/calculators.jsx` (state-sync rewrite + import trim), `src/App.jsx` (marker →
  `v08313`). Build clean; full-repo lint 411 → **409** errors (−2: the cascading-render error + the unused
  `useRef`), **0 new**. No visible strings → no EN/ES key changes. 🟢loop-ok (objective UX, fix-and-push).

## v0.83.12 — 2026-06-26 — a11y: keep `<html lang>` in sync with the active language (WCAG 3.1.1)

`index.html` hard-codes `<html lang="en">`, but the app is bilingual (D-3) and the language can flip to
Spanish at runtime — the `lang` attribute never followed. Assistive tech (screen readers) then pronounces
Spanish content with English phonetics: a Success-Criterion 3.1.1 (Language of Page) failure.
- **FIX:** sync `document.documentElement.lang` with the live language across all three independent
  language-bearing render paths — the main app/marketing shell (`App.jsx`, skipping the public routes which
  early-return), the read-only share page (`pages/portal.jsx` `PublicPortal`), and the public intake form
  (`pages/intake.jsx` `PublicIntake`). Each is a small `useEffect` keyed to its own `lang` state.
- **WHY:** objective accessibility fix surfaced in the cruise website/UX scan (ordered-map item 4). Additive,
  no save-path, no role/money logic, no visible strings → no EN/ES key changes.
- **CHANGED:** `src/App.jsx` (one effect + marker → `v08312`), `src/pages/portal.jsx`, `src/pages/intake.jsx`
  (one effect each). Build clean; lint unchanged vs baseline (411 errors, 0 new — effects use complete dep
  arrays). 🟢loop-ok (objective a11y, fix-and-push per CRUISE_MODE item 4).

## v0.83.11 — 2026-06-26 — fix: admin grant/revoke silently no-op'd past 200 auth users (ISS-27, api/scale)

`api/admin-members.js` `patchByEmail` (the worker behind the Members-admin **grant** and **revoke**
actions) looked the target account up with a single `admin.auth.admin.listUsers({ page: 1, perPage: 200 })`
call. Supabase caps `listUsers` at one page, so for any client account that sorts past user #200 the lookup
returned no match and the action threw "no client account with that email" — i.e. comping or revoking
Premium **silently no-op'd** once the auth user-base grows beyond 200.
- **FIX:** paginate the lookup in a `for (;;)` loop (page++, `perPage: 200`), breaking early the moment the
  target client is found or a short page signals the end — the exact pattern `loadClients` already uses two
  functions above. Same find-predicate (email match **and** `role === "client"`), same error on miss.
- **WHY:** correctness at scale (master-directive 50k-client goal); only bites once >200 accounts exist, so
  invisible today but a latent silent-failure on the grant path.
- **CHANGED:** `api/admin-members.js` (`patchByEmail` only — no auth/authorization logic, no live
  client-save path, no UI strings, no DB schema). Build clean; lint unchanged (1 pre-existing
  `no-unused-vars` in the Stripe catch, 0 new); marker → `v08311`. Found + fixed in the cruise correctness
  scan (ordered-map item 1, 🟢loop-ok). Server-only behavior — not browser-verifiable headlessly.

## v0.83.10 — 2026-06-26 — fix: calculator i18n — translate hardcoded English in amort/equity tables + client calcs (ISS-30–33, D-3)

Four D-3 (bilingual) violations: visible strings hardcoded English-only, never rendering in Spanish.
- **ISS-30:** `AmortTablePaginated` headers ("Year / Balance / Paid Interest / Paid Principal") and the
  "Yr {n}" row prefix were literal English. The component took only `{data}` — now `{data,t={}}` and the
  caller (`HomeEquityCalc` Amortization tab) passes `t={t}`.
- **ISS-31:** `EquityTablePaginated` headers ("Year / Home Value / Mortgage / Equity") + "Yr" — same fix;
  Equity-Projection tab now passes `t={t}`.
- **ISS-32:** the five italic "Prefilled from …" helper lines across `ClientIncomeCalc` /
  `ClientDebtCalc` / `ClientCarLoanCalc` were hardcoded. Name-interpolated ones use a `{n}` token +
  `.replace()` so Spanish word order is correct (`…de {n}` vs EN `{n}'s …`).
- **ISS-33:** the `ClientIncomeCalc` "HOUSEHOLD COMBINED" stat block (header + Gross/yr · Taxable ·
  Total Tax · Net/yr) — header gets a new key; the four cells **reuse** the existing
  `grossPerYr`/`incomeTaxable`/`incomeTotalTaxes`/`netPerYr` keys (identical to the per-person result rows).

**Strings:** 14 new keys added to BOTH `T.en` and `T.es` (symmetry verified 2× each). ES keeps "Equity"
untranslated to match the app's existing `currentEquity:"Equity Actual"` choice. The debt helper's inline
`<b>＋ Scenario</b>` bold was folded into the plain translated sentence (cosmetic, matches the other
helpers). Presentational-only — no money math, no role/RLS, no save/load path touched; `t={}` defaults
keep the tables crash-safe even without a dictionary. Build clean; lint unchanged (431 problems, 0 new
errors); marker → `v08310`. Found + fixed in the cruise correctness scan (ordered-map item 1, 🟢loop-ok).

## v0.83.9 — 2026-06-26 — fix: HomeEquityCalc Amortization "Months Saved" / "Interest Saved" (ISS-28/29)

The Amortization tab's extra-payment summary showed wrong savings figures. Two root causes:
- **Months Saved (ISS-28):** `withExtraMonths` was re-derived from the display table's last *year* row
  (`yr*12`, where `yr = Math.ceil(mo/12)`) and compared against a closed-form *exact-month* count for
  the no-extra case. Mixing year-rounded vs exact months **understated** the saving, pinned it to whole
  years, and could even show **0 or negative** (a $0-extra payment falsely showed "1 month / $583 saved").
- **Interest Saved (ISS-29):** was a fabricated approximation `loanAmt·(apr/100)·monthsSaved/12`,
  unrelated to the actual amortization schedule, and inherited the bad `monthsSaved`.

**Fix:** both figures now derive from one shared monthly amortization loop (`simAmort`, the same
interest/principal recurrence as the on-screen table) run twice — extra=0 vs extra=current — with
`saved = base − withExtra`. Months saved is now the true difference in exact payoff months; interest
saved is the true difference in total interest paid. Both clamp at 0 (defensive `Number.isFinite`
guard for a payment-can't-outrun-interest edge). Display-only calculator math — no save/load path
touched. No new strings (reused `amortMonthsSaved`/`amortInterestSaved`/`refiMonthsSuffix`).
Verified by replicating both old and new formulas in a standalone Node harness across 5 input sets
(confirmed the $0-extra phantom-saving disappears and intSaved == baseInt − extraInt exactly). Build
clean; lint unchanged (431 problems, no new errors); marker → `v0839`. Found + fixed in the cruise
correctness scan (ordered-map item 1, 🟢loop-ok).

## Fix — 2026-06-26 — lint: clear 3 `no-misleading-character-class` errors in `stripLeadEmoji` (no behavior change)

`src/styles/theme.js`'s `stripLeadEmoji` regex (runs on every rendered label) had three combining
code points written **literally** inside its character class — `U+FE0F` (variation selector),
`U+200D` (ZWJ), `U+20E3` (keycap) — tripping ESLint's `no-misleading-character-class` ×3 and leaving
invisible characters in source (a real edit footgun — they silently resisted byte-level patching this
tick). Rewrote them as explicit `\u{FE0F}\u{200D}\u{20E3}` escapes (byte-for-byte identical matching —
a character class is an unordered set of code points; verified equivalent on a 20-string EN/ES emoji/
keycap/ZWJ battery against the genuine pre-change regex) and added a justified
`eslint-disable-next-line` — their membership is **intentional**: the `(?:[...]\s*)+` loop relies on
them to strip a trailing variation-selector/ZWJ/keycap left after a leading emoji (so the rule is a
false positive here). No `__GA_BUILD__` bump (zero behavior change). Build clean; lint 425→422 errors,
the 3 target errors gone, `no-undef` still 0, no new errors. Found during the cruise correctness scan.

## Fix — 2026-06-26 — standards: add `mobile-web-app-capable` PWA meta tag (no app-code change)

`index.html` declared only the deprecated `apple-mobile-web-app-capable` meta; modern browsers log a
console deprecation warning and ask for the standardized `mobile-web-app-capable`. Added it alongside
the apple-prefixed one in the PWA block. Objective standards fix found during an attended verification
pass (Playwright on prod surfaced the warning). Static-HTML only — no `__GA_BUILD__` bump (the marker
tracks App.jsx behavior, unchanged). Build clean; lint baseline unchanged (434). Verified the live
console warning clears post-deploy.

## Process/Docs — 2026-06-25 — held stack shipped to main + documentation lifecycle adopted (PLAYBOOK §4b/§4c)

Two things, no app-code change beyond what already shipped:
1. **The 9-commit held stack landed on `main`** (v0.83.1→v0.83.7), owner-approved in test-mode. The
   v0.83.1 save-toast gate, reminders RPC, export-all full blobs, >1000 pagination, and the three
   latent-crash fixes (Compare `<tbody>`, import.js `MS`, ChartSettingsModal `dashChartOptions`) are
   now live. `origin/main == HEAD` at v0.83.7 — no held stack.
2. **Adopted the Mauricio-OS documentation lifecycle** (PLAYBOOK §4b/§4c). New canonical infra:
   `docs/LOGIC_MAP.md` (live-only doc index, replaces the stale `_INDEX.md`), `docs/UNIVERSAL_RULES.md`,
   `docs/STATE.md`, `docs/ISSUES_LEDGER.md`, `docs/DEPENDENCY-MAP.md`. Archived 12 done/superseded docs
   to `docs/archive/` with "⛔ ARCHIVED" banners + dropped from the live map (incl. the shipped
   MASTER-DIRECTIVE, the scalable-data-layer plan/spec/reports, dashboard-rewrite, PRICING-AUDIT,
   MODERN-REDESIGN). Gave every ephemeral doc a kill-condition. Caught a doc-rot bug: root `SKILL.md`
   is the **`finance-app-updater`** skill (CLAUDE.md had it mislabeled as a design manifest — fixed).
   Still to come: the `finance-review-mode` + `finance-feedback-intake` skills, the CLAUDE.md bootstrap
   block, and the CRUISE_MODE infra.

## v0.83.7 — 2026-06-25 (Patch) — fix: ChartSettingsModal crash — `dashChartOptions` was undefined after Phase-2 split

`ChartSettingsModal` (avatar menu → "Chart Settings", `src/components/chartEditors.jsx:117`) called
`dashChartOptions(t)`, but that factory was a non-exported `const` living only in `dashboard.jsx` — so the
modal referenced an undefined symbol and **threw `ReferenceError: dashChartOptions is not defined` on open**
(white-screen for that modal). Surfaced by the v0.83.x lint-scope cleanup (last real source `no-undef`).
Couldn't simply export it from `dashboard.jsx` and import it into `chartEditors.jsx` — `dashboard.jsx` already
imports from `chartEditors.jsx`, so that would create a dashboard ⇄ chartEditors import cycle (fragile TDZ for
a top-level `const`). Instead extracted the pure `t => [{id,label}]` factory **verbatim** into a new no-cycle
module `src/constants/chartOptions.js` and imported it into both consumers. Behavior unchanged (same 21 slot
options, same `t?.*` keys + English fallbacks → EN/ES symmetry N/A).

Verified in preview (test advisor, real Supabase, dev server): dashboard renders fully with **no console
errors** (it consumes `dashChartOptions(t)` at `dashboard.jsx:521` for the per-chart slot picker, proving the
new module resolves at runtime); a dynamic `import('/src/constants/chartOptions.js')` in the live app returned
the function and its full 21-element array (`incomeVsSpending`→`kpiSparklines`, labels intact). Build green;
source `no-undef` 1 → 0. Marker bumped v0836 → v0837.

**⚠️ HELD LOCAL — NOT pushed.** Additive (new pure module + corrected imports) + a verified crash fix
(fix-and-push-eligible on its own), but `origin/main` is at v0.83.0 with the held **v0.83.1 save-toast gate**
between origin and HEAD — pushing would ship that unapproved live-save-path commit. Stacks as the next held
commit; ships once the owner approves v0.83.1.

## Tooling — 2026-06-25 (no app change, no marker bump) — ESLint stops linting build output + agent worktrees

`eslint.config.js` ignored only top-level `dist`, so `npm run lint` was also scanning `.claude/worktrees/agent-a79f77ab4d262a299/` — a full stale repo copy including its own minified `dist/` vendor bundles — and that copy's `api/` files (which miss the `api/**/*.js` Node-globals override). Result: ~1,400 phantom errors (`process`/`Buffer`/`Deno`/`define`/`val`/etc. from minified bundles) drowning the real source signal. Ignore list widened to `['dist', '**/dist', '.claude']`. `npm run lint` now reports ~430 **real** source problems (down from 1,465), and `no-undef` — the latent-crash class — drops from **164 → 1** (only `dashChartOptions` in `chartEditors.jsx` remains; next fix). No app-bundle change → `__GA_BUILD__` deliberately NOT bumped (the marker tracks deployed app versions). Committed LOCAL (push still blocked by held v0.83.1).

## v0.83.6 — 2026-06-25 (Patch) — fix: import.js missing `MS` import (latent ReferenceError in Excel/CSV importer)

`src/utils/import.js` uses the month-abbreviation array `MS` in two places — `shToLabel` (line 13, sheet-name →
"Mon YYYY" label) and the month-sheet parser (line 161, `MS.indexOf(moName)+1`) — but never imported it. `MS`
was left undefined when the importer was carved out of App.jsx in Phase 2 (D-37), so any Excel/CSV import that
hit those paths would throw `ReferenceError: MS is not defined`. Same class of bug as the admin.jsx
`expBackup`/`BackupImportModal` import loss fixed in v0.83.3. Added `import { MS } from "../constants/meta";`
(`MS` is exported there and consumed identically by App.jsx and clientReports.jsx; verified no import cycle —
`constants/meta.js` only pulls `GOLD` from `styles/theme`).

Verified: build green; ESLint on `import.js` went from 3 `no-undef` errors ('MS' is not defined ×3) to **0**;
no visible string changed (EN/ES symmetry N/A). Marker bumped v0835 → v0836. Could not drive the full Excel
import in headless preview (needs a multi-sheet .xlsx fixture); the fix is proven at build+lint level (the
symbol now resolves), matching how the same bug class was handled in v0.83.3.

**⚠️ HELD LOCAL — NOT pushed.** Additive + a clear crash fix (fix-and-push-eligible on its own), but
`origin/main` is at v0.83.0 with the held **v0.83.1 save-toast gate** between origin and HEAD — pushing would
ship that unapproved live-save-path commit. Stacks as the 6th held commit; ships once the owner approves v0.83.1.

## v0.83.5 — 2026-06-24 (Patch) — fix: Compare tab `<tbody>` whitespace text-node React warning

`CompareReportTab` (`src/components/clientReports.jsx`) closed both of its comparison tables with
`;})} </tbody>` — a stray space between the `.map()` closure and `</tbody>` rendered a whitespace
text node as a direct child of `<tbody>`, which React warns about ("whitespace text nodes cannot be a
child of `<tbody>`"). Removed the two stray spaces (`;})}</tbody>`). Purely cosmetic — the change deletes
two whitespace text nodes; rendered output is byte-identical and no computed value, formula, role gate,
or string is touched. Was the top 🟢 green-light cleanup item in `docs/BACKLOG.md`.

Verified: build green (480ms); ESLint on `clientReports.jsx` unchanged at 70 pre-existing errors before
and after the edit (zero new lint introduced); no visible string changed (EN/ES symmetry N/A). Marker
bumped v0834 → v0835.

**⚠️ HELD LOCAL — NOT pushed.** Not because of this change (it is additive + fully verified and would be
fix-and-push-eligible on its own) but because `origin/main` is still at v0.83.0 and the local branch has
the held **v0.83.1 save-toast gate** between origin and HEAD — any `git push origin main` would ship that
unapproved live-save-path commit to production. This commit stacks as the 5th in the held queue and ships
with the rest once the owner approves v0.83.1.

## v0.83.4 — 2026-06-24 (Patch) — scale: gaLoadClientSummaries pages past the 1000-row cap (full roster)

`gaLoadClientSummaries` selected all summary rows in a single PostgREST request, which silently caps at
1000 — so an advisor with >1000 clients only ever loaded the first 1000 into the roster/list. It now
loops `.range(from, from+999)` ordered by `local_id` (stable key) until a short page returns, accumulating
the full set. Error contract preserved: a **first-page** error returns `null` (so `refreshSummaries` keeps
the current list on a transient blip rather than clearing it); a **later-page** error logs and returns the
rows gathered so far (graceful partial instead of wiping everything). Display sort is unchanged (ClientList
re-sorts client-side, so the `local_id` load order is irrelevant to the UI). No schema/string changes.

Verified in preview (test advisor, real Supabase): the 3-client account loads + renders the full roster
through the paged function (no regression); the paging algorithm was driven against real data with a forced
`PAGE=2` to exercise multiple iterations — pages `0-1`→2 rows (continue), `2-3`→1 row (break), 3 collected,
ordered by `local_id`, **no duplicates, clean termination**; build green; no new console errors. A true
>1000-row end-to-end couldn't be run (no test advisor has 1000+ clients), so the >1000 behavior rests on
the verified algorithm — flagged for owner awareness.

## v0.83.3 — 2026-06-24 (Patch) — scale: export-all / backup-all pages the FULL blobs (+ fixes broken Backup page)

After v0.83.0 the advisor `clients` array holds blob-less summary rows, so every "export all" / "backup all"
surface was exporting summaries (no financial data, no phone/dob/address/ssn). New paged loader
`gaLoadAllClientBlobs(userId)` fetches every full blob (selecting only `data`, ordered by `local_id`,
ranging past PostgREST's 1000-row cap so a large book exports completely, de-duped by id). App threads a
`loadAllBlobs` callback (advisor → loader+`mig`; client role → its existing self-blob) into **BackupPage**,
**ExportModal** (Dashboard + ClientList), and the ClientList **"Backup All"** kebab; each now `await`s the
full blobs before `expBackup`/CSV. Busy state + `preparingBackup` label (EN/ES) while loading. Single-client
exports (ClientDetail kebab, `expCSV`) were already full blobs — untouched. Purely additive READ path —
does NOT touch the save/load/mutation path.

**Also fixed a pre-existing bug surfaced here:** `pages/admin.jsx` never imported `expBackup` or
`BackupImportModal` (lost in the Phase-2b extraction), so BOTH Backup-page actions — Download-backup and
Restore-from-backup — were latent `ReferenceError`s that threw on click. Added the two imports
(no circular dependency — neither `utils/import` nor `components/clientData` imports `pages/admin`).

Verified in preview (test advisor, real Supabase): `gaLoadAllClientBlobs` replicated through the live
session JWT returns 3 full blobs (Miguel 4 cards/5 snaps, Carlos 1/0, Amanda 1/3, all `_summary=false`,
RLS-scoped, HTTP 200); the **Backup-page download** and the **ExportModal "All Active / Full Backup"** were
both driven through the UI and the captured JSON contained full blobs + settings (no summary rows); build
green; no new console errors.

## v0.83.2 — 2026-06-24 (Patch) — scale: server RPC restores advisor reminders (No-Contact + High-DSR + Debt-Rising)

v0.83.0 reduced advisor reminders to No-Contact only (the panel's blob-derivers can't see the new
summary rows). New RLS-scoped, anon-revoked, SECURITY-DEFINER RPC `ga_advisor_reminders(p_no_contact_days)`
computes reminders server-side over the `clients` + `client_monthly_summary` tables (no blob reads):
**No-Contact** (days since `last_activity`), **High-DSR** (`monthly_debt_min/monthly_income` > 0.36), and
**Debt-Rising** (latest-month debt > earliest-month debt, ≥2 monthly snapshots) — matching the original
`getAdvRem` thresholds, labels, and dismissal keys (`<type>:<local_id>`) so existing snoozes still apply.
`RemindersPanel` fetches it (`gaAdvisorReminders`) when it holds summary rows and prefers it; the v0.83.1
client-side `last_activity` No-Contact derivation stays as an offline fallback when the RPC hasn't loaded
or errors. Purely additive read path — does NOT touch the save/load/mutation path.

Verified: migration applied; RPC logic proven at the DB level (No-Contact positive case = 4 rows;
High-DSR/Debt-Rising compute correctly and the real thresholds filter as expected); RPC round-trips
through the real advisor session JWT (RLS-scoped, HTTP 200 — `p=0`→all 3 clients, `p=30`→none); build
green; panel mounts cleanly with no new console errors. No new user-facing strings (labels mirror the
existing English `getAdvRem` reminders — the whole advisor-reminder feature is English-only).

**Still blob-only (not derivable from current summary columns — follow-up):** `promoExpiring` (needs
promo end-dates) and the per-bill/per-card "Client Due" reminders (need bill/card due-days). Restoring
those would mean extending the save-path summary derivation + a backfill — owner call.

## v0.83.1 — 2026-06-24 (Patch) — fix: advisor save-success toast no longer masks a failed save

Adversarial bug-sweep of the v0.83.0 rework surfaced one real regression: advisor `upClient`/`addClient`
`await gaSaveClient(...)` but ignored its boolean result, then unconditionally fired the green "Client
saved"/"Client added" toast. On a genuine save failure `gaSaveClient` returns `false` and dispatches
`ga-save-failed` (the error toast) — but the success toast immediately overwrote it, so the advisor was
told the save succeeded when it hadn't (the edit lived only in `selected`, lost on reload). Pre-v0.83
advisor saves ran through the array-diff effect with no competing success toast, so this masking was new
in v0.83.0. Fix: gate the success toast on the save result (`if(ok)…`); on failure the `ga-save-failed`
error toast now stands. Client-role path unchanged (`ok` stays true). No string/schema changes.

Swept and judged correct (no change needed): the array-diff save effect is guarded to client-role only
(no risk of summary rows persisted as blobs); `mig(row)` backfills all arrays so the null-blob fallback
renders a valid empty client (no crash); split/join load both blobs fresh before merge; the `client_type`
column exists (no empty-list risk); the `color1` deterministic-hash default and the reminders
No-Contact-only change are intended behavior (follow-ups, not bugs).

## v0.83.0 — 2026-06-24 (Minor) — scale: advisor App-state holds summary rows + lazy-loads blobs

The final scalability piece: the **advisor** `App()` no longer loads every client's full JSONB blob.
It now holds lightweight SUMMARY rows (`gaLoadClientSummaries` — name/email/net_worth/total_debt/
monthly_income/snapshot_count/last_activity/archived/color1), and lazy-loads the full blob via
`gaLoadClient` only when a client is opened (ClientList select, Dashboard roster, all 3 URL-routing
paths). The array-diff save effect is guarded to client-role only; advisor persistence is now explicit
per mutation: `upClient`/`addClient`/`importMultiple`→`gaSaveClient`, archive/restore→`gaSetArchived`
RPC, delete→`gaDeleteClient`, split/join load blobs then save+delete — each followed by a summaries
refresh. ClientList + dashboard roster read summary fields (not blob-derivers). **Client-role path
unchanged.** Combined with v0.82.x (dashboard server-aggregates + windowed render), the app no longer
loads all blobs anywhere.

Verified live (test acct, real Supabase): summary-list load, open-on-select + open-by-URL lazy-load the
blob, edit→Save **persists** (note round-tripped to `data->notes`), summaries refresh, dashboard renders,
zero new console errors. `ga_set_archived` RPC verified (column + blob stay in sync).

Reminders: advisor `RemindersPanel` now derives the **No-Contact** reminder from the summary's
`last_activity` (other advisor reminders await a server RPC over the summary/monthly tables — TODO).
Export/Backup still page the full array (TODO: stream blobs). **Owner: please spot-check split + join**
(the two flows that couldn't be headlessly driven; revert is one commit if either misbehaves).

## v0.82.2 — 2026-06-24 (Patch) — scale: windowed dashboard roster

The Dashboard's bottom client roster now renders at most `rosterShown` (60) per-client cards with the
same bilingual "Show more (N)" control (+120/click) as the ClientList, instead of one card per client.
Pure render change; reuses the `showMoreClients` string. Build-verified. (Roster still computes from
the blob array — converts fully with the App-state persistence rework.)

## v0.82.1 — 2026-06-24 (Patch) — scale: windowed ClientList render

The advisor ClientList now renders at most `shown` (80) client cards at a time with a bilingual
"Show more (N)" control (+120 per click; resets on search/sort) instead of one DOM node per client —
keeps the list smooth at high client counts. Pure render change (no data/persistence touch); bulk
select-all still operates on the full filtered set (selection is id-based, not DOM-based). New string
`showMoreClients` added to EN + ES (D-3). Build-verified.

## v0.82.0 — 2026-06-24 (Minor) — scale: advisor Dashboard renders from server aggregates

The advisor Dashboard now reads from the 5 dashboard RPCs (via `gaDashboardAll()`), not the in-memory
client-blob array — the first non-additive step of the App-state flip. `App()` fetches `dashData`
(summary/trend/debts/assets/deltas) on nav→dashboard and after edits; `dashboard.jsx` rewritten so
every chart consumes `dashData`. **18 of 21 charts converted** (KPIs, trend, Sankey, NW-tier donut,
Practice-Health, Net-Worth Bridge, Forecast, Cash-Flow, Asset-Sunburst, Debts-by-Balance, Treemap,
Ranked, Dumbbell, Slope, Spending-heatmap, sparklines). Verified live: KPIs exact (3 clients,
debt $364K, income $30K, liquid $23K), default charts render, no errors.

Notes: the dashboard client-search box was removed (aggregates are always practice-wide). **3 charts
placeholdered** pending new aggregates — Bills-by-Category + Bills-YoY (need per-category bill rollup)
and Debt-Payoff-Timeline (needs per-debt APR + min payment); not in the default slots. The bottom
client roster still reads the array (it's a list, converts with the ClientList/App-state flip). Minor
caveat: debt-vs-savings live "Now" point uses total debt vs revolving-only history. App still loads all
clients (scale win lands when the list + App-state flip remove load-everything).

## v0.81.5 — 2026-06-24 (Patch) — scale: assets rollup + asset-alloc RPC (full dashboard aggregation)

Added `clients.assets` jsonb (derived on save: accounts+customAssets value>0 as `{bucket,name,val}`,
bucket = cash/invest/property by ACCT_META) + `ga_dashboard_asset_alloc()` RPC (sums by bucket+name
across active clients, anon-revoked) — powers the dashboard Asset-Sunburst server-side, no blob reads.
Server version uses the proper account label (`ACCT_META.l`), fixing a latent `.label` typo in the
in-app sunburst. Additive; app unchanged. Verified: Amanda's assets total 59,800 (− debt 31,700 =
net worth 28,100, reconciles exactly). **This completes the line-item rollup layer.**

## v0.81.4 — 2026-06-24 (Patch) — scale: debts rollup + top-debts RPC (full dashboard aggregation)

Added `clients.debts` jsonb (derived on save: each card/loan with balance>0 as
`{name,bal,kind,ltype,first}`) + `ga_dashboard_top_debts(limit)` RPC (unnests across active clients,
top-N by balance, anon-revoked) — powers the dashboard Debts-by-Balance chart server-side, no blob
reads. Additive; app unchanged. Verified: Amanda's debts (Student 18000 + Vehicle 12500 + Capital One
1200 = 31700) returned by the RPC, matching her total_debt exactly.

## v0.81.3 — 2026-06-24 (Patch) — scale: per-month asset/liability breakdown (full dashboard aggregation)

Owner chose **full server aggregation** for the dashboard at scale (no per-client blob reads).
Added 7 derived columns to `client_monthly_summary` (`a_liquid/a_invest/a_property/a_other`,
`l_cards/l_loans_all/l_loans_current`), computed in `monthlyRows` from each snapshot's `data`,
matching the dashboard's Net-Worth Bridge / Forecast / debt-mode-trend math exactly. Feeds those
per-month charts server-side. Additive; live app unchanged. Verified: a save populated the columns
(May snapshot → property 22000, cards 1200). Remaining for full aggregation: line-item rollups for
Asset-Sunburst (by account name) + Debts-by-Balance (by individual debt), then the dashboard wiring.

## v0.81.2 — 2026-06-24 (Patch) — scale: derive monthly_bills + monthly_debt_min on save

Additive prerequisite for the server-side dashboard (next phase). Added `clients.monthly_bills`
(`sumB(bills)`) + `clients.monthly_debt_min` (`sumMin(cards)`) summary columns, derived on every
save via `clientSummary` (migration `add_bills_min_summary_columns` applied to live DB). These feed
the dashboard's Sankey + Practice-Health aggregates so it can render without loading every blob.
Live app unchanged (write-only until the dashboard is wired). Verified: a save wrote
`monthly_bills=1985, monthly_debt_min=35` for the test client.

## v0.81.1 — 2026-06-24 (Patch) — scale: drop ga_v3 localStorage full-cache

Removed the `ga_v3` localStorage full-cache (init read + persist write). Supabase is now the sole
source of truth for clients. The cache capped at ~5 MB and was the **nearest** scale breakage point
(blew at a few hundred snapshot-heavy clients). Kept the `ga_cache_uid` foreign-purge (pitfall #18)
and the small `ga_session_draft`. Verified live: all clients load from cloud, `ga_v3` no longer
written, load/render/save intact.

## v0.81.0 — 2026-06-24 (Minor) — scalable data layer: foundation (DB + write path)

First cut of the **scalable data layer** (spec/plan in `docs/superpowers/`; goal: a single advisor
account with tens of thousands of clients must not break). Additive — live app UX unchanged.
- **DB migration** (live Supabase): `clients` summary columns (name/email/type, net_worth,
  total_debt, monthly_income, liquid_assets, snapshot_count, last_activity, archived, `search_tsv`
  GIN) + `client_monthly_summary` time-series table + `ga_dashboard_summary`/`ga_dashboard_trend`
  RPCs. RLS reuses `auth.uid()=user_id`; RPCs `SECURITY DEFINER` with pinned `search_path`, anon
  execute revoked. Verified: aggregates correct (3 clients → debt 363550, income 30200).
- **Write path**: `gaSaveClient` derives summary columns + upserts monthly rows on every save
  (`clientSummary`/`monthlyRows` in `utils/finance.js`). Verified live; existing clients backfilled.
- **Service layer (unwired)**: `gaListClients` (server page/search/sort), `gaLoadClient` (one blob),
  dashboard RPC wrappers — ready for the App-state flip (the coordinated advisor-path refactor;
  consumer map + plan in `docs/superpowers/plans/2026-06-24-task5-app-state-breakdown.md`).

## v0.80.15 — 2026-06-24 (Patch) — remove dead advisor-side intake code

Cleanup (owner-approved). Removed the superseded advisor-side intake cluster (`INTAKE_TXT` +
`exportIntakePDF` + `IntakeSection`, 139 lines) from `App.jsx` — referenced nowhere in src/; the
live intake flow is `pages/intake.jsx` (whose own comment notes "full parity with old
IntakeSection"). App.jsx 954 → **817 lines**. Build green; zero residual references (asserted).

## v0.80.14 — 2026-06-24 (Patch) — Phase 2 decomposition: profile/settings modal extracted

Eleventh Phase 2 slice. Moved `ProfileModal` (+ its internal `AccRow`/`BgPicker` sub-components)
out of `App.jsx` into new `src/components/profileModal.jsx`. App.jsx 1,123 → **954 lines** — under
1,000, down from the 8,502-line monolith (~89% reduction). Build green; verified live — "Profile &
Settings" opens the modal with Theme/Localization/Background sections.

## v0.80.13 — 2026-06-24 (Patch) — Phase 2 decomposition: client editor extracted

Tenth Phase 2 slice. Moved `NewClientModal` + `ClientForm` out of `App.jsx` into new
`src/components/clientEditor.jsx`. Clean cut. App.jsx 1,180 → **1,123 lines**. Build green; verified
live — the New Client modal opens with the client form (first/last/email/partner/type).

## v0.80.12 — 2026-06-24 (Patch) — Phase 2 decomposition: ClientList page extracted

Ninth Phase 2 slice. Moved the `ClientList` page out of `App.jsx` into new
`src/components/clientList.jsx`. Downward-closed (reliable scan: zero unresolved tags; `Cbx` is a
local sub-component). App.jsx 1,302 → **1,180 lines**. Build green; verified live — the Clients page
renders all client cards + sort + New Client.

## v0.80.11 — 2026-06-24 (Patch) — Phase 2 decomposition: Dashboard + reminders extracted

Eighth Phase 2 slice. Moved `Dashboard` + `RemindersPanel` + `AlertsSettingsModal` out of
`App.jsx` into new `src/components/dashboard.jsx` (Dashboard renders RemindersPanel, which renders
AlertsSettingsModal — so all three move together; App.jsx imports back only `Dashboard`). Downward-
closed cut (reliable scan: zero unresolved tags). App.jsx 1,852 → **1,302 lines**. Build green;
verified live — the dashboard renders all KPI tiles, the income/spending trend chart (17 charts),
and the reminders panel (Client Due / Advisor Alerts).

## v0.80.10 — 2026-06-24 (Patch) — remove dead ArchivedSection

Cleanup (autonomous-loop pass). Removed the unused `ArchivedSection` component from
`components/clientData.jsx` — it was exported but referenced nowhere in `src/` (superseded by
`pages/admin`'s `ArchivedClientsPage`). Build green; zero residual references. No behavior change.

## v0.80.9 — 2026-06-24 (Patch) — Phase 2 decomposition: report views/tabs extracted

Seventh Phase 2 slice — the biggest. Moved the entire client report ecosystem (~30 components:
`MonthSelector`, `PrintBtn`, `DownloadPdfBtn`, `NoDataMsg`, `ReportHdr`, `SummarySection`, the
history modals `NMModal/CmpModal/VHModal/MDrop/HistView/FullMonthView`, `MonthlyTab`,
`CashFlowStatement`, `RatioContent`, `FinancialStatementsTab`, `ExportHoldingsModal`,
`InvestmentsTab`, `FullReport`, `SummaryReport`, `MonthlyReportTab`, `FinancialStatementReportTab`,
`EmailReportModal`, `CompleteReportTab`, `BackfillTab`, `AssetsLiabilitiesTab`, `FinancialPlanTab`,
`YearCompareView`, `CompareReportTab`, `ClientReport` + the `getClientForMonth`/`saveHistoricalUpdate`
helpers) out of `App.jsx` into new `src/components/clientReports.jsx`. Downward-closed cut (dependency
analysis showed zero dangling component tags); App.jsx imports back the 7 tabs `ClientDetail` renders.
App.jsx 2,597 → **1,852 lines**. Build green; verified live — all 6 ClientDetail tabs + the Client
Report sub-views (Summary / Monthly / Complete Report / Compare) render with charts. (Pre-existing
`<tbody>` whitespace warning in CompareReportTab surfaced — unrelated to this byte-exact move; logged.)

## v0.80.8 — 2026-06-24 (Patch) — Phase 2 decomposition: import/backup/export cluster extracted

Sixth Phase 2 slice — the entangled one. Two steps: (A) relocated the import/CSV/backup/dedupe
helpers (`expBackup`, `validateBackup`, `xFreq`, `SKIP_SH`, `moIdx`, `isMonthSh`, `shToLabel`,
`parseMonthRows`, `buildStreams`, `parseWorkbook`, `parseCRMCsv`, `findDuplicate`, `smartMerge`)
out of `App.jsx` into new `src/utils/import.js` (they depend only on `gid`/`sumB`/`toM` + XLSX) so
both the App-shell `restoreBackup` and the modals can share them; (B) extracted the modals
(`ImportWizard`, `DuplicateResolverModal`, `DeleteClientModal`, `BackupImportModal`,
`ArchivedSection`, `ExportModal`) into new `src/components/clientData.jsx`. App.jsx
3,023 → **2,597 lines**. Build green; verified live — Import-Clients wizard + Export modal both
open and render from the new module (helpers resolve from `utils/import`). A first attempt was
reverted earlier today because the shared helpers weren't relocated first; this does it right.

## v0.80.7 — 2026-06-24 (Patch) — Phase 2 decomposition: report blocks extracted

Fifth Phase 2 slice. Moved the read-only report blocks (`PlanReportBlock`,
`PortfolioReportBlock`, `CompareReportBlock`, `CalculatorsReportBlock`) out of `App.jsx`
into new `src/components/reportBlocks.jsx`. App.jsx 3,114 → **3,023 lines**. Build green;
verified live — Strategy Plan tab renders the debt-payoff PlanReportBlock, Client Report
renders the portfolio/calculators/compare blocks. Remaining: report views/tabs
(SummarySection, FullReport, *Tab family) + ImportWizard, then the `ClientDetail`/`Dashboard`
shells (highest coupling, last).

## v0.80.6 — 2026-06-24 (Patch) — Phase 2 decomposition: dashboard chart-editor UI extracted

Fourth Phase 2 slice. Moved the dashboard chart-customization components
(`ChartGalleryCard`, `ChartEditModal`, `ChartSettingsModal`, `DashSlotPicker`) out of
`App.jsx` into new `src/components/chartEditors.jsx`. App.jsx imports back
`ChartSettingsModal` + `DashSlotPicker` (the other 2 are internal). App.jsx
3,425 → **3,114 lines**. Build green; verified live — the dashboard "Change chart" picker
renders the full ChartGalleryCard gallery (8+ live chart previews). Remaining: report
blocks/tabs, ImportWizard, then the `ClientDetail`/`Dashboard` shells (highest coupling, last).

## v0.80.5 — 2026-06-24 (Patch) — Phase 2 decomposition: client-scoped calculators extracted

Third Phase 2 slice. Moved the client-scoped calculators (`ClientIncomeCalc`,
`ClientDebtCalc`, `ClientCarLoanCalc`, `ClientCalculatorsTab`) out of `App.jsx` into new
`src/components/clientCalcs.jsx`. Byte-exact move via a reusable extractor that derives
imports from App.jsx's own import map and flags any dangling reference. App.jsx imports
back only `ClientCalculatorsTab` (the other 3 are used only within it). App.jsx
3,789 → **3,425 lines**. Build green; verified live — the Calculators tab renders and the
Debt calc's charts (PayoffProgression/RankedHBars) draw. Remaining: report blocks/tabs,
then the `ClientDetail` shell (last).

## v0.80.4 — 2026-06-14 (Patch) — Phase 2 decomposition: client workbook sections extracted

Second Phase 2 slice. Moved the 11 client workbook section components
(`IncomeSection`, `BillsSection`, `DebtSection`, `AccountsSection`, `LoansSection`,
`CustomAssetsSection`, `SavingsSection`, `NotesSection`, plus the embedded
`BulkSnapModal`, `MarketInvestmentModal`, `MarketInvestmentsSection`) out of `App.jsx`
into new `src/components/clientSections.jsx`. Byte-exact move; App.jsx imports back the
6 externally-referenced sections (the other 5 are used only within the new module).
App.jsx 3,865 → **3,789 lines**. Build green; verified live — the full `SavingsSection`
chain (Accounts/Loans/CustomAssets/MarketInvestments + the recharts allocation pie)
renders, and `IncomeSection`→`IncomeModal` cross-file open works. Continues unwinding
graphify's Community 0. Remaining: report blocks/tabs, then the `ClientDetail` shell (last).

## v0.80.3 — 2026-06-14 (Patch) — Phase 2 decomposition: client data-entry modals extracted

First slice of ARCHITECTURE-PLAN §3 Phase 2. Moved the 8 client data-entry modals
(`IncomeModal`, `CardModal`, `BillModal`, `AccountModal`, `LoanModal`, `AssetModal`,
`SplitAssignModal`, `JoinModal`) out of `App.jsx` into new `src/components/clientModals.jsx`.
Pure leaf components (props-only, no app state) — byte-exact move, no behavior change.
App.jsx 3,899 → 3,865 lines. Build green; `CardModal` open/render verified live on a
client. Graphify's Community 0 ("Client Workbook", cohesion 0.07) flagged this cluster as
the prime split target — this begins unwinding it. Next slices: client-sections, then the
`ClientDetail` shell (highest coupling, last).

## v0.80.2 — 2026-06-12 (Patch) — remove white bottom fade in light-mode hero

The landing hero's bottom-melt gradient used `P.bg` (cream `#FAFAF7` in light mode),
producing a visible white fade. Gated the entire melt `<div>` to dark mode only
(`{isDark && …}`) so light mode has no fade. (commit `4ed7bd1`)

## v0.80.1 — 2026-06-11 (Patch) — revert hero default to video

Owner feedback: the v0.80 Gold Smoke default wasn't reading well. Reverted the landing
hero default back to the v0.78 fade-looped particle video; Smoke stays reachable via
`?hero=smoke`. (commit `46353f9`)

## v0.80 — 2026-06-11 (Minor surface) — Gold Smoke hero (A4) default

Replaced the v0.79 gold cube as the landing default with the A4 "Gold Smoke" canvas hero
(noise-field gold blobs drifting on near-black, mouse-reactive). Other heroes still selectable
via `?hero=` (cube/tides/video). Superseded the next day by v0.80.1. (commit `73210bf`)

## v0.79.1 — 2026-06-11 (Patch) — `?hero=` live comparison switch

Owner asked to see the earlier heroes again. URL param on the landing page:
`?hero=tides` → v0.77 golden canvas waves · `?hero=video` → v0.78 golden-particles
video (falls back to tides on error) · default (no param) → the v0.79 cube.
Backgrounds render under the same gradient overlays + minimal stack.

## v0.79 — 2026-06-11 (Minor surface) — Gold CUBE hero (Resend × Letter.co direction)

Owner direction: Resend's rotating Rubik's-cube hero ("simple, very open, not many
things, dark, not busy") + Letter.co's "dark but light at the same time" luminosity.
- **GoldCube** (`src/pages/landing.jsx`): pure-CSS 3D cube — 6 faces via
  `rotateX/Y + translateZ`, each face a 3×3 grid of tiles in three finishes:
  brushed gold gradient, glowing gold (soft 18px halo), and dark glass
  (blur + hairline). Deterministic per-face patterns, elliptical gold floor-glow
  beneath. Spins on `gaCubeSpin` (App.jsx stylesheet): 36s linear, rotateX(-24°)
  base tilt; `prefers-reduced-motion` gets a static 3D pose.
- **Letter-style luminous dark**: video removed from the hero (HeroVideo/GoldenTides
  components kept in-file for revert); section is #08090B with a warm radial
  top-light (cream→gold→transparent) so the dark "glows" instead of flattening.
  Theme-aware bottom melt into `P.bg` unchanged from v0.78.1.
- First screen stays the v0.78.1 minimal stack: cube → badge → headline →
  subcopy → glass email bar (text button) → caption. Capsule nav with EN/ES +
  Light/Dark + Sign in unchanged.

## v0.78.1 — 2026-06-11 (Patch) — Hero decluttered to Origin level (owner feedback)

Owner notes on v0.78 ("less things on the first page, no arrows, light/dark missing"):
- First screen is now ONLY: badge pill ("Free to start") → Instrument Serif headline →
  one-line subcopy → glass email bar with a TEXT "Get started" button (no arrow) →
  one tiny caption. Removed from the hero: the [ 2026 ] floating card, the uppercase
  eyebrow, the "See pricing" pill, the social circles, all arrow glyphs.
- Theme toggle RESTORED in the capsule nav (was dropped in v0.78), and the hero's
  bottom scrim now fades into the active theme background — light mode melts into
  cream, dark into navy (no hard seam).

## v0.78 — 2026-06-11 (Minor surface) — Liquid-glass VIDEO hero (owner's exact spec)

Owner rejected the canvas-line hero; his two pasted specs define the target: cinematic
background VIDEO + liquid glass UI. Shipped:
- **Real footage**: `public/hero-bg.mp4` — "Golden Particles in Water" (Pexels
  10296179, free commercial license, 1280×720, 14.4s, 4.5MB) — golden dust swirling
  in dark water, literally brand-gold. 60% opacity under left + bottom-up gradients.
- **The owner's rAF fade-loop system verbatim**: 500ms fade-in on playing, fade-out
  when 0.55s remain (fadingOutRef guard), reset+replay on ended, each fade cancels
  the prior frame and resumes from current opacity. Plus a static-frame fallback if
  playback can't start, and GoldenTides canvas as onError fallback.
- **Liquid glass** (`.ga-liquid`, his exact recipe): rgba(255,255,255,0.01) +
  luminosity blend + 4px backdrop blur + inset highlight + ::before masked-gradient
  border (xor/exclude). Used for: capsule nav (logo + About/Q&A/Contact/Pricing with
  gold hover + Sign-in), floating "[ 2026 ] Guided by licensed professionals" card
  (Instrument Serif italic accent), email-capture bar (→ /login signup with the email
  prefilled via sessionStorage handoff), "See pricing" pill, 3 circular social buttons.
- **Instrument Serif** headline (new font import): "Your money, finally *clear*." with
  the gold period; 11px tracked gold eyebrow; thin vertical grid lines at 25/50/75
  (desktop); central gold glow ellipse with 25px Gaussian blur.
- Verified: all glass elements + grid + card render, footage draws in-page, email
  handoff lands in signup prefilled, mobile clean (46px headline, no overflow, grid
  hidden). EN/ES complete.

## v0.77 — 2026-06-11 (Minor surface) — Cinematic "Golden Tides" landing hero (owner's references)

The landing hero rebuilt from the owner's two Mux reference animations (Lithos-style
glowing dark terrain / immersive ambient scene): full-bleed `GoldenTides` canvas —
seven layered golden wave-ridgelines drifting slowly out of deep navy-black with
occluding terrain fills, glow strokes, rising ember particles, and subtle mouse
parallax (the anchor/ocean metaphor in brand gold). Huge mixed-type headline
(Newsreader italic "Your money," + light sans gold "finally clear."), corner
annotation blocks + CTA cluster like the reference, scroll cue. Hero is always
cinematic-dark (both refs are); sections below follow the user's theme. The product
mock moved to its own "Your whole picture, live." section. First frame paints
synchronously (rAF can be throttled); reduced-motion renders a static frame; pauses
when the tab hides. Verified by extracting the live canvas render and comparing
against the reference frames.

## v0.76.2 — 2026-06-11 (Patch) — Function consolidation (Vercel 12-cap) + Link-R prod-verified

The v0.76/v0.76.1 deploys FAILED silently: 15 serverless functions > Vercel Hobby's
12-function cap (pitfall #20 — check `gh api …/commits/<sha>/status` after api/
pushes). Consolidated into action-routers: `api/link.js` (invite-email/accept/
overview) + `api/billing.js` (GET promos / POST checkout); count now exactly 12.
**Link-R E2E-verified on production**: invite → accept (email match) → island
snapshotted → test advisor's portal tokens auto-revoked (other advisors' untouched) →
sanitized overview (no SSN/DOB, incomes present, advisor branding) → revoke →
frozen island returns. Demo account restored to its island for the owner walkthrough.

## v0.76 — 2026-06-11 (Major feature) — Account linking (Link-R) + the Useful-Links directory

- **Advisor ↔ client account linking, phase Link-R** (MD-C, all 6 owner answers):
  `client_links` table (migration applied; 1:1 enforced by partial unique indexes; RLS
  advisor-manages-own + client-reads-own-accepted; acceptance service-role only).
  Advisor: client kebab → "Link client account" → email invite (14-day expiry, bilingual
  Resend mail, revoke/re-send). Client: /link?token → sign in/up with the invited email
  (server hard-rejects mismatches) → island data snapshotted to the link row (advisor
  review note) → portal tokens auto-revoked → their Overview becomes the **sanitized
  read-only mirror** of the advisor's record (`api/linked-overview.js` through the SAME
  allow-list as the portal, now shared in `api/_sanitize.js`). Revoke → the client's
  own frozen island returns. AI export + onboarding wizard respect the linked state.
- **Useful Links directory** (MD-K.1, Premium-gated for clients, free for advisors):
  147 vetted resources in 16 life situations (government programs, fair credit, housing,
  immigration, disability, seniors+scams, Florida disasters…), fully bilingual, with
  per-category tips, search, and the ES/free legend. In-app only.
- AI-readable client export ("Copy AI summary" kebab, MD-J) + per-advisor referral
  network (Billing editor → About display with disclosure, MD-K.2) landed earlier today.

## v0.75.2 — 2026-06-11 (Minor) — Two new calculators, role-aware What's New, collapsible Stripe links

- **Life-Insurance Needs (DIME)** + **Inflation Impact** calculators (owner-approved
  non-duplicative adds; the insurance calc ends in a free-consult CTA). Categories
  rebalanced 4/4/3 ("Plan & grow" / "Debt & big purchases" / "Income & protection") —
  the orphan-card blank space is gone. Full EN/ES.
- **What's New is per-role** (MD-I): entries carry an audience; clients see fresh
  client-facing notes (Premium choose-your-price, plans, the welcome wizard), advisors
  see theirs (Members admin, portal v2) plus the legacy log.
- **Stripe links are collapsible TWICE** (MD-H, owner spec): Billing page and the
  Settings services popup group into Memberships / One-time / Other sections with
  +/− toggles, and each service row collapses to name · price · link-status dot.
- Docs (agent-produced, owner-reviewed next): GTM-CLIENT-PITCH, GTM-AGENT-RECRUIT,
  GTM-INVESTOR-BRIEF (MD-L), MASTER-QUESTIONNAIRE + ADVISOR-SOP (MD-J).

## v0.75.1 — 2026-06-11 (Minor surface) — Public About / Contact / Q&A pages (MD-E part 3)

New `src/pages/public.jsx`: PublicShell (pre-auth header nav About/Pricing/Q&A/Contact +
lang/theme/sign-in, quiet footer) wrapping `/about-us` (reuses the in-app AboutPage),
`/contact` (clean contact rows from advisor settings), and `/faq` (8 bilingual visitor
Q&As, accordion). Landing header + footer link to all of them; Back/Forward and
deep-links work; unauthed in-app URLs still clean to `/`. Also: client self-profile no
longer defaults firstName to "My" (shows the account email until onboarding names it).

## v0.75 — 2026-06-11 (Minor) — Members admin, TRUE choose-your-price, payment webhook, branded auth emails

- **Members page** (admin advisors: nav "Members"): every client account with plan/
  joined/onboarding/insurance-interest, counts row, Stripe MRR (lights up with the
  STRIPE_SECRET_KEY env), and **complimentary Premium** grant/revoke by email
  (api/admin-members.js — list is admin-allowlisted; grants stamped compedBy/compedAt).
- **TRUE choose-your-price Premium**: amount input (any whole $ from 3) + dynamic
  thank-you copy → api/create-premium-checkout.js finds/creates the recurring price
  (lookup_key premium-m-<amt>) and opens Checkout with client_reference_id. Replaces
  the fixed $3/$10/$20 buttons everywhere (upsell card, Settings, pricing page);
  falls back to nearest tier link until the Stripe env vars are set.
- **Payment → activation webhook** (api/stripe-webhook.js, endpoint registered in
  Stripe): checkout.session.completed flips the account to premium;
  subscription.deleted reverts to free. Manual-claim flow stays as backup.
- **Auth emails now branded**: Supabase SMTP via Resend — sender "Mauricio Hernandez
  <noreply@finance.goldenanchor.life>", no more 2/hr limit.
- MDD fixes: client avatar menu showed the DEFAULT advisor email (mauricio@…) —
  now the account's real email; verify screen explains the existing-account case;
  signup notes one-account-per-email; Login gets logo-click + "← Home" back to the
  landing page.

## v0.74.3 — 2026-06-11 (Patch) — Page-title de-redundancy (MD-G part 1)

The top banner already names the page; in-page literal duplicates removed app-wide:
Calculators h1 gone (eyebrow+desc carry it), Promotions h1 gone ("Offers" eyebrow
stays), Resources duplicate eyebrow gone (the editorial "Learn the fundamentals" h1
stays). Editorial headers that DON'T duplicate the banner (About hero, Pricing) kept.

## v0.74.2 — 2026-06-11 (Patch) — MD-F named design fixes (About + public pricing)

- Public pricing background: cursor line-field canvas → the landing's quiet radial glow
  (consistent pre-login family).
- About: "Coaching, not management" pill removed (said elsewhere); "What we do" header
  block removed (cards stand alone); spinning dashed orbit hero visual → calm static
  hairline rings; badge-style social dots → clean hairline contact ROWS (icon · label ·
  value, gold accent).
- Contact links: Website now editable in Settings → Advisor information
  (`settings.websiteUrl`); About reads it (with the IG/email/phone that were already
  editable).

## v0.74.1 — 2026-06-11 (Minor surface) — Marketing landing page at / (MD-E part 2)

New `LandingPage` (src/pages/landing.jsx): advertising-voice front door — hero with the
"Your money, finally clear." headline + LIVE product visuals (real SmoothAreaLine/Donut/
RadialGauge with sample data — theme-aware, sharper than screenshots), KPI chips,
3-step how-it-works, 6-feature grid (hairline rows, no card-soup), "with an advisor or
on your own" section with the 3-tier teaser, final CTA band, ONE quiet compliance line
in the footer (D-17). Scroll-reveal honors reduced motion. EN/ES, dual-mode. Login now
lives at /login; landing CTAs route there.

## v0.74 — 2026-06-11 (Minor) — Plan ladder + Premium gating (MD-A)

- **Free vs Premium for client accounts.** New `src/components/premium.jsx`: `PremiumCtx`
  (provided at app root, role-derived — advisors NEVER gated; D-7 amended), plan from
  `client.accountPlan` (absent → free).
- **Gated for free clients**: in-profile Calculators tab, Complete Report, month
  Compare (PDF rides along), and the extra investment packages (ALT_PACKS → lock note).
  Each gate renders the choose-your-price upsell card ($3/$10/$20, warm copy, every
  tier unlocks everything).
- **Activation (light flow)**: tier links carry `client_reference_id=<uid>`; after
  paying, "I already subscribed — activate" sets the plan instantly and emails a
  verification lead to finance@ for cross-checking against Stripe receipts. Webhook
  sync replaces the claim step in MD-H.
- **Pricing page**: new "Use the app with or without an advisor" section — Free + Premium
  cards above the advisory services (public CTA → create account; in-app → tier links).
- **Client Settings "Your plan"**: shows the real plan; Premium tiers + advisor plans
  as separate upgrade groups.

## v0.73.2 — 2026-06-11 (Patch) — Live Stripe realigned to catalog (executed via API)

Audit found live Stripe still charged OLD prices (Quarterly $99, Lite $29/mo, Annual
$299 once, Strategy $99/$79 split) while the app displayed catalog prices. Fixed via
API with the owner's key: new default prices ($199/$129/$49/mo/$499-yr recurring),
real Lite+ product $79/mo (old link sold Lite+Checkup!), duplicate-checkup + Car
products archived, GACLIENT50 promo live (restricted to the $149 Checkup), 6 dead
payment links replaced in DEF_SETTINGS + all 3 stored advisor settings rows, and
"Golden Anchor Premium" created ($3/$10/$20 choose-your-price, `PREMIUM_TIERS`).
Zero active subscriptions existed. Keys stored gitignored; rotation flagged pre-launch.

## v0.73.1 — 2026-06-11 (Patch) — Pre-auth routes: /login and /pricing are real URLs (MD-E part 1)

`/login` shows the sign-in page, `/pricing` deep-links to the public pricing page (Back
works, popstate handled, unauthed deep-links to in-app URLs clean to `/`). `/` still
shows the login hero for now — the designed marketing landing replaces it in MD-E part 2.
`showPricing` boolean replaced by URL-backed `preAuth` state.

## v0.73 — 2026-06-11 (Minor) — Email verification + client onboarding wizard (MD-D)

- **Email verification is ON** (Supabase `mailer_autoconfirm:false`; site_url fixed from
  localhost:3000 → production; redirect allow-list set). New signups must confirm email.
  ⚠️ Built-in Supabase sender for now (rate-limited ~2/hr) — paste RESEND_API_KEY to
  upgrade to custom SMTP (REVIEW_QUEUE).
- **Verify-email screen** in the login card: shows the address, resend button (60s
  server cooldown), "already confirmed → sign in"; unconfirmed sign-ins bounce here.
- **Client onboarding wizard** (new `src/pages/onboarding.jsx`, once per account after
  ToS): name → goal chips + free text (lands in notes.goals) → owner-specified
  checkboxes for FREE health-insurance consultation + car insurance (checked boxes
  email a lead to finance@goldenanchor.life via send-support-email) → done. Skippable;
  sets `onboardedAt`.
- **ToS gate restyled** to the modern token language (was the old heavy gold-border look).
- v0.72.4 (same day): client-checkup retired, D-13 re-locked at catalog prices,
  returning-client code note on the Checkup card; master directive logged
  (docs/MASTER-DIRECTIVE.md); research docs added (USEFUL-LINKS-DIRECTORY 147 links/16
  categories, DIFFERENTIATION-IDEAS, CALCULATOR-ROADMAP).

## v0.72.3 — 2026-06-11 (Patch) — Pricing audit, client Upgrade buttons, InterestCalc frequency, touch pass

- **Pricing audit** (`docs/PRICING-AUDIT.md`): 3-way comparison of locked D-13 prices vs the
  shipped catalog vs Stripe links. Found the duplicate initiation (initial-checkup $149 vs
  client-checkup $99 — recommend one product + a `GACLIENT50` code) and 4-service price
  drift. Owner decisions listed in §4.
- **Client "Your plan" Upgrade buttons**: the client-role Settings plan card's detail face
  now shows three Stripe payment-link buttons (Monthly Lite / Lite+ / Annual) with catalog
  prices, bilingual, via a new `actions` prop on `SettingsCard`. Light flow — advisor marks
  the plan manually after payment.
- **InterestCalc compound frequency wired**: the Monthly/Quarterly/Annual dropdown was
  decorative (always compounded monthly); now real math (`pr=r/pf`, `n=years*pf`,
  deposits scaled `12/pf`). Verified $12,834 (monthly) vs $12,763 (annual) on same inputs.
- **Touch pass (moderate)**: `@media(pointer:coarse)` block — 40px button / 44px form-control
  floors, taller table rows, spotlight hover disabled. Touch devices only; desktop unchanged.
- **Portal email live-tested** through prod (Resend message `d08de40d-…`); SVG
  `fontVariantNumeric` DOM-prop warning fixed in charts.jsx.
- Docs: advisor↔client linking design (design only) appended to `docs/ARCHITECTURE-PLAN.md`;
  charts + field-dictionary buckets completed in the golden-anchor-logic skill.

## v0.72 → v0.72.2b — 2026-06-10/11 — D-37 decomposition phases 1b–2b (see git log)

App.jsx 8,502 → ~3,790 lines (−55%). Phase 1b: 33 UI primitives + 9 standalone calculators →
`src/components/`. Phase 2a: marketing + landing → `src/pages/`. Phase 2b: legal, intake,
admin/settings, portal → `src/pages` + `src/components`; fixed the since-v0.13
`/intake-submissions` deep-link bounce (parseGAPath prefix swallow) and rehomed the
`__GA_BUILD__` marker to App.jsx. Every extracted surface driven live after each move.

## v0.70 → v0.71.3 — 2026-06-10 — Sprint: design system, portal v2, client role, logic skill

Phase 0/1a extraction (services/styles/contexts/constants/utils + charts/anim hooks).
Design-system pass per `docs/DESIGN-POLISH-PUNCHLIST.md` (alpha-overlay borders, 3-step text,
Mercury number style, desaturated semantics, one-hover-per-surface, motion tokens; KPI deltas
as tinted mono chips; table/button spec; gold light-accent fallback). Share-portal v2 (expiry,
module checkboxes server-sanitized in `api/resolve-portal.js`, email via Resend, preview-as-
client; migration `2026-06-10-portal-link-modules.sql`). Client-role Settings page + nav
guard + adversarial role-access proof. New consulted skill `.claude/skills/golden-anchor-logic/`.

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
