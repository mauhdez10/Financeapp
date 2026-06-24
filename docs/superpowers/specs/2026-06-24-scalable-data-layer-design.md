# Scalable data layer — design spec

> Status: APPROVED (owner, 2026-06-24). Drives the implementation plan (writing-plans next).
> Goal: the advisor app must not break when a single account holds **tens of thousands** of
> clients — worst case by explicit owner decision, regardless of how growth actually distributes.

## 1. Problem (grounded in current code)

The app is a **load-everything-into-the-browser** SPA:

- `gaLoadClients(userId)` runs `select("data").eq("user_id",…)` — pulls **every** client of an
  advisor with each client's **entire `data` jsonb blob** (contact + all financials + every monthly
  snapshot + SSN/DOB). No pagination, no limit.
- `App()` holds `const [clients,setClients]=useState(...)` — all of them in memory at once.
- localStorage key `ga_v3` caches **all** clients client-side — localStorage caps ~5 MB.
- `ClientList` renders `filtered.map(...)` — one DOM node per client, no virtualization.
- `Dashboard` computes totals/trends with `clients.reduce/filter/flatMap` **client-side**; the trend
  chart is O(clients × months) **per render**.

**Breakage point:** nowhere near 50k. localStorage quota likely blows at a few hundred snapshot-heavy
clients; the load-all-blobs + all-in-memory + render-all path bogs down in the low thousands; the
dashboard degrades continuously. Painful by ~1–2k clients, unusable well before 50k.

## 2. Decision: Approach A (hybrid), with a future analytics hook

**Chosen: A — keep the per-client JSONB blob as the source of truth; promote the queryable facts to
indexed columns + one normalized time-series table; load lists/aggregates from those, load the full
blob only on demand.**

**Why not B (full normalization into income_streams/bills/cards/… tables):** B's only real benefit is
querying/aggregating across clients' financial *line-items* without opening them. Owner confirmed that
is **"maybe later, not now"**, not a core near-term feature. B carries a permanent tax — every save
becomes a multi-table transaction, every calculator/chart/report read becomes a multi-join
reassembly, and the whole app (which operates on the in-memory blob shape) gets rewritten. The blob is
the *correct* model for a client's working record (a document loaded/edited/saved as a whole); the app
was slow because it loaded **all** blobs at once, not because it used a blob. A normalizes exactly
where it pays — the cross-client time-series — and leaves the rest as the document it is.

**Future hook:** if cross-client BI becomes core later, build a normalized **analytical projection**
*from* the blobs (materialized views / warehouse) downstream — the operational store does not change.

## 3. Data model — three layers, one source of truth

The blob stays the **single source of truth**. Layers 1–2 are **derived from the blob on every write**
— never hand-maintained, so they cannot drift (one write path, derive everything; same discipline that
fixed the cross-account leak).

**Layer 1 — `clients` summary columns** (queryable client-level facts), added alongside `data`:
```
first_name, last_name, partner_first, email   text
client_type                                   text
net_worth, total_debt, monthly_income,
  liquid_assets                               numeric
snapshot_count                                int
last_activity                                 timestamptz
archived                                      boolean
search_tsv                                    tsvector   -- name+email, GIN-indexed
```
Indexes: `(user_id, archived, last_activity)`, GIN on `search_tsv`. Powers list + dashboard with
**no blob reads**. (`clients` keys on `user_id` today — `gaLoadClients` filters `.eq("user_id",…)`;
the new columns and table reuse `user_id`, not a new `advisor_uid`.)

**Layer 2 — `client_monthly_summary` table** (queryable time-series — the one high-value
normalization). One row per client per month:
```
user_id uuid, client_local_id text, month_key text (sortable),
debt numeric, savings numeric, income numeric, spending numeric, net_worth numeric,
PRIMARY KEY (user_id, client_local_id, month_key)   -- client_local_id → clients.local_id
```
Today this data is buried inside each blob's `monthSnapshots` array; promoting it powers dashboard
trends and any future book-wide analytics.

**Layer 3 — `clients.data` JSONB** — unchanged shape. The full working record; loaded only on open.

## 4. Access paths

- **Write** — `gaSaveClient(client)`: compute summary fields from the blob → upsert `data` + all
  summary columns → upsert the affected `client_monthly_summary` rows. One function, transactional;
  import/merge/restore already funnel through it.
- **List** — `gaListClients({page,pageSize:50,sort,search,archived})`: selects **only** summary
  columns; server `ilike`/tsv search; server `order`; `.range()` pagination. UI virtualizes rows.
- **Detail** — `gaLoadClient(localId)`: loads the one full blob on open.
- **Dashboard** — `SECURITY DEFINER` RPC `ga_dashboard_summary(advisor)`: totals
  (`sum(total_debt)`, `sum(monthly_income)`, counts by type) + trend from `client_monthly_summary`,
  computed in Postgres. Few-hundred-byte payload regardless of client count.

## 5. Security / RLS

New columns inherit the existing per-advisor RLS on `clients`. `client_monthly_summary` gets the same
`auth.uid() = user_id` policy. The RPC is `SECURITY DEFINER` but filters strictly to `auth.uid()`
(same posture as the portal/link service endpoints). **Adversarial re-proof required** before ship:
advisor, linked client, unlinked client, revoked link each see exactly their own across the new
columns/table/RPC (logic skill §6).

## 6. App-state refactor

`App()` holds `clientsPage` (current ~50 summary rows) + `openClient` (one full blob), not all clients.
`ClientList` renders the paginated, virtualized page; search/sort/filter hit the server. `Dashboard`
consumes the RPC. Open → `gaLoadClient` → `ClientDetail`; save → `gaSaveClient` re-derives + invalidates
caches. **Drop localStorage `ga_v3` full-cache**; cache only page + open client, uid-namespaced
(pitfall #18). Scope the spots that iterate all clients today (join/split pickers, all-month-labels,
export-all) to server queries.

## 7. Rollout (phased, each shippable; disposable data → reseed clean)

1. **DB migration** — summary columns + `client_monthly_summary` + RLS + indexes + dashboard RPC.
2. **Write path** — `gaSaveClient` derives + writes summaries; reseed; verify populated.
3. **List** — `gaListClients` + paginated/virtualized `ClientList`.
4. **Dashboard** — RPC + trend table; verify aggregates match.
5. **App-state** — drop load-everything + localStorage full-cache; wire page/open-client state.

Each phase: `npm run build` green, run-verify in the real app, commit + push, verify live marker.

## 8. Verification — the proof it scales

A script seeds a **synthetic 10k–50k client dataset** through the real save path. Each phase is
measured against it: list first-paint, search latency, dashboard load, browser memory. **Success
criterion: sub-second list + dashboard and flat memory regardless of client count.** Plus EN/ES
symmetry on any new strings and the adversarial RLS re-proof (§5).

## 9. Open items / non-goals

- **Non-goal:** normalizing line-items (deferred to the future analytics hook, §2).
- **Non-goal:** bundle-size/code-splitting (separate perf track; not client-count scaling).
- Confirm pageSize (50) and trend window defaults during implementation.
- Backup "export all" at 50k: paginate or server-stream (rare admin action) — detail in the plan.
