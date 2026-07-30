/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Composant PDF : En-tête Officiel (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Dessine les en-têtes réglementaires :
 *   - En-tête officiel DGI (République de Côte d'Ivoire / Direction Générale des Impôts)
 *   - En-tête officiel CNPS (Caisse Nationale de Prévoyance Sociale)
 *   - En-tête Entreprise avec logo dynamique
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface PDFHeaderOptions {
  type: "DGI" | "CNPS" | "COMPANY";
  companyName?: string;
  companyAddress?: string;
  companyRccm?: string;
  companyCc?: string;
  companyCnps?: string;
  logoBase64?: string;
  dgiLogoBase64?: string;
  cnpsLogoBase64?: string;
  title?: string;
  subtitle?: string;
}

export function drawPDFHeader(doc: any, options: PDFHeaderOptions): number {
  if (options.type === "DGI") {
    // Logo DGI si disponible
    if (options.dgiLogoBase64) {
      try {
        doc.addImage(options.dgiLogoBase64, "PNG", 14, 11, 20, 20);
      } catch (e) {
        /* fallback silencieux */
      }
    }

    const headerX = options.dgiLogoBase64 ? 38 : 14;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("REPUBLIQUE DE COTE D'IVOIRE", headerX, 15);
    doc.setFont("helvetica", "normal");
    doc.text("MINISTERE DU BUDGET ET DU PORTEFEUILLE DE L'ETAT", headerX, 19);
    doc.text("DIRECTION GENERALE DES IMPOTS", headerX, 23);

    // Titre au centre/droite
    if (options.title) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(options.title, 196, 18, { align: "right" });
    }

    return 35; // Retourne le Y suivant
  }

  if (options.type === "CNPS") {
    if (options.cnpsLogoBase64) {
      try {
        doc.addImage(options.cnpsLogoBase64, "JPEG", 16, 12, 16, 16);
      } catch (e) {
        /* fallback */
      }
    }

    const headerX = options.cnpsLogoBase64 ? 36 : 14;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("CNPS", headerX, 18);
    doc.setFontSize(6.5);
    doc.text("CAISSE NATIONALE DE PREVOYANCE SOCIALE", headerX, 23);

    if (options.title) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(options.title, 196, 18, { align: "right" });
    }

    return 32;
  }

  // Fallback: COMPANY Header
  let yOffset = 0;
  if (options.logoBase64) {
    try {
      doc.addImage(options.logoBase64, "PNG", 14, 6, 25, 9);
      yOffset = 5;
    } catch (e) {
      /* fallback */
    }
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text((options.companyName || "LOGIPAIE RH").toUpperCase(), 14, 14 + yOffset);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${options.companyAddress || "ABIDJAN COTE D'IVOIRE"}`, 14, 18 + yOffset);
  if (options.companyRccm || options.companyCc) {
    doc.text(`N°RCCM : ${options.companyRccm || "-"}    N°CC : ${options.companyCc || "-"}`, 14, 22 + yOffset);
  }

  if (options.title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(options.title, 196, 15, { align: "right" });
  }

  return 38 + yOffset;
}
