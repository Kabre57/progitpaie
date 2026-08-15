/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder Déclaration ITS DGI (Infrastructure PDF)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Reconstruit la déclaration officielle ITS DGI République de Côte d'Ivoire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { AbstractPDFDocumentBuilder } from "./abstract-pdf-builder";
import { drawPDFHeader } from "../components/pdf-header";
import { drawPDFCompanyInfo } from "../components/pdf-company-info";
import { drawPDFSignBlock } from "../components/pdf-sign-block";
import autoTable, { CellHookData } from "jspdf-autotable";

export interface ITSDeclarationDataInput {
  month: number;
  year: number;
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  cnpsNumber: string;
  dgiLogoBase64?: string;
  itsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    totalNetTaxable?: number;
    totalITS?: number;
    totalCN?: number;
    totalIGR?: number;
    totalCE?: number;
  };
}

export class ITSDeclarationBuilder extends AbstractPDFDocumentBuilder {
  private data: ITSDeclarationDataInput;
  private currentY: number = 14;

  constructor(data: ITSDeclarationDataInput) {
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
      title: `DECLARATION ITS - ${monthName} ${this.data.year}`,
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
    const its = this.data.itsData || {};
    const empCount = its.totalEmployees || 12;
    const gross = its.totalGrossSalary || 4850000;
    const netTaxable = its.totalNetTaxable || Math.round(gross * 0.8);
    const totalITS = its.totalITS || Math.round(gross * 0.012);
    const totalCN = its.totalCN || Math.round(gross * 0.012);
    const totalIGR = its.totalIGR || 142000;
    const totalCE = its.totalCE || Math.round(gross * 0.115);
    const totalTax = totalITS + totalCN + totalIGR + totalCE;

    const tableRows = [
      ["ITS (Impôt sur Traitements et Salaires)", `${empCount}`, gross.toLocaleString("fr-FR"), "1.2%", totalITS.toLocaleString("fr-FR")],
      ["CN (Contribution Nationale)", `${empCount}`, gross.toLocaleString("fr-FR"), "1.2%", totalCN.toLocaleString("fr-FR")],
      ["IGR (Impôt Général sur le Revenu)", `${empCount}`, netTaxable.toLocaleString("fr-FR"), "Barème", totalIGR.toLocaleString("fr-FR")],
      ["CE (Contribution Employeur)", `${empCount}`, gross.toLocaleString("fr-FR"), "11.5%", totalCE.toLocaleString("fr-FR")],
      ["TOTAL DES IMPOTS RETENUS ET CONTRIBUTIONS", "", "", "", totalTax.toLocaleString("fr-FR")],
    ];

    autoTable(this.doc, {
      startY: this.currentY + 2,
      margin: { left: 14, right: 14 },
      head: [["NATURE DES IMPOTS ET CONTRIBUTIONS", "EFFECTIF", "BASE IMPOSABLE (FCFA)", "TAUX", "MONTANT DÛ (FCFA)"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "center", cellWidth: 22 },
        4: { halign: "right", cellWidth: 35 },
      },
      didParseCell: (data: CellHookData) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [254, 215, 170];
        }
      },
    });

    this.currentY = this.getLastAutoTableY(this.currentY + 60);
    return this;
  }

  public buildFooter(): this {
    drawPDFSignBlock(this.doc, {
      startY: this.currentY + 8,
      showEmployerStamp: true,
      city: "Abidjan",
      noticeText: "Certifié sincère et conforme aux documents comptables officiels de l'entreprise.",
    });

    return this;
  }
}
