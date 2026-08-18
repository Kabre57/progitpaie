"use client";

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { Eye, FileText, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card";
import {
  DEFAULT_PAYSLIP_PARAMETRIC,
  type PayslipParametricConfig,
  type PayslipRubricConfig,
} from "@/lib/payslip-config";

export type PayslipParametricSection = "identity" | "contributions" | "its" | "rubrics" | "other" | "layout" | "bank" | "columns";

interface PayslipParametricCardProps {
  parametric: PayslipParametricConfig;
  setParametric: Dispatch<SetStateAction<PayslipParametricConfig>>;
  onSave: (value: PayslipParametricConfig) => void;
  primaryColor: string;
  saving: boolean;
  visibleSections?: PayslipParametricSection[];
  showHeader?: boolean;
  showPreview?: boolean;
}

type InputProps = {
  label: string;
  value: string | number;
  type?: "text" | "number" | "date" | "color";
  step?: string;
  min?: string;
  max?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function Field({ label, value, type = "text", step, min, max, onChange }: InputProps) {
  return (
    <label className="block text-sm font-medium text-[var(--neu-text-secondary)]">
      {label}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface)] px-3 py-2 text-sm text-[var(--neu-text)] focus:border-[var(--neu-accent)] focus:outline-none"
      />
    </label>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--neu-border)] bg-[var(--neu-surface)] p-4 shadow-sm">
      <div className="mb-4 border-b border-[var(--neu-border)] pb-3">
        <h3 className="font-bold text-[var(--neu-accent)]">{title}</h3>
        {description && <p className="mt-1 text-xs text-[var(--neu-text-muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--neu-border)] p-3 text-sm text-[var(--neu-text)]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--neu-accent)]" />
      <span>{label}</span>
    </label>
  );
}

