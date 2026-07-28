"use client";

import { Landmark, Plus, Save, Trash2 } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface BanksSettingsCardProps {
  banks: string[];
  setBanks: (val: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

export function BanksSettingsCard({
  banks,
  setBanks,
  onSave,
  saving,
}: BanksSettingsCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[var(--neu-accent)]" /> Liste des Banques Partenaires
          </span>
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() => setBanks([...banks, "NOUVELLE BANQUE"])}
          >
            <Plus className="w-4 h-4 mr-1" /> Ajouter une Banque
          </NeuButton>
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {banks.map((bank, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--neu-surface-light)] rounded-lg border border-[var(--neu-border)]">
              <input
                type="text"
                value={bank}
                onChange={(e) => {
                  const updated = [...banks];
                  updated[idx] = e.target.value;
                  setBanks(updated);
                }}
                className="flex-1 px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] text-sm font-semibold border border-[var(--neu-border)]"
              />
              <button
                onClick={() => setBanks(banks.filter((_, i) => i !== idx))}
                className="p-1 text-[var(--neu-danger)] hover:bg-rose-500/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer Liste des Banques
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
