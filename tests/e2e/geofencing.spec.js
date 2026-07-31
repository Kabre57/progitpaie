// @ts-check
const { test, expect } = require("@playwright/test");

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, "Configure E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run this test.");

test.describe("Test Automatisé E2E — Clic Boutons & Géolocalisation Réelle UI", () => {
  test.use({
    geolocation: { latitude: 5.3484, longitude: -4.0305 },
    permissions: ["geolocation"],
  });

  test("Doit se connecter en Admin, naviguer sur /admin/settings, cliquer 'Centrer sur Ma Position' puis 'Enregistrer' avec succès 200", async ({ page }) => {
    page.on("response", (response) => {
      if (response.url().includes("/api/settings/location")) {
        console.log(`📡 [RÉSEAU] Response /api/settings/location -> Status HTTP: ${response.status()}`);
        expect(response.status()).toBe(200);
      }
    });

    await page.goto(`${baseURL}/login`);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(adminEmail);
      await page.locator('input[type="password"]').fill(adminPassword);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/admin/, { timeout: 10000 });
    }

    // 2. Navigation vers la page des paramètres d'administration
    await page.goto(`${baseURL}/admin/settings`);

    // 3. Clic sur l'onglet Géolocalisation
    const tabCandidates = page.locator('button').filter({ hasText: /Géolocalisation|Geofence/i });
    if (await tabCandidates.count() > 0) {
      await tabCandidates.first().click();
    }

    // 4. Clic sur le bouton "Centrer sur Ma Position GPS"
    const centerBtn = page.locator('button').filter({ hasText: /Centrer sur Ma Position/i });
    await expect(centerBtn.first()).toBeVisible({ timeout: 5000 });
    await centerBtn.first().click();

    // 5. Clic sur le bouton "Enregistrer la Géolocalisation Bureau"
    const saveBtn = page.locator('button').filter({ hasText: /Enregistrer la Géolocalisation/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
    await saveBtn.first().click();

  });
});