export function PayslipParametricCard({ parametric, setParametric, onSave, primaryColor, saving, visibleSections, showHeader = true, showPreview = true }: PayslipParametricCardProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const show = (section: PayslipParametricSection) => !visibleSections || visibleSections.includes(section);

  const updateCurrency = (field: keyof PayslipParametricConfig["currency"], value: string | number) => {
    setParametric((current) => ({ ...current, currency: { ...current.currency, [field]: value } }));
  };

  const updateCompany = (field: keyof PayslipParametricConfig["company"], value: string) => {
    setParametric((current) => ({ ...current, company: { ...current.company, [field]: value } }));
  };

  const updatePeriod = (field: keyof PayslipParametricConfig["period"], value: string) => {
    setParametric((current) => ({ ...current, period: { ...current.period, [field]: value } }));
  };

  const updateContribution = (field: keyof PayslipParametricConfig["contributions"], value: number) => {
    setParametric((current) => ({ ...current, contributions: { ...current.contributions, [field]: value } }));
  };

  const updateLayout = (field: keyof PayslipParametricConfig["layout"], value: unknown) => {
    setParametric((current) => ({ ...current, layout: { ...current.layout, [field]: value } }));
  };

  const updateRubric = <K extends keyof PayslipRubricConfig>(index: number, field: K, value: PayslipRubricConfig[K]) => {
    setParametric((current) => ({
      ...current,
      rubrics: current.rubrics.map((rubric, rubricIndex) => rubricIndex === index ? { ...rubric, [field]: value } : rubric),
    }));
  };

  const addRubric = () => {
    setParametric((current) => ({
      ...current,
      rubrics: [...current.rubrics, { code: "", label: "Nouvelle rubrique", type: "gain", visible: true, order: current.rubrics.length + 1 }],
    }));
  };

  const removeRubric = (index: number) => {
    setParametric((current) => ({ ...current, rubrics: current.rubrics.filter((_, rubricIndex) => rubricIndex !== index) }));
  };

  const updateBracket = (index: number, field: "min" | "max" | "rate", value: number | null) => {
    setParametric((current) => ({
      ...current,
      taxBrackets: current.taxBrackets.map((bracket, bracketIndex) => bracketIndex === index ? { ...bracket, [field]: value } : bracket),
    }));
  };

  const addBracket = () => {
    setParametric((current) => ({ ...current, taxBrackets: [...current.taxBrackets, { min: 0, max: null, rate: 0 }] }));
  };

  const removeBracket = (index: number) => {
    setParametric((current) => ({ ...current, taxBrackets: current.taxBrackets.filter((_, bracketIndex) => bracketIndex !== index) }));
  };

  const updateOvertime = (index: number, field: "label" | "rate", value: string | number) => {
    setParametric((current) => ({
      ...current,
      other: { ...current.other, overtimeRates: current.other.overtimeRates.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) },
    }));
  };

  const addOvertime = () => {
    setParametric((current) => ({ ...current, other: { ...current.other, overtimeRates: [...current.other.overtimeRates, { label: "Nouvelle majoration", rate: 0 }] } }));
  };

  const removeOvertime = (index: number) => {
    setParametric((current) => ({ ...current, other: { ...current.other, overtimeRates: current.other.overtimeRates.filter((_, itemIndex) => itemIndex !== index) } }));
  };

  const updateStringList = (field: "bonusTypes" | "deductionTypes", index: number, value: string) => {
    setParametric((current) => ({ ...current, other: { ...current.other, [field]: current.other[field].map((item, itemIndex) => itemIndex === index ? value : item) } }));
  };

  const addStringListItem = (field: "bonusTypes" | "deductionTypes") => {
    setParametric((current) => ({ ...current, other: { ...current.other, [field]: [...current.other[field], "Nouvelle ligne"] } }));
  };

  const removeStringListItem = (field: "bonusTypes" | "deductionTypes", index: number) => {
    setParametric((current) => ({ ...current, other: { ...current.other, [field]: current.other[field].filter((_, itemIndex) => itemIndex !== index) } }));
  };

  const updateValidationAndSave = () => {
    const nextErrors: string[] = [];
    if (!parametric.company.name.trim()) nextErrors.push("Le nom de l’entreprise est obligatoire.");
    if (!parametric.currency.code.trim() || !parametric.currency.symbol.trim()) nextErrors.push("Le code et le symbole de la devise sont obligatoires.");
    if (parametric.currency.decimals < 0 || parametric.currency.decimals > 4) nextErrors.push("Le nombre de décimales doit être compris entre 0 et 4.");
    if (parametric.layout.tableColumnWidths.length !== 8) nextErrors.push("Le tableau doit contenir exactement 8 largeurs de colonnes.");
    if (parametric.taxBrackets.some((bracket) => bracket.rate < 0 || bracket.rate > 100)) nextErrors.push("Chaque taux du barème ITS doit être compris entre 0 et 100 %.");
    setErrors(nextErrors);
    if (nextErrors.length === 0) onSave(parametric);
  };

  const reset = () => {
    if (window.confirm("Restaurer tous les paramètres du bulletin par défaut ?")) {
      setParametric({ ...DEFAULT_PAYSLIP_PARAMETRIC, layout: { ...DEFAULT_PAYSLIP_PARAMETRIC.layout, fontSizes: { ...DEFAULT_PAYSLIP_PARAMETRIC.layout.fontSizes }, tableColumnWidths: [...DEFAULT_PAYSLIP_PARAMETRIC.layout.tableColumnWidths] } });
      setErrors([]);
    }
  };

  return (
    <div className="space-y-5">
      {showHeader && <div className="flex flex-col justify-between gap-3 rounded-2xl bg-[var(--neu-surface)] p-5 shadow-[var(--neu-shadow)] md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--neu-text)]"><FileText className="h-5 w-5 text-[var(--neu-accent)]" /> Configuration visuelle et métier du bulletin</h2>
          <p className="mt-1 text-sm text-[var(--neu-text-secondary)]">Tous les paramètres sont modifiables avec des champs dédiés. Aucun code JSON n’est nécessaire.</p>
        </div>
        <div className="flex gap-2">
          <NeuButton variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</NeuButton>
          <NeuButton variant="accent" onClick={updateValidationAndSave} loading={saving}><Save className="mr-2 h-4 w-4" /> Enregistrer</NeuButton>
        </div>
      </div>}

      {errors.length > 0 && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"><p className="font-semibold">Veuillez corriger les points suivants :</p>{errors.map((error) => <p key={error}>• {error}</p>)}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {show("identity") && <Section title="1. Entreprise, période et devise" description="Ces informations alimentent l’en-tête, les montants et la période affichée sur le PDF.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom de l’entreprise" value={parametric.company.name} onChange={(event) => updateCompany("name", event.target.value)} />
              <Field label="Adresse / boîte postale" value={parametric.company.address} onChange={(event) => updateCompany("address", event.target.value)} />
              <Field label="Numéro RCCM" value={parametric.company.rccm} onChange={(event) => updateCompany("rccm", event.target.value)} />
              <Field label="Compte contribuable (CC)" value={parametric.company.cc} onChange={(event) => updateCompany("cc", event.target.value)} />
              <Field label="Numéro CNPS" value={parametric.company.cnps} onChange={(event) => updateCompany("cnps", event.target.value)} />
              <Field label="Mode de paiement" value={parametric.period.paymentMethod} onChange={(event) => updatePeriod("paymentMethod", event.target.value)} />
              <Field label="Début de période" value={parametric.period.start} type="date" onChange={(event) => updatePeriod("start", event.target.value)} />
              <Field label="Fin de période" value={parametric.period.end} type="date" onChange={(event) => updatePeriod("end", event.target.value)} />
              <Field label="Date de paiement" value={parametric.period.paymentDate} type="date" onChange={(event) => updatePeriod("paymentDate", event.target.value)} />
              <Field label="Code devise" value={parametric.currency.code} onChange={(event) => updateCurrency("code", event.target.value.toUpperCase())} />
              <Field label="Symbole devise" value={parametric.currency.symbol} onChange={(event) => updateCurrency("symbol", event.target.value)} />
              <Field label="Locale d’affichage" value={parametric.currency.locale} onChange={(event) => updateCurrency("locale", event.target.value)} />
              <Field label="Décimales" type="number" min="0" max="4" value={parametric.currency.decimals} onChange={(event) => updateCurrency("decimals", Number(event.target.value))} />
            </div>
          </Section>}

          {show("contributions") && <Section title="2. Cotisations sociales et fiscales" description="Les taux et plafonds sont contrôlés avant sauvegarde et doivent être validés selon les règles locales applicables.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="CNPS retraite salarié (%)" type="number" step="0.01" value={parametric.contributions.cnpsRetraiteEmployeeRate} onChange={(event) => updateContribution("cnpsRetraiteEmployeeRate", Number(event.target.value))} />
              <Field label="CNPS retraite employeur (%)" type="number" step="0.01" value={parametric.contributions.cnpsRetraiteEmployerRate} onChange={(event) => updateContribution("cnpsRetraiteEmployerRate", Number(event.target.value))} />
              <Field label="CNPS accidents du travail (%)" type="number" step="0.01" value={parametric.contributions.cnpsATRate} onChange={(event) => updateContribution("cnpsATRate", Number(event.target.value))} />
              <Field label="CNPS prestations familiales (%)" type="number" step="0.01" value={parametric.contributions.cnpsPFRate} onChange={(event) => updateContribution("cnpsPFRate", Number(event.target.value))} />
              <Field label="FDFP formation continue (%)" type="number" step="0.01" value={parametric.contributions.fdfpFormationRate} onChange={(event) => updateContribution("fdfpFormationRate", Number(event.target.value))} />
              <Field label="FDFP apprentissage (%)" type="number" step="0.01" value={parametric.contributions.fdfpApprentissageRate} onChange={(event) => updateContribution("fdfpApprentissageRate", Number(event.target.value))} />
              <Field label="Plafond CNPS retraite" type="number" value={parametric.contributions.cnpsRetraiteCeiling} onChange={(event) => updateContribution("cnpsRetraiteCeiling", Number(event.target.value))} />
              <Field label="Plafond CNPS accidents" type="number" value={parametric.contributions.cnpsATCeiling} onChange={(event) => updateContribution("cnpsATCeiling", Number(event.target.value))} />
              <Field label="Plafond CNPS prestations" type="number" value={parametric.contributions.cnpsPFCeiling} onChange={(event) => updateContribution("cnpsPFCeiling", Number(event.target.value))} />
            </div>
          </Section>}

          {show("its") && <Section title="3. Barème ITS progressif" description="Ajoutez, modifiez ou supprimez les tranches sans saisir de structure technique.">
            <div className="overflow-x-auto rounded-lg border border-[var(--neu-border)]"><table className="min-w-full text-sm"><thead><tr className="bg-[var(--neu-surface-light)] text-left"><th className="p-2">Minimum</th><th className="p-2">Maximum</th><th className="p-2">Taux (%)</th><th className="p-2">Action</th></tr></thead><tbody>{parametric.taxBrackets.map((bracket, index) => <tr key={`bracket-${index}`} className="border-t border-[var(--neu-border)]"><td className="p-2"><input type="number" className="w-full rounded border p-2" value={bracket.min} onChange={(event) => updateBracket(index, "min", Number(event.target.value))} /></td><td className="p-2"><input type="number" className="w-full rounded border p-2" placeholder="Sans plafond" value={bracket.max ?? ""} onChange={(event) => updateBracket(index, "max", event.target.value === "" ? null : Number(event.target.value))} /></td><td className="p-2"><input type="number" step="0.01" min="0" max="100" className="w-full rounded border p-2" value={bracket.rate} onChange={(event) => updateBracket(index, "rate", Number(event.target.value))} /></td><td className="p-2"><button type="button" className="rounded p-2 text-red-600 hover:bg-red-50" onClick={() => removeBracket(index)} title="Supprimer la tranche"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div><NeuButton className="mt-3" variant="ghost" onClick={addBracket}><Plus className="mr-2 h-4 w-4" /> Ajouter une tranche</NeuButton>
          </Section>}

          {show("rubrics") && <Section title="4. Rubriques du bulletin" description="Les rubriques sont gérées comme des lignes métier : code, libellé, nature, ordre et visibilité.">
            <div className="space-y-3">{parametric.rubrics.map((rubric, index) => <div key={`rubric-${index}`} className="grid gap-2 rounded-lg border border-[var(--neu-border)] p-3 md:grid-cols-[80px_minmax(0,1fr)_140px_80px_100px_40px] md:items-center"><input className="rounded border p-2" value={rubric.code} onChange={(event) => updateRubric(index, "code", event.target.value)} placeholder="Code" /><input className="rounded border p-2" value={rubric.label} onChange={(event) => updateRubric(index, "label", event.target.value)} placeholder="Libellé" /><select className="rounded border p-2" value={rubric.type} onChange={(event) => updateRubric(index, "type", event.target.value as PayslipRubricConfig["type"])}><option value="gain">Gain</option><option value="retenue">Retenue</option><option value="base">Base</option><option value="information">Information</option><option value="total">Total</option></select><input type="number" className="rounded border p-2" value={rubric.order} onChange={(event) => updateRubric(index, "order", Number(event.target.value))} /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rubric.visible} onChange={(event) => updateRubric(index, "visible", event.target.checked)} /> Visible</label><button type="button" className="rounded p-2 text-red-600 hover:bg-red-50" onClick={() => removeRubric(index)} title="Supprimer la rubrique"><Trash2 className="h-4 w-4" /></button></div>)}</div><NeuButton className="mt-3" variant="ghost" onClick={addRubric}><Plus className="mr-2 h-4 w-4" /> Ajouter une rubrique</NeuButton>
          </Section>}

          {show("other") && <Section title="5. Primes, retenues et heures supplémentaires" description="Gérez les libellés visibles dans les listes de paie et les taux de majoration horaires.">
            <div className="grid gap-5 md:grid-cols-2"><div><h4 className="mb-2 font-semibold text-[var(--neu-text)]">Types de primes</h4>{parametric.other.bonusTypes.map((item, index) => <div key={`bonus-${index}`} className="mb-2 flex gap-2"><input className="w-full rounded border p-2" value={item} onChange={(event) => updateStringList("bonusTypes", index, event.target.value)} /><button type="button" className="rounded p-2 text-red-600" onClick={() => removeStringListItem("bonusTypes", index)}><Trash2 className="h-4 w-4" /></button></div>)}<NeuButton variant="ghost" onClick={() => addStringListItem("bonusTypes")}><Plus className="mr-2 h-4 w-4" /> Ajouter une prime</NeuButton></div><div><h4 className="mb-2 font-semibold text-[var(--neu-text)]">Types de retenues</h4>{parametric.other.deductionTypes.map((item, index) => <div key={`deduction-${index}`} className="mb-2 flex gap-2"><input className="w-full rounded border p-2" value={item} onChange={(event) => updateStringList("deductionTypes", index, event.target.value)} /><button type="button" className="rounded p-2 text-red-600" onClick={() => removeStringListItem("deductionTypes", index)}><Trash2 className="h-4 w-4" /></button></div>)}<NeuButton variant="ghost" onClick={() => addStringListItem("deductionTypes")}><Plus className="mr-2 h-4 w-4" /> Ajouter une retenue</NeuButton></div></div><div className="mt-5 overflow-x-auto rounded-lg border border-[var(--neu-border)]"><table className="min-w-full text-sm"><thead><tr className="bg-[var(--neu-surface-light)] text-left"><th className="p-2">Majoration</th><th className="p-2">Taux (%)</th><th className="p-2">Action</th></tr></thead><tbody>{parametric.other.overtimeRates.map((item, index) => <tr key={`overtime-${index}`} className="border-t border-[var(--neu-border)]"><td className="p-2"><input className="w-full rounded border p-2" value={item.label} onChange={(event) => updateOvertime(index, "label", event.target.value)} /></td><td className="p-2"><input type="number" step="0.01" className="w-full rounded border p-2" value={item.rate} onChange={(event) => updateOvertime(index, "rate", Number(event.target.value))} /></td><td className="p-2"><button type="button" className="rounded p-2 text-red-600" onClick={() => removeOvertime(index)}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div><NeuButton className="mt-3" variant="ghost" onClick={addOvertime}><Plus className="mr-2 h-4 w-4" /> Ajouter une majoration</NeuButton>
          </Section>}

          {show("layout") && <Section title="6. Mise en page, signatures et affichage" description="Les dimensions et options contrôlent le rendu PDF A4 sans modifier le code.">
            <div className="grid gap-4 md:grid-cols-4"><Field label="Largeur page (mm)" type="number" value={parametric.layout.pageWidth} onChange={(event) => updateLayout("pageWidth", Number(event.target.value))} /><Field label="Hauteur page (mm)" type="number" value={parametric.layout.pageHeight} onChange={(event) => updateLayout("pageHeight", Number(event.target.value))} /><Field label="Marge haute (mm)" type="number" value={parametric.layout.marginTop} onChange={(event) => updateLayout("marginTop", Number(event.target.value))} /><Field label="Marge basse (mm)" type="number" value={parametric.layout.marginBottom} onChange={(event) => updateLayout("marginBottom", Number(event.target.value))} /><Field label="Marge gauche (mm)" type="number" value={parametric.layout.marginLeft} onChange={(event) => updateLayout("marginLeft", Number(event.target.value))} /><Field label="Marge droite (mm)" type="number" value={parametric.layout.marginRight} onChange={(event) => updateLayout("marginRight", Number(event.target.value))} /><Field label="Police" value={parametric.layout.fontFamily} onChange={(event) => updateLayout("fontFamily", event.target.value)} /><Field label="Hauteur signature (mm)" type="number" value={parametric.layout.signatureBoxSize.height} onChange={(event) => updateLayout("signatureBoxSize", { ...parametric.layout.signatureBoxSize, height: Number(event.target.value) })} /></div>
            <div className="mt-4 grid gap-3 md:grid-cols-3"><Toggle label="Afficher le logo" checked={parametric.layout.showLogo} onChange={(value) => updateLayout("showLogo", value)} /><Toggle label="Afficher le cadre salarié" checked={parametric.layout.showEmployeeFrame} onChange={(value) => updateLayout("showEmployeeFrame", value)} /><Toggle label="Afficher les cumuls" checked={parametric.layout.showCumuls} onChange={(value) => updateLayout("showCumuls", value)} /><Toggle label="Afficher les signatures" checked={parametric.layout.showSignatures} onChange={(value) => updateLayout("showSignatures", value)} /><Toggle label="Afficher la mention légale" checked={parametric.layout.showLegalNotice} onChange={(value) => updateLayout("showLegalNotice", value)} /><Toggle label="Afficher le pied de page" checked={parametric.layout.showFooter} onChange={(value) => updateLayout("showFooter", value)} /></div>
            <div className="mt-4 grid gap-4 md:grid-cols-4"><Field label="Police en-tête" type="number" step="0.1" value={parametric.layout.fontSizes.header} onChange={(event) => updateLayout("fontSizes", { ...parametric.layout.fontSizes, header: Number(event.target.value) })} /><Field label="Police tableau" type="number" step="0.1" value={parametric.layout.fontSizes.table} onChange={(event) => updateLayout("fontSizes", { ...parametric.layout.fontSizes, table: Number(event.target.value) })} /><Field label="Police totaux" type="number" step="0.1" value={parametric.layout.fontSizes.totals} onChange={(event) => updateLayout("fontSizes", { ...parametric.layout.fontSizes, totals: Number(event.target.value) })} /><Field label="Police signatures" type="number" step="0.1" value={parametric.layout.fontSizes.signature} onChange={(event) => updateLayout("fontSizes", { ...parametric.layout.fontSizes, signature: Number(event.target.value) })} /></div>
            <p className="mt-4 text-xs text-[var(--neu-text-muted)]">La couleur du bandeau se règle dans l’onglet « Bulletin de paie ».</p>
          </Section>}

          {show("bank") && <Section title="7. Banque, localisation et paramètres complémentaires" description="Ces informations servent aux exports, aux documents et aux règles de présence de l’entreprise.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nom de la banque" value={parametric.bank.bankName} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, bankName: event.target.value } }))} />
              <Field label="Code banque" value={parametric.bank.bankCode} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, bankCode: event.target.value } }))} />
              <Field label="Numéro de compte" value={parametric.bank.accountNumber} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, accountNumber: event.target.value } }))} />
              <Field label="Clé RIB" value={parametric.bank.ribKey} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, ribKey: event.target.value } }))} />
              <Field label="IBAN" value={parametric.bank.iban} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, iban: event.target.value } }))} />
              <Field label="BIC" value={parametric.bank.bic} onChange={(event) => setParametric((current) => ({ ...current, bank: { ...current.bank, bic: event.target.value } }))} />
              <Field label="Pays" value={parametric.geolocation.country} onChange={(event) => setParametric((current) => ({ ...current, geolocation: { ...current.geolocation, country: event.target.value } }))} />
              <Field label="Région" value={parametric.geolocation.region} onChange={(event) => setParametric((current) => ({ ...current, geolocation: { ...current.geolocation, region: event.target.value } }))} />
              <Field label="Ville" value={parametric.geolocation.city} onChange={(event) => setParametric((current) => ({ ...current, geolocation: { ...current.geolocation, city: event.target.value } }))} />
              <Field label="Taux ancienneté (%)" type="number" step="0.01" value={parametric.other.seniorityRate} onChange={(event) => setParametric((current) => ({ ...current, other: { ...current.other, seniorityRate: Number(event.target.value) } }))} />
              <Field label="Plafond transport exonéré" type="number" value={parametric.other.transportExemptionCeiling} onChange={(event) => setParametric((current) => ({ ...current, other: { ...current.other, transportExemptionCeiling: Number(event.target.value) } }))} />
              <Field label="Locale de l’application" value={parametric.geolocation.locale} onChange={(event) => setParametric((current) => ({ ...current, geolocation: { ...current.geolocation, locale: event.target.value } }))} />
            </div>
          </Section>}

          {show("columns") && <Section title="8. Colonnes, couleurs et précision du tableau" description="Ajustez l’apparence du tableau avec des champs visuels, sans modifier une structure technique.">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Épaisseur des traits" type="number" step="0.01" value={parametric.layout.tableLineWidth} onChange={(event) => updateLayout("tableLineWidth", Number(event.target.value))} />
              <Field label="Espacement cellule" type="number" step="0.01" value={parametric.layout.tableCellPadding} onChange={(event) => updateLayout("tableCellPadding", Number(event.target.value))} />
              <Field label="Hauteur minimale ligne" type="number" step="0.01" value={parametric.layout.tableMinCellHeight} onChange={(event) => updateLayout("tableMinCellHeight", Number(event.target.value))} />
              <Field label="Largeur signature" type="number" value={parametric.layout.signatureBoxSize.width} onChange={(event) => updateLayout("signatureBoxSize", { ...parametric.layout.signatureBoxSize, width: Number(event.target.value) })} />
              <Field label="Couleur en-tête" type="color" value={parametric.layout.tableHeaderBgColor} onChange={(event) => updateLayout("tableHeaderBgColor", event.target.value)} />
              <Field label="Couleur des traits" type="color" value={parametric.layout.tableLineColor} onChange={(event) => updateLayout("tableLineColor", event.target.value)} />
              <Field label="Couleur du texte" type="color" value={parametric.layout.tableBodyTextColor} onChange={(event) => updateLayout("tableBodyTextColor", event.target.value)} />
              <Field label="Couleur des cumuls" type="color" value={parametric.layout.cumulTableBgColor} onChange={(event) => updateLayout("cumulTableBgColor", event.target.value)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">{parametric.layout.tableColumnWidths.map((width, index) => <label key={`column-width-${index}`} className="text-xs text-[var(--neu-text-secondary)]">Colonne {index + 1}<input type="number" min="1" step="0.5" value={width} onChange={(event) => updateLayout("tableColumnWidths", parametric.layout.tableColumnWidths.map((item, itemIndex) => itemIndex === index ? Number(event.target.value) : item))} className="mt-1 w-full rounded border p-2 text-sm" /></label>)}</div>
          </Section>}
        </div>

        {showPreview && <aside className="h-fit space-y-4 xl:sticky xl:top-4"><NeuCard><NeuCardHeader><NeuCardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-[var(--neu-accent)]" /> Aperçu A4</NeuCardTitle></NeuCardHeader><NeuCardContent><div className="mx-auto aspect-[210/297] w-full max-w-[280px] rounded border bg-white p-3 text-[7px] text-slate-800 shadow-lg"><div className="flex justify-between font-bold"><span>{parametric.company.name || "Votre entreprise"}</span><span>BULLETIN DE PAIE</span></div><p className="mt-1 text-slate-500">{parametric.company.address || "Adresse de l’entreprise"}</p><div className="my-3 h-12 rounded" style={{ backgroundColor: primaryColor || "#BBD795" }}><div className="flex h-full items-center justify-center font-bold">Salarié sélectionné</div></div><div className="grid grid-cols-8 border border-slate-400 text-center"><div className="col-span-2 border-r p-1 text-left">DÉSIGNATION</div><div className="border-r p-1">BASE</div><div className="col-span-3 border-r p-1">PART SALARIALE</div><div className="col-span-2 p-1">PART PATRONALE</div><div className="col-span-8 border-t p-2 text-left">01&nbsp;&nbsp; Salaire catégoriel</div><div className="col-span-8 border-t p-2 text-left">02&nbsp;&nbsp; Sursalaire</div><div className="col-span-8 border-t p-2 text-left">03&nbsp;&nbsp; Prime d’ancienneté</div></div><div className="mt-3 rounded bg-slate-100 p-2 text-center font-bold">NET À PAYER&nbsp;&nbsp; 500 000 {parametric.currency.symbol}</div><div className="mt-4 flex justify-between"><span>Signature employeur</span><span>Signature salarié</span></div></div><p className="mt-3 text-xs text-[var(--neu-text-muted)]">Cet aperçu utilise la structure du bulletin et se met à jour pendant la saisie.</p></NeuCardContent></NeuCard>        </aside>}
      </div>
    </div>
  );
}
