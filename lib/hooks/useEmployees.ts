"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/lib/validators/employee.schema";
import { IUser } from "@/types";

interface FetchEmployeesParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface EmployeesResponse {
  data: IUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 1. Hook pour récupérer la liste des employés avec filtres et pagination
export function useEmployees(params?: FetchEmployeesParams) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.department) queryParams.set("department", params.department);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return useQuery<EmployeesResponse>({
    queryKey: ["employees", params],
    queryFn: async () => {
      const res = await fetch(`/api/employees?${queryParams.toString()}`);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Échec de la récupération des employés");
      }
      const json = await res.json();
      return json;
    },
  });
}

// 2. Hook pour récupérer les détails d'un employé spécifique
export function useEmployee(id: string) {
  return useQuery<IUser>({
    queryKey: ["employee", id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Employé non trouvé");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(id),
  });
}

// 3. Hook de création d'employé avec Invalidation du Cache
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEmployeeData: CreateEmployeeInput) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployeeData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la création de l'employé");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

// 4. Hook de mise à jour d'un employé avec Invalidation du Cache
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeInput }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la mise à jour de l'employé");
      return json.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
    },
  });
}

// 5. Hook de suppression (soft delete) d'un employé
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la suppression");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
