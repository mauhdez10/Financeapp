import { test as base, expect, Page } from "@playwright/test";

/**
 * Golden Anchor Finance — Playwright shared fixtures & helpers.
 *
 * THIRD-PASS REWRITE (2026-05-14, after two earlier patches both shipped with
 * regressions). The current App.jsx invariants this file relies on:
 *
 *   - Sidebar <nav> at App.jsx:2313 with <button>{emoji} {label}</button> entries.
 *     Buttons render as e.g. <button>📊 Dashboard</button>. The accessible name
 *     INCLUDES the leading emoji, but `\b...\b` regex still matches against the
 *     trailing word ("Dashboard", "Tablero", etc.). Verified.
 *
 *   - Language toggle is a single <button title="Language"> at App.jsx:2317. Its
 *     visible text is "🌐 EN | ES" in BOTH languages — it does not flip. Detect
 *     current language via window.__GA_LANG (mirrored from React state by the
 *     useEffect at App.jsx:2266) — DO NOT try to write window.__GA_LANG from
 *     the test; nothing reads it back.
 *
 *   - Field UI atom at App.jsx:157 renders <div data-cf={label}><label>{label}</label>
 *     <input/></div>. The <label> is a sibling, not paired via htmlFor.
 *     Playwright getByLabel() does NOT work here. Always use data-cf.
 *
 *   - ClientList (the Clients tab) at App.jsx:1988 has its search box placeholder
 *     hardcoded to "🔍 Search…" — NOT translated. Different from the Dashboard
 *     search box which IS translated ("🔍 Search clients…" / "🔍 Buscar clientes…").
 *
 *   - Calculator gallery (CalculatorsPage at App.jsx:1551) renders entries as
 *     <div onClick={...}> cards (NOT buttons), with the inner text being the
 *     calc name with the leading emoji stripped (e.g. "Home Calculator").
 */

declare global {
  interface Window {
    __GA_LANG?: Lang;
    __GA_BUILD__?: string;
  }
}

export type Lang = "en" | "es";

/* ── appPage fixture ──────────────────────────────────────────────────── */

/**
 * Pre-authenticated, pre-booted page. global-setup.ts saved the auth state, so
 * navigating to "/" lands us inside the app. We wait for <nav> (it only renders
 * after the bootstrap effect finishes hydrating from Supabase) AND for
 * window.__GA_LANG to be defined (proves the App component itself has mounted —
 * <nav> alone could be from a stale cached render).
 */
export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    await page.goto("/");
    await page.locator("nav").waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => typeof window.__GA_LANG !== "undefined", null, {
      timeout: 30_000,
    });
    await use(page);
  },
});

export { expect };

/* ── language ─────────────────────────────────────────────────────────── */

export async function getLang(page: Page): Promise<Lang> {
  return ((await page.evaluate(() => window.__GA_LANG)) ?? "en") as Lang;
}

/**
 * Switch the app to the target language. No-op if already there.
 *
 * The toggle button is `<button title="Language">🌐 EN | ES</button>` in both
 * languages — it doesn't change text on click, so we MUST verify the switch
 * landed by reading window.__GA_LANG AND by waiting for the nav to re-render
 * with the target language's labels.
 */
export async function switchLang(page: Page, target: Lang): Promise<void> {
  const current = await getLang(page);
  if (current === target) return;

  await page.locator('button[title="Language"]').first().click();

  // Confirm React state actually updated.
  await page.waitForFunction((t) => window.__GA_LANG === t, target, { timeout: 10_000 });

  // Confirm the nav also re-rendered (no point continuing if React state changed
  // but the UI is still painting the old labels).
  const navWord = target === "es" ? "Tablero" : "Dashboard";
  await page
    .locator("nav")
    .getByRole("button", { name: new RegExp(`\\b${navWord}\\b`, "i") })
    .first()
    .waitFor({ timeout: 10_000 });
}

/* ── navigation ───────────────────────────────────────────────────────── */

