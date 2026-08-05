"use client";

import { useState } from "react";
import { Calculator, RefreshCw } from "lucide-react";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuPagination } from "@/components/ui/neu-pagination";
import { LeaveProvisionTable } from "@/components/payroll/provisions/leave-provision-table";
import { ProvisionErrorState } from "@/components/payroll/provisions/provision-error-state";
import { ProvisionPageSkeleton } from "@/components/payroll/provisions/provision-page-skeleton";
import { ProvisionSummary } from "@/components/payroll/provisions/provision-summary";
import { ProvisionWarningList } from "@/components/payroll/provisions/provision-warning-list";
import { TerminationBenefitTable } from "@/components/payroll/provisions/termination-benefit-table";
import { usePayrollProvisions } from "@/lib/hooks/use-payroll-provisions";
import type { ProvisionResponse, ProvisionResponseV2 } from "@/shared/types/contracts/provision.contract";

const ITEMS_PER_PAGE = 10;
type ActiveTab = "leaves" | "termination";

interface ContentState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentPageLeaves: number;
  setCurrentPageLeaves: (page: number) => void;
  currentPageTermination: number;
  setCurrentPageTermination: (page: number) => void;
}

function Tabs({ activeTab, setActiveTab }: Pick<ContentState, "activeTab" | "setActiveTab">) {
  return <div className="flex gap-2 border-b border-[var(--neu-border)] pb-2">
    <NeuButton variant={activeTab === "leaves" ? "accent" : "ghost"} onClick={() => setActiveTab("leaves")}>Congés payés</NeuButton>
    <NeuButton variant={activeTab === "termination" ? "accent" : "ghost"} onClick={() => setActiveTab("termination")}>Indemnités de licenciement</NeuButton>
  </div>;
}

function EmptyState() {
  return <div className="rounded-xl border border-[var(--neu-border)] p-10 text-center text-[var(--neu-text-secondary)]">Aucune donnée de provision disponible pour cette période.</div>;
}

