"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPayrollProvisions,
  ProvisionApiError,
  type PayrollProvisionQuery,
  type PayrollProvisionQueryResult,
} from "@/lib/client/payroll/provision-api";

export function usePayrollProvisions(query: PayrollProvisionQuery) {
  const result = useQuery<PayrollProvisionQueryResult, ProvisionApiError>({
    queryKey: ["payroll-provisions", "v2", query] as const,
    queryFn: ({ signal }) => fetchPayrollProvisions(query, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) =>
      failureCount < 1 && (error.code === "NETWORK_ERROR" || (error.status ?? 0) >= 500),
  });

  return {
    ...result,
    apiVersion: "v2" as const,
    isLegacy: false,
    isV2: true,
    refresh: result.refetch,
  };
}