/**
 * Click a top-level sidebar nav button. `label` is matched as a whole word,
 * case-insensitive. Pass the label in the CURRENT language (e.g. "Dashboard"
 * if EN, "Tablero" if ES) — this helper does not translate.
 */
export async function navTo(page: Page, label: string): Promise<void> {
  await page
    .locator("nav")
    .getByRole("button", { name: new RegExp(`\\b${label}\\b`, "i") })
    .first()
    .click({ timeout: 10_000 });
}

/* ── client workflows ─────────────────────────────────────────────────── */

/**
 * Open a client by name from anywhere in the app. Goes to the Clients page in
 * the current language, uses its search box, clicks the matching row.
 *
 * The Clients-page search placeholder is hardcoded English ("🔍 Search…"). The
 * Dashboard search box uses a translated placeholder. The regex below matches
 * both so this also works if someone calls openClient() while still on the
 * Dashboard tab.
 */
export async function openClient(page: Page, name: string): Promise<void> {
  const lang = await getLang(page);
  await navTo(page, lang === "es" ? "Clientes" : "Clients");

  const search = page.getByPlaceholder(/🔍\s*(Search|Buscar)/i).first();
  await search.waitFor({ timeout: 10_000 });
  await search.fill(name);

  // Row text is `${firstName} ${lastName}` inside a clickable <div>. After
  // typing the name we expect exactly one match in the filtered list.
  await page
    .getByText(name, { exact: false })
    .first()
    .click({ timeout: 10_000 });
}

/* ── calculators ──────────────────────────────────────────────────────── */

/**
 * Open a standalone calculator from the Calculators gallery. Self-contained —
 * navigates to the Calculators tab in the current language first, then clicks
 * the matching card. (Calling navTo on the already-active tab is a no-op
 * inside React because setState to the same value doesn't trigger a re-render.)
 *
 * Cards are <div onClick={...}> (NOT <button>), with the visible inner text
 * being the calc name with the leading emoji stripped, e.g. "Home Calculator"
 * in EN or "Calculadora Hogar" in ES. Pass either an exact string or a regex.
 *
 * Clicks land on the inner text <div>; React's onClick is on the parent <div>
 * but the click event bubbles, so the handler still fires.
 */
export async function openCalculator(page: Page, label: string | RegExp): Promise<void> {
  const lang = await getLang(page);
  await navTo(page, lang === "es" ? "Calculadoras" : "Calculators");
  const matcher = typeof label === "string" ? new RegExp(`^${escapeRegex(label)}$`) : label;
  await page.getByText(matcher).first().click({ timeout: 10_000 });
}

/* ── form filling ─────────────────────────────────────────────────────── */

/**
 * Fill a numeric input whose surrounding Field wrapper has a label matching
 * `label`. Accepts both strings (substring match) and RegExps. Use this
 * everywhere instead of getByLabel — the Field UI atom does NOT pair its
 * <label> with the <input> via htmlFor, so getByLabel times out.
 *
 * Strategy: locate every `[data-cf]` wrapper, filter by visible text (the
 * Field's <label> child renders the same text as the data-cf attribute, and
 * Playwright's `hasText` filter accepts both strings and RegExps), then drill
 * into the input. Tolerates "($)" / "(%)" / "(years)" suffixes naturally.
 */
export async function fillNumberByLabel(
  page: Page,
  label: string | RegExp,
  value: number | string
): Promise<void> {
  const input = page
    .locator("[data-cf]")
    .filter({ hasText: label })
    .locator("input")
    .first();
  await input.waitFor({ timeout: 10_000 });
  await input.fill(String(value));
}

/* ── build marker ─────────────────────────────────────────────────────── */

/**
 * Return window.__GA_BUILD__ from the page (e.g. "2026-05-14-autologout-passreset-v052a").
 * Useful for asserting "the deploy actually went out" against a remote URL.
 */
export async function getBuildMarker(page: Page): Promise<string | null> {
  return (await page.evaluate(() => window.__GA_BUILD__ ?? null)) as string | null;
}

/* ── internals ────────────────────────────────────────────────────────── */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
