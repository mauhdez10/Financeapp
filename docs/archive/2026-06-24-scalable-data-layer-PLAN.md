> **⛔ ARCHIVED — do not use.** This work is DONE/SHIPPED or SUPERSEDED. Kept for history only; NOT in LOGIC_MAP. For current truth see [docs/STATE.md](STATE.md) + [CHANGELOG.md](../../CHANGELOG.md).

# Scalable Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the advisor app never break when a single account holds tens of thousands of clients, by moving from "load every client blob into the browser" to server-paginated lists + load-detail-on-demand + server-side aggregates.

**Architecture:** Keep the per-client `clients.data` JSONB blob as the single source of truth (unchanged shape, so calculators/charts/reports keep working). Add **derived** read-optimizations written on every save: indexed summary columns on `clients`, and a normalized `client_monthly_summary` time-series table. List/search/sort/dashboard read those cheap surfaces; the full blob loads only when one client is opened. Spec: `docs/superpowers/specs/2026-06-24-scalable-data-layer-design.md`.

**Tech Stack:** React 18 / Vite SPA (`src/App.jsx` shell + `src/components/*`, `src/services/supabase.js`), Supabase Postgres (jsonb + RLS), `@supabase/supabase-js`. DB changes applied via the `supabase-finance` MCP (`mcp__supabase-finance__apply_migration` / `execute_sql` / `list_tables` / `get_advisors`).

## Global Constraints

- **D-1/D-37:** modular `src/`; pure-data/helpers in `utils/services`, components in `components/`. App.jsx is the thin shell.
- **D-3 / Pitfall #9:** every new visible string lands in BOTH `T.en` AND `T.es` in the same edit.
- **D-19:** Supabase JSON-blob schema + per-user RLS (`auth.uid() = user_id`). New columns/table reuse `user_id` (NOT a new `advisor_uid`).
- **Pitfall #12:** never use a `gid()` number as a Postgres UUID PK; the app id lives in `clients.local_id text`. The new `client_monthly_summary.client_local_id` references `clients.local_id`.
- **Pitfall #15:** never put a dotted value / JSON path inside a PostgREST `.or()`; use separate `.eq()`/`.ilike()` calls.
- **Pitfall #18:** client-side caches are uid-namespaced (`ga_cache_uid`); purge on identity change / sign-out; derive role from the auth token.
- **Pitfall #20:** Vercel Hobby caps serverless functions at 12 — at the cap now. Do NOT add an `api/*.js` endpoint; all DB work goes through `supabase-js` from the client or a Postgres RPC (no new function files).
- **Gates per task:** `npm run build` green; run-verify in the real app (test acct `test@goldenanchor.life` / `Miami2020@`); bump `__GA_BUILD__`; commit + push to main; confirm live marker.
- **Data is disposable** (owner-approved): wipe + reseed test clients freely; no backfill of existing rows required.

---

### Task 0: Synthetic seed + measurement harness

Prerequisite for every later verification ("does it hold at 50k?"). A dev-only script that inserts N synthetic client rows directly into Supabase (bypassing the UI) and a measurement snippet.

**Files:**
- Create: `scripts/seed_synthetic.mjs` (dev-only, never imported by the app; not shipped to Vercel)

**Interfaces:**
- Produces: a CLI `node scripts/seed_synthetic.mjs <userId> <count>` that inserts `<count>` rows into `clients` with realistic blobs (income/bills/cards/snapshots) + the summary columns (once Task 1 adds them) for one advisor `userId`.

- [ ] **Step 1: Write the seed script**

