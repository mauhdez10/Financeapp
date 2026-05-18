import { test, expect } from "../utils/fixtures";
import { devices } from "@playwright/test";

/**
 * MOBILE LAYOUT CONTRACT (iPhone 13 ~390x844)
 *
 * v0.9.3 resync: v0.9.0–0.9.3 added the entire mobile experience — the
 * slide-in drawer, the sticky app bar, and a string of layout fixes. The
 * suite had ZERO mobile coverage. This file is new.
 *
 * What it guards (see AGENT.md §7 / CHANGELOG v0.9.0–0.9.3):
 *  1. The drawer slides FULLY into view — its left edge is flush with the
 *     viewport, not clipped off-screen. v0.9.1 fixed this by hoisting the
 *     drawer OUT of the CSS-`zoom` container (pitfall #14: `zoom` creates a
 *     containing block for position:fixed in WebKit/iOS). We assert that
 *     structurally — engine-agnostically — by checking the drawer is not a
 *     descendant of the zoom element.
 *  2. Dark mode paints BOTH <html> and <body> with theme.bg (v0.9.1), so no
 *     white gap bleeds through on overscroll / the iOS safe area.
 *  3. No horizontal page scroll on any primary surface (v0.9.0 / v0.9.3 grid
 *     overflow fixes — the `data-ga-grid` collapse).
 *
 * Engine note: this spec uses the iPhone 13 device descriptor, which sets
 * `isMobile: true`. Playwright does not support `isMobile` on Firefox, so the
 * spec self-skips there. It runs on Chromium out of the box; under WebKit too
 * if that project is re-enabled (WebKit is where pitfall #14 actually
 * reproduces — see the optional WebKit step in the resync notes).
 */

test.use({ ...devices["iPhone 13"] });
test.skip(
  ({ browserName }) => browserName === "firefox",
  "iPhone 13 emulation sets isMobile, which Playwright does not support on Firefox.",
);

// rgb()/rgba() string -> rough relative luminance in 0..1.
function luminance(rgb: string): number {
  const m = rgb.match(/rgba?\(([^)]+)\)/i);
  if (!m) return 1; // unknown -> treat as "light" so a dark-mode assert fails loudly
  const [r, g, b] = m[1].split(",").map((n) => parseFloat(n.trim()));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

test.describe("mobile layout (iPhone 13)", () => {
  test("drawer opens fully (no left-edge clip) and nav walks Dashboard → Clients → ClientDetail → back", async ({
    appPage,
  }) => {
    const page = appPage;

    // At phone width the desktop sidebar must not render; the app bar does.
    await expect(page.locator("#ga-sidebar")).toHaveCount(0);
    await expect(page.locator("#ga-appbar")).toBeVisible();

    // The first button in the app bar is the ☰ hamburger.
    await page.locator("#ga-appbar button").first().click();

    const drawer = page.locator("#ga-sidebar-mobile");
    await expect(drawer).toBeVisible();

    // (1a) The drawer's left edge must sit at the viewport's left edge — not
    // pushed inward and not clipped off-screen.
    const box = await drawer.boundingBox();
    expect(box, "drawer should have a layout box once open").not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1); // not clipped off the left
    expect(box!.x).toBeLessThan(8); // flush left, not inset

    // (1b) Structural guard for pitfall #14: the drawer must be a SIBLING of,
    // never a descendant of, the CSS-`zoom` container. If a future change
    // nests it back inside, this fails on every engine — not just WebKit.
    const drawerInsideZoom = await page.evaluate(() => {
      const d = document.getElementById("ga-sidebar-mobile");
      if (!d) return null;
      return !!d.closest('[style*="zoom"]');
    });
    expect(
      drawerInsideZoom,
      "mobile drawer must not be nested inside the zoom container (pitfall #14)",
    ).toBe(false);

    // Navigate to Clients via the drawer (the only nav surface on mobile).
    await page
      .locator("#ga-sidebar-mobile nav")
      .getByRole("button", { name: /\bClients\b|\bClientes\b/i })
      .first()
      .click();

    // Selecting a nav item closes the drawer and renders the Clients list.
    await expect(drawer).not.toBeVisible();
    await expect(page.getByText(/Miguel/).first()).toBeVisible();

    // Open a client -> ClientDetail (Back button is always present there).
    await page.getByText(/Miguel/).first().click();
    await expect(
      page.getByRole("button", { name: /Back|Volver/i }).first(),
    ).toBeVisible();

    // Back to the list.
    await page.getByRole("button", { name: /Back|Volver/i }).first().click();
    await expect(page.locator("#ga-appbar")).toBeVisible();
  });

  test("dark mode paints <html> and <body> with the same dark background (v0.9.1)", async ({
    appPage,
  }) => {
    const page = appPage;

    // Ensure the app is in dark mode. The drawer theme toggle reads
    // "🌙 Dark Mode" when currently LIGHT (offering dark) and
    // "☀️ Light Mode" when currently DARK.
    await page.locator("#ga-appbar button").first().click();
    const themeToggle = page
      .locator("#ga-sidebar-mobile")
      .getByRole("button", { name: /🌙|☀️/ })
      .first();
    const label = (await themeToggle.innerText()).trim();
    if (label.startsWith("🌙")) {
      await themeToggle.click(); // currently light -> switch to dark
    }
    // Close the drawer (the theme toggle does not close it on its own).
    const closeBtn = page.locator(
      '#ga-sidebar-mobile button[aria-label="Close menu"]',
    );
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
    await expect(page.locator("#ga-sidebar-mobile")).not.toBeVisible();

    // v0.9.1: a useEffect keyed on theme.bg paints BOTH the documentElement
    // and the body. Poll to let the post-toggle repaint settle.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const htmlBg = getComputedStyle(
              document.documentElement,
            ).backgroundColor;
            const bodyBg = getComputedStyle(document.body).backgroundColor;
            return { htmlBg, bodyBg, equal: htmlBg === bodyBg };
          }),
        { message: "html/body backgrounds should converge after dark toggle" },
      )
      .toMatchObject({ equal: true });

    const { bodyBg } = await page.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }));
    expect(
      luminance(bodyBg),
      `body background ${bodyBg} should be a dark colour in dark mode`,
    ).toBeLessThan(0.5);
  });

  test("no horizontal page scroll on Dashboard, Clients, or ClientDetail", async ({
    appPage,
  }) => {
    const page = appPage;

    // +1px tolerates sub-pixel rounding; anything more is a real overflow.
    const fitsWidth = () =>
      page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth <= de.clientWidth + 1;
      });

    // Dashboard (the default surface after login).
    await expect
      .poll(fitsWidth, { message: "Dashboard overflows horizontally" })
      .toBe(true);

    // Clients — reached via the drawer.
    await page.locator("#ga-appbar button").first().click();
    await page
      .locator("#ga-sidebar-mobile nav")
      .getByRole("button", { name: /\bClients\b|\bClientes\b/i })
      .first()
      .click();
    await expect(page.getByText(/Miguel/).first()).toBeVisible();
    await expect
      .poll(fitsWidth, { message: "Clients list overflows horizontally" })
      .toBe(true);

    // ClientDetail — exercises the v0.9.3 `data-ga-grid` KPI grids that used
    // to spill cards off the right edge on a phone.
    await page.getByText(/Miguel/).first().click();
    await expect(
      page.getByRole("button", { name: /Back|Volver/i }).first(),
    ).toBeVisible();
    await expect
      .poll(fitsWidth, { message: "ClientDetail overflows horizontally" })
      .toBe(true);
  });
});
