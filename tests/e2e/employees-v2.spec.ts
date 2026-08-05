import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E — Module Employees V2", () => {
  test("1. Endpoint V2 : Consultation de la liste des salariés", async ({ request }) => {
    const v2Res = await request.get(`${baseUrl}/api/v2/employees`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
    expect([200, 401, 403]).toContain(v2Res.status());
  });

  test("2. Endpoint V1 : Entêtes Deprecated présents sur l'adaptateur V1", async ({ request }) => {
    const v1Res = await request.get(`${baseUrl}/api/employees`);
    expect(v1Res.headers()["deprecated"]).toBe("true");
    expect(v1Res.headers()["link"]).toContain("/api/v2/employees");
  });
});
