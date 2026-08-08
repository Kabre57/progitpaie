"use client";

import React from "react";
import { Building2, Users } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";

export interface TenantGeneralInfo {
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
  createdAt: string;
  updatedAt: string;
}

export interface TenantAdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface GeneralTabProps {
  tenant: TenantGeneralInfo;
  admins: TenantAdminUser[];
}

export function GeneralTab({ tenant, admins }: GeneralTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* INFORMATIONS LEGALES */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--neu-text)] border-b border-[var(--neu-border)] pb-3 flex items-center gap-2">
          <Building2 size={18} className="text-[#666cff]" />
          Identité & Immatriculation Juridique
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Raison Sociale</span>
            <span className="font-bold text-[var(--neu-text)]">{tenant.name}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Compte Contribuable (N° CC)</span>
            <span className="font-mono text-[var(--neu-text)]">{tenant.taxNumber || "Non renseigné"}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">N° Employeur CNPS</span>
            <span className="font-mono text-[var(--neu-text)]">{tenant.cnpsNumber || "Non renseigné"}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Registre du Commerce (RCCM)</span>
            <span className="font-mono text-[var(--neu-text)]">{tenant.rccm || "Non renseigné"}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Adresse Physico-Postale</span>
            <span className="text-[var(--neu-text)]">{tenant.address || "Non renseignée"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--neu-text-secondary)]">Ville & Pays</span>
            <span className="text-[var(--neu-text)]">
              {tenant.city || "Abidjan"}, {tenant.country || "Côte d'Ivoire"}
            </span>
          </div>
        </div>
      </NeuCard>

      {/* ADMINISTRATEURS ET COMPTES COMPTABILITE */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--neu-text)] border-b border-[var(--neu-border)] pb-3 flex items-center gap-2">
          <Users size={18} className="text-[#666cff]" />
          Administrateurs Clés & Accès RH
        </h2>

        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="text-xs text-[var(--neu-text-secondary)] text-center py-4">
              Aucun utilisateur administrateur enregistré.
            </div>
          ) : (
            admins.map((adm) => (
              <div
                key={adm.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-xs"
              >
                <div>
                  <div className="font-bold text-[var(--neu-text)]">{adm.name}</div>
                  <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">{adm.email}</div>
                </div>
                <span className="text-[10px] bg-[#666cff]/15 text-[#666cff] px-2 py-0.5 rounded font-bold uppercase">
                  {adm.role}
                </span>
              </div>
            ))
          )}
        </div>
      </NeuCard>
    </div>
  );
}
