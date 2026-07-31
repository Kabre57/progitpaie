"use client";

import { useState, useEffect, useCallback } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { Calculator, Calendar, UserCheck, ShieldAlert, RefreshCw } from "lucide-react";

interface LeaveProvision {
  userId: string;
  name: string;
  employeeId: string;
  joiningDate: string;
  grossMonthly: number;
  leaveDaysAccrued: number;
  provisionAmount: number;
}

interface RetirementProvision {
  userId: string;
  name: string;
  employeeId: string;
  joiningDate: string;
  seniorityYears: string;
  grossMonthly: number;
  provisionAmount: number;
}

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function ProvisionsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"leaves" | "retirement">("leaves");
  const [leaveProvisions, setLeaveProvisions] = useState<LeaveProvision[]>([]);
  const [totalLeave, setTotalLeave] = useState(0);
  const [retirementProvisions, setRetirementProvisions] = useState<RetirementProvision[]>([]);
  const [totalRetirement, setTotalRetirement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPageLeaves, setCurrentPageLeaves] = useState(1);
  const [currentPageRetirement, setCurrentPageRetirement] = useState(1);
  const itemsPerPage = 10;

  const fetchProvisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/provisions?year=${year}`);
      const json = await res.json();
      if (json.success) {
        setLeaveProvisions(json.data.leaveProvisions || []);
        setTotalLeave(json.data.totalLeaveProvision || 0);
        setRetirementProvisions(json.data.retirementProvisions || []);
        setTotalRetirement(json.data.totalRetirementProvision || 0);
      }
    } catch (err) {
      console.error("Fetch provisions error:", err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchProvisions();
  }, [fetchProvisions]);

  const totalLeavePages = Math.ceil(leaveProvisions.length / itemsPerPage);
  const paginatedLeaveProvisions = leaveProvisions.slice(
    (currentPageLeaves - 1) * itemsPerPage,
    currentPageLeaves * itemsPerPage
  );

  const totalRetirementPages = Math.ceil(retirementProvisions.length / itemsPerPage);
  const paginatedRetirementProvisions = retirementProvisions.slice(
    (currentPageRetirement - 1) * itemsPerPage,
    currentPageRetirement * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Calculator className="text-[var(--neu-accent)]" /> Provisions pour Congés & Fin de Carrière  
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Calcul des engagements sociaux de l'entreprise (Provisions Congés Payés & Indemnités de Retraite).
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <NeuButton onClick={fetchProvisions} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </NeuButton>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Total Provision Congés (37)</div>
                <div className="text-xl font-extrabold text-[var(--neu-text)]">
                  {totalLeave.toLocaleString()} FCFA
                </div>
              </div>
            </div>
            <NeuBadge variant="success">37-PROVISION CONGÉS</NeuBadge>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Total Provision Retraite (38)</div>
                <div className="text-xl font-extrabold text-[var(--neu-text)]">
                  {totalRetirement.toLocaleString()} FCFA
                </div>
              </div>
            </div>
            <NeuBadge variant="info">38-PROVISION RETRAITE</NeuBadge>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--neu-border)] pb-2">
        <NeuButton
          variant={activeTab === "leaves" ? "accent" : "ghost"}
          onClick={() => setActiveTab("leaves")}
        >
          Provisions Congés Payés (37)
        </NeuButton>
        <NeuButton
          variant={activeTab === "retirement" ? "accent" : "ghost"}
          onClick={() => setActiveTab("retirement")}
        >
          Provisions Retraite (38)
        </NeuButton>
      </div>

      {/* Content Table */}
      {activeTab === "leaves" ? (
        <NeuCard>
          <NeuCardHeader className="p-4 border-b border-[var(--neu-border)]">
            <NeuCardTitle className="text-lg font-bold">37PROVISION POUR CONGÉS PAYÉS NON PRIS</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom & Prénoms</th>
                  <th className="px-4 py-3">Date d'Embauche</th>
                  <th className="px-4 py-3 text-right">Salaire Brut Mensuel Moyen</th>
                  <th className="px-4 py-3 text-right">Jours Acquéris</th>
                  <th className="px-4 py-3 text-right">Provision Congés (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {paginatedLeaveProvisions.map((row) => (
                  <tr key={row.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId}</td>
                    <td className="px-4 py-3 font-bold text-[var(--neu-text)]">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--neu-text-secondary)]">
                      {new Date(row.joiningDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--neu-text)]">
                      {row.grossMonthly.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-500">{row.leaveDaysAccrued} Jours</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-500">
                      {row.provisionAmount.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeuCardContent>
          <NeuPagination
            currentPage={currentPageLeaves}
            totalPages={totalLeavePages}
            totalItems={leaveProvisions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPageLeaves}
          />
        </NeuCard>
      ) : (
        <NeuCard>
          <NeuCardHeader className="p-4 border-b border-[var(--neu-border)]">
            <NeuCardTitle className="text-lg font-bold">38-PROVISION POUR PENSION RETRAITE & INDEMNITÉ DE FIN DE CARRIÈRE</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom & Prénoms</th>
                  <th className="px-4 py-3">Date d'Embauche</th>
                  <th className="px-4 py-3 text-right">Ancienneté</th>
                  <th className="px-4 py-3 text-right">Salaire Brut Mensuel</th>
                  <th className="px-4 py-3 text-right">Provision Retraite (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {paginatedRetirementProvisions.map((row) => (
                  <tr key={row.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId}</td>
                    <td className="px-4 py-3 font-bold text-[var(--neu-text)]">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--neu-text-secondary)]">
                      {new Date(row.joiningDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-400">{row.seniorityYears} ans</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--neu-text)]">
                      {row.grossMonthly.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-indigo-500">
                      {row.provisionAmount.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeuCardContent>
          <NeuPagination
            currentPage={currentPageRetirement}
            totalPages={totalRetirementPages}
            totalItems={retirementProvisions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPageRetirement}
          />
        </NeuCard>
      )}
    </div>
  );
}
