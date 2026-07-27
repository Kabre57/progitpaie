"use client";

import { useState, useEffect } from "react";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";
import { Download, Edit3 } from "lucide-react";

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultName: string;
  defaultJobTitle?: string;
  defaultDepartment?: string;
  defaultSalary?: number;
  defaultSursalaire?: number;
  defaultTransport?: number;
  defaultCategory?: string;
  defaultJoiningDate?: string;
  defaultContractType?: string;
  defaultCddMonths?: number;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  docType: "contract" | "attestation" | "certificat" | "payslip" | "attestation_conge";
}

function fmtNum(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function DocumentEditorModal({
  isOpen,
  onClose,
  userId,
  defaultName,
  defaultJobTitle = "Collaborateur",
  defaultDepartment = "Général",
  defaultSalary = 0,
  defaultSursalaire = 0,
  defaultTransport = 30000,
  defaultCategory = "1A",
  defaultJoiningDate = "",
  defaultContractType = "CDI",
  defaultCddMonths = 6,
  startDate = "",
  endDate = "",
  returnDate = "",
  docType,
}: DocumentEditorModalProps) {
  const [name, setName] = useState(defaultName);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [department, setDepartment] = useState(defaultDepartment);
  const [salary, setSalary] = useState(defaultSalary);
  const [sursalaire, setSursalaire] = useState(defaultSursalaire);
  const [transport, setTransport] = useState(defaultTransport);
  const [category, setCategory] = useState(defaultCategory);
  const [leaveStart, setLeaveStart] = useState(startDate);
  const [leaveEnd, setLeaveEnd] = useState(endDate);
  const [leaveReturn, setLeaveReturn] = useState(returnDate);
  const [article1, setArticle1] = useState("");
  const [article2, setArticle2] = useState("");
  const [article3, setArticle3] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setName(defaultName);
    setJobTitle(defaultJobTitle);
    setDepartment(defaultDepartment);
    setSalary(defaultSalary);
    setSursalaire(defaultSursalaire);
    setTransport(defaultTransport);
    setCategory(defaultCategory);
    setLeaveStart(startDate);
    setLeaveEnd(endDate);
    setLeaveReturn(returnDate);

    const formattedDate = defaultJoiningDate
      ? new Date(defaultJoiningDate).toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");

    const totalSalaryVal = (defaultSalary || 0) + (defaultSursalaire || 0);

    if (docType === "attestation_conge") {
      setBodyText(
        `Attestons que ${defaultName}, employé(e) dans notre société en qualité de ${defaultJobTitle}, est en Congés annuels du ${startDate || formattedDate} au ${endDate || new Date().toLocaleDateString("fr-FR")} inclus.\n\nLa reprise du travail est fixée au ${returnDate || new Date().toLocaleDateString("fr-FR")} à 08 heures 00.\n\nEn foi de quoi, nous lui délivrons le présent certificat, pour servir et valoir ce que de droit.`
      );
    } else if (docType === "attestation") {
      setBodyText(
        `Attestons que ${defaultName}, est employé(e) dans notre société en qualité de ${defaultJobTitle}, catégorie ${defaultCategory}, depuis le ${formattedDate}.\n\nEn foi de quoi, nous lui délivrons la présente attestation, pour servir et valoir ce que de droit.`
      );
    } else if (docType === "certificat") {
      setBodyText(
        `Certifions que M. / Mme ${defaultName} a été employé(e) dans notre société du ${formattedDate} au ${new Date().toLocaleDateString("fr-FR")} en qualité de ${defaultJobTitle}, libre de tout engagement à compter de ce jour.`
      );
    } else if (docType === "contract") {
      if (defaultContractType === "CDD") {
        setArticle1(
          `Article 1er : ${defaultName} est engagé(e) pour une période de ${defaultCddMonths} mois, allant du ${formattedDate}, au poste de ${defaultJobTitle}, correspondant à la catégorie professionnelle ${defaultCategory}, conformément à la Convention Collective Interprofessionnelle (CCI).`
        );
        setArticle2(
          `Article 2 : Le présent contrat ne peut être rompu avant terme que pour force majeure, accord commun ou faute lourde de l'une des parties.`
        );
      } else {
        setArticle1(
          `Article 1er : ${defaultName} est engagé(e) à la date du ${formattedDate}, au poste de ${defaultJobTitle}, correspondant à la catégorie professionnelle ${defaultCategory}, conformément à la Convention Collective Interprofessionnelle (CCI).`
        );
        setArticle2(
          `Article 2 : Le présent contrat prend fin sur décision unilatérale de l'une ou l'autre des parties au contrat, conformément aux dispositions du Code du Travail.`
        );
      }
      setArticle3(
        `Article 3 : ${defaultName} percevra une rémunération mensuelle brute de ${fmtNum(totalSalaryVal)} FCFA et une prime de transport de ${fmtNum(defaultTransport)} FCFA.`
      );
      setBodyText(
        `Formule d'engagement contractuel régie par la loi n°2015-532 portant Code du Travail de la République de Côte d'Ivoire.`
      );
    } else {
      setBodyText(
        `Bulletin de paie individuel calculé selon le barème officiel LOGIPAIE RH.`
      );
    }
  }, [
    defaultName, defaultJobTitle, defaultDepartment, defaultSalary, defaultSursalaire,
    defaultTransport, defaultCategory, defaultJoiningDate, defaultContractType, defaultCddMonths,
    startDate, endDate, returnDate, docType, isOpen
  ]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const fullTextCombined = docType === "contract"
        ? `${article1}\n\n${article2}\n\n${article3}\n\n${bodyText}`
        : bodyText;

      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          docType,
          customName: name,
          customJobTitle: jobTitle,
          customDepartment: department,
          customSalary: salary,
          customSursalaire: sursalaire,
          customBodyText: fullTextCombined,
          startDate: leaveStart,
          endDate: leaveEnd,
          returnDate: leaveReturn,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docType}-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        onClose();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Erreur lors de la génération du document PDF");
      }
    } catch (error) {
      console.error("Generate error:", error);
      alert("Erreur lors de la génération du document");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <NeuDialog open={isOpen} onClose={onClose} title={`Éditer & Imprimer : ${docType.toUpperCase()}`}>
      <div className="space-y-4">
        <div className="p-3 bg-[var(--neu-surface-light)] rounded-lg text-xs text-[var(--neu-text-secondary)] border border-[var(--neu-border)] flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
          Toutes les phrases sont pré-remplies dynamiquement depuis LOGIPAIE. Vous pouvez tout modifier avant d'imprimer.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NeuInput label="Nom & Prénom du Salarié" value={name} onChange={(e) => setName(e.target.value)} />
          <NeuInput label="Poste / Emploi" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>

        {docType === "attestation_conge" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NeuInput label="Date Début Congé" type="text" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
            <NeuInput label="Date Fin Congé" type="text" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
            <NeuInput label="Date Reprise Travail" type="text" value={leaveReturn} onChange={(e) => setLeaveReturn(e.target.value)} />
          </div>
        )}

        {docType !== "contract" && (
          <div>
            <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">
              Corps du Texte (Dynamique & Éditable)
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)]"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-[var(--neu-border)]">
          <NeuButton variant="accent" onClick={handleDownload} loading={generating} className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Générer & Télécharger le PDF Édité
          </NeuButton>
          <NeuButton variant="ghost" onClick={onClose} disabled={generating}>
            Annuler
          </NeuButton>
        </div>
      </div>
    </NeuDialog>
  );
}
