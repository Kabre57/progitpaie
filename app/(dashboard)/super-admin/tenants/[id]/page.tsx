"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import type { CompanyKybDetailsDTO } from "@/lib/application/admin/dto/CompanyKybSubscriptionDTO";
import { GeneralTab } from "@/components/super-admin/tenants/TenantDetailTabs/GeneralTab";
import { KYBTab } from "@/components/super-admin/tenants/TenantDetailTabs/KYBTab";
import { SubscriptionTab } from "@/components/super-admin/tenants/TenantDetailTabs/SubscriptionTab";

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
  const [kyb, setKyb] = useState<CompanyKybDetailsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for Subscription
  const [editSub, setEditSub] = useState(false);
  const [plan, setPlan] = useState<string>("FREE_TRIAL");
  const [subStatus, setSubStatus] = useState<string>("TRIALING");
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);
  const [maxEmployees, setMaxEmployees] = useState<number>(10);
  const [savingSub, setSavingSub] = useState(false);

  // Form states for KYB Verification
  const [verifyingKyb, setVerifyingKyb] = useState(false);

  // Document Upload modal
  const [uploadDocType, setUploadDocType] = useState("RCCM");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchTenantDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [resTenant, resKyb] = await Promise.all([
        fetch(`/api/v2/admin/tenants/${id}`),
        fetch(`/api/v2/admin/tenants/${id}/documents`),
      ]);

      const jsonTenant = await resTenant.json();
      const jsonKyb = await resKyb.json();

      if (jsonTenant.success) setData(jsonTenant.data);
      if (jsonKyb.success) {
        setKyb(jsonKyb.data);
        setPlan(jsonKyb.data.plan);
        setSubStatus(jsonKyb.data.subscriptionStatus);
        setMonthlyPrice(jsonKyb.data.monthlyPriceFCFA);
        setMaxEmployees(jsonKyb.data.maxEmployeesAllowed);
      }
    } catch (err) {
      console.error("Échec de chargement des détails entreprise:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTenantDetail();
  }, [fetchTenantDetail]);

  const handleUpdateSubscription = async () => {
    setSavingSub(true);
    try {
      const res = await fetch(`/api/v2/admin/tenants/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          subscriptionStatus: subStatus,
          monthlyPriceFCFA: monthlyPrice,
          maxEmployeesAllowed: maxEmployees,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setKyb(json.data);
        setEditSub(false);
      }
    } catch (err) {
      console.error("Erreur sauvegarde abonnement:", err);
    } finally {
      setSavingSub(false);
    }
  };

  const handleVerifyKyb = async (status: string) => {
    setVerifyingKyb(true);
    try {
      const res = await fetch(`/api/v2/admin/tenants/${id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setKyb(json.data);
      }
    } catch (err) {
      console.error("Erreur validation KYB:", err);
    } finally {
      setVerifyingKyb(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;
    setUploadingDoc(true);
    try {
      const res = await fetch(`/api/v2/admin/tenants/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: uploadDocType,
          fileName: uploadFileName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchTenantDetail();
        setUploadFileName("");
      }
    } catch (err) {
      console.error("Erreur ajout document:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--neu-text-secondary)]">Chargement de la fiche entreprise...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-[#ff4d49]">Entreprise introuvable.</div>;
  }

  const { tenant, admins, stats } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* RETOUR & EN-TÊTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/tenants">
            <NeuButton variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-2">
              <Building2 className="text-[#666cff]" size={24} />
              {tenant.name}
              {tenant.isMain && (
                <NeuBadge variant="warning">★ Siège Principal</NeuBadge>
              )}
            </h1>
            <p className="text-xs text-[var(--neu-text-secondary)] font-mono mt-0.5">
              Identifiant Tenant : {tenant.id}
            </p>
          </div>
        </div>

        <NeuButton variant="ghost" size="sm" onClick={fetchTenantDetail}>
          <RefreshCw size={14} /> Actualiser
        </NeuButton>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#666cff]/15 text-[#666cff] rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Salariés Actifs</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{stats.employeeCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#26c6f9]/15 text-[#26c6f9] rounded-xl">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Bulletins Générés</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{stats.payrollCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#fdb528]/15 text-[#fdb528] rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Congés Validés</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{stats.activeLeavesCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#72e128]/15 text-[#72e128] rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Masse Salariale Nette</div>
            <div className="text-sm font-bold text-[#72e128]">
              {stats.totalPayrollAmount.toLocaleString()} FCFA
            </div>
          </div>
        </NeuCard>
      </div>

      {/* SECTION VÉRIFICATION KYB & ABONNEMENT SAAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KYBTab
          kyb={kyb}
          verifyingKyb={verifyingKyb}
          onVerifyKyb={handleVerifyKyb}
          uploadDocType={uploadDocType}
          setUploadDocType={setUploadDocType}
          uploadFileName={uploadFileName}
          setUploadFileName={setUploadFileName}
          uploadingDoc={uploadingDoc}
          onUploadDoc={handleUploadDoc}
        />

        <SubscriptionTab
          kyb={kyb}
          editSub={editSub}
          setEditSub={setEditSub}
          plan={plan}
          setPlan={setPlan}
          subStatus={subStatus}
          setSubStatus={setSubStatus}
          monthlyPrice={monthlyPrice}
          setMonthlyPrice={setMonthlyPrice}
          maxEmployees={maxEmployees}
          setMaxEmployees={setMaxEmployees}
          savingSub={savingSub}
          onUpdateSubscription={handleUpdateSubscription}
        />
      </div>

      {/* SECTION INFORMATIONS JURIDIQUES & ADMINISTRATEURS */}
      <GeneralTab tenant={tenant} admins={admins} />
    </div>
  );
}