```js
// scripts/seed_synthetic.mjs — DEV ONLY. Seeds synthetic clients for load testing.
// Usage: node scripts/seed_synthetic.mjs <userId> <count>
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (service role = bypass RLS for seeding).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n")
  .filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const url = env.VITE_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error("Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local");process.exit(1);}
const sb = createClient(url, key);
const [,,userId,countArg] = process.argv;
const count = +countArg || 1000;
const MONTHS=["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"];
function mkClient(i){
  const localId = `synthetic_${i}_${Date.now()}`;
  const cards=[{id:i*10+1,name:"Visa",balance:1000+i%5000,apr:18+i%12,min:50,limit:8000}];
  const income=[{id:i*10+2,person:"p1",label:"Job",gross:6000,net:4500,freq:"monthly2"}];
  const bills=[{id:i*10+3,name:"Rent",assignedTo:"p1",cost:1800,type:"regular",freq:"monthly2",dueDay:1}];
  const monthSnapshots=MONTHS.map((label,mi)=>({label,savedAt:new Date().toISOString(),
    debt:1000+i%5000-mi*100, savings:200*mi, income:4500, bills:1800,
    data:{cards,income,bills}}));
  const data={id:localId, firstName:`Client${i}`, lastName:`Test${i}`, email:`c${i}@synthetic.test`,
    clientType:i%2?"financeOnly":"financeAndHealth", color1:"#C9A84C",
    incomeStreams:income, bills, cards, accounts:[], loans:[], customAssets:[], marketInvestments:[],
    notes:{}, monthSnapshots, archived:false};
  return { user_id:userId, local_id:localId, data };
}
const BATCH=500;
(async()=>{
  for(let off=0; off<count; off+=BATCH){
    const rows=Array.from({length:Math.min(BATCH,count-off)},(_,k)=>mkClient(off+k));
    const { error } = await sb.from("clients").insert(rows);
    if(error){console.error("insert error",error);process.exit(1);}
    console.log(`seeded ${off+rows.length}/${count}`);
  }
  console.log("done");
})();
```

- [ ] **Step 2: Get a real advisor userId to seed against**

Run (MCP): `mcp__supabase-finance__execute_sql` with `select id, email from auth.users limit 5;`
Expected: rows; copy the `test@goldenanchor.life` user id for `<userId>`.

- [ ] **Step 3: Dry-run seed 100, verify rows land**

Run: `node scripts/seed_synthetic.mjs <userId> 100`
Then MCP `execute_sql`: `select count(*) from clients where user_id='<userId>';`
Expected: count increased by 100.

- [ ] **Step 4: Clean the dry-run + commit the script**

MCP `execute_sql`: `delete from clients where local_id like 'synthetic_%';`
```bash
git add scripts/seed_synthetic.mjs
git commit -m "chore: synthetic client seed script for load testing (dev-only)"
```

---

### Task 1: DB migration — summary columns, monthly-summary table, indexes, RLS, dashboard RPC

**Files:**
- Create (doc-stub of the applied migration): `supabase-migrations/2026-06-24-scalable-data-layer.sql`
- Apply via: `mcp__supabase-finance__apply_migration`

**Interfaces:**
- Produces: `clients` gains columns `first_name,last_name,partner_first,email,client_type text; net_worth,total_debt,monthly_income,liquid_assets numeric; snapshot_count int; last_activity timestamptz; archived bool; search_tsv tsvector`. New table `public.client_monthly_summary`. RPC `public.ga_dashboard_summary()` returns one JSON row of totals + counts. All RLS-scoped to `auth.uid() = user_id`.

- [ ] **Step 1: Inspect current `clients` shape first**

Run (MCP): `mcp__supabase-finance__list_tables` (schema `public`).
Expected: confirm `clients` has `user_id uuid`, `local_id text`, `data jsonb`, `deleted_at`. Note exact existing column names before adding.

- [ ] **Step 2: Write the migration SQL (idempotent)**

