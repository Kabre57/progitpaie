"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Server,
  Database,
  Zap,
  HardDrive,
  Cpu,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import type { SystemHealthDTO } from "@/lib/application/admin/dto/SystemHealthDTO";

export default function SuperAdminSystemHealthPage() {
  const { data: health, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery<SystemHealthDTO | null>({
    queryKey: ["super-admin-system-health"],
    queryFn: async () => {
      const res = await fetch("/api/v2/admin/system/health");
      const json = await res.json();
      if (json.success) {
        return json.data as SystemHealthDTO;
      }
      throw new Error(json.error || "Erreur de chargement santé système");
    },
    refetchInterval: 30000,
  });

  const loading = isLoading;
  const lastRefreshed = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("fr-FR") : null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}j ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading && !health) {
    return <div className="p-8 text-center text-[var(--neu-text-secondary)]">Diagnostic des services en cours...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── EN-TÊTE ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#666cff]/15 text-[#666cff]">
              <Activity size={22} />
            </span>
            Santé Système & Infrastructure Serveur
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Monitoring temps réel de PostgreSQL, Redis, Node.js et du serveur VPS
            {lastRefreshed && (
              <span className="ml-2 text-[#666cff]">· Mis à jour à {lastRefreshed}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {health && (
            <NeuBadge
              variant={
                health.status === "HEALTHY"
                  ? "success"
                  : health.status === "DEGRADED"
                  ? "warning"
                  : "error"
              }
              className="text-xs px-3 py-1 font-bold"
            >
              ● SYSTÈME {health.status}
            </NeuBadge>
          )}

          <NeuButton variant="default" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} /> Tester & Actualiser
          </NeuButton>
        </div>
      </div>

      {health && (
        <>
          {/* ── CARTES DE STATUT DES SERVICES ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* POSTGRESQL */}
            <NeuCard className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--neu-text-secondary)] font-semibold uppercase">PostgreSQL</span>
                <NeuBadge variant={health.database.status === "CONNECTED" ? "success" : "error"}>
                  {health.database.status === "CONNECTED" ? "En ligne" : "Erreur"}
                </NeuBadge>
              </div>
              <div className="flex items-baseline gap-2">
                <Database size={24} className="text-[#666cff]" />
                <span className="text-2xl font-bold text-[var(--neu-text)]">{health.database.latencyMs} ms</span>
              </div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] flex justify-between border-t border-[var(--neu-border)] pt-2">
                <span>Taille base : <strong>{health.database.sizePretty}</strong></span>
                <span>Connexions : <strong>{health.database.activeConnections}</strong></span>
              </div>
            </NeuCard>

            {/* REDIS CACHE */}
            <NeuCard className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--neu-text-secondary)] font-semibold uppercase">Redis Cache</span>
                <NeuBadge variant={health.redis.status === "CONNECTED" ? "success" : "warning"}>
                  {health.redis.status === "CONNECTED" ? "Connecté" : "Hors-ligne"}
                </NeuBadge>
              </div>
              <div className="flex items-baseline gap-2">
                <Zap size={24} className="text-[#fdb528]" />
                <span className="text-2xl font-bold text-[var(--neu-text)]">{health.redis.latencyMs} ms</span>
              </div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] border-t border-[var(--neu-border)] pt-2">
                Sessions & Rate limiting en mémoire vive
              </div>
            </NeuCard>

            {/* NODE.JS PROCESS */}
            <NeuCard className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--neu-text-secondary)] font-semibold uppercase">App Next.js</span>
                <NeuBadge variant="default">{health.nodeVersion}</NeuBadge>
              </div>
              <div className="flex items-baseline gap-2">
                <Server size={24} className="text-[#26c6f9]" />
                <span className="text-2xl font-bold text-[var(--neu-text)]">{health.process.heapUsedMB} Mo</span>
              </div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] border-t border-[var(--neu-border)] pt-2">
                Uptime : <strong>{formatUptime(health.uptimeSeconds)}</strong>
              </div>
            </NeuCard>

            {/* SÉCURITÉ AUDIT */}
            <NeuCard className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--neu-text-secondary)] font-semibold uppercase">Audit 24h</span>
                <NeuBadge variant={health.security.failedAudits24h === 0 ? "success" : "error"}>
                  {health.security.failedAudits24h} anomalies
                </NeuBadge>
              </div>
              <div className="flex items-baseline gap-2">
                <ShieldCheck size={24} className="text-[#72e128]" />
                <span className="text-2xl font-bold text-[var(--neu-text)]">{health.security.totalAudits24h}</span>
              </div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] border-t border-[var(--neu-border)] pt-2">
                Événements tracés dans les logs
              </div>
            </NeuCard>
          </div>

          {/* ── DÉTAILS TECHNIQUES & MÉMOIRE ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MÉMOIRE SERVEUR OS */}
            <NeuCard className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
                <HardDrive size={18} className="text-[#666cff]" />
                Mémoire Vive du Serveur VPS (RAM)
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--neu-text)]">Utilisation RAM : {health.serverOS.osMemoryUsagePercentage}%</span>
                  <span className="text-[var(--neu-text-secondary)]">
                    {health.serverOS.usedMemMB} Mo / {health.serverOS.totalMemMB} Mo
                  </span>
                </div>
                <div className="w-full bg-[var(--neu-surface-light)] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      health.serverOS.osMemoryUsagePercentage > 85
                        ? "bg-[#ff4d49]"
                        : health.serverOS.osMemoryUsagePercentage > 65
                        ? "bg-[#fdb528]"
                        : "bg-[#666cff]"
                    }`}
                    style={{ width: `${health.serverOS.osMemoryUsagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">Plateforme</div>
                  <div className="font-bold text-[var(--neu-text)] mt-0.5 capitalize">{health.serverOS.platform} ({health.serverOS.arch})</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">RAM Libre</div>
                  <div className="font-bold text-[#72e128] mt-0.5">{health.serverOS.freeMemMB} Mo</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">Charge CPU (1/5/15m)</div>
                  <div className="font-bold text-[var(--neu-text)] mt-0.5">
                    {health.serverOS.loadAverage.map((l) => l.toFixed(2)).join(", ")}
                  </div>
                </div>
              </div>
            </NeuCard>

            {/* MÉMOIRE DU PROCESSUS NODE.JS */}
            <NeuCard className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
                <Cpu size={18} className="text-[#26c6f9]" />
                Allocation Mémoire Processus Node.js
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--neu-text)]">Heap V8 Utilisée : {health.process.memoryUsagePercentage}%</span>
                  <span className="text-[var(--neu-text-secondary)]">
                    {health.process.heapUsedMB} Mo / {health.process.heapTotalMB} Mo
                  </span>
                </div>
                <div className="w-full bg-[var(--neu-surface-light)] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#26c6f9] transition-all duration-500"
                    style={{ width: `${health.process.memoryUsagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">RSS (Mémoire Résidente)</div>
                  <div className="font-bold text-[var(--neu-text)] mt-0.5">{health.process.rssMB} Mo</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">Environnement</div>
                  <div className="font-bold text-[var(--neu-text)] mt-0.5 uppercase">{health.environment}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--neu-surface-light)]">
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">Version Postgres</div>
                  <div className="font-bold text-[var(--neu-text)] mt-0.5 truncate">{health.database.version}</div>
                </div>
              </div>
            </NeuCard>
          </div>
        </>
      )}
    </div>
  );
}
