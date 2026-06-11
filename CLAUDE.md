# CLAUDE.md — Golden Anchor Finance App

> Auto-loaded by Claude Code on every session in this folder. Read this FIRST.
> Pair with `claude-mem` plugin (installed) — between the two, you should not
> need to re-upload AGENT/SKILL/WORKPLAN files at the start of new sessions.

> ## 📐 CROSS-PROJECT PLAYBOOK (inherited — NOT copied here)
> The portable way-of-working lives in the canonical
> **`C:\Users\mauhd\Projects\mauricio-os\PLAYBOOK.md`** (single source of truth; its header points
> to the OS catalog — `INVENTORY.md` / `MODES/` / `GUIDES/`). Read it for the disciplines; this
> project keeps only its own specifics (AGENT.md = locked architecture, this file = session handoff).
> We deliberately do **not** keep a local copy, to avoid drift. Finance already practices the
> playbook's §6/§7 situational items — bulk-edit safety, atomic scripted writes, client-cache
> owner-namespacing, batch/migration verify-all, and the `__GA_BUILD__` build-version marker — they
> originated in this project. **Newly applicable** (adopt when next touching them): with advisor/
> client roles now live, §6's adversarial per-role access proof and §5's "encode role/permission
> rules as a skill the agent always consults" both apply.

> ## 🎨 DESIGN MODE — read `docs/DESIGN-MODE.md` before any visual/UI work
> Owner's standing rule (2026-06-05): in design mode, **quality is the only
> objective — credit cost and time are not constraints.** Use the FULL tool
> pipeline (design-principles → Impeccable → ui-ux-pro-max → 21st.dev Magic →
> Emil), explore every option in each tool, compare overlapping tools and pick
> deliberately, dual-mode always. Full roster + overlap map in `docs/DESIGN-MODE.md`.

> ## 🔑 CREDENTIALS — check here first (until launch)
> **The canonical file for every password, token, key, login, project ref, and
> setup detail is `C:\Users\mauhd\Projects\financeapp-deploy\finance-credentials.md`**
> (moved into this folder 2026-06-05; gitignored via `finance-credentials.md` so it
> is never committed — confirm with `git check-ignore finance-credentials.md`).
> **Before asking the user for any
> credential, env var, account login, Supabase/Stripe/Resend/GitHub key, or "where
> do I find X" — READ THAT FILE.** It has the Supabase management token (`sbp_…`),
> the active GitHub PAT, project refs, dashboard links, and the env-var map.
> This is a temporary pre-launch convenience; the file says to move everything to
> 1Password before launch and rotate the pasted secrets. Treat it as sensitive —
> never print full secret values back, never commit it.
>
> Finance Supabase is also reachable via the **`supabase-finance` MCP** (added
> 2026-06-05, scoped to project `ukqqcrupyooqyksotieu` only — separate from Velo's
> Supabase MCP). Use `mcp__supabase-finance__*` tools for finance DB work.

> ## 📁 SINGLE FOLDER NOW — two-folder workflow RETIRED (2026-06-05)
> **There is ONE folder: `C:\Users\mauhd\Projects\financeapp-deploy`** — it is the
> git repo, the working copy, and where the dev server runs. **Edit, `npm run dev`,
> `npm run build`, commit, and push all from here.** Its `.env.local` is in place.
> **Ignore every "edit in `golden-anchor/`, copy to `financeapp-deploy/`"
> instruction below** — that drift-prone two-folder dance is gone. No more `cp`
> between folders. The old working copy is archived at
> `C:\Users\mauhd\Projects\golden-anchor-ARCHIVE` (reference only — safe to delete
> once confirmed unneeded; it holds old screenshots + `ui_kits/` design reference).

---

## 🗓 Session handoff — last update 2026-06-11 (finish-the-project run COMPLETE)

### Currently shipped (live on Vercel)

**v0.76.2** — `2026-06-11-v0762-function-consolidation-linkr-verified`

