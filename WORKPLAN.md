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

### Chat 5 — Mobile / responsive redesign [`done (v0.9.0, 2026-05-16)`]

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

### Chat 6 — Playwright resync [`done (test resync, 2026-05-17)`]

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

### Chat 7 — Server-side intake delivery [`done (v0.10.0, 2026-05-18)`]

> **Dependency:** the email path needs SPF / DKIM / DMARC records on `goldenanchor.life` before Resend can send from `mauricio@goldenanchor.life`. This is **NOT** blocked on the Porkbun→Cloudflare *registrar transfer* (that transfer is locked until ~2026-07-15 by the 60-day ICANN lock, and is a separate, later task). What this chat actually needs is the DNS records to exist — and they can be added now.
>
> **Plan (decided 2026-05-17, Mauricio — "Option B"):** point `goldenanchor.life`'s **nameservers** at Cloudflare while leaving the domain *registered* at Porkbun. Changing nameservers is unrestricted — the 60-day lock only blocks moving the registration. DNS is currently served by Porkbun, so this is a clean cutover, not a half-migration. After the nameserver switch, all DNS records (including the Resend SPF/DKIM/DMARC set) are managed in the Cloudflare dashboard. The full registrar transfer to Cloudflare happens later as its own deliberate task (~2026-07-15+), unrelated to this chat.
>
> **Before claiming this chat, confirm:** (a) the Cloudflare nameservers are live on the domain (`dig NS goldenanchor.life` returns the `*.ns.cloudflare.com` pair); (b) all pre-existing records were carried over to Cloudflare before the cutover — the `/intake` setup, any MX records, and the app's existing CNAMEs must not drop; (c) Resend's SPF/DKIM/DMARC records are added in Cloudflare and Resend shows the domain verified. If any of those is not true, leave this slot `queued` and tell Mauricio which step is outstanding.

**Files to upload:**
- `src/App.jsx` (latest from repo)
- `src/translations.js`
- `CHANGELOG.md`

**Files NOT to upload:** the Playwright suite (`tests/`, `utils/fixtures.ts`, `playwright.config.ts`) — unless the new delivery UI warrants test coverage in the same pass, in which case add it as a follow-up.

**Goal:** Upgrade the v0.7.3 MVP intake delivery (mailto / sms / copy-message) to real server-side delivery — email via Resend, SMS via Twilio — plus an invite-token system that prefills the public intake form and tracks who opened the link.

**Spec:**

1. **Resend email integration.** Send the intake invite from `mauricio@goldenanchor.life` server-side (no advisor mail client). Requires the SPF/DKIM/DMARC records to be live and the domain verified in Resend first — added in the Cloudflare DNS dashboard once nameservers are pointed there (see the Dependency block; this does NOT wait on the registrar transfer).

2. **Twilio SMS.** Outbound SMS without the advisor's own phone — advisor pays per message (~$0.01/SMS). Requires a Twilio account + verified business profile.

3. **Invite-token system.** Generate a unique token per prospect; the public intake URL accepts `invite=<token>`; the form prefills from the token; track which prospect opened the link and when.

4. **TCPA compliance.** Explicit opt-in language for SMS — even B2C financial-services outreach in Florida needs documented consent. Add the consent copy in EN + ES (D-18).

**Open decisions to close (move from AGENT.md §5 to Locked):** email provider (Resend recommended), Twilio account + verified business profile, SMS consent legal language.

**Out of scope:** WhatsApp Business API delivery (stays in §4 backlog — long-term). Any unrelated app features.

**Version bump:** minor (new feature) — confirm the exact next number against AGENT.md §3 at chat start.

**Deliverables:** per §1.

---

### Chat 8 — Spanish review pass + Resend smoke test in production [`done (v0.12.2, 2026-05-19)`]

> **Completion note (2026-05-19).** Items 1–4 shipped as **v0.12.2**. The Spanish audit was done statically (App.jsx parsed against translations.js) rather than by screenshot walk — more exhaustive: it found **134 hardcoded English strings / 203 code sites** that never routed through `t.key`, all now wired (48 reused keys, 83 new × 2 langs). O-9 roadmap `sub` blocks translated. O-10 Resend production smoke test passed (Mauricio ran it — EN + ES invites, full loop confirmed). **O-9 and O-10 closed in AGENT.md §5.** **Two spec items remain with Mauricio, no code:** item 5 (Twilio go/defer decision — still open) and item 6 (v0.12.x Complete Report PDF smoke test — runbook handed to Mauricio; if it surfaces PDF defects they feed Chat 11 spec item 1, else Chat 11 item 1 is a no-op).


**Files to upload:**
- `src/App.jsx` (latest from repo, post-v0.10.0)
- `src/translations.js`

**Files NOT to upload:** CHANGELOG.md, the Playwright suite.

**Goal:** Close out the two oldest open decisions in AGENT.md §5 — **O-9 (Phase-2 roadmap narrative translation)** and **O-10 (Spanish review pass)** — by walking the EN→ES surface end-to-end and fixing any remaining English bleed-through, regional terminology issues, or wording that reads stiff in Spanish. Also: validate the v0.10.0 Resend integration in production by sending two real intake invites (one EN, one ES) to Mauricio's own inbox and confirming the full open→submit→link-back loop works.

**Spec:**

1. **Spanish audit walk-through.** Sign in, toggle to Spanish, then walk every primary surface: Dashboard, Clients, ClientList, ClientDetail (all 8 tabs), Intake Forms (incl. the new v0.10.0 send panel + Sent invites list + TCPA copy when SMS is toggled — even though SMS is disabled, the consent checkbox renders and its copy must be Spanish), Calculators (all 7), Resources, About, Profile & Settings, Backfill, the Compare report, the Strategy Plan tab, and the Monthly Statement. Take a screenshot every time an English string appears in the Spanish UI.

