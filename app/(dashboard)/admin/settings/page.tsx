"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Building2, Calculator, Grid, Sliders, Landmark, MapPin, Mail, Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2 
} from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuToast } from "@/components/ui/neu-toast";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "company" | "rates" | "salary_grid" | "other" | "banks" | "location"
  >("company");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 1. Identification de l'entreprise
  const [company, setCompany] = useState({
    name: "PROGI  PAIE ",
    sigle: "PROGI  PAIE ",
    activity: "Logiciel de paie",
    legalForm: "SARL",
    address: "01 BP 1115 ABIDJAN 01",
    phone: "0709470671",
    email: "erickourai17@gmail.com",
    commune: "ABIDJAN",
    quartier: "COCODY",
    rue: "",
    lot: "",
    taxCenter: "Abidjan 3",
    taxNumber: "1234567 A",
    rccm: "CI-ABJ-2000-A-451",
    cnpsNumber: "123456",
    establishmentCode: "",
    activityCode: "",
    bankName: "SOCIETE GENERALE CI",
    bankAgency: "",
    bankAccount: "",
    accountManagerCivility: "M.",
    accountManagerName: "",
  });

  // 2. Taux des cotisations
  const [rates, setRates] = useState({
    itsGeneral: 1.2,
    itsAgricole: 2.0,
    itsExpat: 10.4,
    itsFormage: 35.0,
    cnpsEmployeeRetraite: 6.3,
    cnpsEmployerRetraite: 7.7,
    cnpsEmployerAT: 3.0,
    cnpsEmployerAM: 0.75,
    cnpsEmployerPF: 5.0,
    fdfpTA: 0.4,
    fdfpFPC: 0.6,
  });

  // 3. Grille des salaires
  const [salaryGrid, setSalaryGrid] = useState([
    { category: "11", amount: 208034 },
    { category: "10C", amount: 187229 },
    { category: "10B", amount: 168426 },
    { category: "10A", amount: 151593 },
    { category: "9B", amount: 141550 },
    { category: "9A", amount: 135820 },
    { category: "8C", amount: 124284 },
    { category: "8B", amount: 124284 },
    { category: "8A", amount: 122470 },
    { category: "7B", amount: 122470 },
    { category: "7A", amount: 116418 },
    { category: "6", amount: 116132 },
    { category: "5", amount: 101347 },
    { category: "4", amount: 89681 },
    { category: "3", amount: 82959 },
    { category: "2", amount: 80518 },
    { category: "1B", amount: 75000 },
    { category: "1A", amount: 75000 },
  ]);

  // 4. Autres paramètres
  const [otherParams, setOtherParams] = useState({
    transportExemptAmount: 30000,
    seniorityBonusActive: true,
    roundNetSalary: "5", // 0, 5, 10, 100
    leaveDaysPerMonth: 2.7,
    signatoryName: "M. KOUASSI",
    signatoryRole: "Directeur Général",
  });

  // 5. Liste des banques
  const [banks, setBanks] = useState([
    "SOCIETE GENERALE CI",
    "BICICI",
    "NSIA BANQUE",
    "SIB",
    "BACI",
    "ECOBANK",
    "BDA",
    "UBA",
    "BNI",
    "DIAMOND BANK",
    "CNCE",
    "AFRILAND FIRST BANK",
  ]);

  // 6. Géolocalisation
  const [location, setLocation] = useState({
    officeLat: 5.3484,
    officeLng: -4.0305,
    radiusMeters: 150,
    strictGeofence: false,
  });

  // Fetch settings on load
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      try {
        const [resCompany, resRates, resGrid, resOther, resBanks, resLoc] = await Promise.all([
          fetch("/api/settings/company_info").then((r) => r.json()),
          fetch("/api/settings/tax_rates").then((r) => r.json()),
          fetch("/api/settings/salary_grid").then((r) => r.json()),
          fetch("/api/settings/other_params").then((r) => r.json()),
          fetch("/api/settings/bank_list").then((r) => r.json()),
          fetch("/api/settings/location").then((r) => r.json()),
        ]);

        if (resCompany.success && resCompany.data) setCompany(resCompany.data);
        if (resRates.success && resRates.data) setRates(resRates.data);
        if (resGrid.success && resGrid.data) setSalaryGrid(resGrid.data);
        if (resOther.success && resOther.data) setOtherParams(resOther.data);
        if (resBanks.success && resBanks.data) setBanks(resBanks.data);
        if (resLoc.success && resLoc.data) setLocation(resLoc.data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, []);

  const saveSettingsKey = async (key: string, dataPayload: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataPayload),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: "Paramètres enregistrés avec succès !", type: "success" });
      } else {
        setToast({ message: json.error || "Erreur d'enregistrement", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur serveur lors de l'enregistrement", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <NeuToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--neu-accent)]" />
          Paramètres du Système RH & Paie
        </h1>
        <p className="text-[var(--neu-text-secondary)] text-sm">
          Configuration complète de l'entreprise, des barèmes fiscaux, de la grille des salaires et des règles de paie.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--neu-border)] pb-3">
        <NeuButton
          variant={activeTab === "company" ? "accent" : "ghost"}
          onClick={() => setActiveTab("company")}
          size="sm"
        >
          <Building2 className="w-4 h-4 mr-1.5" /> Entreprise
        </NeuButton>
        <NeuButton
          variant={activeTab === "rates" ? "accent" : "ghost"}
          onClick={() => setActiveTab("rates")}
          size="sm"
        >
          <Calculator className="w-4 h-4 mr-1.5" /> Cotisations Fiscales & Sociales
        </NeuButton>
        <NeuButton
          variant={activeTab === "salary_grid" ? "accent" : "ghost"}
          onClick={() => setActiveTab("salary_grid")}
          size="sm"
        >
          <Grid className="w-4 h-4 mr-1.5" /> Grille des Salaires
        </NeuButton>
        <NeuButton
          variant={activeTab === "other" ? "accent" : "ghost"}
          onClick={() => setActiveTab("other")}
          size="sm"
        >
          <Sliders className="w-4 h-4 mr-1.5" /> Autres Paramètres
        </NeuButton>
        <NeuButton
          variant={activeTab === "banks" ? "accent" : "ghost"}
          onClick={() => setActiveTab("banks")}
          size="sm"
        >
          <Landmark className="w-4 h-4 mr-1.5" /> Banques
        </NeuButton>
        <NeuButton
          variant={activeTab === "location" ? "accent" : "ghost"}
          onClick={() => setActiveTab("location")}
          size="sm"
        >
          <MapPin className="w-4 h-4 mr-1.5" /> Géolocalisation
        </NeuButton>
      </div>

      {/* Tab 1: Entreprise */}
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
              Fixez le salaire catégoriel minimum de référence pour chaque catégorie professionnelle de la convention collective.
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
              <Sliders className="w-5 h-5 text-[var(--neu-accent)]" /> Autres Paramètres de Paie & Congés
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <NeuInput
                  label="Montant exonéré de la prime de transport (FCFA)"
                  type="number"
                  value={otherParams.transportExemptAmount}
                  onChange={(e) => setOtherParams({ ...otherParams, transportExemptAmount: Number(e.target.value) })}
                />
                <p className="text-xs text-[var(--neu-text-secondary)] mt-1">
                  En Côte d'Ivoire, l'indemnité de transport est exonérée d'impôt et de CNPS à hauteur de 30 000 FCFA.
                </p>
              </div>

              <div>
                <NeuSelect
                  label="Calcul d'Arrondi du Net à Payer"
                  options={[
                    { value: "0", label: "Sans arrondi (Francs exacts)" },
                    { value: "5", label: "Arrondi aux 5 FCFA supérieurs" },
                    { value: "10", label: "Arrondi aux 10 FCFA supérieurs" },
                    { value: "100", label: "Arrondi aux 100 FCFA supérieurs" },
                  ]}
                  value={otherParams.roundNetSalary}
                  onChange={(e) => setOtherParams({ ...otherParams, roundNetSalary: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <NeuInput
                  label="Jours de Congé Payé par Mois"
                  type="number"
                  step="0.1"
                  value={otherParams.leaveDaysPerMonth}
                  onChange={(e) => setOtherParams({ ...otherParams, leaveDaysPerMonth: Number(e.target.value) })}
                />
                <p className="text-xs text-[var(--neu-text-secondary)] mt-1">
                  Ex: 2.2 jours/mois (26,4j/an) ou 2.5 jours/mois (30j/an) ou 2.7 jours/mois.
                </p>
              </div>
              <NeuInput
                label="Nom du Signataire par Défaut"
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
                <Save className="w-4 h-4 mr-2" /> Enregistrer Paramètres de Paie
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
