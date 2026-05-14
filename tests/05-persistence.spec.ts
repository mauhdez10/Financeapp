import { test, expect, openClient, navTo } from "../utils/fixtures";

/**
 * PERSISTENCE — real Supabase round-trip
 *
 * The test user (9d017248-fc0a-44ad-b68b-53315bb928d8) has duplicated
 * fake/demo client data. These tests exercise the real Supabase pathway:
 * an edit made in the browser persists across a hard reload because
 * gaSaveClient / gaSaveSettings wrote it back to Postgres.
 *
 * This protects the v0.5.1 fix: if a regression silently kills cloud
 * writes again, the marker would appear in localStorage but vanish after
 * reload (when Supabase load overwrites local state).
 */

test.describe("persistence (Supabase round-trip)", () => {
  test("ga_v3 localStorage cache is hydrated from Supabase after login", async ({
    appPage,
  }) => {
    // After login + bootstrap, the app should have written its Supabase-loaded
    // client list into ga_v3 as a write-through cache.
    const data = await appPage.evaluate(() => localStorage.getItem("ga_v3"));
    expect(data, "ga_v3 cache should exist after Supabase load").not.toBeNull();

    const parsed = JSON.parse(data as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(
      parsed.length,
      "Test user should have demo clients seeded in Supabase",
    ).toBeGreaterThanOrEqual(1);
  });

  test("migration flag is set (test user already migrated)", async ({ appPage }) => {
    // The test account has already gone through migration. The flag should
    // be set so the migration loop never runs again on subsequent logins.
    const flag = await appPage.evaluate(() =>
      localStorage.getItem("ga_migrated_to_supabase"),
    );
    expect(flag).toBe("1");
  });

  test("notes edit round-trips through Supabase (survives hard reload)", async ({
    appPage,
  }) => {
    // Pick the first client in the list — the test user has demo data,
    // but we don't pin a specific name because seed data may evolve.
    await navTo(appPage, "Clients");

    // Find the first clickable client row. Avoid hitting the "New Client"
    // button by filtering it out.
    const firstClient = appPage
      .locator('[role="button"], button, div')
      .filter({ hasText: /^[A-Z][a-z]+ [A-Z][a-z]+/ })
      .filter({ hasNotText: /New Client|Nuevo Cliente|Search/i })
      .first();
    await firstClient.click();

    // Drill into Notes tab
    const notesTab = appPage
      .getByRole("button", { name: /🗒|Notes|Notas/i })
      .first();
    await notesTab.click();

    // Find the first visible textarea (General Notes field)
    const textarea = appPage.locator("textarea").first();
    await textarea.waitFor({ state: "visible", timeout: 5_000 });

    const marker = `PWTEST-${Date.now()}`;
    await textarea.click();
    await textarea.fill(marker);

    // Try to click save (if explicit save button exists), else blur
    const saveBtn = appPage
      .getByRole("button", { name: /Save Note|Guardar Nota|Save/i })
      .first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
    } else {
      await textarea.blur();
    }

    // Wait for the Supabase write to fire. The persist effect is async;
    // we give it a generous window to round-trip.
    await appPage.waitForTimeout(2_000);

    // Hard reload — wipes in-memory state, forces a fresh Supabase fetch
    await appPage.reload();
    await appPage.waitForFunction(
      // @ts-ignore
      () => !!window.__GA_BUILD__,
      { timeout: 15_000 },
    );

    // Wait past the "Loading clients…" bootstrap screen
    await appPage.waitForFunction(
      () => {
        const body = document.body.innerText || "";
        return (
          !body.includes("Loading clients") && !body.includes("Cargando clientes")
        );
      },
      { timeout: 15_000 },
    );

    // The marker must show up in the ga_v3 cache, which is only re-populated
    // after a successful Supabase load. If Supabase silently failed (like
    // the v0.5.0 bug), the marker would be gone here.
    const stored = await appPage.evaluate(() => localStorage.getItem("ga_v3"));
    expect(
      stored,
      "After reload, ga_v3 should be re-populated from Supabase",
    ).not.toBeNull();
    expect(
      stored,
      `Marker "${marker}" should survive Supabase round-trip — if absent, gaSaveClient is failing silently`,
    ).toContain(marker);
  });
});
