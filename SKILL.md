---
name: finance-app-updater
description: Use this skill when the user wants to modify, add to, fix, or update the Golden Anchor Finance app (App.jsx) or its supporting documents (AGENT.md, CHANGELOG.md, this skill). Triggers include phrases like "fix this bug", "add a calculator", "add a translation", "lock decision X", "update the app", "the [feature] is broken", "we changed our mind on Y", "bump the version", "let's flip [decision]". Also triggers when the user uploads a new version of App.jsx and asks you to continue work. Do NOT use this skill for general finance questions, business strategy chats, or anything that doesn't change the codebase or docs.
---

# finance-app-updater — How to safely modify the Golden Anchor Finance project

This skill defines the procedure to follow when the user asks you to change anything in the finance project. It exists to prevent the recurring mistakes documented in AGENT.md §7.

---

## Step 0 — Before anything

Read `WORKPLAN.md` from project knowledge. Confirm the chat number you've been assigned. Mark its slot in §3 as `in-progress` before touching any code. If the requested slot is already `in-progress` by another chat, STOP and ask Mauricio.

This step is non-negotiable. If WORKPLAN.md isn't in project knowledge, STOP and ask before proceeding.

---

## Step 1 — Pre-flight (every single change)

Before writing a single character of code:

1. **Read AGENT.md** (in this conversation, or ask the user to paste it).
2. **Get the current App.jsx.** Either it's been uploaded in this chat, or ask:
   > "Please upload the latest App.jsx so I'm working from current state."
3. **Verify what the user actually wants.** If the request is ambiguous or could conflict with locked decisions, ASK. Do not guess.
4. **Check the Locked Decisions section.** If what's being asked contradicts a locked decision, STOP and say:
   > "This conflicts with locked decision D-X: [restate it]. Do you want to (a) reverse the decision, (b) work around it, or (c) leave it as-is?"

---

## Step 2 — Categorize the change

Every request falls into one of these buckets. The procedure differs by bucket.

### Category A — Bug fix
Symptoms reported: "the X is crashing", "the Y is showing wrong", "this button doesn't work".

**Procedure:**
1. Reproduce mentally from current code. Read the relevant function in App.jsx.
2. Form a hypothesis. State it: *"My best guess is X is happening because Y."*
3. Check against AGENT.md §7 "Common pitfalls" — has this category of bug been seen before?
4. If yes, apply the documented fix.
5. If no, propose the fix and walk the user through what changed and why.
6. Verify with a syntax check (TypeScript dry-run via `tsc --jsx preserve --noLib --allowJs --noResolve --noEmit`) before delivering.
7. Add a CHANGELOG entry under "Patch — vX.Y.Z".

### Category B — Feature addition (new field, new button, new tab)
**Procedure:**
1. Confirm scope. Ask if the feature should go in EN-only or EN+ES (default EN+ES).
2. Plan touchpoints. List every component that needs to change.
3. Implement in one atomic Python script with all edits.
4. Run syntax check.
5. Add a CHANGELOG entry under "Minor — vX.Y.0".

### Category C — Translation addition or correction
**Procedure:**
1. Confirm the target dictionary location (Line 76 EN, Line 77 ES in App.jsx as of v0.3.0; verify with `grep -n "^const T={en:" App.jsx` if uncertain).
2. Add the key to BOTH languages. NEVER leave one missing.
3. Apply the `t.key || "Fallback"` pattern wherever the string is used.
4. Run syntax check.
5. Patch CHANGELOG.

### Category D — Reversing a locked decision
**Procedure:**
1. Confirm twice. Say:
   > "You're asking to reverse locked decision D-X: [restate it]. This means [list the implications]. Are you sure?"
2. If confirmed, in AGENT.md:
   - Move the decision from "Locked decisions" to a new section "Reversed decisions" with the date and reason.
   - Renumber if needed (but prefer keeping D-X numbers stable; just mark as reversed).
3. Apply the technical change.
4. Bump version (this is at least a minor bump, possibly major).
5. Add a CHANGELOG entry under "Decision reversal — vX.Y.0".

### Category E — Setup / infrastructure (Supabase, Stripe, deploy config)
**Procedure:**
1. Confirm Open Decision (AGENT.md §5) is being closed. If yes, move it to Locked.
2. Walk the user through the setup steps if external services are involved.
3. Write the actual code/config separately from any external setup instructions.
4. Add CHANGELOG entry.
5. After done, update AGENT.md §4 with any new Locked Decisions.

---

## Step 3 — The atomic-write rule

