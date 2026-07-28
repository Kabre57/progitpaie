"use client";

import { Plus, Save, Sliders, Trash2 } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";

export interface CustomPrimeItem {
  name: string;
  fiscalNature: string;
  socialNature: string;
}

export interface OtherParamsData {
  transportExemptAmount: number;
  seniorityBonusActive: boolean;
  roundNetSalary: string;
  leaveDaysPerMonth: number;
  signatoryName: string;
  signatoryRole: string;
  primes: CustomPrimeItem[];
  deductions: string[];
}

interface OtherParamsCardProps {
  otherParams: OtherParamsData;
  setOtherParams: (val: OtherParamsData) => void;
  onSave: () => void;
  saving: boolean;
}

export function OtherParamsCard({
  otherParams,
  setOtherParams,
  onSave,
  saving,
}: OtherParamsCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[var(--neu-accent)]" /> Autres Paramètres, Primes & Retenues (Excel LOGIPAIE)
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-8">
        {/* Table des Primes & Indemnités Éditables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase tracking-wider">
              AUTRES PARAMÈTRES : INDEMNITÉS ET PRIMES ÉDITABLES
            </h3>
            <NeuButton
              size="sm"
              variant="ghost"
              onClick={() =>
                setOtherParams({
                  ...otherParams,
                  primes: [
                    ...(otherParams.primes || []),
                    { name: "Nouvelle Prime", fiscalNature: "imposable", socialNature: "taxable" },
                  ],
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter une Prime / Indemnité
            </NeuButton>
          </div>

          <div className="overflow-x-auto border border-[var(--neu-border)] rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--neu-surface-light)] font-bold text-[var(--neu-text)] uppercase border-b border-[var(--neu-border)]">
                <tr>
                  <th className="px-4 py-3">Indemnités et Primes</th>
                  <th className="px-4 py-3 text-red-500">Nature Fiscale (DGI)</th>
                  <th className="px-4 py-3 text-red-500">Nature Sociale (CNPS)</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {(otherParams.primes || []).map((prime, idx) => (
                  <tr key={idx} className="hover:bg-[var(--neu-surface-light)]/50">
                    <td className="px-4 py-2 font-bold text-[var(--neu-text)]">
                      <input
                        type="text"
                        value={prime.name}
                        onChange={(e) => {
                          const updated = [...(otherParams.primes || [])];
                          updated[idx].name = e.target.value;
                          setOtherParams({ ...otherParams, primes: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] border border-[var(--neu-border)] font-semibold"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={prime.fiscalNature}
                        onChange={(e) => {
                          const updated = [...(otherParams.primes || [])];
                          updated[idx].fiscalNature = e.target.value;
                          setOtherParams({ ...otherParams, primes: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] border border-[var(--neu-border)]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={prime.socialNature}
                        onChange={(e) => {
                          const updated = [...(otherParams.primes || [])];
                          updated[idx].socialNature = e.target.value;
                          setOtherParams({ ...otherParams, primes: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-[var(--neu-surface)] border border-[var(--neu-border)]"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          const updated = (otherParams.primes || []).filter((_, i) => i !== idx);
                          setOtherParams({ ...otherParams, primes: updated });
                        }}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table des Autres Retenues Éditables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase tracking-wider">
              AUTRES RETENUES PERSONNALISÉES SUR BULLETIN
            </h3>
            <NeuButton
              size="sm"
              variant="ghost"
              onClick={() =>
                setOtherParams({
                  ...otherParams,
                  deductions: [...(otherParams.deductions || []), "Nouvelle Retenue"],
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter une Retenue
            </NeuButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(otherParams.deductions || []).map((ded, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--neu-surface-light)] rounded-lg border border-[var(--neu-border)]">
                <input
                  type="text"
                  value={ded}
                  onChange={(e) => {
                    const updated = [...(otherParams.deductions || [])];
                    updated[idx] = e.target.value;
                    setOtherParams({ ...otherParams, deductions: updated });
                  }}
                  className="flex-1 px-2 py-1 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] text-xs font-semibold border border-[var(--neu-border)]"
                />
                <button
                  onClick={() => {
                    const updated = (otherParams.deductions || []).filter((_, i) => i !== idx);
                    setOtherParams({ ...otherParams, deductions: updated });
                  }}
                  className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Options de Calcul & Signataires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--neu-border)]">
          <div>
            <NeuInput
              label="Montant exonéré de la prime de transport (FCFA)"
              type="number"
              value={otherParams.transportExemptAmount}
              onChange={(e) => setOtherParams({ ...otherParams, transportExemptAmount: Number(e.target.value) })}
            />
          </div>

          <div>
            <NeuSelect
              label="Prime d'Ancienneté"
              options={[
                { value: "true", label: "ACTIVÉE (Calcul automatique 2% après 2 ans)" },
                { value: "false", label: "DÉSACTIVÉE" },
              ]}
              value={String(otherParams.seniorityBonusActive)}
              onChange={(e) => setOtherParams({ ...otherParams, seniorityBonusActive: e.target.value === "true" })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <NeuInput
              label="Nombre de jours de congés / mois"
              type="number"
              step="0.01"
              value={otherParams.leaveDaysPerMonth}
              onChange={(e) => setOtherParams({ ...otherParams, leaveDaysPerMonth: Number(e.target.value) })}
            />
          </div>
          <NeuInput
            label="Nom du Signataire des Bulletins"
            value={otherParams.signatoryName}
            onChange={(e) => setOtherParams({ ...otherParams, signatoryName: e.target.value })}
          />
          <NeuInput
            label="Qualité / Fonction du Signataire"
            value={otherParams.signatoryRole}
            onChange={(e) => setOtherParams({ ...otherParams, signatoryRole: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer Tous les Paramètres de Paie
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
