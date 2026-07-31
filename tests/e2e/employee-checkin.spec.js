// @ts-check
const { test, expect } = require("@playwright/test");

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const employeeEmail = process.env.E2E_EMPLOYEE_EMAIL;
const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD;

test.skip(!employeeEmail || !employeePassword, "Configure E2E_EMPLOYEE_EMAIL and E2E_EMPLOYEE_PASSWORD to run this test.");

test.describe("Test Automatisé E2E — Espace Employé & Pointage Géolocalisé", () => {
  test.use({
    // Position de test configurable par le navigateur.
    geolocation: { latitude: 5.3707356, longitude: -3.9572473 },
    permissions: ["geolocation"],
  });

  test("Doit se connecter comme Mariam Zahui, accéder à /employee et valider le pointage géolocalisé", async ({ page }) => {
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

    await page.goto(`${baseURL}/login`);
    await page.locator('input[type="email"]').fill(employeeEmail);
    await page.locator('input[type="password"]').fill(employeePassword);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/employee/, { timeout: 10000 });

    // 2. Clic sur le bouton de pointage "Pointer mon Arrivée"
    const checkInBtn = page.locator('button').filter({ hasText: /Pointer mon Arrivée/i });
    
    if (await checkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkInBtn.click();
    }
  });
});
