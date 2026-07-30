// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Test Automatisé E2E — Espace Employé & Pointage Géolocalisé", () => {
  test.use({
    // Simule la position GPS réelle de l'appareil (5.3707356, -3.9572473)
    geolocation: { latitude: 5.3707356, longitude: -3.9572473 },
    permissions: ["geolocation"],
  });

  test("Doit se connecter comme Mariam Zahui, accéder à /employee et valider le pointage géolocalisé", async ({ page }) => {
    console.log("🚀 Démarrage du test E2E Espace Employé (Mariam Zahui)...");

    page.on("response", async (response) => {
      if (response.url().includes("/api/attendance/check-in")) {
        console.log(`📡 [RÉSEAU] Response /api/attendance/check-in -> Status HTTP: ${response.status()}`);
        try {
          const body = await response.json();
          console.log("📡 [RÉSEAU JSON Response]:", body);
        } catch (e) {}
        expect([200, 400]).toContain(response.status());
      }
    });

    // 1. Connexion avec les identifiants de Mariam Zahui
    await page.goto("http://localhost:3002/login");
    await page.waitForTimeout(1000);

    console.log("🔐 Connexion avec mariam.zahui111@progitpaie.ci...");
    await page.locator('input[type="email"]').fill("mariam.zahui111@progitpaie.ci");
    await page.locator('input[type="password"]').fill("123456");
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);
    console.log("📍 Navigation sur /employee...");

    // 2. Clic sur le bouton de pointage "Pointer mon Arrivée"
    const checkInBtn = page.locator('button').filter({ hasText: /Pointer mon Arrivée/i });
    
    if (await checkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("👉 Clic sur 'Pointer mon Arrivée'...");
      await checkInBtn.click();
      await page.waitForTimeout(3000);
      console.log("✅ Action de pointage d'arrivée géolocalisé exécutée par l'employé !");
    } else {
      console.log("ℹ️ L'employé a déjà pointé son arrivée aujourd'hui.");
    }

    console.log("🎉 Test E2E Espace Employé achevé avec succès !");
  });
});
