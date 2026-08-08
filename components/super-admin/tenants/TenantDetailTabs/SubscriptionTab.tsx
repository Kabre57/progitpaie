"use client";

import React from "react";
import { CreditCard, Edit, Save } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import type { CompanyKybDetailsDTO } from "@/lib/application/admin/dto/CompanyKybSubscriptionDTO";

interface SubscriptionTabProps {
  kyb: CompanyKybDetailsDTO | null;
  editSub: boolean;
  setEditSub: (val: boolean) => void;
  plan: string;
  setPlan: (val: string) => void;
  subStatus: string;
  setSubStatus: (val: string) => void;
  monthlyPrice: number;
  setMonthlyPrice: (val: number) => void;
  maxEmployees: number;
  setMaxEmployees: (val: number) => void;
  savingSub: boolean;
  onUpdateSubscription: () => void;
}

export function SubscriptionTab({
  kyb,
  editSub,
  setEditSub,
  plan,
  setPlan,
  subStatus,
  setSubStatus,
  monthlyPrice,
  setMonthlyPrice,
  maxEmployees,
  setMaxEmployees,
  savingSub,
  onUpdateSubscription,
}: SubscriptionTabProps) {
  return (
    <NeuCard className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
        <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
          <CreditCard size={18} className="text-[#666cff]" />
          Abonnement SaaS & Tarification
        </h2>
        <NeuButton variant="ghost" size="sm" onClick={() => setEditSub(!editSub)}>
          <Edit size={13} /> {editSub ? "Annuler" : "Modifier"}
        </NeuButton>
      </div>

      {!editSub ? (
        <div className="space-y-3 text-xs">
          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Formule d&apos;Abonnement</span>
            <span className="font-bold text-[#666cff]">{kyb?.plan || "FREE_TRIAL"}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Statut de la Souscription</span>
            <span className="font-semibold text-emerald-500">{kyb?.subscriptionStatus || "TRIALING"}</span>
          </div>

          <div className="flex justify-between border-b border-[var(--neu-border)]/50 pb-2">
            <span className="text-[var(--neu-text-secondary)]">Tarification Mensuelle</span>
            <span className="font-bold text-[var(--neu-text)]">
              {(kyb?.monthlyPriceFCFA ?? 0).toLocaleString()} FCFA / mois
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--neu-text-secondary)]">Limite Salariés</span>
            <span className="font-bold text-[var(--neu-text)]">{kyb?.maxEmployeesAllowed ?? 10} Salariés</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <NeuSelect
              label="Formule Plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              options={[
                { value: "FREE_TRIAL", label: "Essai Gratuit" },
                { value: "STARTER", label: "Starter" },
                { value: "BUSINESS", label: "Business" },
                { value: "ENTERPRISE", label: "Enterprise" },
              ]}
            />
            <NeuSelect
              label="Statut Abonnement"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              options={[
                { value: "TRIALING", label: "En Essai" },
                { value: "ACTIVE", label: "Actif" },
                { value: "PAST_DUE", label: "Impayé" },
                { value: "CANCELED", label: "Annulé" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NeuInput
              label="Prix Mensuel (FCFA)"
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(Number(e.target.value))}
            />
            <NeuInput
              label="Limite Salariés Max"
              type="number"
              value={maxEmployees}
              onChange={(e) => setMaxEmployees(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end pt-2">
            <NeuButton size="sm" variant="accent" onClick={onUpdateSubscription} loading={savingSub}>
              <Save size={14} /> Sauvegarder l&apos;Abonnement
            </NeuButton>
          </div>
        </div>
      )}
    </NeuCard>
  );
}
