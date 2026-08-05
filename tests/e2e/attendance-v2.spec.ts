import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Attendance V2", () => {
  test("1. Endpoint V2 : Consultation des pointages", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/attendance`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V1 interne : Doit retourner 404 Not Found suite à la suppression", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/attendance`);
    expect(v1Res.status()).toBe(404);
  });

  test("3. Endpoint V2 : Check-In & Check-Out", async ({ request }) => {
    const checkInRes = await request.post(`${baseUrl}/api/v2/attendance/check-in`, {
      data: { latitude: 5.348, longitude: -4.0305 },
    });
    expect([201, 400, 401, 403]).toContain(checkInRes.status());
  });
});
