"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { CreditCard, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("PRET");
  const [amount, setAmount] = useState("100000");
  const [monthlyDeduction, setMonthlyDeduction] = useState("25000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLoans();
    fetchEmployees();
  }, []);

  const totalPages = Math.ceil(loans.length / itemsPerPage);
  const paginatedLoans = loans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loans");
      const json = await res.json();
      if (json.success) {
        setLoans(json.data || []);
      }
    } catch (err) {
      console.error("Fetch loans error:", err);
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

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          amount: parseFloat(amount),
          monthlyDeduction: parseFloat(monthlyDeduction),
          startDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchLoans();
      } else {
        alert(json.error || "Erreur lors de la création du prêt");
      }
    } catch (err) {
      console.error("Create loan error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <CreditCard className="text-[var(--neu-accent)]" /> Gestion des Prêts & Avances sur Salaire
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Accordez des prêts et des avances, avec prélèvement mensuel automatique sur le bulletin de paie.
          </p>
        </div>
        <NeuButton onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} /> Nouveau Prêt / Avance
        </NeuButton>
      </div>

      {/* Loans List */}
      <NeuCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--neu-text)]">
            <thead className="bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] uppercase text-xs border-b border-[var(--neu-border)]">
              <tr>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Capital Accordé</th>
                <th className="px-6 py-4">Retenue Mensuelle</th>
                <th className="px-6 py-4">Capital Restant Dû</th>
                <th className="px-6 py-4">Progression Remboursement</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Chargement des prêts en cours...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Aucun prêt ou avance en cours.
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((l) => {
                  const progress = Math.min(100, Math.round(((l.totalRepaid || 0) / l.amount) * 100));

                  return (
                    <tr key={l.id} className="hover:bg-[var(--neu-surface)]/50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div>{l.user?.name}</div>
                        <div className="text-xs text-[var(--neu-text-secondary)]">{l.user?.employeeId || "EMP"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <NeuBadge variant={l.type === "PRET" ? "info" : "warning"}>{l.type}</NeuBadge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--neu-accent)]">
                        {(l.amount || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {(l.monthlyDeduction || 0).toLocaleString()} FCFA / mois
                      </td>
                      <td className="px-6 py-4 font-semibold text-rose-400">
                        {(l.remainingAmount || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="w-full bg-[var(--neu-bg)] rounded-full h-2 overflow-hidden border border-[var(--neu-border)]">
                          <div className="bg-[var(--neu-accent)] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-xs text-[var(--neu-text-secondary)] mt-1">{progress}% remboursé</div>
                      </td>
                      <td className="px-6 py-4">
                        <NeuBadge variant={l.status === "active" ? "success" : "ghost"}>
                          {l.status === "active" ? "En cours" : "Soldé"}
                        </NeuBadge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={loans.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Création Prêt */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
              <CreditCard className="text-[var(--neu-accent)]" /> Octroyer un Prêt / Avance
            </h2>
            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Employé *</label>
                <NeuSelect value={userId} onChange={(e) => setUserId(e.target.value)} required>
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
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Type *</label>
                  <NeuSelect value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="PRET">Prêt Ordinaire</option>
                    <option value="AVANCE">Avance sur Salaire</option>
                  </NeuSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Mise en Place *</label>
                  <NeuInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Capital Accordé (FCFA) *</label>
                <NeuInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Retenue Mensuelle sur Paie (FCFA) *</label>
                <NeuInput type="number" value={monthlyDeduction} onChange={(e) => setMonthlyDeduction(e.target.value)} required />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
                <NeuButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton type="submit" disabled={submitting}>
                  {submitting ? "Création..." : "Valider le Prêt"}
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
