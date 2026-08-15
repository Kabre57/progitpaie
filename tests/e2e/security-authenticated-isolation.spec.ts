import { expect, test, type APIRequestContext } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

type Credentials = {
  email: string;
  password: string;
};

const tenantAAdmin: Credentials = {
  email: process.env.E2E_TENANT_A_ADMIN_EMAIL ?? "",
  password: process.env.E2E_TENANT_A_ADMIN_PASSWORD ?? "",
};

const tenantAEmployee: Credentials = {
  email: process.env.E2E_TENANT_A_EMPLOYEE_EMAIL ?? "",
  password: process.env.E2E_TENANT_A_EMPLOYEE_PASSWORD ?? "",
};

const demoAdmin: Credentials = {
  email: process.env.E2E_DEMO_ADMIN_EMAIL ?? "",
  password: process.env.E2E_DEMO_ADMIN_PASSWORD ?? "",
};

const tenantBEmployeeId = process.env.E2E_TENANT_B_EMPLOYEE_ID ?? "";
const tenantBEmployeeEmail = process.env.E2E_TENANT_B_EMPLOYEE_EMAIL ?? "";

const requiredEnvironment = [
  tenantAAdmin.email,
  tenantAAdmin.password,
  tenantAEmployee.email,
  tenantAEmployee.password,
  demoAdmin.email,
  demoAdmin.password,
  tenantBEmployeeId,
];

const authenticatedIsolationConfigured = requiredEnvironment.every(Boolean);

async function login(request: APIRequestContext, credentials: Credentials): Promise<void> {
  const response = await request.post(`${baseUrl}/api/auth/login`, {
    data: credentials,
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ success: true });
}

test.describe("P0 — Isolation multi-tenant avec sessions authentifiées", () => {
  test.skip(
    !authenticatedIsolationConfigured,
    "Configurez les comptes E2E tenant A, salarié A, démo et l’employé du tenant B avant d’exécuter ce scénario."
  );

  test("E2E-AUTH-SEC-01 : l’admin du tenant A ne lit pas un salarié du tenant B", async ({ request }) => {
    await login(request, tenantAAdmin);

    const response = await request.get(`${baseUrl}/api/v2/employees/${tenantBEmployeeId}`);
    expect([403, 404]).toContain(response.status());

    const body = await response.text();
    expect(body).not.toContain(tenantBEmployeeId);
    if (tenantBEmployeeEmail) {
      expect(body).not.toContain(tenantBEmployeeEmail);
    }
  });

  test("E2E-AUTH-SEC-02 : un salarié authentifié ne peut pas déclencher la paie", async ({ request }) => {
    await login(request, tenantAEmployee);

    const response = await request.post(`${baseUrl}/api/v2/payroll`, {
      data: {
        period: "2026-08",
        grossSalary: 500000,
      },
    });

    expect([401, 403]).toContain(response.status());
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  test("E2E-AUTH-SEC-03 : le tenant démo ne peut pas accéder aux données du tenant de production", async ({ request }) => {
    await login(request, demoAdmin);

    const response = await request.get(`${baseUrl}/api/v2/employees/${tenantBEmployeeId}`);
    expect([403, 404]).toContain(response.status());

    const body = await response.text();
    expect(body).not.toContain(tenantBEmployeeId);
    if (tenantBEmployeeEmail) {
      expect(body).not.toContain(tenantBEmployeeEmail);
    }
  });
});
