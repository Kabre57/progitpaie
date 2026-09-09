"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Users,
  Building2,
  RefreshCw,
  Edit,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuDialog } from "@/components/ui/neu-dialog";
import type { SaaSMetricsDTO, TenantSubscriptionSummaryDTO } from "@/lib/application/admin/dto/SubscriptionMetricsDTO";

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: "#8589ff",
  STARTER: "#26c6f9",
  BUSINESS: "#666cff",
  ENTERPRISE: "#72e128",
};

interface SubscriptionsApiResponse {
  metrics: SaaSMetricsDTO;
  tenants: TenantSubscriptionSummaryDTO[];
}

export default function SuperAdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [editingTenant, setEditingTenant] = useState<TenantSubscriptionSummaryDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for edit
  const [editPlan, setEditPlan] = useState<"FREE_TRIAL" | "STARTER" | "BUSINESS" | "ENTERPRISE">("STARTER");
  const [editStatus, setEditStatus] = useState<"TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED">("ACTIVE");
  const [editPrice, setEditPrice] = useState<number>(50000);
  const [editMaxEmployees, setEditMaxEmployees] = useState<number>(25);

  const { data, isLoading, isFetching, refetch } = useQuery<SubscriptionsApiResponse>({
    queryKey: ["super-admin-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/v2/admin/subscriptions");
      const json = await res.json();
      if (json.success) {
        return {
          metrics: json.data.metrics,
          tenants: json.data.tenants,
        };
      }
      throw new Error(json.error || "Erreur chargement abonnements");
    },
  });

  const metrics = data?.metrics || null;
  const tenants = data?.tenants || [];
  const loading = isLoading;

  const handleOpenEdit = (t: TenantSubscriptionSummaryDTO) => {
    setEditingTenant(t);
    setEditPlan(t.plan as "FREE_TRIAL" | "STARTER" | "BUSINESS" | "ENTERPRISE");
    setEditStatus(t.status as "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED");
    setEditPrice(t.monthlyPriceFCFA);
    setEditMaxEmployees(t.maxEmployeesAllowed);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v2/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: editingTenant.id,
          plan: editPlan,
          subscriptionStatus: editStatus,
          monthlyPriceFCFA: Number(editPrice),
          maxEmployeesAllowed: Number(editMaxEmployees),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingTenant(null);
        queryClient.invalidateQueries({ queryKey: ["super-admin-subscriptions"] });
      } else {
        alert(json.error || "Échec de mise à jour");
      }
    } catch {
      alert("Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFCFA = (val: number) => {
    return `${val.toLocaleString("fr-FR")} FCFA`;
  };

  if (loading && !metrics) {
    return <div className="p-8 text-center text-[var(--neu-text-secondary)]">Chargement du module Abonnements...</div>;
  }

  const pieData = metrics?.planBreakdown.map((p) => ({
    name: p.plan,
    value: p.count,
    color: PLAN_COLORS[p.plan] || "#888",
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <CreditCard size={24} className="text-[#666cff]" />
            Abonnements, Licences SaaS & Quotas
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Suivi du MRR, ARR, répartition des offres commerciales et gestion des quotas par entreprise
          </p>
        </div>

        <NeuButton variant="default" size="sm" onClick={() => refetch()} loading={isFetching}>
          <RefreshCw size={14} /> Actualiser
        </NeuButton>
      </div>

      {/* ── KPIS FINANCIERS & QUOTAS ───────────────────────────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NeuCard className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#72e128]/15 text-[#72e128] rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-xs text-[var(--neu-text-secondary)] uppercase font-semibold">MRR (Revenu Mensuel)</div>
              <div className="text-2xl font-bold text-[#72e128]">{formatFCFA(metrics.mrrFCFA)}</div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">ARR estimé : {formatFCFA(metrics.arrFCFA)}</div>
            </div>
          </NeuCard>

          <NeuCard className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#666cff]/15 text-[#666cff] rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <div className="text-xs text-[var(--neu-text-secondary)] uppercase font-semibold">Licences Actives</div>
              <div className="text-2xl font-bold text-[#666cff]">{metrics.activeSubscriptions} / {metrics.totalSubscriptions}</div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">{metrics.trialingSubscriptions} en essai gratuit</div>
            </div>
          </NeuCard>

          <NeuCard className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#26c6f9]/15 text-[#26c6f9] rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs text-[var(--neu-text-secondary)] uppercase font-semibold">Salariés Facturables</div>
              <div className="text-2xl font-bold text-[#26c6f9]">{metrics.totalEmployeesInSaaS}</div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">Sur l&apos;ensemble du parc client</div>
            </div>
          </NeuCard>

          <NeuCard className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#ff4d49]/15 text-[#ff4d49] rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs text-[var(--neu-text-secondary)] uppercase font-semibold">Alertes Quotas (≥80%)</div>
              <div className="text-2xl font-bold text-[#ff4d49]">{metrics.quotaAlerts.length}</div>
              <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">Entreprises proches du plafond</div>
            </div>
          </NeuCard>
        </div>
      )}

      {/* ── RÉPARTITION DES PLANS & ALERTES DE DÉPASSEMENT ──────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRAPHIQUE FORMULES */}
          <NeuCard className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <CreditCard size={18} className="text-[#666cff]" />
              Répartition par Plan SaaS
            </h2>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name] || "#666cff"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {metrics.planBreakdown.map((p) => (
                <div key={p.plan} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--neu-surface-light)]">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PLAN_COLORS[p.plan] || "#666cff" }} />
                  <div className="truncate">
                    <div className="font-semibold text-[var(--neu-text)]">{p.plan}</div>
                    <div className="text-[10px] text-[var(--neu-text-secondary)]">{p.count} clients</div>
                  </div>
                </div>
              ))}
            </div>
          </NeuCard>

          {/* ALERTES QUOTAS */}
          <NeuCard className="p-5 lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#fdb528]" />
              Surveillance des Quotas d&apos;Effectifs Salariés
            </h2>

            {metrics.quotaAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--neu-text-secondary)] flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-[#72e128]" />
                Toutes les entreprises respectent leurs quotas d&apos;effectifs.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {metrics.quotaAlerts.map((qa) => (
                  <div
                    key={qa.companyId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${
                      qa.isExceeded
                        ? "bg-[#ff4d49]/10 border-[#ff4d49]/30 text-[#ff4d49]"
                        : "bg-[#fdb528]/10 border-[#fdb528]/30 text-[#fdb528]"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-[var(--neu-text)]">{qa.companyName}</div>
                      <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">
                        Formule : <span className="font-semibold">{qa.plan}</span> · {qa.currentEmployees} / {qa.maxAllowed} salariés ({qa.usagePercentage}%)
                      </div>
                    </div>
                    <NeuBadge variant={qa.isExceeded ? "error" : "warning"}>
                      {qa.isExceeded ? "QUOTA DÉPASSÉ" : "PROCHE DU PLAFOND"}
                    </NeuBadge>
                  </div>
                ))}
              </div>
            )}
          </NeuCard>
        </div>
      )}

      {/* ── TABLEAU DE TOUTES LES ENTREPRISES & GESTION LICENCES ────────────── */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
          <Building2 size={18} className="text-[#666cff]" />
          Liste des Licences & Abonnements Entreprises ({tenants.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--neu-border)] text-[var(--neu-text-secondary)]">
                <th className="py-3 px-4">Entreprise</th>
                <th className="py-3 px-4">Formule</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Prix Mensuel</th>
                <th className="py-3 px-4">Utilisation Quota</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {tenants.map((t) => {
                const ratio = t.maxEmployeesAllowed > 0 ? (t.currentEmployees / t.maxEmployeesAllowed) * 100 : 100;
                return (
                  <tr key={t.id} className="hover:bg-[var(--neu-surface-light)]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[var(--neu-text)]">{t.name}</td>
                    <td className="py-3 px-4">
                      <NeuBadge variant={t.plan === "ENTERPRISE" ? "success" : "default"}>{t.plan}</NeuBadge>
                    </td>
                    <td className="py-3 px-4">
                      <NeuBadge variant={t.status === "ACTIVE" ? "success" : t.status === "TRIALING" ? "warning" : "error"}>
                        {t.status}
                      </NeuBadge>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[var(--neu-text)]">
                      {formatFCFA(t.monthlyPriceFCFA)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[var(--neu-surface-light)] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ratio > 100 ? "bg-[#ff4d49]" : ratio >= 80 ? "bg-[#fdb528]" : "bg-[#72e128]"
                            }`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[var(--neu-text-secondary)]">
                          {t.currentEmployees}/{t.maxEmployeesAllowed}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <NeuButton size="sm" variant="ghost" onClick={() => handleOpenEdit(t)}>
                        <Edit size={13} /> Gérer
                      </NeuButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* ── MODAL D'AJUSTEMENT DU PLAN & QUOTA ─────────────────────────────── */}
      {editingTenant && (
        <NeuDialog
          open={Boolean(editingTenant)}
          onClose={() => setEditingTenant(null)}
          title={`Modifier l'Abonnement — ${editingTenant.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Plan Tarifaire</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value as "FREE_TRIAL" | "STARTER" | "BUSINESS" | "ENTERPRISE")}
                className="w-full bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-xl px-3 py-2 text-xs text-[var(--neu-text)] focus:outline-none focus:ring-2 focus:ring-[#666cff]"
              >
                <option value="FREE_TRIAL">FREE_TRIAL (Essai gratuit)</option>
                <option value="STARTER">STARTER (PME 1-10)</option>
                <option value="BUSINESS">BUSINESS (10-50)</option>
                <option value="ENTERPRISE">ENTERPRISE (Grand Compte)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Statut de la Licence</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED")}
                className="w-full bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-xl px-3 py-2 text-xs text-[var(--neu-text)] focus:outline-none focus:ring-2 focus:ring-[#666cff]"
              >
                <option value="ACTIVE">ACTIVE (Opérationnel)</option>
                <option value="TRIALING">TRIALING (En essai)</option>
                <option value="PAST_DUE">PAST_DUE (Paiement en attente)</option>
                <option value="CANCELED">CANCELED (Résilié)</option>
                <option value="EXPIRED">EXPIRED (Expiré)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Tarif Mensuel (FCFA)</label>
                <NeuInput
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Quota Salariés Max</label>
                <NeuInput
                  type="number"
                  value={editMaxEmployees}
                  onChange={(e) => setEditMaxEmployees(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <NeuButton variant="ghost" type="button" onClick={() => setEditingTenant(null)}>
                Annuler
              </NeuButton>
              <NeuButton variant="default" type="submit" loading={submitting}>
                Enregistrer les modifications
              </NeuButton>
            </div>
          </form>
        </NeuDialog>
      )}
    </div>
  );
}
