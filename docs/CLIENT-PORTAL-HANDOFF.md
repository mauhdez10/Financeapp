# Client Portal — Morning Handoff (2026-06-05)

Built autonomously overnight on branch **`feature/client-portal`**. **Nothing is
live.** Your production site is untouched (all work is on the branch; the portal
only loads on the `/portal` path even after merge). Read this, then decide.

Spec: `docs/superpowers/specs/2026-06-05-client-portal-design.md` (read it first).

---

## 1. What got built (reviewable on the branch)

| Layer | Status |
|---|---|
| **Design spec** | ✅ Complete — architecture, data model, security, phased plan |
| **DB migrations** (3 files, `supabase-migrations/2026-06-05-client-portal-*`) | ✅ Drafted — `client_accounts`, `client_periods` (time-boxed access), `client_documents`, `portal_messages`, full RLS, access helpers, field-whitelisted client-edit RPC, service-role provisioning/period functions. **NOT applied.** |
| **Portal UI** (`src/portal/`) | ✅ Working skeleton — login / set-password / reset, dashboard, my-info edit, documents list, messages thread, billing, renew-gate. Code-split (13.9 kB), lazy-loaded on `/portal` only. |
| **Routing** (`src/main.jsx`) | ✅ `/portal` → portal; everything else boots the advisor app byte-identical. |
| **Stripe endpoints** (`api/portal-*`) | ✅ create-checkout, webhook (sole writer of access state), billing-portal. **Dry-run** until `STRIPE_*` env is set. |
| Build / audit | ✅ `npm run build` green · `npm audit` 0 |

## 2. What is NOT built yet (the "last mile" — next session)

These are specced but deliberately not built overnight (they need your decisions
or live testing):

- **Report rendering inside the portal** — the dashboard/plan screens are
  placeholders; wiring the existing advisor report engine into the client view
  is the next UI phase.
- **Real document upload/download** — needs the private Supabase Storage bucket
  (step 4 below) + signed-URL plumbing. The Documents screen lists rows but
  upload is stubbed.
- **Onboarding flows** — the intake→pay→account hook and the advisor invite link
  are designed (spec §9) but not wired. v1 currently assumes a client_account +
  Auth user already exist.
- **Advisor-side management UI** — seeing/replying to client messages, viewing
  uploads, setting prices, sending invites (spec §11). Not built; prices can be
  set directly in `settings.data.portal` meanwhile.

## 3. EXACT steps to make it live (in order)

> Do these on a calm morning, not in a rush — it touches money + client data.

**A. Apply the migrations** to the **finance** Supabase project (Dashboard → SQL
editor, run each file in order):
1. `2026-06-05-client-portal-01-schema-rls.sql`
2. `2026-06-05-client-portal-02-client-data-access.sql`
3. `2026-06-05-client-portal-03-provisioning.sql`
Then **review the edit allow-list** in file 02 (`client_update_own_data`) — confirm
those are the fields you want clients to self-edit; remove any you don't.

**B. Create a private Storage bucket** named `client-docs` (Supabase → Storage →
New bucket, **not public**). Storage RLS policies for it are still to be written
(part of the document-upload phase) — leave uploads off until then.

**C. Stripe setup:**
1. Create products + prices (monthly, optional yearly, one-time) in Stripe.
2. Set env vars in Vercel (Production + Preview): `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, and either `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`
   / `STRIPE_PRICE_ONE_TIME` **or** store the price ids in your `settings.data.portal`
   (`priceMonthly`, `priceYearly`, `priceOneTime`, `oneTimeDays`).
3. Add a Stripe webhook endpoint → `https://finance.goldenanchor.life/api/portal-stripe-webhook`
   subscribing to: `checkout.session.completed`, `invoice.paid`,
   `customer.subscription.deleted`, `customer.subscription.paused`. Copy its
   signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Until all of the above is set, the portal runs **dry-run**: payment buttons
   say "billing isn't configured" and no access is granted. Safe.

**D. Test (on a Vercel preview of the branch, not production):**
- Create a test client_account + Auth user, give it a `client_periods` row, sign
  in at `/portal`, confirm the gate + screens.
- Run a real Stripe test-mode checkout → confirm the webhook writes a period →
  access unlocks → let it lapse → confirm access cuts.
- **Adversarial isolation test (REQUIRED):** with client A's JWT, attempt to read
  and edit client B's `clients` row, documents, and messages — every attempt must
  fail. This is the launch gate (same bar as Velo's managed-agent proof).
- Run `/security-review` from a session rooted in this folder.

**E. Only then** review the branch + merge to `main`.

## 4. Decision amendments (recorded in AGENT.md §4 on this branch)

Building this amends **D-22** (client portal brought forward from year-2), **D-6**
(a second `client` role added — still single-advisor, not the D-23 agency model),
and **D-1** (portal lives in `src/portal/`, not App.jsx). Confirm you're good with
these when you review.

## 5. Questions to confirm (from the brainstorm)

- One-time session view window: defaulted to **90 days** — right?
- The client-editable field allow-list (migration 02) — review it.
- Membership prices + monthly-vs-yearly at launch.
- Client auth emails (set-password / magic link) need Resend live; until then,
  onboarding is via manually-created accounts / copy-paste links.

## 6. If you want to STOP here
Totally fine — the branch sits harmlessly. Nothing deploys until you merge. You
can also cherry-pick just the spec for later, or delete the branch. No production
risk either way.
