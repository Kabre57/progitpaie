"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, XCircle, Calendar, FileText, Download, FileSpreadsheet, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/neu-toast";
import { ChipLoader } from "@/components/ui/chip-loader";
import { List2 } from "@/components/ui/list-2";
import { User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuPagination } from "@/components/ui/neu-pagination";

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

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  }, [filter]);

  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const paginatedLeaves = leaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/api/leaves/all?status=${filter}` : "/api/leaves/all";
      const response = await fetch(url);
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
          <NeuButton onClick={handleDownloadTemplate} variant="ghost" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-500" /> Modèle Excel
          </NeuButton>
          <NeuButton onClick={() => setShowImportModal(true)} variant="accent" size="sm">
            <Upload className="w-4 h-4 mr-1" /> Importer Excel (.xlsx)
          </NeuButton>
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 text-center rounded-lg text-sm capitalize transition-all duration-200 ${
              filter === f
                ? "bg-[var(--neu-accent)] text-white shadow-sm scale-105"
                : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)] hover:text-[var(--neu-text)]"
            }`}
          >
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Rejetés"}
          </button>
        ))}
      </div>

      {/* Leaves Table */}
      <NeuCard>
        <NeuCardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <ChipLoader label="Chargement des congés..." />
            </div>
          ) : leaves.length === 0 ? (
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
                      {leave.status === "approved" && (
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
                          title="Aperçu & Téléchargement Attestation PDF"
                        >
                          <FileText className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Attestation
                        </NeuButton>
                      )}

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
        {leaves.length > 0 && (
          <NeuPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={leaves.length}
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