2. **Fix surfaced bleed-through.** For each English string found, add the translation key (or fix the existing one). Update both `T.en` and `T.es` in the same edit (pitfall #9). Watch for the v0.10.0 send-invite panel specifically — that copy is new and hasn't seen a native-speaker pass yet.

3. **Roadmap narrative blocks** (the original O-9 scope). The Financial Roadmap narrative blocks ("Focus all extra cash on debt...", "Allocate 25% stocks + 20% retirement...") were flagged as the last English-only surface in the v0.5.0 era. If they're still English-only, translate them.

4. **Production Resend smoke test.** Send two real intake invites (one EN, one ES) to Mauricio's own email. Verify: (a) the email arrives within ~30s, (b) the branding renders correctly in Gmail web + Gmail mobile, (c) the link opens the public form, (d) the form prefills correctly, (e) submission flips the invite status to "Submitted" in the Sent invites list, (f) the new intake submission appears in Intake Forms with the prospect's data.

5. **Twilio decision.** Mauricio confirms whether to start the Twilio business profile verification process now (1-3 day approval window) or defer indefinitely. This is a 1-decision close (no code change either way). If go: prerequisites for a future Chat 9 are gathered (account, phone number purchased, business profile submitted). If defer: SMS path stays feature-flagged off; D-32 stays locked as-is.

6. **v0.12.0 Email Complete Report PDF smoke test (added 2026-05-19, post-Chat 10).** With a real client that has non-empty income/bills/debt data, open the Reports → Complete Report tab → click 📧 Email → send the PDF to Mauricio's own email. Verify: (a) the cold-start completes within the 30s `maxDuration`, (b) Gmail receives a `golden-anchor-report-<name>-<date>.pdf` attachment that opens cleanly in Gmail's PDF preview + Adobe Acrobat, (c) the PDF KPI strip + income/bills donuts + debt bar + asset table + notes all render with the expected numbers (no `$NaN`, no missing cells), (d) the signature pulls from Profile & Settings (advisor name + email), (e) running it a second time inside ~1 minute hits the warm-start path (~1–2s). Repeat with `lang=es`. If anything looks wrong in the PDF (numbers off, layout busted, missing section), file specifics for a v0.12.1 patch.

**Out of scope:** any new features, engagement-letter gate (O-14), WhatsApp.

**Version bump:** patch — next available patch number (confirm at chat start; v0.10.1, v0.10.2, v0.11.0 and v0.11.1 are all taken) if translation fixes ship, or none if the Spanish audit finds nothing wrong and only docs change.

**Deliverables:** per §1.

---

### Chat 10 — Email Complete Report as PDF (Puppeteer) [`done (v0.12.0, 2026-05-19)`]

**Files to upload:**
- `src/App.jsx` (latest from repo)
- `api/send-intake-invite.js` (as the pattern reference for a Vercel function: JWT verify, service-role client, env handling)
- `AGENT.md`, `SKILL.md`, `WORKPLAN.md`

**Files NOT to upload:** `src/translations.js` (unless new UI strings are genuinely needed), the Playwright suite.

**Goal:** Let Mauricio email a client their **Complete Report** as a real PDF attachment. **O-11 is RESOLVED — approach (a): Puppeteer rendering the real page server-side**, chosen by Mauricio 2026-05-19 for best fidelity (real fonts, real charts). This supersedes the a/b/c choice in O-11; record O-11 as closed when this ships.

**Spec / decisions to nail down at chat start:**

1. **The auth problem must be solved first.** A Vercel function cannot just open `finance.goldenanchor.life` and screenshot it — the report lives behind the login gate in authenticated client state. Decide the data path before writing Puppeteer code. Likely shape: a new `api/render-report-pdf.js` that (a) verifies the advisor JWT exactly like `send-intake-invite.js`, (b) loads the client's data server-side with the service-role key, (c) renders a dedicated print-only report route/HTML, (d) Puppeteers that HTML to PDF. A self-contained print HTML (no login, no live app) is simpler and faster than driving the full SPA — prefer it unless fidelity demands the real React tree.
2. **Puppeteer on Vercel needs the slim Chromium build.** Full `puppeteer` exceeds Vercel's function size limit. Use `puppeteer-core` + `@sparticuz/chromium`. Confirm current versions and the Vercel function `maxDuration` / memory config at chat start — cold starts are heavy.
3. **Delivery.** Generate the PDF, then either attach it to a Resend email (the existing Resend integration — reuse `RESEND_FROM` = `noreply@finance.goldenanchor.life`, D-31) or upload to Supabase Storage and link it. Decide attach vs link at chat start (attachment size limits vs link convenience).
4. **App.jsx** gets a "📧 Email report" action wired to the new endpoint. The email signature, like the intake invite, should pull advisor name/email from Profile & Settings (the v0.11.1 pattern — pass `advisorName`/`advisorEmail` in the payload).
5. **Respect D-30** (server code lives in `api/` Vercel functions) and **pitfall #13** for any new App.jsx hooks.

**Out of scope:** replacing the existing `window.print()` manual share flow (it stays — O-13). Monthly-report or statement PDFs (this chat is the Complete Report only).

**Version bump:** minor — new feature — confirm the next number against AGENT.md §3 at chat start (v0.11.1 is the latest shipped).

**Deliverables:** per §1, plus the new `api/render-report-pdf.js` and any `package.json` dependency note (`puppeteer-core`, `@sparticuz/chromium`).

---

### Chat 11 — PDF report polish + engagement-letter gate prep [`queued`]

**Files to upload:**
- `src/App.jsx` (latest from repo, post-v0.12.0)
- `src/translations.js`
- `api/render-report-pdf.js` (the Chat 10 print-HTML builder — likely the file that needs the bulk of the edits)
- `AGENT.md`, `SKILL.md`, `WORKPLAN.md`

**Files NOT to upload:** the Playwright suite, CHANGELOG.md.

**Goal:** Two-part. **(A)** Iterate on the v0.12.0 Complete Report PDF based on Chat 8's smoke-test findings — fix layout/number issues found in production, optionally add the Financial Statements + Strategy Plan sections to the PDF (currently only KPI strip + income/bills/debt/assets/notes), and add per-section toggles so the PDF respects the existing `client.reportInclude` map the way the on-screen Complete Report does. **(B)** Begin closing **O-14 (Terms of Service / Privacy Policy acceptance gate + Engagement Letter signature flow)** by shipping the ToS click-through (Mauricio's first-login gate) + the per-client engagement-letter signature date field; the in-app DocuSign-style signing flow is deferred to a follow-up.

**Spec:**

1. **PDF iteration (depends on Chat 8 smoke-test report).** Whatever Chat 8 flagged from the v0.12.0 production smoke test — number mismatches, layout overflow, font issues in Gmail's preview, broken Spanish copy in the report shell, etc. — fix in `api/render-report-pdf.js`. If `buildPrintHTML()` needs to call into a real React render for fidelity reasons, surface that as a D-34 re-open question; otherwise keep the print-HTML path.

2. **Optional extension: Financial Statements + Strategy Plan sections in the PDF.** v0.12.0 ships the Complete Report's primary blocks (KPI / Income / Bills / Debt / Assets / Notes). The on-screen Complete Report also embeds the Financial Statements (balance sheet, income statement, cash-flow stmt) and the Strategy Plan. Decide at chat start whether to extend the PDF to include them — depends on how often Mauricio actually emails the long-form report vs the short one. If yes, mirror the JSX math in `api/render-report-pdf.js`.

3. **Per-section include/exclude in the PDF.** `CompleteReportTab` already has a `reportInclude` toggle map per client; the on-screen report respects it. The PDF currently does not — passes everything. Wire the modal to read `client.reportInclude` and pass an `include` map to the server function; honor it in `buildPrintHTML()`.

4. **ToS click-through gate (closes O-14 part A).** On first login (or first login after a ToS version bump), show a one-time modal: "I have read and accept the Terms of Service and Privacy Policy" + the two PDF links. Store `settings.tosAcceptedAt` (ISO date) + `settings.tosVersion` (string). Gate access to the app until accepted. Modal cannot be dismissed without acceptance.

