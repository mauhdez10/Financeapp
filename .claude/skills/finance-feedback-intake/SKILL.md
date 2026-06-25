---
name: finance-feedback-intake
description: Use this skill when Mauricio drops a LARGE or multi-item batch of feedback on the Golden Anchor Finance app — a long message with many asks, a preview walk-through with many reactions, a pasted list, or a "here's everything I noticed" dump. It parses the batch into a tagged, dated ROUND doc (one entry per item, his exact words), cross-checks each item against the issues ledger for recurrences, refills the backlog in priority order, and surfaces every clarifying question AT ONCE so the owner answers in one pass. Then each item is executed through finance-review-mode. For a single small piece of feedback, skip this and go straight to finance-review-mode.
---

# finance-feedback-intake — turn a big owner batch into structured, gap-free work

The front-end for a large batch (PLAYBOOK §3 + §5). Goal: capture everything verbatim, lose nothing,
ask once, and hand clean items to `finance-review-mode`. Pairs with `finance-app-updater`.

## 1. Capture verbatim → a ROUND doc
- Create `docs/history/ROUND_NN_<YYYY-MM-DD>_<topic>.md` (next NN; create `docs/history/` if absent).
  This is a **Live·ephemeral** doc — stamp it with a kill-condition ("archive when every item is
  shipped + owner-verified").
- One entry per item, **Mauricio's exact words** quoted, before any analysis. Number them (R<NN>-01…).
- If the batch came from a preview, note the screen/URL each reaction targets.

## 2. Tag every item
Per item add: **type** (🐛 bug · 🟣 feature · 🎨 design/taste · 🔒 security · 📝 copy · ⚙️ infra),
**area** (which surface / DB table / doc — cross-ref DEPENDENCY-MAP), **gate?** (does it touch
money/role/RLS/SSN/split → `golden-anchor-logic` required), and **owner-decision?** (subjective/taste
or pricing/role/billing/destructive → needs the owner, don't auto-do).

## 3. Recurrence cross-check (backward, the whole batch at once)
- For each item, scan [ISSUES_LEDGER.md](../../docs/ISSUES_LEDGER.md). A match = **recurrence (🔁)** —
  flag it: the previous fix regressed or was a parallel-path patch. Root-cause before re-fixing.
- Watch the known pattern (ISS-02): extraction work dropping imports → `no-undef`.

## 4. Refill the queues, in priority order
- 🟢 green-light (bug / objective UX / copy / a11y / doc hygiene — pre-approved) → `docs/BACKLOG.md`
  in priority order (bugs first).
- ⛔ owner-only (pricing/tiers, roles/RLS, billing/Stripe, destructive, removing a feature, and any
  🎨 taste call) → log to `REVIEW_QUEUE.md` and/or a yes/no in `docs/CRUISE_QUESTIONS.md`.
- 🎨 design/taste needing a decision → build a mockup/HTML option set and queue it (don't guess).
- New issues → `ISSUES_LEDGER.md`.

## 5. Ask EVERYTHING once
- Collect every clarifying question across the whole batch and ask them in a single pass (one
  `AskUserQuestion` round or one numbered list) — Mauricio answers "1. yes 2. a 3. skip" in one go.
- Don't dribble one question per item across many turns.

## 6. Hand off to execution
- Each green-light item now runs through **`finance-review-mode`** (log is already done → start at its
  step 2 impact-check) to definition-of-done.
- When every item in the ROUND doc is shipped + owner-verified, archive the ROUND doc (its
  kill-condition) and lean the REVIEW_QUEUE.

**Never block, never idle, never miss an item:** anything you can't act on becomes a tagged queue
entry or a logged question — it does not evaporate.
