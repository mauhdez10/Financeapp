# Client Portal — Design Spec (2026-06-05)

> Status: **DRAFT for owner review.** Built autonomously overnight on branch
> `feature/client-portal`. Nothing here is live. The owner must review this spec,
> apply the migrations, configure Stripe, and test before any merge to `main`.

---

## 1. Context & decision amendments

The Golden Anchor finance app is today a **single-advisor tool**: one Supabase
Auth user (Mauricio) owns all `clients` and `settings` rows; clients are *data*,
not users; prospects use a no-login public intake.

This feature adds a **paid client portal**: clients get their own accounts, pay
(recurring or one-time), and — while paid — can view their plan/reports, edit
their own data, upload documents, and message the advisor.

This **amends three locked decisions** (owner-approved 2026-06-05):
- **D-22** ("client-facing portal deferred to year 2") → brought forward now.
- **D-6** ("no multi-tenant SaaS yet") → partially relaxed: we add a second
  *role* (client) in the same single-advisor project. This is NOT the full
  B2B agency multi-tenancy of D-23 — it's one advisor + their own clients.
- **D-1** ("single-file App.jsx") → relaxed for the portal: the portal is its
  own code module (`src/portal/`), not bolted into the 7,950-line App.jsx.
  The advisor app stays where it is.

These amendments must be written into AGENT.md §4 when this ships.

## 2. Owner decisions (from 2026-06-05 brainstorm)

| Decision | Choice |
|---|---|
| v1 scope | **Everything**: view + edit own data + upload docs + message advisor |
| Access model | **Time-boxed for all** — access requires a *current paid period*; when payment lapses, the client keeps their account but loses access until they pay again |
| Onboarding | **Both**: (a) prospect finishes intake → pays → account auto-created; (b) advisor sends an invite link |
| Audience | **New paid clients only** — existing client rows are untouched in v1 |
| Payments | Stripe (already in the stack) — recurring + one-time, prices set by advisor |
| Security | Same Supabase project; clients are Auth users with a `client` role; **RLS isolates each client to only their own data** |

## 3. Approaches considered

**A. Same app, role-routed, RLS-isolated (CHOSEN).** Clients and the advisor are
both Supabase Auth users in the *same* project, distinguished by a `role`. The
SPA routes to the advisor app or the portal app based on role. Client data lives
in the existing tables plus new portal tables, all guarded by RLS so a client
can only ever read/write their own rows. *Pro:* one deploy, one DB, reuses the
existing Supabase client, intake, and report engine. *Con:* RLS must be airtight —
a single bad policy leaks one client's finances to another. Mitigated by making
RLS the centerpiece + an adversarial isolation test before launch.

**B. Separate portal app + shared DB.** A second Vite app / subdomain for the
portal, same Supabase project. *Pro:* hard code separation. *Con:* second deploy
pipeline, duplicated Supabase wiring, more surface for env drift — not worth it
for one advisor.

**C. Separate DB / service.** Over-engineered for this scale; rejected.

## 4. Architecture overview

```
                       finance.goldenanchor.life (one Vite SPA)
                                     |
                 main.jsx -> role check on session
                   +-----------------+-----------------+
            advisor role                           client role
          src/App.jsx (existing)              src/portal/PortalApp.jsx (new)
          owns clients/settings               sees only their own client row
                                              gated by active paid period
                                     |
                       same Supabase project (RLS-enforced)
                       +--------------+---------------+
              existing tables     new portal tables   Stripe state
              (clients,settings)  (client_accounts,   (subscriptions,
                                   portal_messages,    payments - synced
                                   client_documents,   by webhook)
                                   client_periods)
                                     |
                  api/ serverless (Stripe checkout + webhook, uploads)
```

Routing: `main.jsx` reads the Supabase session. If the user has a row in
`client_accounts` -> render `PortalApp`. Else if they are the advisor -> render
the existing `App`. Unauthenticated on a portal path -> portal login; else advisor
login. (Exact path scheme in §10.)

## 5. Auth & roles

- Clients are **Supabase Auth users** in the same project (email/password).
- A new table `client_accounts` links `auth.users.id` -> a `clients` row +
  carries the `role='client'` marker, status, and Stripe customer id.
