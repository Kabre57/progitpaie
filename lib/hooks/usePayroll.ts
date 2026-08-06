"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GeneratePayrollInput } from "@/lib/validators/payroll.schema";
import { IPayroll } from "@/types";

// 1. Hook pour la liste des bulletins de paie (Cache persistant 30 minutes)
export function usePayroll(month?: number, year?: number) {
  const queryParams = new URLSearchParams();
  if (month) queryParams.set("month", String(month));
  if (year) queryParams.set("year", String(year));

  return useQuery<IPayroll[]>({
    queryKey: ["payroll", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/payroll?${queryParams.toString()}`);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        return [];
      }
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes de mise en cache car les bulletins changent peu
  });
}

// 2. Hook pour la génération de la paie mensuelle
export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GeneratePayrollInput) => {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la génération de la paie");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
}
