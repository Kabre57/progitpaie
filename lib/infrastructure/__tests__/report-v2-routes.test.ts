import { GET as getV2ReportsAnalytics } from "@/app/api/v2/reports/analytics/route";
import { NextRequest } from "next/server";

describe("Routes API Reports V2", () => {
  it("la route GET /api/v2/reports/analytics doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/reports/analytics");
    const res = await getV2ReportsAnalytics(req);
    expect([401, 403]).toContain(res.status);
  });
});
