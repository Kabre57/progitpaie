"use client";

import { useEffect, useState } from "react";
import { 
  Calculator, Calendar, DollarSign, Users, TrendingUp, Download, Printer, User as UserIcon, FileSpreadsheet 
} from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuPagination } from "@/components/ui/neu-pagination";

export default function CumulsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"monthly" | "employee" | "annual">("monthly");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCumuls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/cumuls?year=${year}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Fetch cumuls error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCumuls();
  }, [year]);

  const companyCumul = data?.companyAnnualCumul || {};
  const monthlyCumuls = data?.monthlyCumuls || [];
  const employeeCumuls = data?.employeeAnnualCumuls || [];

  const totalPages = Math.ceil(employeeCumuls.length / itemsPerPage);
  const paginatedEmployeeCumuls = employeeCumuls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 relative" style={{ minHeight: "400px" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[var(--neu-accent)]" /> Cumuls de Paie Mensuels & Annuel  
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm">
            Récapitulatif et cumul général de la masse salariale, des retenues fiscales (ITS/IGR) et des cotisations CNPS/FDFP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-sm outline-none focus:border-[var(--neu-accent)]"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                Année {y}
              </option>
            ))}
          </select>
          <NeuButton variant="accent" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Imprimer les Cumuls
          </NeuButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--neu-text-secondary)]">Masse Salariale Brute</p>
              <p className="text-xl font-bold text-[var(--neu-accent)] mt-1">
                {(companyCumul.cumulGrossSalary || 0).toLocaleString()} FCFA
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#666cff]/10 flex items-center justify-center text-[#666cff]">
              <DollarSign className="w-5 h-5" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--neu-text-secondary)]">Total Impôts (ITS/IGR)</p>
              <p className="text-xl font-bold text-amber-500 mt-1">
                {((companyCumul.cumulItsTax || 0) + (companyCumul.cumulIgrTax || 0)).toLocaleString()} FCFA
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Calculator className="w-5 h-5" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--neu-text-secondary)]">Total Cotisations CNPS</p>
              <p className="text-xl font-bold text-emerald-500 mt-1">
                {((companyCumul.cumulCnpsEmployee || 0) + (companyCumul.cumulCnpsEmployer || 0)).toLocaleString()} FCFA
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--neu-text-secondary)]">Total Net à Payer Annuel</p>
              <p className="text-xl font-bold text-[var(--neu-text)] mt-1">
                {(companyCumul.cumulNetSalary || 0).toLocaleString()} FCFA
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-[var(--neu-border)] pb-3">
        <NeuButton
          variant={activeTab === "monthly" ? "accent" : "ghost"}
          onClick={() => setActiveTab("monthly")}
          size="sm"
        >
          <Calendar className="w-4 h-4 mr-1.5" /> Cumuls Mensuels (Janvier à Décembre)
        </NeuButton>
        <NeuButton
          variant={activeTab === "employee" ? "accent" : "ghost"}
          onClick={() => setActiveTab("employee")}
          size="sm"
        >
          <Users className="w-4 h-4 mr-1.5" /> Cumul Général Individuel par Salarié
        </NeuButton>
        <NeuButton
          variant={activeTab === "annual" ? "accent" : "ghost"}
          onClick={() => setActiveTab("annual")}
          size="sm"
        >
          <Calculator className="w-4 h-4 mr-1.5" /> Cumul Général Entreprise (DISA & État 301)
        </NeuButton>
      </div>

      {/* Onglet 1: Cumuls Mensuels */}
      {activeTab === "monthly" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle>Tableau des Cumuls Mensuels de l'Année {year}</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-xs">
                  <th className="px-4 py-3">Mois</th>
                  <th className="px-4 py-3 text-center">Effectif</th>
                  <th className="px-4 py-3 text-right">Salaire Brut Total</th>
                  <th className="px-4 py-3 text-right">Impôt ITS</th>
                  <th className="px-4 py-3 text-right">CNPS Salarié (6.3%)</th>
                  <th className="px-4 py-3 text-right">CNPS Patronal</th>
                  <th className="px-4 py-3 text-right">Taxes FDFP</th>
                  <th className="px-4 py-3 text-right font-bold text-[var(--neu-accent)]">Net à Payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {monthlyCumuls.map((m: any) => (
                  <tr key={m.month} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--neu-text)]">{m.monthName}</td>
                    <td className="px-4 py-3 text-center">
                      <NeuBadge variant={m.totalEmployees > 0 ? "success" : "ghost"}>
                        {m.totalEmployees}
                      </NeuBadge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{m.totalGrossSalary.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-500">{m.totalItsTax.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-500">{m.totalCnpsEmployee.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{m.totalCnpsEmployer.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-500">{m.totalFdfpTax.toLocaleString()} F</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--neu-accent)]">
                      {m.totalNetSalary.toLocaleString()} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Onglet 2: Cumul par Salarié */}
      {activeTab === "employee" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle>Cumul Général Annuel par Salarié ({year})</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-xs">
                  <th className="px-4 py-3">Employé</th>
                  <th className="px-4 py-3">Département</th>
                  <th className="px-4 py-3 text-center">Mois Payés</th>
                  <th className="px-4 py-3 text-right">Cumul Brut</th>
                  <th className="px-4 py-3 text-right">Cumul Retenues</th>
                  <th className="px-4 py-3 text-right font-bold text-[var(--neu-accent)]">Cumul Net à Payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {employeeCumuls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--neu-text-secondary)]">
                      Aucune donnée de paie calculée pour l'année {year}.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployeeCumuls.map((e: any) => (
                    <tr key={e.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
                          <div>
                            <p className="font-semibold text-[var(--neu-text)]">{e.name}</p>
                            <p className="text-xs text-[var(--neu-text-secondary)]">{e.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--neu-text-secondary)]">{e.department}</td>
                      <td className="px-4 py-3 text-center">
                        <NeuBadge variant="accent">{e.monthsPaid} mois</NeuBadge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{e.cumulGrossSalary.toLocaleString()} F</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-500">{e.cumulDeductions.toLocaleString()} F</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--neu-accent)]">
                        {e.cumulNetSalary.toLocaleString()} F
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </NeuCardContent>
          <NeuPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={employeeCumuls.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </NeuCard>
      )}

      {/* Onglet 3: Cumul Annuel Entreprise */}
      {activeTab === "annual" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle>Récapitulatif Annuel de la Masse Salariale & Charges ({year})</NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 bg-[var(--neu-surface-light)] rounded-lg border border-[var(--neu-border)]">
                <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase">
                  Gains & Masses Salariales
                </h3>
                <div className="flex justify-between py-1 border-b border-[var(--neu-border)] text-sm">
                  <span>Bulletins de paie générés :</span>
                  <span className="font-semibold">{companyCumul.totalPayrollsProcessed || 0} bulletins</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--neu-border)] text-sm">
                  <span>Masse Salariale Brute Cumulée :</span>
                  <span className="font-mono font-bold">{companyCumul.cumulGrossSalary?.toLocaleString() || 0} FCFA</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span>Net à Payer Total Distribué :</span>
                  <span className="font-mono font-bold text-[var(--neu-accent)]">{companyCumul.cumulNetSalary?.toLocaleString() || 0} FCFA</span>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-[var(--neu-surface-light)] rounded-lg border border-[var(--neu-border)]">
                <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase">
                  Impôts & Cotisations Sociale Cumulées
                </h3>
                <div className="flex justify-between py-1 border-b border-[var(--neu-border)] text-sm">
                  <span>Impôt sur Salaire (ITS) :</span>
                  <span className="font-mono text-amber-500 font-bold">{companyCumul.cumulItsTax?.toLocaleString() || 0} FCFA</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--neu-border)] text-sm">
                  <span>CNPS Salarié (6.3%) :</span>
                  <span className="font-mono text-emerald-500 font-bold">{companyCumul.cumulCnpsEmployee?.toLocaleString() || 0} FCFA</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--neu-border)] text-sm">
                  <span>CNPS Patronal (Retraite + PF + AT) :</span>
                  <span className="font-mono text-emerald-600 font-bold">{companyCumul.cumulCnpsEmployer?.toLocaleString() || 0} FCFA</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span>Taxes FDFP (TA + FPC) :</span>
                  <span className="font-mono text-blue-500 font-bold">{companyCumul.cumulFdfpTax?.toLocaleString() || 0} FCFA</span>
                </div>
              </div>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}
    </div>
  );
}
