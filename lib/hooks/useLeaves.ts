"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApplyLeaveInput } from "@/lib/validators/leave.schema";
import { ILeave } from "@/types";

// 1. Hook pour la liste des demandes de congés
export function useLeaves() {
  return useQuery<ILeave[]>({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await fetch("/api/leaves/my");
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        return [];
      }
      const json = await res.json();
      return json.data || [];
    },
  });
}

// 2. Hook de soumission d'une demande de congé
export function useApplyLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ApplyLeaveInput) => {
      const res = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la soumission du congé");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}
