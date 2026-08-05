import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Overtime V2", () => {
  test("1. Endpoint V2 : Consultation des heures supp.", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/overtime`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V1 interne : Doit retourner 404 Not Found suite à la suppression", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/overtime`);
    expect(v1Res.status()).toBe(404);
  });
});
