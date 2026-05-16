# WORKPLAN.md — Golden Anchor Finance

**Operational source of truth for working with Claude on this project.**

Every Claude chat that touches this project MUST:
1. Read this file as step 0, before anything else.
2. Confirm which chat number it is and mark its claim in §3 before doing any work.
3. Follow Mauricio's preferences in §1 without exception.
4. Update this file before finishing (§3 status, §4 log).

This file is the answer to "how do I, Mauricio, not get lost when I'm running parallel chats and each Claude only knows its own conversation?" Everything a new chat needs to know lives here.

---

## §1. Mauricio's working preferences (static)

These are LOCKED. Every chat follows them. Update only on Mauricio's explicit instruction.

### Environment
- Works exclusively in **GitHub Codespace**.
- Commits and pushes **from the terminal**, not the VS Code source control UI.
- Has 1Password, encrypted external drive available for sensitive files.
- Not a programmer. Treat instructions as recipe-style: copy this, paste here, run this.

### Communication
- Be direct. Skip compliments. Don't open with "Great question!"
- Treat as finance professional. Don't over-explain basics.
- Default language English. Switch to Spanish only if Mauricio writes in Spanish first.
- Numbered shorthand responses are fine (Mauricio writes "1. yes 2. a" — read it as answers to the numbered questions just asked).
- Acknowledge real constraints: major life transition, fiancée with health limitations, growing business, exiting day job in 2026.

### Parallel chats
Mauricio runs **up to 2 Claude chats simultaneously** to stay productive while waiting on responses. To prevent collisions:
- Before working, a chat MUST claim its Chat N slot in §3 of this file by changing the status from `queued` to `in-progress (claimed: YYYY-MM-DD HH:MM)`.
- If a chat opens this file and the requested Chat N is already `in-progress`, it MUST stop and ask Mauricio whether to (a) pick a different queued chat, (b) override (the other chat was abandoned), or (c) wait.
- A chat that finishes its work flips its own entry to `done` and writes a new `queued` entry for the chat after the queue's last item, using preferences in §2.

### Deliverables — EVERY chat delivers ALL of these (no exceptions)

After every meaningful change, Mauricio receives:

1. **All modified files** as downloadable artifacts (drag-into-Codespace ready).
2. **The exact terminal commit + push commands** for this Codespace, with the commit message already written. Format:
   ```bash
   cd /workspaces/Financeapp
   git add <list of files>
   git commit -m "type(scope): subject

   Body explaining what and why."
   git push origin main
   ```
3. **Updated WORKPLAN.md** as a file (option (a) from setup — delivered as artifact, not as a diff).
4. **TWO follow-up prompts**, each clearly labeled:
   - **PROMPT A — "Continue working on this same issue in a new chat."** Used if Mauricio runs out of context mid-task or starts a parallel chat on the same work. Lists files to upload, references the current Chat N slot.
   - **PROMPT B — "Move to the next queued chat."** Used when this work is fully done and committed. Lists files to upload for Chat N+1, references the next Chat N+1 slot.

The two-prompt delivery is critical for parallel work — Mauricio can hand PROMPT A to one Claude chat and PROMPT B to another without either one stepping on the other.

### Edits to files NOT uploaded in the chat

When a chat needs to edit a file that wasn't uploaded (CHANGELOG.md addendum, README tweak, etc.), default to **Option A: GitHub web editor instructions**. Format:

> **To update `CHANGELOG.md` directly on GitHub:**
> 1. Open https://github.com/<user>/<repo>/edit/main/CHANGELOG.md
> 2. Replace the entire file content with the block below (or paste the new entry at the top, marked clearly).
> 3. Commit message: `docs(changelog): <subject>`
> 4. Commit directly to main.

Provide the full new file content OR a clear "paste this at the very top, before the first `## v...` line" instruction.

**Option B (terminal heredoc)** is available on request, for when GitHub web UI is annoying:
> Paste this in Codespace terminal: `cat > CHANGELOG.md << 'EOF' ... EOF`

Default = Option A. Only use Option B when Mauricio asks for it.

### Version bumping policy

- **App.jsx structural changes** → version bump per SKILL.md (patch/minor/major as appropriate).
- **App.jsx behavior change** with no structural change → patch bump.
- **Docs-only changes** (AGENT.md, CHANGELOG.md, WORKPLAN.md, SKILL.md) → no bump. Footer date update only.
- **Test-harness only** (utils/fixtures.ts, tests/) → no app version bump. Tooling addendum in CHANGELOG.

