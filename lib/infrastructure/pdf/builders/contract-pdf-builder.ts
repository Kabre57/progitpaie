/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder PDF Contrat de Travail & Actes RH (Infrastructure PDF) 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Génère un document PDF A4 haute définition élégant et structuré pour
 * les contrats de travail (CDI, CDD, Stage) avec gestion dynamique des articles.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { jsPDF } from "jspdf";

export interface ContractArticleInput {
  title: string;
  content: string;
}

export interface ContractPDFInput {
  companyName: string;
  companyAddress: string;
  companyRepresentative?: string;
  employeeName: string;
  employeeBirth?: string;
  employeeNationality?: string;
  employeeCni?: string;
  employeeAddress?: string;
  jobTitle: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  articles: ContractArticleInput[];
}

export class ContractPDFBuilder {
  public static generatePDF(input: ContractPDFInput): Buffer {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 15;

    // Helper Saut de page automatique si besoin
    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 15;
        // Petit rappel d'en-tête sur les pages secondaires
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Contrat de travail - ${input.employeeName} (${input.companyName})`, margin, currentY);
        currentY += 8;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 6;
      }
    };

    // 1. EN-TÊTE DE LA SOCIÉTÉ
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text(input.companyName.toUpperCase(), margin, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(input.companyAddress, margin, currentY);

    currentY += 6;
    doc.setDrawColor(102, 108, 255); // #666cff accent bar
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // 2. TITRE PRINCIPAL DU CONTRAT
    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    const docTitle = `CONTRAT DE TRAVAIL A DUREE ${input.contractType === "CDD" ? "DETERMINEE (CDD)" : "INDETERMINEE (CDI)"}`;
    doc.text(docTitle, pageWidth / 2, currentY, { align: "center" });

    currentY += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Conforme au Code du Travail de la République de Côte d'Ivoire (Loi N° 2015-532)", pageWidth / 2, currentY, { align: "center" });

    // 3. BLOC DES PARTIES CONTRATANTES
    currentY += 8;
    checkPageBreak(40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ENTRE LES SOUSSIGNÉS :", margin, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const empRep = (input.companyRepresentative && input.companyRepresentative.trim()) || "la Direction Générale";
    const compAddr = input.companyAddress ? `, sise à ${input.companyAddress}` : "";
    const party1Main = `1. L'entité dénommée ${input.companyName}${compAddr}, représentée par ${empRep}, ci-après désignée "L'Employeur",`;
    const party1Lines = doc.splitTextToSize(party1Main, contentWidth) as string[];
    doc.text(party1Lines, margin, currentY);
    currentY += party1Lines.length * 4.5;

    doc.setFont("helvetica", "bold");
    doc.text("D'une part,", pageWidth - margin, currentY, { align: "right" });
    currentY += 6;

    doc.setFont("helvetica", "bold");
    doc.text("ET :", margin, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    const empDetailsParts: string[] = [];
    if (input.employeeBirth && input.employeeBirth.trim()) {
      empDetailsParts.push(`né(e) le ${input.employeeBirth.trim()}`);
    }
    if (input.employeeNationality && input.employeeNationality.trim()) {
      empDetailsParts.push(`de nationalité ${input.employeeNationality.trim()}`);
    }
    if (input.employeeCni && input.employeeCni.trim()) {
      empDetailsParts.push(`CNI N° ${input.employeeCni.trim()}`);
    }
    if (input.employeeAddress && input.employeeAddress.trim()) {
      empDetailsParts.push(`demeurant à ${input.employeeAddress.trim()}`);
    }
    const empDetails = empDetailsParts.length > 0 ? `, ${empDetailsParts.join(", ")}` : "";
    const party2Main = `2. M. / Mme ${input.employeeName}${empDetails}, ci-après désigné(e) "Le Salarié",`;
    const party2Lines = doc.splitTextToSize(party2Main, contentWidth) as string[];
    doc.text(party2Lines, margin, currentY);
    currentY += party2Lines.length * 4.5;

    doc.setFont("helvetica", "bold");
    doc.text("D'autre part,", pageWidth - margin, currentY, { align: "right" });
    currentY += 8;

    doc.setFont("helvetica", "bold");
    doc.text("IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :", margin, currentY);
    currentY += 7;

    // 4. BOUCLE D'IMPRESSION DYNAMIQUE DES ARTICLES
    input.articles.forEach((art) => {
      const title = art.title.trim();
      const content = art.content.trim();
      if (!title && !content) return;

      const contentLines = doc.splitTextToSize(content, contentWidth) as string[];
      const blockHeight = 6 + contentLines.length * 4.5 + 4;

      checkPageBreak(blockHeight);

      // Titre de l'article (ex: Article 1er)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, currentY);
      currentY += 5;

      // Corps de l'article
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(contentLines, margin, currentY, { maxWidth: contentWidth });
      currentY += contentLines.length * 4.5 + 5;
    });

    // 5. SIGNATURES & PIED DE PAGE JURIDIQUE
    checkPageBreak(40);
    currentY += 4;

    const dateStr = new Date().toLocaleDateString("fr-FR");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Fait à Abidjan, en deux (2) exemplaires originaux, le ${dateStr}.`, margin, currentY);

    currentY += 10;
    const colWidth = (contentWidth - 10) / 2;

    // Bloc Gauche: Employeur
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("POUR L'EMPLOYEUR", margin + colWidth / 2, currentY, { align: "center" });

    // Bloc Droit: Salarié
    doc.text("LE SALARIÉ", margin + colWidth + 5 + colWidth / 2, currentY, { align: "center" });

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("(Noms, cachets et signatures)", margin + colWidth / 2, currentY, { align: "center" });
    doc.text(`(Mention "Lu et approuvé" + signature)\n\n${input.employeeName}`, margin + colWidth + 5 + colWidth / 2, currentY, { align: "center" });

    return Buffer.from(doc.output("arraybuffer"));
  }
}
