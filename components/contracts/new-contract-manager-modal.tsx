"use client";

import { useState } from "react";
import { User, Calendar, FileText, CheckCircle, X, Sparkles, Sliders } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { useVisualNotice } from "@/components/ui/visual-notice-modal";
import { EmployeeOptionDTO } from "@/shared/types/contracts/contracts.contract";
import { SimplifiedSalaryNegotiationCard } from "./simplified-salary-negotiation-card";
import { ReverseSalaryCalculatorCard } from "./reverse-salary-calculator-card";
import { calculateGrossFromNet } from "@/lib/domain/payroll/calculator/reverse-payroll-calculator";

interface NewContractManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeOptionDTO[];
  onSuccess: () => void;
}

export function NewContractManagerModal({
  isOpen,
  onClose,
  employees,
  onSuccess,
}: NewContractManagerModalProps) {
  const { showValidationSubmission, showErrorForm, showErrorTech } = useVisualNotice();

  const [viewMode, setViewMode] = useState<"simplified" | "expert">("simplified");

  // État du formulaire
  const [userId, setUserId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("Développeur senior");
  const [contractType, setContractType] = useState<string>("CDI");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [probationMonths, setProbationMonths] = useState<string>("3");

  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleEmployeeSelect = (selectedUserId: string) => {
    setUserId(selectedUserId);
    const emp = employees.find((e) => e.id === selectedUserId);
    if (emp) {
      if (emp.jobTitle) setJobTitle(emp.jobTitle);
    }
  };

  const handleCreateContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showErrorForm({
        title: "CHAMP OBLIGATOIRE",
        description: "Veuillez sélectionner un employé.",
        confirmLabel: "Corriger",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Utiliser le salaire connu du salarié comme base de simulation par défaut.
      const selectedEmployee = employees.find((employee) => employee.id === userId);
      const targetNet = selectedEmployee?.salary ?? 500000;
      const sim = calculateGrossFromNet({
        targetNet,
        transportAllowance: 30000,
        maritalStatus: "Marié(e)",
        childrenCount: 2,
      });

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: contractType,
          category: "cadre",
          jobTitle,
          startDate,
          endDate: endDate || null,
          probationPeriodMonths: Number(probationMonths),
          baseSalary: sim.baseSalary,
          sursalaire: sim.sursalaire,
          transportAllowance: sim.transportAllowance,
          housingAllowance: sim.housingBenefitVal,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
        showValidationSubmission({
          title: "CONTRAT ÉTABLI !",
          description: "Le contrat de travail a été créé avec succès.",
          confirmLabel: "Continuer",
        });
      } else {
        showErrorForm({
          title: "ACTION IMPOSSIBLE",
          description: json.error || "Erreur lors de la création du contrat.",
          confirmLabel: "Fermer",
        });
      }
    } catch (err) {
      console.error("Create contract error:", err);
      showErrorTech({
        title: "ERREUR SERVEUR",
        description: "Connexion impossible avec le serveur.",
        confirmLabel: "Réessayer",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <NeuCard className="w-full max-w-6xl p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-blue-600 w-6 h-6" /> Nouveau contrat
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Créez un contrat de travail et définissez les éléments de rémunération.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sélecteur de vue */}
            <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("simplified")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === "simplified"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Vue manager — simplifiée
              </button>
              <button
                type="button"
                onClick={() => setViewMode("expert")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === "expert"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Vue RH experte — détaillée
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu principal en deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
          {/* Colonne gauche : informations et paramètres du contrat */}
          <div className="lg:col-span-7 space-y-6">
            <form id="new-contract-form" onSubmit={handleCreateContractSubmit} className="space-y-6">
              {/* Section 1 : informations du salarié */}
              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  Informations du salarié
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Salarié *
                    </label>
                    <NeuSelect value={userId} onChange={(e) => handleEmployeeSelect(e.target.value)} required>
                      <option value="">Sélectionner un salarié…</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </NeuSelect>
                  </div>

                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Poste *
                  </label>
                  <NeuInput
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Développeur senior"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nature du contrat *
                  </label>
                  <NeuSelect value={contractType} onChange={(e) => setContractType(e.target.value)}>
                    <option value="CDI">Contrat à durée indéterminée (CDI)</option>
                    <option value="CDD">Contrat à durée déterminée (CDD)</option>
                    <option value="STAGE">Convention de stage</option>
                  </NeuSelect>
                </div>
              </div>

              {/* Section 2 : paramètres du contrat */}
              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  Paramètres du contrat
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Date de prise de fonction *
                    </label>
                    <NeuInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Période d’essai (mois)
                    </label>
                    <NeuSelect value={probationMonths} onChange={(e) => setProbationMonths(e.target.value)}>
                      <option value="0">Sans période d’essai</option>
                      <option value="1">1 mois</option>
                      <option value="2">2 mois</option>
                      <option value="3">3 mois</option>
                      <option value="6">6 mois</option>
                    </NeuSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Date de fin prévisionnelle
                    </label>
                    <NeuInput
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={contractType !== "CDI"}
                    />
                    {contractType !== "CDI" && (
                      <p className="mt-1 text-[11px] text-amber-600">Obligatoire pour un CDD ou une convention de stage.</p>
                    )}
                  </div>
                </div>


              </div>
            </form>
          </div>

          {/* Colonne droite : simulation de rémunération */}
          <div className="lg:col-span-5">
            {viewMode === "simplified" ? (
              <SimplifiedSalaryNegotiationCard
                candidateName={employees.find((e) => e.id === userId)?.name}
                jobTitle={jobTitle}
                contractType={contractType}
                startDate={startDate}
              />
            ) : (
              <ReverseSalaryCalculatorCard
                candidateName={employees.find((e) => e.id === userId)?.name}
                jobTitle={jobTitle}
                contractType={contractType}
                startDate={startDate}
              />
            )}
          </div>
        </div>

        {/* Pied de formulaire */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <NeuButton type="button" variant="outline" onClick={onClose} className="px-5">
            Annuler
          </NeuButton>

          <NeuButton
            type="submit"
            form="new-contract-form"
            variant="accent"
            disabled={submitting}
            className="px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? "Création en cours…" : "Créer le contrat"}
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
