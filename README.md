# Playwright tests — Golden Anchor Finance

End-to-end and regression tests for `finance.goldenanchor.life`. Designed to catch the bug classes that have actually bitten this project (black screens, brace imbalance, broken Spanish translations, snapshot save/restore breaking, silent Supabase write failures).

**Auth strategy:** real Supabase login as the dedicated test user. No App.jsx changes. The test user (`test@goldenanchor.life`, UUID `9d017248-fc0a-44ad-b68b-53315bb928d8`) has duplicated fake/demo client data and is sandboxed by RLS from the main advisor account.

---

## What's in this folder

```
tests/
  playwright.config.ts        # Browsers, baseURL, storageState wiring
  global-setup.ts             # Logs in once, saves auth state
  utils/
    fixtures.ts               # Pre-authenticated `appPage` fixture + helpers
  tests/
    01-smoke.spec.ts          # App boots, every tab renders, no console errors
    02-calculators.spec.ts    # Home/Car/Affordability/HY Savings math
    03-client-workflows.spec.ts  # Open a client, walk all detail tabs
    04-translation.spec.ts    # ES mode never blanks / leaks raw keys
    05-persistence.spec.ts    # Real Supabase round-trip survives reload
  .github/workflows/
    playwright.yml            # CI gate — runs on every PR
  playwright/.auth/           # storageState file (gitignored)
```

---

## One-time setup

### 1. Install Playwright

From your `finance-app` repo root:

```bash
npm i -D @playwright/test wait-on dotenv
npx playwright install chromium firefox webkit
```

### 2. Drop this folder into your repo

Copy everything from this scaffold into your repo, matching the structure shown above. Files at the repo root:

- `playwright.config.ts`
- `global-setup.ts`

Folders at the repo root:

- `tests/`
- `utils/`
- `.github/workflows/playwright.yml`

### 3. Create a `.env` file at the repo root

```bash
# .env — never commit this file
GA_TEST_EMAIL=test@goldenanchor.life
GA_TEST_PASSWORD=Miami2020@
```

Add `.env` to `.gitignore` if it isn't there already:

```bash
echo ".env" >> .gitignore
echo "playwright/.auth/" >> .gitignore
echo "playwright-report/" >> .gitignore
echo "test-results/" >> .gitignore
```

### 4. Load `.env` in `global-setup.ts`

`global-setup.ts` reads `process.env.GA_TEST_EMAIL` and `GA_TEST_PASSWORD` directly. Node 20+ supports `.env` natively via the `--env-file` flag, but it's simpler to install `dotenv` and have it loaded automatically. Add this one line to the very top of `global-setup.ts`:

```ts
import "dotenv/config";
```

Or — if you prefer Node's native flag — update `package.json` scripts to `node --env-file=.env ...` (Node 20.6+).

### 5. Add npm scripts

In `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"
  }
}
```

### 6. Configure GitHub Actions secrets (for CI)

In your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

- `GA_TEST_EMAIL` = `test@goldenanchor.life`
- `GA_TEST_PASSWORD` = `Miami2020@`
- `VITE_SUPABASE_URL` = (your Supabase project URL)
- `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)

These are needed because CI builds the Vite app fresh, and the build embeds the Supabase URL/key into the bundle.

---

## Daily workflow

### While developing

```bash
# Terminal 1: dev server
npm run dev

