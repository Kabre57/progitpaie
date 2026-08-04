import { CircleAlert } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { ProvisionApiError } from "@/lib/client/payroll/provision-api";

function errorMessage(error: ProvisionApiError): string {
  if (error.code === "UNAUTHORIZED") return "Votre session a expiré. Veuillez vous reconnecter.";
  if (error.code === "FORBIDDEN") return "Vous ne disposez pas des droits nécessaires.";
  if (error.code === "INVALID_RESPONSE") return "Les données reçues ne respectent pas le contrat attendu.";
  if (error.code === "NETWORK_ERROR") return "Le service est momentanément inaccessible.";
  return "Impossible de charger les provisions.";
}

export function ProvisionErrorState({ error, onRetry }: { error: ProvisionApiError; onRetry: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
    <CircleAlert className="mx-auto mb-3 h-8 w-8" aria-hidden="true" />
    <p className="mb-4 font-semibold">{errorMessage(error)}</p>
    <NeuButton variant="danger" onClick={onRetry}>Réessayer</NeuButton>
  </div>;
}
