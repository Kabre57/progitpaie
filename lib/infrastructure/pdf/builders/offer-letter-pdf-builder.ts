import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReverseCalculationResult } from "@/lib/domain/payroll/calculator/reverse-payroll-calculator";

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

export interface OfferLetterOptions {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  candidateName: string;
  candidateJobTitle: string;
  contractType: string;
  startDate: string;
  simulation: ReverseCalculationResult;
}

export function generateOfferLetterPdf(options: OfferLetterOptions): Buffer {
  const doc = new jsPDF();
  const cName = cleanText(options.companyName || "PROGITPAIE S.A.");
  const cAddress = cleanText(options.companyAddress || "Abidjan, Côte d'Ivoire");
  const candName = cleanText(options.candidateName || "Monsieur / Madame");
  const jobTitle = cleanText(options.candidateJobTitle || "Cadre RH");
  const sim = options.simulation;

  // 1. EN-TÊTE ENTREPRISE
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(cName.toUpperCase(), 14, 20);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${cAddress} — Tel: ${cleanText(options.companyPhone)} — Email: ${cleanText(options.companyEmail)}`, 14, 26);
  doc.text(`Date de simulation : ${new Date().toLocaleDateString("fr-FR")}`, 14, 31);

  // Titre principal
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("PROPOSITION D'EMBAUCHE & SIMULATION DE RÉMUNÉRATION", 14, 45);

  // 2. CORPS DU COURRIER
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(`A l'attention de : ${candName}`, 14, 55);
  doc.text(`Poste proposé : ${jobTitle} (${cleanText(options.contractType)}) — Prise de fonction le ${cleanText(options.startDate)}`, 14, 61);

  const introText = cleanText(
    `Nous avons le plaisir de vous transmettre la proposition financière officielle d'embauche. ` +
    `Le package salarial ci-dessous a ete calcule en fonction de votre situation familiale (${sim.partsIGR} part(s) IGR) ` +
    `et garantit votre Salaire Net a Payer.`
  );
  doc.text(doc.splitTextToSize(introText, 180), 14, 69);

  // 3. TABLEAU 1 : DÉCOMPOSITION DE LA RÉMUNÉRATION
  const salaryTableBody = [
    ["Salaire de base categoriel", `${sim.baseSalary.toLocaleString()} FCFA`],
    ["Sursalaire negocie", `${sim.sursalaire.toLocaleString()} FCFA`],
    ["Salaire Brut Imposable", `${sim.grossImposable.toLocaleString()} FCFA`],
    ["Indemnite de transport (Exoneree 30k)", `${sim.transportAllowance.toLocaleString()} FCFA`],
    sim.housingBenefitVal > 0 ? ["Avantage en nature Logement (15%)", `${sim.housingBenefitVal.toLocaleString()} FCFA`] : [],
    sim.vehicleBenefitVal > 0 ? ["Avantage en nature Vehicule (10%)", `${sim.vehicleBenefitVal.toLocaleString()} FCFA`] : [],
    ["TOTAL DES GAINS BRUTS GLOBAUX", `${sim.totalGainsGlobal.toLocaleString()} FCFA`],
  ].filter((r) => r.length > 0);

  autoTable(doc, {
    startY: 82,
    head: [["RUBRIQUE DE RÉMUNÉRATION", "MONTANT MENSUEL"]],
    body: salaryTableBody,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: "bold" },
  });

  const salaryY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? 135;

  // 4. TABLEAU 2 : PRÉLÈVEMENTS & NET GARANTI
  const deductionsTableBody = [
    ["Cotisation CNPS Retraite Salarie (6.3%)", `${sim.cnpsEmployee.toLocaleString()} FCFA`],
    ["Couverture Maladie Universelle (CMU)", `${sim.cmuEmployee.toLocaleString()} FCFA`],
    ["Impot Unique ITS (Bareme 2024)", `${sim.itsBrut.toLocaleString()} FCFA`],
    ["Reduction Charges de Famille (RICF)", `- ${sim.ricfDeduction.toLocaleString()} FCFA`],
    ["TOTAL DES RETENUES SALARIALES", `${sim.totalEmployeeDeductions.toLocaleString()} FCFA`],
    ["NET MENSUEL GARANTI A PAYER EN POCHE", `${sim.netSalaryCalculated.toLocaleString()} FCFA`],
  ];

  autoTable(doc, {
    startY: salaryY + 6,
    head: [["DÉTAIL DES PRÉLÈVEMENTS SOCIAUX & FISCAUX", "MONTANT MENSUEL"]],
    body: deductionsTableBody,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
  });

  const deductionsY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? 190;

  // 5. BANDEAU DE CONFIRMATION ET BUDGET ENTREPRISE
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Budget Coût Total Entreprise estime : ${sim.totalCompanyCost.toLocaleString()} FCFA / mois`, 14, deductionsY + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Remarque : Grâce à la Réforme Fiscale 2024, votre rémunération bénéficie du barème ITS unique avec réduction RICF (${sim.ricfAmount.toLocaleString()} FCFA/mois).`,
    14,
    deductionsY + 14
  );

  // 6. ZONE DE SIGNATURE ET BON POUR ACCORD
  const signatureY = deductionsY + 26;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Pour la Direction de l'Entreprise :", 20, signatureY);
  doc.text("Bon pour accord et acceptation du Candidat :", 120, signatureY);

  doc.rect(20, signatureY + 4, 65, 18, "S");
  doc.rect(120, signatureY + 4, 65, 18, "S");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Document de simulation généré par PROGITPAIE RH — Valable 30 jours", 14, signatureY + 28);

  return Buffer.from(doc.output("arraybuffer"));
}