# Terminal 2: tests in interactive mode
npm run test:ui
```

UI mode lets you watch tests run, pause them, time-travel through DOM snapshots, and re-run individual specs.

### Before pushing to GitHub

```bash
npm run test
```

Should complete in 1–2 minutes for the full suite on one browser (the Supabase round-trip adds a few seconds vs. an offline bypass). ~4 minutes across all three browsers.

### After a Vercel deploy

```bash
GA_BASE_URL=https://finance.goldenanchor.life npm run test
```

Runs the same tests against the deployed site instead of localhost. **This hits real Supabase as the test user** — fine because that account is sandboxed, but be aware it will write demo data on any `notes edit` style test.

### Generating a new test (record-and-replay)

```bash
npx playwright codegen http://localhost:5173
```

Log in once manually (the script won't know your test creds), click through your app, Playwright writes the test for you. Copy the generated code into a new spec file under `tests/`.

---

## What each spec actually does

### `01-smoke.spec.ts` — 9 tests
- App boots and sets `window.__GA_BUILD__`
- Zero console errors during initial load
- All 7 sidebar tabs (Dashboard, Clients, Calculators, Promotions, Forms, Resources, About) open without a black screen
- EN→ES toggle doesn't crash

**Catches:** brace imbalance, undefined variables, missing imports, the "blank page after refactor" class of bugs.

### `02-calculators.spec.ts` — 5 tests
- Home Equity: $500k home / $200k mortgage / 80% LTV → $200k max borrowable, $300k equity
- Car Loan: $30k / $5k down / 7% APR → ~$495/mo
- Affordability: $8k income / $500 debt / 36% DTI → $2,380 max housing
- HY Savings: $10k @ 4% APY × 5 years → ~$12.2k
- Debt Reduction tab structural check

**Catches:** logic regressions (the RSR formula bug from v0.4.0), translation passes that touch computed strings, refactors that drop calculator output rows.

### `03-client-workflows.spec.ts` — 4 tests
- Open a seeded test-user client → KPI cards render
- All 9 inner tabs render without crashing
- Complete Report shows INCOME / BILLS / DEBT / RATIOS sections, no raw dict keys
- Single client (no partner) doesn't show "undefined undefined"

**Note:** these specs reference seeded names like "Miguel" or "Amanda" from the original SEED array. If the test user's actual demo data uses different names, update the specs to match. Easiest way to check: log in as the test user once and note the client names that appear.

**Catches:** partner-conditional bugs, missing translation fallbacks, missing report sections.

### `04-translation.spec.ts` — 8 tests
- Switches to ES, walks every main tab
- Asserts at least one Spanish word appears
- Asserts no raw dict keys (`totalIncome`, `incomeHdr`, etc.) leak through
- Asserts no literal `undefined` renders
- Walks client report tabs in ES

**Catches:** pitfall #9 (forgetting to add a key to T.es when adding to T.en).

### `05-persistence.spec.ts` — 3 tests
- ga_v3 localStorage cache hydrated from Supabase after login
- Migration flag is set (test user already migrated)
- Notes edit survives a hard reload via real Supabase round-trip

**Catches:** the v0.5.0 silent-Supabase-write-failure class of bug. This is the most important spec for catching backend regressions.

---

## CI / Vercel gating

`.github/workflows/playwright.yml` runs the suite on every push and PR to `main`. Failed tests block the deploy if you wire it in Vercel:

1. Go to Vercel → your project → Settings → Git
2. Under "Production Branch", set "Require successful checks before deployment" = ON
3. Make sure the `Playwright (Chromium)` job is required

Now no broken build ever reaches `finance.goldenanchor.life` automatically. You can still hand-deploy with `vercel --prod --force` if you need to override.

---

## Troubleshooting

### "Login screen is visible — storageState did not restore"

The saved auth JWT expired (Supabase defaults to 1 hour TTL, but `global-setup` re-runs on every test invocation, so this shouldn't happen). Fix:

```bash
rm -rf playwright/.auth
npm run test
```

### "Missing GA_TEST_EMAIL / GA_TEST_PASSWORD env vars"

You didn't create `.env` or `dotenv/config` isn't loaded. See setup step 3 and 4.

### "Refusing to use [email] — looks like the main advisor account"

`global-setup.ts` has a safety check that refuses to run with an email containing `mauricio` or `hernandez`. This is intentional — the main account must never be touched by tests. Use `test@goldenanchor.life`.

### "Tests are flaky"

- Most flakes are timing-related. Increase `actionTimeout` in `playwright.config.ts`.
- Real Supabase has occasional cold-start latency. The `notes edit round-trip` test in particular has a 2-second wait that may need bumping on slow connections.
- Run `--headed` to see what's happening visually.
- Open the trace: `npx playwright show-trace test-results/.../trace.zip`

### "A label changed and now my test fails"

Tests use the rendered label text (e.g. `Home Equity`). If you renamed a button, update the test. This is expected and good — it forces you to acknowledge the rename.

### "I want to test only one calculator"

```bash
npx playwright test calculators -g "Car Loan"
```

The `-g` flag filters by test name.

---

## What's NOT covered (yet)

These are good candidates for future test additions:

- PDF intake form generation (Playwright can intercept the print dialog and save it)
- CSV import/export round-trip
- Compare snapshot save → Complete Report inclusion
- Debt strategy avalanche vs snowball payoff projections
- Backfill tab pushing edits into historical months

Add tests as bugs surface. Don't pre-emptively cover everything — let real regressions teach you which paths matter.

---

## Test account hygiene

The test user (`test@goldenanchor.life`, UUID `9d017248-fc0a-44ad-b68b-53315bb928d8`) accumulates demo data over time as `persistence.spec.ts` writes timestamped markers into client notes. If the demo data ever gets cluttered:

1. Log in manually as the test user
2. Open DevTools → Console
3. Run `localStorage.clear()` and `await window.supabase.from('clients').delete().eq('user_id','9d017248-fc0a-44ad-b68b-53315bb928d8')` (or do it from the Supabase Dashboard SQL editor)
4. Re-import demo client CSVs from your standard backup

The main advisor account (UUID `b373dd8a-bf12-4df2-9439-d7770406d416`) is RLS-isolated and never touched by these tests.

---

*Last updated: 2026-05-14 — scaffold v1.1, paired with Golden Anchor app v0.5.1. Switched from App.jsx auth-bypass to real Supabase test-account login.*
