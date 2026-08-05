import { GET as getV2Contracts } from "@/app/api/v2/contracts/route";
import { GET as getV2ContractById } from "@/app/api/v2/contracts/[id]/route";
import { NextRequest } from "next/server";

describe("Routes API Contracts V2", () => {
  it("la route GET /api/v2/contracts doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/contracts");
    const res = await getV2Contracts(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/contracts/[id] doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/contracts/contract-123");
    const res = await getV2ContractById(req, { params: Promise.resolve({ id: "contract-123" }) });
    expect([401, 403]).toContain(res.status);
  });
});
