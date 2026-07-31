"use client";

import { useState, useEffect } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { UserX, Plus, RefreshCw, Calculator, FileText } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function SeverancePage() {
  const [severances, setSeverances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [userId, setUserId] = useState("");
  const [terminationType, setTerminationType] = useState("Licenciement du fait de l'Employeur");
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [noticeDays, setNoticeDays] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const [activeCertifDoc, setActiveCertifDoc] = useState<{
    userId: string;
    name: string;
    jobTitle?: string;
    department?: string;
    category?: string;
    joiningDate?: string;
    exitDate?: string;
  } | null>(null);

  useEffect(() => {
    fetchSeverances();
    fetchEmployees();
  }, []);

  const totalPages = Math.ceil(severances.length / itemsPerPage);
  const paginatedSeverances = severances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchSeverances = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/severance");
      const json = await res.json();
      if (json.success) {
        setSeverances(json.data || []);
      }
    } catch (err) {
      console.error("Fetch severance error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const handleCalculateSeverance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Veuillez sélectionner un employé");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/severance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          terminationType,
          exitDate,
          noticeDays: parseInt(noticeDays, 10),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchSeverances();
      } else {
        alert(json.error || "Erreur lors du calcul du solde de tout compte");
      }
    } catch (err) {
      console.error("Calculate severance error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <UserX className="text-[var(--neu-accent)]" /> Indemnités de Rupture & Certificat de Travail 
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Calculateur du Solde Tout Compte (Licenciement, CDD, Démission, Retraite) et édition du Certificat de Travail.
          </p>
        </div>
        <div className="flex gap-2">
          <NeuButton onClick={() => setShowModal(true)} variant="accent">
            <Plus size={16} className="mr-1" /> Calculer un Départ
          </NeuButton>
          <NeuButton onClick={fetchSeverances} variant="ghost">
            <RefreshCw size={16} />
          </NeuButton>
        </div>
      </div>

      {/* Severances List */}
      <NeuCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--neu-text)]">
            <thead className="bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-xs border-b border-[var(--neu-border)]">
              <tr>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Motif de la Rupture</th>
                <th className="px-6 py-4">Date de Sortie</th>
                <th className="px-6 py-4">Ancienneté</th>
                <th className="px-6 py-4">Indemnités & Préavis</th>
                <th className="px-6 py-4">Solde Net Tout Compte</th>
                <th className="px-6 py-4 text-center">Actions & Certificat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Chargement des soldes de tout compte...
                  </td>
                </tr>
              ) : severances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Aucun solde de tout compte enregistré.
                  </td>
                </tr>
              ) : (
                paginatedSeverances.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="font-bold">{s.user?.name}</div>
                      <div className="text-xs text-[var(--neu-text-secondary)]">{s.user?.employeeId || "EMP"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <NeuBadge variant={s.terminationType?.includes("Licenciement") ? "danger" : "warning"}>
                        {s.terminationType || "Départ"}
                      </NeuBadge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {new Date(s.exitDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {s.seniorityYears} ans
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div>Préavis: {(s.noticeIndemnity || 0).toLocaleString()} F</div>
                      <div>Licenc: {(s.severanceIndemnity || 0).toLocaleString()} F</div>
                      <div>Congés: {(s.leaveCompensation || 0).toLocaleString()} F</div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[var(--neu-accent)] text-base">
                      {(s.totalNetExit || 0).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 text-center">
                      <NeuButton
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setActiveCertifDoc({
                            userId: s.user?.id || s.userId,
                            name: s.user?.name || "Employé",
                            jobTitle: s.user?.jobTitle,
                            department: s.user?.department?.name,
                            category: s.user?.category,
                            joiningDate: s.user?.joiningDate,
                            exitDate: s.exitDate,
                          })
                        }
                        className="text-[var(--neu-accent)]"
                      >
                        <FileText className="w-4 h-4 mr-1" /> Certificat de Travail
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
          totalItems={severances.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Calculateur Solde de Tout Compte */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
              <Calculator className="text-[var(--neu-accent)]" /> Calculer un Solde Tout Compte  
            </h2>
            <form onSubmit={handleCalculateSeverance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Employé sur le Départ *</label>
                <NeuSelect
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  options={[
                    { value: "", label: "-- Sélectionner un salarié --" },
                    ...employees.map((e) => ({
                      value: e.id || e._id,
                      label: `${e.employeeId || "EMP"} - ${e.name}`,
                    })),
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Motif de la Rupture *</label>
                  <NeuSelect
                    value={terminationType}
                    onChange={(e) => setTerminationType(e.target.value)}
                    options={[
                      { value: "Licenciement du fait de l'Employeur", label: "Licenciement du fait de l'Employeur" },
                      { value: "Démission du Salarié", label: "Démission du Salarié" },
                      { value: "Fin de CDD / Terme de Contrat", label: "Fin de CDD / Terme de Contrat" },
                      { value: "Départ à la Retraite", label: "Départ à la Retraite" },
                      { value: "Licenciement pour Faute Lourde", label: "Licenciement pour Faute Lourde" },
                      { value: "Rupture Conventionnelle", label: "Rupture Conventionnelle d'Accord Partie" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Sortie Effective *</label>
                  <NeuInput type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Nombre de Jours de Préavis (Compensés)</label>
                <NeuInput type="number" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
                <NeuButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton type="submit" variant="accent" loading={submitting}>
                  Générer le Solde Net Tout Compte
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}

      {/* Certificat de Travail Modal */}
      {activeCertifDoc && (
        <DocumentPreviewModal
          isOpen={!!activeCertifDoc}
          onClose={() => setActiveCertifDoc(null)}
          userId={activeCertifDoc.userId}
          defaultName={activeCertifDoc.name}
          defaultJobTitle={activeCertifDoc.jobTitle}
          defaultDepartment={activeCertifDoc.department}
          defaultCategory={activeCertifDoc.category}
          defaultJoiningDate={activeCertifDoc.joiningDate}
          docType="certificat"
        />
      )}
    </div>
  );
}
