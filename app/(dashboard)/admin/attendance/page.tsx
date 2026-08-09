"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Download, FileSpreadsheet } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuDialog } from "@/components/ui/neu-dialog";

import { AttendanceStatsCards, TodaySummary } from "@/components/admin/attendance/AttendanceStatsCards";
import { AttendanceFilterBar } from "@/components/admin/attendance/AttendanceFilterBar";
import { AttendanceTable, AttendanceRecord } from "@/components/admin/attendance/AttendanceTable";

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "present", label: "Présent" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "En retard" },
  { value: "half-day", label: "Demi-journée" },
  { value: "on-leave", label: "En congé" },
];

const overrideStatusOptions = [
  { value: "present", label: "Présent" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "En retard" },
  { value: "half-day", label: "Demi-journée" },
  { value: "on-leave", label: "En congé" },
];

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Override dialog state
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!currentMonth) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/attendance?month=${currentMonth}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data.records || []);
      } else {
        setError(data.error || "Failed to fetch attendance");
      }
    } catch {
      setError("Failed to fetch attendance");
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/today-summary");
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
  }, [fetchAttendance, fetchSummary]);

  const getPreviousMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getNextMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const filteredRecords = records.filter((record) => {
    const matchesStatus = !filters.status || record.status === filters.status;
    const matchesSearch =
      !filters.search ||
      record.userId.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.userId.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.userId.employeeId?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openOverrideDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setOverrideStatus(record.status);
    setOverrideNotes("");
    setIsOverrideDialogOpen(true);
  };

  const handleOverride = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/attendance/${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: overrideStatus, notes: overrideNotes }),
      });
      const data = await response.json();
      if (data.success) {
        setIsOverrideDialogOpen(false);
        fetchAttendance();
      } else {
        setError(data.error || "Failed to override attendance");
      }
    } catch {
      setError("Failed to override attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/api/attendance/template", "_blank");
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsSubmitting(true);
    setError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const response = await fetch("/api/attendance/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setImportResult(data.data);
        fetchAttendance();
      } else {
        setError(data.error || "Erreur lors de l'importation Excel");
      }
    } catch {
      setError("Erreur lors de l'importation du fichier Excel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-[var(--neu-accent)]" /> Gestion de la Présence
        </h1>
        <p className="text-[var(--neu-text-secondary)] text-sm">
          Suivi en temps réel des pointages, retards et ajustements de présence des collaborateurs.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Cartes KPI Présence */}
      <AttendanceStatsCards summary={summary} />

      {/* Filtres & Recherche */}
      <AttendanceFilterBar
        currentMonth={currentMonth}
        getMonthName={getMonthName}
        getPreviousMonth={getPreviousMonth}
        getNextMonth={getNextMonth}
        onMonthChange={setCurrentMonth}
        statusFilter={filters.status}
        onStatusFilterChange={(st) => setFilters((prev) => ({ ...prev, status: st }))}
        statusOptions={statusOptions}
        searchQuery={filters.search}
        onSearchChange={(sc) => setFilters((prev) => ({ ...prev, search: sc }))}
        onOpenImportDialog={() => {
          setImportFile(null);
          setImportResult(null);
          setIsImportDialogOpen(true);
        }}
        onDownloadTemplate={handleDownloadTemplate}
        recordsCount={filteredRecords.length}
      />

      {/* Tableau des Pointages */}
      <AttendanceTable
        records={paginatedRecords}
        isLoading={isLoading}
        onOpenOverrideDialog={openOverrideDialog}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRecords.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modale d'ajustement du statut */}
      <NeuDialog
        open={isOverrideDialogOpen}
        onClose={() => setIsOverrideDialogOpen(false)}
        title={`Ajuster le statut de ${selectedRecord?.userId.name}`}
      >
        <div className="space-y-4">
          <NeuSelect
            label="Nouveau Statut"
            options={overrideStatusOptions}
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
          />
          <NeuInput
            label="Motif / Note d'ajustement"
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            placeholder="ex: Retard justifié par la direction..."
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
            <NeuButton variant="ghost" onClick={() => setIsOverrideDialogOpen(false)}>
              Annuler
            </NeuButton>
            <NeuButton variant="accent" onClick={handleOverride} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Confirmer l'ajustement"}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>

      {/* Modale d'importation Excel */}
      <NeuDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        title="Importer les pointages depuis un fichier Excel"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-[var(--neu-text)]">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Format recommandé : Excel (.xlsx / .xls)
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[var(--neu-accent)] hover:underline flex items-center gap-1 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger Modèle
              </button>
            </div>
            <p className="text-[var(--neu-text-secondary)]">
              Le fichier doit contenir les colonnes : <code>Matricule</code>, <code>Date</code> (AAAA-MM-JJ), <code>Statut</code> (Présent, Absent, En retard, Demi-journée, En congé), et optionnellement les heures supp.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--neu-text)]">Sélectionner le fichier Excel</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--neu-text)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--neu-accent)] file:text-white hover:file:opacity-90 cursor-pointer"
            />
          </div>

          {importResult && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg space-y-1">
              <p className="font-semibold">
                ✅ Importation réussie : {importResult.imported} pointage(s) importé(s), {importResult.skipped} ignoré(s).
              </p>
              {importResult.errors.length > 0 && (
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-400">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
            <NeuButton variant="ghost" onClick={() => setIsImportDialogOpen(false)}>
              Fermer
            </NeuButton>
            <NeuButton variant="accent" onClick={handleImport} disabled={!importFile || isSubmitting}>
              {isSubmitting ? "Importation..." : "Lancer l'importation Excel"}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>
    </div>
  );
}
