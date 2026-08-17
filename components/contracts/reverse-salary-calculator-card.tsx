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
    <NeuCard className="border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 shadow-lg rounded-2xl overflow-hidden">
      <NeuCardHeader className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <NeuCardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            Négociation NET & Coût Entreprise
          </NeuCardTitle>
        </div>
        <NeuBadge variant="success" className="gap-1 text-[11px] shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300">
          <Sparkles className="w-3 h-3" /> Vue RH experte
        </NeuBadge>
      </NeuCardHeader>

      <NeuCardContent className="p-4 sm:p-5 space-y-4">
        {/* Entrées du calcul */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Net souhaité (FCFA) *
            </label>
            <NeuInput
              type="number"
              value={targetNetInput}
              onChange={(e) => setTargetNetInput(e.target.value)}
              placeholder="ex: 500000"
              className="font-black text-base text-blue-600 dark:text-blue-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
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
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Enfants à charge
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Transport (FCFA)
            </label>
            <NeuInput
              type="number"
              value={transportInput}
              onChange={(e) => setTransportInput(e.target.value)}
              placeholder="30000"
            />
            {simulation.transportTaxableSurplus > 0 && (
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> Surplus: +{simulation.transportTaxableSurplus.toLocaleString()} FCFA
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="housingCheck"
              checked={hasHousing}
              onChange={(e) => setHasHousing(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="housingCheck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Logement (+15%)
            </label>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="vehicleCheck"
              checked={hasVehicle}
              onChange={(e) => setHasVehicle(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="vehicleCheck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
              <Car className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Véhicule (+10%)
            </label>
          </div>
        </div>

        {/* Bandeau familial */}
        <div className="space-y-2">
          <p className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-lg p-2 leading-relaxed">
            Simulation indicative : les taux et règles doivent être validés avec le référent paie ivoirien avant utilisation réglementaire.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
              <NeuBadge variant="success" className="px-2.5 py-0.5 text-[11px] shrink-0">
                Gain indicatif : +{simulation.reformComparison.employeeGain.toLocaleString()} FCFA
              </NeuBadge>
            )}
          </div>
        </div>

        {/* Décomposition salariale - stacked or side-by-side cleanly */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
          {/* Retenues Salariales */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Retenues Salariales
              </span>
              <span className="text-[10px] font-bold text-slate-400">FCFA</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">CNPS Retraite Salarié (6,3%)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{simulation.cnpsEmployee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">Couverture Maladie (CMU)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{simulation.cmuEmployee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">Impôt Unique (ITS 2024)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{simulation.itsBrut.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="truncate">Réduction Familiale (RICF)</span>
                <span className="shrink-0">-{simulation.ricfDeduction.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold border-t border-slate-200 dark:border-slate-800 pt-1.5">
                <span>TOTAL RETENUES</span>
                <span className="shrink-0">{simulation.totalEmployeeDeductions.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Charges Patronales & Coût Entreprise */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Charges Patronales
                </span>
                <span className="text-[10px] font-bold text-slate-400">FCFA</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate">CNPS Patronale (16,45%)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{simulation.cnpsEmployer.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate font-normal">Taxes FDFP (TFC + TAP)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{simulation.fdfpEmployer.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-1.5 font-extrabold text-slate-900 dark:text-slate-100">
                  <span>TOTAL CHARGES</span>
                  <span className="shrink-0">{simulation.totalEmployerCharges.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Total Coût Entreprise Highlight Card */}
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-md mt-2 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Coût Total Entreprise
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  {simulation.totalCompanyCost.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-blue-400 uppercase">FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <NeuButton
            type="button"
            variant="outline"
            onClick={handleDownloadOfferLetter}
            disabled={downloadingPdf || targetNet <= 0}
            className="w-full sm:w-auto text-xs gap-1.5 py-2"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            {downloadingPdf ? "Génération PDF..." : "Télécharger Offre PDF"}
          </NeuButton>

          {onApplyCalculatedSalary && (
            <NeuButton
              type="button"
              variant="accent"
              onClick={handleApply}
              disabled={targetNet <= 0}
              className="w-full sm:w-auto text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Reporter le Salaire
            </NeuButton>
          )}
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
