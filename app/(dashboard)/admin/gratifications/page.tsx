"use client";

import { useState, useEffect, useCallback } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import { Gift, Calendar, DollarSign, Loader2, Download, Search, Edit3 } from "lucide-react";
import { NeuDialog } from "@/components/ui/neu-dialog";

interface GratificationItem {
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  joiningDate: string;
  presenceDays: number;
  prorataPercent: number;
  baseAmount: number;
  baseRatePercent: number;
  weightedRatePercent: number;
  gratificationAmount: number;
}

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function GratificationsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [gratifications, setGratifications] = useState<GratificationItem[]>([]);
  const [totalGratification, setTotalGratification] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<GratificationItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchGratifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/gratifications?year=${year}`);
      const json = await res.json();
      if (json.success) {
        setGratifications(json.data.gratifications || []);
        setTotalGratification(json.data.totalGratification || 0);
      }
    } catch (err) {
      console.error("Fetch gratifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchGratifications();
  }, [fetchGratifications]);

  const handleUpdateItem = (updated: GratificationItem) => {
    const newItems = gratifications.map((g) => (g.userId === updated.userId ? updated : g));
    setGratifications(newItems);
    setTotalGratification(newItems.reduce((s, g) => s + g.gratificationAmount, 0));
    setEditingItem(null);
  };

  const filtered = gratifications.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Gift className="text-[var(--neu-accent)]" /> Gratifications & 13ème Mois 
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Calcul de la gratification annuelle avec proratisation au temps de présence effectif.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[var(--neu-text-secondary)] uppercase">Année :</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm font-bold text-[var(--neu-text)] outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#666cff]/10 text-[#666cff]">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Total Gratifications Annuelle</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">
                {totalGratification.toLocaleString()} FCFA
              </div>
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Salariés Éligibles</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">{gratifications.length} Salariés</div>
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Taux Conventionnel Média</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">100% du Salaire</div>
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Filter & Search */}
      <NeuCard>
        <NeuCardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--neu-text-secondary)]" />
            <input
              type="text"
              placeholder="Rechercher un salarié par nom ou matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] outline-none focus:border-[var(--neu-accent)]"
            />
          </div>
          <NeuBadge variant="accent">{filtered.length} lignes calculées</NeuBadge>
        </NeuCardContent>
      </NeuCard>

      {/* Gratifications Table */}
      <NeuCard>
        <NeuCardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Salarié & Département</th>
                  <th className="px-4 py-3">Date d'Entrée</th>
                  <th className="px-4 py-3 text-right">Salaire Base (Montant)</th>
                  <th className="px-4 py-3 text-center">Taux Base</th>
                  <th className="px-4 py-3 text-center">Prorata Temps</th>
                  <th className="px-4 py-3 text-center">Taux Pondéré</th>
                  <th className="px-4 py-3 text-right">Gratification (FCFA)</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[var(--neu-text-secondary)]">
                      Aucune donnée de gratification disponible pour l'année {year}.
                    </td>
                  </tr>
                ) : (
                  paginated.map((g) => (
                    <tr key={g.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{g.employeeId}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--neu-text)]">{g.name}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)]">{g.department}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--neu-text-secondary)]">
                        {g.joiningDate ? new Date(g.joiningDate).toLocaleDateString("fr-FR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {g.baseAmount.toLocaleString()} F
                      </td>
                      <td className="px-4 py-3 text-center">
                        <NeuBadge variant="info">{g.baseRatePercent}%</NeuBadge>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={g.prorataPercent < 100 ? "text-amber-500" : "text-emerald-500"}>
                          {g.prorataPercent}% ({g.presenceDays}j)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-[var(--neu-accent)]">
                        {g.weightedRatePercent}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-[var(--neu-text)] text-sm">
                        {g.gratificationAmount.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 text-center">
                        <NeuButton size="icon" variant="ghost" onClick={() => setEditingItem(g)} className="h-7 w-7">
                          <Edit3 className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                        </NeuButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Edit Modal */}
      {editingItem && (
        <NeuDialog open={!!editingItem} onClose={() => setEditingItem(null)} title={`Ajuster la Gratification - ${editingItem.name}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NeuInput
                label="Base Montant (FCFA)"
                type="number"
                value={editingItem.baseAmount}
                onChange={(e) => {
                  const base = Number(e.target.value);
                  const weighted = (editingItem.baseRatePercent * editingItem.prorataPercent) / 100;
                  setEditingItem({
                    ...editingItem,
                    baseAmount: base,
                    gratificationAmount: Math.round((base * weighted) / 100),
                  });
                }}
              />
              <NeuInput
                label="Taux de Base (%)"
                type="number"
                value={editingItem.baseRatePercent}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const weighted = (rate * editingItem.prorataPercent) / 100;
                  setEditingItem({
                    ...editingItem,
                    baseRatePercent: rate,
                    weightedRatePercent: Math.round(weighted),
                    gratificationAmount: Math.round((editingItem.baseAmount * weighted) / 100),
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NeuInput
                label="Prorata Temps Présence (%)"
                type="number"
                value={editingItem.prorataPercent}
                onChange={(e) => {
                  const pro = Number(e.target.value);
                  const weighted = (editingItem.baseRatePercent * pro) / 100;
                  setEditingItem({
                    ...editingItem,
                    prorataPercent: pro,
                    weightedRatePercent: Math.round(weighted),
                    gratificationAmount: Math.round((editingItem.baseAmount * weighted) / 100),
                  });
                }}
              />
              <NeuInput
                label="Montant Gratification Calcule (FCFA)"
                type="number"
                value={editingItem.gratificationAmount}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    gratificationAmount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <NeuButton variant="ghost" onClick={() => setEditingItem(null)}>
                Annuler
              </NeuButton>
              <NeuButton variant="accent" onClick={() => handleUpdateItem(editingItem)}>
                Enregistrer Ajustement
              </NeuButton>
            </div>
          </div>
        </NeuDialog>
      )}
    </div>
  );
}