- The **advisor** is identified as today (the original owner UUID). A helper
  `is_advisor(uid)` / `is_client(uid)` drives routing + RLS.
- **No privilege crossover:** a client JWT can never read advisor-wide data; the
  advisor can read their own clients (as today). Enforced by RLS, not the client.

## 6. Data model (new tables — all RLS-guarded)

> Full DDL is in `supabase-migrations/2026-06-05-client-portal-*.sql` (drafted,
> NOT applied). Summary:

**`client_accounts`** — one row per portal client.
`id, auth_user_id (unique), client_id (-> clients.id), advisor_id, email,
status (invited|active|suspended), stripe_customer_id, created_at`.
RLS: a client reads only their own row (`auth_user_id = auth.uid()`); the advisor
reads rows where `advisor_id = auth.uid()`.

**`client_periods`** — the time-boxed access ledger. One row per paid period
(subscription term or one-time session).
`id, client_account_id, kind (subscription|one_time), starts_at, ends_at,
source (stripe), stripe_ref, status (active|expired|canceled)`.
"Has access right now" = `EXISTS a period where now() BETWEEN starts_at AND
ends_at AND status='active'`. Subscriptions extend `ends_at` on each renewal
webhook; one-time sessions get a fixed window (advisor-configurable length).

**`client_documents`** — client uploads + advisor-shared files.
`id, client_account_id, advisor_id, storage_path, filename, uploaded_by
(client|advisor), size, created_at`. Stored in Supabase Storage (private bucket),
RLS + signed URLs only.

**`portal_messages`** — advisor <-> client thread.
`id, client_account_id, sender (client|advisor), body, created_at, read_at`.
RLS: client sees only their thread; advisor sees their clients' threads.

**`portal_settings`** (on advisor `settings` or new) — advisor's portal config:
prices (monthly/yearly/one-time amounts + Stripe price ids), one-time session
window length, welcome copy, which sections clients may edit.

**Edits to existing data:** when a client edits "their own data," they write to
*their* `clients` row (and related financial rows) — only the fields the advisor
allows — guarded by RLS keyed through `client_accounts.client_id`.

## 7. Payments (Stripe)

- **Recurring:** Stripe Subscription (monthly/yearly price). Active subscription
  -> an open-ended `client_periods` row whose `ends_at` rolls forward on each
  `invoice.paid` webhook; `customer.subscription.deleted`/`unpaid` -> period
  `status=expired` -> access cut.
