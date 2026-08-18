"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Calculator, Grid, Sliders, Landmark, MapPin, FileText, Calendar 
} from "lucide-react";
import { NeuToast } from "@/components/ui/neu-toast";
import { Spinner } from "@/components/ui/spinner";
import { CompanySettingsCard, CompanySettingsData } from "@/components/settings/company-settings-card";
import { TaxRatesCard, TaxRatesData } from "@/components/settings/tax-rates-card";
import { SalaryGridCard } from "@/components/settings/salary-grid-card";
import { OtherParamsCard, OtherParamsData } from "@/components/settings/other-params-card";
import { BanksSettingsCard, BankItem } from "@/components/settings/banks-settings-card";
import { LocationSettingsCard, LocationData } from "@/components/settings/location-settings-card";
import GeolocationConfig from "@/components/settings/geolocation-config";
import { PayslipCustomizerCard } from "@/components/settings/payslip-customizer-card";
import { PayslipParametricCard } from "@/components/settings/payslip-parametric-card";
import { DEFAULT_PAYROLL_RATES } from "@/lib/rates-config";
import {
  PayslipAppearanceConfig,
  PayslipLegalConfig,
  DEFAULT_PAYSLIP_APPEARANCE,
  DEFAULT_PAYSLIP_LEGAL,
  DEFAULT_PAYSLIP_PARAMETRIC,
  PayslipParametricConfig,
} from "@/lib/payslip-config";

