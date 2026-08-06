"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { AttendanceFilters, FilterState } from "@/components/attendance/attendance-filters";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { AttendanceExport } from "@/components/attendance/attendance-export";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { ChipLoader } from "@/components/ui/chip-loader";
import { useAttendanceStats, useAttendance } from "@/lib/hooks/useAttendance";

const ITEMS_PER_PAGE = 10;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.role === "super_admin") {
          setIsSuperAdmin(true);
          router.replace("/super-admin/dashboard");
        } else {
          setIsSuperAdmin(false);
        }
      })
      .catch(() => setIsSuperAdmin(false));
  }, [router]);
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().toISOString().slice(0, 7),
    employeeId: "",
    status: "",
    search: "",
  });

  // Extract year and month numbers for React Query
  const [yearNum, monthNum] = useMemo(() => {
    const [y, m] = filters.month.split("-").map(Number);
    return [y, m];
  }, [filters.month]);

  // React Query Hooks (remplace tous les useEffect et fetch manuels)
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useAttendanceStats(filters.month);
  const { data: recordsData, isLoading: isLoadingRecords, isError: isErrorRecords, error: errorRecords } = useAttendance(undefined, filters.month);

  const rawRecords = useMemo(() => {
    if (!recordsData) return [];
    if (Array.isArray(recordsData)) return recordsData;
    if (Array.isArray((recordsData as any).records)) return (recordsData as any).records;
    return [];
  }, [recordsData]);

  // Filtrage côté mémoire ultra-rapide
  const filteredRecords = useMemo(() => {
    let result = [...rawRecords];

    if (filters.employeeId) {
      result = result.filter(
        (record: any) =>
          typeof record.userId === "object" && record.userId?._id === filters.employeeId
      );
    }

    if (filters.status) {
      result = result.filter((record: any) => record.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (record: any) =>
          typeof record.userId === "object" &&
          record.userId?.name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [filters, rawRecords]);

  const handleFilter = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePrevMonth = () => {
    const [year, month] = filters.month.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    handleFilter({ ...filters, month: newMonth });
  };

  const handleNextMonth = () => {
    const [year, month] = filters.month.split("-").map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    handleFilter({ ...filters, month: newMonth });
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPage, filteredRecords]);

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const isLoading = isLoadingStats || isLoadingRecords;
  const isError = isErrorStats || isErrorRecords;
  const errorMessage = (errorStats as Error)?.message || (errorRecords as Error)?.message || "Erreur de chargement";

  if (isError) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <p className="text-[var(--neu-danger)] text-lg">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8" style={{ minHeight: "400px" }}>

      {/* En-tête avec sélecteur de mois */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <NeuButton
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </NeuButton>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] capitalize">
            {formatMonthDisplay(filters.month)}
          </h1>
          <NeuButton
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </NeuButton>
        </div>
        <AttendanceExport records={filteredRecords as any} month={filters.month} />
      </div>

      {/* Cartes de Statistiques */}
      <AttendanceStats stats={stats || null} isLoading={false} />

      {/* Filtres */}
      <AttendanceFilters onFilter={handleFilter} initialFilters={filters} />

      {/* Tableau des Pointages */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>Registres de Présence</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <AttendanceTable records={paginatedRecords as any} />

          {/* Pagination */}
          {!isLoadingRecords && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--neu-border)]">
              <p className="text-sm text-[var(--neu-text-secondary)]">
                Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} sur{" "}
                {filteredRecords.length} enregistrements
              </p>
              <div className="flex gap-2">
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </NeuButton>
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </NeuButton>
              </div>
            </div>
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
