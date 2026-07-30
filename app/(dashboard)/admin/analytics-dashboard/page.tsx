"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, DollarSign, Users, Award, TrendingUp, RefreshCw, PieChart, Building } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";

interface AnalyticsData {
  financial: {
    totalGrossSalary: number;
    totalEmployerCharges: number;
    totalCostEmployer: number;
    totalNetSalary: number;
    totalTaxITS: number;
  };
  hr: {
    totalEmployees: number;
    averageSeniorityYears: number;
    employeesByDepartment: Array<{ name: string; count: number; grossSalary: number }>;
  };
  trend12Months: Array<{ monthName: string; grossSalary: number; netSalary: number }>;
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/summary");
      const json = await res.json();
      if (json.success) {
        setData(json.summary);
      }
    } catch (err) {
      console.error("Échec du chargement Analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fmtNum = (num: number) => {
    return Math.round(num)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={28} />
            Dashboard Analytics & Business Intelligence 📊
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Pilotage en temps réel de la masse salariale, des charges patronales et des indicateurs RH
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-blue-500 flex items-center gap-1 bg-[var(--neu-bg-subtle)] px-3 py-2 rounded-xl"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser les KPIs
        </button>
      </div>

      {loading || !data ? (
        <div className="text-center py-12 text-[var(--neu-text-subtle)]">Calcul des indicateurs financiers et RH...</div>
      ) : (
        <>
          {/* CARTE DE STATISTIQUES FINANCIÈRES CLÉS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Masse Salariale Brute</div>
                <div className="text-lg font-bold text-[var(--neu-text)]">{fmtNum(data.financial.totalGrossSalary)} FCFA</div>
              </div>
            </NeuCard>

            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Coût Total Employeur</div>
                <div className="text-lg font-bold text-blue-600">{fmtNum(data.financial.totalCostEmployer)} FCFA</div>
              </div>
            </NeuCard>

            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <PieChart size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Charges Patronales (CNPS/FDFP)</div>
                <div className="text-lg font-bold text-amber-500">{fmtNum(data.financial.totalEmployerCharges)} FCFA</div>
              </div>
            </NeuCard>

            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Effectif Total Actif</div>
                <div className="text-lg font-bold text-[var(--neu-text)]">{data.hr.totalEmployees} salariés</div>
              </div>
            </NeuCard>
          </div>

          {/* RÉPARTITION PAR DÉPARTEMENT & INDICATEURS RH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeuCard className="p-5 space-y-4">
              <h3 className="font-bold text-base text-[var(--neu-text)] flex items-center gap-2">
                <Building size={18} className="text-emerald-500" />
                Masse Salariale & Effectif par Département
              </h3>

              <div className="space-y-3">
                {data.hr.employeesByDepartment.map((dept, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[var(--neu-text)]">
                      <span>{dept.name} ({dept.count} salariés)</span>
                      <span>{fmtNum(dept.grossSalary)} FCFA</span>
                    </div>
                    <div className="w-full bg-[var(--neu-bg-subtle)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (dept.grossSalary / (data.financial.totalGrossSalary || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </NeuCard>

            <NeuCard className="p-5 space-y-4">
              <h3 className="font-bold text-base text-[var(--neu-text)] flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                Indicateurs RH & Ancienneté Moyenne
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--neu-bg-subtle)] rounded-xl space-y-1">
                  <div className="text-xs text-[var(--neu-text-subtle)]">Ancienneté Moyenne</div>
                  <div className="text-xl font-bold text-[var(--neu-text)]">{data.hr.averageSeniorityYears} ans</div>
                </div>

                <div className="p-4 bg-[var(--neu-bg-subtle)] rounded-xl space-y-1">
                  <div className="text-xs text-[var(--neu-text-subtle)]">Net Global à Payer</div>
                  <div className="text-xl font-bold text-emerald-600">{fmtNum(data.financial.totalNetSalary)} FCFA</div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-xl space-y-1 border border-blue-500/20">
                <div className="text-xs text-blue-500 font-semibold">Taux de Charges Sociales Employer</div>
                <div className="text-sm font-bold text-blue-600">
                  {((data.financial.totalEmployerCharges / (data.financial.totalGrossSalary || 1)) * 100).toFixed(1)}% de la masse salariale
                </div>
              </div>
            </NeuCard>
          </div>
        </>
      )}
    </div>
  );
}
