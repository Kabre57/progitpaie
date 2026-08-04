import { Calendar, Calculator, ShieldAlert } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { formatMoney } from "@/lib/utils/format-money";

interface ProvisionSummaryProps {
  totalLeaveProvision: number;
  totalTerminationExposure: number;
  totalExposure: number;
}

const cards = [
  { key: "leave", label: "Provision pour congés payés", Icon: Calendar, color: "text-emerald-500 bg-emerald-500/10" },
  { key: "termination", label: "Indemnités de licenciement", Icon: ShieldAlert, color: "text-indigo-400 bg-indigo-500/10" },
  { key: "total", label: "Engagement social total", Icon: Calculator, color: "text-amber-400 bg-amber-500/10" },
] as const;

export function ProvisionSummary(props: ProvisionSummaryProps) {
  const values = {
    leave: props.totalLeaveProvision,
    termination: props.totalTerminationExposure,
    total: props.totalExposure,
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {cards.map(({ key, label, Icon, color }) => (
        <NeuCard key={key}><NeuCardContent className="flex items-center gap-3 p-4">
          <div className={`rounded-lg p-3 ${color}`}><Icon className="h-6 w-6" aria-hidden="true" /></div>
          <div><div className="text-xs font-semibold uppercase text-[var(--neu-text-secondary)]">{label}</div>
            <div className="text-xl font-extrabold text-[var(--neu-text)]">{formatMoney(values[key])}</div>
          </div>
        </NeuCardContent></NeuCard>
      ))}
    </div>
  );
}
