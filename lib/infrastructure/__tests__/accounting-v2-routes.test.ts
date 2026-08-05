import { GET as getV2Journal } from "@/app/api/v2/accounting/journal/route";
import { GET as getV2Export } from "@/app/api/v2/accounting/export/route";
import { NextRequest } from "next/server";

describe("Routes API Accounting V2", () => {
  it("la route GET /api/v2/accounting/journal doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/accounting/journal");
    const res = await getV2Journal(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/accounting/export doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/accounting/export");
    const res = await getV2Export(req);
    expect([401, 403]).toContain(res.status);
  });
});
