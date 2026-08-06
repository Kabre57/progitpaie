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
  Legend,
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
  CheckCircle2,
  Info,
  Activity,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
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

function formatFCFAFull(value: number): string {
  return `${value.toLocaleString("fr-FR")} FCFA`;
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

function KpiCard({ icon, label, value, sub, accent = "text-emerald-500", trend }: KpiCardProps) {
  return (
    <NeuCard className="p-5 flex items-start gap-4 group hover:scale-[1.01] transition-transform duration-200">
      <div className={`p-3 rounded-xl bg-current/10 ${accent} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[var(--neu-text-subtle)] font-medium uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold ${accent} leading-tight`}>{value}</div>
        {sub && <div className="text-xs text-[var(--neu-text-subtle)] mt-1">{sub}</div>}
        {trend && (
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
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
    error:   <AlertCircle size={16} className="text-rose-500 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
    info:    <Info size={16} className="text-blue-400 shrink-0" />,
  };
  const borders: Record<string, string> = {
    error:   "border-rose-500/20 bg-rose-500/5",
    warning: "border-amber-400/20 bg-amber-400/5",
    info:    "border-blue-400/20 bg-blue-400/5",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${borders[alert.severity]} text-sm`}>
      {icons[alert.severity]}
      <div className="min-w-0">
        <div className="text-[var(--neu-text)] font-medium leading-snug">{alert.message}</div>
        {alert.companyName && (
          <div className="text-xs text-[var(--neu-text-subtle)] mt-0.5">{alert.companyName}</div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-xl p-3 shadow-xl text-sm">
      <div className="font-bold text-[var(--neu-text)] mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--neu-text-subtle)]">{p.name} :</span>
          <span className="font-semibold text-[var(--neu-text)]">
            {p.name === "Masse salariale" ? formatFCFA(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-xl p-3 shadow-xl text-sm">
      <div className="font-bold text-[var(--neu-text)] mb-1">{label}</div>
      <div className="text-[var(--neu-text-subtle)]">
        Effectif : <span className="font-semibold text-emerald-500">{payload[0]?.value}</span>
      </div>
    </div>
  );
}

// ─── Bar chart colors ────────────────────────────────────────────────────────

const BAR_COLORS = [
  "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5",
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
    } catch (err: any) {
      setError("Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Skeleton state ──────────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-80 bg-[var(--neu-bg-subtle)] rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[var(--neu-bg-subtle)] rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-[var(--neu-bg-subtle)] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-[var(--neu-bg-subtle)] rounded-2xl" />
          <div className="h-56 bg-[var(--neu-bg-subtle)] rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-12 text-center space-y-4">
        <ShieldAlert className="mx-auto text-rose-500" size={48} />
        <h2 className="text-lg font-bold text-[var(--neu-text)]">
          Impossible de charger le tableau de bord
        </h2>
        <p className="text-sm text-[var(--neu-text-subtle)]">{error}</p>
        <button
          onClick={fetchStats}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { kpis, monthlySeries, topTenants, alerts, recentActivity } = stats;

  // ─── Derive chart data ───────────────────────────────────────────────────
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

  const errorAlerts = alerts.filter((a) => a.severity === "error");
  const warnAlerts = alerts.filter((a) => a.severity === "warning");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            Dashboard Groupe — Super Admin
          </h1>
          <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
            Vue consolidée de l'ensemble du SaaS PROGITPAIE
            {lastUpdated && (
              <span className="ml-2 text-emerald-500">· Mis à jour à {lastUpdated}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/tenants"
            className="text-xs text-[var(--neu-text-subtle)] hover:text-emerald-500 flex items-center gap-1 transition"
          >
            Gérer les entreprises <ArrowRight size={12} />
          </Link>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Building2 size={24} />}
          label="Entreprises"
          value={kpis.totalTenants}
          sub={`${kpis.activeTenants} actives · ${kpis.inactiveTenants} inactives`}
          accent="text-emerald-500"
        />
        <KpiCard
          icon={<Users size={24} />}
          label="Salariés Groupe"
          value={kpis.totalEmployees.toLocaleString()}
          sub={`${kpis.activeEmployees.toLocaleString()} actifs`}
          accent="text-blue-400"
        />
        <KpiCard
          icon={<DollarSign size={24} />}
          label="Masse Salariale (12 mois)"
          value={formatFCFA(kpis.totalPayrollAmount)}
          sub={`Ce mois : ${formatFCFA(kpis.currentMonthPayrollAmount)}`}
          accent="text-amber-400"
          trend={kpis.currentMonthPayrollAmount > 0 ? "Paie du mois disponible" : undefined}
        />
        <KpiCard
          icon={<FileSpreadsheet size={24} />}
          label="Bulletins / Mois"
          value={kpis.currentMonthPayrollsCount}
          sub={`Total 12 mois : ${kpis.totalPayrollsCount.toLocaleString()}`}
          accent="text-violet-400"
        />
      </div>

      {/* ── AREA CHART — Évolution 12 mois ─────────────────────────────────── */}
      <NeuCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Évolution Mensuelle Groupe (12 derniers mois)
            </h2>
            <p className="text-xs text-[var(--neu-text-subtle)] mt-0.5">
              Masse salariale nette consolidée et bulletins finalisés
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={areaData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSalary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPayrolls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" strokeOpacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--neu-text-subtle)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="salary"
              orientation="left"
              tick={{ fontSize: 10, fill: "var(--neu-text-subtle)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatFCFA(v)}
              width={70}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--neu-text-subtle)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomAreaTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              formatter={(value) => (
                <span style={{ color: "var(--neu-text-subtle)" }}>{value}</span>
              )}
            />
            <Area
              yAxisId="salary"
              type="monotone"
              dataKey="Masse salariale"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradSalary)"
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="Bulletins"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#gradPayrolls)"
              dot={{ r: 3, fill: "#818cf8", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </NeuCard>

      {/* ── BOTTOM ROW : Top Tenants + Alerts ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TOP 5 ENTREPRISES */}
        <NeuCard className="p-6">
          <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-emerald-500" />
            Top Entreprises par Effectif
          </h2>

          {topTenants.length === 0 ? (
            <div className="text-center py-8 text-[var(--neu-text-subtle)] text-sm">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--neu-border)"
                  strokeOpacity={0.5}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "var(--neu-text-subtle)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--neu-text-subtle)" }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--neu-bg-subtle)" }} />
                <Bar dataKey="effectif" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Detail table under chart */}
          {topTenants.length > 0 && (
            <div className="mt-4 divide-y divide-[var(--neu-border)]">
              {topTenants.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                    />
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-[var(--neu-text)] hover:text-emerald-500 transition"
                    >
                      {t.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--neu-text-subtle)]">
                    <span><strong className="text-[var(--neu-text)]">{t.employeeCount}</strong> salariés</span>
                    <span className="text-emerald-500 font-semibold">{formatFCFA(t.totalNetSalary)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuCard>

        {/* ALERTES + ACTIVITÉ RÉCENTE */}
        <div className="space-y-4">
          {/* Alertes */}
          <NeuCard className="p-6">
            <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-400" />
              Alertes Actives
              {alerts.length > 0 && (
                <span className="ml-auto text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
                </span>
              )}
            </h2>

            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-500">
                <CheckCircle2 size={16} />
                Aucune alerte — Toutes les entreprises sont opérationnelles
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {errorAlerts.map((a, i) => (
                  <AlertItem key={`err-${i}`} alert={a} />
                ))}
                {warnAlerts.map((a, i) => (
                  <AlertItem key={`warn-${i}`} alert={a} />
                ))}
              </div>
            )}
          </NeuCard>

          {/* Activité récente */}
          <NeuCard className="p-6">
            <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2 mb-4">
              <Activity size={18} className="text-blue-400" />
              Activité Récente (7 jours)
            </h2>

            {recentActivity.length === 0 ? (
              <div className="text-sm text-[var(--neu-text-subtle)] text-center py-4">
                Aucune activité récente
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {recentActivity.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-xl border border-[var(--neu-border)] hover:bg-[var(--neu-bg-subtle)] transition text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--neu-text)] truncate">{log.action}</div>
                      <div className="text-[var(--neu-text-subtle)] truncate">
                        {log.targetModel} · <span className="text-emerald-500">{log.companyName}</span>
                      </div>
                    </div>
                    <div className="text-[var(--neu-text-subtle)] shrink-0 text-right">
                      {new Date(log.timestamp).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  );
}
