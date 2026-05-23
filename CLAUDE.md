# CLAUDE.md — Golden Anchor Finance App

> Auto-loaded by Claude Code on every session in this folder. Read this FIRST.
> Pair with `claude-mem` plugin (installed) — between the two, you should not
> need to re-upload AGENT/SKILL/WORKPLAN files at the start of new sessions.

---

## 🗓 Session handoff — last update 2026-05-23

### Currently shipped (live on Vercel)

**v0.36.0** — `2026-05-23-v0360-doc-hygiene`

Verify the live build is current:
```bash
curl -s "https://finance.goldenanchor.life/" | grep -oE 'index-[A-Za-z0-9_-]+\.js'
curl -s "https://finance.goldenanchor.life/assets/<that-hash>.js" | grep -oE 'v[0-9]{3,4}-[a-z0-9-]+' | sort -u
```

### Recent versions (newest first)

| Version | What shipped |
|---|---|
| **v0.36.0** | Doc hygiene + dead-code pass. Deduped 3 silent-overwrite translations (`totalLbl` / `partnerEmailLbl` / `close`). Added 11 missing EN+ES keys. Backfilled WHATS_NEW_ENTRIES for v0.29-v0.35. Deleted IntakeFormV2 (~64 lines dead code from the v0.31 restore). Refreshed AGENT.md §3 + this handoff. No behavior changes. |
| **v0.35.1** | Hotfix: `fmtSSN` was a local const inside `SSNInput`, throwing `ReferenceError` on every keystroke into the prospect SSN field on public intake. Hoisted to module scope alongside `fmtPh`. |
| **v0.35.0** | Phase 5 + 6. New pure-SVG `Donut` (replaces Recharts PieChart on Dashboard's Net Worth Distribution) + `Waterfall` component (built, not yet wired). `.ga-print-page` wrappers around the 6 FullMonthView sections — each prints on its own page. |
| **v0.34.0** | Phase 5 first chart. New pure-SVG `SmoothAreaLine` (Catmull-Rom-to-Bezier, gold area gradient, JetBrains Mono Y-ticks, crossover dot marker). Replaces 3 Recharts AreaCharts on ClientDetail's "● live" trend pair + SummarySection. |
| **v0.33.0** | Public intake unified on the gold palette regardless of light/dark mode. `synthTheme.accent` / `.blue` hard-pinned to `GOLD`. |
| **v0.32.0** | Couple invites end-to-end — partner fields in New Invite modal, ferry through `send-intake-invite.js` + `resolve-intake-invite.js`, populate `draft.partnerFirst` etc. on the prospect side. Removed duplicate FL Lic + redundant disclaimer from engagement-copy email. Required Supabase migration `2026-05-23-invite-partner.sql`. |
| **v0.31.0** | Intake hardening pass — typed-only signature with inline cursive display, Pay Now always clickable, Done modal cleanup ("you can close this tab"), browser back walks stages, post-submit engagement-copy email (`api/send-engagement-copy.js`), Tab 4 restored to advisor-style IntakeFormBody. Required Supabase migration `2026-05-22-engagement-emailed.sql`. |
| **v0.30.0** | Public intake redesign — 5-stage flow (Welcome → Service → Engagement → Your information → Done modal). |
| v0.29.1 | Hotfix: SignaturePad auto-commits prefilled `defaultName` on mount. |
| v0.29.0 | Intake Forms admin rebuild + New Invite modal (Phase 1+2+3 of Claude Design workplan). Required Supabase migration `2026-05-22-intake-status.sql`. |
| v0.28.0 | Per-row ✕ dismiss on advisor + client-due alerts. Month-keyed dismissals so "paid the credit card" auto-recycles next billing cycle. |
| v0.27.0 | Bootstrap shimmer skeleton, KPI count-up tween, pulse on critical alert pills, aria-label on placeholder-only search inputs. |

### Pending work (priority order)

**Phase 5 charts library — remaining (Claude Design workplan):**

1. **Wire `Waterfall`** (built v0.35.0, not yet integrated). Drop into Cash Flow Statement or Monthly Snapshot to replace the table-driven layout.
2. **Remaining chart components** — `KPITileRow`, `RankedHBars`, `GoalProgressList`, `RadialProgress3`, `HeatmapMonth`, `SparklineRow`, `Radar5`, `Candlestick`, `CircularBar`, `PackedBubble`, `TimelinePins`, `RadialHistogram`, `PairedBars`, `StackedBars`, `GroupedYoY`, `NetWorthAgePyramid`, `Pie`, `PyramidChart`, `PictorialFraction`, `ProcessCycle`, `SplineChart`, `StackedArea`. ~22 components left. Build incrementally.

**Phase 6 PDF print — remaining:**

3. **Emoji-strip refactor** (deferred from v0.35.0). Wrap ~200 leading emojis in report headers with `<span class="ga-emoji">…</span>` so the existing `@media print { .ga-emoji { display:none } }` rule actually fires. Will give cleaner emoji-free PDF exports.
4. **Three-up KPI strip on Monthly Snapshot print view** (per Phase 6 spec). Net Income / Bills / Discretionary tiles at the top of each Monthly Snapshot PDF page.

**Open bugs (low-confidence — needs Mauricio reproduction):**

- **Hide-numbers ON by default on first login** — likely data, not code (the test account's `settings.hideNumbers` is `true` in Supabase). One toggle fixes it for the account.

### Infrastructure ready in this folder

- **`CLAUDE.md`** (this file) — auto-loaded by Claude Code
- **`.env.local`** — Supabase URL + anon key set; dev server can log in. NEVER edit/commit this file. `.env.local.example` is the template that ships in repo.
- **`AGENT.md`** — full decision log + locked decisions (D-1 to D-36) + pitfalls (#1-#17). Read on demand. `SKILL.md` is the design-system manifest (Claude.ai/design only). `WORKPLAN-archive-2026-05.md` is preserved historical only.
- **Two-folder workflow**: edit in `golden-anchor/` (working copy, has design system extras), then copy + push from `financeapp-deploy/` (real git clone).
- **Plugins installed**: `claude-mem`, `vercel`, `playwright`, `ui-ux-pro-max`, `github`, `gitlab`. The vercel + playwright MCPs may need a Claude Code restart to load. Once active, USE them to verify deploys + run e2e tests instead of manual.

### Communication shortcuts (per WORKPLAN §1)

- **Direct, no compliments, no "Great question!"**
- Treat as finance professional. Don't over-explain.
- Default English. Spanish only if Mauricio writes Spanish first.
- Numbered shorthand answers are valid (e.g. "1. yes 2. a 3. skip").
- NEVER date-suffix or version-suffix files. One canonical name per file.
- **Always `git pull origin main` before editing** (parallel chats push too).
- **Always `npm run build` after edits.**
- **Always verify with the build marker**, not the docs — docs sometimes lag the code.

### First moves in a new session

1. `cd C:\Users\mauhd\financeapp-deploy && git pull origin main && git log --oneline -5`
2. Open `C:\Users\mauhd\golden-anchor\CLAUDE.md` (this file)
3. Confirm current build marker: `grep -o '__GA_BUILD__="[^"]*"' src/App.jsx`
4. Ask Mauricio: which pending item to tackle, or wait for new bugs from his testing.

---

## What this is

**Golden Anchor Finance** — a single-file React/Vite SPA + Vercel Serverless Functions + Supabase, deployed at **https://finance.goldenanchor.life**.

Owner: Mauricio Hernandez (MBA, FPWMP), Miami, FL. Bilingual (EN/ES) financial-coaching + insurance-advisory product. **Not** investment management — educational coaching only.

GitHub repo: **https://github.com/mauhdez10/Financeapp** (`main` branch only).

---

## Source-of-truth files (read these on demand, don't load all at once)

| File | What it has | When to read |
|---|---|---|
| `src/App.jsx` (~4,300 lines) | The whole app — every screen, every component | When making code edits — but `Grep` first to find the right line range |
| `src/translations.js` (~1,300 keys × EN/ES) | UI strings | When adding/changing any visible text |
| `src/engagementLetterTemplate.js` | Engagement letter body + token substitutions | Only when the engagement letter itself changes |
| `api/*.js` | 5 Vercel serverless functions (intake invites, support email, PDF render, etc.) | When server-side work is needed |
| `AGENT.md` | **Project architectural truth** — locked decisions (D-1 through D-36), pitfalls (#1 through #17), current version, smoke tests | Read §1 + §3 + §4 + §7 on first session; otherwise grep for specific D-NN or pitfall numbers |
| `SKILL.md` | **Design-system skill** (`golden-anchor-design`) — brand colors, type, asset paths, UI-kit references. Used by Claude.ai/design when generating brand-correct mocks. Not an editing procedure. | Only when working on brand/visual design artifacts — not for code edits |
| `WORKPLAN-archive-2026-05.md` | **Archived.** Old chat-upload workflow notes from the claude.ai-with-uploads era. No longer current — superseded by this `CLAUDE.md`. | Don't read for procedure — kept for history only |
| `CHANGELOG.md` | Per-version release notes — newest on top | Skim the top 1-2 entries to know what just shipped |
| `package.json` | Deps + scripts | Rarely |
| `vercel.json` | SPA rewrite + per-function memory/timeout config | When touching `api/` or routing |

**`ui_kits/`, `preview/`, `HANDOFF.md`, `SKILL.md` (the design-system one at root)** — these are **design-system reference docs from claude.ai/design**, NOT app code. Don't load unless explicitly working on brand/visual port.

---

## Current version state

Find it fast: `grep -o '__GA_BUILD__="[^"]*"' src/App.jsx`. As of this writing the live build marker is `v0230-header-dedup-clientdue-search-tos-gate-portal-welcome` (2026-05-22). AGENT.md §3 may lag — trust the build marker.

**Versioning:** patch for behavior change with no structural change; minor for new surface/component; major TBD at v1.0.

---

## The working-copy / deploy-clone split

Mauricio works in **`C:\Users\mauhd\golden-anchor`** — this is NOT a git repo, it's a local working copy with extras (`ui_kits/`, `preview/`, `HANDOFF.md`, etc.) that don't belong in production.

I push from **`C:\Users\mauhd\financeapp-deploy`** — a real `git clone` of `mauhdez10/Financeapp`. After making edits in `golden-anchor/`:

```bash
cp /c/Users/mauhd/golden-anchor/src/App.jsx /c/Users/mauhd/financeapp-deploy/src/App.jsx
# any other changed files...
cd /c/Users/mauhd/financeapp-deploy
git pull origin main  # ALWAYS pull first — Mauricio sometimes works on the side
git add <files>
git commit -m "..."
git push origin main
```

Vercel auto-deploys on push (~30s).

**`git pull` BEFORE editing** — Mauricio runs parallel chats and occasionally pushes from other sessions. Skipping this has burned us before (we found a `v0.23.0` on `main` that we didn't have locally).

**Sync working copy after pulling:**
```bash
cp /c/Users/mauhd/financeapp-deploy/src/App.jsx /c/Users/mauhd/golden-anchor/src/App.jsx
cp /c/Users/mauhd/financeapp-deploy/CHANGELOG.md /c/Users/mauhd/golden-anchor/CHANGELOG.md
```

---

## Dev / build / verify

```bash
# In golden-anchor/:
npm run build       # vite build — ALWAYS run this after any edit; ~1s
npm run dev         # vite dev server → http://localhost:5173 (needs .env.local — see below)
npx playwright test # the existing e2e suite (chromium + firefox)
```

**ALWAYS `npm run build` after edits.** Bundle goes to `dist/`. App.jsx is ~4,300 lines — Vite catches JSX/TS errors in <1s and saves us from shipping syntax breakage.

---

## .env.local needed for the local dev server

The Supabase client is initialized from `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Without these, `supabase` is `null` and login fails with "Connection error. (env vars missing)".

Create `golden-anchor/.env.local` (gitignored, never committed):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your.anon.public.key...
```

Both values live in Vercel → Financeapp project → Settings → Environment Variables. The anon key is the **public** key — safe in `.env.local`. The `SUPABASE_SERVICE_ROLE_KEY` is server-only — never put it here.

---

## Production deploy + cache pitfall

Vercel auto-deploys on `git push origin main`. To verify what's live:

1. Hard refresh (Ctrl+Shift+R) on https://finance.goldenanchor.life
2. DevTools console: `window.__GA_BUILD__` — should match the marker in `src/App.jsx`
3. If it doesn't match: **unregister the service worker** — DevTools → Application → Service Workers → Unregister → Clear site data → hard refresh again. `public/sw.js` aggressively caches the bundle. This bit us multiple times in May 2026.

To check live bundle from CLI:
```bash
curl -s "https://finance.goldenanchor.life/" | grep -oE 'index-[A-Za-z0-9_-]+\.js'
curl -s "https://finance.goldenanchor.life/assets/<that-hash>.js" | grep -oE 'v[0-9]{3,4}-[a-z0-9-]+' | sort -u
```

---

## Locked decisions (top of mind)

Full list in `AGENT.md §4`. The ones that bite most often:

- **D-1** — Single-file architecture. `src/App.jsx` holds every component. Pure-data carve-outs allowed (`translations.js`, `engagementLetterTemplate.js`). Don't propose splitting into multiple component files.
- **D-3** — Bilingual EN/ES is launch-required. Any new visible string MUST land in BOTH `T.en` AND `T.es` in the same edit.
- **D-7** — React state lives in `App()` only. No Redux/Zustand/Context outside `ThemeCtx`/`HideCtx`/`useTh`.
- **D-8** — Recharts for all charts. Don't propose other chart libs.
- **D-27** (amended) — Mobile-first. Modals are centered on mobile (12px edge padding, 16px radius, 85dvh max-height), not bottom-sheet.
- **D-30** — Server code lives in `api/*.js` (Vercel Serverless Functions, Node runtime). Service-role keys never reach the browser.
- **D-34** — PDFs render via self-contained print HTML + `puppeteer-core` + `@sparticuz/chromium-min`. Do NOT drive the live SPA headlessly.
- **D-36** — Bulk source-text patches MUST be verified by a scope-aware checker, not just `tsc --noLib`. `t.foo` where `t` is undefined is valid JS syntax — the crash is runtime, not a parse error.

---

## Common pitfalls (top of mind)

Full list in `AGENT.md §7`. The ones most likely to recur:

- **#9** — 🌐 **BOTH languages, ALWAYS.** Translation symmetry is hard-locked.
- **#11** — Bare-word global replace also matches inside dict strings. Anchor replacements to JSX context (`>WORD</div>`, `label="WORD"`).
- **#13** — Hook order. Route checks and conditional returns MUST come after all `useState`/`useEffect` declarations in `App()`.
- **#14** — `zoom` CSS traps `position:fixed` descendants in WebKit. Mobile drawer/scrim must be siblings of, not descendants of, the zoom container.
- **#15** — PostgREST `.or()` filter — never put a JSON path or a dotted value inside it. Use separate `.eq()` calls instead.
- **#16** — In-app navigation must call `history.pushState` or Back unloads the SPA.
- **#17** (informal, post v0.20.0) — Components defined inside other components' bodies cause `<input>` re-mount on every parent render → "one-character-at-a-time" focus loss. Always define components at top level.

---

## Communication preferences (from WORKPLAN §1)

- **Be direct.** Skip compliments. Don't open with "Great question!"
- Treat as finance professional. Don't over-explain basics.
- Default language English. Switch to Spanish only if Mauricio writes in Spanish first.
- Numbered shorthand ("1. yes 2. a") is fine — read as answers to the questions just asked.
- **Acknowledge constraints:** major life transition, fiancée with health limitations, growing business, exiting day job in 2026.
- **Never date-suffix or version-suffix filenames.** No `App-v0.6.2.jsx`, no `App-backup.jsx`. One canonical name per file. History lives in git.

---

## Test account

`test@goldenanchor.life` / `Miami2020@` — for the local dev server. **Do not** use this account for real client data.

---

## Plugins installed (as of 2026-05-22)

- `github@claude-plugins-official`
- `gitlab@claude-plugins-official`
- `ui-ux-pro-max@ui-ux-pro-max-skill`
- `vercel@claude-plugins-official` (newly installed — auth via `/mcp` → vercel → Authenticate)
- `playwright@claude-plugins-official` (newly installed)
- `claude-mem@claude-mem` (memory across sessions)

---

## When in doubt

1. Read `AGENT.md §3` for the current version + smoke tests
2. Grep before reading large chunks of App.jsx
3. `git pull origin main` in `financeapp-deploy/` before editing
4. `npm run build` after every edit
5. Trust the build marker, not the docs — docs sometimes lag the code
