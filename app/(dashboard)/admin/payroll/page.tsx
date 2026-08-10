"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DollarSign, Download, User as UserIcon, TrendingUp, Edit3, Printer } from "lucide-react";
import { ChipLoader } from "@/components/ui/chip-loader";
import { List2 } from "@/components/ui/list-2";
import { NeuBadge } from "@/components/ui/neu-badge";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

import { NeuPagination } from "@/components/ui/neu-pagination";
import { useVisualNotice } from "@/components/ui/visual-notice-modal";

interface PayrollRecord {
  _id: string;
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
  const { showValidationPayment, showErrorForm, showErrorTech } = useVisualNotice();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
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
        a.download = `bulletins-groupes-${month}-${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erreur lors de l'exportation groupée des bulletins de salaire");
      }
    } catch (err) {
      console.error("Bulk export error:", err);
    } finally {
      setDownloadingBulk(false);
    }
  };

  return (
    <div className="relative space-y-6" style={{ minHeight: "400px" }}>
      {loading && <ChipLoader overlay size="md" label="Chargement de la paie..." />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="text-[var(--neu-accent)]" /> Livre de Paie Mensuel & Édition de Bulletins
          </h2>
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
                className="border border-[var(--neu-border)]"
              >
                <Printer className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Aperçu Groupé A4
              </NeuButton>
              <NeuButton onClick={handleBulkPayslipExport} loading={downloadingBulk} variant="ghost" className="border border-[var(--neu-border)]">
                <Download className="w-4 h-4 mr-1 text-[var(--neu-accent)]" /> Édition Groupée PDF
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
              description={`Aucun bulletin pour ${new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" })} ${year}. Cliquez sur "Générer la Paie du Mois" pour calculer.`}
            />
          ) : (
            <List2 
              items={paginatedPayroll.map((record) => {
                const userIdVal = record.userId?.id || record.userId?._id || "";
                return {
                  icon: <UserIcon className="w-5 h-5 text-[var(--neu-accent)]" />,
                  title: record.user?.name || record.userId?.name || "Salarié",
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
                            onClick={() => handleFinalize(record._id)}
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
                            name: record.userId?.name || "",
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
                La période légale autorisée par votre entreprise s'ouvre le <strong>{earlyRestrictionData.startDayOfMonth} du mois</strong>.
              </p>
            </div>

            {earlyRestrictionData.requiresJustification ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--neu-text-secondary)]">
                  Justification / Motif de la Génération Anticipée * (min. 10 caractères)
                </label>
                <textarea
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  placeholder="ex: Fermeture annuelle anticipée de l'entreprise, vacances collectives de fin d'année..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-xs text-[var(--neu-text)] focus:outline-none focus:border-[var(--neu-accent)]"
                />
                <p className="text-[10px] opacity-70 text-[var(--neu-text-secondary)]">
                  ℹ️ Cette justification sera enregistrée dans les journaux d'audit de l'entreprise.
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
              <NeuButton
                variant="ghost"
                onClick={() => {
                  setShowJustificationModal(false);
                  setJustificationReason("");
                  setEarlyRestrictionData(null);
                }}
              >
                Annuler
              </NeuButton>
              {earlyRestrictionData.requiresJustification && (
                <NeuButton
                  variant="accent"
                  disabled={generating || justificationReason.trim().length < 10}
                  onClick={() => handleGenerate(justificationReason.trim())}
                >
                  {generating ? "Traitement..." : "Débloquer & Générer la Paie"}
                </NeuButton>
              )}
            </div>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
