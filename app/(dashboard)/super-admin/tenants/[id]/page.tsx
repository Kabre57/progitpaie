"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Edit,
  Save,
  Check,
  X,
  CreditCard,
  Plus,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import type { CompanyKybDetailsDTO } from "@/lib/application/admin/dto/CompanyKybSubscriptionDTO";

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

  const fetchTenantDetail = async () => {
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
  };

  useEffect(() => {
    fetchTenantDetail();
  }, [id]);

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

  const kybBadgeVariant =
    kyb?.verificationStatus === "APPROVED"
      ? "success"
      : kyb?.verificationStatus === "REJECTED"
      ? "danger"
      : "warning";

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

      {/* ── SECTION 1 : VÉRIFICATION KYB & FORMULE D'ABONNEMENT SAAS ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARTE 1 : VÉRIFICATION KYB / CONFORMITÉ LÉGALE */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#666cff]" />
              Conformité Légale & Dossier KYB
            </h2>
            <NeuBadge variant={kybBadgeVariant}>
              {kyb?.verificationStatus || "PENDING"}
            </NeuBadge>
          </div>

          <p className="text-xs text-[var(--neu-text-secondary)]">
            Pièces justificatives d'immatriculation soumises pour la vérification légale de l'entreprise.
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <NeuButton
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => handleVerifyKyb("APPROVED")}
              loading={verifyingKyb}
            >
              <Check size={14} /> Approuver le dossier
            </NeuButton>
            <NeuButton
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={() => handleVerifyKyb("REJECTED")}
              loading={verifyingKyb}
            >
              <X size={14} /> Rejeter le dossier
            </NeuButton>
          </div>

          {/* List of documents */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase tracking-wider">
              Documents Transmis ({kyb?.documents.length ?? 0})
            </div>

            {kyb?.documents.length === 0 ? (
              <div className="text-xs text-[var(--neu-text-secondary)] text-center py-4 border border-dashed border-[var(--neu-border)] rounded-lg">
                Aucun document n'a été téléversé pour le moment
              </div>
            ) : (
              kyb?.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={15} className="text-[#666cff] shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-[var(--neu-text)]">{doc.fileName}</div>
                      <div className="text-[10px] text-[var(--neu-text-secondary)]">{doc.documentType}</div>
                    </div>
                  </div>
                  <NeuBadge variant={doc.status === "APPROVED" ? "success" : "warning"}>
                    {doc.status}
                  </NeuBadge>
                </div>
              ))
            )}
          </div>

          {/* Form to record a document */}
          <form onSubmit={handleUploadDoc} className="space-y-3 pt-3 border-t border-[var(--neu-border)]">
            <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase tracking-wider">
              Enregistrer une Pièce Jointe
            </div>
            <div className="flex items-end gap-2">
              <div className="w-1/3">
                <NeuSelect
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  options={[
                    { value: "RCCM", label: "RCCM" },
                    { value: "DGI_CC", label: "DGI CC" },
                    { value: "CNPS_ATTESTATION", label: "Attestation CNPS" },
                    { value: "GERANT_ID", label: "Pièce Gérant" },
                  ]}
                />
              </div>
              <div className="flex-1">
                <NeuInput
                  type="text"
                  placeholder="Nom du fichier (ex: rccm.pdf)"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                />
              </div>
              <NeuButton type="submit" size="sm" loading={uploadingDoc} disabled={!uploadFileName}>
                <Plus size={14} /> Ajouter
              </NeuButton>
            </div>
          </form>
        </NeuCard>

        {/* CARTE 2 : FORMULE D'ABONNEMENT SAAS & TARIFICATION */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <CreditCard size={18} className="text-[#666cff]" />
              Abonnement SaaS & Tarification
            </h2>
            <NeuButton
              variant="outline"
              size="sm"
              onClick={() => setEditSub(!editSub)}
            >
              <Edit size={13} /> {editSub ? "Annuler" : "Modifier"}
            </NeuButton>
          </div>

          {!editSub ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
                <span className="text-[var(--neu-text-secondary)]">Formule d'Abonnement</span>
                <span className="font-bold text-[#666cff]">{kyb?.plan || "FREE_TRIAL"}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
                <span className="text-[var(--neu-text-secondary)]">Statut de l'Abonnement</span>
                <NeuBadge variant={kyb?.subscriptionStatus === "ACTIVE" ? "success" : "warning"}>
                  {kyb?.subscriptionStatus || "TRIALING"}
                </NeuBadge>
              </div>
              <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
                <span className="text-[var(--neu-text-secondary)]">Tarif Mensuel (FCFA)</span>
                <span className="font-bold text-[var(--neu-text)]">
                  {(kyb?.monthlyPriceFCFA ?? 0).toLocaleString()} FCFA / mois
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
                <span className="text-[var(--neu-text-secondary)]">Limite Max Salariés</span>
                <span className="font-bold text-[var(--neu-text)]">
                  {kyb?.maxEmployeesAllowed ?? 10} salariés
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--neu-text-secondary)]">Date d'Expiration</span>
                <span className="text-[var(--neu-text)] font-mono">
                  {kyb?.subscriptionExpiresAt
                    ? new Date(kyb.subscriptionExpiresAt).toLocaleDateString("fr-FR")
                    : "Aucune (Illimité)"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <NeuSelect
                label="Formule Plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                options={[
                  { value: "FREE_TRIAL", label: "FREE_TRIAL (Essai Gratuit)" },
                  { value: "STARTER", label: "STARTER (TPE)" },
                  { value: "BUSINESS", label: "BUSINESS (PME)" },
                  { value: "ENTERPRISE", label: "ENTERPRISE (Grand Groupe)" },
                ]}
              />

              <NeuSelect
                label="Statut d'Abonnement"
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value)}
                options={[
                  { value: "TRIALING", label: "TRIALING (En essai)" },
                  { value: "ACTIVE", label: "ACTIVE (Abonné actif)" },
                  { value: "PAST_DUE", label: "PAST_DUE (Retard de paiement)" },
                  { value: "EXPIRED", label: "EXPIRED (Expiré / Accès bloqué)" },
                  { value: "CANCELED", label: "CANCELED (Résilié)" },
                ]}
              />

              <NeuInput
                label="Tarif Mensuel (FCFA)"
                type="number"
                value={String(monthlyPrice)}
                onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
              />

              <NeuInput
                label="Limite Max Salariés"
                type="number"
                value={String(maxEmployees)}
                onChange={(e) => setMaxEmployees(parseInt(e.target.value, 10) || 10)}
              />

              <div className="pt-2">
                <NeuButton
                  variant="default"
                  size="full"
                  onClick={handleUpdateSubscription}
                  loading={savingSub}
                >
                  <Save size={14} /> Sauvegarder l'Abonnement
                </NeuButton>
              </div>
            </div>
          )}
        </NeuCard>

      </div>

      {/* ── SECTION 2 : INFORMATIONS GÉNÉRALES & ADMINS ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INFORMATIONS GÉNÉRALES */}
        <NeuCard className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
            <Building2 size={18} className="text-[#666cff]" />
            Informations Légales & Fiscales
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">Raison Sociale</span>
              <span className="font-semibold text-[var(--neu-text)]">{tenant.name}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">N° CC DGI</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.taxNumber || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">N° CNPS</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.cnpsNumber || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">RCCM</span>
              <span className="font-mono text-[var(--neu-text)]">{tenant.rccm || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">Ville & Pays</span>
              <span className="text-[var(--neu-text)]">{tenant.city || "Abidjan"}, {tenant.country || "Côte d'Ivoire"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">Téléphone</span>
              <span className="text-[var(--neu-text)]">{tenant.phone || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
              <span className="text-[var(--neu-text-secondary)]">Email Officiel</span>
              <span className="text-[var(--neu-text)]">{tenant.email || "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--neu-text-secondary)]">Statut du Compte</span>
              <NeuBadge variant={tenant.status === "ACTIVE" ? "success" : "danger"}>
                {tenant.status === "ACTIVE" ? "Actif" : "Inactif / Suspendu"}
              </NeuBadge>
            </div>
          </div>
        </NeuCard>

        {/* ADMINISTRATEURS DU COMPTE */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#666cff]" />
              Administrateurs du Compte ({admins.length})
            </h2>
          </div>

          {admins.length === 0 ? (
            <p className="text-xs text-[var(--neu-text-secondary)] py-4">Aucun administrateur associé.</p>
          ) : (
            <div className="divide-y divide-[var(--neu-border)]">
              {admins.map((adm) => (
                <div key={adm.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-[var(--neu-text)]">{adm.name}</div>
                    <div className="text-[11px] text-[var(--neu-text-secondary)] font-mono">{adm.email}</div>
                  </div>
                  <NeuBadge variant="accent">{adm.role}</NeuBadge>
                </div>
              ))}
            </div>
          )}
        </NeuCard>
      </div>
    </div>
  );
}
