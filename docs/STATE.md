# STATE.md — Golden Anchor Finance (current snapshot)

> The 60-second orientation for a fresh chat: where the project is **right now**. Updated on every
> batch (part of definition-of-done). For the full doc index see [LOGIC_MAP.md](LOGIC_MAP.md);
> always-on rules in [UNIVERSAL_RULES.md](UNIVERSAL_RULES.md); known issues in
> [ISSUES_LEDGER.md](ISSUES_LEDGER.md). Last updated: **2026-06-25**.

## Live now
- **Marker:** `__GA_BUILD__ = 2026-06-25-v0837-chartsettingsmodal-dashchartoptions-fix` (v0.83.7).
- **Deployed:** https://finance.goldenanchor.life (Vercel auto-deploys `main`).
- **origin/main == local HEAD** — clean base, **no held stack** (the v0.83.1→v0.83.7 stack was
  approved and pushed 2026-06-25; the v0.83.1 save-toast gate shipped, accepted in test-mode).

## Codebase shape
- Single-file-origin React/Vite SPA. `src/App.jsx` ≈ 3,023 lines (down from 8,502) after the D-37
  Phase 0/1/2 extraction into `constants/ utils/ services/ components/ pages/ styles/ hooks/
  contexts/`. Plan + status: [ARCHITECTURE-PLAN.md](ARCHITECTURE-PLAN.md).
- **Phase 2 remaining (deferred, attended-only):** the `ClientDetail` / `Dashboard` shell
  decomposition — highest state coupling; do in a focused session, not an autonomous tick.
- Two roles live: **advisor** + **client**, isolated via auth `user_metadata`. Money/role rules:
  the `golden-anchor-logic` skill.
- Scale data layer shipped (v0.81–v0.83): advisor app holds summary rows + lazy-loads blobs;
  5 dashboard RPCs; reminders RPC; paged loaders. Source: `superpowers/` reports (archived).

## In flight (this work)
- **Documentation-lifecycle system** (PLAYBOOK §4b/§4c) being set up: `LOGIC_MAP`, `UNIVERSAL_RULES`,
  `ISSUES_LEDGER`, this file, `DEPENDENCY-MAP`, the archive sweep, kill-conditions, the
  `finance-review-mode` + `finance-feedback-intake` skills, and the self-orienting `CLAUDE.md`
  bootstrap.
- **CRUISE MODE infra** (next, after the docs system): `docs/CRUISE_MODE.md` ordered map +
  `CRUISE_HEARTBEAT.md` + the dual-worker loop. Design approved; registration **paused** pending the
  docs foundation. Decisions locked: approve→main (done), additive+verified→main, Playwright-only
  testing, never-touch-Velo.

## Where things live (so a fresh chat checks instead of asking)
- **Secrets / keys / logins:** `finance-credentials.md` (gitignored, repo root) — never commit/print.
- **Real client sample files (imports/exports/payloads):** **none on disk yet** (test-mode, no real
  data). When a `docs/reference/` folder is added, the review handler verifies against it.
- **Code-structure map:** `graphify-out/GRAPH_REPORT.md` + [APP-MAP.md](APP-MAP.md) →
  [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md).
- **DB:** `supabase-finance` MCP, project `ukqqcrupyooqyksotieu` (read-only for checks).

## Owner-pending (won't move without you)
- 2 Vercel env vars (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`) → unlock auto-activation /
  any-amount checkout / MRR panel.
- Rotate all pasted secrets pre-launch (Stripe / Resend / GitHub PAT / Supabase `sbp_`).
- The 🟡 owner-decision items in [ISSUES_LEDGER.md](ISSUES_LEDGER.md).