function V2Content({ data, state }: { data: ProvisionResponseV2; state: ContentState }) {
  const leavePages = Math.ceil(data.leaveProvisions.length / ITEMS_PER_PAGE);
  const terminationPages = Math.ceil(data.terminationBenefits.length / ITEMS_PER_PAGE);
  const leaves = data.leaveProvisions.slice((state.currentPageLeaves - 1) * ITEMS_PER_PAGE, state.currentPageLeaves * ITEMS_PER_PAGE);
  const terminations = data.terminationBenefits.slice((state.currentPageTermination - 1) * ITEMS_PER_PAGE, state.currentPageTermination * ITEMS_PER_PAGE);
  const empty = data.leaveProvisions.length === 0 && data.terminationBenefits.length === 0;

  return <>
    <div className="flex flex-wrap gap-2 text-xs"><NeuBadge variant="accent">Règles {data.ruleVersion}</NeuBadge><NeuBadge variant="info">Référence {new Date(data.referenceDate).toLocaleDateString("fr-FR")}</NeuBadge><NeuBadge variant="default">{data.employeesProcessed} employés</NeuBadge></div>
    <ProvisionWarningList warnings={data.warnings} title="Alertes globales de calcul" />
    <ProvisionSummary totalLeaveProvision={data.totalLeaveProvision} totalTerminationExposure={data.totalTerminationExposure} totalExposure={data.totalExposure} />
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface-light)] p-3 text-xs md:grid-cols-4">
      <div>Historiques complets <strong>{data.dataQuality.completeSalaryHistories}</strong></div><div>Historiques incomplets <strong>{data.dataQuality.incompleteSalaryHistories}</strong></div>
      <div>Fallbacks contractuels <strong>{data.dataQuality.contractFallbacks}</strong></div><div>Soldes hérités <strong>{data.dataQuality.legacyLeaveBalances}</strong></div>
    </div>
    {empty ? <EmptyState /> : <><Tabs activeTab={state.activeTab} setActiveTab={state.setActiveTab} />
      {state.activeTab === "leaves" ? <><LeaveProvisionTable apiVersion="v2" rows={leaves} /><NeuPagination currentPage={state.currentPageLeaves} totalPages={leavePages} totalItems={data.leaveProvisions.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={state.setCurrentPageLeaves} /></>
        : <><TerminationBenefitTable apiVersion="v2" rows={terminations} /><NeuPagination currentPage={state.currentPageTermination} totalPages={terminationPages} totalItems={data.terminationBenefits.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={state.setCurrentPageTermination} /></>}
    </>}
  </>;
}

function LegacyContent({ data, state }: { data: ProvisionResponse; state: ContentState }) {
  const leavePages = Math.ceil(data.leaveProvisions.length / ITEMS_PER_PAGE);
  const terminationPages = Math.ceil(data.retirementProvisions.length / ITEMS_PER_PAGE);
  const leaves = data.leaveProvisions.slice((state.currentPageLeaves - 1) * ITEMS_PER_PAGE, state.currentPageLeaves * ITEMS_PER_PAGE);
  const terminations = data.retirementProvisions.slice((state.currentPageTermination - 1) * ITEMS_PER_PAGE, state.currentPageTermination * ITEMS_PER_PAGE);
  const empty = data.leaveProvisions.length === 0 && data.retirementProvisions.length === 0;

  return <>
    <div role="status" className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-200">Mode de compatibilité actif — les détails de calcul et les alertes de qualité ne sont pas disponibles.</div>
    <ProvisionSummary totalLeaveProvision={data.totalLeaveProvision} totalTerminationExposure={data.totalRetirementProvision} totalExposure={data.total} />
    {empty ? <EmptyState /> : <><Tabs activeTab={state.activeTab} setActiveTab={state.setActiveTab} />
      {state.activeTab === "leaves" ? <><LeaveProvisionTable apiVersion="legacy" rows={leaves} /><NeuPagination currentPage={state.currentPageLeaves} totalPages={leavePages} totalItems={data.leaveProvisions.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={state.setCurrentPageLeaves} /></>
        : <><TerminationBenefitTable apiVersion="legacy" rows={terminations} /><NeuPagination currentPage={state.currentPageTermination} totalPages={terminationPages} totalItems={data.retirementProvisions.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={state.setCurrentPageTermination} /></>}
    </>}
  </>;
}

export default function ProvisionsPage() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: Math.max(1, currentYear - 2023) }, (_, index) => currentYear - index);
  const [year, setYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<ActiveTab>("leaves");
  const [currentPageLeaves, setCurrentPageLeaves] = useState(1);
  const [currentPageTermination, setCurrentPageTermination] = useState(1);
  const provisions = usePayrollProvisions({ year });
  const state: ContentState = { activeTab, setActiveTab, currentPageLeaves, setCurrentPageLeaves, currentPageTermination, setCurrentPageTermination };

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    setCurrentPageLeaves(1);
    setCurrentPageTermination(1);
  };

  if (provisions.isPending) return <ProvisionPageSkeleton />;
  if (provisions.isError) return <ProvisionErrorState error={provisions.error} onRetry={() => void provisions.refresh()} />;
  if (!provisions.data) return <ProvisionPageSkeleton />;

  return <div className="space-y-6">
    <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--neu-text)]"><Calculator className="text-[var(--neu-accent)]" aria-hidden="true" /> Provisions et engagements sociaux</h1><p className="mt-1 text-sm text-[var(--neu-text-secondary)]">Congés payés et indemnités de licenciement selon les règles ivoiriennes.</p></div>
      <div className="flex items-center gap-3"><select aria-label="Année de référence" value={year} onChange={(event) => changeYear(Number(event.target.value))} className="rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface-light)] px-3 py-1.5 text-sm font-bold text-[var(--neu-text)]">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <NeuButton onClick={() => void provisions.refresh()} disabled={provisions.isFetching} variant="ghost" size="sm"><RefreshCw className={`h-4 w-4 ${provisions.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />{provisions.isFetching ? "Actualisation…" : "Actualiser"}</NeuButton></div>
    </header>
    <V2Content data={provisions.data.data} state={state} />
  </div>;
}

