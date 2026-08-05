import { GET as getV2, POST as postV2 } from "@/app/api/v2/payroll/route";
import { GET as getV1, POST as postV1 } from "@/app/api/payroll/route";
import { NextRequest } from "next/server";

describe("Routes API Payroll V2 & Adaptateur V1", () => {
  it("les routes V1 doivent renvoyer les entêtes HTTP Deprecated", async () => {
    const req = new NextRequest("http://localhost:3000/api/payroll?month=1&year=2026");
    const res = await getV1(req);
    
    // Si 401 (non authentifié), vérifier que l'entête de dépréciation est bien configuré sur la réponse
    expect(res.headers.get("Deprecated")).toBe("true");
    expect(res.headers.get("Link")).toContain('/api/v2/payroll');
  });

  it("les routes V2 ne doivent PAS renvoyer d'entête Deprecated", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/payroll?month=1&year=2026");
    const res = await getV2(req);
    
    expect(res.headers.get("Deprecated")).toBeNull();
  });
});
