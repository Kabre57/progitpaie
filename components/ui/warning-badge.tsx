import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { NeuBadge } from "./neu-badge";
import type { ProvisionWarningSeverity } from "@/shared/types/contracts/provision.contract";

interface WarningBadgeProps {
  count: number;
  severity: ProvisionWarningSeverity;
}

const icons = { info: Info, warning: TriangleAlert, error: CircleAlert };

export function WarningBadge({ count, severity }: WarningBadgeProps) {
  const Icon = icons[severity];
  return (
    <NeuBadge variant={severity} aria-label={`${count} alerte${count > 1 ? "s" : ""} de niveau ${severity}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {count}
    </NeuBadge>
  );
}
