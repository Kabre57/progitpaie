/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { usePayrollProvisions } from "../use-payroll-provisions";
import { fetchPayrollProvisions } from "@/lib/client/payroll/provision-api";

jest.mock("@/lib/client/payroll/provision-api", () => ({
  fetchPayrollProvisions: jest.fn(),
}));

const mockFetchProvisions = fetchPayrollProvisions as jest.MockedFunction<typeof fetchPayrollProvisions>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePayrollProvisions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("récupère correctement les provisions V2", async () => {
    mockFetchProvisions.mockResolvedValueOnce({
      apiVersion: "v2",
      data: {
        companyId: "comp-1",
        referenceDate: "2026-08-01",
        ruleVersion: "2026.2",
        calculatedAt: "2026-08-01T00:00:00.000Z",
        leaveProvisions: [],
        terminationBenefits: [],
        totalLeaveProvision: 0,
        totalTerminationExposure: 0,
        totalExposure: 0,
        employeesProcessed: 1,
        employeesWithWarnings: 0,
        warnings: [],
        dataQuality: { completeSalaryHistories: 1, incompleteSalaryHistories: 0, contractFallbacks: 0, legacyLeaveBalances: 0 },
      },
    });

    const { result } = renderHook(() => usePayrollProvisions({ year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.apiVersion).toBe("v2");
    expect(result.current.isV2).toBe(true);
  });
});