```sql
-- supabase-migrations/2026-06-24-scalable-data-layer.sql  (idempotent; safe re-run)
-- Layer 1: summary columns on clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS first_name      text,
  ADD COLUMN IF NOT EXISTS last_name       text,
  ADD COLUMN IF NOT EXISTS partner_first   text,
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS client_type     text,
  ADD COLUMN IF NOT EXISTS net_worth       numeric,
  ADD COLUMN IF NOT EXISTS total_debt      numeric,
  ADD COLUMN IF NOT EXISTS monthly_income  numeric,
  ADD COLUMN IF NOT EXISTS liquid_assets   numeric,
  ADD COLUMN IF NOT EXISTS snapshot_count  int,
  ADD COLUMN IF NOT EXISTS last_activity   timestamptz,
  ADD COLUMN IF NOT EXISTS archived        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_tsv      tsvector;

CREATE INDEX IF NOT EXISTS clients_list_idx
  ON public.clients (user_id, archived, last_activity DESC);
CREATE INDEX IF NOT EXISTS clients_search_idx
  ON public.clients USING GIN (search_tsv);

-- Layer 2: normalized time-series
CREATE TABLE IF NOT EXISTS public.client_monthly_summary (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_local_id  text NOT NULL,           -- references clients.local_id (app id, pitfall #12)
  month_key        text NOT NULL,           -- sortable e.g. '2026-05'
  debt             numeric,
  savings          numeric,
  income           numeric,
  spending         numeric,
  net_worth        numeric,
  PRIMARY KEY (user_id, client_local_id, month_key)
);
CREATE INDEX IF NOT EXISTS cms_user_month_idx
  ON public.client_monthly_summary (user_id, month_key);

ALTER TABLE public.client_monthly_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_owner_all ON public.client_monthly_summary;
CREATE POLICY cms_owner_all ON public.client_monthly_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dashboard aggregate (computed in Postgres, tiny payload, scoped to caller)
CREATE OR REPLACE FUNCTION public.ga_dashboard_summary()
RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'client_count', count(*) FILTER (WHERE NOT archived),
    'total_debt',   coalesce(sum(total_debt)    FILTER (WHERE NOT archived),0),
    'total_income', coalesce(sum(monthly_income) FILTER (WHERE NOT archived),0),
    'liquid',       coalesce(sum(liquid_assets)  FILTER (WHERE NOT archived),0),
    'finance_only', count(*) FILTER (WHERE NOT archived AND client_type='financeOnly'),
    'finance_health', count(*) FILTER (WHERE NOT archived AND client_type='financeAndHealth')
  )
  FROM public.clients
  WHERE user_id = auth.uid() AND deleted_at IS NULL;
$$;

-- Trend aggregate over the time-series, scoped to caller
CREATE OR REPLACE FUNCTION public.ga_dashboard_trend()
RETURNS TABLE(month_key text, debt numeric, savings numeric, income numeric, spending numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT month_key, sum(debt), sum(savings), sum(income), sum(spending)
  FROM public.client_monthly_summary
  WHERE user_id = auth.uid()
  GROUP BY month_key ORDER BY month_key;
$$;
```

- [ ] **Step 3: Apply the migration**

Run (MCP): `mcp__supabase-finance__apply_migration` with name `2026-06-24-scalable-data-layer` and the SQL above. Also save the same SQL to `supabase-migrations/2026-06-24-scalable-data-layer.sql` as the doc-stub.

- [ ] **Step 4: Verify schema + RLS + RPC**

Run (MCP) `execute_sql`:
```sql
select column_name from information_schema.columns where table_name='clients' and column_name in ('net_worth','search_tsv','last_activity');
select tablename, policyname from pg_policies where tablename='client_monthly_summary';
select public.ga_dashboard_summary();   -- runs as service role here; returns json shape
```
Expected: 3 columns listed; the `cms_owner_all` policy present; RPC returns a JSON object with the 6 keys.

- [ ] **Step 5: Adversarial RLS check (the security gate)**

Run (MCP) `execute_sql` simulating two users (set `request.jwt.claim.sub`), insert one `client_monthly_summary` row per user, and confirm a `select ... where user_id=auth.uid()` returns only the caller's row. Document the result. Expected: zero cross-tenant rows.

