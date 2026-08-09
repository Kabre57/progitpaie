"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { Timer, CheckCircle, XCircle, Clock, RefreshCw, Plus } from "lucide-react";
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

export default function OvertimePage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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

  const handleApproveReject = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/overtime/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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

                  return (
                    <tr key={o.id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="font-bold">{o.user?.name || "Salarié"}</div>
                        <div className="text-xs text-[var(--neu-text-secondary)]">
                          {o.user?.employeeId || o.user?.email || "EMP"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {new Date(o.date).toLocaleDateString("fr-FR")}
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
                              onClick={() => handleApproveReject(o.id, "approve")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
