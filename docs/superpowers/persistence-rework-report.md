# Persistence-rework report — advisor summary rows + lazy blobs

Status: **build-green** (`npm run build` passes, ~1.6s). Not committed. No dev server run.
Scope honored: edited only `src/App.jsx`, `src/components/clientList.jsx`,
`src/components/dashboard.jsx`. `supabase.js` untouched. Client-role path preserved.

> NOTE on line numbers: the brief's line refs (294/340/641-649, dashboard ~516)
> predate the Phase-2 component extraction. The worktree's `App.jsx` is ~860 lines
> with `Dashboard`/`ClientList` already in `src/components/`, and dashboard charts
> already render from server RPCs (`dashData`/`gaDashboardAll`) — only the bottom
> roster + reminders still touched blobs. I worked from the actual current code.

## src/App.jsx

- **Imports**: added `gaLoadClientSummaries, gaLoadClient, gaSetArchived` to the
  `./services/supabase` import.
- **New state**: `loadingClient` (open-blob guard, prevents flash on advisor open).
- **Load effect** (`// On login: …`): split by role. **Client role** keeps the exact
  existing `gaLoadClients`→`mig`→`setClients([self])` path (single self-blob). **Advisor**
  now calls `gaLoadClientSummaries(authUser.id)`, sets the rows as `clients`, and seeds
  `_lastClientsRef.current` to the same so the (now client-guarded) save effect sees no diff.
  Foreign-cache purge + `gaMigrateLocalStorage` kept for both.
- **Save effect** (array-diff persist): added `if((authUser?.user_metadata?.role)!=="client")return;`
  so it runs ONLY for the client role. Advisor persistence is now explicit (mutation callbacks).
- **`openClient(row,tab)`** helper (new): for advisor summary rows it `gaLoadClient`s the blob
  (with `loadingClient` guard) before `setSelected`; client-role rows / non-summary rows are set
  directly. Wired to ClientList `onSelect` and Dashboard `onSelect`.
- **`refreshSummaries()`** helper (new): re-fetches `gaLoadClientSummaries`, updates `clients`
  AND `_lastClientsRef.current`. Called after every advisor mutation.
- **Mutation callbacks reworked** (advisor branch calls services directly + `refreshSummaries`;
  client branch keeps the old `setClients` path, guarded by `_isAdvisor()` read at call time):
  - `upClient` → `gaSaveClient` + `setSelected(blob)` + refresh.
  - `addClient` → `gaSaveClient(mig)` + `setSelected` + refresh + nav.
  - `importMultiple` → loop `gaSaveClient` + refresh.
  - `archiveClient`/`restoreClient` → `gaSetArchived(id,true/false)` + refresh. (archiveClient
    looks up the current row's `archived` in `_lastClientsRef.current` to preserve its toggle
    semantics — the in-detail kebab calls it as a toggle.)
  - `deleteClient` → `gaDeleteClient` + `setSelected(null)` + refresh.
  - `splitClient(p1,p2)` (operates on open `selected` blob) → save p1, save p2, delete
    `selected.id`, `setSelected(null)`, refresh, nav.
  - `joinClients(c1,c2)` → **loads both blobs** via `gaLoadClient`, runs the existing merge
    (extracted to `_mergeJoin`), saves the merged blob, deletes c2, `setSelected(joined)`, refresh.
  - bulk `archiveMany`/`restoreMany`/`deleteMany` → loop `gaSetArchived`/`gaDeleteClient`, refresh once.
  - `splitClientPair(origId,p1,p2)` (ClientList picker; p1/p2 are full blobs) → save both, delete
    origId, refresh.
  - `restoreBackup` → advisor branch dedupes against summary rows; on a merge hit it `gaLoadClient`s
    the existing blob, `smartMerge`s, and `gaSaveClient`s; replace mode deletes existing then saves all.
- **Routing-by-URL opens** (3 sites: the hydration effect, and both branches of the popstate
  handler): where they did `clients.find(...)`→`setSelected(row)`, advisor summary rows now
  `gaLoadClient(authUser.id, row.id).then(b=>setSelected(mig(b)))`. Client-role rows set directly.
- **TODO comment** added at `<BackupPage clients={clients}/>` (export-all needs to page blobs).
- ClientList now receives `loadClientBlob` (advisor-only `id=>gaLoadClient(authUser.id,id)`) for
  the split picker (see below).

