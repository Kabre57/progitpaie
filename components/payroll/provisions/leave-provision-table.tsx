import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card";
import { WarningBadge } from "@/components/ui/warning-badge";
import { formatMoney } from "@/lib/utils/format-money";
import type { LeaveProvisionDTO, LeaveProvisionV2DTO } from "@/shared/types/contracts/provision.contract";
import { ProvisionWarningList } from "./provision-warning-list";

type LeaveProvisionTableProps =
  | { apiVersion: "v2"; rows: readonly LeaveProvisionV2DTO[] }
  | { apiVersion: "legacy"; rows: readonly LeaveProvisionDTO[] };

function EmptyRow({ columns }: { columns: number }) {
  return <tr><td colSpan={columns} className="px-4 py-10 text-center text-[var(--neu-text-secondary)]">Aucune donnée de congés pour cette période.</td></tr>;
}

export function LeaveProvisionTable(props: LeaveProvisionTableProps) {
  const v2 = props.apiVersion === "v2";
  return <NeuCard>
    <NeuCardHeader className="border-b border-[var(--neu-border)] p-4"><NeuCardTitle>Provision pour congés payés non pris</NeuCardTitle></NeuCardHeader>
    <NeuCardContent className="overflow-x-auto p-0"><table className="w-full border-collapse text-left text-xs">
      <thead><tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] uppercase text-[11px] text-[var(--neu-text-secondary)]">
        <th className="px-4 py-3">Matricule</th><th className="px-4 py-3">Nom</th>
        <th className="px-4 py-3 text-right">Salaire moyen</th><th className="px-4 py-3 text-right">Jours acquis</th>
        {v2 && <><th className="px-4 py-3 text-right">Bonus</th><th className="px-4 py-3 text-right">Solde final</th><th className="px-4 py-3">Méthode</th><th className="px-4 py-3">Alertes</th></>}
        <th className="px-4 py-3 text-right">Provision</th>
      </tr></thead>
      <tbody className="divide-y divide-[var(--neu-border)]">
        {props.rows.length === 0 && <EmptyRow columns={v2 ? 9 : 5} />}
        {props.apiVersion === "v2" ? props.rows.map((row) => <tr key={row.userId} className="align-top hover:bg-[var(--neu-surface-light)]">
          <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId ?? "—"}</td>
          <td className="px-4 py-3 font-bold">{row.employeeName}</td>
          <td className="px-4 py-3 text-right font-mono">{formatMoney(row.averageMonthlySalary)}<div className="text-[10px] text-[var(--neu-text-secondary)]">{row.salaryMonthsUsed} mois</div></td>
          <td className="px-4 py-3 text-right">{row.baseAccruedDays}</td><td className="px-4 py-3 text-right">{row.seniorityBonusDays}</td>
          <td className="px-4 py-3 text-right font-bold text-amber-400">{row.closingBalanceDays}</td>
          <td className="px-4 py-3"><NeuBadge variant="info">{row.selectedMethod === "TENTH" ? "Règle du dixième" : "Maintien de salaire"}</NeuBadge></td>
          <td className="px-4 py-3">{row.warnings.length > 0 ? <details><summary className="cursor-pointer list-none"><WarningBadge count={row.warnings.length} severity={row.warnings.some((w) => w.severity === "error") ? "error" : row.warnings.some((w) => w.severity === "warning") ? "warning" : "info"} /></summary><div className="mt-2 min-w-72"><ProvisionWarningList warnings={row.warnings} title={`Alertes de ${row.employeeName}`} collapsible={false} /></div></details> : "—"}</td>
          <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-500">{formatMoney(row.provisionAmount)}</td>
        </tr>) : props.rows.map((row) => <tr key={row.userId} className="hover:bg-[var(--neu-surface-light)]">
          <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.employeeId ?? "—"}</td><td className="px-4 py-3 font-bold">{row.name}</td>
          <td className="px-4 py-3 text-right font-mono">{formatMoney(row.grossMonthly)}</td><td className="px-4 py-3 text-right">{row.leaveDaysAccrued}</td>
          <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-500">{formatMoney(row.provisionAmount)}</td>
        </tr>)}
      </tbody>
    </table></NeuCardContent>
  </NeuCard>;
}
