"use client";

import { Calculator, Save } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

export interface TaxRatesData {
  itsGeneral: number;
  itsAgricole: number;
  itsExpat: number;
  itsFormage: number;
  cnpsEmployeeRetraite: number;
  cnpsEmployerRetraite: number;
  cnpsEmployerAT: number;
  cnpsEmployerAM: number;
  cnpsEmployerPF: number;
  fdfpTA: number;
  fdfpFPC: number;
}

interface TaxRatesCardProps {
  rates: TaxRatesData;
  setRates: (val: TaxRatesData) => void;
  onSave: () => void;
  saving: boolean;
}

export function TaxRatesCard({
  rates,
  setRates,
  onSave,
  saving,
}: TaxRatesCardProps) {
  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[var(--neu-accent)]" /> Taux des Cotisations Fiscales & Sociales (Excel 3-PARAMÈTRES)
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
            1. Impôt sur Salaire (ITS) - Barème Patronal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NeuInput
              label="Général (%)"
              type="number"
              step="0.1"
              value={rates.itsGeneral}
              onChange={(e) => setRates({ ...rates, itsGeneral: Number(e.target.value) })}
            />
            <NeuInput
              label="Agricole (%)"
              type="number"
              step="0.1"
              value={rates.itsAgricole}
              onChange={(e) => setRates({ ...rates, itsAgricole: Number(e.target.value) })}
            />
            <NeuInput
              label="Expatrié (%)"
              type="number"
              step="0.1"
              value={rates.itsExpat}
              onChange={(e) => setRates({ ...rates, itsExpat: Number(e.target.value) })}
            />
            <NeuInput
              label="Fermage (%)"
              type="number"
              step="0.1"
              value={rates.itsFormage}
              onChange={(e) => setRates({ ...rates, itsFormage: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
            2. Cotisations CNPS (Caisse Nationale de Prévoyance Sociale)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NeuInput
              label="Retraite Salarié (%)"
              type="number"
              step="0.1"
              value={rates.cnpsEmployeeRetraite}
              onChange={(e) => setRates({ ...rates, cnpsEmployeeRetraite: Number(e.target.value) })}
            />
            <NeuInput
              label="Retraite Employeur (%)"
              type="number"
              step="0.1"
              value={rates.cnpsEmployerRetraite}
              onChange={(e) => setRates({ ...rates, cnpsEmployerRetraite: Number(e.target.value) })}
            />
            <NeuInput
              label="Accident du Travail (AT) (%)"
              type="number"
              step="0.1"
              value={rates.cnpsEmployerAT}
              onChange={(e) => setRates({ ...rates, cnpsEmployerAT: Number(e.target.value) })}
            />
            <NeuInput
              label="Prestations Familiales (%)"
              type="number"
              step="0.1"
              value={rates.cnpsEmployerPF}
              onChange={(e) => setRates({ ...rates, cnpsEmployerPF: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3 text-[var(--neu-accent)] uppercase tracking-wider">
            3. Taxe FDFP (Formation Professionnelle)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NeuInput
              label="Taxe d'Apprentissage (TA) (%)"
              type="number"
              step="0.1"
              value={rates.fdfpTA}
              onChange={(e) => setRates({ ...rates, fdfpTA: Number(e.target.value) })}
            />
            <NeuInput
              label="Form. Prof. Continue (FPC) (%)"
              type="number"
              step="0.1"
              value={rates.fdfpFPC}
              onChange={(e) => setRates({ ...rates, fdfpFPC: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer Taux Fiscaux & CNPS
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
