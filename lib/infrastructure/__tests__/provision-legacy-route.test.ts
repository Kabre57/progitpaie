import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTenant = jest.fn();
const mockExecute = jest.fn();
const mockMapV2 = jest.fn();
const mockMapLegacy = jest.fn();

jest.mock("@/lib/database/tenant-context", () => ({ requireTenant: mockRequireTenant }));
jest.mock("@/lib/application/payroll/provisions/GetPayrollProvisions", () => ({
  GetPayrollProvisions: class { public execute = mockExecute; },
}));
jest.mock("@/lib/application/payroll/provisions/provision.mapper", () => ({
  mapProvisionResultToV2DTO: mockMapV2,
}));
jest.mock("@/lib/application/payroll/provisions/legacy-provision.mapper", () => ({
  mapProvisionV2ToLegacy: mockMapLegacy,
}));

import { GET } from "@/app/api/payroll/provisions/route";

describe("GET /api/payroll/provisions (compatibilité)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenant.mockResolvedValue({
      userId: "admin-a", email: "admin@a.test", role: "admin", companyId: "company-a",
    });
    mockExecute.mockResolvedValue({ companyId: "company-a" });
    mockMapV2.mockReturnValue({ companyId: "company-a" });
    mockMapLegacy.mockReturnValue({ companyId: "company-a", year: 2025 });
  });

  it("délègue au cas d'usage V2 avec le tenant issu de la session", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await GET(new NextRequest("http://localhost/api/payroll/provisions?year=2025"));
    expect(response.status).toBe(200);
    expect(mockExecute).toHaveBeenCalledWith({
      companyId: "company-a",
      referenceDate: new Date("2025-12-31T23:59:59.999Z"),
    });
    expect(mockMapV2).toHaveBeenCalledWith({ companyId: "company-a" });
    expect(mockMapLegacy).toHaveBeenCalledWith({ companyId: "company-a" }, 2025);
    infoSpy.mockRestore();
  });

  it("annonce la dépréciation et interdit la mise en cache", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await GET(new NextRequest("http://localhost/api/payroll/provisions?year=2025"));
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("Deprecated")).toBe("true");
    expect(response.headers.get("Deprecation")).toBe("true");
    expect(response.headers.get("Link")).toContain("/api/v2/payroll/provisions");
    infoSpy.mockRestore();
  });

  it("journalise uniquement les métadonnées de migration", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    await GET(new NextRequest("http://localhost/api/payroll/provisions?year=2025"));
    expect(infoSpy).toHaveBeenCalledWith(
      "[DEPRECATED_API] GET /api/payroll/provisions",
      { companyId: "company-a", userId: "admin-a", year: 2025, status: "success" }
    );
    expect(JSON.stringify(infoSpy.mock.calls)).not.toMatch(/salary|gross|amount/i);
    infoSpy.mockRestore();
  });

  it("conserve les en-têtes de sécurité sur les refus d'autorisation", async () => {
    mockRequireTenant.mockResolvedValue(
      NextResponse.json({ success: false, error: "Accès interdit" }, { status: 403 })
    );
    const response = await GET(new NextRequest("http://localhost/api/payroll/provisions?year=2025"));
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Deprecated")).toBe("true");
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("ne contient plus aucune formule financière historique", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "app/api/payroll/provisions/route.ts"),
      "utf8"
    );
    expect(route).not.toContain("50000");
    expect(route).not.toContain("26.4");
    expect(route).not.toContain("365.25");
    expect(route).not.toContain("retirementProvisionAmount");
    expect(route).not.toContain("prismaWithTenant");
  });
});
