"use client";

import { useQuery } from "@tanstack/react-query";
import { getProvisionApiVersion } from "@/lib/config/provision-api-version";
import {
  fetchPayrollProvisions,
  ProvisionApiError,
  type PayrollProvisionQuery,
  type PayrollProvisionQueryResult,
} from "@/lib/client/payroll/provision-api";

export function usePayrollProvisions(query: PayrollProvisionQuery) {
  const apiVersion = getProvisionApiVersion();
  const result = useQuery<PayrollProvisionQueryResult, ProvisionApiError>({
    queryKey: ["payroll-provisions", apiVersion, query] as const,
    queryFn: ({ signal }) => fetchPayrollProvisions(query, apiVersion, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) =>
      failureCount < 1 && (error.code === "NETWORK_ERROR" || (error.status ?? 0) >= 500),
  });

  return {
    ...result,
    apiVersion,
    isLegacy: apiVersion === "legacy",
    isV2: apiVersion === "v2",
    refresh: result.refetch,
  };
}
