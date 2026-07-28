"use client";

import { Grid, Save } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface SalaryGridCardProps {
  salaryGrid: Array<{ category: string; amount: number }>;
  setSalaryGrid: (val: Array<{ category: string; amount: number }>) => void;
  onSave: () => void;
  saving: boolean;
}

export function SalaryGridCard({
  salaryGrid,
  setSalaryGrid,
  onSave,
  saving,
}: SalaryGridCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-[var(--neu-accent)]" /> Grille des Salaires par Catégorie (Convention Collective)
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-4">
        <p className="text-xs text-[var(--neu-text-secondary)]">
          Fixez le salaire catégoriel minimum de référence pour chaque catégorie professionnelle (1A à 11).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {salaryGrid.map((item, idx) => (
            <div key={item.category} className="p-3 bg-[var(--neu-surface-light)] rounded-lg border border-[var(--neu-border)]">
              <span className="text-xs font-bold text-[var(--neu-accent)] block mb-1">
                Catégorie {item.category}
              </span>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => {
                  const updated = [...salaryGrid];
                  updated[idx].amount = Number(e.target.value);
                  setSalaryGrid(updated);
                }}
                className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-sm font-mono font-bold"
              />
              <span className="text-[10px] text-[var(--neu-text-secondary)] mt-1 block">FCFA / mois</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer Grille des Salaires
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
