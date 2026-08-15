"use client";

import { useState, useMemo } from "react";
import { Calculator, CheckCircle, Sparkles, Building2, Car, Users, FileText, AlertCircle } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { calculateGrossFromNet, ReverseCalculationResult } from "@/lib/domain/payroll/calculator/reverse-payroll-calculator";

interface ReverseSalaryCalculatorCardProps {
  candidateName?: string;
  jobTitle?: string;
  contractType?: string;
  startDate?: string;
  onApplyCalculatedSalary?: (data: {
    baseSalary: number;
    sursalaire: number;
    transportAllowance: number;
    partsIGR: number;
    maritalStatus: string;
    childrenCount: number;
    housingBenefitVal: number;
    vehicleBenefitVal: number;
  }) => void;
}

export function ReverseSalaryCalculatorCard({
  candidateName = "",
  jobTitle = "",
  contractType = "CDI",
  startDate = new Date().toISOString().split("T")[0],
  onApplyCalculatedSalary,
}: ReverseSalaryCalculatorCardProps) {
  const [targetNetInput, setTargetNetInput] = useState<string>("500000");
  const [transportInput, setTransportInput] = useState<string>("30000");
  const [maritalStatus, setMaritalStatus] = useState<string>("Célibataire");
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [hasHousing, setHasHousing] = useState<boolean>(false);
  const [hasVehicle, setHasVehicle] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const targetNet = parseFloat(targetNetInput) || 0;
  const transportAllowance = parseFloat(transportInput) || 0;

  const simulation: ReverseCalculationResult = useMemo(() => {
    return calculateGrossFromNet({
      targetNet,
      transportAllowance,
      maritalStatus,
      childrenCount,
      housingBenefitPercent: hasHousing ? 15 : 0,
      vehicleBenefitPercent: hasVehicle ? 10 : 0,
    });
  }, [targetNet, transportAllowance, maritalStatus, childrenCount, hasHousing, hasVehicle]);

  const handleDownloadOfferLetter = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/contracts/offer-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidateName || "Candidat",
          candidateJobTitle: jobTitle || "Employé",
          contractType,
          startDate,
          targetNet,
          transportAllowance,
          maritalStatus,
          childrenCount,
          housingBenefitPercent: hasHousing ? 15 : 0,
          vehicleBenefitPercent: hasVehicle ? 10 : 0,
        }),
      });

      if (!res.ok) throw new Error("Erreur génération PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lettre-offre-${(candidateName || "candidat").toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF Offer Letter download error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleApply = () => {
    if (onApplyCalculatedSalary) {
      onApplyCalculatedSalary({
        baseSalary: simulation.baseSalary,
        sursalaire: simulation.sursalaire,
        transportAllowance: simulation.transportAllowance,
        partsIGR: simulation.partsIGR,
        maritalStatus,
        childrenCount,
        housingBenefitVal: simulation.housingBenefitVal,
        vehicleBenefitVal: simulation.vehicleBenefitVal,
      });
    }
  };

  return (
    <NeuCard className="border-2 border-[var(--neu-accent)]">
      <NeuCardHeader className="bg-[var(--neu-surface-light)] border-b border-[var(--neu-border)] p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="text-[var(--neu-accent)] w-5 h-5" />
          <NeuCardTitle className="text-base font-bold text-[var(--neu-text)]">
            Module de Négociation au NET & Simulation Coût Entreprise
          </NeuCardTitle>
        </div>
        <NeuBadge variant="success" className="gap-1">
          <Sparkles className="w-3 h-3" /> Paramètres à valider
        </NeuBadge>
      </NeuCardHeader>

      <NeuCardContent className="p-5 space-y-6">
        {/* Entrées du calcul */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--neu-surface-light)] p-4 rounded-xl border border-[var(--neu-border)]">
          <div>
            <label className="text-xs font-bold text-[var(--neu-text-secondary)] block mb-1">
              Salaire NET à Payer souhaité (FCFA) *
            </label>
            <NeuInput
              type="number"
              value={targetNetInput}
              onChange={(e) => setTargetNetInput(e.target.value)}
              placeholder="ex: 500000"
              className="font-bold text-lg text-[var(--neu-accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--neu-text-secondary)] block mb-1">
              Situation Matrimoniale
            </label>
            <NeuSelect
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              options={[
                { value: "Célibataire", label: "Célibataire" },
                { value: "Marié(e)", label: "Marié(e)" },
                { value: "Divorcé(e)", label: "Divorcé(e)" },
                { value: "Veuf/Veuve", label: "Veuf / Veuve" },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--neu-text-secondary)] block mb-1">
              Nombre d’enfants à charge (0 à 6+)
            </label>
            <NeuSelect
              value={String(childrenCount)}
              onChange={(e) => setChildrenCount(Number(e.target.value))}
              options={[
                { value: "0", label: "0 enfant" },
                { value: "1", label: "1 enfant" },
                { value: "2", label: "2 enfants" },
                { value: "3", label: "3 enfants" },
                { value: "4", label: "4 enfants" },
                { value: "5", label: "5 enfants" },
                { value: "6", label: "6 enfants et +" },
              ]}
            />
          </div>
        </div>

        {/* Options complémentaires et transport */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[var(--neu-surface-light)] p-4 rounded-xl border border-[var(--neu-border)]">
          <div>
            <label className="text-xs font-bold text-[var(--neu-text-secondary)] block mb-1">
              Indemnité de Transport (FCFA)
            </label>
            <NeuInput
              type="number"
              value={transportInput}
              onChange={(e) => setTransportInput(e.target.value)}
              placeholder="30000"
            />
            {simulation.transportTaxableSurplus > 0 && (
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> Surplus imposable: +{simulation.transportTaxableSurplus.toLocaleString()} FCFA
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="housingCheck"
              checked={hasHousing}
              onChange={(e) => setHasHousing(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--neu-accent)] focus:ring-0"
            />
            <label htmlFor="housingCheck" className="text-xs font-bold text-[var(--neu-text)] flex items-center gap-1 cursor-pointer">
              <Building2 className="w-4 h-4 text-blue-500" /> Logement de fonction (+15%)
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="vehicleCheck"
              checked={hasVehicle}
              onChange={(e) => setHasVehicle(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--neu-accent)] focus:ring-0"
            />
            <label htmlFor="vehicleCheck" className="text-xs font-bold text-[var(--neu-text)] flex items-center gap-1 cursor-pointer">
              <Car className="w-4 h-4 text-emerald-500" /> Véhicule de fonction (+10%)
            </label>
          </div>
        </div>

        {/* Bandeau familial et avertissement de validation locale */}
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Simulation indicative : les taux et règles doivent être validés avec le référent paie ivoirien avant utilisation réglementaire.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Calcul Familial : {simulation.partsIGR} Part(s) IGR
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Réduction familiale indicative : <strong>-{simulation.ricfDeduction.toLocaleString()} FCFA / mois</strong>
              </p>
            </div>
          </div>

          {simulation.reformComparison.employeeGain > 0 && (
            <NeuBadge variant="success" className="px-3 py-1 text-xs">
              Gain indicatif : +{simulation.reformComparison.employeeGain.toLocaleString()} FCFA / mois
            </NeuBadge>
          )}
        </div>

        {/* Décomposition salariale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-[var(--neu-surface-light)] p-3 rounded-xl border border-[var(--neu-border)]">
            <h4 className="text-xs font-bold text-[var(--neu-text)] uppercase border-b pb-1 flex justify-between">
              <span>Retenues Salariales (Prélèvements)</span>
              <span>FCFA</span>
            </h4>
            <div className="space-y-1 text-xs text-[var(--neu-text-secondary)]">
              <div className="flex justify-between">
                <span>CNPS Retraite Salarié (6,3%) :</span>
                <span className="font-semibold">{simulation.cnpsEmployee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Couverture Maladie (CMU) :</span>
                <span className="font-semibold">{simulation.cmuEmployee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Impôt Unique (ITS Barème 2024) :</span>
                <span className="font-semibold">{simulation.itsBrut.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Réduction Familiale (RICF) :</span>
                <span>-{simulation.ricfDeduction.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t pt-1">
                <span>TOTAL RETENUES SALARIALES :</span>
                <span>{simulation.totalEmployeeDeductions.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-[var(--neu-surface-light)] p-3 rounded-xl border border-[var(--neu-border)]">
            <h4 className="text-xs font-bold text-[var(--neu-text)] uppercase border-b pb-1 flex justify-between">
              <span>Charges Patronales & Budget Entreprise</span>
              <span>FCFA</span>
            </h4>
            <div className="space-y-1 text-xs text-[var(--neu-text-secondary)]">
              <div className="flex justify-between">
                <span>CNPS Patronale (16,45%) :</span>
                <span className="font-semibold">{simulation.cnpsEmployer.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes FDFP (TFC 0.6% + TAP 0.4%) :</span>
                <span className="font-semibold">{simulation.fdfpEmployer.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold text-[var(--neu-text)]">
                <span>TOTAL CHARGES PATRONALES :</span>
                <span>{simulation.totalEmployerCharges.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between bg-blue-50 dark:bg-blue-950/60 p-2 rounded-lg text-blue-900 dark:text-blue-100 font-bold text-sm border border-blue-200 mt-2">
                <span>COÛT TOTAL ENTREPRISE :</span>
                <span>{simulation.totalCompanyCost.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
          <NeuButton
            type="button"
            variant="outline"
            onClick={handleDownloadOfferLetter}
            disabled={downloadingPdf || targetNet <= 0}
            className="w-full sm:w-auto gap-2"
          >
            <FileText className="w-4 h-4" />
            {downloadingPdf ? "Génération PDF..." : "📄 Télécharger la Lettre d'Offre PDF"}
          </NeuButton>

          {onApplyCalculatedSalary && (
            <NeuButton
              type="button"
              variant="accent"
              onClick={handleApply}
              disabled={targetNet <= 0}
              className="w-full sm:w-auto gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Reporter le Salaire de Base ({simulation.baseSalary.toLocaleString()} FCFA) & Sursalaire ({simulation.sursalaire.toLocaleString()} FCFA)
            </NeuButton>
          )}
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
