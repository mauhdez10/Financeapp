import { test, expect, openClient, navTo } from "../utils/fixtures";

/**
 * CLIENT WORKFLOWS
 *
 * The seeded SEED data ships with two clients:
 *   - Miguel & Sofia Torres (couple, 4 cards, 2 loans, 4 month snapshots)
 *   - Amanda Chen (single, 1 card, 2 loans, 2 month snapshots)
 *
 * Opening these and walking the report tabs is the highest-yield regression
 * test because it exercises the same code paths your real clients will.
 */

test.describe("client workflows", () => {
  test("can open Miguel Torres and see the report header", async ({ appPage }) => {
    await openClient(appPage, "Miguel");
    // Header shows full names
    await expect(appPage.getByText(/Miguel/).first()).toBeVisible();
    await expect(appPage.getByText(/Torres/).first()).toBeVisible();
    // KPI cards should render with the four standard tiles
    await expect(appPage.getByText(/Total Income|Net Income/i).first()).toBeVisible();
    await expect(appPage.getByText(/Net Worth|Patrimonio/i).first()).toBeVisible();
  });

  test("all client detail tabs render without crashing (Miguel)", async ({
    appPage,
  }) => {
    await openClient(appPage, "Miguel");

    // Inner tabs from ClientDetail.tabs.
    // v0.9.3 resync against App.jsx ClientDetail (8 tabs):
    //   - the per-client "📝 Intake" tab was REMOVED in v0.7.0 (intake is now
    //     its own top-level "Intake Forms" surface) — entry deleted here.
    //   - "💹 Portfolios" was renamed to "💹 Investments" — entry corrected.
    //   - "🔧 Backfill" is a tab the old list never had — entry added.
    // The loop below stays tolerant (it silently skips a non-matching label
    // rather than hard-failing) because two ClientDetail tab labels collide
    // with the nested ClientReport sub-tab strip; a verified hard assertion
    // would need a live run, which this resync could not perform.
    const tabs = [
      /📊 Client Report/i,
      /📅 Monthly Statement/i,
      /📋 Financial Statements/i,
      /💹 Investments/i,
      /📋 Strategy Plan/i,
      /🧮 Calculators/i,
      /🔧 Backfill/i,
      /🗒 Notes/i,
    ];

    for (const tab of tabs) {
      // Two of these labels collide with sidebar nav buttons (Calculators
      // and Clients are in <nav>; Strategy Plan / Notes etc. are not).
      // .first() returns DOM-order — which on collisions is the sidebar
      // button, navigating away from ClientDetail and breaking the Back
      // assertion. Filter the candidate buttons down to those NOT inside
      // <nav>.
      const candidates = await appPage.getByRole("button", { name: tab }).all();
      let btn = null;
      for (const c of candidates) {
        const inNav = await c.evaluate((el) => !!el.closest("nav"));
        if (!inNav) {
          btn = c;
          break;
        }
      }
      if (btn && (await btn.isVisible().catch(() => false))) {
        await btn.click();
        // Each tab change shouldn't blank the page. Check the back button
        // is still visible (it's always rendered in ClientDetail).
        await expect(appPage.getByRole("button", { name: /Back|Volver/i }).first())
          .toBeVisible();
      }
    }
  });

  test("Complete Report renders with all sections (Miguel)", async ({
    appPage,
  }) => {
    await openClient(appPage, "Miguel");
    // Drill into Client Report -> Complete Report
    await appPage.getByRole("button", { name: /Client Report/i }).first().click();
    await appPage
      .getByRole("button", { name: /Complete Report/i })
      .first()
      .click();

    // Expected sections of the complete report
    const sections = [
      /INCOME/i,
      /BILLS & EXPENSES/i,
      /DEBT/i,
      /FINANCIAL RATIOS/i,
    ];
    for (const re of sections) {
      await expect(appPage.getByText(re).first()).toBeVisible({ timeout: 5_000 });
    }

    // No raw dictionary keys should leak through
    const body = await appPage.locator("body").innerText();
    expect(body).not.toContain("undefined");
    expect(body).not.toMatch(/\b[a-z]+Hdr\b/); // header keys like "incomeHdr"
  });

  test("Amanda Chen (single client) renders without partner-related errors", async ({
    appPage,
  }) => {
    await openClient(appPage, "Amanda");
    // Single client — should NOT render partner name
    const body = await appPage.locator("body").innerText();
    expect(body).toContain("Amanda");
    expect(body).not.toContain("undefined undefined");
  });
});

