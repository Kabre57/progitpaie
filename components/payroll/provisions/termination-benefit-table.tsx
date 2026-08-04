import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card";
import { WarningBadge } from "@/components/ui/warning-badge";
import { formatMoney } from "@/lib/utils/format-money";
import type { TerminationBenefitDTO, TerminationBenefitV2DTO } from "@/shared/types/contracts/provision.contract";
import { ProvisionWarningList } from "./provision-warning-list";

type TerminationBenefitTableProps =
  | { apiVersion: "v2"; rows: readonly TerminationBenefitV2DTO[] }
  | { apiVersion: "legacy"; rows: readonly TerminationBenefitDTO[] };

export function TerminationBenefitTable(props: TerminationBenefitTableProps) {
  const v2 = props.apiVersion === "v2";
  return <NeuCard>
    <NeuCardHeader className="border-b border-[var(--neu-border)] p-4"><NeuCardTitle>Indemnités de licenciement</NeuCardTitle></NeuCardHeader>
    <NeuCardContent className="overflow-x-auto p-0"><table className="w-full border-collapse text-left text-xs">
      <thead><tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] uppercase text-[11px] text-[var(--neu-text-secondary)]">
        <th className="px-4 py-3">Matricule</th><th className="px-4 py-3">Nom</th><th className="px-4 py-3 text-right">Ancienneté</th>
        <th className="px-4 py-3 text-right">Salaire moyen</th>{v2 && <><th className="px-4 py-3">Éligibilité</th><th className="px-4 py-3">Base</th><th className="px-4 py-3">Alertes</th></>}
        <th className="px-4 py-3 text-right">Exposition théorique</th>
      </tr></thead>
      <tbody className="divide-y divide-[var(--neu-border)]">
        {props.rows.length === 0 && <tr><td colSpan={v2 ? 8 : 5} className="px-4 py-10 text-center text-[var(--neu-text-secondary)]">Aucune indemnité de licenciement pour cette période.</td></tr>}
        {props.apiVersion === "v2" ? props.rows.map((row) => <tr key={row.userId} className="align-top hover:bg-[var(--neu-surface-light)]">
          <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId ?? "—"}</td><td className="px-4 py-3 font-bold">{row.employeeName}</td>
          <td className="px-4 py-3 text-right">{Number(row.seniorityYears).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ans</td>
          <td className="px-4 py-3 text-right font-mono">{formatMoney(row.averageMonthlySalary)}<div className="text-[10px] text-[var(--neu-text-secondary)]">{row.salaryMonthsUsed} mois</div></td>
          <td className="px-4 py-3"><NeuBadge variant={row.eligible ? "success" : "default"}>{row.eligible ? "Éligible" : "Non éligible"}</NeuBadge></td>
          <td className="px-4 py-3">{row.calculationBasis === "ACTUAL_PAYROLL" ? "Paies validées" : "Fallback contractuel"}</td>
          <td className="px-4 py-3">{row.warnings.length > 0 ? <details><summary className="cursor-pointer list-none"><WarningBadge count={row.warnings.length} severity={row.warnings.some((w) => w.severity === "error") ? "error" : row.warnings.some((w) => w.severity === "warning") ? "warning" : "info"} /></summary><div className="mt-2 min-w-72"><ProvisionWarningList warnings={row.warnings} title={`Alertes de ${row.employeeName}`} collapsible={false} /></div></details> : "—"}</td>
          <td className="px-4 py-3 text-right font-mono font-extrabold text-indigo-400">{formatMoney(row.theoreticalExposure)}
            <details className="mt-1 text-left text-[10px] font-normal text-[var(--neu-text-secondary)]"><summary className="cursor-pointer">Voir les tranches</summary>
              <div>T1 : {row.firstTrancheMonths} mois — {formatMoney(row.firstTrancheAmount)}</div><div>T2 : {row.secondTrancheMonths} mois — {formatMoney(row.secondTrancheAmount)}</div><div>T3 : {row.thirdTrancheMonths} mois — {formatMoney(row.thirdTrancheAmount)}</div>
            </details>
          </td>
        </tr>) : props.rows.map((row) => <tr key={row.userId} className="hover:bg-[var(--neu-surface-light)]">
          <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId ?? "—"}</td><td className="px-4 py-3 font-bold">{row.name}</td>
          <td className="px-4 py-3 text-right">{row.seniorityYears} ans</td><td className="px-4 py-3 text-right font-mono">{formatMoney(row.grossMonthly)}</td>
          <td className="px-4 py-3 text-right font-mono font-extrabold text-indigo-400">{formatMoney(row.provisionAmount)}</td>
        </tr>)}
      </tbody>
    </table></NeuCardContent>
  </NeuCard>;
}
