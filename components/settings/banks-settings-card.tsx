"use client";

import { Landmark, Plus, Save, Trash2 } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

export interface BankItem {
  codeBank: string;
  name: string;
  codeGuichet?: string;
  sigle?: string;
}

interface BanksSettingsCardProps {
  banks: (string | BankItem)[];
  setBanks: (val: (string | BankItem)[]) => void;
  onSave: () => void;
  saving: boolean;
}

export function BanksSettingsCard({
  banks,
  setBanks,
  onSave,
  saving,
}: BanksSettingsCardProps) {
  // Normaliser les données pour garantir la structure BankItem
  const normalizedBanks: BankItem[] = banks.map((b) => {
    if (typeof b === "string") {
      return { codeBank: "CI000", name: b, codeGuichet: "01000", sigle: b };
    }
    return b;
  });

  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[var(--neu-accent)]" /> Liste des Banques Partenaires & Codes (RIB / Virement)
          </span>
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() =>
              setBanks([
                ...banks,
                { codeBank: "CI000", name: "NOUVELLE BANQUE", codeGuichet: "01000", sigle: "NB" },
              ])
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Ajouter une Banque
          </NeuButton>
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-4">
        <p className="text-xs text-[var(--neu-text-secondary)]">
          Définissez les banques agréées avec leurs codes d&apos;établissement (ex: CI008 pour SGCI) et guichets pour les Ordres de Virement et bulletins de paie.
        </p>

        <div className="overflow-x-auto border border-[var(--neu-border)] rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--neu-surface-light)] font-bold text-[var(--neu-text)] uppercase border-b border-[var(--neu-border)]">
              <tr>
                <th className="px-3 py-2.5 w-[100px]">Code Banque</th>
                <th className="px-3 py-2.5">Nom de la Banque</th>
                <th className="px-3 py-2.5 w-[100px]">Code Guichet</th>
                <th className="px-3 py-2.5 w-[90px]">Sigle</th>
                <th className="px-3 py-2.5 text-center w-[60px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {normalizedBanks.map((bank, idx) => (
                <tr key={idx} className="hover:bg-[var(--neu-surface-light)]/50">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={bank.codeBank || ""}
                      onChange={(e) => {
                        const updated = [...normalizedBanks];
                        updated[idx].codeBank = e.target.value;
                        setBanks(updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] font-mono font-bold border border-[var(--neu-border)]"
                      placeholder="CI008"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={bank.name || ""}
                      onChange={(e) => {
                        const updated = [...normalizedBanks];
                        updated[idx].name = e.target.value;
                        setBanks(updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] font-semibold border border-[var(--neu-border)]"
                      placeholder="SOCIETE GENERALE CI"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={bank.codeGuichet || ""}
                      onChange={(e) => {
                        const updated = [...normalizedBanks];
                        updated[idx].codeGuichet = e.target.value;
                        setBanks(updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] font-mono border border-[var(--neu-border)]"
                      placeholder="01001"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={bank.sigle || ""}
                      onChange={(e) => {
                        const updated = [...normalizedBanks];
                        updated[idx].sigle = e.target.value;
                        setBanks(updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] font-bold border border-[var(--neu-border)]"
                      placeholder="SGCI"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setBanks(banks.filter((_, i) => i !== idx))}
                      className="p-1.5 text-[var(--neu-danger)] hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer la Liste des Banques
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
