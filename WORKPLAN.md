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

### Chat 2 — Service Plan cleanup + Notes tone fix [`queued`]

**Files to upload:**
- `src/App.jsx` (latest from repo)
- `src/translations.js` (extracted in v0.6.2)

**Files NOT to upload:** CHANGELOG.md (too big, chat doesn't need history).

**Goal:** Trim the Service Plan UI in NotesSection to match how Mauricio actually uses it, plus fix Notes labels to second person.

**Spec:**

Service Plan field cleanup (in `NotesSection`, App.jsx):
- REMOVE these fields from the UI: `category`, `status`, `nextChargeDate`, `lastPaidAt`, `serviceNotes`.
- KEEP these fields: `plan` (dropdown), `startDate`, `paymentMethod`, `paymentLinkUrl`.
- ADD: when `paymentMethod === "stripe"` AND `settings.stripeLinks[servicePlan.plan]` is non-empty, render two buttons:
  - 💳 **Pay Now** → opens the Stripe link in a new tab (target=_blank).
  - 🕓 **Pay Later** → appends `[Pay later — YYYY-MM-DD]` to `client.notes.general` with today's date. No new alert type.
- Existing client records with the removed fields: don't migrate, just stop reading/writing those fields. Data sits dormant — forward-compatible if Mauricio ever wants them back.

Notes tone (in `translations.js`, both T.en and T.es):
- Audit Notes & Goals labels and tooltips for third-person → second-person.
- Examples (verify exact keys against the file):
  - "What They Want to Achieve" → "What You Want to Achieve"
  - "Qué Desea Lograr" → "Qué Quieres Lograr"
- Likely keys: `clientGoals`, `shortTerm`, `midTerm`, `longTerm`, `setbacks`, `generalNotes`, and any related help text.
- Value changes only. Do NOT rename keys. Symmetry (1,146 each side) must stay intact.

**Out of scope:**
- Mobile redesign
- IA changes (Forms tab, Intake)
- Bulk actions
- Playwright fixes

**Version bump:** patch → v0.6.3.

**Deliverables:** per §1.

---

### Chat 3 — IA changes (delete Forms, merge Intake) [`queued`]

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

### Chat 4 — Bulk actions on Clients tab [`queued`]

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

## §4. Backlog (no prompts yet — promoted to §3 as queue empties)

- **Chat 5 — Mobile/responsive redesign.** Biggest scope. Top bar (remove ⚓), KPI grid collapse, client row restructure, button hierarchy, no horizontal scroll anywhere. Goes after IA stabilizes (Chat 3) so we don't redesign components about to be deleted. Likely v0.9.0.
- **Chat 6 — Playwright resync** (per Mauricio's instruction, after the app is fully working). Re-baseline selectors against the new IA, mobile breakpoints, and bulk-action UI. Likely no app version bump — tooling addendum.
- **Future:** Stripe webhook for auto-`lastPaidAt`. Resend email integration (blocked on Porkbun→Cloudflare DNS). ToS/engagement-letter signature gate (O-14). Service plan in Strategy Plan tab (Q1 follow-up — currently in Monthly Statement, may want it surfaced in the planning view too).

---

## §5. Completed log

| Chat # | Version | Date | Title |
|---|---|---|---|
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

*Last updated: 2026-05-15 — v1 of WORKPLAN, established by Mauricio + Claude. Queue: Chats 2, 3, 4 ready. Backlog: 5, 6.*
