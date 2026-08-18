"use client";

import { Building2, Calendar, Landmark, Save } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import type { PayslipParametricConfig } from "@/lib/payslip-config";

export interface CompanySettingsData {
  periodMonth: string;
  periodYear: number;
  payDate: string;
  name: string;
  sigle: string;
  activity: string;
  legalForm: string;
  address: string;
  phone: string;
  email: string;
  commune: string;
  quartier: string;
  rue: string;
  lot: string;
  taxCenter: string;
  taxNumber: string;
  rccm: string;
  cnpsNumber: string;
  establishmentCode: string;
  activityCode: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  accountManagerCivility: string;
  accountManagerName: string;
}

interface CompanySettingsCardProps {
  company: CompanySettingsData;
  setCompany: (val: CompanySettingsData) => void;
  onSave: () => void;
  parametric: PayslipParametricConfig;
  setParametric: (value: PayslipParametricConfig) => void;
  saving: boolean;
}

export function CompanySettingsCard({
  company,
  setCompany,
  onSave,
  parametric,
  setParametric,
  saving,
}: CompanySettingsCardProps) {
  return (
    <div className="space-y-6">
      {/* Card 1: Période & Date de Paie (L4-L8 Excel) */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--neu-accent)]" /> Période & Date de Paie  
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NeuSelect
              label="Période (Mois)"
              options={[
                { value: "JANVIER", label: "JANVIER" },
                { value: "FEVRIER", label: "FÉVRIER" },
                { value: "MARS", label: "MARS" },
                { value: "AVRIL", label: "AVRIL" },
                { value: "MAI", label: "MAI" },
                { value: "JUIN", label: "JUIN" },
                { value: "JUILLET", label: "JUILLET" },
                { value: "AOUT", label: "AOÛT" },
                { value: "SEPTEMBRE", label: "SEPTEMBRE" },
                { value: "OCTOBRE", label: "OCTOBRE" },
                { value: "NOVEMBRE", label: "NOVEMBRE" },
                { value: "DECEMBRE", label: "DÉCEMBRE" },
              ]}
              value={company.periodMonth || "JANVIER"}
              onChange={(e) => setCompany({ ...company, periodMonth: e.target.value })}
            />

            <NeuInput
              label="Période (Année)"
              type="number"
              value={company.periodYear || 2026}
              onChange={(e) => setCompany({ ...company, periodYear: Number(e.target.value) })}
            />

            <NeuInput
              label="Date de Paie"
              value={company.payDate || "31/01/2026"}
              onChange={(e) => setCompany({ ...company, payDate: e.target.value })}
            />
          </div>
        </NeuCardContent>
      </NeuCard>

      <NeuCard>
        <NeuCardHeader><NeuCardTitle>Devise et format des montants</NeuCardTitle></NeuCardHeader>
        <NeuCardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <NeuInput label="Code devise" value={parametric.currency.code} onChange={(e) => setParametric({ ...parametric, currency: { ...parametric.currency, code: e.target.value.toUpperCase() } })} />
          <NeuInput label="Symbole devise" value={parametric.currency.symbol} onChange={(e) => setParametric({ ...parametric, currency: { ...parametric.currency, symbol: e.target.value } })} />
          <NeuInput label="Locale d’affichage" value={parametric.currency.locale} onChange={(e) => setParametric({ ...parametric, currency: { ...parametric.currency, locale: e.target.value } })} />
          <NeuInput label="Nombre de décimales" type="number" min="0" max="4" value={parametric.currency.decimals} onChange={(e) => setParametric({ ...parametric, currency: { ...parametric.currency, decimals: Number(e.target.value) } })} />
        </div></NeuCardContent>
      </NeuCard>

      {/* Card 2: Identification de l'Entreprise (L10-L23 Excel) */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--neu-accent)]" /> Identification de l'Entreprise
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NeuInput
              label="Dénomination"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
            <NeuSelect
              label="Forme Juridique"
              options={[
                { value: "SARL", label: "SARL" },
                { value: "SA", label: "SA" },
                { value: "SAS", label: "SAS" },
                { value: "SUARL", label: "SUARL" },
                { value: "EI", label: "Entreprise Individuelle" },
              ]}
              value={company.legalForm}
              onChange={(e) => setCompany({ ...company, legalForm: e.target.value })}
            />
            <NeuInput
              label="Sigle"
              value={company.sigle}
              onChange={(e) => setCompany({ ...company, sigle: e.target.value })}
            />
            <NeuInput
              label="Activité"
              value={company.activity}
              onChange={(e) => setCompany({ ...company, activity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NeuInput
              label="Adresse / BP"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
            />
            <NeuInput
              label="Téléphone"
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
            />
            <NeuInput
              label="E-mail"
              value={company.email}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
            />
            <NeuInput
              label="Commune"
              value={company.commune}
              onChange={(e) => setCompany({ ...company, commune: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NeuInput
              label="Quartier"
              value={company.quartier}
              onChange={(e) => setCompany({ ...company, quartier: e.target.value })}
            />
            <NeuInput
              label="Rue"
              value={company.rue}
              onChange={(e) => setCompany({ ...company, rue: e.target.value })}
            />
            <NeuInput
              label="Lot"
              value={company.lot}
              onChange={(e) => setCompany({ ...company, lot: e.target.value })}
            />
            <NeuInput
              label="Centre des Impôts"
              value={company.taxCenter}
              onChange={(e) => setCompany({ ...company, taxCenter: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <NeuInput
              label="N° Compte Contribuable (C.C.)"
              value={company.taxNumber}
              onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
            />
            <NeuInput
              label="N° RCCM"
              value={company.rccm}
              onChange={(e) => setCompany({ ...company, rccm: e.target.value })}
            />
            <NeuInput
              label="N° Affiliation CNPS"
              value={company.cnpsNumber}
              onChange={(e) => setCompany({ ...company, cnpsNumber: e.target.value })}
            />
            <NeuInput
              label="Code Établissement"
              value={company.establishmentCode}
              onChange={(e) => setCompany({ ...company, establishmentCode: e.target.value })}
            />
            <NeuInput
              label="Code Activité"
              value={company.activityCode}
              onChange={(e) => setCompany({ ...company, activityCode: e.target.value })}
            />
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Card 3: Banque & Chargé de Compte (L24-L27 Excel) */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[var(--neu-accent)]" /> Banque Domiciliation & Chargé de Compte Entreprise
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NeuInput
              label="Banque"
              value={company.bankName}
              onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
            />
            <NeuInput
              label="Agence"
              value={company.bankAgency}
              onChange={(e) => setCompany({ ...company, bankAgency: e.target.value })}
            />
            <NeuInput
              label="Compte N° / RIB"
              value={company.bankAccount}
              onChange={(e) => setCompany({ ...company, bankAccount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NeuSelect
              label="Civilité Chargé de Compte"
              options={[
                { value: "M.", label: "M." },
                { value: "Mme", label: "Mme" },
                { value: "Mlle", label: "Mlle" },
              ]}
              value={company.accountManagerCivility || "M."}
              onChange={(e) => setCompany({ ...company, accountManagerCivility: e.target.value })}
            />
            <div className="md:col-span-2">
              <NeuInput
                label="Nom et Prénoms du Chargé de Compte Banque"
                value={company.accountManagerName}
                onChange={(e) => setCompany({ ...company, accountManagerName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <NeuButton variant="accent" onClick={onSave} loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Enregistrer Fiche Entreprise & Période
            </NeuButton>
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
