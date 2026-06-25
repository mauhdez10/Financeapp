# Task brief — App-state persistence rework (advisor: summary rows + lazy blobs)

## Goal
Make the **advisor** path stop loading every client's full JSONB blob into memory. Instead `App()`
holds lightweight SUMMARY rows; the full blob loads only when a client is opened. This is the final
step of the Golden Anchor 50k-client scalability work. **The client-role path (single self-client)
stays UNCHANGED.**

## Context you need
- `src/App.jsx` (~830 lines) — the whole app; `App()` holds `const[clients,setClients]`. Advisor vs
  client role: `(authUser?.user_metadata?.role)==="client"`.
- Service functions already exist in `src/services/supabase.js` (import what you need):
  - `gaLoadClientSummaries(userId)` → array of display-ready rows: `{id, firstName, lastName,
    partnerFirst, email, clientType, net_worth, total_debt, monthly_income, liquid_assets,
    snapshot_count, last_activity, archived, color1, _summary:true}`. NO blob fields.
  - `gaLoadClient(userId, localId)` → the one full blob (or null).
  - `gaSaveClient(userId, blobClient)` → persists blob + derives summary cols (returns bool).
  - `gaSetArchived(userId, localId, bool)` → archive toggle (updates col + blob.archived).
  - `gaDeleteClient(userId, localId)` → soft-delete.
- Read `docs/superpowers/plans/2026-06-24-task5-app-state-breakdown.md` for the consumer map.

## Hard rules
- D-1 single file (`App.jsx`); D-3 EN+ES for any NEW visible string (you should need none); #17 no nested
  component defs. `npm run build` MUST pass (vite). You CANNOT run the dev server — deliver build-green;
  the controller verifies runtime round-trips.
- Touch only: `src/App.jsx`, `src/components/clientList.jsx`, `src/components/dashboard.jsx` (roster only).
  Do NOT touch `supabase.js` (functions exist) or the client-role code paths.

## The change (advisor only)

**1. Load effect (App.jsx ~line 294 `// On login: ... load clients`):** for advisor
(`role!=="client"`) call `gaLoadClientSummaries(authUser.id)` instead of `gaLoadClients`. Set the result
as `clients`. Seed `_lastClientsRef.current` to the same so the save effect sees no diff. KEEP the
client-role branch exactly as-is (it loads the single self via the existing path). Keep the
foreign-cache purge + `gaMigrateLocalStorage` for advisors.

**2. Save effect (App.jsx ~line 340 `// Persist clients to Supabase only`):** this effect diffs the
`clients` array and `gaSaveClient`s changed entries. With summaries in `clients` this is WRONG for
advisors (summaries aren't blobs). GUARD it: run the diff-save body ONLY when
`(authUser?.user_metadata?.role)==="client"`. For advisors it must do nothing (advisor persistence is
explicit, below). Keep the localStorage-removed behavior.

**3. Open a client = load its blob.** `selected` must hold a full blob. Everywhere a client is opened
from a summary row, load the blob first:
- `onSelect` handlers (ClientList `onSelect={c=>...}`, Dashboard roster, the `/clients/:id` routing
  effect that does `clients.find(...)`): replace "use the row directly / find in array" with
  `const blob = await gaLoadClient(authUser.id, row.id); setSelected(blob);`. Add a brief loading guard
  if needed (e.g. set a `loadingClient` flag) so the UI doesn't flash. For the routing-by-URL effect,
  load the blob by the URL's local_id.
- The client-role open (`clients[0]`) stays as-is (already a blob).

**4. Persistence helpers (rework these advisor mutation callbacks in App.jsx ~lines 641-649):**
- `upClient(blob)` (save edits): `await gaSaveClient(authUser.id, blob); setSelected(blob);` then refresh
  the summaries: `const s=await gaLoadClientSummaries(authUser.id); if(s)setClients(s);` (keep
  `_lastClientsRef.current=s`). Toast as before.
- `addClient(newBlob)`: `await gaSaveClient(authUser.id, mig(newBlob)); setSelected(mig(newBlob));`
  refresh summaries; nav to the client.
- `archiveClient(id)` / `restoreClient(id)`: `await gaSetArchived(authUser.id, id, true/false);` refresh
  summaries.
- `deleteClient(id)`: `await gaDeleteClient(authUser.id, id); setSelected(null);` refresh summaries.
- `splitClient(p1,p2)` (operates on the OPEN `selected` blob — already a blob): `await
  gaSaveClient(authUser.id, p1); await gaSaveClient(authUser.id, p2); await
  gaDeleteClient(authUser.id, selected.id); setSelected(null);` refresh summaries; nav to clients.
- `joinClients(targetRow, partnerRow)`: both are SUMMARY rows. Load both blobs first: `const a=await
  gaLoadClient(authUser.id, targetRow.id); const b=await gaLoadClient(authUser.id, partnerRow.id);` then
  perform the existing merge on `a`+`b` to produce the merged blob, `gaSaveClient` the merged, `gaDeleteClient`
  the other, refresh summaries. (Preserve whatever merge logic exists; just feed it blobs.)
- Bulk archive/restore/delete (`archiveMany`/`restoreMany`/`deleteMany`): loop the ids calling
  `gaSetArchived`/`gaDeleteClient`, then refresh summaries once.
- For client-role, leave all these as the existing setClients-based versions (guarded by role) OR keep a
  single code path that works for both — your call, but client-role must keep working (it has 1 blob in
  `clients`; for client-role `upClient` can stay setClients-based since its save effect still runs).

**5. ClientList (`clientList.jsx`):** it currently calls `totalL(c)`, `sumN(c.incomeStreams)`,
`totalA(c)`, `(c.monthSnapshots||[]).length` for sort/display. Replace with summary fields:
- debt → `c.total_debt`; income → `c.monthly_income`; net worth → `c.net_worth`; snapshots →
  `c.snapshot_count`; recent-sort → `c.last_activity` (compare as dates). Avatar uses `c.color1`
  (present). Remove the now-unused `totalA/totalL/sumN` imports if they become unused.
- Split/Join pickers (`partnered`/`singles`) filter by `c.partnerFirst` and search name/email — all
  present on summary rows; keep as-is. `JoinModal allClients={clients}` — pass the summary rows; the
  controller's `joinClients` loads blobs.

**6. Dashboard roster (`dashboard.jsx` ~line 516, the `active.slice(0,rosterShown).map`):** same field
swap — `c.total_debt`/`c.monthly_income`/`c.net_worth`/`c.color1`/`c.snapshot_count`. The "improving"
pill currently reads `c.monthSnapshots` (absent on summaries) — drop that pill (or hide it) since it
can't be derived from a summary. `active` stays `clients.filter(c=>!c.archived)`.

**7. Import/Export/Backup modals** (Dashboard + ClientList): `existingClients={clients}` for dup-check
uses names/emails — fine with summaries. `ExportModal clients={clients}` / `expBackup(clients)` need full
blobs — leave these as-is for now (they'll export summary rows; the controller will follow up). Just add
a `/* TODO scale: export-all needs to page blobs via gaLoadClient */` comment where `expBackup(clients)`
and `<ExportModal clients={clients}>` are used. Do NOT try to rewrite export in this task.

## Deliverable
Edit the 3 files. `npm run build` until green. Write `docs/superpowers/persistence-rework-report.md`:
what changed per file, anything you were unsure about (esp. join merge + the routing-by-URL open), and
any consumer you couldn't cleanly convert. Return a 4-line summary + the report path. Do NOT commit, do
NOT run a dev server.