- [ ] **Step 6: Commit the migration stub**

```bash
git add supabase-migrations/2026-06-24-scalable-data-layer.sql
git commit -m "feat(db): summary columns + client_monthly_summary + dashboard RPCs (RLS-scoped)"
```

---

### Task 2: Write path — derive summaries on every save

**Files:**
- Modify: `src/services/supabase.js` (the `gaSaveClient` function — read its current body first)
- Modify: `src/utils/finance.js` (add a pure `clientSummary(client)` deriver next to the existing totals helpers)

**Interfaces:**
- Consumes: existing finance helpers `totalA,totalL,sumN,sumB,liquidA` (already exported from `utils/finance.js`).
- Produces: `clientSummary(client) -> {first_name,last_name,partner_first,email,client_type,net_worth,total_debt,monthly_income,liquid_assets,snapshot_count,last_activity,archived}` and `monthlyRows(client) -> [{month_key,debt,savings,income,spending,net_worth}]`. `gaSaveClient(userId, client)` now also writes those.

- [ ] **Step 1: Add the pure derivers to `utils/finance.js`**

```js
// Derived summary for the clients summary columns (computed from the blob; never hand-maintained).
export const clientSummary = (c) => ({
  first_name: c.firstName || "", last_name: c.lastName || "", partner_first: c.partnerFirst || null,
  email: c.email || "", client_type: c.clientType || "financeOnly",
  net_worth: totalA(c) - totalL(c), total_debt: totalL(c),
  monthly_income: sumN(c.incomeStreams), liquid_assets: liquidA(c),
  snapshot_count: (c.monthSnapshots || []).length,
  last_activity: new Date().toISOString(), archived: !!c.archived,
});
// One row per month for client_monthly_summary. month_key sortable 'YYYY-MM'.
const MONTH_NUM = {Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
export const monthlyRows = (c) => (c.monthSnapshots || []).map(s => {
  const [mo, yr] = String(s.label || "").split(" ");
  return {
    month_key: `${yr || ""}-${MONTH_NUM[mo] || "00"}`,
    debt: +s.debt || 0, savings: +s.savings || 0, income: +s.income || 0,
    spending: (+s.bills || 0), net_worth: 0,
  };
});
```

- [ ] **Step 2: Verify the derivers compile**

Run: `npm run build`
Expected: built in <1s, no errors.

- [ ] **Step 3: Update `gaSaveClient` to write summaries**

Read the current `gaSaveClient` in `src/services/supabase.js` first. Replace its upsert so it writes `data` + the summary columns, then upserts the monthly rows. Import `clientSummary, monthlyRows` from `../utils/finance.js` at the top of `supabase.js`. Body shape:

```js
async function gaSaveClient(userId, client){
  if(!supabase || !userId) return false;
  const summary = clientSummary(client);
  const { error } = await supabase.from("clients").upsert(
    { user_id:userId, local_id:String(client.id), data:client, ...summary },
    { onConflict:"user_id,local_id" }
  );
  if(error){ console.error("[GA] save client error", error); return false; }
  // search_tsv is set by trigger OR set here:
  await supabase.from("clients").update({ search_tsv: null }).eq("user_id",userId).eq("local_id",String(client.id)); // placeholder — see Step 4
  const rows = monthlyRows(client).map(r => ({ user_id:userId, client_local_id:String(client.id), ...r }));
  if(rows.length){ await supabase.from("client_monthly_summary").upsert(rows, { onConflict:"user_id,client_local_id,month_key" }); }
  return true;
}
```

> NOTE: confirm the existing `onConflict` key matches the real unique constraint on `clients` (check Task 1 Step 1 output). If `clients` has no `(user_id,local_id)` unique index, add `CREATE UNIQUE INDEX IF NOT EXISTS clients_user_local_ux ON public.clients(user_id,local_id);` to the migration and re-apply.

