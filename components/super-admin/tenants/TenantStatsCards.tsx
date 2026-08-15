"use client";

import React from "react";
import { Building2, CheckCircle2, AlertCircle, ShieldCheck, FlaskConical } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";

export interface TenantSummaryItem {
  id: string;
  name: string;
  isMain: boolean;
  isDemo?: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface TenantStatsCardsProps {
  tenants: TenantSummaryItem[];
}

export function TenantStatsCards({ tenants }: TenantStatsCardsProps) {
  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveCount = tenants.filter((t) => t.status === "INACTIVE" || t.status === "SUSPENDED").length;
  const mainTenant = tenants.find((t) => t.isMain);
  const demoCount = tenants.filter((t) => t.isDemo).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <NeuCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-[#666cff]/15 text-[#666cff] rounded-xl">
          <Building2 size={22} />
        </div>
        <div>
          <div className="text-xs text-[var(--neu-text-secondary)]">Total Entreprises</div>
          <div className="text-xl font-bold text-[var(--neu-text)]">{tenants.length}</div>
        </div>
      </NeuCard>

      <NeuCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-[#72e128]/15 text-[#72e128] rounded-xl">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="text-xs text-[var(--neu-text-secondary)]">Actives</div>
          <div className="text-xl font-bold text-[#72e128]">{activeCount}</div>
        </div>
      </NeuCard>

      <NeuCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-[#ff4d49]/15 text-[#ff4d49] rounded-xl">
          <AlertCircle size={22} />
        </div>
        <div>
          <div className="text-xs text-[var(--neu-text-secondary)]">Inactives / Suspendues</div>
          <div className="text-xl font-bold text-[#ff4d49]">{inactiveCount}</div>
        </div>
      </NeuCard>

      <NeuCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-[#fdb528]/15 text-[#fdb528] rounded-xl">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="text-xs text-[var(--neu-text-secondary)]">Siège Historique</div>
          <div className="text-sm font-bold text-[var(--neu-text)] truncate max-w-[140px]">
            {mainTenant?.name || "Aucun"}
          </div>
        </div>
      </NeuCard>

      <NeuCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-amber-500/15 text-amber-600 rounded-xl">
          <FlaskConical size={22} />
        </div>
        <div>
          <div className="text-xs text-[var(--neu-text-secondary)]">Espaces Démo</div>
          <div className="text-xl font-bold text-amber-600">{demoCount}</div>
        </div>
      </NeuCard>
    </div>
  );
}
