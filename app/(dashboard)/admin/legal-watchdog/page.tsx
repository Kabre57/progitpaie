"use client";

import React, { useState, useEffect } from "react";
import { Scale, ShieldAlert, CheckCircle, AlertTriangle, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface LegalAlert {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string;
  officialText?: string;
  effectiveDate: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "APPLIED";
  proposedRates?: Record<string, unknown>;
}

export default function LegalWatchdogAdminPage() {
  const [alerts, setAlerts] = useState<LegalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/legal-alerts");
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Échec de chargement des alertes légales:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleApply = async (alertId: string) => {
    setApplyingId(alertId);
    try {
      const res = await fetch("/api/legal-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      const data = await res.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (err) {
      console.error("Erreur d'application des taux:", err);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Scale className="text-amber-500" size={28} />
            Intelligence Légale & Veille Réglementaire ⚖️
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Surveillance en temps réel des décrets DGI, CNPS, FDFP & validation des barèmes de paie
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-amber-500 flex items-center gap-1 bg-[var(--neu-bg-subtle)] px-3 py-2 rounded-xl"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser la Veille
        </button>
      </div>

      {/* RAPPEL STRATÉGIQUE */}
      <NeuCard className="p-4 border-l-4 border-amber-500 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-amber-500 mt-1" size={20} />
          <div>
            <h3 className="font-bold text-sm text-[var(--neu-text)]">Conformité Légale Garantie (Côte d'Ivoire)</h3>
            <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
              Les modifications de taux détectées nécessitent une validation humaine avant d'être appliquées directement au moteur de calcul modulaire.
            </p>
          </div>
        </div>
      </NeuCard>

      {/* LISTE DES ALERTES */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--neu-text)]">Évolutions Réglementaires Détectées</h2>

        {loading ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Analyse des flux réglementaires officiels en cours...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Aucune alerte légale en attente. Votre système est à jour.</div>
        ) : (
          alerts.map((alert) => (
            <NeuCard key={alert.id} className="p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[var(--neu-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {alert.category}
                  </span>
                  <h3 className="font-bold text-base text-[var(--neu-text)]">{alert.title}</h3>
                </div>

                <div className="text-xs text-[var(--neu-text-subtle)]">
                  Date d'effet : {new Date(alert.effectiveDate).toLocaleDateString("fr-FR")}
                </div>
              </div>

              <p className="text-sm text-[var(--neu-text)] font-medium">{alert.summary}</p>

              {alert.officialText && (
                <div className="text-xs text-[var(--neu-text-subtle)] bg-[var(--neu-bg-subtle)] p-2.5 rounded-lg flex items-center gap-2">
                  <FileText size={14} className="text-amber-500 shrink-0" />
                  <span>{alert.officialText}</span>
                </div>
              )}

              {/* ACTION & BOUTON D'APPLICATION */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[var(--neu-text-subtle)]">Source : {alert.source}</div>

                {alert.status === "APPLIED" ? (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle size={14} /> Appliqué au Moteur de Paie
                  </span>
                ) : (
                  <NeuButton
                    onClick={() => handleApply(alert.id)}
                    disabled={applyingId === alert.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 flex items-center gap-2"
                  >
                    {applyingId === alert.id ? "Application..." : "Valider & Appliquer au Moteur"}
                    <ArrowRight size={14} />
                  </NeuButton>
                )}
              </div>
            </NeuCard>
          ))
        )}
      </div>
    </div>
  );
}
