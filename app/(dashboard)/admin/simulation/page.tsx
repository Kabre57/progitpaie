"use client";

import React, { useState, useEffect } from "react";
import { Target, TrendingUp, Users, Play, ArrowRight, DollarSign, Calculator, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

interface SimulationResult {
  scenarioType: string;
  baseline: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalEmployerCost: number;
    totalNetSalary: number;
  };
  simulated: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalEmployerCost: number;
    totalNetSalary: number;
  };
  variance: {
    grossSalaryDiff: number;
    employerCostDiff: number;
    percentageChange: number;
  };
}

export default function SimulationAdminPage() {
  const [percentageIncrease, setPercentageIncrease] = useState<number>(5);
  const [recruitCount, setRecruitCount] = useState<number>(0);
  const [recruitSalary, setRecruitSalary] = useState<number>(350000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const recruits = Array.from({ length: recruitCount }).map((_, idx) => ({
        name: `Nouveau Salarié ${idx + 1}`,
        baseSalary: recruitSalary,
      }));

      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SALARY_INCREASE",
          percentageIncrease: Number(percentageIncrease) || 0,
          newRecruits: recruits,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.simulation);
      }
    } catch (err) {
      console.error("Échec de la simulation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
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
            <Target className="text-rose-500" size={28} />
            Moteur de Simulation Salariale & Budgétaire 🎯
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Simulations "What-If" en temps réel sur la masse salariale, cotisations sociales et coût employeur
          </p>
        </div>

        <NeuButton
          onClick={runSimulation}
          disabled={loading}
          className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 px-4 py-2"
        >
          <Play size={16} className={loading ? "animate-spin" : ""} />
          Lancer la Simulation
        </NeuButton>
      </div>

      {/* PARAMÈTRES DU SCÉNARIO */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2">
          <Calculator size={20} className="text-rose-500" />
          Configuration du Scénario d'Impact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">
              Augmentation Salariale (%)
            </label>
            <NeuInput
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={percentageIncrease}
              onChange={(e) => setPercentageIncrease(parseFloat(e.target.value) || 0)}
            />
            <span className="text-[11px] text-[var(--neu-text-subtle)] mt-1 block">
              Applique une hausse sur les salaires de base existants.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">
              Nouveaux Recrutements Simulés
            </label>
            <NeuInput
              type="number"
              min="0"
              max="50"
              value={recruitCount}
              onChange={(e) => setRecruitCount(parseInt(e.target.value) || 0)}
            />
            <span className="text-[11px] text-[var(--neu-text-subtle)] mt-1 block">
              Nombre de nouveaux postes à intégrer.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">
              Salaire de Base Moyen par Recrue (FCFA)
            </label>
            <NeuInput
              type="number"
              step="10000"
              value={recruitSalary}
              onChange={(e) => setRecruitSalary(parseFloat(e.target.value) || 0)}
            />
            <span className="text-[11px] text-[var(--neu-text-subtle)] mt-1 block">
              Salaire brut prévisionnel par nouveau profil.
            </span>
          </div>
        </div>
      </NeuCard>

      {/* RÉSULTATS COMPARATIFS DE LA SIMULATION */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NeuCard className="p-4 space-y-1">
              <div className="text-xs text-[var(--neu-text-subtle)]">Situation Actuelle (Masse Salariale)</div>
              <div className="text-lg font-bold text-[var(--neu-text)]">{fmtNum(result.baseline.totalGrossSalary)} FCFA</div>
              <div className="text-xs text-[var(--neu-text-subtle)]">Coût Employeur : {fmtNum(result.baseline.totalEmployerCost)} FCFA</div>
            </NeuCard>

            <NeuCard className="p-4 space-y-1 bg-rose-500/5 border border-rose-500/20">
              <div className="text-xs text-rose-500 font-semibold">Situation Simulée après Scénario</div>
              <div className="text-lg font-bold text-rose-600">{fmtNum(result.simulated.totalGrossSalary)} FCFA</div>
              <div className="text-xs text-rose-500">Coût Employeur : {fmtNum(result.simulated.totalEmployerCost)} FCFA</div>
            </NeuCard>

            <NeuCard className="p-4 space-y-1 bg-emerald-500/5 border border-emerald-500/20">
              <div className="text-xs text-emerald-500 font-semibold">Écart / Impact Budgétaire (Coût Employeur)</div>
              <div className="text-lg font-bold text-emerald-600">
                +{fmtNum(result.variance.employerCostDiff)} FCFA
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                Variation : +{result.variance.percentageChange}%
              </div>
            </NeuCard>
          </div>
        </div>
      )}
    </div>
  );
}
