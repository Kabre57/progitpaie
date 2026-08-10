"use client";

import { Calendar, Save, ShieldAlert } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { PayrollGenerationRulesDTO } from "@/shared/validation/payroll-settings-v2.schema";

interface PayrollPeriodSettingsCardProps {
  rules: PayrollGenerationRulesDTO;
  setRules: (rules: PayrollGenerationRulesDTO) => void;
  onSave: () => void;
  saving: boolean;
}

export function PayrollPeriodSettingsCard({
  rules,
  setRules,
  onSave,
  saving,
}: PayrollPeriodSettingsCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--neu-accent)]" /> Période & Contrôles de Génération de la Paie
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-6">
        <div className="p-4 bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-xl text-xs text-[var(--neu-text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--neu-accent)] flex items-center gap-1.5 text-sm">
            <ShieldAlert className="w-4 h-4" /> Règles de Clôture & Sécurité Temporelle de Paie
          </p>
          <p>
            Définissez le jour du mois à partir duquel vos administrateurs sont autorisés à déclencher la génération de la paie du mois en cours. Toute tentative avant cette date sera bloquée ou soumise à une dérogation écrite obligatoire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeuInput
            label="Jour de début de génération autorisée (1 à 31 du mois) *"
            type="number"
            min={1}
            max={31}
            value={rules.startDayOfMonth}
            onChange={(e) => setRules({ ...rules, startDayOfMonth: Number(e.target.value) })}
            placeholder="ex: 25"
          />

          <NeuSelect
            label="Autoriser la génération anticipée exceptionnelle ?"
            options={[
              { value: "true", label: "OUI (Avec saisie obligatoire d'une justification par l'Admin)" },
              { value: "false", label: "NON (Blocage strict jusqu'au jour configuré)" },
            ]}
            value={String(rules.allowEarlyGenerationWithReason)}
            onChange={(e) => setRules({ ...rules, allowEarlyGenerationWithReason: e.target.value === "true" })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeuInput
            label="Longueur minimale de la justification de dérogation (caractères)"
            type="number"
            min={5}
            max={100}
            value={rules.minJustificationLength}
            onChange={(e) => setRules({ ...rules, minJustificationLength: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--neu-border)]">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer la Configuration Temporelle
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
