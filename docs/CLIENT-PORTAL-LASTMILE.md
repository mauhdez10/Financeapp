> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Archive when feature/client-portal merges or is abandoned.

# Client Portal — Last-Mile Plan & Review (2026-06-06)

Review of branch `feature/client-portal` (unmerged, not deployed). Foundation is sound and
safe to sit unmerged; **not merge-ready**. Full architecture detail in
`docs/CLIENT-PORTAL-HANDOFF.md` (on the branch). This doc is the action list.

## Verdict
Clean, well-isolated foundation. Big architectural calls are right: lazy `/portal` route-split
(advisor app byte-identical), RLS as the security boundary, Stripe webhook as the **sole writer**
of access state, field-whitelisted client-edit RPC. But several items block merge/launch.

## Critical / High findings

1. **[RESOLVED — was CRITICAL] `clients.data` shape.** Migration 02's client-edit RPC assumed
   flat top-level keys. **Verified against live DB (keys only, no PII): the shape IS flat** —
   `firstName, lastName, email, phone, address, dob, bills, cards, accounts, loans,
   incomeStreams, monthSnapshots, assets, liabilities, properties, marketInvestments,
   savedCalcs, savedCompare, savedPortfolio, notes, social, p1Social, p2Social, …` (7 active
   clients). The RPC approach works. **BUT:** the allow-list must use real key names
   (e.g. `incomeStreams`, NOT `income`).
2. **[SECURITY] Allow-list must EXCLUDE sensitive + advisor-only fields.** The data holds
   SSN-style fields (`social`, `p1Social`, `p2Social`), advisor `notes`, `recommendedBy`,
   `servicePlan`, `planStrategy`. Clients must NOT be able to edit these via
   `client_update_own_data`, and `client_get_own_data` should not expose advisor `notes`.
   Decide the client-editable set deliberately (likely: contact fields + their own financial
   inputs; never advisor notes / internal routing / another person's SSN).
3. **[HIGH] App-level id ↔ DB uuid mapping.** App "client" = the JSON blob keyed by
   `data.id` (`Date.now()`); DB row PK is a separate uuid. `provision_client_account(p_client_id uuid)`
   has no helper to resolve the app-level id. Onboarding must look up
   `clients.id WHERE data->>'id' = <appId>` (or via `local_id`).
4. **[HIGH] Webhook never provisions accounts / creates Auth users.** It writes periods but
   never calls `provision_client_account` and never creates the Supabase Auth user. Onboarding
   Flow 1 (intake→pay→auto-account) is unbuilt; v1 assumes the account already exists.
5. **[HIGH] One-time period not idempotent.** `record_one_time_period` inserts unconditionally;
   Stripe retries → duplicate periods. Add a unique constraint on `(client_account_id, stripe_ref)`
   or upsert. (Subscription writer IS idempotent — good.)
6. **[D-3 VIOLATION] Portal is English-only, hardcoded.** Zero `T.en`/`T.es`. Bilingual is
   launch-required. Add full i18n when the UI is rebuilt on the locked design.

## Medium / Low
- `invoice.paid` subscription resolution is fragile (proration / multi-line / timing) — test the real renewal cycle.
- Stripe `apiVersion` pinned `2024-06-20` with SDK v22 — verify object shapes or bump deliberately.
- No rate-limiting on `portal-*` endpoints — add `api/_ratelimit.js` for parity with main (v0.59.6).
- `SUPABASE_SERVICE_ROLE_KEY` must be set in Vercel or the webhook silently grants no access.
- Confirm Supabase Auth Site-URL/redirect allow-list includes `…/portal` (recovery hash flow).

## Merge hygiene
Branch was cut from current main but its `AGENT.md`/`CLAUDE.md` edits + doc deletions **revert
the 2026-06-05 single-folder + design-mode doc changes main just adopted**. On merge: rebase
onto main, **drop the doc-revert hunks**, keep only the AGENT.md D-22 amendment + the `.gitignore`
hardening + code + migrations. `App.jsx` untouched on the branch → no code conflict.

## Sequencing (design-first, then portal on locked design)

**Now — backend/security/data, the redesign can't invalidate any of it:**
1. Correct migration 02 allow-list (real key names + exclude sensitive/advisor fields) + the id→uuid mapping in 03.
2. Apply 01 + corrected 02 + 03 to a Supabase branch/preview (NOT prod); set service-role + Stripe test env on a Vercel preview.
3. Build provisioning + Auth-user creation in the webhook (invite-link flow first — reuses existing intake-invite infra; defer intake→pay).
4. Adversarial cross-client isolation test + `/security-review` (launch gate; design-independent).
5. Add rate-limiting + one-time idempotency to portal endpoints.

**After the redesign locks:**
6. Rebuild `PortalApp.jsx` on locked design tokens + full EN/ES i18n (don't build UI twice).
7. Wire report/plan rendering (decide: extract shared render module vs server-rendered PDF) — largest piece.
8. Document upload/download (private `client-docs` bucket + Storage RLS + signed URLs).
9. Advisor-side management UI in `App.jsx` (matches redesigned advisor app).
10. Rebase, drop doc reverts, final `/security-review`, merge.