- [ ] **Step 4: Set `search_tsv` server-side via trigger (cleaner than the client write)**

Add to the migration (apply via MCP) and remove the placeholder update line from Step 3:
```sql
CREATE OR REPLACE FUNCTION public.clients_tsv() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.search_tsv := to_tsvector('simple', coalesce(NEW.first_name,'')||' '||coalesce(NEW.last_name,'')||' '||coalesce(NEW.partner_first,'')||' '||coalesce(NEW.email,'')); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS clients_tsv_trg ON public.clients;
CREATE TRIGGER clients_tsv_trg BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.clients_tsv();
```

- [ ] **Step 5: Verify a real save populates everything**

`npm run build`; run the app; log in; open a client; edit a field; Save. Then MCP `execute_sql`:
```sql
select first_name,total_debt,monthly_income,snapshot_count,search_tsv is not null as has_tsv from clients where user_id='<userId>' and local_id='<that client local_id>';
select count(*) from client_monthly_summary where user_id='<userId>';
```
Expected: summary columns populated; tsv present; monthly rows inserted.

- [ ] **Step 6: Bump marker + commit**

Bump `__GA_BUILD__` to `…-v0810-save-derives-summaries`. `npm run build`.
```bash
git add src/services/supabase.js src/utils/finance.js supabase-migrations/2026-06-24-scalable-data-layer.sql src/App.jsx
git commit -m "feat(data): gaSaveClient derives summary columns + monthly-summary rows"
```

---

### Task 3: Paginated, virtualized client list

**Files:**
- Modify: `src/services/supabase.js` (add `gaListClients`)
- Modify: `src/components/clientList.jsx` (consume server page; virtualize)
- Modify: `src/App.jsx` (pass list data + handlers instead of the full `clients` array — minimal, see Task 5 for full state move)

**Interfaces:**
- Produces: `gaListClients(userId, { page=0, pageSize=50, sort="name", search="", archived=false }) -> { rows:[{local_id,first_name,last_name,partner_first,email,net_worth,total_debt,monthly_income,snapshot_count,archived}], total:int }`. `rows` carry NO blob.

- [ ] **Step 1: Add `gaListClients`**