- **One-time:** Stripe Checkout (one-time price) -> on `checkout.session.completed`
  a fixed-window `client_periods` row (length from advisor config, e.g. 30/60/90
  days of view access to that session's deliverable).
- **Server endpoints** (`api/`):
  - `portal-create-checkout.js` — creates a Checkout Session (sub or one-time)
    for the logged-in client; returns the redirect URL.
  - `portal-stripe-webhook.js` — verifies signature, syncs subscription/payment
    state into `client_periods` (the *only* writer of access state — never trust
    the client).
  - `portal-billing-portal.js` — Stripe customer-portal link so clients manage
    their own card/cancel.
- **Env (owner sets in Vercel):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_*` (or price ids stored in settings). Until set, the portal runs
  in a **dry-run** mode (same philosophy as email/rate-limit): payment buttons
  show "billing not configured," no access is granted. Nothing breaks.

## 8. Access gate (time-boxed, the heart of the model)

Every portal data read/write passes an entitlement check:
`hasActiveAccess(client_account_id) = EXISTS active client_periods covering now()`.
- Enforced **server-side / in RLS**, never client-side alone.
- Client with no active period -> portal shows a "renew to regain access" screen;
  their data is preserved, just not viewable/editable until they pay.
- The advisor always sees everything (their own clients).

## 9. Onboarding flows

**Flow 1 — intake -> pay -> account (primary).** Prospect completes the existing
public intake. On submission, they're offered the membership/one-time options ->
Stripe Checkout. On `checkout.session.completed`, the webhook (a) creates the
Supabase Auth user (or sends a set-password invite), (b) creates the `clients`
row from intake data + `client_accounts` + first `client_periods` row.

**Flow 2 — advisor invite link.** From the advisor app, "Invite to portal"
generates a tokenized link (reuse the existing invite infra pattern). Client sets
a password, then pays to activate access.

Both converge on: an Auth user + `client_accounts` row + a paid `client_periods`
row = active portal client.

## 10. Portal UI surfaces (`src/portal/`)

- **`/portal` login / set-password** — client auth (separate visual entry from
  advisor login; same Supabase auth).
- **Dashboard** — their net-worth/plan snapshot (reuses the report/chart
  components), current membership status + renew button.
- **My Plan / Reports** — read their reports/deliverables (the frozen one-time
  session report, or live data while subscribed).
- **My Info (edit)** — edit the allowed subset of their financial data; writes
  back to their `clients` row (advisor sees the changes).
- **Documents** — upload to advisor + download advisor-shared files (Supabase
  Storage, private + signed URLs).
- **Messages** — simple thread with the advisor.
- **Billing** — membership status, Stripe customer-portal link, renew/one-time.

Visual direction follows the new `design-principles` skill + the captured palette
work (navy + gold editorial) so the portal feels like the same brand. Detailed
visual design is a later step (after the owner reviews this spec).

## 11. Advisor-side additions (small, in App.jsx)

- A "Portal" area: list client accounts, their status + current period, see their
  uploads + messages, reply, set portal prices + one-time window length, send
  invite links. Kept minimal in v1.

## 12. Security boundaries (the keystone)

- **RLS on every new table**, keyed so a client only ever touches rows tied to
  their `client_accounts.auth_user_id = auth.uid()`. The advisor only touches
  rows where `advisor_id = auth.uid()`.
- **Access state (`client_periods`) is written ONLY by the Stripe webhook**
  (service role), never by the client — a client cannot grant themselves access.
- **Documents** in a private Storage bucket; access via short-lived signed URLs
  gated by the same ownership + active-period check.
- **An adversarial cross-client isolation test** (one client's JWT must fail to
  read/write another client's rows) is REQUIRED before launch — same bar as the
  Velo managed-agent portal proof.
- **`/security-review`** must pass on the finished branch before merge.

## 13. Phased implementation plan (built on the branch in this order)

1. **DB foundation** — migrations: `client_accounts`, `client_periods`,
   `client_documents`, `portal_messages`, portal settings, RLS + helper fns.
   *(drafted as files; owner applies)*
2. **Auth + routing** — role detection in `main.jsx`, `PortalApp` shell, portal
   login/set-password.
3. **Access gate** — `hasActiveAccess` + the "renew" screen + RLS entitlement.
4. **Stripe** — checkout + webhook + billing-portal endpoints (dry-run until keys).
5. **Portal surfaces** — dashboard, reports, my-info edit, documents, messages,
   billing.
6. **Advisor side** — portal management area.
7. **Onboarding** — intake->pay hook + invite link.
8. **Security** — adversarial isolation test + `/security-review` + browser QA.

## 14. Overnight build scope (branch) vs owner morning tasks

**Built overnight on `feature/client-portal` (reviewable, NOT live):** this spec,
the implementation plan, the migration SQL files (unapplied), the Stripe endpoint
code (dry-run), the portal UI module scaffolding + key screens, the routing, and
a handoff runbook.

**Requires the owner (cannot be done from here):**
- Apply the migrations to the **finance** Supabase project (no finance-DB access
  here — the connected MCP points at Velo).
- Create Stripe products/prices + set `STRIPE_*` env vars; configure the webhook.
- Create a private Supabase Storage bucket for documents.
- End-to-end test: real signup -> pay -> access -> lapse -> renew; the adversarial
  isolation test; `/security-review`.
- Review this spec + the branch, then merge to `main`.

## 15. Defaults to confirm (owner, in the morning)

- One-time session view window length (default proposed: **90 days**).
- Whether clients may edit financials in v1 or only view+upload+message first
  (owner said "everything"; flagged because edit-back-to-advisor is the riskiest
  data path — recommend gating edits behind a per-section advisor toggle).
- Exact membership prices + whether monthly + yearly both exist at launch.
- Email for client auth (set-password / magic link) depends on the Resend
  activation — until email is live, invite links are copy-paste.

---

_Spec authored 2026-06-05 by Claude Code (autonomous overnight session), branch
`feature/client-portal`. Brought forward from D-22. Awaiting owner review before
any production merge._
