"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Calculator, Grid, Sliders, Landmark, MapPin, Save, Plus, Trash2 
} from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuToast } from "@/components/ui/neu-toast";
import { Spinner } from "@/components/ui/spinner";

interface CustomPrimeItem {
  name: string;
  fiscalNature: string;
  socialNature: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "company" | "rates" | "salary_grid" | "other" | "banks" | "location"
  >("company");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 1. Identification de l'entreprise (0 valeur en dur)
  const [company, setCompany] = useState({
    name: "",
    sigle: "",
    activity: "",
    legalForm: "SARL",
    address: "",
    phone: "",
    email: "",
    commune: "",
    quartier: "",
    rue: "",
    lot: "",
    taxCenter: "",
    taxNumber: "",
    rccm: "",
    cnpsNumber: "",
    establishmentCode: "",
    activityCode: "",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
    accountManagerCivility: "",
    accountManagerName: "",
  });

  // 2. Taux des cotisations (0 valeur en dur)
  const [rates, setRates] = useState({
    itsGeneral: 0,
    itsAgricole: 0,
    itsExpat: 0,
    itsFormage: 0,
    cnpsEmployeeRetraite: 0,
    cnpsEmployerRetraite: 0,
    cnpsEmployerAT: 0,
    cnpsEmployerAM: 0,
    cnpsEmployerPF: 0,
    fdfpTA: 0,
    fdfpFPC: 0,
  });

  // 3. Grille des salaires (0 valeur en dur)
  const [salaryGrid, setSalaryGrid] = useState<Array<{ category: string; amount: number }>>([]);

  // 4. Autres paramètres (0 valeur en dur)
  const [otherParams, setOtherParams] = useState<{
    transportExemptAmount: number;
    seniorityBonusActive: boolean;
    roundNetSalary: string;
    leaveDaysPerMonth: number;
    signatoryName: string;
    signatoryRole: string;
    primes: CustomPrimeItem[];
    deductions: string[];
  }>({
    transportExemptAmount: 0,
    seniorityBonusActive: false,
    roundNetSalary: "0",
    leaveDaysPerMonth: 0,
    signatoryName: "",
    signatoryRole: "",
    primes: [],
    deductions: []
  });

  // 5. Liste des banques (0 valeur en dur)
  const [banks, setBanks] = useState<string[]>([]);

  // 6. Géolocalisation (0 valeur en dur)
  const [location, setLocation] = useState({
    officeLat: 0,
    officeLng: 0,
    radiusMeters: 0,
    strictGeofence: false,
  });

  // Chargement 100% Dynamique depuis l'API et la Base de Données PostgreSQL
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.company_info) setCompany(json.data.company_info);
          else if (json.data.company) setCompany(json.data.company);

          if (json.data.tax_rates) setRates(json.data.tax_rates);
          if (json.data.salary_grid) setSalaryGrid(json.data.salary_grid);
          if (json.data.other_params) setOtherParams((prev) => ({ ...prev, ...json.data.other_params }));
          if (json.data.bank_list) setBanks(json.data.bank_list);
          if (json.data.location) setLocation(json.data.location);
        }
      } catch (err) {
        console.error("Échec du chargement des paramètres depuis la base de données:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, []);

  const saveSettingsKey = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: "Paramètres enregistrés en base de données avec succès !", type: "success" });
      } else {
        setToast({ message: json.error || "Erreur de sauvegarde", type: "error" });
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setToast({ message: "Erreur réseau lors de la sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <NeuToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Sliders className="text-[var(--neu-accent)]" /> Paramètres du Système RH & Paie
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Chargement et synchronisation 100% dynamique depuis la base de données PostgreSQL.
          </p>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--neu-border)] pb-2">
        <button
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "company"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Building2 className="w-4 h-4" /> Entreprise
        </button>

        <button
          onClick={() => setActiveTab("rates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "rates"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Calculator className="w-4 h-4" /> Cotisations Fiscales & Sociales
        </button>

        <button
          onClick={() => setActiveTab("salary_grid")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "salary_grid"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Grid className="w-4 h-4" /> Grille des Salaires
        </button>

        <button
          onClick={() => setActiveTab("other")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "other"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Sliders className="w-4 h-4" /> Autres Paramètres & Retenues
        </button>

        <button
          onClick={() => setActiveTab("banks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "banks"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Landmark className="w-4 h-4" /> Banques
        </button>

        <button
          onClick={() => setActiveTab("location")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "location"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <MapPin className="w-4 h-4" /> Géolocalisation
        </button>
      </div>

      {/* Tab 1: Identification Entreprise */}
      {activeTab === "company" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--neu-accent)]" /> Identification de l'Entreprise
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NeuInput
                label="Dénomination"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                label="Téléphone"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
              <NeuInput
                label="E-mail"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NeuInput
                label="Commune"
                value={company.commune}
                onChange={(e) => setCompany({ ...company, commune: e.target.value })}
              />
              <NeuInput
                label="Quartier"
                value={company.quartier}
                onChange={(e) => setCompany({ ...company, quartier: e.target.value })}
              />
              <NeuInput
                label="Adresse / BP"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <NeuInput
                label="Centre des Impôts"
                value={company.taxCenter}
                onChange={(e) => setCompany({ ...company, taxCenter: e.target.value })}
              />
              <NeuInput
                label="N° Compte Contribuable (CC)"
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
            </div>

            <div className="flex justify-end pt-4">
              <NeuButton variant="accent" onClick={() => saveSettingsKey("company_info", company)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Fiche Entreprise
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Tab 2: Cotisations */}
      {activeTab === "rates" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[var(--neu-accent)]" /> Taux des Cotisations Fiscales & Sociales
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
                  label="Formage (%)"
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
              <NeuButton variant="accent" onClick={() => saveSettingsKey("tax_rates", rates)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Taux Fiscaux & CNPS
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Tab 3: Grille des Salaires */}
      {activeTab === "salary_grid" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[var(--neu-accent)]" /> Grille des Salaires par Catégorie
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="space-y-4">
            <p className="text-xs text-[var(--neu-text-secondary)]">
              Fixez le salaire catégoriel minimum de référence pour chaque catégorie professionnelle.
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
              <NeuButton variant="accent" onClick={() => saveSettingsKey("salary_grid", salaryGrid)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Grille des Salaires
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Tab 4: Autres Paramètres */}
      {activeTab === "other" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[var(--neu-accent)]" /> Autres Paramètres, Primes & Retenues
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
              <NeuButton variant="accent" onClick={() => saveSettingsKey("other_params", otherParams)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Tous les Paramètres de Paie
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Tab 5: Banques */}
      {activeTab === "banks" && (
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
              <NeuButton variant="accent" onClick={() => saveSettingsKey("bank_list", banks)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Liste des Banques
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Tab 6: Géolocalisation */}
      {activeTab === "location" && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--neu-accent)]" /> Configuration de Géolocalisation & Geofence
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NeuInput
                label="Latitude Bureau"
                type="number"
                step="0.0001"
                value={location.officeLat}
                onChange={(e) => setLocation({ ...location, officeLat: Number(e.target.value) })}
              />
              <NeuInput
                label="Longitude Bureau"
                type="number"
                step="0.0001"
                value={location.officeLng}
                onChange={(e) => setLocation({ ...location, officeLng: Number(e.target.value) })}
              />
              <NeuInput
                label="Rayon Autorisé (mètres)"
                type="number"
                value={location.radiusMeters}
                onChange={(e) => setLocation({ ...location, radiusMeters: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <NeuButton variant="accent" onClick={() => saveSettingsKey("location", location)} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer Géolocalisation
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}
    </div>
  );
}
