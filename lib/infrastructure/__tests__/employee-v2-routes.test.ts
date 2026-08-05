import { GET as getV2Employees } from "@/app/api/v2/employees/route";
import { GET as getV2EmployeeById } from "@/app/api/v2/employees/[id]/route";
import { NextRequest } from "next/server";

describe("Routes API Employees V2", () => {
  it("la route GET /api/v2/employees doit exiger les droits admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/employees");
    const res = await getV2Employees(req);
    expect([401, 403]).toContain(res.status);
  });

  it("la route GET /api/v2/employees/[id] doit exiger un contexte authentifié", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/employees/emp-123");
    const res = await getV2EmployeeById(req, { params: Promise.resolve({ id: "emp-123" }) });
    expect([401, 403]).toContain(res.status);
  });
});
