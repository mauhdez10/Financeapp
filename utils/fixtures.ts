import { test as base, expect, Page } from "@playwright/test";

/**
 * Auth strategy: real Supabase login.
 *
 * We log in ONCE in `global-setup.ts` using the dedicated test account
 * (test@goldenanchor.life), save the authenticated browser state to
 * `playwright/.auth/user.json`, and every test reuses that state via the
 * `storageState` option in playwright.config.ts.
 *
 * This means:
 *  - No App.jsx hook required (production code is untouched).
 *  - Each test starts already-logged-in — fast (~50ms per test instead of
 *    the ~2-3s a fresh Supabase signInWithPassword would take).
 *  - Tests run against real Supabase Postgres, so we exercise the real
 *    RLS policies and the v0.5.1 migration code path.
 *
 * The test user (9d017248-fc0a-44ad-b68b-53315bb928d8) has duplicated
 * fake/demo client data. NEVER point this at the main advisor account.
 */

type GAFixtures = {
  appPage: Page;
};

export const test = base.extend<GAFixtures>({
  /**
   * `appPage` — a Page already authenticated, loaded at the app root,
   * with the build marker confirmed. Most tests should use this.
   */
  appPage: async ({ page }, use) => {
    await page.goto("/");

    // Wait for build marker. This catches the "black screen" failure mode
    // (build marker never set) and also confirms storageState restored
    // the Supabase session (we skipped the login screen).
    await page.waitForFunction(
      // @ts-ignore
      () => typeof window !== "undefined" && !!window.__GA_BUILD__,
      { timeout: 15_000 },
    );

    // Belt-and-suspenders: if storageState somehow expired, the login
    // screen will be visible. Fail loudly with a clear message instead
    // of letting downstream selectors time out mysteriously.
    const loginVisible = await page
      .getByRole("button", { name: /^Sign In$|^Entrar$/i })
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      throw new Error(
        "Login screen is visible — storageState did not restore. " +
          "Delete playwright/.auth/user.json and re-run to re-authenticate.",
      );
    }

    await use(page);
  },
});

export { expect };

/**
 * Click a sidebar nav item by its visible label.
 *
 * The sidebar buttons render as `<button>📊 Dashboard</button>`, i.e. emoji
 * prefix + space + label. We match by ARIA role with a regex on the label —
 * `\b` correctly handles the emoji+space prefix because there's a word
 * boundary between the space and the first letter.
 *
 * Pass the EN or ES label depending on the current app language. Examples:
 *   await navTo(page, "Dashboard");   // EN
 *   await navTo(page, "Tablero");     // ES
 *   await navTo(page, "Calculators"); // EN
 *   await navTo(page, "Calculadoras");// ES
 *
 * Anchored to <nav> to avoid stray matches against random buttons
 * elsewhere in the app that might contain the same word.
 */
export async function navTo(page: Page, label: string) {
  await page
    .locator("nav")
    .getByRole("button", { name: new RegExp(`\\b${label}\\b`, "i") })
    .first()
    .click({ timeout: 10_000 });
}

/**
 * Open a specific client from the Clients list.
 *
 * Client list rows render as `<div onClick={...}>` (not buttons or links),
 * containing the client's initials avatar, name, and metrics. We click the
 * row that contains the full name. The row's onClick fires regardless of
 * which descendant text node Playwright resolves to, because the click
 * event bubbles to the parent `<div>`.
 *
 * The ClientList page (line 1988 of App.jsx) has a hardcoded
 * `placeholder="🔍 Search…"` (NOT translated, just the ellipsis). We wait
 * for that input to confirm the list rendered before clicking a row.
 */
export async function openClient(page: Page, fullName: string) {
  await navTo(page, "Clients");
  // Wait for the ClientList search box — hardcoded "🔍 Search…" placeholder.
  await page
    .getByPlaceholder(/🔍\s*Search/i)
    .first()
    .waitFor({ state: "visible", timeout: 8_000 });
  // Click the visible name text. The row's onClick bubbles up.
  await page.getByText(fullName, { exact: false }).first().click({ timeout: 8_000 });
}

/**
 * Toggle the app language by clicking the sidebar 🌐 EN | ES button.
 *
 * The toggle is a SINGLE button (line 2317 of App.jsx) with
 * `title="Language"` that flips React state. Setting `window.__GA_LANG`
 * is a no-op — the global is written *by* the app via useEffect, not
 * read by anything. Only the click flips state.
 *
 * Algorithm: check the current nav for an EN-only label ("Dashboard")
 * vs an ES-only label ("Tablero") by waiting briefly for one or the
 * other. If we're not in the target language, click the toggle and
 * wait for the nav to re-render.
 *
 * Safe to call repeatedly. Selector for the toggle uses `title="Language"`
 * which is stable across collapsed/expanded sidebar states (the visible
 * text becomes just "🌐" when collapsed).
 */
