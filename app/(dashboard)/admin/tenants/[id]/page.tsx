"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface TenantDetailData {
  tenant: {
    id: string;
    name: string;
    taxNumber?: string;
    cnpsNumber?: string;
    rccm?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    isMain: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    employeeCount?: number;
    payrollCount?: number;
  };
  admins: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>;
  stats: {
    employeeCount: number;
    payrollCount: number;
    activeLeavesCount: number;
    totalPayrollAmount: number;
  };
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<TenantDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTenantDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/admin/tenants/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Échec de chargement des détails entreprise:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetail();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-[var(--neu-text-subtle)]">Chargement de la fiche entreprise...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-rose-500">Entreprise introuvable.</div>;
  }

  const { tenant, admins, stats } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* RETOUR & EN-TÊTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tenants"
            className="p-2 border border-[var(--neu-border)] text-[var(--neu-text-subtle)] hover:text-emerald-500 rounded-xl transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Building2 className="text-emerald-500" size={28} />
              {tenant.name}
              {tenant.isMain && (
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs rounded-full font-semibold">
                  ★ Siège Principal
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--neu-text-subtle)] font-mono mt-1">
              Identifiant Système Tenant : {tenant.id}
            </p>
          </div>
        </div>

        <button
          onClick={fetchTenantDetail}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-emerald-500 flex items-center gap-1 self-start md:self-auto"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Salariés Actifs</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{stats.employeeCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Bulletins Générés</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{stats.payrollCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Congés Validés</div>
            <div className="text-xl font-bold text-amber-500">{stats.activeLeavesCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Masse Salariale Net</div>
            <div className="text-sm font-bold text-emerald-600">
              {stats.totalPayrollAmount.toLocaleString()} FCFA
            </div>
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INFORMATIONS GÉNÉRALES */}
        <NeuCard className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
            <Building2 size={20} className="text-emerald-500" />
            Informations Légales & Fiscales
          </h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">Raison Sociale</span>
              <span className="font-semibold text-[var(--neu-text)]">{tenant.name}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">N° Compte Contribuable (CC DGI)</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.taxNumber || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">N° Affiliation CNPS</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.cnpsNumber || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">Registre du Commerce (RCCM)</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.rccm || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">Ville & Pays</span>
              <span className="text-[var(--neu-text)]">{tenant.city || "Abidjan"}, {tenant.country || "Côte d'Ivoire"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">Téléphone</span>
              <span className="text-[var(--neu-text)]">{tenant.phone || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-subtle)]">Email Officiel</span>
              <span className="text-[var(--neu-text)]">{tenant.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--neu-text-subtle)]">Statut du Compte</span>
              {tenant.status === "ACTIVE" ? (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Actif
                </span>
              ) : (
                <span className="text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle size={14} /> Inactif / Suspendu
                </span>
              )}
            </div>
          </div>
        </NeuCard>

        {/* ADMINISTRATEURS DU COMPTE */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-500" />
              Administrateurs du Compte ({admins.length})
            </h2>
          </div>

          {admins.length === 0 ? (
            <p className="text-xs text-[var(--neu-text-subtle)] py-4">Aucun administrateur associé.</p>
          ) : (
            <div className="divide-y divide-[var(--neu-border)]">
              {admins.map((adm) => (
                <div key={adm.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-[var(--neu-text)]">{adm.name}</div>
                    <div className="text-xs text-[var(--neu-text-subtle)] font-mono">{adm.email}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs rounded-full font-semibold uppercase">
                    {adm.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </NeuCard>
      </div>
    </div>
  );
}