5. **Per-client engagement-letter signature date (closes O-14 part B, no signing flow).** Add `engagementLetter: { signedAt, signedBy, ipHash }` to the client schema. In ClientDetail, add a small banner/badge at the top: "Engagement letter signed YYYY-MM-DD" (if set) or "⚠ No engagement letter on file" (if unset, with a "Mark as signed today" button that writes the date). Mauricio's interim workflow remains: send the engagement letter via email + DocuSign/paper, then come back to the app and mark it signed manually. The in-app signing flow + uploaded template (D-23 multi-agent feature) is explicitly deferred — track as a §4 backlog item.

**Out of scope:** in-app DocuSign-style signing flow, multi-tenant agent-uploaded-template feature (D-23 territory), Twilio activation, WhatsApp.

**Version bump:** minor → v0.13.0 if either of (A) or (B) ships meaningful new surface; patch v0.12.1 if (A) is fixes-only and (B) defers.

**Deliverables:** per §1.

---

## §4. Backlog (no prompts yet — promoted to §3 as queue empties)

- **Deep-linkable URLs (post-launch).** v0.11.0 made the browser Back/Forward buttons work, but the URL bar never changes — every view is `finance.goldenanchor.life/`. Giving each section/client a real path (`/dashboard`, `/clients/<id>`, …) so URLs are shareable and bookmarkable is a separate routing-architecture change: it touches the same `nav`/`selected`/`selectedTab` model plus the `/intake` route check and the auth gate. Not a bug — deferred by Mauricio to post-launch. Promote to §3 once launch settles.
- **Twilio SMS activation (depends on business verification).** If Mauricio greenlights Twilio in Chat 8, the activation work is small — purchase number, submit business profile, wait for approval, flip `TWILIO_ENABLED=1` in Vercel, deploy. Most of the work is already done in v0.10.0; the activation chat is mostly procedural + smoke testing.
- **WhatsApp Business API delivery (long-term, deferred).** Per Mauricio's call, not a near-term priority. WhatsApp Business API requires verified Business profile through Twilio (days to weeks of approval), template-message pre-approval (Meta reviews each template), and per-conversation pricing. Revisit only if SMS proves inadequate after the server-side intake delivery feature ships.
- **Future:** Stripe webhook for auto-`lastPaidAt`. In-app DocuSign-style engagement-letter signing flow + per-agent uploaded template (D-23 multi-agent territory; manual "mark signed" / date-field is queued for Chat 11 as O-14 part B). Service plan in Strategy Plan tab (Q1 follow-up — currently in Monthly Statement, may want it surfaced in the planning view too).

---

## §5. Completed log

