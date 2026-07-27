"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckInInput, CheckOutInput } from "@/lib/validators/attendance.schema";
import { IAttendance } from "@/types";

// 1. Hook pour l'historique de pointage
export function useAttendance(employeeId?: string, month?: number, year?: number) {
  const queryParams = new URLSearchParams();
  if (employeeId) queryParams.set("employeeId", employeeId);
  if (month) queryParams.set("month", String(month));
  if (year) queryParams.set("year", String(year));

  return useQuery<IAttendance[]>({
    queryKey: ["attendance", employeeId, month, year],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du chargement des pointages");
      return json.data;
    },
  });
}

// 2. Hook pour récupérer le pointage d'aujourd'hui de l'utilisateur connecté
export function useTodayAttendance() {
  return useQuery<IAttendance | null>({
    queryKey: ["today-attendance"],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const monthStr = todayStr.substring(0, 7);
      const res = await fetch(`/api/attendance?month=${monthStr}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de récupération de la présence du jour");
      const records = Array.isArray(json.data?.records)
        ? json.data.records
        : Array.isArray(json.data)
        ? json.data
        : [];
      const todayRec = records.find((r: any) => r.date === todayStr);
      return todayRec || null;
    },
  });
}

// 3. Hook pour les statistiques de pointage
export function useAttendanceStats(month?: string) {
  return useQuery({
    queryKey: ["attendance-stats", month],
    queryFn: async () => {
      const param = month ? `?month=${month}` : "";
      const res = await fetch(`/api/attendance/stats${param}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de récupération des statistiques");
      return json.data ?? null;
    },
  });
}

// 3. Hook de Check-In avec Invalidation Automatique du Cache
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckInInput) => {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du pointage d'arrivée");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
    },
  });
}

// 4. Hook de Check-Out avec Invalidation Automatique du Cache
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckOutInput) => {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du pointage de départ");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
    },
  });
}