import { PayrollPeriodSettingsCard } from "@/components/settings/payroll-period-settings-card";
import { PayrollGenerationRulesDTO } from "@/shared/validation/payroll-settings-v2.schema";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "company" | "rates" | "salary_grid" | "other" | "banks" | "location" | "payslip" | "payroll_period"
  >("company");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const now = new Date();
  const monthsFr = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
  const currentMonthFr = monthsFr[now.getMonth()];
  const currentYearNum = now.getFullYear();
  const lastDayOfMonthNum = new Date(currentYearNum, now.getMonth() + 1, 0);
  const currentPayDateStr = `${String(lastDayOfMonthNum.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${currentYearNum}`;

  // States 100% dynamiques alimentés par PostgreSQL via l'API /api/settings
  const [company, setCompany] = useState<CompanySettingsData>({
    periodMonth: currentMonthFr,
    periodYear: currentYearNum,
    payDate: currentPayDateStr,
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
    accountManagerCivility: "M.",
    accountManagerName: "",
  });

  const [rates, setRates] = useState<TaxRatesData>(DEFAULT_PAYROLL_RATES);

  const DEFAULT_SALARY_GRID = [
    { category: "1A", amount: 75000 },
    { category: "1B", amount: 82000 },
    { category: "2", amount: 90000 },
    { category: "3", amount: 105000 },
    { category: "4", amount: 125000 },
    { category: "5", amount: 150000 },
    { category: "6", amount: 180000 },
    { category: "7", amount: 220000 },
    { category: "8", amount: 280000 },
    { category: "9", amount: 350000 },
    { category: "10", amount: 450000 },
    { category: "Cadre Supérieur", amount: 600000 },
  ];

  const [salaryGrid, setSalaryGrid] = useState<Array<{ category: string; amount: number }>>(DEFAULT_SALARY_GRID);

  const DEFAULT_BANKS: BankItem[] = [
    { codeBank: "CI008", name: "SOCIETE GENERALE COTE D'IVOIRE", codeGuichet: "01001", sigle: "SGCI" },
    { codeBank: "CI034", name: "ECOBANK COTE D'IVOIRE", codeGuichet: "01005", sigle: "ECOBANK" },
    { codeBank: "CI059", name: "BANQUE ATLANTIQUE CI", codeGuichet: "01010", sigle: "BACI" },
    { codeBank: "CI012", name: "BICI COTE D'IVOIRE", codeGuichet: "01002", sigle: "BICICI" },
    { codeBank: "CI092", name: "NSIA BANQUE CI", codeGuichet: "01015", sigle: "NSIA" },
    { codeBank: "CI154", name: "CORIS BANK INTERNATIONAL CI", codeGuichet: "01020", sigle: "CORIS" },
    { codeBank: "CI042", name: "SIB (SOCIETE IVOIRIENNE DE BANQUE)", codeGuichet: "01008", sigle: "SIB" },
  ];

  const DEFAULT_OTHER_PARAMS: OtherParamsData = {
    transportExemptAmount: 30000,
    seniorityBonusActive: true,
    roundNetSalary: "5",
    leaveDaysPerMonth: 2.75,
    signatoryName: "",
    signatoryRole: "Directeur Général",
    primes: [
      { name: "Prime de Transport", fiscalNature: "Exonéré jusqu'à 30 000 FCFA (Surplus Imposable)", socialNature: "Exonéré jusqu'à 30 000 FCFA" },
      { name: "Indemnité de Repas / Panier", fiscalNature: "Exonéré jusqu'à 30 000 FCFA (Surplus Imposable)", socialNature: "Exonéré jusqu'à 30 000 FCFA" },
      { name: "Indemnité de Salissure / Outillage", fiscalNature: "Exonéré jusqu'à 25 000 FCFA (Surplus Imposable)", socialNature: "Exonéré jusqu'à 25 000 FCFA" },
      { name: "Gratification Fin d'Année", fiscalNature: "Imposable 100% (ITS / IGR)", socialNature: "Taxable 100% (CNPS)" },
      { name: "Prime de Rendement", fiscalNature: "Imposable 100%", socialNature: "Taxable 100%" },
    ],
    deductions: ["Acompte sur Salaire", "Saisie-Arrêt sur Salaire", "Assurance Maladie Complémentaire", "Cotisation Syndicale"],
  };

  const [otherParams, setOtherParams] = useState<OtherParamsData>(DEFAULT_OTHER_PARAMS);
  const [banks, setBanks] = useState<(string | BankItem)[]>(DEFAULT_BANKS);

  const [location, setLocation] = useState<LocationData>({
    officeLat: 5.3484,
    officeLng: -4.0305,
    radiusMeters: 150,
    strictGeofence: false,
  });

  // État pour la configuration du bulletin de paie (7ème onglet)
  const [payslipAppearance, setPayslipAppearance] = useState<PayslipAppearanceConfig>(DEFAULT_PAYSLIP_APPEARANCE);
  const [payslipLegal, setPayslipLegal] = useState<PayslipLegalConfig>(DEFAULT_PAYSLIP_LEGAL);
  const [payslipParametric, setPayslipParametric] = useState<PayslipParametricConfig>(DEFAULT_PAYSLIP_PARAMETRIC);

  const [payrollRules, setPayrollRules] = useState<PayrollGenerationRulesDTO>({
    startDayOfMonth: 25,
    allowEarlyGenerationWithReason: true,
    minJustificationLength: 10,
  });

  // Chargement 100% Dynamique depuis l'API /api/settings
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.company_info) setCompany((prev) => ({ ...prev, ...json.data.company_info }));
          else if (json.data.company) setCompany((prev) => ({ ...prev, ...json.data.company }));

          if (json.data.tax_rates) setRates(json.data.tax_rates);
          if (json.data.salary_grid && json.data.salary_grid.length > 0) setSalaryGrid(json.data.salary_grid);
          if (json.data.other_params) {
            setOtherParams((prev) => ({ ...prev, ...json.data.other_params }));
          }
          if (json.data.bank_list && json.data.bank_list.length > 0) {
            setBanks(json.data.bank_list);
          }
          if (json.data.location) setLocation(json.data.location);
          if (json.data.payroll_generation_rules) {
            setPayrollRules((prev) => ({ ...prev, ...json.data.payroll_generation_rules }));
          }

          // Charger la configuration du bulletin (apparence + légal)
          if (json.data.payslip_appearance) {
            setPayslipAppearance((prev) => ({ ...prev, ...json.data.payslip_appearance }));
          }
          if (json.data.payslip_legal) {
            setPayslipLegal((prev) => ({ ...prev, ...json.data.payslip_legal }));
          }
          if (json.data.payslip_parametric) {
            setPayslipParametric((prev) => ({ ...prev, ...json.data.payslip_parametric }));
          }
        }

        // Charger aussi depuis l'endpoint dédié /api/settings/payslip
        try {
          const payslipRes = await fetch("/api/settings/payslip");
          const payslipJson = await payslipRes.json();
          if (payslipJson.success && payslipJson.data) {
            if (payslipJson.data.appearance) {
              setPayslipAppearance((prev) => ({ ...prev, ...payslipJson.data.appearance }));
            }
            if (payslipJson.data.legal) {
              setPayslipLegal((prev) => ({ ...prev, ...payslipJson.data.legal }));
            }
            if (payslipJson.data.parametric) {
              setPayslipParametric(payslipJson.data.parametric);
            }
          }
        } catch {
          // Silently ignore if the payslip endpoint is not yet available
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

  const savePayslipConfig = async (parametricOverride?: PayslipParametricConfig) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appearance: payslipAppearance,
          legal: payslipLegal,
          parametric: parametricOverride ?? payslipParametric,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: "Configuration du bulletin enregistrée avec succès !", type: "success" });
      } else {
        setToast({ message: json.error || "Erreur de sauvegarde", type: "error" });
      }
    } catch (err) {
      console.error("Save payslip config error:", err);
      setToast({ message: "Erreur réseau lors de la sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <NeuToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Sliders className="text-[var(--neu-accent)]" /> Paramètres du Système RH & Paie
          </h1>

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
          <Building2 className="w-4 h-4" /> Entreprise & Période
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

        <button
          onClick={() => setActiveTab("payslip")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "payslip"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <FileText className="w-4 h-4" /> Bulletin de Paie
        </button>

        <button
          onClick={() => setActiveTab("payroll_period")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "payroll_period"
              ? "bg-[var(--neu-accent)] text-white shadow-md"
              : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
          }`}
        >
          <Calendar className="w-4 h-4" /> Période & Contrôle Paie
        </button>
      </div>

      {/* Tab 1: Identification Entreprise & Période */}
      {activeTab === "company" && (
        <CompanySettingsCard
          company={company}
          setCompany={setCompany}
          onSave={() => saveSettingsKey("company_info", company)}
          parametric={payslipParametric}
          setParametric={setPayslipParametric}
          saving={saving}
        />
      )}

      {/* Tab 2: Cotisations Fiscales & Sociales */}
      {activeTab === "rates" && (
        <TaxRatesCard
          rates={rates}
          setRates={setRates}
          onSave={() => saveSettingsKey("tax_rates", rates)}
          parametric={payslipParametric}
          setParametric={setPayslipParametric}
          saving={saving}
        />
      )}

      {/* Tab 3: Grille des Salaires */}
      {activeTab === "salary_grid" && (
        <SalaryGridCard
          salaryGrid={salaryGrid}
          setSalaryGrid={setSalaryGrid}
          onSave={() => saveSettingsKey("salary_grid", salaryGrid)}
          saving={saving}
        />
      )}

      {/* Tab 4: Autres Paramètres, Primes & Retenues */}
      {activeTab === "other" && (
        <OtherParamsCard
          otherParams={otherParams}
          setOtherParams={setOtherParams}
          onSave={() => saveSettingsKey("other_params", otherParams)}
          saving={saving}
        />
      )}

      {/* Tab 5: Banques */}
      {activeTab === "banks" && (
        <BanksSettingsCard
          banks={banks}
          setBanks={setBanks}
          onSave={() => saveSettingsKey("bank_list", banks)}
          saving={saving}
        />
      )}

      {/* Tab 6: Géolocalisation & Geofence (Carte Interactive 📍) */}
      {activeTab === "location" && (
        <GeolocationConfig
          initialLat={location.officeLat}
          initialLng={location.officeLng}
          initialRadius={location.radiusMeters}
          onSave={(data) => {
            setLocation({
              ...location,
              officeLat: data.latitude,
              officeLng: data.longitude,
              radiusMeters: data.radiusMeters,
            });
            setToast({ message: "Coordonnées GPS et rayon enregistrés avec succès.", type: "success" });
          }}
        />
      )}

      {/* Tab 7: Personnalisation du Bulletin de Paie */}
      {activeTab === "payslip" && (
        <PayslipCustomizerCard
          appearance={payslipAppearance}
          setAppearance={setPayslipAppearance}
          legal={payslipLegal}
          setLegal={setPayslipLegal}
          parametric={payslipParametric}
          setParametric={setPayslipParametric}
          onSave={savePayslipConfig}
          saving={saving}
        />
      )}

      {/* Période & Contrôles de Génération de Paie */}
      {activeTab === "payroll_period" && (
        <PayrollPeriodSettingsCard
          rules={payrollRules}
          setRules={setPayrollRules}
          onSave={() => saveSettingsKey("payroll_generation_rules", payrollRules)}
          saving={saving}
        />
      )}
    </div>
  );
}

