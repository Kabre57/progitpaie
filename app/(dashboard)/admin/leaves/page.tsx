"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, XCircle, Calendar, FileText, FileSpreadsheet, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/neu-toast";
import { ChipLoader } from "@/components/ui/chip-loader";
import { List2 } from "@/components/ui/list-2";
import { User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuPagination } from "@/components/ui/neu-pagination";
import { LeaveFilterBar } from "@/components/admin/leaves/LeaveFilterBar";

interface LeaveRequest {
  _id: string;
  userId: { _id?: string; id?: string; name: string; email: string; employeeId?: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface ImportResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

const getMonthName = (monthStr: string) => {
  if (!monthStr) return "Tous les mois";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

const getPreviousMonth = (monthStr: string) => {
  if (!monthStr) {
    const now = new Date();
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const getNextMonth = (monthStr: string) => {
  if (!monthStr) {
    const now = new Date();
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // States pour la barre de filtrage (par défaut: Tous les mois)
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [filter, setFilter] = useState("all"); // status filter
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Import Excel State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [activeEditDoc, setActiveEditDoc] = useState<{
    userId: string;
    name: string;
    startDate: string;
    endDate: string;
    returnDate: string;
    docType: "attestation_conge";
  } | null>(null);

  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leaves/all");
      const data = await response.json();
      if (data.success) {
        setLeaves(data.data);
      } else {
        toastError(data.error || "Échec de la récupération des congés");
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      toastError("Une erreur est survenue lors de la récupération des congés");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage combiné (Mois si sélectionné, Statut, Type de congé, Recherche Salarié)
  const filteredLeaves = leaves.filter((leave) => {
    if (currentMonth) {
      const startM = leave.startDate.slice(0, 7);
      const endM = leave.endDate.slice(0, 7);
      if (startM !== currentMonth && endM !== currentMonth) return false;
    }
    if (filter !== "all" && leave.status !== filter) return false;
    if (typeFilter !== "all" && leave.leaveType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (leave.userId?.name || "").toLowerCase();
      const email = (leave.userId?.email || "").toLowerCase();
      const empId = (leave.userId?.employeeId || "").toLowerCase();
      const reason = (leave.reason || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !empId.includes(q) && !reason.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/leaves/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toastSuccess("Demande de congé approuvée");
        fetchLeaves();
      } else {
        toastError(data.error || "Échec de l'approbation");
      }
    } catch (error) {
      console.error("Failed to approve leave", error);
      toastError("Une erreur est survenue lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/leaves/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toastSuccess("Demande de congé rejetée");
        fetchLeaves();
      } else {
        toastError(data.error || "Échec du rejet");
      }
    } catch (error) {
      console.error("Failed to reject leave", error);
      toastError("Une erreur est survenue lors du rejet");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/api/leaves/template", "_blank");
  };

  const handleImportExcel = async () => {
    if (!importFile) return;
    setIsSubmittingImport(true);
    setImportError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch("/api/leaves/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setImportResult(data.data);
        toastSuccess(`${data.data.imported} congé(s) importé(s) avec succès`);
        setCurrentMonth(""); // Réinitialiser le filtre mois pour afficher les congés importés
        fetchLeaves();
      } else {
        setImportError(data.error || "Erreur lors de l'importation Excel");
      }
    } catch {
      setImportError("Erreur serveur lors de l'envoi du fichier Excel");
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <NeuBadge variant="present">Validé</NeuBadge>;
      case "rejected":
        return <NeuBadge variant="absent">Rejeté</NeuBadge>;
      default:
        return <NeuBadge variant="warning">En attente</NeuBadge>;
    }
  };

  return (
    <div className="space-y-6 relative" style={{ minHeight: "400px" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--neu-text)]">
            <Calendar className="text-[var(--neu-accent)]" /> Gestion des Congés Payés & Attestations
          </h2>
          <p className="text-[var(--neu-text-secondary)] text-sm">
            Validation des demandes de congés, impression des Attestations et importation Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NeuButton
            onClick={() => {
              const now = new Date();
              const startStr = now.toISOString().split("T")[0];
              const endStr = new Date(now.getTime() + 15 * 86400000).toISOString().split("T")[0];
              const returnStr = new Date(now.getTime() + 16 * 86400000).toISOString().split("T")[0];
              setActiveEditDoc({
                userId: "",
                name: "Salarié",
                startDate: startStr,
                endDate: endStr,
                returnDate: returnStr,
                docType: "attestation_conge",
              });
            }}
            variant="ghost"
            size="sm"
            className="border border-[var(--neu-border)] text-[var(--neu-accent)] font-semibold"
          >
            <FileText className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Imprimer Attestation PDF
          </NeuButton>

          <NeuButton onClick={handleDownloadTemplate} variant="ghost" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-500" /> Modèle Excel
          </NeuButton>

          <NeuButton onClick={() => setShowImportModal(true)} variant="accent" size="sm">
            <Upload className="w-4 h-4 mr-1" /> Importer Excel (.xlsx)
          </NeuButton>
        </div>
      </div>

      {/* Barre de filtrage par Date / Mois, Statut, Type et Recherche */}
      <LeaveFilterBar
        currentMonth={currentMonth}
        getMonthName={getMonthName}
        getPreviousMonth={getPreviousMonth}
        getNextMonth={getNextMonth}
        onMonthChange={(m) => {
          setCurrentMonth(m);
          setCurrentPage(1);
        }}
        statusFilter={filter}
        onStatusFilterChange={(s) => {
          setFilter(s);
          setCurrentPage(1);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(t) => {
          setTypeFilter(t);
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      {/* Leaves Table */}
      <NeuCard>
        <NeuCardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <ChipLoader label="Chargement des congés..." />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucune demande de congé"
              description="Aucune demande trouvée pour cette sélection."
            />
          ) : (
            <List2 
              items={paginatedLeaves.map((leave) => {
                const sDate = new Date(leave.startDate);
                const eDate = new Date(leave.endDate);
                const rDate = new Date(eDate);
                rDate.setDate(rDate.getDate() + 1);

                return {
                  icon: <UserIcon className="w-5 h-5" />,
                  title: leave.userId?.name || "Employé Inconnu",
                  category: leave.leaveType.toUpperCase(),
                  description: (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 opacity-80 text-sm">
                        <CalendarIcon className="w-4 h-4 text-[var(--neu-accent)]" />
                        <span>{sDate.toLocaleDateString("fr-FR")} - {eDate.toLocaleDateString("fr-FR")}</span>
                        <span className="font-semibold text-xs">({leave.totalDays} jours)</span>
                      </div>
                      <p className="text-xs text-[var(--neu-text-secondary)] font-normal">
                        <strong>Motif:</strong> {leave.reason}
                      </p>
                    </div>
                  ),
                  badge: getStatusBadge(leave.status),
                  actions: (
                    <div className="flex items-center gap-2">
                      <NeuButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveEditDoc({
                          userId: leave.userId?._id || leave.userId?.id || "",
                          name: leave.userId?.name || "Employé",
                          startDate: sDate.toISOString().split('T')[0],
                          endDate: eDate.toISOString().split('T')[0],
                          returnDate: rDate.toISOString().split('T')[0],
                          docType: "attestation_conge"
                        })}
                        title="Aperçu & Impression Attestation de Congé PDF"
                        className="border border-[var(--neu-border)] text-xs text-[var(--neu-accent)] font-medium"
                      >
                        <FileText className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Attestation PDF
                      </NeuButton>

                      {leave.status === "pending" && (
                        <>
                          <NeuButton
                            variant="accent"
                            size="sm"
                            disabled={actionLoading === leave._id}
                            onClick={() => handleApprove(leave._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Valider
                          </NeuButton>

                          <NeuButton
                            variant="danger"
                            size="sm"
                            disabled={actionLoading === leave._id}
                            onClick={() => handleReject(leave._id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Rejeter
                          </NeuButton>
                        </>
                      )}
                    </div>
                  )
                };
              })}
            />
          )}
        </NeuCardContent>
        {filteredLeaves.length > 0 && (
          <NeuPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLeaves.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </NeuCard>

      {/* Modal d'importation Excel des Demandes de Congés */}
      <NeuDialog
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
          setImportError(null);
        }}
        title="Importer des Demandes de Congés (.xlsx / .xls)"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--neu-text-secondary)]">
            Téléchargez le modèle Excel officiel ou importez un fichier contenant les colonnes :
            <span className="font-semibold block mt-1">Matricule, Type de Congé, Date de Début, Date de Fin, Motif, Statut</span>
          </p>

          <div className="space-y-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[var(--neu-text)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--neu-surface-light)] file:text-[var(--neu-text)] hover:file:bg-[var(--neu-accent)] hover:file:text-white transition-colors cursor-pointer"
            />
            {importFile && (
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                Fichier sélectionné : {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {importError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1 text-emerald-600">
              <p className="font-semibold">
                ✅ {importResult.imported} demande(s) de congé importée(s) avec succès !
              </p>
              {importResult.skipped > 0 && (
                <p className="text-amber-600">⚠️ {importResult.skipped} ligne(s) ignorée(s).</p>
              )}
              {importResult.errors.length > 0 && (
                <ul className="list-disc pl-4 text-[10px] text-rose-500 max-h-24 overflow-y-auto mt-1">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--neu-border)]">
            <NeuButton
              variant="ghost"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportResult(null);
                setImportError(null);
              }}
            >
              Fermer
            </NeuButton>
            <NeuButton
              variant="accent"
              disabled={!importFile || isSubmittingImport}
              onClick={handleImportExcel}
            >
              {isSubmittingImport ? "Importation en cours..." : "Lancer l'importation"}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>

      {/* Modal d'édition/impression Attestation de Congé */}
      {activeEditDoc && (
        <DocumentPreviewModal
          isOpen={!!activeEditDoc}
          onClose={() => setActiveEditDoc(null)}
          docType={activeEditDoc.docType}
          userId={activeEditDoc.userId}
          defaultName={activeEditDoc.name}
          startDate={activeEditDoc.startDate}
          endDate={activeEditDoc.endDate}
          returnDate={activeEditDoc.returnDate}
        />
      )}
    </div>
  );
}