### File-handling rules

- **Repo is source of truth.** Project knowledge and uploads are temporary copies.
- **Never use date-suffixed or version-suffixed filenames.** No `App-v0.6.2.jsx`, no `App-backup.jsx`. One canonical name per file. History lives in git.
- **Build marker check at chat start.** Every chat reads `window.__GA_BUILD__` in uploaded App.jsx and compares to AGENT.md §3. If they don't match, stop and ask Mauricio to refresh before doing anything.
- **Project knowledge contents (LOCKED, only these three files):**
  - `AGENT.md`
  - `SKILL.md`
  - `WORKPLAN.md` (this file)
- Everything else is per-chat upload.

### Session-end / context-exhaustion behavior

If a chat is running out of context mid-work and can't finish:
1. Update §3 of this file with partial progress (notes on what was done, what remains).
2. Mark the slot as `paused (claimed: ...)` not `done`.
3. Deliver PROMPT A so a new chat can resume from the partial state.
4. Tell Mauricio plainly: "I'm running out of room — open a fresh chat with PROMPT A to finish this."

---

## §2. Default chat-prompt template

Every queued chat in §3 uses this skeleton. Filled in per chat with specific files and goal.

```
Project: Golden Anchor Finance.

You are Chat <N>. Step 0: read WORKPLAN.md from project knowledge. Confirm
this chat's slot in §3 is queued, then mark it in-progress before doing
anything else. If another chat has already claimed it, stop and ask.

Then read AGENT.md §3 (current version + build marker) and §4 (locked
decisions). Compare to window.__GA_BUILD__ in the uploaded App.jsx. If
they don't match, stop and ask Mauricio to refresh.

Files uploaded for this chat: <list>
Files NOT to load (stay out of context): <list>

Goal: <one paragraph>

Spec: <bulleted spec>

Out of scope (defer to a later chat): <bulleted list>

Deliverables (per WORKPLAN.md §1):
- All modified files as artifacts
- Terminal commit + push commands with message
- Updated WORKPLAN.md
- PROMPT A (resume this same chat in new context)
- PROMPT B (move to next queued chat)

Version bump policy: <patch | minor | none — per WORKPLAN.md §1>
```

---

## §3. Active queue (rolling window — 2-3 chats max)

Status legend:
- `queued` — ready for a chat to claim
- `in-progress (chat-id: <claim>, since: YYYY-MM-DD HH:MM)` — actively being worked
- `paused (chat-id: <claim>, since: ..., notes: ...)` — context-exhausted, needs resume
- `done` — shipped and committed

### Chat 3 — IA changes (delete Forms, merge Intake) [`done`]

**Files to upload:** `src/App.jsx`, `src/translations.js`.

**Goal:** Kill the standalone Forms tab. Consolidate intake into one global "Intake Forms" surface. Move Investment Allocation and Emergency Fund OUT of intake and INTO the Monthly Statement tab (advisor-only).

**Spec:**

1. **Delete the standalone Forms tab entirely.** Remove from the `NAV` array. Remove the `FormsPage` component. Remove orphaned translation keys (audit carefully — some `forms*` keys may be reused elsewhere; only delete truly orphaned ones).

2. **Rename "Intake Submissions" → "Intake Forms"** everywhere it appears (nav label, page header, related help text). Both EN and ES.

3. **Remove the per-client Intake tab from `ClientDetail`.** Drop the `intake` entry from the tabs array. The `IntakeSection` component STAYS — still used by the global Intake Forms page.

4. **Discard existing per-client intake data on read.** Mauricio confirmed current data is all test data. Stop rendering `client.intakeData` anywhere. Don't write to it on save. Don't migrate it.

5. **Investment Allocation + Emergency Fund move to Monthly Statement:**
   - Remove the Investment Allocation and Emergency Fund sections from the Intake Forms surface (client-facing — they should never be asked of the client).
   - Add Investment Allocation and Emergency Fund sub-sections to `MonthlyTab` (in ClientDetail → Monthly Statement), advisor-editable.
   - Same data fields as before, same Complete Report rendering. Just a different edit surface.

6. **Intake Forms workflow preserved:** when advisor opens a submission, the existing "apply to client / create client from this" buttons stay. Confirmed.

**Out of scope:** mobile redesign, bulk actions, Playwright fixes.

**Version bump:** minor → v0.7.0 (IA breaking change — Forms tab removed, per-client intake gone).

