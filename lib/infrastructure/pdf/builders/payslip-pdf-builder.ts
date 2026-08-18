import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PayslipAppearanceConfig, PayslipLegalConfig, PayslipParametricConfig } from "@/lib/payslip-config";

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function formatAmount(value: number, currency: PayslipParametricConfig["currency"] = { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals: 0 }): string {
  return Math.round(value).toLocaleString(currency.locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).replace(/[\u202F\u00A0]/g, " ");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 187, g: 215, b: 149 };
}

function hexToRgbArray(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  return [rgb.r, rgb.g, rgb.b];
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
  parametricConfig?: PayslipParametricConfig;
  baseSalary: number;
  sursalaire: number;
  transport: number;
  overtime: number;
  bonuses: number;
  seniorityVal: number;
  itsTax: number;
  cnpsEmployee: number;
  cmuBase: number;
  cmuEmployee: number;
  cmuEmployer: number;
  showCMU: boolean;
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
  const layout = options.parametricConfig?.layout;
  const currency = options.parametricConfig?.currency;
  const doc = new jsPDF({
    orientation: layout?.orientation || "portrait",
    unit: "mm",
    format: [layout?.pageWidth || 210, layout?.pageHeight || 297],
  });
  const money = (value: number) => formatAmount(value, currency);
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

  let headerYOffset = 0;
  if (options.appearanceConfig.logoBase64 && (layout?.showLogo ?? true)) {
    try {
      doc.addImage(options.appearanceConfig.logoBase64, "PNG", layout?.logoPosition.x ?? 14, layout?.logoPosition.y ?? 6, layout?.logoSize.width ?? 25, layout?.logoSize.height ?? 9);
      headerYOffset = 5;
    } catch (error) {
      console.error("Échec de l'ajout du logo dans le PDF:", error);
    }
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(companyName.toUpperCase(), 14, 14 + headerYOffset);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(companyName, 14, 18 + headerYOffset);
  doc.text(companyAddress, 14, 22 + headerYOffset);
  doc.text(`N°RCCM : ${companyRccm}    N°CC : ${companyCc}`, 14, 26 + headerYOffset);
  doc.text(`N°CNPS : ${companyCnps}`, 14, 30 + headerYOffset);

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

  const rgbColor = hexToRgb(options.appearanceConfig.primaryColor || "#BBD795");
  doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
  if (layout?.showEmployeeFrame ?? true) {
    doc.rect(100, 38, 96, 48, "F");
  }
  const yiqBox = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
  const contrastTextColor = yiqBox >= 128 ? [30, 30, 30] : [255, 255, 255];
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
  doc.text(`${civility} ${empName}`, 120, 56);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(empAddress, 120, 64);

  const totalBrut = options.baseSalary + options.sursalaire + options.overtime + options.bonuses + options.seniorityVal;
  const brutSocial = totalBrut;
  const brutFiscal = totalBrut;
  const totalGains = totalBrut + options.transport;
  const totalRetenuesSal = options.itsTax + options.cnpsEmployee + (options.showCMU ? options.cmuEmployee : 0);
  const totalRetenuesPat = options.cnpsEmployerRetraite + options.tfcVal + options.tapVal + options.cnpsEmployerATVal + options.cnpsEmployerPFVal + (options.showCMU ? options.cmuEmployer : 0);
  const netAPayer = totalGains - totalRetenuesSal;
  const emptyRow = (code: string): string[] => [code, "", "", "", "", "", "", ""];
  const tableWidths = layout?.tableColumnWidths?.length === 8 ? layout.tableColumnWidths : [9, 57, 20, 16, 19, 19, 15, 19];
  const defaultTableBody: string[][] = [
    ["01", "SALAIRE CATEGORIEL", money(options.baseSalary), "", money(options.baseSalary), "", "", ""],
    ["02", "SURSALAIRE", options.sursalaire > 0 ? money(options.sursalaire) : "", "", options.sursalaire > 0 ? money(options.sursalaire) : "", "", "", ""],
    ["03", "PRIME D'ANCIENNETÉ", options.seniorityVal > 0 ? money(options.baseSalary) : "", options.seniorityVal > 0 ? "3.00%" : "", options.seniorityVal > 0 ? money(options.seniorityVal) : "", "", "", ""],
    ...Array.from({ length: 11 }, (_, index) => emptyRow(String(index + 4).padStart(2, "0"))),
    ["15", "CONGÉS PAYÉS", "", "", "", "", "", ""],
    ["16", "GRATIFICATION", "", "", "", "", "", ""],
    ["17", "PRÉAVIS", "", "", "", "", "", ""],
    ["18", "INDEMNITÉ DE LICENCIEMENT", "", "", "", "", "", ""],
    ["19", "PRIME D'ANCIENNETÉ", options.seniorityVal > 0 ? money(options.baseSalary) : "", options.seniorityVal > 0 ? "3.00%" : "", options.seniorityVal > 0 ? money(options.seniorityVal) : "", "", "", ""],
    ["20", "HEURES SUPPLÉMENTAIRES", options.overtime > 0 ? money(options.overtime) : "", "", options.overtime > 0 ? money(options.overtime) : "", "", "", ""],
    ["21", "PRIME DE TRANSPORT", money(options.transport), "", money(options.transport), "", "", ""],
    ["25", "PRIMES ET GRATIFICATIONS", options.bonuses > 0 ? money(options.bonuses) : "", "", options.bonuses > 0 ? money(options.bonuses) : "", "", "", ""],
    ["30", "TOTAL BRUT", "", "", money(totalBrut), "", "", ""],
    ["31", "BRUT FISCAL EMPLOYÉ", money(brutFiscal), "", money(totalBrut), "", "", ""],
    ["32", "BRUT SOCIAL EMPLOYÉ", money(brutSocial), "", money(totalBrut), "", "", ""],
    ["34", "IMPÔT TRAITEMENT ET SALAIRES (ITS)", money(brutFiscal), "", "", money(options.itsTax), "", ""],
    ["35", "CNPS RETRAITE SALARIÉ", money(brutSocial), "6.30%", "", money(options.cnpsEmployee), "7.70%", money(options.cnpsEmployerRetraite)],
    ...(options.showCMU ? [["35b", "COUVERTURE MALADIE UNIVERSELLE (CMU)", money(options.cmuBase), "", "", money(options.cmuEmployee), "", money(options.cmuEmployer)]] : []),
    ["36", "CNPS ACCIDENT DU TRAVAIL (AT)", money(brutSocial), "", "", "", "3.00%", money(options.cnpsEmployerATVal)],
    ["37", "CNPS PRESTATIONS FAMILIALES (PF)", money(brutSocial), "", "", "", "5.75%", money(options.cnpsEmployerPFVal)],
    ["38", "FDFP TAXE FORMATION CONTINUE", money(brutSocial), "", "", "", "0.60%", money(options.tfcVal)],
    ["39", "FDFP TAXE D'APPRENTISSAGE", money(brutSocial), "", "", "", "0.40%", money(options.tapVal)],
    ["40", "PRIME DE TRANSPORT EXONÉRÉE", money(options.transport), "", money(options.transport), "", "", ""],
  ];
  const rubricMap = new Map((options.parametricConfig?.rubrics || []).map((rubric) => [rubric.code, rubric]));
  const tableBody = defaultTableBody
    .filter((row) => {
      const rubric = rubricMap.get(row[0]);
      return !rubric || rubric.visible;
    })
    .map((row) => {
      const rubric = rubricMap.get(row[0]);
      return rubric ? [row[0], rubric.label, ...row.slice(2)] : row;
    });

  autoTable(doc, {
    startY: 90,
    head: [
      [
        { content: "N°", rowSpan: 2 },
        { content: "DÉSIGNATION DES RUBRIQUES", rowSpan: 2 },
        { content: "BASE", rowSpan: 2 },
        { content: "PART SALARIALE", colSpan: 3 },
        { content: "PART PATRONALE", colSpan: 2 },
      ],
      ["TAUX", "GAINS", "RETENUES", "TAUX", "RETENUES"],
    ],
    body: tableBody,
    theme: "plain",
    styles: { fontSize: layout?.fontSizes.table ?? 6.1, cellPadding: layout?.tableCellPadding ?? 0.35, minCellHeight: layout?.tableMinCellHeight ?? 4.4, lineWidth: 0 },
    headStyles: { fillColor: hexToRgbArray(layout?.tableHeaderBgColor || "#F5F5F5"), textColor: [45, 45, 45], fontStyle: "bold", halign: "center", fontSize: layout?.fontSizes.table ?? 6.1, cellPadding: layout?.tableCellPadding ?? 0.35, lineWidth: 0 },
    bodyStyles: { textColor: [45, 45, 45], fontSize: layout?.fontSizes.table ?? 6.1, cellPadding: layout?.tableCellPadding ?? 0.35, minCellHeight: layout?.tableMinCellHeight ?? 4.4, lineWidth: 0 },
    columnStyles: {
      0: { halign: "center", cellWidth: tableWidths[0] },
      1: { cellWidth: tableWidths[1] },
      2: { halign: "right", cellWidth: tableWidths[2] },
      3: { halign: "right", cellWidth: tableWidths[3] },
      4: { halign: "right", cellWidth: tableWidths[4] },
      5: { halign: "right", cellWidth: tableWidths[5] },
      6: { halign: "center", cellWidth: tableWidths[6] },
      7: { halign: "right", cellWidth: tableWidths[7] },
    },
    didParseCell: (data) => {
      if (data.section === "head" && [1, 2].includes(data.column.index)) {
        data.cell.styles.halign = "center";
      }
    },
    didDrawCell: (data) => {
      const { cell, column, section } = data;
      doc.setDrawColor(170, 170, 170);
      if (section === "head") {
        doc.setLineWidth(0.3);
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
      } else {
        doc.setLineWidth(0.12);
        if (column.index === 0) {
          doc.line(14, cell.y, 14, cell.y + cell.height);
        }
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
      }
    },
    didDrawPage: (data) => {
      if (layout?.showFooter ?? true) {
        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text(`Généré par PROGITPAIE RH — Page ${data.pageNumber} — Document confidentiel`, 14, doc.internal.pageSize.height - 8);
      }
    },
  });

  const finalTableY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 195;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.15);
  doc.line(14, finalTableY, doc.internal.pageSize.getWidth() - 14, finalTableY);

  autoTable(doc, {
    startY: finalTableY + 4,
    head: [["TOTAL GAINS BRUTS", "TOTAL RETENUES SALARIALES", "TOTAL CHARGES PATRONALES", "NET A PAYER SALARIÉ"]],
    body: [[`${money(totalGains)} ${currency?.symbol || "FCFA"}`, `${money(totalRetenuesSal)} ${currency?.symbol || "FCFA"}`, `${money(totalRetenuesPat)} ${currency?.symbol || "FCFA"}`, `${money(netAPayer)} ${currency?.symbol || "FCFA"}`]],
    theme: "plain",
    styles: { fontSize: 8, fontStyle: "bold", halign: "center", cellPadding: 2 },
    headStyles: { fillColor: [235, 238, 242], textColor: [40, 40, 40] },
    bodyStyles: { fillColor: [248, 249, 250], textColor: [20, 20, 20] },
  });

  let cumulsFinalY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || finalTableY + 30;
  if (layout?.showCumuls ?? true) {
    autoTable(doc, {
    startY: cumulsFinalY + 4,
    head: [["CUMUL BRUT FISCAL (ANNÉE)", "CUMUL NET IMPOSABLE (ANNÉE)", "CUMUL ITS PAYÉ", "CUMUL CNPS SALARIAL"]],
    body: [[`${money(options.cumulativeGrossThisYear)} ${currency?.symbol || "FCFA"}`, `${money(options.cumulativeNetThisYear)} ${currency?.symbol || "FCFA"}`, `${money(options.cumulativeItsThisYear)} ${currency?.symbol || "FCFA"}`, `${money(options.cumulativeCnpsThisYear)} ${currency?.symbol || "FCFA"}`]],
    theme: "plain",
    styles: { fontSize: 7, halign: "center", cellPadding: 1.5 },
    headStyles: { fillColor: hexToRgbArray(layout?.cumulTableBgColor || "#DCE0E6"), textColor: [50, 50, 50] },
    });
    cumulsFinalY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || cumulsFinalY;
  }

  const signatureY = ((doc as JsPdfWithAutoTable).lastAutoTable?.finalY || cumulsFinalY) + 2;
  if (layout?.showSignatures ?? true) {
    const signatureBox = layout?.signatureBoxSize || { width: 60, height: 10 };
    const signaturePositions = layout?.signaturePosition || { x1: 20, x2: 130 };
    doc.setFontSize(layout?.fontSizes.signature ?? 7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Signature de l'Employeur / Cachet :", signaturePositions.x1, signatureY);
    doc.text("Signature du Salarié :", signaturePositions.x2, signatureY);
    doc.rect(signaturePositions.x1, signatureY + 2, signatureBox.width, signatureBox.height, "S");
    doc.rect(signaturePositions.x2, signatureY + 2, signatureBox.width, signatureBox.height, "S");
    if (layout?.showLegalNotice ?? true) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 110, 110);
      const mentionText = cleanText(options.legalConfig.legalNotice || "Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.");
      doc.text(mentionText, 14, signatureY + signatureBox.height + 5);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
