import { GET as getV2Overtime } from "@/app/api/v2/overtime/route";
import { NextRequest } from "next/server";

describe("Routes API Overtime V2", () => {
  it("la route GET /api/v2/overtime doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/overtime");
    const res = await getV2Overtime(req);
    expect([401, 403]).toContain(res.status);
  });
});
