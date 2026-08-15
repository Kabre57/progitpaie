/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Composant PDF : Bloc Signature & Cachet (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { jsPDF } from "jspdf";

export interface PDFSignBlockOptions {
  startY: number;
  showEmployerStamp?: boolean;
  showEmployeeSignature?: boolean;
  city?: string;
  dateStr?: string;
  noticeText?: string;
}

export function drawPDFSignBlock(doc: jsPDF, options: PDFSignBlockOptions): number {
  let y = options.startY;

  if (options.city || options.dateStr) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const locationStr = `Fait à ${options.city || "Abidjan"}, le ${options.dateStr || new Date().toLocaleDateString("fr-FR")}`;
    doc.text(locationStr, 196, y, { align: "right" });
    y += 6;
  }

  if (options.showEmployerStamp || options.showEmployeeSignature) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);

    if (options.showEmployerStamp) {
      doc.text("Signature & Tampon Employeur", 14, y);
      doc.rect(14, y + 2, 60, 14);
    }

    if (options.showEmployeeSignature) {
      doc.text("Émargement Salarié", 136, y);
      doc.rect(136, y + 2, 60, 14);
    }

    y += 20;
  }

  if (options.noticeText) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(options.noticeText, 105, y, { align: "center" });
    y += 6;
  }

  return y;
}