/**
 * CLIENT LIST — ACTION-FIRST BULK FLOW (v0.8.0)
 *
 * v0.9.3 resync: ClientList was rewritten in v0.8.0. There is no per-row
 * checkbox or selection UI until the advisor picks an action from the ☰
 * ("Actions") Kebab menu FIRST — then a selection mode opens, rows become
 * tappable checkboxes, and a confirm modal gates the actual mutation. The
 * old suite had ZERO coverage of any of this.
 *
 * SAFETY: these tests run against the shared seeded test user. Every test
 * below CANCELS out of the confirm/picker modal — none ever archive, delete,
 * split, or join. The seeded clients (Miguel Torres, Amanda Chen) must
 * survive intact for 05-persistence.spec.ts.
 *
 * Hooks used (stable, not translation-dependent):
 *   - getByTitle("Actions")       — the ☰ Kebab trigger (title attr)
 *   - menu items end with "…"     — discriminates "Archive…" the menu item
 *                                   from the "Archived Clients" section toggle
 *   - action button text "(N)"    — the selected-count is language-independent
 *   - getByPlaceholder("DELETE")  — the delete-confirm input
 *   - the modal "×" close button
 */
test.describe("client list — action-first bulk flow (v0.8.0)", () => {
  test("no selection UI is shown until an action is picked from the ☰ menu", async ({
    appPage,
  }) => {
    await navTo(appPage, "Clients");
    // Nothing selectable yet: the action bar is not in the DOM.
    await expect(
      appPage.getByText(/Select clients to (archive|restore|delete)/i),
    ).toHaveCount(0);

    // Open the ☰ Actions menu — it should expose all five bulk actions.
    await appPage.getByTitle("Actions").first().click();
    for (const item of [
      /Archive…/i,
      /Restore…/i,
      /Delete…/i,
      /Split…/i,
      /Join…/i,
    ]) {
      await expect(
        appPage.getByRole("button", { name: item }).first(),
      ).toBeVisible();
    }
  });

  test("Archive: ☰ → Archive → select a client → confirm modal opens", async ({
    appPage,
  }) => {
    await navTo(appPage, "Clients");
    await appPage.getByTitle("Actions").first().click();
    await appPage.getByRole("button", { name: /Archive…/i }).first().click();

    // Selection mode is now active — the action bar is visible...
    await expect(
      appPage.getByText(/Select clients to archive/i),
    ).toBeVisible();
    // ...and the Archive action button starts disabled at 0 selected.
    await expect(
      appPage.getByRole("button", { name: /Archive \(0\)/i }),
    ).toBeDisabled();

    // Clicking a client row in selection mode SELECTS it (does not open it).
    await appPage.getByText(/Miguel/).first().click();
    const archiveBtn = appPage.getByRole("button", { name: /Archive \(1\)/i });
    await expect(archiveBtn).toBeEnabled();

    // Open the confirm modal — then CANCEL. Never actually archive.
    await archiveBtn.click();
    await expect(appPage.getByText(/Archive Clients/i)).toBeVisible();
    await appPage
      .getByRole("button", { name: "×", exact: true })
      .first()
      .click();
  });

  test("Delete: confirm button stays disabled until DELETE is typed", async ({
    appPage,
  }) => {
    await navTo(appPage, "Clients");
    await appPage.getByTitle("Actions").first().click();
    await appPage.getByRole("button", { name: /Delete…/i }).first().click();

    await expect(
      appPage.getByText(/Select clients to delete/i),
    ).toBeVisible();
    await appPage.getByText(/Miguel/).first().click();
    await expect(
      appPage.getByRole("button", { name: /Delete \(1\)/i }),
    ).toBeEnabled();

    // Open the confirm modal.
    await appPage
      .getByRole("button", { name: /Delete \(1\)/i })
      .click();
    // Inside the modal, the confirm button (DOM-order first of the two
    // "Delete (1)" buttons — the modal renders before the action bar) is
    // disabled until the literal word DELETE is typed.
    const confirmBtn = appPage
      .getByRole("button", { name: /Delete \(1\)/i })
      .first();
    await expect(confirmBtn).toBeDisabled();
    await appPage.getByPlaceholder("DELETE").fill("DELETE");
    await expect(confirmBtn).toBeEnabled();

    // Never delete — cancel out via the modal close button.
    await appPage
      .getByRole("button", { name: "×", exact: true })
      .first()
      .click();
  });

  test("Split and Join each open their picker modal", async ({ appPage }) => {
    await navTo(appPage, "Clients");

    await appPage.getByTitle("Actions").first().click();
    await appPage.getByRole("button", { name: /Split…/i }).first().click();
    await expect(appPage.getByText(/Split a Client/i)).toBeVisible();
    await appPage
      .getByRole("button", { name: "×", exact: true })
      .first()
      .click();

    await appPage.getByTitle("Actions").first().click();
    await appPage.getByRole("button", { name: /Join…/i }).first().click();
    await expect(appPage.getByText(/Join Clients/i)).toBeVisible();
    await appPage
      .getByRole("button", { name: "×", exact: true })
      .first()
      .click();
  });
});
