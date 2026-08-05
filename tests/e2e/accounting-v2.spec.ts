import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Accounting V2", () => {
  test("1. Endpoint V2 : Consultation et export du journal comptable", async ({ request }) => {
    const journalRes = await request.get(`${baseUrl}/api/v2/accounting/journal?month=1&year=2026`);
    expect(journalRes.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(journalRes.status());

    const exportRes = await request.get(`${baseUrl}/api/v2/accounting/export?month=1&year=2026`);
    expect(exportRes.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(exportRes.status());
  });

  test("2. Endpoint V1 interne : Doit retourner 404 Not Found suite à la suppression", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/accounting/journal?month=1&year=2026`);
    expect(v1Res.status()).toBe(404);
  });
});
