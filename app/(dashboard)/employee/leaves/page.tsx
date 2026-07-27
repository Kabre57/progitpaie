"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, XCircle, Clock } from "lucide-react";
import { List2 } from "@/components/ui/list-2";
import { NeuBadge } from "@/components/ui/neu-badge";

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
}

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({ annual: 0, sick: 0, casual: 0 });
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leavesRes, userRes] = await Promise.all([
        fetch("/api/leaves/my"),
        fetch("/api/auth/me"),
      ]);

      const leavesData = await leavesRes.json();
      const userData = await userRes.json();

      if (leavesData.success) setLeaves(leavesData.data);
      if (userData.success) setBalance(userData.data.leaveBalance || { annual: 0, sick: 0, casual: 0 });
    } catch (error) {
      console.error("Échec de la récupération des congés", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (response.ok && json.success) {
        setShowApplyModal(false);
        setFormData({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
        fetchData();
      } else {
        alert(json.error || "Erreur lors de l'envoi de la demande");
      }
    } catch (error) {
      console.error("Échec de l'envoi de la demande", error);
      alert("Erreur réseau lors de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/my?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Échec de l'annulation", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "success" as const;
      case "rejected": return "error" as const;
      default: return "warning" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approuvé";
      case "rejected": return "Refusé";
      default: return "En Attente";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "annual": return "Congé Payé Annuel";
      case "sick": return "Congé Maladie";
      case "casual": return "Permission Exceptionnelle";
      case "unpaid": return "Congé Non Payé";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--neu-text)]">Gestion des Congés</h2>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
            Effectuez vos demandes de congés et suivez l'état de vos soldes restants.
          </p>
        </div>
        <NeuButton onClick={() => setShowApplyModal(true)} variant="accent" className="w-full sm:w-auto">
          <Calendar className="w-4 h-4 mr-2" />
          Demander un Congé
        </NeuButton>
      </div>

      {/* Cartes de Soldes de Congés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">Congés Annuels Payés</p>
            <p className="text-3xl font-bold text-blue-600">{balance.annual}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">jours restants</p>
          </NeuCardContent>
        </NeuCard>
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">Congés Maladie</p>
            <p className="text-3xl font-bold text-green-600">{balance.sick}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">jours restants</p>
          </NeuCardContent>
        </NeuCard>
        <NeuCard>
          <NeuCardContent className="p-4 text-center">
            <p className="text-sm text-[var(--neu-text-secondary)]">Permissions Exceptionnelles</p>
            <p className="text-3xl font-bold text-purple-600">{balance.casual}</p>
            <p className="text-xs text-[var(--neu-text-secondary)]">jours restants</p>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Historique des Demandes de Congés */}
      <NeuCard>
        <NeuCardContent className="p-6">
          <h3 className="text-lg font-semibold text-[var(--neu-text)] mb-4">Historique des Demandes de Congés</h3>
          {leaves.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucune demande de congé"
              description="Vous n'avez pas encore soumis de demande de congé."
            />
          ) : (
            <List2 
              items={leaves.map((leave) => ({
                icon: <Calendar className="w-5 h-5 text-[var(--neu-accent)]" />,
                title: getLeaveTypeLabel(leave.leaveType),
                category: "DEMANDE DE CONGÉ",
                description: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 opacity-80 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(leave.startDate).toLocaleDateString("fr-FR")} au {new Date(leave.endDate).toLocaleDateString("fr-FR")}</span>
                      <span className="font-bold text-[var(--neu-accent)]">({leave.totalDays} jours)</span>
                    </div>
                    <div className="text-sm italic opacity-60 line-clamp-1">
                      "{leave.reason}"
                    </div>
                  </div>
                ),
                status: (
                  <div className="flex items-center gap-3">
                    <NeuBadge variant={getStatusBadgeVariant(leave.status)}>
                      {getStatusLabel(leave.status)}
                    </NeuBadge>
                    {leave.status === "pending" && (
                      <NeuButton
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCancel(leave._id)}
                        className="h-8 w-8 text-[var(--neu-danger)] hover:bg-[var(--neu-danger)]/10"
                        title="Annuler la demande"
                      >
                        <XCircle className="w-4 h-4" />
                      </NeuButton>
                    )}
                  </div>
                )
              }))}
            />
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Modal de Demande de Congé */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--neu-surface)] rounded-xl p-6 w-full max-w-md border border-[var(--neu-border)] shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--neu-text)] border-b border-[var(--neu-border)] pb-2">Formulaire de Demande de Congé</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Type de Congé *</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)] text-sm text-[var(--neu-text)]"
                >
                  <option value="annual">Congé Payé Annuel</option>
                  <option value="sick">Congé Maladie</option>
                  <option value="casual">Permission Exceptionnelle</option>
                  <option value="unpaid">Congé Non Payé</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Début *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)] text-sm text-[var(--neu-text)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Date de Fin *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)] text-sm text-[var(--neu-text)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-1">Motif de la demande *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="Précisez la raison de votre demande..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)] text-sm text-[var(--neu-text)]"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-[var(--neu-border)]">
                <NeuButton type="button" variant="ghost" onClick={() => setShowApplyModal(false)} className="flex-1">
                  Annuler
                </NeuButton>
                <NeuButton type="submit" variant="accent" loading={submitting} className="flex-1">
                  Soumettre la demande
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
