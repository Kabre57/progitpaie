/** @jest-environment jsdom */
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

const mockGetVersion = jest.fn<"v2" | "legacy", []>();
const mockFetchProvisions = jest.fn();
jest.mock("@/lib/config/provision-api-version", () => ({
  getProvisionApiVersion: mockGetVersion,
}));
jest.mock("@/lib/client/payroll/provision-api", () => {
  const actual = jest.requireActual("@/lib/client/payroll/provision-api");
  return { ...actual, fetchPayrollProvisions: mockFetchProvisions };
});

import { usePayrollProvisions } from "../use-payroll-provisions";

const payload = {
  success: true,
  data: {
    companyId: "company-a", referenceDate: "2025-12-31T23:59:59.999Z", ruleVersion: "rules-v2",
    calculatedAt: "2026-01-01T00:00:00.000Z", leaveProvisions: [], terminationBenefits: [],
    totalLeaveProvision: 0, totalTerminationExposure: 0, totalExposure: 0,
    employeesProcessed: 0, employeesWithWarnings: 0, warnings: [],
    dataQuality: { completeSalaryHistories: 0, incompleteSalaryHistories: 0, contractFallbacks: 0, legacyLeaveBalances: 0 },
  },
};

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("usePayrollProvisions", () => {
  beforeEach(() => {
    mockGetVersion.mockReturnValue("v2");
    mockFetchProvisions.mockResolvedValue({ apiVersion: "v2", data: payload.data });
  });
  afterEach(() => jest.clearAllMocks());

  it("expose le chargement puis une réponse V2 validée", async () => {
    const { result } = renderHook(() => usePayrollProvisions({ year: 2025 }), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ apiVersion: "v2", data: payload.data });
    expect(result.current.isV2).toBe(true);
  });

  it("sépare la version dans la requête", async () => {
    mockGetVersion.mockReturnValue("legacy");
    mockFetchProvisions.mockResolvedValue({ apiVersion: "legacy", data: {
      companyId: "company-a", year: 2025, leaveProvisions: [], totalLeaveProvision: 0,
      retirementProvisions: [], totalRetirementProvision: 0, total: 0,
    } });
    const { result } = renderHook(() => usePayrollProvisions({ year: 2025 }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.apiVersion).toBe("legacy");
    expect(mockFetchProvisions).toHaveBeenCalledWith({ year: 2025 }, "legacy", expect.any(AbortSignal));
  });
});