Every edit to App.jsx MUST follow this pattern to avoid the "file truncated to 0 bytes" disaster from 2026-04-25:

```python
import pathlib
SRC = pathlib.Path("/home/claude/App.jsx")
text = SRC.read_text(encoding="utf-8")

# ... apply all replacements to `text` in memory ...
# If any text.count(find) != 1, SYS.EXIT before writing.

# Atomic write:
with open(SRC, "wb") as f:
    f.write(text.encode("utf-8", errors="replace"))
```

Use `wb` mode and `errors="replace"` to survive surrogate Unicode. Never use `SRC.write_text()` directly — it has a partial-write failure mode.

---

## Step 4 — Verify before delivering

After every change:

1. **Brace/paren/bracket balance check:**
   ```bash
   echo "Curly: $(tr -cd '{' < /home/claude/App.jsx | wc -c) / $(tr -cd '}' < /home/claude/App.jsx | wc -c)"
   echo "Paren: $(tr -cd '(' < /home/claude/App.jsx | wc -c) / $(tr -cd ')' < /home/claude/App.jsx | wc -c)"
   echo "Square: $(tr -cd '[' < /home/claude/App.jsx | wc -c) / $(tr -cd ']' < /home/claude/App.jsx | wc -c)"
   ```
   Each line must show matching counts.

2. **TypeScript syntax check:**
   ```bash
   /home/claude/.npm-global/lib/node_modules/typescript/bin/tsc --jsx preserve --allowJs --noEmit --target es2020 --module esnext --moduleResolution node --strict false --skipLibCheck --noResolve --noLib /home/claude/App.jsx 2>&1 | grep -iE "error TS1|syntax|unexpected" | head -10
   ```
   Should return nothing. Real syntax errors will list line numbers.

3. **Update build marker.** Inside App.jsx, find the line `window.__GA_BUILD__="..."` and bump the date. This lets the user verify in DevTools console after deploy that the new bundle is live.

4. **Copy to outputs:**
   ```bash
   cp /home/claude/App.jsx /mnt/user-data/outputs/App.jsx
   ```

5. **Call `present_files`** to share the result.

---

## Step 5 — Update the supporting files

After every change, update the meta-files:

1. **CHANGELOG.md** — add an entry. Format:
   ```
   ## v0.1.1 — 2026-05-11 (Patch)
   - **FIX:** [what was broken]
   - **WHY:** [root cause]
   - **CHANGED:** [list of files/components touched]
   ```
2. **AGENT.md** — if any locked decision changed, if any open decision closed, if a new convention emerged, update the relevant section. Do NOT update for routine patches.
3. **Version bump** in both files.

---

## Step 6 — Tell the user what to do next

After delivering, ALWAYS end the message with:

1. What file(s) they need to download.
2. Where to put them (`src/App.jsx` for the app, project root for AGENT.md / CHANGELOG.md).
3. Reminder about Vercel auto-deploy + hard refresh.
4. The build marker string they should see in DevTools to confirm the new build is live.

---

## Things this skill does NOT do

- Run `npm install` or any package management — user maintains that.
- Push to GitHub directly — user does the upload.
- Apply translations to one language but not the other (always both).
- Add inline emoji as raw bytes in Python source files — always use the raw character in source.
- Use `MutationObserver` for translation. Banned by D-4.
- Change the file architecture (D-1).
- Add new top-level localStorage keys without confirming (D-10).
- Use `<calc.C/>` style lowercase dynamic JSX (D-11).
- Recommend Redux / Zustand / Context-mania (D-7).

---

## When something goes wrong

If a Python edit script fails midway, the file may be corrupted. **Always check** before continuing:

```bash
wc -l /home/claude/App.jsx
# If 0 bytes or radically different from expected, restore from /mnt/user-data/outputs/App.jsx
```

If outputs is also stale, ask the user to re-upload from their local copy.

---

## Tone with the user

- Be direct. Don't oversell wins.
- When you broke something previously, own it. Don't blame "complex codebase."
- Skip ceremony like "Great question!" — get to the point.
- When the user is frustrated (which they have been about translations), acknowledge it, then fix it. Don't promise it'll work this time — just do it carefully.
- Spanish is for the app, not for chat. Reply to the user in English unless they switch.

---

*This SKILL was authored 2026-05-11. Last updated 2026-05-15 — added Step 0 (WORKPLAN.md claim requirement) and renumbered existing Steps 0–5 → 1–6. Bump the date when the procedure itself changes (rare).*
