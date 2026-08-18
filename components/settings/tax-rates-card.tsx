"use client";

import { useState, useRef } from "react";
import { Calculator, Save, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

import { PayrollRatesConfig, DEFAULT_PAYROLL_RATES } from "@/lib/rates-config";
import type { PayslipParametricConfig } from "@/lib/payslip-config";

export type TaxRatesData = PayrollRatesConfig;

interface TaxRatesCardProps {
  rates: TaxRatesData;
  setRates: (val: TaxRatesData) => void;
  onSave: () => void;
  parametric: PayslipParametricConfig;
  setParametric: (value: PayslipParametricConfig) => void;
  saving: boolean;
}

/** Labels lisibles pour les champs de taux légaux */
const LEGAL_RATE_LABELS = {
  cnpsEmployeeRetraite: "CNPS Retraite Salarié",
  cnpsEmployerRetraite: "CNPS Retraite Employeur",
  cnpsEmployerAT: "CNPS Accidents du Travail",
  cnpsEmployerPF: "CNPS Prestations Familiales",
  fdfpTA: "FDFP Taxe d'Apprentissage",
  fdfpFPC: "FDFP Formation Continue",
  itsRate: "ITS Impôt sur Salaire",
  cmuBase: "CMU Base Cotisation",
  cmuEmployeeRate: "CMU Part Salarié",
  cmuEmployerRate: "CMU Part Employeur",
} satisfies Partial<Record<keyof PayrollRatesConfig, string>>;

export function TaxRatesCard({
  rates,
  setRates,
  onSave,
  parametric,
  setParametric,
  saving,
}: TaxRatesCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changedRates, setChangedRates] = useState<Array<{
    key: string;
    label: string;
    oldValue: number;
    newValue: number;
  }>>([]);
  const previousRatesRef = useRef<TaxRatesData>({ ...rates });

  const handleResetDefault = () => {
    if (confirm("Voulez-vous vraiment restaurer les taux légaux par défaut (Côte d'Ivoire) ?")) {
      setRates({ ...DEFAULT_PAYROLL_RATES });
    }
  };

  /**
   * Double validation : Détecte les changements de taux légaux et affiche
   * une modale de confirmation si des taux réglementaires ont été modifiés.
   */
  const handleSaveWithValidation = () => {
    const prev = previousRatesRef.current;
    const changes: typeof changedRates = [];

    // Détecter les changements de taux légaux
    for (const key of Object.keys(LEGAL_RATE_LABELS) as Array<keyof typeof LEGAL_RATE_LABELS>) {
      const label = LEGAL_RATE_LABELS[key];
      const oldVal = prev[key];
      const newVal = rates[key];
      if (typeof oldVal === "number" && typeof newVal === "number" && oldVal !== newVal) {
        changes.push({ key, label, oldValue: oldVal, newValue: newVal });
      }
    }

    if (changes.length > 0) {
      // Afficher la modale de confirmation
      setChangedRates(changes);
      setShowConfirmModal(true);
    } else {
      // Pas de changement de taux légal → sauvegarde directe
      onSave();
      previousRatesRef.current = { ...rates };
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    onSave();
    previousRatesRef.current = { ...rates };
  };

  return (
    <>
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[var(--neu-accent)]" /> Configuration Dynamique des Taux & Barèmes de Paie
            </span>
            <NeuButton
              size="sm"
              variant="ghost"
              onClick={handleResetDefault}
              className="text-amber-400 hover:bg-amber-500/10"
              title="Restaurer le barème légal par défaut"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Restaurer par défaut
            </NeuButton>
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-8">
          {/* SECTION 1: CNPS (4 Champs) */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
              1. Cotisations Sociales CNPS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <NeuInput
                label="Retraite Salarié (%)"
                type="number"
                step="0.05"
                value={rates.cnpsEmployeeRetraite ?? 6.3}
                onChange={(e) => setRates({ ...rates, cnpsEmployeeRetraite: Number(e.target.value) })}
              />
              <NeuInput
                label="Retraite Employeur (%)"
                type="number"
                step="0.05"
                value={rates.cnpsEmployerRetraite ?? 7.7}
                onChange={(e) => setRates({ ...rates, cnpsEmployerRetraite: Number(e.target.value) })}
              />
              <NeuInput
                label="Accidents du Travail AT (%)"
                type="number"
                step="0.05"
                value={rates.cnpsEmployerAT ?? 3.0}
                onChange={(e) => setRates({ ...rates, cnpsEmployerAT: Number(e.target.value) })}
              />
              <NeuInput
                label="Prestations Familiales PF (%)"
                type="number"
                step="0.05"
                value={rates.cnpsEmployerPF ?? 5.75}
                onChange={(e) => setRates({ ...rates, cnpsEmployerPF: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* SECTION 2: FDFP (2 Champs) */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
              2. Taxes Formation Professionnelle FDFP
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuInput
                label="Taxe d'Apprentissage TAP (%)"
                type="number"
                step="0.05"
                value={rates.fdfpTA ?? 0.4}
                onChange={(e) => setRates({ ...rates, fdfpTA: Number(e.target.value) })}
              />
              <NeuInput
                label="Taxe Form. Continue TFC (%)"
                type="number"
                step="0.05"
                value={rates.fdfpFPC ?? 0.6}
                onChange={(e) => setRates({ ...rates, fdfpFPC: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* SECTION 3: ITS (1 Champ) */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
              3. Impôt sur Traitements et Salaires ITS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuInput
                label="Taux Impôt sur Salaire ITS Salarié (%)"
                type="number"
                step="0.05"
                value={rates.itsRate ?? 1.2}
                onChange={(e) => setRates({ ...rates, itsRate: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* SECTION ITS PROGRESSIF : paramètre enregistré avec les autres taux */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">Barème ITS progressif</h3>
            <div className="overflow-x-auto rounded-lg border border-[var(--neu-border)]"><table className="min-w-full text-sm"><thead><tr className="bg-[var(--neu-surface-light)] text-left"><th className="p-2">Minimum</th><th className="p-2">Maximum</th><th className="p-2">Taux (%)</th><th className="p-2">Action</th></tr></thead><tbody>{parametric.taxBrackets.map((bracket, index) => <tr key={`its-bracket-${index}`} className="border-t border-[var(--neu-border)]"><td className="p-2"><input type="number" className="w-full rounded border p-2" value={bracket.min} onChange={(event) => setParametric({ ...parametric, taxBrackets: parametric.taxBrackets.map((item, itemIndex) => itemIndex === index ? { ...item, min: Number(event.target.value) } : item) })} /></td><td className="p-2"><input type="number" className="w-full rounded border p-2" value={bracket.max ?? ""} placeholder="Sans plafond" onChange={(event) => setParametric({ ...parametric, taxBrackets: parametric.taxBrackets.map((item, itemIndex) => itemIndex === index ? { ...item, max: event.target.value === "" ? null : Number(event.target.value) } : item) })} /></td><td className="p-2"><input type="number" step="0.01" min="0" max="100" className="w-full rounded border p-2" value={bracket.rate} onChange={(event) => setParametric({ ...parametric, taxBrackets: parametric.taxBrackets.map((item, itemIndex) => itemIndex === index ? { ...item, rate: Number(event.target.value) } : item) })} /></td><td className="p-2"><button type="button" className="text-red-600" onClick={() => setParametric({ ...parametric, taxBrackets: parametric.taxBrackets.filter((_, itemIndex) => itemIndex !== index) })}>Supprimer</button></td></tr>)}</tbody></table></div>
            <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => setParametric({ ...parametric, taxBrackets: [...parametric.taxBrackets, { min: 0, max: null, rate: 0 }] })}>Ajouter une tranche</button>
          </div>

          {/* SECTION 4: CMU (3 Champs + Toggle) */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
              4. Couverture Maladie Universelle CMU
            </h3>
            {/* Toggle CMU */}
            <label className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] cursor-pointer hover:border-[var(--neu-accent)] transition-colors">
              <input
                type="checkbox"
                checked={rates.showCMU !== false}
                onChange={(e) => setRates({ ...rates, showCMU: e.target.checked })}
                className="w-5 h-5 rounded accent-[var(--neu-accent)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--neu-text)]">
                  Afficher la CMU sur le bulletin de paie
                </span>
                <p className="text-xs text-[var(--neu-text-muted)]">
                  Lorsque désactivé, la ligne CMU (37b) sera masquée sur les bulletins PDF et les aperçus A4
                </p>
              </div>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NeuInput
                label="Base Totale Cotisation CMU (FCFA)"
                type="number"
                value={rates.cmuBase ?? 1000}
                onChange={(e) => setRates({ ...rates, cmuBase: Number(e.target.value) })}
                disabled={rates.showCMU === false}
              />
              <NeuInput
                label="Part Salarié CMU (%)"
                type="number"
                step="1"
                value={rates.cmuEmployeeRate ?? 50}
                onChange={(e) => setRates({ ...rates, cmuEmployeeRate: Number(e.target.value) })}
                disabled={rates.showCMU === false}
              />
              <NeuInput
                label="Part Employeur CMU (%)"
                type="number"
                step="1"
                value={rates.cmuEmployerRate ?? 50}
                onChange={(e) => setRates({ ...rates, cmuEmployerRate: Number(e.target.value) })}
                disabled={rates.showCMU === false}
              />
            </div>
          </div>

          {/* SECTION 5: AUTRES PARAMÈTRES (3 Champs) */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
              5. Autres Plafonds & Primes Exonérées
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NeuInput
                label="Plafond Transport Exonéré (FCFA)"
                type="number"
                value={rates.transportExemptAmount ?? 30000}
                onChange={(e) => setRates({ ...rates, transportExemptAmount: Number(e.target.value) })}
              />
              <NeuInput
                label="Taux Ancienneté par Année (%)"
                type="number"
                step="0.1"
                value={rates.seniorityRatePerYear ?? 1.0}
                onChange={(e) => setRates({ ...rates, seniorityRatePerYear: Number(e.target.value) })}
              />
              <NeuInput
                label="Base Horaire Mensuelle (heures)"
                type="number"
                step="0.01"
                value={rates.defaultHourlyBase ?? 173.33}
                onChange={(e) => setRates({ ...rates, defaultHourlyBase: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <NeuButton variant="accent" onClick={handleSaveWithValidation} loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Enregistrer la Configuration des Taux
            </NeuButton>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODALE DE DOUBLE VALIDATION (Taux Légaux Modifiés)   */}
      {/* ══════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--neu-text)]">
                  ⚠️ Modification de Taux Légaux
                </h3>
                <p className="text-sm text-[var(--neu-text-muted)]">
                  Vous modifiez {changedRates.length} taux réglementaire{changedRates.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {changedRates.map((change) => (
                <div
                  key={change.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)]"
                >
                  <span className="text-sm font-medium text-[var(--neu-text)]">
                    {change.label}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-400 line-through">
                      {change.oldValue}
                      {change.key.includes("Base") ? " FCFA" : "%"}
                    </span>
                    <span className="text-[var(--neu-text-muted)]">→</span>
                    <span className="text-green-400 font-bold">
                      {change.newValue}
                      {change.key.includes("Base") ? " FCFA" : "%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-amber-400/80 mb-4 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Cette modification sera journalisée dans l&apos;Audit Log pour traçabilité.
            </p>

            <div className="flex gap-3 justify-end">
              <NeuButton
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Annuler
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={handleConfirmSave}
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Confirmer & Enregistrer
              </NeuButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


