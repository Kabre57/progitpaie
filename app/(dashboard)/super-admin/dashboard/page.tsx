"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Building2,
  Users,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import type {
  DashboardStatsDTO,
  DashboardAlert,
} from "@/lib/application/admin/dto/DashboardStatsDTO";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFCFA(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} GFCFA`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MFCFA`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} kFCFA`;
  return `${value.toLocaleString()} FCFA`;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  trend?: string;
}

function KpiCard({ icon, label, value, sub, accent = "text-[#666cff]", trend }: KpiCardProps) {
  return (
    <NeuCard className="p-5 flex items-start gap-4 group hover:scale-[1.01] transition-transform duration-200">
      <div className={`p-3 rounded-xl bg-[#666cff]/15 ${accent} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[var(--neu-text-secondary)] font-medium uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold ${accent} leading-tight`}>{value}</div>
        {sub && <div className="text-xs text-[var(--neu-text-secondary)] mt-1">{sub}</div>}
        {trend && (
          <div className="text-xs text-[#72e128] flex items-center gap-1 mt-1">
            <TrendingUp size={11} />
            {trend}
          </div>
        )}
      </div>
    </NeuCard>
  );
}

// ─── Alert Item ──────────────────────────────────────────────────────────────

function AlertItem({ alert }: { alert: DashboardAlert }) {
  const icons: Record<string, React.ReactNode> = {
    error:   <AlertCircle size={16} className="text-[#ff4d49] shrink-0" />,
    warning: <AlertTriangle size={16} className="text-[#fdb528] shrink-0" />,
    info:    <Info size={16} className="text-[#26c6f9] shrink-0" />,
  };
  const borders: Record<string, string> = {
    error:   "border-[#ff4d49]/20 bg-[#ff4d49]/5",
    warning: "border-[#fdb528]/20 bg-[#fdb528]/5",
    info:    "border-[#26c6f9]/20 bg-[#26c6f9]/5",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${borders[alert.severity] || "border-[var(--neu-border)]"}`}>
      {icons[alert.severity]}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[var(--neu-text)]">{alert.message}</div>
        {alert.companyName && (
          <div className="text-[10px] text-[var(--neu-text-secondary)] mt-0.5 font-mono">
            {alert.companyName}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl p-3 shadow-xl text-xs space-y-1">
      <div className="font-bold text-[var(--neu-text)]">{label}</div>
      <div className="text-[var(--neu-text-secondary)]">
        Masse salariale : <span className="font-semibold text-[#666cff]">{payload[0]?.value?.toLocaleString()} FCFA</span>
      </div>
      {payload[1] && (
        <div className="text-[var(--neu-text-secondary)]">
          Bulletins : <span className="font-semibold text-[#26c6f9]">{payload[1]?.value}</span>
        </div>
      )}
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl p-3 shadow-xl text-xs">
      <div className="font-bold text-[var(--neu-text)] mb-1">{label}</div>
      <div className="text-[var(--neu-text-secondary)]">
        Effectif : <span className="font-semibold text-[#666cff]">{payload[0]?.value}</span>
      </div>
    </div>
  );
}

const BAR_COLORS = [
  "#666cff", "#8589ff", "#a4a7ff", "#c3c5ff", "#e2e3ff",
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/admin/dashboard/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setLastUpdated(new Date().toLocaleTimeString("fr-FR"));
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-80 bg-[var(--neu-surface-light)] rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[var(--neu-surface-light)] rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-[var(--neu-surface-light)] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-[var(--neu-surface-light)] rounded-2xl" />
          <div className="h-56 bg-[var(--neu-surface-light)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-12 text-center space-y-4">
        <ShieldAlert className="mx-auto text-[#ff4d49]" size={48} />
        <h2 className="text-lg font-bold text-[var(--neu-text)]">
          Impossible de charger le tableau de bord
        </h2>
        <p className="text-sm text-[var(--neu-text-secondary)]">{error}</p>
        <NeuButton variant="default" size="md" onClick={fetchStats}>
          Réessayer
        </NeuButton>
      </div>
    );
  }

  if (!stats) return null;

  const { kpis, monthlySeries, topTenants, alerts, recentActivity } = stats;

  const areaData = monthlySeries.map((p) => ({
    name: p.label,
    "Masse salariale": Math.round(p.netSalarySum),
    "Bulletins": p.payrollCount,
  }));

  const barData = topTenants.map((t) => ({
    name: t.name.length > 18 ? t.name.slice(0, 16) + "…" : t.name,
    fullName: t.name,
    effectif: t.employeeCount,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            Dashboard Groupe — Super Admin
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Vue consolidée de l'ensemble du SaaS PROGITPAIE
            {lastUpdated && (
              <span className="ml-2 text-[#666cff]">· Mis à jour à {lastUpdated}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/super-admin/tenants">
            <NeuButton variant="ghost" size="sm">
              Gérer les entreprises <ArrowRight size={12} />
            </NeuButton>
          </Link>
          <NeuButton
            variant="default"
            size="sm"
            onClick={fetchStats}
            loading={loading}
          >
            <RefreshCw size={14} />
            Actualiser
          </NeuButton>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Building2 size={22} />}
          label="Entreprises"
          value={kpis.totalTenants}
          sub={`${kpis.activeTenants} actives · ${kpis.inactiveTenants} inactives`}
          accent="text-[#666cff]"
        />
        <KpiCard
          icon={<Users size={22} />}
          label="Salariés Groupe"
          value={kpis.totalEmployees.toLocaleString()}
          sub={`${kpis.activeEmployees.toLocaleString()} actifs`}
          accent="text-[#26c6f9]"
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          label="Masse Salariale (12m)"
          value={formatFCFA(kpis.totalPayrollAmount)}
          sub={`Ce mois : ${formatFCFA(kpis.currentMonthPayrollAmount)}`}
          accent="text-[#fdb528]"
          trend={kpis.currentMonthPayrollAmount > 0 ? "Paie disponible" : undefined}
        />
        <KpiCard
          icon={<FileSpreadsheet size={22} />}
          label="Bulletins Générés"
          value={kpis.totalPayrollsCount.toLocaleString()}
          sub="Historique cumulé"
          accent="text-[#72e128]"
        />
      </div>

      {/* ── GRAPHIQUE ÉVOLUTION MASSE SALARIALE ──────────────────────────── */}
      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <DollarSign size={18} className="text-[#666cff]" />
              Évolution de la Masse Salariale & Bulletins (12 derniers mois)
            </h2>
            <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
              Cumul des salaires nets versés et volume de fiches de paie générées par mois
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#666cff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#666cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="var(--neu-text-secondary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--neu-text-secondary)" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Masse salariale" stroke="#666cff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* ── TOP 5 ENTREPRISES & ALERTES / AUDIT ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* TOP 5 EFFECTIFS */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Users size={18} className="text-[#666cff]" />
              Top 5 Entreprises par Effectif
            </h2>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="var(--neu-text-secondary)" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--neu-text-secondary)" fontSize={11} tickLine={false} width={120} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="effectif" radius={[0, 6, 6, 0]}>
                  {barData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        {/* ALERTES DU SYSTÈME */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#fdb528]" />
              Alertes Système & Anomalies ({alerts.length})
            </h2>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-xs text-[var(--neu-text-secondary)] text-center py-8">
                Aucune alerte détectée. Le système est 100% opérationnel.
              </div>
            ) : (
              alerts.map((al, idx) => <AlertItem key={idx} alert={al} />)
            )}
          </div>
        </NeuCard>

      </div>
    </div>
  );
}
