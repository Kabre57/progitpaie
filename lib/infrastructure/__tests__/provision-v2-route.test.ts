import { NextRequest, NextResponse } from "next/server";

const mockRequireTenant = jest.fn();
const mockExecute = jest.fn();
const mockMapResult = jest.fn();

jest.mock("@/lib/database/tenant-context", () => ({
  requireTenant: mockRequireTenant,
}));

jest.mock("@/lib/application/payroll/provisions/GetPayrollProvisions", () => ({
  GetPayrollProvisions: class {
    public execute = mockExecute;
  },
}));

jest.mock("@/lib/application/payroll/provisions/provision.mapper", () => ({
  mapProvisionResultToV2DTO: mockMapResult,
}));

import { GET } from "@/app/api/v2/payroll/provisions/route";

describe("GET /api/v2/payroll/provisions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenant.mockResolvedValue({
      userId: "admin-a",
      email: "admin@a.test",
      role: "admin",
      companyId: "company-a",
    });
    mockExecute.mockResolvedValue({ companyId: "company-a" });
    mockMapResult.mockReturnValue({
      companyId: "company-a",
      terminationBenefits: [],
      leaveProvisions: [],
    });
  });

  it("exige une session administrateur du tenant", async () => {
    mockRequireTenant.mockResolvedValue(
      NextResponse.json({ success: false, error: "Accès interdit" }, { status: 403 })
    );
    const response = await GET(new NextRequest("http://localhost/api/v2/payroll/provisions?year=2025"));
    expect(response.status).toBe(403);
    expect(mockRequireTenant).toHaveBeenCalledWith(expect.any(NextRequest), "admin");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("transmet uniquement le companyId issu de la session", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v2/payroll/provisions?year=2025")
    );
    expect(response.status).toBe(200);
    expect(mockExecute).toHaveBeenCalledWith({
      companyId: "company-a",
      referenceDate: new Date("2025-12-31T23:59:59.999Z"),
    });
  });

  it("retourne le contrat V2 en cache privé no-store", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v2/payroll/provisions?year=2025"));
    const body = await response.json();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(body.data).toHaveProperty("terminationBenefits");
    expect(body.data).not.toHaveProperty("retirementProvisions");
  });

  it("refuse les paramètres incompatibles avant le cas d'usage", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v2/payroll/provisions?year=2025&asOf=2025-12-31")
    );
    expect(response.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("refuse une année future", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v2/payroll/provisions?year=2100"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ code: "INVALID_REFERENCE_DATE" }));
  });

  it("masque les erreurs internes", async () => {
    mockExecute.mockRejectedValue(new Error("salaire confidentiel"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await GET(new NextRequest("http://localhost/api/v2/payroll/provisions?year=2025"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "Impossible de calculer les provisions",
      code: "PROVISION_CALCULATION_ERROR",
    });
    consoleSpy.mockRestore();
  });
});