## src/components/clientList.jsx

- Dropped `sumN,totalA,totalL` from the finance import (now unused); kept `fmt`.
- `_sortFn` swapped to summary fields: debt→`c.total_debt`, income→`c.monthly_income`,
  netWorth→`c.net_worth`, recent→`c.last_activity` (Date compare).
- Row display swapped: `(c.monthSnapshots||[]).length`→`c.snapshot_count`,
  `fmt(sumN(c.incomeStreams))`→`fmt(c.monthly_income)` (desktop subtitle + income span +
  mobile footer). Avatar already used `c.color1` (present on summary rows).
- Split/Join pickers (`partnered`/`singles`) + `JoinModal allClients={clients}` left as-is
  (they filter/display name/email/`partnerFirst`/`color1` — all on summary rows).
- **Split picker blob load**: `SplitAssignModal` reads `client.incomeStreams/cards/accounts/...`,
  so it needs the FULL blob. The picked partnered row is a summary, so the picker's onClick now
  `await loadClientBlob(c.id)` and sets that blob as `splitTarget` (falls back to the row if the
  load returns null or no loader is provided — i.e. client role, which never reaches this page).

## src/components/dashboard.jsx

- Dropped `sumN,totalA,totalL` from the finance import (now unused; `Pill` kept — still used
  by RemindersPanel).
- **Roster** (`active.slice(0,rosterShown).map`): swapped to `c.monthly_income`/`c.total_debt`/
  `c.net_worth`/`c.snapshot_count`/`c.color1`. **Dropped the "improving" pill** (it read
  `c.monthSnapshots`, absent on summaries). `active = clients.filter(c=>!c.archived)` unchanged.
- **RemindersPanel guard** (one-line safety, see "unsure" below): `getAdvRem`/`getClientRem`
  now receive `clients.filter(c=>!c._summary)` so advisor summary rows don't generate phantom
  reminders (esp. `noContact` "999d"). Client-role blobs pass through unchanged.

## Things I was unsure about / flagged

1. **Join merge logic** — preserved verbatim. I only extracted the existing inline merge into a
   `_mergeJoin(c1,c2)` helper and fed it freshly-loaded blobs (`mig(a)`, `mig(b)`) instead of
   in-memory rows. Behavior is identical to before for full blobs. Added an error toast if either
   blob fails to load (previously impossible since both were in-memory). Worth a runtime check that
   a join still produces the correct partner split and deletes the right record (c2).

2. **Routing-by-URL open** — the advisor blob load inside the hydration/popstate effects is async
   (`.then(setSelected)`), so there's a brief moment where `selected` is null before the blob lands
   on a deep-link/refresh/Back. `openClient` uses `loadingClient` to cover the click path, but the
   URL-effect path has no spinner (it just resolves a tick later). I judged this acceptable (matches
   the existing "defer until clients load" pattern) but it's the place most likely to need a polish
   pass. `_isAdvisor`/`refreshSummaries` are referenced inside effects defined earlier in source than
   their `const`s — safe because effect callbacks run after the full render pass (post-TDZ), but I
   left them out of the dep arrays (consistent with the file's existing effects).

3. **RemindersPanel** — I could not cleanly convert it (out of "roster only" scope, and it needs
   blobs: bills/cards/snapshots/income). Rather than ship a wall of false "no contact" alerts I
   filtered summary rows out of its inputs, so for advisors the panel now shows **no** reminders
   until it's driven from a server RPC (TODO left in code). This is a functional regression for the
   advisor reminders feature that the controller should be aware of and follow up on.

4. **Export / Backup** — left as-is per brief (will export/operate on summary rows, not blobs).
   TODO comment added at the `BackupPage` usage. `ExportModal clients={clients}` (Dashboard +
   ClientList) and `expBackup(clients)` (ClientList kebab) were NOT rewritten — they will currently
   export summary rows for advisors. Flagged for the controller's follow-up task.

5. **`importMultiple` / `addClient` are now async** (fire-and-forget at their call sites, same as
   before). Intake "convert to client" (`onConvert={c=>addClient(c)}`) and import flows don't await;
   the summary refresh happens inside the callback. Fine, but the list won't show the new client
   until the refresh resolves (one extra round-trip vs. the old optimistic local insert).
