import {
  buildPayrollProvisionUrl,
  fetchPayrollProvisions,
  ProvisionApiError,
} from "../provision-api";

const v2Payload = {
  success: true,
  data: {
    companyId: "company-a", referenceDate: "2025-12-31T23:59:59.999Z", ruleVersion: "rules-v2",
    calculatedAt: "2026-01-01T00:00:00.000Z", leaveProvisions: [], terminationBenefits: [],
    totalLeaveProvision: 0, totalTerminationExposure: 0, totalExposure: 0,
    employeesProcessed: 0, employeesWithWarnings: 0, warnings: [],
    dataQuality: { completeSalaryHistories: 0, incompleteSalaryHistories: 0, contractFallbacks: 0, legacyLeaveBalances: 0 },
  },
};

describe("client API provisions", () => {
  afterEach(() => jest.restoreAllMocks());

  it("construit des URL séparées par version", () => {
    expect(buildPayrollProvisionUrl({ year: 2025 }, "v2")).toBe("/api/v2/payroll/provisions?year=2025");
    expect(buildPayrollProvisionUrl({ year: 2025 }, "legacy")).toBe("/api/payroll/provisions?year=2025");
    expect(buildPayrollProvisionUrl({ asOf: "2025-06-30" }, "v2")).toBe("/api/v2/payroll/provisions?asOf=2025-06-30");
  });

  it("refuse asOf en legacy et les paramètres incompatibles", () => {
    expect(() => buildPayrollProvisionUrl({ asOf: "2025-06-30" }, "legacy")).toThrow(ProvisionApiError);
    expect(() => buildPayrollProvisionUrl({ year: 2025, asOf: "2025-06-30" }, "v2")).toThrow(ProvisionApiError);
  });

  it("valide une réponse V2 avant de la retourner", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(v2Payload), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    const result = await fetchPayrollProvisions({ year: 2025 }, "v2");
    expect(result).toEqual({ apiVersion: "v2", data: v2Payload.data });
    expect(fetch).toHaveBeenCalledWith("/api/v2/payroll/provisions?year=2025", expect.objectContaining({
      cache: "no-store", credentials: "same-origin",
    }));
  });

  it("rejette une dérive de contrat", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      ...v2Payload, data: { ...v2Payload.data, retirementProvisions: [] },
    }), { status: 200 }));
    await expect(fetchPayrollProvisions({ year: 2025 }, "v2")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it.each([[401, "UNAUTHORIZED"], [403, "FORBIDDEN"], [500, "HTTP_ERROR"]])(
    "type l'erreur HTTP %i",
    async (status, code) => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status }));
      await expect(fetchPayrollProvisions({ year: 2025 }, "v2")).rejects.toMatchObject({ status, code });
    }
  );
});
