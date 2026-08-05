import { GET as getV2Severance } from "@/app/api/v2/severance/route";
import { NextRequest } from "next/server";

describe("Routes API Severance V2", () => {
  it("la route GET /api/v2/severance doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/severance");
    const res = await getV2Severance(req);
    expect([401, 403]).toContain(res.status);
  });
});