export async function switchLang(page: Page, targetLang: "en" | "es") {
  const enLabel = "Dashboard";
  const esLabel = "Tablero";

  // Determine current language by racing both nav labels. Whichever shows
  // up first wins. Short timeout because the nav is already rendered when
  // this function is called (the appPage fixture ensures the build marker
  // is set first).
  const currentLang = await Promise.race([
    page
      .locator("nav")
      .getByRole("button", { name: new RegExp(`\\b${enLabel}\\b`, "i") })
      .first()
      .waitFor({ state: "visible", timeout: 4_000 })
      .then(() => "en" as const)
      .catch(() => null),
    page
      .locator("nav")
      .getByRole("button", { name: new RegExp(`\\b${esLabel}\\b`, "i") })
      .first()
      .waitFor({ state: "visible", timeout: 4_000 })
      .then(() => "es" as const)
      .catch(() => null),
  ]);

  if (currentLang === targetLang) return;
  if (currentLang === null) {
    throw new Error(
      "switchLang: could not detect current language — neither Dashboard nor Tablero visible in <nav>.",
    );
  }

  // Click the toggle. `title="Language"` is the stable handle.
  await page
    .getByTitle("Language", { exact: true })
    .first()
    .click({ timeout: 5_000 });

  // Wait for the nav to re-render in the target language.
  const expectedLabel = targetLang === "es" ? esLabel : enLabel;
  await page
    .locator("nav")
    .getByRole("button", { name: new RegExp(`\\b${expectedLabel}\\b`, "i") })
    .first()
    .waitFor({ state: "visible", timeout: 5_000 });
}

/**
 * Open a calculator from the CalculatorsPage gallery.
 *
 * Calculators do NOT render as `<button>` elements — they render as
 * `<div onClick={...}>` cards in a 3-column grid. Each card shows the
 * emoji as a big icon on top, and the label text (with the emoji stripped)
 * below. Internally the label comes from `t.calcHomeCalc` etc.
 *
 * Pass the visible label (without emoji) — e.g. "Home Calculator",
 * "Car Loan", "Debt Reduction", "Affordability", "Income Calculator",
 * "Interest Calculator", "High Yield Savings", "Retirement Planner",
 * "Portfolio Calculator".
 *
 * We match on the text content of the card.
 */
export async function openCalculator(page: Page, label: string) {
  await navTo(page, "Calculators");
  // The card text is the label-without-emoji. We use getByText with
  // exact=false so partial matches work, then resolve to the card root.
  // Each card has `cursor: pointer` styling — we click the visible label
  // and let event bubbling deliver the click to the card's onClick.
  await page
    .getByText(new RegExp(`^${escapeRegExp(label)}$`, "i"))
    .first()
    .click({ timeout: 8_000 });
  // Confirm the calculator opened — the page now shows a Back button
  // (top-left) and an <h2> with the calculator's full label (with emoji).
  await page
    .getByRole("heading", { name: new RegExp(escapeRegExp(label), "i"), level: 2 })
    .first()
    .waitFor({ state: "visible", timeout: 5_000 });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Type into a labeled number-style input.
 *
 * The app's `Field` component (line 157 of App.jsx) renders:
 *   <div data-cf="Label Text"><label>Label Text</label>{children}</div>
 * The `<label>` is a SIBLING of the input, not a wrapper or `for=`
 * reference — so Playwright's `getByLabel()` does NOT work. Use the
 * `data-cf` attribute the app provides specifically for test selectors.
 *
 * `label` can be a string (matched exactly against data-cf) or a regex
 * (matched against data-cf with a CSS attribute selector approximation).
 * The input inside the Field is the actual editable element — we find it
 * by descendant traversal and select existing content first because the
 * app's inputs do `onFocus={e=>e.target.select()}`.
 */
export async function fillNumberByLabel(
  page: Page,
  label: string | RegExp,
  value: string,
) {
  // Resolve the Field wrapper by data-cf.
  let fieldWrapper;
  if (typeof label === "string") {
    fieldWrapper = page.locator(`[data-cf="${label.replace(/"/g, '\\"')}"]`).first();
  } else {
    // For regex labels, enumerate all data-cf attributes and pick the first match.
    const all = page.locator("[data-cf]");
    const count = await all.count();
    let matchedIdx = -1;
    for (let i = 0; i < count; i++) {
      const cf = await all.nth(i).getAttribute("data-cf");
      if (cf && label.test(cf)) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx === -1) {
      throw new Error(
        `fillNumberByLabel: no [data-cf] element matched ${label} on this page.`,
      );
    }
    fieldWrapper = all.nth(matchedIdx);
  }
  // The input is a descendant — could be `input`, `select`, or `textarea`.
  // Most calculator fields use a MaskedNumInp which renders <input>.
  const input = fieldWrapper.locator("input, select, textarea").first();
  await input.waitFor({ state: "visible", timeout: 8_000 });
  await input.click();
  await input.fill(value);
  await input.blur();
}

/**
 * Read the build marker out of the page. Useful for asserting the deployed
 * build is the one you expect after a Vercel push.
 */
export async function getBuildMarker(page: Page): Promise<string> {
  return await page.evaluate(
    // @ts-ignore
    () => window.__GA_BUILD__ as string,
  );
}
