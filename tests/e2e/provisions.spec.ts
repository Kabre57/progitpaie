import { test, expect } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const tenantBEmail = process.env.E2E_TENANT_B_ADMIN_EMAIL;
const tenantBPassword = process.env.E2E_TENANT_B_ADMIN_PASSWORD;
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function expectV2Provisions(page: import("@playwright/test").Page, loginEmail: string, loginPassword: string) {
  await page.goto(`${baseUrl}/login`);
  
  const emailInput = page.getByLabel("Adresse Email");
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(loginEmail);

  const passwordInput = page.getByPlaceholder("Saisissez votre mot de passe");
  await passwordInput.waitFor({ state: "visible" });
  await passwordInput.fill(loginPassword);

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/login")),
    page.getByRole("button", { name: "Se connecter" }).click(),
  ]);

  if (response.status() !== 200) {
    const text = await response.text();
    throw new Error(`Login failed with status ${response.status()}: ${text}`);
  }

  await page.waitForURL("**/admin**");
  await page.goto(`${baseUrl}/admin/provisions`);
  const main = page.locator("main");
  await expect(main.getByRole("heading", { name: /Provisions et engagements sociaux/ })).toBeVisible();
  await expect(main.getByText(/Indemnités de licenciement/).first()).toBeVisible();
  await expect(main.getByText(/retraite/i)).toHaveCount(0);
  await expect(main.getByText(/règles/i).first()).toBeVisible();
}

test.describe("provisions V2 administrateur", () => {
  test.skip(
    !email || !password || !tenantBEmail || !tenantBPassword,
    "Les identifiants E2E isolés des tenants A et B sont requis"
  );

  test("tenant A : affiche les engagements et la traçabilité V2", async ({ page }) => {
    await expectV2Provisions(page, email!, password!);
  });

  test("tenant B : affiche les engagements et la traçabilité V2", async ({ page }) => {
    await expectV2Provisions(page, tenantBEmail!, tenantBPassword!);
  });
});
