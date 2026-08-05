import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Declarations V2", () => {
  test("1. Endpoint V2 : Consultation des déclarations CNPS et ITS", async ({ request }) => {
    const cnpsRes = await request.get(`${baseUrl}/api/v2/declarations/cnps?month=1&year=2026`);
    expect(cnpsRes.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(cnpsRes.status());

    const itsRes = await request.get(`${baseUrl}/api/v2/declarations/its?month=1&year=2026`);
    expect(itsRes.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(itsRes.status());
  });

  test("2. Endpoint V1 interne : Doit retourner 404 Not Found suite à la suppression", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/declarations/cnps?month=1&year=2026`);
    expect(v1Res.status()).toBe(404);
  });
});
