"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { FileText, Plus, Download, Search, CheckCircle, RefreshCw, Edit3 } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

import { NeuPagination } from "@/components/ui/neu-pagination";
import { ContractItemDTO, EmployeeOptionDTO } from "@/shared/types/contracts/contracts.contract";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractItemDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeOptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
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

  // Form State
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("CDI");
  const [category, setCategory] = useState("employe");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [baseSalary, setBaseSalary] = useState("0");
  const [sursalaire, setSursalaire] = useState("0");
  const [transportAllowance, setTransportAllowance] = useState("0");
  const [housingAllowance, setHousingAllowance] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEmployeeSelect = (selectedUserId: string) => {
    setUserId(selectedUserId);
    const emp = employees.find((e) => e.id === selectedUserId);
    if (emp) {
      setBaseSalary(emp.salary ? String(emp.salary) : "0");
      setSursalaire(emp.sursalaire ? String(emp.sursalaire) : "0");
      const tVal = emp.transportAllowance ?? emp.transport ?? 30000;
      setTransportAllowance(String(tVal));
      const hVal = emp.housingAllowance ?? 0;
      setHousingAllowance(String(hVal));
      if (emp.jobTitle) setJobTitle(emp.jobTitle);
      if (emp.category) setCategory(emp.category);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, []);

  const filteredContracts = contracts.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      const json = await res.json();
      if (json.success) {
        setContracts(json.data || []);
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
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          category,
          jobTitle,
          startDate,
          endDate: endDate || null,
          baseSalary: parseFloat(baseSalary) || 0,
          sursalaire: parseFloat(sursalaire) || 0,
          transportAllowance: parseFloat(transportAllowance) || 0,
          housingAllowance: parseFloat(housingAllowance) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchContracts();
      } else {
        alert(json.error || "Erreur lors de la création du contrat");
      }
    } catch (err) {
      console.error("Create contract error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async (targetUserId: string, docType: string) => {
    setDownloadingDoc(`${targetUserId}-${docType}`);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, docType }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docType}-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Erreur lors de la génération du document PDF.");
      }
    } catch (err) {
      console.error("Download PDF error:", err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <FileText className="text-[var(--neu-accent)]" /> Gestion des Contrats & Actes RH
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Établissez les contrats de travail (CDI, CDD, Stage) et générez les attestations RH au format PDF.
          </p>
        </div>
        <NeuButton onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} /> Nouveau Contrat
        </NeuButton>
      </div>

      {/* Filter / Search Bar */}
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

      {/* Contracts Table */}
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
                <th className="px-6 py-4 text-right">Actes RH (PDF)</th>
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
                    <td className="px-6 py-4 text-right space-x-2">
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
                          docType: "certificat"
                        })}
                        title="Éditer et Télécharger le Certificat de travail PDF"
                      >
                        <Download size={14} className="mr-1" /> Certificat
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

      {/* Modal Création Contrat */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
              <FileText className="text-[var(--neu-accent)]" /> Nouveau Contrat de Travail
            </h2>
            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Employé *</label>
                <NeuSelect value={userId} onChange={(e) => handleEmployeeSelect(e.target.value)} required>
                  <option value="">Sélectionner un employé...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </NeuSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Type de Contrat *</label>
                  <NeuSelect value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="CDI">CDI (Indéterminée)</option>
                    <option value="CDD">CDD (Déterminée)</option>
                    <option value="STAGE">STAGE</option>
                    <option value="FREELANCE">FREELANCE</option>
                  </NeuSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Catégorie RH</label>
                  <NeuSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="employe">Employé</option>
                    <option value="cadre">Cadre</option>
                    <option value="maitrise">Agent de Maîtrise</option>
                    <option value="ouvrier">Ouvrier</option>
                  </NeuSelect>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Intitulé du Poste *</label>
                <NeuInput
                  placeholder="ex: Comptable Général / Développeur Full-Stack"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Début *</label>
                  <NeuInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Fin (si CDD)</label>
                  <NeuInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Salaire de Base (FCFA) *</label>
                  <NeuInput type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Sursalaire (FCFA)</label>
                  <NeuInput type="number" value={sursalaire} onChange={(e) => setSursalaire(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Indemnité Transport (FCFA)</label>
                  <NeuInput type="number" value={transportAllowance} onChange={(e) => setTransportAllowance(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Indemnité Logement (FCFA)</label>
                  <NeuInput type="number" value={housingAllowance} onChange={(e) => setHousingAllowance(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
                <NeuButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton type="submit" disabled={submitting}>
                  {submitting ? "Création..." : "Établir le Contrat"}
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}

      {/* Modal Édition & Génération Document RH */}
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
          defaultJoiningDate={activeEditDoc.startDate}
          startDate={activeEditDoc.startDate}
          endDate={activeEditDoc.endDate || undefined}
          docType={activeEditDoc.docType}
        />
      )}
    </div>
  );
}
