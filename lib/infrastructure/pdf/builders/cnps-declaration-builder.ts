/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder Déclaration CNPS (Infrastructure PDF)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Reconstruit la déclaration officielle d'Appel de Cotisations Mensuel CNPS.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { AbstractPDFDocumentBuilder } from "./abstract-pdf-builder";
import { drawPDFHeader } from "../components/pdf-header";
import { drawPDFCompanyInfo } from "../components/pdf-company-info";
import { drawPDFSignBlock } from "../components/pdf-sign-block";
import autoTable from "jspdf-autotable";

export interface CNPSDeclarationDataInput {
  month: number;
  year: number;
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  cnpsNumber: string;
  cnpsLogoBase64?: string;
  cnpsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    cnpsEmployeeTotal?: number;
    cnpsEmployerTotal?: number;
    totalCNPSToPay?: number;
  };
}

export class CNPSDeclarationBuilder extends AbstractPDFDocumentBuilder {
  private data: CNPSDeclarationDataInput;
  private currentY: number = 14;

  constructor(data: CNPSDeclarationDataInput) {
    super();
    this.data = data;
  }

  public buildHeader(): this {
    const monthName = new Date(this.data.year, this.data.month - 1)
      .toLocaleString("fr-FR", { month: "long" })
      .toUpperCase();

    this.currentY = drawPDFHeader(this.doc, {
      type: "CNPS",
      cnpsLogoBase64: this.data.cnpsLogoBase64,
      title: `APPEL DE COTISATIONS CNPS - ${monthName} ${this.data.year}`,
    });

    return this;
  }

  public buildCompanyInfo(): this {
    const monthName = new Date(this.data.year, this.data.month - 1).toLocaleString("fr-FR", { month: "long" });

    this.currentY = drawPDFCompanyInfo(this.doc, {
      name: this.data.companyName,
      address: this.data.companyAddress,
      taxNumber: this.data.taxNumber,
      cnpsNumber: this.data.cnpsNumber,
      periodText: `${monthName} ${this.data.year}`,
      startY: this.currentY,
    });

    return this;
  }

  public buildBody(): this {
    const cnps = this.data.cnpsData || {};
    const empCount = cnps.totalEmployees || 12;
    const gross = cnps.totalGrossSalary || 4850000;

    const salRetraite = cnps.cnpsEmployeeTotal || Math.round(gross * 0.063);
    const patRetraite = Math.round(gross * 0.077);
    const patPF = Math.round(Math.min(gross, 70000 * empCount) * 0.0575);
    const patAT = Math.round(Math.min(gross, 70000 * empCount) * 0.03);

    const totalSal = salRetraite;
    const totalPat = patRetraite + patPF + patAT;
    const totalCotis = totalSal + totalPat;

    const tableRows = [
      ["Régime Général de Retraite", `${empCount}`, gross.toLocaleString("fr-FR"), "6.30%", salRetraite.toLocaleString("fr-FR"), "7.70%", patRetraite.toLocaleString("fr-FR"), (salRetraite + patRetraite).toLocaleString("fr-FR")],
      ["Prestations Familiales (PF)", `${empCount}`, (70000 * empCount).toLocaleString("fr-FR"), "-", "0", "5.75%", patPF.toLocaleString("fr-FR"), patPF.toLocaleString("fr-FR")],
      ["Accidents du Travail (AT)", `${empCount}`, (70000 * empCount).toLocaleString("fr-FR"), "-", "0", "3.00%", patAT.toLocaleString("fr-FR"), patAT.toLocaleString("fr-FR")],
      ["TOTAL DES COTISATIONS CNPS", "", "", "", totalSal.toLocaleString("fr-FR"), "", totalPat.toLocaleString("fr-FR"), totalCotis.toLocaleString("fr-FR")],
    ];

    autoTable(this.doc, {
      startY: this.currentY + 2,
      margin: { left: 14, right: 14 },
      head: [
        [
          { content: "BRANCHE / REGIME", rowSpan: 2 },
          { content: "NBRE SALARIES", rowSpan: 2 },
          { content: "BASE (FCFA)", rowSpan: 2 },
          { content: "PART SALARIALE", colSpan: 2 },
          { content: "PART PATRONALE", colSpan: 2 },
          { content: "TOTAL DÛ (FCFA)", rowSpan: 2 },
        ],
        ["TAUX", "MONTANT", "TAUX", "MONTANT"],
      ],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5, halign: "center" },
      headStyles: { fillColor: [3, 105, 161], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { halign: "left", cellWidth: 50 },
        1: { cellWidth: 16 },
        2: { halign: "right", cellWidth: 28 },
        3: { cellWidth: 14 },
        4: { halign: "right", cellWidth: 20 },
        5: { cellWidth: 14 },
        6: { halign: "right", cellWidth: 20 },
        7: { halign: "right", cellWidth: 20 },
      },
      didParseCell: (data: any) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [224, 242, 254];
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable?.finalY || (this.currentY + 60);
    return this;
  }

  public buildFooter(): this {
    drawPDFSignBlock(this.doc, {
      startY: this.currentY + 8,
      showEmployerStamp: true,
      city: "Abidjan",
      noticeText: "Certifié exact et à verser à la Caisse Nationale de Prévoyance Sociale avant le 15 du mois suivant.",
    });

    return this;
  }
}
