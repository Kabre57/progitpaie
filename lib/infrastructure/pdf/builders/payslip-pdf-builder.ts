import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PayslipAppearanceConfig, PayslipLegalConfig } from "@/lib/payslip-config";

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 187, g: 215, b: 149 };
}

export interface PayslipPdfOptions {
  companyName: string;
  companyAddress: string;
  companyRccm: string;
  companyCc: string;
  companyCnps: string;
  appearanceConfig: PayslipAppearanceConfig;
  legalConfig: PayslipLegalConfig;
  monthName: string;
  year: number;
  empId: string;
  empCnps: string;
  deptName: string;
  serviceName: string;
  jobTitle: string;
  category: string;
  partsIGR: number;
  joiningDate: string;
  seniorityText: string;
  civility: string;
  empName: string;
  empAddress: string;

  // Calculs salariaux & retenues
  baseSalary: number;
  sursalaire: number;
  transport: number;
  overtime: number;
  bonuses: number;
  seniorityVal: number;

  itsTax: number;
  cnpsEmployee: number;
  cnpsEmployerRetraite: number;
  tfcVal: number;
  tapVal: number;
  cnpsEmployerATVal: number;
  cnpsEmployerPFVal: number;

  cumulativeGrossThisYear: number;
  cumulativeNetThisYear: number;
  cumulativeItsThisYear: number;
  cumulativeCnpsThisYear: number;
}