**The 2026-06-11 master-directive run shipped ALL 12 workstreams** (v0.72.4 → v0.76.2):
pricing realigned in live Stripe (GACLIENT50, real Lite+, Premium product), email
verification + onboarding wizard (Resend SMTP), landing page + /login /pricing
/about-us /contact /faq, Free/Premium ladder with TRUE choose-your-price ($3+ any
amount via api/billing), payment→activation webhook, Members admin (gift Premium),
account linking Link-R (prod-E2E-verified; api/link), Useful-Links directory
(147 links, Premium-gated), referral network, AI export, DIME+Inflation calcs,
role-aware What's New, collapsible Stripe links, promos auto-sync, GTM/SOP/
questionnaire docs. **Read `docs/MASTER-DIRECTIVE.md` (status table at end) + the
top of REVIEW_QUEUE.md first.** ⚠️ Pitfall #20: Vercel Hobby 12-function cap —
api/ is at EXACTLY 12; new endpoints must merge into the action-routers (link.js /
billing.js / admin-members.js). Owner pending: 2 Vercel env vars (STRIPE_SECRET_KEY
+ STRIPE_WEBHOOK_SECRET → unlocks auto-activation, any-amount checkout, MRR panel),
key rotation pre-launch, GTM [OWNER: fill]s, landing-motion feedback (his refero/mux
refs — the one open design iteration).

— Prior state (2026-06-09): **v0.69.8** — `2026-06-09-v0698-settings-card-clip-3d-no-page-jump`

The app now has **two account roles** (advisor + client), chosen at signup and fully isolated.
The v0.60 → v0.69 arc in one table (full detail in CHANGELOG.md):

| Versions | What shipped |
|---|---|
| **v0.69.x** | Account-based client portal: role from auth `user_metadata` (leak-proof); restricted client shell (Overview/Calculators/Resources/Pricing/About + trimmed avatar menu); auto-created self-profile; Settings **flip cards** (cover→details, Edit = popup, global Flip toggle); **Localization editable & wired** (language/currency/date actually re-render); backup save-location picker; refresh keeps the page, no dashboard flash; cache-leak hardening |
| **v0.68.x** | Token-based read-only **share portal** (`portal_links` + `resolve-portal.js`, server-side sanitize allow-list, Share-portal modal in client kebab) + the cross-account localStorage leak fix |
| **v0.66–67** | About Us rebuild (hero + bento + connect dots); designed signup (strength meter); Calculators rebuild (categorized + bilingual); Promotions editorial header |
| **v0.63–65** | Standalone Pricing page (carousel + comparison + line-field); spotlight-glow cards everywhere; real Supabase sign-up; Resources carousel rebuild; Settings per-card edit + scoped popups |
| **v0.60–62** | The modern redesign: Direction B (Linear/Vercel flat dark-tech) + C motion — theme tokens, glass/halo/press/rise motion classes, emoji strip, thin charts, warm-cream light mode |

### Pending work (priority order)

1. **Sprint in flight (2026-06-10, Fable 5, owner-approved):** Phase 0+1 extraction per
   `docs/ARCHITECTURE-PLAN.md` (**D-37 locked — D-1 relaxed**), logic library skill
   (`golden-anchor-logic`), client-role Settings + per-module visibility toggles, portal extras
   (email link / preview-as-client / expiry), role-access adversarial proof, **professional
   design pass (owner's top priority)**, mobile polish (stretch). Owner checklist lands in
   `REVIEW_QUEUE.md`.
2. `docs/ARCHITECTURE-PLAN.md` Phase 2 (ClientDetail/pages decomposition) after Phase 1.
3. Parked: see memory `parked-features` (module toggles beyond client sections).

### Infrastructure ready in this folder

- **`CLAUDE.md`** (this file) — auto-loaded by Claude Code
- **`.env.local`** — Supabase URL + anon key set; dev server can log in. NEVER edit/commit this file. `.env.local.example` is the template that ships in repo.
- **`AGENT.md`** — full decision log + locked decisions (D-1 to D-37) + pitfalls (#1-#19). Read on demand. `SKILL.md` is the design-system manifest (Claude.ai/design only). `WORKPLAN-archive-2026-05.md` is preserved historical only.
- **Single folder**: this repo is the working copy AND the deploy clone (two-folder workflow retired 2026-06-05).
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

1. `cd C:\Users\mauhd\Projects\financeapp-deploy && git pull origin main && git log --oneline -5`
2. This file (CLAUDE.md) auto-loads; AGENT.md §1/§4/§7 on demand
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

Find it fast: `grep -o '__GA_BUILD__="[^"]*"' src/App.jsx`. As of 2026-06-10 the live marker is `2026-06-09-v0698-settings-card-clip-3d-no-page-jump` (v0.69.8). Docs may lag — ALWAYS trust the build marker.

**Versioning:** patch for behavior change with no structural change; minor for new surface/component; major TBD at v1.0.

---

## Dev / build / verify

```bash
# In financeapp-deploy/:
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
