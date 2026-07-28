"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Calculator, Grid, Sliders, Landmark, MapPin 
} from "lucide-react";
import { NeuToast } from "@/components/ui/neu-toast";
import { Spinner } from "@/components/ui/spinner";
import { CompanySettingsCard, CompanySettingsData } from "@/components/settings/company-settings-card";
import { TaxRatesCard, TaxRatesData } from "@/components/settings/tax-rates-card";
import { SalaryGridCard } from "@/components/settings/salary-grid-card";
import { OtherParamsCard, OtherParamsData } from "@/components/settings/other-params-card";
import { BanksSettingsCard } from "@/components/settings/banks-settings-card";
import { LocationSettingsCard, LocationData } from "@/components/settings/location-settings-card";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "company" | "rates" | "salary_grid" | "other" | "banks" | "location"
  >("company");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // States 100% dynamiques alimentés par PostgreSQL via l'API /api/settings
  const [company, setCompany] = useState<CompanySettingsData>({
    periodMonth: "JANVIER",
    periodYear: 2026,
    payDate: "31/01/2026",
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

  const [rates, setRates] = useState<TaxRatesData>({
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

  const [salaryGrid, setSalaryGrid] = useState<Array<{ category: string; amount: number }>>([]);

  const [otherParams, setOtherParams] = useState<OtherParamsData>({
    transportExemptAmount: 30000,
    seniorityBonusActive: true,
    roundNetSalary: "5",
    leaveDaysPerMonth: 2.75,
    signatoryName: "",
    signatoryRole: "",
    primes: [],
    deductions: [],
  });

  const [banks, setBanks] = useState<string[]>([]);

  const [location, setLocation] = useState<LocationData>({
    officeLat: 5.3484,
    officeLng: -4.0305,
    radiusMeters: 150,
    strictGeofence: false,
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
      </div>

      {/* Tab 1: Identification Entreprise & Période */}
      {activeTab === "company" && (
        <CompanySettingsCard
          company={company}
          setCompany={setCompany}
          onSave={() => saveSettingsKey("company_info", company)}
          saving={saving}
        />
      )}

      {/* Tab 2: Cotisations Fiscales & Sociales */}
      {activeTab === "rates" && (
        <TaxRatesCard
          rates={rates}
          setRates={setRates}
          onSave={() => saveSettingsKey("tax_rates", rates)}
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

      {/* Tab 6: Géolocalisation */}
      {activeTab === "location" && (
        <LocationSettingsCard
          location={location}
          setLocation={setLocation}
          onSave={() => saveSettingsKey("location", location)}
          saving={saving}
        />
      )}
    </div>
  );
}
