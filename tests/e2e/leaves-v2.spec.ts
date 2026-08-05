import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Leaves V2", () => {
  test("1. Endpoint V2 : Consultation des congés", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/leaves`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V1 interne : Doit retourner 404 Not Found suite à la suppression", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/leaves`);
    expect(v1Res.status()).toBe(404);
  });

  test("3. Endpoint V2 : Soumission de demande de congé", async ({ request }) => {
    const applyRes = await request.post(`${baseUrl}/api/v2/leaves/apply`, {
      data: {
        userId: "user-123",
        type: "annual",
        startDate: "2026-09-01",
        endDate: "2026-09-10",
        reason: "Congés d'été",
      },
    });
    expect([201, 400, 401, 403]).toContain(applyRes.status());
  });
});