| Chat # | Version | Date | Title |
|---|---|---|---|
| 8 (hotfix) | v0.12.3 | 2026-05-20 | **Hotfix for v0.12.2 — `t`-out-of-scope crash; blank screen after login.** v0.12.2 deployed Monday and immediately broke production: every login rendered a blank screen because 8 component functions (`Kebab`, `PTag`, `BulkSnapModal`, `ImportWizard`, `DuplicateResolverModal`, `DeleteClientModal`, `BackupImportModal`, `ExportModal`) referenced new `t.xxx` keys in their bodies but did NOT accept `t` as a parameter. JavaScript threw `ReferenceError: t is not defined` at render time → React error boundary fired → blank screen. `Kebab` was the killer because it renders on every dashboard client row (the first paint after login). Mauricio rolled back to v0.12.1 to recover the app. **The v0.12.2 audit missed this** because the TypeScript `--noLib` dry-run only catches syntax errors and `t.foo` where `t` is undefined is **valid syntax** — the crash is a runtime `ReferenceError`, not a parse error. The key-symmetry check was source-text-only, not scope-aware. **Fix:** added `t` as a destructured prop to all 8 signatures; propagated `t={t}` at all 22 JSX call sites; also added `t` to `ArchivedSection` (dead-code path but defense-in-depth — it calls `DeleteClientModal`). **The patcher itself had to be rewritten brace-aware:** the naive `<Name[^>]*?/?>` regex used in the first attempt matched the FIRST `>` inside a JSX attribute-expression body (e.g. inside `onClose={()=>setX(false)}` the `>` from the arrow), so `t={t}` was injected mid-arrow-function → different broken syntax. The corrected patcher walks the tag character-by-character tracking `{}` depth and string-quote state (`'`, `"`, `` ` ``) until it finds the real `>` or `/>` at depth 0. A new **scope-aware static verifier** (now part of the fix script) confirms (a) every function referencing a known dict key has `t` in its parameter list or declares `const t=` itself, and (b) every JSX call site passing `t={t}` has `t` in its enclosing function's scope — both report zero findings. **Belt-and-suspenders:** every `t.X||"fallback"` reference newly introduced in v0.12.2 (113 unique dict keys / 177 source sites) was additionally wrapped with optional chaining → `t?.X||"fallback"`. If a future refactor *again* loses `t` from some scope, those sites will degrade to the English fallback string instead of crashing the app with `ReferenceError`. Pre-existing `t.X||` patterns (~984 sites) were left untouched — they've been battle-tested by months of production traffic, and changing them would balloon the diff without reducing risk. `translations.js` unchanged at 1,313 keys/side. App.jsx 3,046 → 3,046 lines (signature edits only). TypeScript dry-run clean. Build marker `2026-05-20-v0123-t-scope-fix`. **One new locked decision: D-36** (static-text patches MUST be verified by a scope-aware checker, not just a syntax check). No SQL, no env vars, no `api/*` or `package.json` changes. **Deploy note:** because Mauricio rolled back to v0.12.1, the v0.12.3 deploy must include BOTH the v0.12.2 `translations.js` (with the 83 new keys, since the `t.xxx` references in App.jsx depend on them) AND the v0.12.3 `App.jsx`. Replace both files; commit + push; Vercel auto-deploys. |
| 8 | v0.12.2 | 2026-05-19 | **Spanish bleed-through fix — closes O-9 and O-10.** Static EN→ES audit of `App.jsx` against `src/translations.js` (more exhaustive than the planned screenshot walk): the dictionary itself was healthy (perfect EN/ES symmetry, well-translated) but **134 unique hardcoded English strings across 203 code sites** never routed through the `t.key` lookup — `Field` renders `{label}` raw, so every `<Field label="literal">` stayed English when the UI toggled to Spanish. Concentrated in the calculator field labels (paycheck/debt/car — the v0.5.0 "calculators are bilingual" claim covered headings, not the dense field labels), the client-data modals (income/bill/card/account/property editors), the Backfill/Import modal titles, the ClientList filter/sort chips, the Market Investments category options, and the nav tooltips. **Fix:** all 203 sites wired through `t.key||"English fallback"` — **48 reused existing keys, 83 new keys minted** (× EN/ES) in the dictionary's neutral Latin-American Spanish register (`Down`→"Enganche", `Taxable`→"Gravable", `Checking`→"Cuenta Corriente", `Filing`→"Declaración", etc.). The two O-9 Financial Roadmap `PhaseCard`/`Phase` `sub` template literals — which mixed the already-translated `extraToFastestDebt` fragment with hardcoded English glue ("Applying … /mo extra to fastest debt using") — are now fully bilingual. `PrintBtn`'s default parameter was reverted to a plain-string default (a function-parameter destructuring default cannot be a JSX `{…}` expression or reference `t`); all three `<PrintBtn/>` call sites (MonthlyReportTab, FinancialStatementReportTab, CompleteReportTab — all have `t` in scope) now pass a translated label. `translations.js` 1,230 → 1,313 keys/side (+83), EN/ES symmetry verified zero-orphan both directions. App.jsx 3,045 → 3,046 lines. TypeScript dry-run clean. **O-10 production Resend smoke test passed** — Mauricio sent two real intake invites (one EN, one ES) to his own inbox; full open→prefill→submit→status-flip→submission-appears loop confirmed on Gmail web + mobile. No SQL migration, no env vars, no `api/*` or `package.json` changes, no new locked decisions, no new pitfalls. Build marker `2026-05-19-v0122-spanish-bleedthrough`. **Outstanding (Mauricio, no code):** Twilio go/defer decision (Chat 8 spec item 5); v0.12.x Complete Report PDF smoke test (spec item 6). |
| — | v0.12.1 | 2026-05-19 | Patch (not a queued chat). **Vercel Chromium runtime fix for v0.12.0.** v0.12.0 deployed but every PDF send failed with `Failed to launch the browser process! /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file`. Root cause: `@sparticuz/chromium@131`'s bundled native libs (libnss3 + a stack of others) did not survive Vercel's serverless bundler tracing — compounded by an accidental `npm install puppeteer` (full ~280MB Puppeteer) that bloated `node_modules` past the practical tracing limit, increasing the chance of partial bundling. Fix: switched to `@sparticuz/chromium-min@^140.0.0` (NOT regular `@sparticuz/chromium`) paired with `puppeteer-core@^24.10.0`. The `-min` variant ships only ~5MB of JS glue; the Chromium brotli tarball is downloaded at runtime from the official GitHub release URL `https://github.com/Sparticuz/chromium/releases/download/v140.0.0/chromium-v140.0.0-pack.x64.tar` and cached in `/tmp` between warm invocations. Tiny deploy bundle, working `libnss3.so`, no Vercel size-limit risk. Also modernized the `puppeteer.launch` call: `headless: chromium.headless` → `headless: "shell"` (puppeteer-core 24's expected literal), added `--no-sandbox` + `--disable-setuid-sandbox` + `--hide-scrollbars` to the args spread as defensive belt for the Lambda runtime. **D-34 amended** with the chromium-min lesson + version-pinning rule (the URL constant must match the npm major). **No App.jsx logic changes, no translation changes** — only `api/render-report-pdf.js` (runtime/launch section) + `package.json` deps + build marker. App.jsx 3,046 lines unchanged. translations.js 1,230 keys/side unchanged. Cold start expectation: ~5–8s on first invocation after deploy (tarball download), ~1s warm. Build marker `2026-05-19-v0121-chromium-min-fix`. No SQL migration. No new pitfalls (the libnss3 + chromium-min lesson is captured in AGENT.md §3 v0.12.1 + D-34 — if a future headless-browser feature recurs the issue, those are the references). |
| 10 | v0.12.0 | 2026-05-19 | **Email Complete Report as PDF** (Puppeteer). O-11 resolved to approach (a), refined to a print-HTML path (D-34) instead of driving the live SPA — avoids injecting a Supabase session into the headless browser, removes Recharts/animation flake, smaller cold start. New Vercel function `api/render-report-pdf.js` (D-30): verifies advisor JWT (mirrors `send-intake-invite.js`), loads the client row via service-role with two `.eq()` calls (`local_id` → `data->>'id'` fallback, pitfall #15 avoided), builds a self-contained printable HTML doc from the client data with inline SVG donut (income/bills) + bar (debts) charts in the Golden Anchor palette, `puppeteer-core` + `@sparticuz/chromium` renders to Letter PDF (0.5in margins, `printBackground:true`), Resend (D-31) attaches the PDF (base64) and emails. `reply_to` defaults to `RESEND_REPLY_TO`; if unset, falls back to the advisor's Profile & Settings email. EN/ES report shell + KPI labels + section headers + disclaimer fully bilingual inside the print HTML (no `t.*` references — that dict is React-side only). **App.jsx 2,998 → 3,046 lines:** new top-level helper `gaEmailCompleteReport` (fetches `/api/render-report-pdf` with Bearer JWT, line 28); new `EmailReportModal` component (line 643) — recipient auto-fills `client.email` but advisor can override before sending, EN/ES default subject + body, inline send status with auto-close on success; `CompleteReportTab` signature gains `settings` prop, new `emailOpen` state, new `Btn` "📧 Email" beside `PrintBtn` (both inside a `ga-np` wrapper so neither shows in print output), modal mount. `ClientReport` signature gains `settings` + forwards it; `ClientDetail`'s `tab==="report"` call site also passes `settings` through. **+12 translation keys × 2 langs** (`emailReportBtn`, `emailReportTitle`, `emailReportHelp`, `emailReportTo`, `emailReportSubject`, `emailReportMessage`, `emailReportSig`, `emailReportInvalidTo`, `emailReportSending`, `emailReportSendBtn`, `emailReportSent`, `emailReportFailed`); `translations.js` 1,218 → 1,230 keys/side, symmetry verified. **`vercel.json`** picks up a `functions` block for the new endpoint (`memory: 1024`, `maxDuration: 30`). **`package.json`** adds `puppeteer-core@^23` + `@sparticuz/chromium@^131`. **One new locked decision D-34** (print HTML + Puppeteer, NOT live-SPA-drive — design rationale + maintenance contract documented). **O-11 closed, O-13 closed.** No SQL migration. No new pitfalls. No new Vercel env vars needed (reuses the v0.10.0 / v0.11.1 set). Build marker `2026-05-19-v0120-email-report-pdf`. |
| — | v0.11.1 | 2026-05-19 | Patch (not a queued chat). **Intake-invite email signature now pulled from Profile & Settings.** The signature (advisor name + contact email in the message body) was hard-coded to `Mauricio Hernandez` / `mauricio@goldenanchor.life` inside the server function `api/send-intake-invite.js`. Now: App.jsx passes `advisorName` / `advisorEmail` (from `settings`) in the `gaSendIntakeInvite` payload, `IntakeSubmissionsPage` gained the `settings` prop, and `buildEmailBody` in the server function builds the EN/ES signature (text + HTML) from those fields with a fallback to the historical defaults. **D-31 amended:** Resend sender and reply-to are both `noreply@finance.goldenanchor.life` — the apex `goldenanchor.life` was never verified in Resend, which caused the "API key not authorized" send failure; the visible signature address is now settings-driven and independent of `RESEND_FROM`. The server function's `RESEND_FROM`/`RESEND_REPLY_TO` doc comments updated to the `noreply@` address. translations.js unchanged. App.jsx 2,965 → 2,998 lines. No new pitfalls. Build marker `2026-05-19-v0111-invite-signature`. |
| 9 | v0.11.0 | 2026-05-19 | Browser history / back-button integration. Tab/section navigation (`nav`, `selected`, `selectedTab`) was plain React state with no `history` integration, so the browser kept no in-app entries and Back left the app entirely (landed before login). Fix: a navigation-signature `useEffect` keyed on `[nav, selected?.id, selectedTab, authUser, isPublicIntakeRoute]` pushes a history entry on each navigation change (first run `replaceState` to seed the entry point, later `pushState`); a `popstate` listener restores nav/selectedTab/selected (client looked up by id from `clients`), with a no-state `popstate` falling back to the dashboard; a `_popstateRestoringRef` guard prevents re-push loops; an open mobile drawer is closed by the first Back. Both effects sit below all hooks and above the `isPublicIntakeRoute` early return (pitfall #13). Out of scope: deep-linkable `/clients/<id>` URLs — the URL bar does not change (moved to §4 backlog, post-launch). translations.js unchanged. App.jsx 2,965 → 3,001 lines. New pitfall #16. Build marker `2026-05-19-v0110-history-backbutton`. |
| — | v0.10.2 | 2026-05-18 | Patch (not a queued chat). **`gaDeleteClient` rewritten.** v0.10.1's soft-delete used a single `.or("local_id.eq.${id},data->>id.eq.${id}")` filter; PostgREST splits an `or` filter on `.`, so the JSON path `data->>id` and decimal client ids (e.g. `1776873994030.0803`, a real legacy id) corrupt the query → 400 → the soft-delete silently no-ops → client reappears on refresh. Archive was unaffected (routes through `gaSaveClient`, which uses `.eq()`). Fix: two plain `.eq()` UPDATE calls. **Correction to the v0.10.1 record:** its "legacy rows with NULL `local_id`" root cause was wrong — live data shows `local_id` populated on every row; `sql/v0.10.1_clients_local_id_repair.sql` was a no-op, correctly never committed. The "client duplication" launch-blocker was investigated against live data and found to be cross-account confusion (the same `local_id` exists under Mauricio's account and the Playwright test account, different names), not real duplicate rows. v0.10.1's grid / invites / de-dupe changes remain valid. Pitfall #15 amended. Build marker `2026-05-18-v0102-delete-fix`. |
| — | v0.10.1 | 2026-05-18 | Ad-hoc bug-fix batch (not a queued chat), requested by Mauricio. **(1) Supabase client de-duplication.** Root cause: `clients` rows created before the v0.5.x `local_id` column have `local_id = NULL`; `gaSaveClient` matched only by `local_id`, so a NULL-`local_id` row never matched → every save INSERTed a duplicate row, and `gaDeleteClient` (also `local_id`-only) never soft-deleted legacy rows → client reappeared on refresh. Two same-`id` rows then loaded into React state where every id-keyed handler hit both (“Miguel Torres” duplicated; archive/delete/restore on one affected the other; bulk-restore counted one but touched two). Fix: `gaSaveClient` falls back to matching `data->>'id'` when `local_id` misses (UPDATE payload backfills `local_id`); `gaDeleteClient` matches `local_id` OR `data->>'id'`; `gaLoadClients` de-dupes by client id. Paired one-time cleanup `sql/v0.10.1_clients_local_id_repair.sql` (diagnose → soft-delete duplicate rows keeping newest → backfill NULL `local_id`s → verify). **(2) Page-grid sizing.** v0.9.0 set the Calculators/Resources/About/Services `auto-fill` minmax minimums too small, packing tiny columns on desktop; minimums raised (160→240, 220→260, 260→300, 220→250). **(3) Clear Sent Invites.** New `gaDeleteAllIntakeInvites` helper + “?? Clear all” button on the Intake Forms → Sent invites panel. +2 translation keys × 2 langs (`intakeClearInvites`, `intakeConfirmClearInvites`); 1,217 → 1,219/side. App.jsx 2,962 → 2,965 lines. New file `sql/v0.10.1_clients_local_id_repair.sql`. New pitfall #15. No new/closed locked decisions. Build marker `2026-05-18-v0101-client-dedup-grids-invites`. NOTE: items deferred from the same request — browser back-button (no history integration) promoted to Chat 9; bulk-Archive UI glitch expected to resolve once the de-dupe lands (re-test); “Supabase env vars missing on server” is the incomplete v0.10.0 deploy (set the 7 Vercel env vars), not a code bug; print-to-PDF stays as-is per O-13. |
| 7 | v0.10.0 | 2026-05-18 | Server-side intake delivery via Resend. Replaced the v0.7.3 mailto/SMS MVP send panel with a real tracked-invite system. **New: 3 Vercel Serverless Functions** under `api/` (D-30): `send-intake-invite.js` (verifies advisor JWT → generates `crypto.randomBytes(24)` token → inserts `intake_invites` row → calls Resend; Twilio code path included but feature-flagged off via `TWILIO_ENABLED=0`), `resolve-intake-invite.js` (anonymous → SECURITY DEFINER `resolve_invite_token` RPC → returns only prefill fields + flips status sent→opened + writes opened_ip_hash), `mark-intake-invite-submitted.js` (anonymous → links invite to new `intake_submissions.id`). **New: 2 Supabase tables** in `supabase/migrations/20260518_intake_invites.sql` — `intake_invites` (id, user_id, token unique, prospect_name/email/phone, lang, channel_email/sms, status check('sent','opened','submitted','expired','failed'), send_error, resend_message_id, twilio_sid, opened_at, opened_ip_hash, submission_id, expires_at default now()+30days) with full RLS; `sms_consent_log` (TCPA attestation trail per D-33). Two SECURITY DEFINER functions granted to anon+authenticated. **App.jsx changes** (2,900 → 2,962 lines): 5 new top-level Supabase/fetch helpers (`gaLoadIntakeInvites`, `gaDeleteIntakeInvite`, `gaSendIntakeInvite`, `gaResolveIntakeInvite`, `gaMarkIntakeInviteSubmitted`); `gaSubmitIntake` extended to return `submissionId`; `PublicIntake` reads `?invite=<token>` on mount and prefills firstName/lastName/email/phone via the resolve endpoint, also marks submitted on success; the v0.7.3 mailto/sms/copy MVP send panel (lines 2530-2566) replaced by a full server-driven panel with Email/SMS channel checkboxes, conditional TCPA attestation checkbox (only when SMS is on), ⚓ Send Invite button with inline success/error status; new "Sent invites" collapsible list (status pills: Sent / Opened / Submitted / Failed / Expired, per-row 🗑️ delete). **22 new translation keys × 2 langs** plus 1 value update — `intakeSendTitle` text changed from "Send link to a prospect" → "Send invite to a prospect" / "Enviar enlace…" → "Enviar invitación…". `translations.js` 1,195 → 1,217 keys/side, symmetry intact. **4 new locked decisions** D-30 (server code in `api/` Vercel functions — D-1 carve-out #2), D-31 (Resend = email provider, sender + reply-to addresses locked), D-32 (Twilio code-complete but feature-flagged off until business verification — explicit do-not-flip-without-TFV warning), D-33 (TCPA = advisor attestation + opt-out footer + `sms_consent_log` audit trail). **2 open decisions clarified** — O-11/O-13 (PDF generation) remain open but scope clarified: intake invites carry no PDF; PDF concern is for the future "email Complete Report" feature. **Build marker** `2026-05-18-v0100-server-intake-delivery`. Out-of-app deploy steps documented in AGENT.md §3: apply SQL migration, install `resend` npm dep, set 7 Vercel env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO, PUBLIC_INTAKE_BASE_URL, TWILIO_ENABLED=0). |
| 6 | — | 2026-05-17 | Playwright e2e suite resync against the post-v0.9.3 app — **test-harness only, no app version bump, `App.jsx` untouched.** Re-baselined the specs after the Chat 3/4/5 changes. **Deleted-surface fixes:** `01-smoke` dropped the standalone `Forms` tab (removed in v0.7.0) — it was a false positive, `navTo("Forms")` word-matched the new "Intake Forms" button; replaced with a real Intake Forms tab check. `04-translation` likewise swapped the bogus `Forms` ES surface for a real `Formularios de Admisión` (Intake Forms) surface. `03-client-workflows` dropped the deleted per-client `📝 Intake` tab from the ClientDetail tab walk, corrected `💹 Portfolios` → `💹 Investments`, added the `🔧 Backfill` tab. **New coverage:** `03` gained a `describe` block for the v0.8.0 action-first ClientList bulk flow (☰ Actions menu → Archive/Delete selection mode → confirm modal → DELETE-gating → Split/Join pickers) — every test cancels out, never mutating the seeded test user. **New file `tests/06-mobile.spec.ts`** — iPhone-13 emulation: drawer opens flush to the viewport's left edge + a structural pitfall-#14 guard (drawer must not be nested inside the `zoom` container), dark-mode `<html>`/`<body>` background paint (v0.9.1), and no horizontal page scroll on Dashboard / Clients / ClientDetail (v0.9.0 / v0.9.3 `data-ga-grid`). **Stale test fixed:** `01-smoke`'s language test no longer sets the no-op `window.__GA_LANG`; it drives the real `switchLang` toggle. `02-calculators` and `05-persistence` were unaffected by Chats 3/4/5 and were not rewritten (expected green). `utils/fixtures.ts` and `playwright.config.ts` needed no changes — `06-mobile` self-contains its device descriptor. WebKit re-enable shipped as an **optional terminal step**, not committed to config: the bug it guards is WebKit-only and the Codespace dep install (`sudo npx playwright install-deps webkit`) can't be verified remotely. AGENT.md §13 update deferred — the post-resync passing count must come from a real local run. |
| — | v0.9.3 | 2026-05-17 | Third mobile-overflow hotfix in same session as v0.9.1/v0.9.2. **Three KPI/portfolio grids that v0.9.0 missed were spilling cards off the right edge on mobile.** (1) `ClientReport` 4-up KPI strip (`Net Income/mo / Monthly Bills / Total Debt / Net Worth`) — line ~617, hard-coded `gridTemplateColumns:"1fr 1fr 1fr 1fr"`. (2) `AssetsLiabilitiesTab` 4-up (`Total Assets / Total Liabilities / Net Worth / Current Ratio`) — line ~1177, hard-coded `"repeat(4,1fr)"`. (3) `InvestmentsTab` Portfolio packages 3-up (`Conservative / Growth / Aggressive`) — line ~578, hard-coded `"1fr 1fr 1fr"`. v0.9.0's pass added mobile branches to the components I touched directly (Dashboard, ClientList, ClientDetail top KPIs) but missed these. **Fix is global + defensive**, not per-call-site: (a) new `@media(max-width:719px)` block in the `ga-styles` injection that targets `[data-ga-grid="kpi-3"]`, `[data-ga-grid="kpi-4"]`, `[data-ga-grid="portfolios"]`, `[data-ga-grid="two-col"]`, `.ga-mobile-collapse` and forces 2-up or 1-up with `!important` (needed to beat the inline styles in JSX); (b) `SC` (stat card) component gets `className="ga-sc"` + `min-width:0` + `overflow:hidden`, plus a global rule `.ga-sc,.ga-sc *{min-width:0!important}` so cards can actually shrink inside the collapsed grid (without this, grid items default to `min-width:auto` ≈ content width and refuse to compress); (c) SC labels/values get `text-overflow:ellipsis` to truncate very long $ amounts; (d) the four problem grids each get a `data-ga-grid="kpi-4|kpi-3|portfolios"` attribute on their wrapping `<div>` (also tagged the matching grid in `RatioContent` and `PortfolioStandaloneCalc` while in the neighbourhood — 5 grids tagged total). **Forward-safe pattern**: any future hard-coded grid just needs a `data-ga-grid="..."` attribute and it auto-collapses on mobile — no `useViewport()` plumbing required. The remaining hard-coded grids inside calculators / summary modals are left untagged for now (either modal-scoped or desktop-only workflows); each is a one-line fix if a screenshot shows one overflowing. Zero new translation keys. App.jsx 2,880 → 2,900 lines (~595 KB). `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed, no new pitfalls. D-1, D-7, D-18, D-27 preserved. Build marker `2026-05-17-v093-mobile-grid-overflow`. |
| — | v0.9.2 | 2026-05-17 | Out-of-band hotfix follow-up to v0.9.1, same session. **`Kebab` (☰) dropdown was clipping off the left edge of the viewport** when the trigger button was in the left half of the screen — most obvious on the Chat 4 bulk-action ☰ on the Clients page, which v0.8.0 placed at the left of the page header beside "+ New Client". The menu was hard-coded to `right:0`, anchoring its right edge to the button's right edge; the 200px-wide dropdown then extended leftward off the viewport on mobile. Fix: `Kebab` now measures its button's `getBoundingClientRect().left` against `window.innerWidth/2` when the menu opens, stashes `side` in component state (`left`/`right`), and the dropdown's style uses `[side]:0` as a computed key. One new `useState`, one `toggle()` helper that runs the measurement before setting open. Pure presentational fix — no API change, all existing Kebab callers (Dashboard header `⋯`, ClientList bulk action ☰, per-row `⋯`, etc.) work unchanged; only the visual anchor differs by context. Zero new translation keys. App.jsx 2,879 → 2,880 lines (~594 KB). `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions, none closed, no new pitfalls (v0.9.1's pitfall #14 still applies but unrelated to this fix). D-1, D-7, D-18, D-27 preserved. Build marker `2026-05-17-v092-kebab-flip`. |
| — | v0.9.1 | 2026-05-17 | Out-of-band hotfix for two mobile bugs introduced by v0.9.0, reported by Mauricio via screenshot the morning after deploy. (1) **Mobile drawer was rendering clipped off the left edge of the viewport.** Root cause: the outer flex container in `App()` carries `zoom:(settings.appZoom||1)`; in WebKit/iOS Safari the CSS `zoom` property establishes a containing block for `position:fixed` descendants, so the drawer was positioned relative to the zoomed parent instead of the viewport. Fix: hoisted the mobile drawer + its scrim **out of** the zoom-applying flex container and into the top-level `<></>` fragment as siblings; the desktop sidebar (no transform escape needed) stays inside the flex container, now gated behind `{!vp.isMobile&&...}`. Drawer also picked up an explicit ✕ close button, 9-10px tap padding (44px target), fontSize 14. (2) **White border around the page on mobile, visible even in dark mode** (status bar tint, overscroll bounce, iOS safe-area). Root cause: nothing was painting `<html>` or `<body>`; the browser-default white bled through any pixel outside the flex container. Fix: added a `useEffect` in `App()` keyed on `theme.bg` that sets `documentElement.style.background` + `body.style.background` to `theme.bg` (same pattern as `PublicIntake` line ~2311); outer flex container also gets `width:"100%"` as a defensive belt. **New pitfall #14 logged**: `zoom` traps `position:fixed` in WebKit — mobile overlays must be siblings of, not descendants of, the zoom-carrying container. Zero new translation keys. App.jsx 2,858 → 2,879 lines (~593 KB). `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. No new locked decisions. D-1, D-7, D-18, D-27 preserved. Build marker `2026-05-17-v091-mobile-fixes`. |
| 5 | v0.9.0 | 2026-05-16 | Mobile / responsive redesign of every primary surface. (1) **Mobile top bar drops the ⚓** so the title (or selected client name) has room and never truncates at ~360px; desktop sidebar brand row unchanged. (2) **Dashboard KPI grid** switches to `isMobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(140px,1fr))"` — six KPIs become a clean 3×2 on a phone; the donut-charts row stacks; header title font drops a size step; search goes full-width. (3) **Dashboard client row** stacks name+email on top, snapshot tiles+net/mo below, `›` chevron hidden — desktop unchanged. (4) **ClientList (Chat 4 surface) mobile pass:** `useViewport()` wired in, header search full-width on mobile with action buttons dropping below and "+ Add" growing to share the row; **the Chat 4 bulk-action coloured bar `flex-wrap`s** so action label + count + Cancel/Apply stay readable; active and archived rows use the same stacked pattern. (5) **ClientDetail mobile pass:** 4-up KPIs → 2-up, charts row stacks, **the 8-tab strip gets contained `overflowX:auto`** instead of forcing page-level horizontal scroll (the most common pre-v0.9.0 mobile complaint). (6) `CalculatorsPage` → `auto-fill,minmax(160px,1fr)`; `ResourcesPage` → `auto-fill,minmax(220px,1fr)`; `AboutPage` advisor/services grids → `auto-fit`. (7) v0.8.1 Appearance preview tile re-sized 128 → 120 with `flex:"0 0 auto"` so it fits beside its pickers at narrow widths. (8) App main column gets `maxWidth:"100%"` overflow-safety belt. **Zero new translation keys** — layout primitives only, no data shape, no behavior, no new components. App.jsx 2,856 → 2,858 lines (~595 KB; ~589 KB after some inline-style compaction). `src/translations.js` unchanged at 1,192 keys/side. No SQL migration. D-1, D-7, D-10, D-18 preserved; D-27 (mobile-first + PWA) meaningfully advanced. Build marker `2026-05-16-v090-mobile-responsive`. |
| — | v0.8.1 | 2026-05-16 | Ad-hoc patch (not a queued chat) requested by Mauricio: customizable **page-background and card-background colors** in Profile & Settings, for both light and dark mode, with a live preview. New "Background Colors" section in `ProfileModal` (under Theme Colors) — one card per mode, each with a Page-background and a Card-background picker (preset shade swatches + custom color picker + hex field via a new `BgPicker` helper), a live Preview tile, and a per-mode ↺ Reset. `DEF_SETTINGS` gains `darkBg`/`darkCard`/`lightBg`/`lightCard` (properties inside the existing `ga-settings` object — no new top-level localStorage key, D-10 satisfied; defaults = current palette so the app is visually unchanged until the advisor picks colors). The `App()` theme line spreads these over the `makeDark`/`makeLight` palette, overriding only `bg` and `card`. Four new preset arrays. +6 translation keys × 2 langs; dictionary 1,186 → 1,192 per side. App.jsx 2,854 → 2,856 lines. No SQL migration. |
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

*Last updated: 2026-05-20 — v0.12.3 (Hotfix for v0.12.2 t-out-of-scope crash) shipped. v0.12.2 broke production immediately after deploy — blank screen after login, every user. 8 component functions (Kebab/PTag/BulkSnapModal/ImportWizard/DuplicateResolverModal/DeleteClientModal/BackupImportModal/ExportModal) referenced t.xxx without t in their params → ReferenceError → React crash. Mauricio rolled back to v0.12.1. v0.12.3 added t to all 8 signatures + 22 t={t} call sites, with a rewritten brace-aware JSX patcher and a new scope-aware static verifier (both checks now pass zero). Belt-and-suspenders: 177 sites using v0.12.2-introduced keys wrapped with optional chaining (t?.X||"fallback"), so a future scope regression degrades to the fallback string instead of ReferenceError — pre-existing t.X|| sites left untouched (battle-tested). New locked decision D-36 (scope-aware checker mandatory for bulk static-text patches). translations.js unchanged. App.jsx 3,046→3,046 lines. Build marker `2026-05-20-v0123-t-scope-fix`. **Queue:** Chat 11 (PDF polish + O-14 prep) — still `queued`, claimable now. §4 backlog unchanged.*

*Prior: 2026-05-19 — Chat 8 (Spanish review pass + Resend production smoke test) `done`. **v0.12.2 shipped.** Static EN→ES audit found 134 hardcoded English strings / 203 code sites that never routed through `t.key`; all wired (48 reused keys, 83 new × 2 langs, neutral Latin-American Spanish). O-9 roadmap `sub` blocks translated. `PrintBtn` default param fixed (function-default can't be a JSX expression); 3 call sites pass a translated label. `translations.js` 1,230 → 1,313 keys/side, symmetry verified. App.jsx 3,045 → 3,046 lines. TypeScript dry-run clean. Build marker `2026-05-19-v0122-spanish-bleedthrough`. **O-9 and O-10 closed.** O-10 Resend production smoke test passed (Mauricio ran it — EN + ES invites, full loop confirmed on Gmail web + mobile). No SQL, no env vars, no `api/*`/`package.json` changes, no new decisions. **Two Chat 8 spec items remain with Mauricio, no code:** Twilio go/defer decision (item 5) and the v0.12.x Complete Report PDF smoke test (item 6) — if the PDF test surfaces defects they feed Chat 11 spec item 1. **Queue:** Chat 11 (PDF polish + O-14 prep) — still `queued`, claimable now, though its spec item 1 depends on Mauricio running the PDF smoke test. **§4 backlog unchanged;** Chat 12 = Twilio SMS activation will be promoted to §3 only if Mauricio greenlights Twilio.*

*Prior: 2026-05-19 — v0.12.1 (Patch, not a queued chat) shipped. **Vercel Chromium runtime fix for v0.12.0.** PDF send was failing with `libnss3.so: cannot open shared object file` because `@sparticuz/chromium@131`'s bundled libs didn't survive Vercel bundler tracing (compounded by an accidental `npm install puppeteer` that bloated node_modules). Fix: `@sparticuz/chromium-min@^140` + `puppeteer-core@^24.10`; the `-min` variant runtime-downloads the Chromium tarball from the official GitHub release URL and caches in `/tmp`. Tiny deploy bundle, no size-limit risk, working `libnss3.so`. D-34 amended with the chromium-min lesson + version-pinning rule. Build marker `2026-05-19-v0121-chromium-min-fix`. **No App.jsx logic changes.** Chat 10 stays `done (v0.12.0)`; v0.12.1 is an out-of-band patch on top of it.*

*Prior: 2026-05-19 — Chat 10 (Email Complete Report as PDF) `done`. v0.12.0 shipped: print-HTML + Puppeteer path (D-34), `api/render-report-pdf.js` new, `vercel.json` gains a `functions` block for it (memory 1024, maxDuration 30), `package.json` adds `puppeteer-core` + `@sparticuz/chromium`. App.jsx 2,998 → 3,046 lines; `translations.js` 1,218 → 1,230 keys/side (12 new × 2 langs, symmetry verified). New 📧 Email button on the Complete Report tab opens a recipient/subject/message modal (auto-fills `client.email`, EN/ES defaults, signature pulled from Profile & Settings). **O-11 closed, O-13 closed.** Build marker `2026-05-19-v0120-email-report-pdf`. **Chat 11 (PDF report polish + engagement-letter gate prep) added to §3 as `queued`.** §3 queue: Chat 8 (Spanish + Resend + v0.12.0 PDF smoke test), Chat 11 (PDF polish + O-14 part A/B). §4 backlog: deep-linkable URLs (post-launch), Twilio activation, in-app DocuSign-style signing flow, WhatsApp.*

*Prior: 2026-05-19 — v0.11.1 (Patch — intake-invite email signature now pulled from Profile & Settings). App.jsx passes `advisorName`/`advisorEmail` in the `gaSendIntakeInvite` payload; `IntakeSubmissionsPage` gained the `settings` prop; the server function `api/send-intake-invite.js` builds the EN/ES signature from those fields with a fallback. D-31 amended — Resend sender + reply-to are both `noreply@finance.goldenanchor.life`. App.jsx 2,965 → 2,998 lines. Build marker `2026-05-19-v0111-invite-signature`. Prior: v0.11.0 (Chat 9, browser history / back-button) and v0.10.2 (Patch, `gaDeleteClient` delete fix). **Queue:** Chat 8 (Spanish review + Resend production smoke test), Chat 10 (Email Complete Report as PDF — O-11 resolved to Puppeteer, approach (a)). §4 backlog: deep-linkable URLs (post-launch), Twilio activation, WhatsApp (long-term).*

*Prior: 2026-05-18 — Chat 7 (server-side intake delivery) `done`. v0.10.0 shipped: Resend live for intake invites from `mauricio@finance.goldenanchor.life`, tracked invite tokens with open/submit status, TCPA attestation log, Twilio code-complete but feature-flagged off. 22 new translation keys × 2 langs; symmetry 1,195 → 1,217 per side. App.jsx 2,900 → 2,962. SQL migration required: `supabase/migrations/20260518_intake_invites.sql`. 7 Vercel env vars required (see AGENT.md §3). 4 new locked decisions D-30…D-33. Chat 8 (Spanish audit + production Resend smoke test) added to §3 as `queued`. Queue: Chat 8. Backlog: Email Complete Report + PDF decision (O-11), Twilio activation (depends on business verification), WhatsApp (long-term).*

*Prior: 2026-05-17 — Chat 7 dependency corrected (Mauricio, "Option B"). The Chat 7 blocker is Resend SPF/DKIM/DMARC records on `goldenanchor.life`, NOT the Porkbun→Cloudflare registrar transfer. Plan: switch the domain's nameservers to Cloudflare now (registration stays at Porkbun; nameserver changes are not subject to the 60-day lock), manage DNS in Cloudflare, add the Resend records there. The registrar transfer remains a separate, later task (~2026-07-15+). Queue: Chat 7. Backlog: WhatsApp (long-term) + Future.*

*Last updated: 2026-05-17 — Chat 6 (Playwright resync) `done`. The e2e suite was re-baselined against v0.9.3: three specs changed (`01-smoke`, `03-client-workflows`, `04-translation`) plus one new spec (`06-mobile`); `02-calculators`, `05-persistence`, `utils/fixtures.ts`, and `playwright.config.ts` were left unchanged. No app version bump — test-harness only, `App.jsx` untouched. Chat 7 (server-side intake delivery) added to §3 as `queued`. Queue: Chat 7. Backlog: WhatsApp (long-term) + Future.*

*Last updated: 2026-05-17 — v0.9.3 shipped (mobile-overflow hotfix #3 — global `data-ga-grid` collapse rule + `SC` min-width fix + 5 grids tagged). Chat 6 (Playwright resync) remains claimable; mobile surface is now in good shape post-v0.9.3.*

*Last updated: 2026-05-16 — v0.8.1 shipped as an ad-hoc patch (not a queued chat): customizable page/card background colors in Profile & Settings for light and dark mode, with live preview and per-mode reset. Built on top of v0.8.0 (Chat 4 — bulk client actions). Chats 5 (mobile/responsive redesign) and 6 (Playwright resync) remain `queued` in §3; Chat 5 is claimable now (its Chat 3 dependency is `done`). The Chat 5 prompt should note the new "Background Colors" settings section so its mobile audit covers it. Queue: Chats 5, 6. Backlog unchanged: server-side intake delivery (DNS-blocked) + WhatsApp (long-term) + Future.*
