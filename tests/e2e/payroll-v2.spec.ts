import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Payroll V2", () => {
  test("1. Endpoint V2 : Consultation des bulletins", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/payroll?month=1&year=2026`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V2 : Génération de la paie", async ({ request }) => {
    const genRes = await request.post(`${baseUrl}/api/v2/payroll`, {
      data: { month: 1, year: 2026 },
    });
    expect([201, 401, 403]).toContain(genRes.status());
  });
});
