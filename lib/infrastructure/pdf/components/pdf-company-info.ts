/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Composant PDF : Bloc Info Contribuable (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { jsPDF } from "jspdf";

export interface PDFCompanyInfoOptions {
  name: string;
  address: string;
  taxNumber: string;
  cnpsNumber: string;
  rccm?: string;
  activity?: string;
  periodText: string;
  startY: number;
}

export function drawPDFCompanyInfo(doc: jsPDF, options: PDFCompanyInfoOptions): number {
  const { name, address, taxNumber, cnpsNumber, periodText, startY } = options;

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.rect(14, startY, 182, 16);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Raison Sociale : ${name}`, 18, startY + 5);
  doc.text(`N° Compte Contribuable (CC) : ${taxNumber}`, 110, startY + 5);

  doc.setFont("helvetica", "normal");
  doc.text(`Adresse : ${address}`, 18, startY + 11);
  doc.text(`N° CNPS : ${cnpsNumber}   |   Période : ${periodText}`, 110, startY + 11);

  return startY + 20;
}
