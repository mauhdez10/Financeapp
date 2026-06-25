---
name: finance-review-mode
description: Use this skill EVERY time Mauricio gives an input about the Golden Anchor Finance app — a feedback batch, a preview reaction, an answer to your questions, a bug report, or a single piece of feedback ("this is wrong", "change X", "I noticed Y", "here's what I want"). It runs the one handler that guarantees nothing is dropped and nothing changes blind: log → bidirectional impact-check → replace-not-parallel → update all canonical files + flip lifecycle states → verify on real files. Do NOT use for general finance questions or strategy chats that don't change the app or docs. For a LARGE multi-item batch, run finance-feedback-intake first to structure it, then this handler per item.
---

# finance-review-mode — how every owner input is handled (nothing missed)

The discipline from PLAYBOOK §4c, made concrete for this repo. Run these five steps **in order**.
Pairs with `finance-app-updater` (the safe-edit mechanics) and `golden-anchor-logic` (the rules that
must not drift). Big batches: structure with `finance-feedback-intake` first, then run this per item.

## 1. Log faithfully — BEFORE any analysis
- Append the owner's input to a dated round doc: `docs/history/ROUND_NN_<topic>.md` (create
  `docs/history/` if absent). **His exact words, one entry per item**, before you interpret anything.
- A single small piece of feedback can be logged directly in `REVIEW_QUEUE.md` instead — but never
  skip the log.

## 2. Impact-check BEFORE changing anything — BOTH directions
For each item, read [docs/DEPENDENCY-MAP.md](../../docs/DEPENDENCY-MAP.md) and trace:
- **BACKWARD** — what feeds this, and its history. Check [docs/ISSUES_LEDGER.md](../../docs/ISSUES_LEDGER.md):
  a match = **recurrence** → root-cause the *old* fix (why did it come back?), don't re-paste it.
  Recall ISS-02: every Phase-2/3 extraction has a habit of dropping an import → `no-undef` crash.
- **FORWARD** — every caller, every UI entry point that reaches the same intent, the owning logic
  doc, and the **DB + code-entry-point** layers of the dependency map. The "shared intents" list at
  the bottom of DEPENDENCY-MAP (export/backup, chart slots, reminders) names the multi-entry-point
  ones. Verify the logic against reality **before** you implement.
- **Gate:** if the item touches money / roles / RLS / SSN / split-join → consult `golden-anchor-logic`
  NOW, before writing code.

## 3. Change as a REPLACEMENT, not a parallel path
- Redirect or remove **every** old entry point. Never leave the old path as the default while the fix
  lives only in a new screen — that is the #1 recurrence cause.
- Match client identity by a **stable key** (local_id / DOB / hash), never by name.

## 4. Update ALL affected canonical files the SAME turn + flip lifecycle states (§4b)
- **The one owning doc** for the topic (one owner per topic) + **CHANGELOG.md** (the *why*) +
  **UNIVERSAL_RULES.md** only if a genuinely new always-on rule.
- **REVIEW_QUEUE.md** — lean: remove items the owner has verified; don't archive in place.
- **ISSUES_LEDGER.md** — one-line status (open → fixed; mark recurrences 🔁).
- **STATE.md** — refresh if the live version / in-flight picture changed.
- **Bump `__GA_BUILD__`** for any app behavior change (NOT for docs/tooling-only).
- **Lifecycle sweep:** archive any now-done ephemeral (done **+reviewed** only → `docs/archive/`,
  ⛔ banner, drop from `LOGIC_MAP`); confirm no ephemeral is orphaned (every one has a kill-condition)
  and nothing live links to an archived file.

## 5. Verify on REAL files before marking done
- Gates: `npm run build` → `npm run lint` (no NEW errors) → EN/ES symmetry (both `T.en`+`T.es`).
- **Drive the real app, not assertions:** Playwright against the deploy URL, or the headless preview.
  **No agent-browser / computer-use / Claude-in-Chrome** (need the owner present).
- Real client sample files (imports/exports/payloads) live in `docs/reference/` when present
  (gitignored, PII) — read + test against them; **never ask the owner for what's on disk.** As of
  2026-06-25 there are none (test-mode) — note that limitation instead of inventing fixtures.
- Access-control / role changes get an **adversarial per-role proof** (UI presets, not just rows).

## Push (per UNIVERSAL_RULES §6)
Additive + fully verified → push to `main` (auto-deploys). Live save/load/mutation path you can't
verify headlessly, or anything you're unsure of → commit local, do NOT push, stage in REVIEW_QUEUE
(or append a yes/no with your recommendation to `docs/CRUISE_QUESTIONS.md`) and move on.
