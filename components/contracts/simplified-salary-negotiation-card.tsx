"use client";

import { useState, useMemo } from "react";
import { DollarSign, ShieldCheck, Sparkles, Building2, Car, Bus, FileText, ChevronUp, ChevronDown, Info } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { calculateGrossFromNet, ReverseCalculationResult } from "@/lib/domain/payroll/calculator/reverse-payroll-calculator";

interface SimplifiedSalaryNegotiationCardProps {
  candidateName?: string;
  jobTitle?: string;
  contractType?: string;
  startDate?: string;
}

export function SimplifiedSalaryNegotiationCard({
  candidateName = "",
  jobTitle = "",
  contractType = "CDI",
  startDate = new Date().toISOString().split("T")[0],
}: SimplifiedSalaryNegotiationCardProps) {
  const [netSalaryInput, setNetSalaryInput] = useState<string>("500000");
  const [includeTransport, setIncludeTransport] = useState<boolean>(true);
  const [transportAmount, setTransportAmount] = useState<string>("30000");
  const [includeHousing, setIncludeHousing] = useState<boolean>(false);
  const [includeVehicle, setIncludeVehicle] = useState<boolean>(false);

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const netToPay = parseFloat(netSalaryInput) || 0;
  const transportVal = includeTransport ? parseFloat(transportAmount) || 0 : 0;

  const simulation: ReverseCalculationResult = useMemo(() => {
    return calculateGrossFromNet({
      targetNet: netToPay,
      transportAllowance: transportVal,
      maritalStatus: "Marié(e)",
      childrenCount: 2,
      housingBenefitPercent: includeHousing ? 15 : 0,
      vehicleBenefitPercent: includeVehicle ? 10 : 0,
    });
  }, [netToPay, transportVal, includeHousing, includeVehicle]);

  const handleStepNet = (delta: number) => {
    const nextVal = Math.max(0, netToPay + delta);
    setNetSalaryInput(String(nextVal));
  };

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
          targetNet: netToPay,
          transportAllowance: transportVal,
          maritalStatus: "Marié(e)",
          childrenCount: 2,
          housingBenefitPercent: includeHousing ? 15 : 0,
          vehicleBenefitPercent: includeVehicle ? 10 : 0,
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
      console.error("Erreur de téléchargement de la lettre PDF :", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <NeuCard className="border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 shadow-md">
      <NeuCardContent className="p-6 space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Négociation salariale
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajustez le net à payer pour simuler immédiatement le coût employeur.
              </p>
            </div>
          </div>
          <NeuBadge variant="success" className="gap-1 text-[11px] px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300">
            <Sparkles className="w-3 h-3" /> Simulation indicative
          </NeuBadge>
        </div>

        {/* Saisie du net à payer */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            Net à payer au salarié <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </label>
          <div className="relative flex items-center border-2 border-blue-500 rounded-xl overflow-hidden bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-400">
            <input
              type="number"
              value={netSalaryInput}
              onChange={(e) => setNetSalaryInput(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-black text-blue-600 dark:text-blue-400 bg-transparent focus:outline-none"
              placeholder="500000"
            />
            <div className="flex items-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                FCFA
              </span>
              <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  type="button"
                  onClick={() => handleStepNet(10000)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNet(-10000)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateur de gain */}
        {simulation.reformComparison.employeeGain > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span>Gain estimé : +{simulation.reformComparison.employeeGain.toLocaleString()} FCFA</span>
            <Info className="w-3 h-3 opacity-70" />
          </div>
        )}

        {/* Indicateurs */}
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
              Salaire brut imposable <Info className="w-3 h-3 text-slate-400" />
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {simulation.grossImposable.toLocaleString()} FCFA
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
              Charges patronales <Info className="w-3 h-3 text-slate-400" />
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {simulation.totalEmployerCharges.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {/* Options complémentaires */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTransport}
                onChange={(e) => setIncludeTransport(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Bus className="w-3.5 h-3.5 text-blue-500" /> Inclure l’indemnité de transport
              </span>
            </label>
            {includeTransport && (
              <input
                type="number"
                value={transportAmount}
                onChange={(e) => setTransportAmount(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md text-right bg-slate-50 dark:bg-slate-900"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHousing}
                onChange={(e) => setIncludeHousing(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-500" /> Inclure l’avantage logement (15 %)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVehicle}
                onChange={(e) => setIncludeVehicle(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-emerald-500" /> Inclure le véhicule de fonction (10 %)
              </span>
            </label>
          </div>
        </div>

        {/* Dark Hero Card: Coût total employeur */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <span>Coût total employeur</span>
              <Info className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-2">
              {simulation.totalCompanyCost.toLocaleString()}
              <span className="text-sm font-bold text-slate-400">FCFA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Montant total supporté par l’entreprise : salaire brut et charges patronales.
            </p>
          </div>
        </div>

        {/* Action : télécharger la lettre d’offre PDF */}
        <NeuButton
          type="button"
          variant="outline"
          onClick={handleDownloadOfferLetter}
          disabled={downloadingPdf || netToPay <= 0}
          className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          {downloadingPdf ? "Génération de la lettre PDF…" : "Télécharger la lettre d’offre (PDF)"}
        </NeuButton>
      </NeuCardContent>
    </NeuCard>
  );
}
