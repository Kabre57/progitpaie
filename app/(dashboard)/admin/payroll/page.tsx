"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DollarSign, Download, User as UserIcon, TrendingUp, Edit3, Printer, Trash2, AlertTriangle } from "lucide-react";
import { List2 } from "@/components/ui/list-2";
import { NeuBadge } from "@/components/ui/neu-badge";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

import { NeuPagination } from "@/components/ui/neu-pagination";
import { useVisualNotice } from "@/components/ui/visual-notice-modal";

interface PayrollRecord {
  _id: string;
  id?: string;
  userId: { _id: string; id?: string; name: string; email?: string; employeeId?: string };
  user?: { id: string; name: string; email: string; employeeId?: string };
  month: number;
  year: number;
  basicSalary: number;
  sursalaire?: number;
  transportAllowance?: number;
  presentDays: number;
  absentDeduction: number;
  lateDeduction: number;
  bonuses: number;
  grossSalary?: number;
  itsTax?: number;
  igrTax?: number;
  cnpsEmployee?: number;
  netSalary: number;
  status: "draft" | "finalized";
}

export default function AdminPayrollPage() {
  const { showValidationPayment, showErrorForm, showErrorTech, showValidationSubmission } = useVisualNotice();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  // Modales de confirmation de suppression
  const [bulletinToDelete, setBulletinToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showResetMonthModal, setShowResetMonthModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activeEditDoc, setActiveEditDoc] = useState<{
    userId: string;
    name: string;
    salary: number;
    docType: "payslip";
  } | null>(null);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const data = await response.json();
      if (data.success) {
        setPayroll(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch payroll", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const totalPages = Math.ceil(payroll.length / itemsPerPage);
  const paginatedPayroll = payroll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationReason, setJustificationReason] = useState("");
  const [earlyRestrictionData, setEarlyRestrictionData] = useState<{
    error: string;
    startDayOfMonth: number;
    requiresJustification: boolean;
  } | null>(null);

  const handleGenerate = async (justification?: string) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, justification }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowJustificationModal(false);
        setJustificationReason("");
        setEarlyRestrictionData(null);
        fetchPayroll();
        showValidationPayment({
          title: "PAIE GÉNÉRÉE AVEC SUCCÈS",
          description: data.message || `Le calcul de la paie pour ${month}/${year} a bien été effectué et enregistré.`,
          confirmLabel: "Consulter les bulletins",
        });
      } else if (data.code === "EARLY_PAYROLL_RESTRICTION") {
        setEarlyRestrictionData({
          error: data.error,
          startDayOfMonth: data.startDayOfMonth || 25,
          requiresJustification: data.requiresJustification ?? true,
        });
        setShowJustificationModal(true);
      } else {
        showErrorForm({
          title: "ACTION IMPOSSIBLE",
          description: data.error || "Impossible de générer la paie du mois.",
          confirmLabel: "Fermer",
        });
      }
    } catch (error) {
      console.error("Failed to generate payroll", error);
      showErrorTech({
        title: "OUPS ! UNE ERREUR EST SURVENUE",
        description: "Le serveur ne répond pas. Veuillez réessayer dans un instant.",
        confirmLabel: "Réessayer",
        secondaryLabel: "Retour",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        fetchPayroll();
      }
    } catch (error) {
      console.error("Failed to finalize payroll", error);
    }
  };

  const handleDeleteSingleBulletin = async () => {
    if (!bulletinToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payroll/${bulletinToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBulletinToDelete(null);
        fetchPayroll();
        showValidationSubmission({
          title: "BULLETIN SUPPRIMÉ",
          description: `Le bulletin de paie pour ${bulletinToDelete.name} a été supprimé.`,
          confirmLabel: "Fermer",
        });
      } else {
        showErrorForm({
          title: "SUPPRESSION IMPOSSIBLE",
          description: json.error || "Impossible de supprimer ce bulletin.",
          confirmLabel: "Fermer",
        });
      }
    } catch (err) {
      console.error("Delete bulletin error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetMonthPayrollSubmit = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowResetMonthModal(false);
        fetchPayroll();
        showValidationSubmission({
          title: "PAIE DU MOIS RÉINITIALISÉE",
          description: json.message || `La paie de ${month}/${year} a été réinitialisée et supprimée.`,
          confirmLabel: "Fermer",
        });
      } else {
        showErrorForm({
          title: "RÉINITIALISATION IMPOSSIBLE",
          description: json.error || "Impossible de réinitialiser la paie du mois.",
          confirmLabel: "Fermer",
        });
      }
    } catch (err) {
      console.error("Reset month payroll error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const downloadPayslip = (userId: string) => {
    window.open(`/api/export/payslip/${userId}?month=${month}&year=${year}`, "_blank");
  };

  const handleBulkPayslipExport = async () => {
    setDownloadingBulk(true);
    try {
      const res = await fetch(`/api/export/payslip/bulk?month=${month}&year=${year}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Bulletins-Paie-${month}-${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erreur lors du téléchargement des bulletins groupés.");
      }
    } catch (err) {
      console.error("Bulk export error:", err);
    } finally {
      setDownloadingBulk(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <DollarSign className="text-[var(--neu-accent)]" /> Livre de Paie Mensuel & Édition de Bulletins
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Gestion du Livre de Paie et Édition Groupée des Bulletins de Paie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm font-semibold outline-none transition-colors hover:border-[var(--neu-accent)]/50 focus:border-[var(--neu-accent)] text-[var(--neu-text)]"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm font-semibold outline-none transition-colors hover:border-[var(--neu-accent)]/50 focus:border-[var(--neu-accent)] text-[var(--neu-text)]"
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {payroll.length > 0 && (
            <>
              <NeuButton
                onClick={() =>
                  setActiveEditDoc({
                    userId: payroll[0]?.userId?._id || payroll[0]?.userId?.id || "",
                    name: "BULLETINS GROUPÉS DU MOIS",
                    salary: payroll.reduce((sum, r) => sum + r.netSalary, 0),
                    docType: "payslip",
                  })
                }
                variant="ghost"
                className="border border-[var(--neu-border)] text-xs"
              >
                <Printer className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Aperçu A4
              </NeuButton>
              <NeuButton onClick={handleBulkPayslipExport} loading={downloadingBulk} variant="ghost" className="border border-[var(--neu-border)] text-xs">
                <Download className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Édition PDF
              </NeuButton>

              <NeuButton
                onClick={() => setShowResetMonthModal(true)}
                variant="ghost"
                className="border border-red-200 dark:border-red-900 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold"
                title="En cas d'erreur, réinitialisez et supprimez le calcul de paie de ce mois pour pouvoir tout recommencer."
              >
                <Trash2 className="w-4 h-4 mr-1" /> Supprimer Paie du Mois
              </NeuButton>
            </>
          )}

          <NeuButton onClick={() => handleGenerate()} loading={generating} variant="accent">
            <DollarSign className="w-4 h-4 mr-1" />
            Générer la Paie du Mois
          </NeuButton>
        </div>
      </div>

      {/* Payroll Table */}
      <NeuCard>
        <NeuCardContent className="p-6">
          {payroll.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Aucun bulletin de paie généré"
              description={`Aucun bulletin pour ${monthName} ${year}. Cliquez sur "Générer la Paie du Mois" pour calculer.`}
            />
          ) : (
            <List2 
              items={paginatedPayroll.map((record) => {
                const recordId = record._id || record.id || "";
                const userIdVal = record.userId?.id || record.userId?._id || "";
                const employeeName = record.user?.name || record.userId?.name || "Salarié";

                return {
                  icon: <UserIcon className="w-5 h-5 text-[var(--neu-accent)]" />,
                  title: employeeName,
                  category: record.user?.employeeId || record.userId?.employeeId || record.user?.email || record.userId?.email || "EMP",
                  description: (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                        <span className="text-[var(--neu-text)]">Base: {record.basicSalary?.toLocaleString()} F</span>
                        <span className="text-rose-500">
                          -Retenues ITS/CNPS: {((record.itsTax || 0) + (record.cnpsEmployee || 0)).toLocaleString()} F
                        </span>
                        <span className="text-emerald-500 font-bold">
                          Transport non imposable: {(record.transportAllowance || 30000).toLocaleString()} F
                        </span>
                      </div>
                      <div className="text-xl font-black text-[var(--neu-text)]">
                        Net: <span className="text-[var(--neu-accent)]">{record.netSalary.toLocaleString()} FCFA</span>
                        <span className="text-xs font-normal opacity-50 ml-2">({record.presentDays} Jours travaillés)</span>
                      </div>
                    </div>
                  ),
                  status: (
                    <div className="flex items-center gap-2">
                      <NeuBadge variant={record.status === "finalized" ? "success" : "warning"}>
                        {record.status === "finalized" ? "VALIDÉ" : "BROUILLON"}
                      </NeuBadge>
                      <div className="flex items-center gap-1 ml-2">
                        {record.status === "draft" && (
                          <NeuButton
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFinalize(recordId)}
                            className="h-8 w-8 text-[var(--neu-accent)] hover:bg-[var(--neu-accent)]/10"
                            title="Valider la Paie"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </NeuButton>
                        )}
                        <NeuButton
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveEditDoc({
                            userId: userIdVal,
                            name: employeeName,
                            salary: record.netSalary,
                            docType: "payslip"
                          })}
                          title="Éditer et Télécharger le Bulletin de Salaire PDF"
                        >
                          <Edit3 className="w-4 h-4 mr-1" /> Éditer Bulletin
                        </NeuButton>
                        <NeuButton
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadPayslip(userIdVal)}
                          className="h-8 w-8 opacity-70 hover:opacity-100"
                          title="Télécharger PDF Rapide"
                        >
                          <Download className="w-4 h-4" />
                        </NeuButton>

                        <NeuButton
                          size="icon"
                          variant="ghost"
                          onClick={() => setBulletinToDelete({ id: recordId, name: employeeName })}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Supprimer ce bulletin de paie (en cas d'erreur de calcul)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </NeuButton>
                      </div>
                    </div>
                  )
                };
              })}
            />
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={payroll.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Édition & Génération Bulletin de Salaire */}
      {activeEditDoc && (
        <DocumentPreviewModal
          isOpen={!!activeEditDoc}
          onClose={() => setActiveEditDoc(null)}
          userId={activeEditDoc.userId}
          defaultName={activeEditDoc.name}
          defaultSalary={activeEditDoc.salary}
          docType={activeEditDoc.docType}
        />
      )}

      {/* Modal Dérogation & Justification Génération Anticipée de la Paie */}
      {showJustificationModal && earlyRestrictionData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
              🛡️ Période & Dérogation de Génération de Paie
            </h2>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold">{earlyRestrictionData.error}</p>
              <p className="opacity-80">
                La période réglementaire recommandée débute le {earlyRestrictionData.startDayOfMonth} du mois. Pour générer avant cette date, veuillez fournir un motif de dérogation RH validé.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motif obligatoire de la dérogation anticipée *
              </label>
              <textarea
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                placeholder="Exemple : Clôture anticipée demandée par la direction financière / départ en congés massif..."
                className="w-full h-24 p-3 text-xs bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-xl outline-none focus:border-[var(--neu-accent)] text-[var(--neu-text)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton
                variant="outline"
                onClick={() => {
                  setShowJustificationModal(false);
                  setEarlyRestrictionData(null);
                }}
                className="text-xs px-4"
              >
                Annuler
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={() => handleGenerate(justificationReason)}
                disabled={!justificationReason.trim() || generating}
                className="text-xs px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {generating ? "Génération en cours…" : "Valider la Dérogation"}
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      )}

      {/* Modal Confirmation Suppression Bulletin Individuel */}
      {bulletinToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Supprimer ce bulletin de paie ?
                </h3>
                <p className="text-xs text-slate-500">Correction d'une erreur de calcul</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Voulez-vous vraiment supprimer le bulletin de paie de{" "}
              <strong className="text-slate-900 dark:text-slate-100">{bulletinToDelete.name}</strong> pour le mois de {monthName} {year} ? Vous pourrez ensuite relancer le calcul si nécessaire.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton
                variant="outline"
                onClick={() => setBulletinToDelete(null)}
                className="text-xs px-4"
              >
                Annuler
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={handleDeleteSingleBulletin}
                disabled={deleting}
                className="text-xs px-4 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Suppression…" : "Confirmer la suppression"}
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      )}

      {/* Modal Confirmation Réinitialisation Globale de la Paie du Mois */}
      {showResetMonthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Réinitialiser la paie de {monthName} {year} ?
                </h3>
                <p className="text-xs text-slate-500">Suppression des calculs de paie brouillons</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
              <p className="font-bold mb-1">⚠️ Action de réinitialisation en cas d'erreur :</p>
              <p>
                Cette action supprimera tous les bulletins brouillons générés pour la période de <strong>{monthName} {year}</strong>. Vous pourrez ensuite réajuster les données et cliquer à nouveau sur "Générer la Paie du Mois".
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton
                variant="outline"
                onClick={() => setShowResetMonthModal(false)}
                className="text-xs px-4"
              >
                Annuler
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={handleResetMonthPayrollSubmit}
                disabled={deleting}
                className="text-xs px-4 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Réinitialisation…" : "Réinitialiser & Supprimer la Paie du Mois"}
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
