"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { FileText, Plus, Download, Search, CheckCircle, RefreshCw, Edit3, Trash2, AlertTriangle } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

import { NeuPagination } from "@/components/ui/neu-pagination";
import { useVisualNotice } from "@/components/ui/visual-notice-modal";
import { ContractItemDTO, EmployeeOptionDTO } from "@/shared/types/contracts/contracts.contract";
import { NewContractManagerModal } from "@/components/contracts/new-contract-manager-modal";

export default function ContractsPage() {
  const { showValidationSubmission, showErrorForm, showErrorTech } = useVisualNotice();
  const [contracts, setContracts] = useState<ContractItemDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeOptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [activeEditDoc, setActiveEditDoc] = useState<{
    userId: string;
    name: string;
    jobTitle?: string;
    salary?: number;
    sursalaire?: number;
    transport?: number;
    category?: string;
    contractType?: string;
    startDate?: string;
    endDate?: string | null;
    docType: "contract" | "attestation" | "certificat" | "payslip";
  } | null>(null);

  // État de confirmation de suppression
  const [contractToDelete, setContractToDelete] = useState<{ id: string; userName: string; jobTitle?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      const json = await res.json();
      if (json.success) {
        setContracts(json.data);
      }
    } catch (err) {
      console.error("Fetch contracts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, []);

  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const userName = c.user?.name || "";
    const title = c.jobTitle || "";
    return userName.toLowerCase().includes(term) || title.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteContractSubmit = async () => {
    if (!contractToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setContractToDelete(null);
        fetchContracts();
        showValidationSubmission({
          title: "CONTRAT SUPPRIMÉ",
          description: `Le contrat de travail pour ${contractToDelete.userName} a été supprimé avec succès.`,
          confirmLabel: "Fermer",
        });
      } else {
        showErrorForm({
          title: "SUPPRESSION IMPOSSIBLE",
          description: json.error || "Impossible de supprimer ce contrat.",
          confirmLabel: "Réessayer",
        });
      }
    } catch (err) {
      console.error("Delete contract error:", err);
      showErrorTech({
        title: "ERREUR SERVEUR",
        description: "Une erreur réseau est survenue lors de la suppression du contrat.",
        confirmLabel: "Fermer",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <FileText className="text-[var(--neu-accent)]" /> Gestion des Contrats & Actes RH
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Établissez les contrats de travail (CDI, CDD, Stage) et gérez les actes RH des salariés.
          </p>
        </div>
        <NeuButton onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} /> Nouveau Contrat
        </NeuButton>
      </div>

      {/* Barre de Filtre / Recherche */}
      <NeuCard className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-lg text-sm text-[var(--neu-text)] focus:outline-none focus:border-[var(--neu-accent)]"
          />
        </div>
        <NeuButton onClick={fetchContracts} variant="ghost" className="flex items-center gap-2 text-sm">
          <RefreshCw size={16} /> Actualiser
        </NeuButton>
      </NeuCard>

      {/* Tableau des Contrats */}
      <NeuCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--neu-text)]">
            <thead className="bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] uppercase text-xs border-b border-[var(--neu-border)]">
              <tr>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Poste & Catégorie</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Salaire de Base</th>
                <th className="px-6 py-4">Indemnités</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actes RH (PDF) & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Chargement des contrats en cours...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Aucun contrat de travail trouvé.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--neu-surface)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div>{c.user?.name}</div>
                      <div className="text-xs text-[var(--neu-text-secondary)]">{c.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{c.jobTitle}</div>
                      <div className="text-xs text-[var(--neu-text-secondary)] capitalize">{c.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <NeuBadge variant={c.type === "CDI" ? "success" : c.type === "CDD" ? "warning" : "info"}>
                        {c.type}
                      </NeuBadge>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--neu-accent)]">
                      {(c.baseSalary || 0).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--neu-text-secondary)] space-y-1">
                      <div>Transp: {(c.transportAllowance || 0).toLocaleString()} F</div>
                      <div>Logem: {(c.housingAllowance || 0).toLocaleString()} F</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/10 text-gray-400"}`}>
                        <CheckCircle size={12} /> {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <NeuButton
                        size="sm"
                        variant="accent"
                        onClick={() => setActiveEditDoc({
                          userId: typeof c.userId === "object" ? c.userId.id : c.userId,
                          name: c.user?.name || "",
                          jobTitle: c.jobTitle,
                          salary: c.baseSalary,
                          sursalaire: c.sursalaire,
                          transport: c.transportAllowance,
                          category: c.category,
                          contractType: c.type,
                          startDate: c.startDate,
                          endDate: c.endDate || undefined,
                          docType: "contract"
                        })}
                        title="Éditer et Télécharger le Contrat de travail PDF"
                      >
                        <Edit3 size={14} className="mr-1" /> Contrat
                      </NeuButton>
                      <NeuButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveEditDoc({
                          userId: typeof c.userId === "object" ? c.userId.id : c.userId,
                          name: c.user?.name || "",
                          jobTitle: c.jobTitle,
                          salary: c.baseSalary,
                          sursalaire: c.sursalaire,
                          transport: c.transportAllowance,
                          category: c.category,
                          contractType: c.type,
                          startDate: c.startDate,
                          endDate: c.endDate || undefined,
                          docType: "attestation"
                        })}
                        title="Éditer et Télécharger l'Attestation de travail PDF"
                      >
                        <FileText size={14} className="mr-1" /> Attestation
                      </NeuButton>

                      <NeuButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setContractToDelete({
                          id: c.id,
                          userName: c.user?.name || "Salarié",
                          jobTitle: c.jobTitle,
                        })}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold ml-1"
                        title="Supprimer ce contrat de travail"
                      >
                        <Trash2 size={14} className="mr-1 text-red-500" /> Supprimer
                      </NeuButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredContracts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Nouveau Contrat */}
      <NewContractManagerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employees={employees}
        onSuccess={fetchContracts}
      />

      {/* Modal Aperçu & Édition Document */}
      {activeEditDoc && (
        <DocumentPreviewModal
          isOpen={!!activeEditDoc}
          onClose={() => setActiveEditDoc(null)}
          userId={activeEditDoc.userId}
          defaultName={activeEditDoc.name}
          defaultJobTitle={activeEditDoc.jobTitle}
          defaultSalary={activeEditDoc.salary}
          defaultSursalaire={activeEditDoc.sursalaire}
          defaultTransport={activeEditDoc.transport}
          defaultCategory={activeEditDoc.category}
          defaultContractType={activeEditDoc.contractType}
          startDate={activeEditDoc.startDate}
          endDate={activeEditDoc.endDate || undefined}
          docType={activeEditDoc.docType}
        />
      )}

      {/* Modal de confirmation de suppression de contrat */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Supprimer ce contrat ?
                </h3>
                <p className="text-xs text-slate-500">Annulation d'un contrat de travail</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Voulez-vous vraiment supprimer le contrat de travail de{" "}
              <strong className="text-slate-900 dark:text-slate-100">{contractToDelete.userName}</strong>
              {contractToDelete.jobTitle ? ` (${contractToDelete.jobTitle})` : ""} ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton
                variant="outline"
                onClick={() => setContractToDelete(null)}
                className="text-xs px-4"
              >
                Annuler
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={handleDeleteContractSubmit}
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
    </div>
  );
}