```js
async function gaListClients(userId, { page=0, pageSize=50, sort="name", search="", archived=false } = {}){
  if(!supabase || !userId) return { rows:[], total:0 };
  let q = supabase.from("clients")
    .select("local_id,first_name,last_name,partner_first,email,net_worth,total_debt,monthly_income,liquid_assets,snapshot_count,archived", { count:"exact" })
    .eq("user_id", userId).is("deleted_at", null).eq("archived", archived);
  if(search){ const s = search.replace(/[%,]/g,""); q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`); } // simple ilike; no dotted values (pitfall #15)
  const order = sort==="debt" ? ["total_debt",{ascending:false}] : sort==="income" ? ["monthly_income",{ascending:false}] : sort==="recent" ? ["last_activity",{ascending:false}] : ["last_name",{ascending:true}];
  q = q.order(order[0], order[1]).range(page*pageSize, page*pageSize+pageSize-1);
  const { data, error, count } = await q;
  if(error){ console.error("[GA] list clients error", error); return { rows:[], total:0 }; }
  return { rows:data||[], total:count||0 };
}
```
Export it in the `export { … }` list at the bottom of `supabase.js`.

- [ ] **Step 2: Verify list query is cheap at scale**

Seed: `node scripts/seed_synthetic.mjs <userId> 20000`. Then MCP `execute_sql`:
`explain analyze select local_id,first_name,total_debt from clients where user_id='<userId>' and archived=false order by last_name limit 50;`
Expected: uses `clients_list_idx`; execution time single-digit ms; NOT a seq scan of 20k rows.

- [ ] **Step 3: Make `ClientList` consume a page + virtualize**

Read `src/components/clientList.jsx`. Change it to accept `rows`, `total`, `page`, `onPage`, `search`, `onSearch`, `sort`, `onSort` props (server-driven) instead of the full `clients` array + client-side filter/sort. Render only the current page's rows. For >50 visible, window with a scroll container (CSS `overflow:auto; max-height` + render the page; pageSize 50 keeps DOM small — no react-window dependency needed at pageSize 50). Add a pager (Prev/Next + "X–Y of total"). Keep the existing card markup per row. Move the join/split pickers (which need the full list) to a dedicated `gaListClients` call with a large pageSize or a search box (they are rare actions).

- [ ] **Step 4: Wire App.jsx to load a page (interim)**

In `App.jsx`, add state `clientsPage`, `listTotal`, `listPage`, `listSearch`, `listSort`; a `useEffect` that calls `gaListClients(authUser.id, {page,search,sort})` when those change; pass to `ClientList`. Keep the existing full-load path alive for ClientDetail/Dashboard until Tasks 4–5 (they still read `clients`). Opening a row → `gaLoadClient` (Task 5) OR temporarily find in the still-loaded array.

- [ ] **Step 5: Verify the list is instant at 20k**

`npm run build`; run app; open Clients. Measure first-paint + search latency (preview_eval timing). Expected: list paints instantly; typing in search returns a page in well under a second; DOM node count ~50 rows, not 20k.

- [ ] **Step 6: Bump marker + commit**

```bash
git add src/services/supabase.js src/components/clientList.jsx src/App.jsx
git commit -m "feat(list): server-paginated + searched + virtualized client list"
```

---

### Task 4: Server-side dashboard aggregates

**Files:**
- Modify: `src/services/supabase.js` (add `gaDashboardSummary`, `gaDashboardTrend`)
- Modify: `src/components/dashboard.jsx` (consume the RPCs instead of `clients.reduce/flatMap`)

**Interfaces:**
- Produces: `gaDashboardSummary(userId) -> {client_count,total_debt,total_income,liquid,finance_only,finance_health}`; `gaDashboardTrend(userId) -> [{month_key,debt,savings,income,spending}]`.

- [ ] **Step 1: Add the RPC wrappers**

```js
async function gaDashboardSummary(){ if(!supabase) return null; const { data, error } = await supabase.rpc("ga_dashboard_summary"); if(error){console.error("[GA] dash summary",error);return null;} return data; }
async function gaDashboardTrend(){ if(!supabase) return []; const { data, error } = await supabase.rpc("ga_dashboard_trend"); if(error){console.error("[GA] dash trend",error);return [];} return data||[]; }
```
Export both.

- [ ] **Step 2: Consume in `dashboard.jsx`**

Read `src/components/dashboard.jsx`. Replace the KPI computations (`active.reduce(...)`, counts) with values from `gaDashboardSummary`, and the trend `clients.reduce` inside `.map` with `gaDashboardTrend` rows mapped to the chart shape. Fetch both in a `useEffect` on mount. Keep the search box (it can filter the visible list once the dashboard's "recent clients" strip uses `gaListClients`, or drop the strip's full-iteration).

- [ ] **Step 3: Verify aggregates match + payload is tiny**

With 20k seeded: MCP `select public.ga_dashboard_summary();` vs the dashboard KPIs in the live app. Expected: numbers match; the RPC response is a few hundred bytes; dashboard loads instantly (no 20k-row client-side reduce).

- [ ] **Step 4: Bump marker + commit**

```bash
git add src/services/supabase.js src/components/dashboard.jsx src/App.jsx
git commit -m "feat(dashboard): server-side aggregates via RPC (constant payload at scale)"
```

---

### Task 5: App-state refactor — stop loading everything; drop the localStorage full-cache

**Files:**
- Modify: `src/App.jsx` (the `clients` state + load effect + save effect + localStorage)
- Modify: `src/services/supabase.js` (add `gaLoadClient(userId, localId)`)

**Interfaces:**
- Produces: `gaLoadClient(userId, localId) -> client | null` (one full blob). App holds `clientsPage` + `openClient`, not all clients.

- [ ] **Step 1: Add `gaLoadClient`**

```js
async function gaLoadClient(userId, localId){ if(!supabase||!userId) return null; const { data, error } = await supabase.from("clients").select("data").eq("user_id",userId).eq("local_id",String(localId)).is("deleted_at",null).maybeSingle(); if(error){console.error("[GA] load client",error);return null;} return data ? data.data : null; }
```
Export it.

- [ ] **Step 2: Replace the load-everything path in App.jsx**

Read App.jsx around the `gaLoadClients` effect (the `const remote = await gaLoadClients(authUser.id)` block) and `const [clients,setClients]=useState(...)`. Remove the full `gaLoadClients` call and the `ga_v3` localStorage seed. Replace with: load page 1 via `gaListClients` for the list; `openClient` loaded via `gaLoadClient` when a row is opened; `ClientDetail` renders `openClient`. On save: `gaSaveClient` then refetch the current page + invalidate dashboard RPC (re-call on next dashboard view). Keep `mig()` applied to a loaded single client.

- [ ] **Step 3: Remove the localStorage full-cache; uid-namespace what remains**

Delete the `localStorage.getItem("ga_v3")` seed and the save-to-`ga_v3` effect. If caching the current page for snappiness, store under `ga_page_<uid>` and purge on identity change / sign-out (pitfall #18). Confirm `gaClearLocalCache` still clears these.

- [ ] **Step 4: Verify the full flow + memory at 50k**

Seed 50k: `node scripts/seed_synthetic.mjs <userId> 50000`. Run app: login → Dashboard (RPC, instant) → Clients (page 1, instant) → search → open a client (single blob loads) → edit → save → reopen (change persisted) → archive → list reflects it. Measure JS heap (preview_eval `performance.memory`) — expected flat (~tens of MB), NOT proportional to 50k. No `ga_v3` in localStorage.

- [ ] **Step 5: Adversarial role re-proof (security gate)**

Re-run the logic-skill §6 matrix on the new paths: advisor sees only own list/detail/dashboard; a second advisor account sees zero of the first's rows via `gaListClients`/`gaLoadClient`/the RPCs; a `client`-role account is unaffected. Document results.

- [ ] **Step 6: Final clean reseed + bump marker + commit**

MCP `delete from clients where local_id like 'synthetic_%'; delete from client_monthly_summary where client_local_id like 'synthetic_%';` then reseed the small demo set through the UI/save path. Bump `__GA_BUILD__` to `…-v0811-paginated-data-layer`. `npm run build`.
```bash
git add src/App.jsx src/services/supabase.js
git commit -m "feat(scale): paginated load-on-demand app state; drop localStorage full-cache"
```

---

## Self-Review

- **Spec coverage:** §3 data model → Task 1; §4 write path → Task 2, read paths → Tasks 3/4/5; §5 RLS → Task 1 Step 5 + Task 5 Step 5; §6 app-state → Task 5; §7 rollout → Tasks 1–5 in order; §8 verification (synthetic 10–50k) → Task 0 + the verify steps in Tasks 3/4/5. Covered.
- **Pitfalls:** #12 (local_id not uuid) Task 1/2; #15 (no dotted `.or()`) Task 3 Step 1; #18 (uid-namespaced cache) Task 5 Step 3; #20 (no new api/ file — RPC + client only) Global + Tasks 1/4. Covered.
- **Type consistency:** `clientSummary`/`monthlyRows` (Task 2) consumed by `gaSaveClient` (Task 2); `gaListClients` rows shape (Task 3) consumed by `clientList.jsx`; `gaLoadClient` (Task 5) returns the blob `ClientDetail` expects. Consistent.
- **Open confirmations flagged inline:** the `clients` unique constraint for `onConflict` (Task 2 Step 3 NOTE) must be verified against Task 1 Step 1 output before relying on upsert.
