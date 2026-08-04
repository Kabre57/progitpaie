import { test, expect } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("provisions V2 administrateur", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD sont requis");

  test("affiche les engagements et la traçabilité V2", async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel("Adresse Email").fill(email ?? "");
    await page.getByLabel("Mot de passe").fill(password ?? "");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.goto(`${baseUrl}/admin/provisions`);
    await expect(page.getByRole("heading", { name: /Provisions et engagements sociaux/ })).toBeVisible();
    await expect(page.getByText(/Indemnités de licenciement/).first()).toBeVisible();
    await expect(page.getByText(/retraite/i)).toHaveCount(0);
    await expect(page.getByText(/Règles /)).toBeVisible();
  });
});
