import { GET as getV2Attendance } from "@/app/api/v2/attendance/route";
import { GET as getV2TodaySummary } from "@/app/api/v2/attendance/today-summary/route";
import { NextRequest } from "next/server";

describe("Routes API Attendance V2", () => {
  it("la route GET /api/v2/attendance doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/attendance");
    const res = await getV2Attendance(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/attendance/today-summary doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/attendance/today-summary");
    const res = await getV2TodaySummary(req);
    expect([401, 403]).toContain(res.status);
  });
});
