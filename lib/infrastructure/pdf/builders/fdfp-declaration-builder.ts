/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder Déclaration FDFP (Infrastructure PDF)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Reconstruit la déclaration officielle FDFP (TAP & TFC) Côte d'Ivoire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { AbstractPDFDocumentBuilder } from "./abstract-pdf-builder";
import { drawPDFHeader } from "../components/pdf-header";
import { drawPDFCompanyInfo } from "../components/pdf-company-info";
import { drawPDFSignBlock } from "../components/pdf-sign-block";
import autoTable, { CellHookData } from "jspdf-autotable";

export interface FDFPDeclarationDataInput {
  month: number;
  year: number;
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  cnpsNumber: string;
  dgiLogoBase64?: string;
  fdfpData?: {
    totalGrossSalary?: number;
    taAmount?: number;
    tfcAmount?: number;
    totalFDFP?: number;
  };
}

export class FDFPDeclarationBuilder extends AbstractPDFDocumentBuilder {
  private data: FDFPDeclarationDataInput;
  private currentY: number = 14;

  constructor(data: FDFPDeclarationDataInput) {
    super();
    this.data = data;
  }

  public buildHeader(): this {
    const monthName = new Date(this.data.year, this.data.month - 1)
      .toLocaleString("fr-FR", { month: "long" })
      .toUpperCase();

    this.currentY = drawPDFHeader(this.doc, {
      type: "DGI",
      dgiLogoBase64: this.data.dgiLogoBase64,
      title: `DECLARATION FDFP - ${monthName} ${this.data.year}`,
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
    const fdfp = this.data.fdfpData || {};
    const gross = fdfp.totalGrossSalary || 4850000;
    const ta = fdfp.taAmount || Math.round(gross * 0.004);
    const tfc = fdfp.tfcAmount || Math.round(gross * 0.012);
    const total = ta + tfc;

    const tableRows = [
      ["Taxe d'Apprentissage (TAP)", gross.toLocaleString("fr-FR"), "0.40%", ta.toLocaleString("fr-FR")],
      ["Taxe de Formation Continue (TFC)", gross.toLocaleString("fr-FR"), "1.20%", tfc.toLocaleString("fr-FR")],
      ["TOTAL DES TAXES FDFP À PAYER", "", "", total.toLocaleString("fr-FR")],
    ];

    autoTable(this.doc, {
      startY: this.currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["NATURE DE LA TAXE FDFP", "BASE IMPOSABLE (FCFA)", "TAUX", "MONTANT DÛ (FCFA)"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "right", cellWidth: 37 },
      },
      didParseCell: (data: CellHookData) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [254, 215, 170];
        }
      },
    });

    this.currentY = this.getLastAutoTableY(this.currentY + 50);
    return this;
  }

  public buildFooter(): this {
    drawPDFSignBlock(this.doc, {
      startY: this.currentY + 8,
      showEmployerStamp: true,
      city: "Abidjan",
      noticeText: "Déclaration établie sous la responsabilité du redevable conformément au Code Général des Impôts.",
    });

    return this;
  }
}