export function generatePayslipPdf(options: PayslipPdfOptions): Buffer {
  const doc = new jsPDF();

  const companyName = cleanText(options.companyName);
  const companyAddress = cleanText(options.companyAddress);
  const companyRccm = cleanText(options.companyRccm);
  const companyCc = cleanText(options.companyCc);
  const companyCnps = cleanText(options.companyCnps);

  const empName = cleanText(options.empName);
  const civility = cleanText(options.civility);
  const empId = cleanText(options.empId);
  const empCnps = cleanText(options.empCnps);
  const deptName = cleanText(options.deptName);
  const serviceName = cleanText(options.serviceName);
  const jobTitle = cleanText(options.jobTitle);
  const category = cleanText(options.category);
  const joiningDate = cleanText(options.joiningDate);
  const seniorityText = cleanText(options.seniorityText);
  const empAddress = cleanText(options.empAddress);
  const monthName = cleanText(options.monthName);

  // Logo entreprise
  let headerYOffset = 0;
  if (options.appearanceConfig.logoBase64) {
    try {
      doc.addImage(options.appearanceConfig.logoBase64, "PNG", 14, 6, 25, 9);
      headerYOffset = 5;
    } catch (err) {
      console.error("Échec de l'ajout du logo dans le PDF:", err);
    }
  }

  // 1. HEADER
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(companyName.toUpperCase(), 14, 14 + headerYOffset);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${companyName}`, 14, 18 + headerYOffset);
  doc.text(`${companyAddress}`, 14, 22 + headerYOffset);
  doc.text(`N°RCCM : ${companyRccm}    N°CC : ${companyCc}`, 14, 26 + headerYOffset);
  doc.text(`N°CNPS : ${companyCnps}`, 14, 30 + headerYOffset);

  // Titre Bulletin à droite
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(cleanText(options.appearanceConfig.headerTitle || "BULLETIN DE PAIE"), 125, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (options.appearanceConfig.headerSubtitle) {
    doc.text(cleanText(options.appearanceConfig.headerSubtitle), 125, 21);
  }
  doc.text(`${monthName.toUpperCase()} ${options.year}`, 165, 21);

  // 2. CADRES SALARIÉ
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Matricule: ${empId}`, 18, 42);
  doc.text(`CNPS N°: ${empCnps}`, 18, 47);
  doc.text(`Direction: ${deptName}`, 18, 52);
  doc.text(`Service: ${serviceName}`, 18, 57);
  doc.text(`Emploi: ${jobTitle}`, 18, 62);
  doc.text(`Catégorie: ${category}`, 18, 67);
  doc.text(`Parts IGR: ${options.partsIGR}`, 18, 72);
  doc.text(`Date entré ${joiningDate}`, 18, 77);
  doc.text(`Ancienneté ${seniorityText}`, 18, 82);

  // Cadre d'apparence salarié à droite
  const rgbColor = hexToRgb(options.appearanceConfig.primaryColor || "#BBD795");
  doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
  doc.rect(100, 38, 96, 48, "F");

  const yiqBox = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
  const contrastTextColor = yiqBox >= 128 ? [30, 30, 30] : [255, 255, 255];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
  doc.text(`${civility} ${empName}`, 120, 56);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
  doc.text(empAddress, 120, 64);

  // 3. TABLEAU DES COMPOSANTES DE PAIE
  const totalBrut = options.baseSalary + options.sursalaire + options.overtime + options.bonuses + options.seniorityVal;
  const brutSocial = totalBrut;
  const brutFiscal = totalBrut;
  const totalGains = totalBrut + options.transport;
  const totalRetenuesSal = options.itsTax + options.cnpsEmployee;
  const totalRetenuesPat = options.cnpsEmployerRetraite + options.tfcVal + options.tapVal + options.cnpsEmployerATVal + options.cnpsEmployerPFVal;
  const netAPayer = totalGains - totalRetenuesSal;

  const tableBody: (string[])[] = [
    ["10", "SALAIRE DE BASE CATEGORIEL", "1.00", options.baseSalary.toLocaleString(), "-", options.baseSalary.toLocaleString(), "-", "-", "-"],
    options.sursalaire > 0
      ? ["12", "SURSALAIRE NÉGOCIÉ", "1.00", options.sursalaire.toLocaleString(), "-", options.sursalaire.toLocaleString(), "-", "-", "-"]
      : [],
    options.seniorityVal > 0
      ? ["15", "PRIME D'ANCIENNETÉ", "1.00", options.seniorityVal.toLocaleString(), "-", options.seniorityVal.toLocaleString(), "-", "-", "-"]
      : [],
    options.overtime > 0
      ? ["20", "HEURES SUPPLÉMENTAIRES", "1.00", options.overtime.toLocaleString(), "-", options.overtime.toLocaleString(), "-", "-", "-"]
      : [],
    options.bonuses > 0
      ? ["25", "PRIMES ET GRATIFICATIONS", "1.00", options.bonuses.toLocaleString(), "-", options.bonuses.toLocaleString(), "-", "-", "-"]
      : [],
    ["30", "TOTAL BRUT IMPOSABLE (BRUT SOCIAL)", "-", "-", "-", totalBrut.toLocaleString(), "-", "-", "-"],
    ["40", "INDEMNITÉ DE TRANSPORT EXONÉRÉE", "1.00", options.transport.toLocaleString(), "-", options.transport.toLocaleString(), "-", "-", "-"],
    ["50", "IMPÔT TRAITEMENT ET SALAIRES (ITS)", "1.20%", brutFiscal.toLocaleString(), options.itsTax.toLocaleString(), "-", "-", "-", "-"],
    ["60", "CNPS RETRAITE SALARIÉ", "6.30%", brutSocial.toLocaleString(), options.cnpsEmployee.toLocaleString(), "-", "-", "-", "-"],
    ["70", "CNPS RETRAITE PATRONAL", "7.70%", brutSocial.toLocaleString(), "-", "-", "7.70%", options.cnpsEmployerRetraite.toLocaleString(), "-"],
    ["71", "CNPS ACCIDENT DU TRAVAIL (AT)", "3.00%", brutSocial.toLocaleString(), "-", "-", "3.00%", options.cnpsEmployerATVal.toLocaleString(), "-"],
    ["72", "CNPS PRESTATIONS FAMILIALES (PF)", "5.75%", brutSocial.toLocaleString(), "-", "-", "5.75%", options.cnpsEmployerPFVal.toLocaleString(), "-"],
    ["80", "TAXE D'APPRENTISSAGE (TAP - FDFP)", "0.40%", brutSocial.toLocaleString(), "-", "-", "0.40%", options.tapVal.toLocaleString(), "-"],
    ["81", "TAXE FORMATION CONTINUE (TFC - FDFP)", "0.60%", brutSocial.toLocaleString(), "-", "-", "0.60%", options.tfcVal.toLocaleString(), "-"],
  ].filter((row) => row.length > 0);

  autoTable(doc, {
    startY: 92,
    head: [["N°", "DÉSIGNATION DES RUBRIQUES", "BASE / TAUX", "GAINS", "RETENUES SAL.", "SALAIRE BRUT", "TAUX PAT.", "RETENUES PAT.", "NET A PAYER"]],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "right", cellWidth: 18 },
      6: { halign: "center", cellWidth: 14 },
      7: { halign: "right", cellWidth: 18 },
      8: { halign: "right", cellWidth: 18 },
    },
    didDrawPage: function (data) {
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Généré par PROGITPAIE RH — Page ${data.pageNumber} — Document confidentiel`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 195;

  // 4. RÉCAPITULATIF TOTAUX
  autoTable(doc, {
    startY: finalTableY + 4,
    head: [["TOTAL GAINS BRUTS", "TOTAL RETENUES SALARIALES", "TOTAL CHARGES PATRONALES", "NET A PAYER SALARIÉ"]],
    body: [[
      `${totalGains.toLocaleString()} FCFA`,
      `${totalRetenuesSal.toLocaleString()} FCFA`,
      `${totalRetenuesPat.toLocaleString()} FCFA`,
      `${netAPayer.toLocaleString()} FCFA`,
    ]],
    theme: "plain",
    styles: { fontSize: 8, fontStyle: "bold", halign: "center", cellPadding: 2 },
    headStyles: { fillColor: [235, 238, 242], textColor: [40, 40, 40] },
    bodyStyles: { fillColor: [248, 249, 250], textColor: [20, 20, 20] },
  });

  const cumulsFinalY = (doc as any).lastAutoTable?.finalY || (finalTableY + 30);

  // 5. CUMULS ANNUELS FISCAUX & CNPS
  autoTable(doc, {
    startY: cumulsFinalY + 4,
    head: [["CUMUL BRUT FISCAL (ANNÉE)", "CUMUL NET IMPOSABLE (ANNÉE)", "CUMUL ITS PAYÉ", "CUMUL CNPS SALARIAL"]],
    body: [[
      `${options.cumulativeGrossThisYear.toLocaleString()} FCFA`,
      `${options.cumulativeNetThisYear.toLocaleString()} FCFA`,
      `${options.cumulativeItsThisYear.toLocaleString()} FCFA`,
      `${options.cumulativeCnpsThisYear.toLocaleString()} FCFA`,
    ]],
    theme: "plain",
    styles: { fontSize: 7, halign: "center", cellPadding: 1.5 },
    headStyles: { fillColor: [220, 224, 230], textColor: [50, 50, 50] },
  });

  // 6. ZONE DE SIGNATURE ET MENTIONS LÉGALES
  const signatureY = ((doc as any).lastAutoTable?.finalY || cumulsFinalY) + 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Signature de l'Employeur / Cachet :", 20, signatureY);
  doc.text("Signature du Salarié :", 130, signatureY);

  doc.rect(20, signatureY + 3, 60, 15, "S");
  doc.rect(130, signatureY + 3, 60, 15, "S");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  const mentionText = cleanText(
    options.legalConfig.legalNotice ||
      "Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée."
  );
  doc.text(mentionText, 14, signatureY + 22);

  return Buffer.from(doc.output("arraybuffer"));
}
