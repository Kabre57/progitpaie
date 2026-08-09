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
  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  QueryWrapper.displayName = "QueryWrapper";
  return QueryWrapper;
}

describe("usePayrollProvisions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("récupère correctement les provisions V2", async () => {
    mockFetchProvisions.mockResolvedValueOnce({
      apiVersion: "v2",
      data: {
        companyId: "company-1",
        referenceDate: "2026-08-01",
        ruleVersion: "v2",
        calculatedAt: new Date().toISOString(),
        leaveProvisions: [],
        terminationBenefits: [],
        totalLeaveProvision: 0,
        totalTerminationExposure: 0,
        totalExposure: 0,
        employeesProcessed: 0,
        employeesWithWarnings: 0,
        warnings: [],
        dataQuality: {
          completeSalaryHistories: 0,
          incompleteSalaryHistories: 0,
          contractFallbacks: 0,
          legacyLeaveBalances: 0,
        },
      },
    });

    const { result } = renderHook(() => usePayrollProvisions({ year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchProvisions).toHaveBeenCalledWith({ year: 2026 }, expect.anything());
    expect(result.current.data).toBeDefined();
  });
});
