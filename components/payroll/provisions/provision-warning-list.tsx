"use client";

import { useState } from "react";
import { CircleAlert, Info, TriangleAlert, ChevronDown } from "lucide-react";
import type { ProvisionWarningDTO, ProvisionWarningSeverity } from "@/shared/types/contracts/provision.contract";

interface ProvisionWarningListProps {
  warnings: readonly ProvisionWarningDTO[];
  title?: string;
  collapsible?: boolean;
}

const severityRank: Record<ProvisionWarningSeverity, number> = { error: 0, warning: 1, info: 2 };
const styles = {
  info: { Icon: Info, className: "border-blue-500/30 bg-blue-500/10 text-blue-300", label: "Information" },
  warning: { Icon: TriangleAlert, className: "border-orange-500/30 bg-orange-500/10 text-orange-300", label: "Attention" },
  error: { Icon: CircleAlert, className: "border-red-500/30 bg-red-500/10 text-red-300", label: "Erreur" },
};

interface GroupedWarning extends ProvisionWarningDTO { count: number }

function groupWarnings(warnings: readonly ProvisionWarningDTO[]): GroupedWarning[] {
  const groups = new Map<string, GroupedWarning>();
  for (const warning of warnings) {
    const key = `${warning.severity}:${warning.code}:${warning.message}`;
    const existing = groups.get(key);
    groups.set(key, existing ? { ...existing, count: existing.count + 1 } : { ...warning, count: 1 });
  }
  return [...groups.values()].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function ProvisionWarningList({ warnings, title = "Alertes de calcul", collapsible = true }: ProvisionWarningListProps) {
  const [open, setOpen] = useState(true);
  const grouped = groupWarnings(warnings);
  if (grouped.length === 0) return null;

  return (
    <section aria-label={title} className="space-y-2">
      {collapsible ? (
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 text-sm font-semibold text-[var(--neu-text)]">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          {title} ({warnings.length})
        </button>
      ) : <h3 className="text-sm font-semibold text-[var(--neu-text)]">{title}</h3>}
      {open && (
        <ul className="space-y-2">
          {grouped.map((warning) => {
            const { Icon, className, label } = styles[warning.severity];
            return (
              <li key={`${warning.severity}:${warning.code}:${warning.message}`} className={`flex gap-3 rounded-lg border p-3 text-sm ${className}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div><span className="font-semibold">{label} — </span>{warning.message}{warning.count > 1 ? ` (${warning.count} occurrences)` : ""}</div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
