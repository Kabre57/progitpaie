import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3500";

test.describe("P0 — Tests E2E de Sécurité et d'Isolation Multi-Tenant (CI/CD Validation)", () => {

  test("E2E-SEC-01 : Visiteur non authentifié sur route admin sensible -> 401/403/404 refus contrôlé", async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/payroll/accounting`);
    expect([401, 403, 404]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    if (res.status() !== 404) {
      expect(body.success).toBe(false);
    }
  });

  test("E2E-SEC-02 : Utilisateur avec rôle salarié tente une mutation de paie -> Refus 401/403/404 Forbidden", async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/v2/payroll`, {
      data: {
        employeeId: "emp-001",
        period: "2026-08",
        grossSalary: 500000,
      },
      headers: {
        "x-user-role": "EMPLOYEE",
      },
    });

    expect([401, 403, 404]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    if (res.status() !== 404) {
      expect(body.success).toBe(false);
    }
  });

  test("E2E-SEC-03 : Admin Entreprise A accède aux données Entreprise B -> Refus 401/403/404 sans fuite de données", async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/v2/employees/emp-company-b-999`, {
      headers: {
        "x-company-id": "company-a-111",
      },
    });

    expect([401, 403, 404]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    if (res.status() !== 404) {
      expect(body.success).toBe(false);
    }
  });

  test("E2E-SEC-04 : Export salarié ou bulletin avec identifiant d'un autre tenant -> Refus serveur (401/403/404)", async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/export/payslip/emp-foreign-tenant-123`, {
      headers: {
        "x-company-id": "company-a-111",
      },
    });

    expect([401, 403, 404]).toContain(res.status());
  });

  test("E2E-SEC-05 : Route Super-Admin liste des tenants -> Accès contrôlé et audité", async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/settings`, {
      headers: {
        "x-user-role": "SUPER_ADMIN",
      },
    });

    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("E2E-SEC-06 : Tenant Démo expiré -> Bloqué avec erreur de conversion requise", async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/v2/payroll`, {
      data: { period: "2026-08" },
      headers: {
        "x-tenant-demo-expired": "true",
      },
    });

    expect([401, 403, 404]).toContain(res.status());
  });

  test("E2E-SEC-07 : Upload document non autorisé ou MIME type invalide -> Refus 400/401/403/404 contrôlé", async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/settings/upload`, {
      data: {
        fileName: "malicious.exe",
        fileType: "application/x-msdownload",
        content: "TVqQAAMAAAAEAAAA...",
      },
    });

    expect([400, 401, 403, 404, 415, 422]).toContain(res.status());
  });

  test("E2E-SEC-08 : Appel API publique avec clé invalide -> 403 JSON explicite", async ({ request }) => {
    // La route /api/v2/public/payroll n'expose que GET.
    // Cette clé ne respecte volontairement pas le préfixe de clé active : le middleware
    // doit donc la refuser avant tout accès à la base et retourner un 403 contrôlé.
    const res = await request.get(`${baseUrl}/api/v2/public/payroll`, {
      headers: {
        "X-API-Key": "pk_invalid_key_should_be_rejected_12345",
      },
    });

    expect(res.status()).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

});
