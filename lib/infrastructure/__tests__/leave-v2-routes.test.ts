import { GET as getV2Leaves } from "@/app/api/v2/leaves/route";
import { GET as getV2MyLeaves } from "@/app/api/v2/leaves/my/route";
import { NextRequest } from "next/server";

describe("Routes API Leaves V2", () => {
  it("la route GET /api/v2/leaves doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/leaves");
    const res = await getV2Leaves(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/leaves/my doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/leaves/my");
    const res = await getV2MyLeaves(req);
    expect([401, 403]).toContain(res.status);
  });
});
