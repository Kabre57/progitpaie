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
      success: true,
      data: {
        provisions: [],
        totals: { totalTerminationBenefit: 0, totalLeaveEntitlement: 0, totalProvision: 0 },
        count: 0,
      },
    });

    const { result } = renderHook(() => usePayrollProvisions(2026, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchProvisions).toHaveBeenCalledWith(2026, 1, undefined);
    expect(result.current.data).toBeDefined();
  });
});