**Deliverables:** per §1.

---

### Chat 4 — Bulk actions on Clients tab [`done`]

**Files to upload:** `src/App.jsx`, `src/translations.js`.

**Goal:** Multi-select on the Clients tab + burger menu with bulk Split/Join/Archive/Delete.

**Spec:**

1. **Selection model:** checkbox at the leftmost position of each `ClientList` row. Header row has "select all visible". Selection is component-local state. Row body click still opens client detail; only the checkbox toggles selection.

2. **Burger menu** on Clients tab header (next to "New Client" button):
   - 📦 Archive Selected (N)
   - ↩ Restore Selected (N) — only enabled if all selected are archived
   - 🗑️ Delete Selected (N) — confirmation requires typing "DELETE"
   - ✂️ Split — opens picker modal (see #3)
   - 🔗 Join — opens picker modal (see #4)
   - All items disabled if zero selected.

3. **Split flow:** click ✂️ Split → modal with search bar + list of all currently-partnered clients. Picking one opens existing `SplitAssignModal`. Bulk selection state is ignored — Split is inherently single-client.

4. **Join flow:** click 🔗 Join → modal with search bar + list of all single clients (no partner). Picking one opens existing `JoinModal`. Bulk selection state ignored.

5. **Archive / Restore / Delete:** act on entire selection. Each shows a confirmation modal listing affected clients ("Archive 3 clients: John Smith, Jane Doe, Carlos Ruiz"). Delete requires typing "DELETE" exactly.

6. **Per-client kebab menu in ClientDetail** keeps existing items unchanged. Bulk menu is additive.

**Out of scope:** mobile polish of new modals, Playwright fixes.

**Version bump:** minor → v0.8.0 (new feature: bulk actions).

**Deliverables:** per §1.

---

### Chat 5 — Mobile / responsive redesign [`queued`]

> **Dependency:** do not claim this chat until Chat 3 (IA changes) is `done` and committed. Chat 3 deletes the Forms tab and the per-client Intake tab; redesigning those surfaces first would waste the work. If Chat 3 is not yet done when this slot is reached, leave it `queued` and claim Chat 4 instead.

**Files to upload:**
- `src/App.jsx` (latest from repo)
- `src/translations.js`

**Files NOT to upload:** CHANGELOG.md.

**Goal:** Make the whole app usable on a phone. It is currently desktop-first and several surfaces overflow horizontally on a narrow viewport. This pass restructures the layout primitives so nothing requires horizontal scrolling and the primary actions are reachable one-handed.

**Spec:**

1. **Top bar.** Remove the ⚓ mark from the mobile top bar to reclaim width (keep it on desktop). Title and nav must fit a ~360px viewport without truncation.

2. **KPI grid.** The dashboard KPI cards (currently a fixed multi-column grid) collapse to a single column — or 2-up at most — on narrow screens. No card content clips.

3. **Client row restructure.** The `ClientList` row currently lays name, figures, and chevron in one wide horizontal strip. Restructure so it stacks cleanly on mobile (name on top, key figures below) with no horizontal scroll.

4. **Button hierarchy.** Audit primary / secondary / tertiary buttons across the main tabs. On mobile, primary actions should be full-width or clearly dominant; secondary actions shouldn't compete. No row of 4+ equal-weight buttons on a phone.

5. **No horizontal scroll anywhere.** Walk every tab (Dashboard, Clients, ClientDetail tab strip, reports) at ~360px and confirm nothing overflows. Tables that genuinely can't shrink get a contained scroll region, not page-level overflow.

This is a styling / layout pass. Do NOT change data shape, component responsibilities, or the EN/ES dictionary beyond any new layout-related strings (which still go in both languages per D-18).

**Out of scope:**
- IA changes (Chat 3)
- Bulk actions (Chat 4)
- Playwright fixes (Chat 6)
- Any new features

**Version bump:** minor → v0.9.0 (significant UI redesign, no breaking data change).

**Deliverables:** per §1.

---

### Chat 6 — Playwright resync [`queued`]

> **Dependency:** do not claim this chat until Chats 3 (IA changes), 4 (bulk actions), and 5 (mobile redesign) are all `done` and committed. The selectors and IA assumptions in the test suite will all shift once those three land; resyncing before any of them ships wastes the work.

**Files to upload:**
- `src/App.jsx` (latest from repo, post-Chats 3/4/5)
- `tests/01-smoke.spec.ts`, `tests/02-calculators.spec.ts`, `tests/03-client-workflows.spec.ts`, `tests/04-translation.spec.ts`, `tests/05-persistence.spec.ts`
- `utils/fixtures.ts`
- `playwright.config.ts`

**Files NOT to upload:** CHANGELOG.md, `translations.js` (unless a translation-related selector breaks).

**Goal:** Re-baseline the Playwright suite against the post-Chat 5 app. Specifically: (a) IA changes from Chat 3 broke any selector that opened the per-client Intake tab, the standalone Forms tab, or expected "Intake Submissions" wording; (b) bulk actions from Chat 4 added new ClientList rows + a burger menu that the 03-client-workflows suite walks past; (c) mobile redesign from Chat 5 changed the ClientList row shape, KPI grid layout, and top-bar — anything pinning a specific desktop layout will fail on the new responsive primitives.

**Spec:**

1. **Catalog the failures first.** Run `rm -rf playwright/.auth && npm run test:e2e` against the current repo. Capture the failing selectors / wait-on conditions per spec file; group by root cause (IA / bulk-actions / mobile).

2. **Fix selectors against the new app shape.** Prefer stable hooks the app already exposes — `data-cf` attributes from `Field` (line 157 in pre-Chat-3 App.jsx; the line will have moved by Chat 5), `getByTitle` on the language toggle, accessible names on primary buttons. Avoid pinning to specific text where translation could shift it; use regex `/Intake.*Form|Forms/i` patterns where the rename could bite.

3. **Cover the new surfaces.** Add minimal coverage for: the bulk-select checkbox, the new burger menu (selection-count gating), the bulk Archive/Delete confirmation flows, and the Investment Allocation / Emergency Fund sub-sections in the Monthly Statement tab.

4. **Re-enable WebKit if Codespace allows it.** Mauricio to run `sudo npx playwright install-deps webkit` once at the start of this chat. If the deps install successfully, uncomment the webkit project block in `playwright.config.ts` and rebaseline against three browsers.

5. **Update AGENT.md §13** ("Playwright end-to-end testing") with the new known-issues list and the post-resync passing count.

**Out of scope:** any new app features, any new translation keys, any architectural changes to App.jsx, any test framework upgrades (stay on Playwright current major).

**Version bump:** none (test-harness only, tooling addendum per §1 policy).

**Deliverables:** per §1, but `App.jsx` and `translations.js` are upload-only — they should NOT come back modified unless the chat surfaces a real app bug while debugging.

---

## §4. Backlog (no prompts yet — promoted to §3 as queue empties)

- **Server-side intake delivery (future, post-DNS-migration).** v0.7.3 shipped the MVP mailto/SMS/copy-message version. Server-side upgrade adds: (a) Resend integration for email delivery from `mauricio@goldenanchor.life` (blocked on Porkbun→Cloudflare DNS migration for SPF/DKIM/DMARC records); (b) Twilio SMS API for outbound SMS without requiring the advisor's phone (advisor pays per-message, ~$0.01/SMS); (c) invite-token system — generate unique tokens, prefill the intake form with `invite=<token>` query param, track which prospect opened the link and when. Open decisions: email provider (Resend recommended for simplicity), Twilio account setup + verified business profile, opt-in legal language for SMS (TCPA compliance — explicit consent required, even for B2C financial services outreach in Florida). Not blocked on Chat 4/5/6 — can ship as v0.8.x patch when DNS is sorted.
- **WhatsApp Business API delivery (long-term, deferred).** Per Mauricio's call, this is not a near-term priority. WhatsApp Business API requires verified Business profile through Twilio (days to weeks of approval), template-message pre-approval (Meta reviews each template), and per-conversation pricing. Revisit only if SMS proves inadequate after the server-side intake delivery feature ships.
- **Future:** Stripe webhook for auto-`lastPaidAt`. ToS/engagement-letter signature gate (O-14). Service plan in Strategy Plan tab (Q1 follow-up — currently in Monthly Statement, may want it surfaced in the planning view too).

---

## §5. Completed log

| Chat # | Version | Date | Title |
|---|---|---|---|
| 4 | v0.8.0 | 2026-05-16 | Bulk actions on the Clients tab, **action-first**: the list looks unchanged (no checkboxes, no selection bar) until the advisor picks an operation from the ☰ menu. `ClientList` rewritten (now multi-line). Five menu items — 📦 Archive… / ↩ Restore… / 🗑️ Delete… / ✂️ Split… / 🔗 Join…, all always enabled (selection happens after the menu pick, so there is nothing to gate them on). Archive/Restore/Delete enter a selection `mode`: a coloured action bar appears (select-all + live count + Cancel + action button) and checkboxes appear on the rows the action can touch — Archive on active clients only, Restore on archived only (Archived section auto-expands), Delete on every client; non-applicable rows are dimmed and inert. The action button opens a confirmation modal listing affected clients by name; bulk Delete requires typing `DELETE`. Selection is component-local `useState(()=>new Set())` of client ids, cleared on Cancel/completion. Split/Join never use row selection — each opens a searchable picker (partnered clients → existing `SplitAssignModal`; single clients → existing `JoinModal`), reused unchanged. 4 new App handlers: `archiveMany`/`restoreMany`/`deleteMany`/`splitClientPair` (all `useCallback`); `joinClients` reused. Shared `Kebab` untouched. ClientDetail per-client kebab untouched. +28 translation keys × 2 langs; dictionary 1,158 → 1,186 per side. App.jsx 2,743 → 2,854 lines. No SQL migration. (Note: an earlier draft used an always-on select-first selection bar; revised to action-first per Mauricio before release.) |
| 3 | v0.7.3 | 2026-05-16 | Intake form bundle: (1) **autofill suppression** — every `<input>` in `IntakeFormBody` gets `autoComplete="off"` + `data-lpignore="true"` + `data-1p-ignore="true"`; SSN fields switched from `<SSNInput type="password">` to inline `<input type="text">` with inline `fmtSSN` helper (advisor's Gmail/saved-password no longer bleeds into the form when opening the public URL in their own browser); (2) **Client Type + Recommended By removed** from intake — SSN now pairs with How-Heard, vestigial fields gone; (3) **light/dark toggle** on public intake page — `mode` state persisted to `localStorage["ga_intake_mode"]`, `ThemeCtx.Provider` value rebuilds on mode change so reused editors follow; toggle button ☀️/🌙 placed left of EN/ES selector; (4) **MVP send-intake-link** — collapsible "Send link to a prospect" panel under the Public Intake URL card with prospect name/email/phone inputs + EN/ES lang toggle + three action buttons: ✉️ Send Email (opens `mailto:` with pre-filled subject + bilingual body), 💬 Send SMS (opens `sms:`), 📋 Copy message (clipboard). No server, no DNS work — server-side Resend/Twilio upgrade deferred to backlog "Server-side intake delivery (future)"; WhatsApp delivery explicitly deferred long-term. +11 translation keys × 2 langs; dictionary 1,147 → 1,158 per side. App.jsx 2,696 → 2,743 lines. |
| 3 | v0.7.2 | 2026-05-16 | Intake form polish on top of v0.7.1: (1) SSN field uses existing `SSNInput` component in all 3 spots (main, P1, P2) — auto-formats as `XXX-XX-XXXX`, masked with Show/Hide toggle, no longer required (asterisk removed); (2) `ThemeCtx.Provider` in `PublicIntake` now passes a flat theme object instead of a `{dark,light,isDark,settings}` wrapper — reused `IncomeSection`/`BillsSection`/`DebtSection`/`CustomAssetsSection` editors now render with gold/blue accents matching CONTACT & SERVICE; (3) `SA` sort-arrow component `marginLeft:2 → 6` for visible space between column label and ↑/↓ arrow (affects every sortable table app-wide). App.jsx 2,694 → 2,696 lines. No translation changes. No schema change. |
| 3 | v0.7.1 | 2026-05-16 | Full-parity public intake form + Edit/Delete submissions (follow-up to v0.7.0 IA refactor). PublicIntake body rewritten to use shared `IntakeFormBody` component reusing IncomeSection/BillsSection/DebtSection/CustomAssetsSection editors against client-shaped local state hydrated via `mk()`; SSN + partner full P1/P2 + Notes (goals/short/mid/long-term/setbacks/general) collected. `IntakeSubmissionsPage` detail panel adds "✏️ Edit Intake" button mounting new `IntakeSubmissionEditor` modal (hydrates submission.data → mig() → IntakeFormBody → writes back via `gaUpdateIntakeData`). Per-row 🗑️ Delete + header-level "🧹 Clear converted ({n})" / "🧹 Clear rejected ({n})" bulk delete buttons. 3 new Supabase helpers: `gaUpdateIntakeData`, `gaDeleteIntakeSubmission`, `gaDeleteIntakeSubmissionsByStatus`. `doConvert` rewritten to spread `{...sub.data}` through `mig()` with legacy v0.6.x fallback for flat submissions. +6 translation keys × 2 langs (`intakeEditBtn`, `intakeDeleteBtn`, `intakeConfirmDelete`, `intakeClearConverted`, `intakeClearRejected`, `intakeConfirmClear`); dictionary 1,141 → 1,147 per side, symmetry intact. No schema change — payload rides existing `intake_submissions.data` JSONB. |
| 3 | v0.7.0 | 2026-05-16 | IA refactor: deleted standalone Forms tab + `FormsPage` + orphan `dlTmpl`. Renamed Intake Submissions → **Intake Forms** (EN) / **Formularios de Admisión** (ES). Removed per-client Intake tab from `ClientDetail`; `IntakeSection` definition retained for future reuse. Moved Investment Allocation + Emergency Fund out of intake (`SavingsSection` call dropped from `IntakeSection`); they remain advisor-only inside the Monthly Statement via `FullMonthView` → `SavingsSection`. Redirected post-convert and post-addClient flows to land on `monthly` instead of the deleted `intake` tab. Deleted 6 orphan translation keys × 2 langs (`forms`, `formsTitle`, `formsDesc`, `downloadCSVTemplate`, `howToUseColon`, `newClientOnboarding`); dictionary 1,147 → 1,141 per side, symmetry intact. |
| 2 | v0.6.3 | 2026-05-16 | Service Plan UI trimmed to 4 fields (plan, start date, payment method, payment link URL); Pay Now / Pay Later buttons added to the Service Plan editor. `clientGoals` label moved to second person (EN + ES). +1 translation key (`payLater`), dictionary 1,146 → 1,147 per side. |
| — | — | 2026-05-15 | SKILL.md: added Step 0 (WORKPLAN.md claim requirement). Renumbered existing Steps 0–5 → 1–6. Out-of-band docs fix, no app version bump. |
| 1 | v0.6.2 | 2026-05-15 | Translations extracted to `src/translations.js`. D-1 amended (pure-data carve-out). D-29 locked. |
| — | v0.6.1 | 2026-05-15 | Prefs + intake UX. (Pre-WORKPLAN era.) |
| — | v0.6.0 | 2026-05-15 | Mobile shell + PWA install (D-27). (Pre-WORKPLAN era.) |
| — | v0.5.2b | 2026-05-15 | Service plans + Stripe links + backup verification. (Pre-WORKPLAN era.) |
| — | v0.5.2a | 2026-05-14 | Idle auto-logout + password reset + save-failure toast. (Pre-WORKPLAN era.) |

(Older entries: see CHANGELOG.md in the repo.)

---

## §6. Glossary

- **Codespace:** Mauricio's GitHub Codespace dev environment. Always `cd /workspaces/Financeapp`.
- **AGENT.md:** App architectural truth — version, decisions, pitfalls.
- **SKILL.md:** The procedure for editing App.jsx and docs safely.
- **CHANGELOG.md:** Per-version release notes. Lives in repo. NOT in project knowledge.
- **WORKPLAN.md:** This file. Operational truth — what's next, who claimed what, how to deliver.
- **Project knowledge:** The persistent file set every chat in this Claude project sees. Locked to AGENT/SKILL/WORKPLAN.
- **Upload:** Per-chat file attachment. Throwaway after the chat ends.
- **PROMPT A:** "Continue this same chat's work in a new chat." Used for context exhaustion or parallel work on same issue.
- **PROMPT B:** "Move to the next queued chat." Used when current work is fully done and committed.

---

*This file is itself versioned via git. If you're reading it and the §3 queue looks out of date or contradicts the CHANGELOG, the file may be stale — pull latest from `main` before relying on it.*

*Last updated: 2026-05-16 — Chat 4 shipped v0.8.0 (bulk actions on the Clients tab, action-first: the list is unchanged until the advisor picks an operation from the ☰ menu, which then opens a per-action selection mode with confirmation modals; Split/Join are selection-independent pickers). Chat 4 flipped to `done` in §3. Chats 5 (mobile/responsive redesign) and 6 (Playwright resync) remain `queued`. Chat 5's dependency — Chat 3 (IA changes) `done` — is satisfied, so Chat 5 is now claimable; Chat 6 still waits on Chat 5. Queue now: Chats 5, 6. Backlog unchanged: server-side intake delivery (DNS-blocked) + WhatsApp (long-term) + Future.*
