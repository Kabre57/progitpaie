import { GET as getV2Cnps } from "@/app/api/v2/declarations/cnps/route";
import { GET as getV2Its } from "@/app/api/v2/declarations/its/route";
import { NextRequest } from "next/server";

describe("Routes API Declarations V2", () => {
  it("la route GET /api/v2/declarations/cnps doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/declarations/cnps");
    const res = await getV2Cnps(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/declarations/its doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/declarations/its");
    const res = await getV2Its(req);
    expect([401, 403]).toContain(res.status);
  });
});
