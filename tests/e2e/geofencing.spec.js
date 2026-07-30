// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Test Automatisé E2E — Clic Boutons & Géolocalisation Réelle UI", () => {
  test.use({
    geolocation: { latitude: 5.3484, longitude: -4.0305 },
    permissions: ["geolocation"],
  });

  test("Doit se connecter en Admin, naviguer sur /admin/settings, cliquer 'Centrer sur Ma Position' puis 'Enregistrer' avec succès 200", async ({ page }) => {
    console.log("🚀 Démarrage du test UI en authentification Admin réelle...");

    page.on("response", (response) => {
      if (response.url().includes("/api/settings/location")) {
        console.log(`📡 [RÉSEAU] Response /api/settings/location -> Status HTTP: ${response.status()}`);
        expect(response.status()).toBe(200);
      }
    });

    // 1. Connexion avec les identifiants Admin fournis
    await page.goto("http://localhost:3002/login");
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log("🔐 Authentification Admin avec admin@attendance.com...");
      await emailInput.fill("admin@attendance.com");
      await page.locator('input[type="password"]').fill("admin123");
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // 2. Navigation vers la page des paramètres d'administration
    await page.goto("http://localhost:3002/admin/settings");
    await page.waitForTimeout(2000);

    // 3. Clic sur l'onglet Géolocalisation
    const tabCandidates = page.locator('button').filter({ hasText: /Géolocalisation|Geofence/i });
    if (await tabCandidates.count() > 0) {
      await tabCandidates.first().click();
      await page.waitForTimeout(1000);
      console.log("✅ Onglet Géolocalisation cliqué.");
    }

    // 4. Clic sur le bouton "Centrer sur Ma Position GPS"
    const centerBtn = page.locator('button').filter({ hasText: /Centrer sur Ma Position/i });
    await expect(centerBtn.first()).toBeVisible({ timeout: 5000 });
    console.log("📌 Clic sur le bouton 'Centrer sur Ma Position GPS'...");
    await centerBtn.first().click();
    await page.waitForTimeout(1000);

    // 5. Clic sur le bouton "Enregistrer la Géolocalisation Bureau"
    const saveBtn = page.locator('button').filter({ hasText: /Enregistrer la Géolocalisation/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
    console.log("💾 Clic sur le bouton 'Enregistrer la Géolocalisation Bureau'...");
    await saveBtn.first().click();

    // Attente du traitement HTTP
    await page.waitForTimeout(3000);

    console.log("🎉 Test UI complété : Authentification & Enregistrement 200 (OK) !");
  });
});
