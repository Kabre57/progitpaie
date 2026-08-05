import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Leaves V2", () => {
  test("1. Endpoint V2 : Consultation des demandes de congés", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/leaves`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V1 : Entêtes Deprecated présents sur l'adaptateur V1", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/leaves`);
    expect(v1Res.headers()["deprecated"]).toBe("true");
    expect(v1Res.headers()["link"]).toContain("/api/v2/leaves");
  });

  test("3. Endpoint V2 : Demande de congé", async ({ request }) => {
    const applyRes = await request.post(`${baseUrl}/api/v2/leaves/apply`, {
      data: {
        leaveType: "annual",
        startDate: "2026-08-10",
        endDate: "2026-08-14",
        reason: "Congés payés",
      },
    });
    expect([201, 400, 401, 403]).toContain(applyRes.status());
  });
});
