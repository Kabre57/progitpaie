import { GET as getV2Loans } from "@/app/api/v2/loans/route";
import { GET as getV2LoanById } from "@/app/api/v2/loans/[id]/route";
import { NextRequest } from "next/server";

describe("Routes API Loans V2", () => {
  it("la route GET /api/v2/loans doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/loans");
    const res = await getV2Loans(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/loans/[id] doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/loans/loan-123");
    const res = await getV2LoanById(req, { params: Promise.resolve({ id: "loan-123" }) });
    expect([401, 403]).toContain(res.status);
  });
});
