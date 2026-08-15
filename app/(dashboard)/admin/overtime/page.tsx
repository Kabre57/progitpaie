"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { Timer, CheckCircle, XCircle, Clock, RefreshCw, Plus, AlertTriangle } from "lucide-react";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuPagination } from "@/components/ui/neu-pagination";
import { OvertimeFilterBar } from "@/components/admin/overtime/OvertimeFilterBar";

const getMonthName = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

const getPreviousMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const getNextMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

interface OvertimeEmployee {
  id: string;
  name: string;
  employeeId?: string | null;
  email?: string | null;
  salary?: number | null;
  jobTitle?: string | null;
  service?: string | null;
  direction?: string | null;
}

interface OvertimeRecord {
  id: string;
  date: string;
  minutes: number;
  rate: number;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  user?: OvertimeEmployee | null;
}

export default function OvertimePage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<OvertimeEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [currentMonth, setCurrentMonth] = useState<string>(defaultMonth);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // State pour la justification obligatoire des mois passés
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [selectedOvertimeForJustification, setSelectedOvertimeForJustification] = useState<OvertimeRecord | null>(null);
  const [justificationReason, setJustificationReason] = useState("");

  // Form State for 5 legal tranches
  const [selectedUserId, setSelectedUserId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours15, setHours15] = useState("0"); // +15% (41h à 46h)
  const [hours50, setHours50] = useState("0"); // +50% (au-delà 46h)
  const [hours75Night, setHours75Night] = useState("0"); // +75% (Nuit semaine)
  const [hours75Sunday, setHours75Sunday] = useState("0"); // +75% (Jour Dimanche/Férié)
  const [hours100SundayNight, setHours100SundayNight] = useState("0"); // +100% (Nuit Dimanche/Férié)
  const [reason, setReason] = useState("Travail supplémentaire exceptionnel");

  useEffect(() => {
    fetchOvertimes();
    fetchEmployees();
  }, []);

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overtime");
      const json = await res.json();
      if (json.success) {
        setOvertimes(json.data || []);
      }
    } catch (err) {
      console.error("Fetch overtime error:", err);
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

  // Détermine si un pointage appartient à un mois antérieur
  const isRecordPastMonth = (dateStr: string) => {
    const recordMonth = new Date(dateStr).toISOString().slice(0, 7);
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return recordMonth < nowMonth;
  };

  // Logique de filtrage des heures supplémentaires
  const filteredOvertimes = overtimes.filter((o) => {
    if (currentMonth) {
      const oMonth = new Date(o.date).toISOString().slice(0, 7);
      if (oMonth !== currentMonth) return false;
    }
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (rateFilter !== "all") {
      const targetRate = Number(rateFilter);
      if (Math.abs(o.rate - targetRate) > 0.05) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const empName = (o.user?.name || "").toLowerCase();
      const empId = (o.user?.employeeId || o.user?.email || "").toLowerCase();
      const reasonStr = (o.reason || "").toLowerCase();
      if (!empName.includes(q) && !empId.includes(q) && !reasonStr.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOvertimes.length / itemsPerPage);
  const paginatedOvertimes = filteredOvertimes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleValidateClick = (o: OvertimeRecord) => {
    if (isRecordPastMonth(o.date)) {
      setSelectedOvertimeForJustification(o);
      setJustificationReason("");
      setShowJustificationModal(true);
    } else {
      handleApproveReject(o.id, "approve");
    }
  };

  const handleConfirmPastMonthApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOvertimeForJustification) return;
    if (justificationReason.trim().length < 5) {
      alert("La justification doit contenir au moins 5 caractères.");
      return;
    }

    await handleApproveReject(selectedOvertimeForJustification.id, "approve", justificationReason.trim());
    setShowJustificationModal(false);
    setSelectedOvertimeForJustification(null);
    setJustificationReason("");
  };

  const handleApproveReject = async (id: string, action: "approve" | "reject", justification?: string) => {
    try {
      const res = await fetch(`/api/overtime/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, justification }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOvertimes();
      } else {
        alert(json.error || "Erreur lors de la validation");
      }
    } catch (err) {
      console.error("Approve overtime error:", err);
    }
  };

  const handleCreateOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert("Veuillez sélectionner un employé");
      return;
    }

    setSubmitting(true);
    try {
      const h15 = Number(hours15) || 0;
      const h50 = Number(hours50) || 0;
      const h75n = Number(hours75Night) || 0;
      const h75d = Number(hours75Sunday) || 0;
      const h100 = Number(hours100SundayNight) || 0;

      const totalMinutes = Math.round((h15 + h50 + h75n + h75d + h100) * 60);

      let rate = 1.15;
      if (h100 > 0) rate = 2.0;
      else if (h75n > 0 || h75d > 0) rate = 1.75;
      else if (h50 > 0) rate = 1.5;

      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          date,
          minutes: totalMinutes,
          rate,
          reason: `${reason} (+15%:${h15}h, +50%:${h50}h, +75%Nuit:${h75n}h, +75%Dim:${h75d}h, +100%:${h100}h)`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        fetchOvertimes();
      } else {
        alert(json.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Create overtime error:", err);
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
            <Timer className="text-[var(--neu-accent)]" /> Heures Supplémentaires & Majorations
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Calcul et validation des 5 tranches légales de majoration (+15%, +50%, +75% Nuit, +75% Dimanche/Férié, +100% Nuit Férié).
          </p>
        </div>
        <div className="flex gap-2">
          <NeuButton onClick={() => setShowAddModal(true)} variant="accent">
            <Plus size={16} className="mr-1" /> Saisir Heures Supp
          </NeuButton>
          <NeuButton onClick={fetchOvertimes} variant="ghost" title="Rafraîchir">
            <RefreshCw size={16} />
          </NeuButton>
        </div>
      </div>

      {/* Barre de Filtrage */}
      <OvertimeFilterBar
        currentMonth={currentMonth}
        getMonthName={getMonthName}
        getPreviousMonth={getPreviousMonth}
        getNextMonth={getNextMonth}
        onMonthChange={(m) => {
          setCurrentMonth(m);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
        }}
        rateFilter={rateFilter}
        onRateFilterChange={(r) => {
          setRateFilter(r);
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      {/* Liste des Heures Supplémentaires */}
      <NeuCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--neu-text)]">
            <thead className="bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-xs border-b border-[var(--neu-border)]">
              <tr>
                <th className="px-6 py-4">Salarié</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Durée Travaillée</th>
                <th className="px-6 py-4">Taux de Majoration</th>
                <th className="px-6 py-4">Motif & Tranches</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Chargement des heures supplémentaires...
                  </td>
                </tr>
              ) : filteredOvertimes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--neu-text-secondary)]">
                    Aucune heure supplémentaire trouvée pour cette sélection.
                  </td>
                </tr>
              ) : (
                paginatedOvertimes.map((o) => {
                  const hours = (o.minutes / 60).toFixed(1);
                  const ratePercent = Math.round((o.rate - 1) * 100);
                  const isPast = isRecordPastMonth(o.date);

                  return (
                    <tr key={o.id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="font-bold">{o.user?.name || "Salarié"}</div>
                        <div className="text-xs text-[var(--neu-text-secondary)] font-mono">
                          {o.user?.employeeId || o.user?.email || "EMP"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="flex items-center gap-1">
                          {new Date(o.date).toLocaleDateString("fr-FR")}
                          {isPast && (
                            <span className="text-[10px] text-amber-500 font-semibold px-1 py-0.5 rounded bg-amber-500/10" title="Mois antérieur (Justification requise)">
                              Mois Passé
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--neu-accent)]">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {hours}h ({o.minutes} min)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <NeuBadge variant="info">+{ratePercent}%</NeuBadge>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs text-[var(--neu-text-secondary)]">
                        {o.reason}
                      </td>
                      <td className="px-6 py-4">
                        <NeuBadge
                          variant={
                            o.status === "approved" ? "success" : o.status === "rejected" ? "danger" : "warning"
                          }
                        >
                          {o.status === "approved" ? "VALIDÉ" : o.status === "rejected" ? "REJETÉ" : "EN ATTENTE"}
                        </NeuBadge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {o.status === "pending" && (
                          <>
                            <NeuButton
                              size="sm"
                              onClick={() => handleValidateClick(o)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              title={isPast ? "Mois passé : Justification obligatoire" : "Valider"}
                            >
                              <CheckCircle size={14} className="mr-1" /> Valider
                            </NeuButton>
                            <NeuButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveReject(o.id, "reject")}
                              className="text-rose-400 hover:bg-rose-500/10"
                            >
                              <XCircle size={14} className="mr-1" /> Rejeter
                            </NeuButton>
                          </>
                        )}
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
          totalItems={filteredOvertimes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Justification Obligatoire pour Mois Passé */}
      <NeuDialog
        open={showJustificationModal}
        onClose={() => setShowJustificationModal(false)}
        title="Justification Obligatoire (Mois Passé)"
      >
        <form onSubmit={handleConfirmPastMonthApproval} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 font-medium flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-semibold">Pointage d'un mois passé sélectionné</p>
              <p className="mt-1">
                Ce pointage d'heures supplémentaires appartient à un mois antérieur à la période en cours.
                Une justification explicite est <strong>obligatoire</strong> pour autoriser la régularisation et déverrouiller le bouton <strong>Valider</strong>.
              </p>
            </div>
          </div>

          {selectedOvertimeForJustification && (
            <div className="text-xs space-y-1 text-[var(--neu-text-secondary)] bg-[var(--neu-surface-light)] p-3 rounded-lg border border-[var(--neu-border)]">
              <p><strong>Salarié :</strong> {selectedOvertimeForJustification.user?.name} ({selectedOvertimeForJustification.user?.employeeId || "EMP"})</p>
              <p><strong>Date du pointage :</strong> {new Date(selectedOvertimeForJustification.date).toLocaleDateString("fr-FR")}</p>
              <p><strong>Durée / Majoration :</strong> {(selectedOvertimeForJustification.minutes / 60).toFixed(1)}h (+{Math.round((selectedOvertimeForJustification.rate - 1) * 100)}%)</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--neu-text)]">Motif / Justification de Régularisation *</label>
            <textarea
              rows={3}
              value={justificationReason}
              onChange={(e) => setJustificationReason(e.target.value)}
              placeholder="Ex: Régularisation exceptionnelle suite audit des temps de présence RH..."
              className="w-full p-2.5 text-xs rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface)] text-[var(--neu-text)] focus:ring-2 focus:ring-[var(--neu-accent)] focus:outline-none"
              required
            />
            <p className="text-[10px] text-[var(--neu-text-secondary)] flex justify-between">
              <span>Au moins 5 caractères requis pour activer le bouton <strong>Valider</strong></span>
              <span className={justificationReason.trim().length >= 5 ? "text-emerald-500 font-bold" : "text-rose-400"}>
                {justificationReason.trim().length}/5
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <NeuButton type="button" variant="ghost" onClick={() => setShowJustificationModal(false)}>
              Annuler
            </NeuButton>
            <NeuButton
              type="submit"
              variant="accent"
              disabled={justificationReason.trim().length < 5}
              className={justificationReason.trim().length < 5 ? "opacity-50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              Valider la Régularisation
            </NeuButton>
          </div>
        </form>
      </NeuDialog>

      {/* Modal Saisie Heures Supp */}
      <NeuDialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Saisie des Heures Supplémentaires (5 Tranches Légales)">
        <form onSubmit={handleCreateOvertime} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NeuSelect
              label="Sélectionner le Salarié *"
              options={[
                { value: "", label: "-- Choisir un salarié --" },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.name} (${e.employeeId || e.email})`,
                })),
              ]}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            />
            <NeuInput
              type="date"
              label="Date *"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {selectedUserId && (() => {
            const emp = employees.find((x) => x.id === selectedUserId);
            if (!emp) return null;
            const hourlyRate = emp.salary ? Math.round(emp.salary / 173.33) : 0;
            return (
              <div className="p-3 bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-xl text-xs space-y-1">
                <p className="font-semibold text-[var(--neu-accent)]">ℹ️ Fiche Salarié (Registre du Personnel) :</p>
                <div className="grid grid-cols-2 gap-2 text-[var(--neu-text-secondary)]">
                  <span>• Salaire de Base : <strong className="text-[var(--neu-text)]">{(emp.salary || 0).toLocaleString()} FCFA</strong></span>
                  <span>• Taux Horaire Léguel (173,33h) : <strong className="text-[var(--neu-text)]">{hourlyRate.toLocaleString()} FCFA/h</strong></span>
                  <span>• Fonction / Poste : <strong className="text-[var(--neu-text)]">{emp.jobTitle || "Collaborateur"}</strong></span>
                  <span>• Service / Direction : <strong className="text-[var(--neu-text)]">{emp.service || emp.direction || "Général"}</strong></span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-b border-[var(--neu-border)] py-3">
            <NeuInput
              type="number"
              step="0.5"
              min="0"
              label="Heures +15% (41h-46h)"
              value={hours15}
              onChange={(e) => setHours15(e.target.value)}
            />
            <NeuInput
              type="number"
              step="0.5"
              min="0"
              label="Heures +50% (> 46h)"
              value={hours50}
              onChange={(e) => setHours50(e.target.value)}
            />
            <NeuInput
              type="number"
              step="0.5"
              min="0"
              label="Heures +75% (Nuit semaine)"
              value={hours75Night}
              onChange={(e) => setHours75Night(e.target.value)}
            />
            <NeuInput
              type="number"
              step="0.5"
              min="0"
              label="Heures +75% (Jour Dim/Férié)"
              value={hours75Sunday}
              onChange={(e) => setHours75Sunday(e.target.value)}
            />
            <NeuInput
              type="number"
              step="0.5"
              min="0"
              label="Heures +100% (Nuit Dim/Férié)"
              value={hours100SundayNight}
              onChange={(e) => setHours100SundayNight(e.target.value)}
            />
          </div>

          <NeuInput
            label="Motif / Justification *"
            placeholder="Ex: Urgence paie et clôture mensuelle"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <NeuButton type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
              Annuler
            </NeuButton>
            <NeuButton type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer les Heures Supp"}
            </NeuButton>
          </div>
        </form>
      </NeuDialog>
    </div>
  );
}
