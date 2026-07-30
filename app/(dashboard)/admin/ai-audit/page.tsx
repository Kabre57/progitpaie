"use client";

import React, { useState, useEffect } from "react";
import { Bot, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Lightbulb, ArrowUpRight } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface Anomaly {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  riskScore: number;
  title: string;
  description: string;
  recommendation: string;
  affectedAmount?: number;
}

interface AIAuditReport {
  period: { month: number; year: number };
  totalAudited: number;
  anomaliesFoundCount: number;
  healthScore: number;
  anomalies: Anomaly[];
  optimizationTips: string[];
}

export default function AIAuditAdminPage() {
  const [report, setReport] = useState<AIAuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAIAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/audit");
      const json = await res.json();
      if (json.success) {
        setReport(json.report);
      }
    } catch (err) {
      console.error("Échec du chargement de l'audit IA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAudit();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Bot className="text-indigo-500" size={28} />
            Intelligence Artificielle & Audit d'Anomalies de Paie 🤖
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Détection automatique des Outliers, contrôles de conformité fiscale DGI / CNPS & conseils d'optimisation
          </p>
        </div>

        <button
          onClick={fetchAIAudit}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-indigo-500 flex items-center gap-1 bg-[var(--neu-bg-subtle)] px-3 py-2 rounded-xl"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Lancer l'Audit IA
        </button>
      </div>

      {loading || !report ? (
        <div className="text-center py-12 text-[var(--neu-text-subtle)]">
          L'Assistant IA analyse les bulletins et fiches de paie...
        </div>
      ) : (
        <>
          {/* CARTES DE STATISTIQUES SCORE IA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Score Global de Santé Paie</div>
                <div className="text-2xl font-bold text-indigo-600">{report.healthScore} / 100</div>
              </div>
            </NeuCard>

            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Anomalies Détectées</div>
                <div className="text-2xl font-bold text-amber-500">{report.anomaliesFoundCount} alertes</div>
              </div>
            </NeuCard>

            <NeuCard className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Dossiers Paie Audités</div>
                <div className="text-2xl font-bold text-[var(--neu-text)]">{report.totalAudited} salariés</div>
              </div>
            </NeuCard>
          </div>

          {/* LISTE DES ANOMALIES DÉTECTÉES PAR L'IA */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldAlert className="text-amber-500" size={20} />
              Anomalies & Risques de Paie Identifiés
            </h2>

            {report.anomalies.length === 0 ? (
              <NeuCard className="p-6 text-center text-emerald-600 space-y-2">
                <CheckCircle2 size={32} className="mx-auto" />
                <div className="font-bold">Aucune anomalie critique détectée par le moteur IA.</div>
                <div className="text-xs text-[var(--neu-text-subtle)]">Vos fiches de paie sont conformes aux règles DGI et CNPS.</div>
              </NeuCard>
            ) : (
              report.anomalies.map((anom) => (
                <NeuCard key={anom.id} className="p-5 space-y-3 border-l-4 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md">
                        Score Risque : {anom.riskScore}%
                      </span>
                      <h3 className="font-bold text-sm text-[var(--neu-text)]">{anom.title}</h3>
                    </div>

                    <span className="text-xs text-[var(--neu-text-subtle)]">
                      Salarié : {anom.employeeName} ({anom.employeeId})
                    </span>
                  </div>

                  <p className="text-xs text-[var(--neu-text-subtle)]">{anom.description}</p>

                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 text-xs text-indigo-700 flex items-start gap-2">
                    <Lightbulb size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Recommandation IA : </span>
                      {anom.recommendation}
                    </div>
                  </div>
                </NeuCard>
              ))
            )}
          </div>

          {/* RECOMMANDATIONS ET CONSEILS D'OPTIMISATION */}
          <NeuCard className="p-5 space-y-3 bg-emerald-500/5 border border-emerald-500/20">
            <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-2">
              <Sparkles size={16} />
              Recommandations d'Optimisation des Charges (IA Advice)
            </h3>
            <ul className="space-y-2">
              {report.optimizationTips.map((tip, idx) => (
                <li key={idx} className="text-xs text-[var(--neu-text)] flex items-start gap-2">
                  <ArrowUpRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </NeuCard>
        </>
      )}
    </div>
  );
}
