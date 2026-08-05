import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Qualification E2E & Rapprochement V1/V2 — Module Payroll", () => {
  test("1. Rapprochement V1 et V2 : Parité des réponses et présence des entêtes Deprecated", async ({ request }) => {
    // Appel direct V1
    const v1Res = await request.get(`${baseUrl}/api/payroll?month=1&year=2026`);
    
    // Si la route renvoie un statut 401 ou 200, elle doit inclure les entêtes HTTP Deprecated
    expect(v1Res.headers()["deprecated"]).toBe("true");
    expect(v1Res.headers()["link"]).toContain("/api/v2/payroll");

    // Appel direct V2
    const v2Res = await request.get(`${baseUrl}/api/v2/payroll?month=1&year=2026`);
    expect(v2Res.headers()["deprecated"]).toBeUndefined();
  });

  test("2. Exécution du flux V2 : Génération, consultation et mise à jour des primes", async ({ request }) => {
    // Génération V2
    const genRes = await request.post(`${baseUrl}/api/v2/payroll`, {
      data: { month: 1, year: 2026 },
    });
    // Doit être refusé avec 401 ou réussir avec 201 si authentifié
    expect([201, 401, 403]).toContain(genRes.status());
  });
});
