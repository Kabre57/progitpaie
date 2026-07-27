import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function cleanText(str: string): string {
  if (!str) return "";
  return str
    .replace(/—/g, "-")
    .replace(/’/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fmtNum(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Affiche un texte multi-paragraphes avec un alignement propre et régulier (sans étirement artificiel des mots)
 */
function renderParagraph(
  doc: any,
  text: string,
  x: number,
  startY: number,
  maxWidth: number = 170,
  fontSize: number = 10,
  lineHeight: number = 6
): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);

  const paragraphs = text.split("\n");
  let currentY = startY;

  for (const para of paragraphs) {
    if (!para.trim()) {
      currentY += lineHeight * 0.8;
      continue;
    }
    const lines = doc.splitTextToSize(para.trim(), maxWidth);
    for (const line of lines) {
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }
    currentY += 2; // Espacement léger entre paragraphes
  }
  return currentY;
}

// POST /api/documents/generate - Générer un document PDF officiel avec en-tête dynamique
export async function POST(
  request: NextRequest
): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { 
      userId, 
      docType,
      customName,
      customJobTitle,
      customBodyText,
      customDate,
      startDate,
      endDate,
      returnDate,
      bankName,
      totalAmount,
      month,
      year,
      itsData,
      cnpsData,
    } = body;

    // Récupération des paramètres d'entreprise depuis la base de données Settings
    const [companyInfoDoc, companyDoc] = await Promise.all([
      prisma.settings.findUnique({ where: { key: "company_info" } }),
      prisma.settings.findUnique({ where: { key: "company" } }),
    ]);

    const compSettings = (companyInfoDoc?.value as any) || (companyDoc?.value as any) || {};
    const companyName = cleanText(compSettings.name || compSettings.companyName || "PROGI PAIE");
    const legalForm = cleanText(compSettings.legalForm || "SARL");
    const address = cleanText(compSettings.address || "01 BP 1115 ABIDJAN 01");
    const city = cleanText(compSettings.city || "ABIDJAN");
    const phone = cleanText(compSettings.phone || "0709470671");
    const email = cleanText(compSettings.email || "erickourai17@gmail.com");
    const rccm = cleanText(compSettings.rccm || "CI-ABJ-2000-A 451");
    const cc = cleanText(compSettings.taxNumber || "1234567 A");
    const cnps = cleanText(compSettings.cnpsNumber || "123456");

    const doc = new jsPDF() as any;
    const dateStr = cleanText(customDate || new Date().toLocaleDateString("fr-FR"));

    const targetUserId = typeof userId === "object" ? (userId?.id || userId?._id) : userId;
    const user = targetUserId ? await prisma.user.findUnique({ where: { id: targetUserId } }) : null;

    // Informations complètes de l'état civil de l'employé
    const civility = cleanText(user?.civility || "M.");
    const userName = cleanText(customName || user?.name || "L'EMPLOYE");
    const jobTitle = cleanText(customJobTitle || user?.jobTitle || "Collaborateur");
    const empId = cleanText(user?.employeeId || "EMP-001");
    const joiningStr = user?.joiningDate ? cleanText(new Date(user.joiningDate).toLocaleDateString("fr-FR")) : dateStr;
    const birthDateStr = user?.birthDate ? cleanText(new Date(user.birthDate).toLocaleDateString("fr-FR")) : "";
    const birthPlaceStr = user?.birthPlace ? cleanText(user.birthPlace) : "";
    const empAddress = user?.address ? cleanText(user.address) : city;

    let birthText = "";
    if (birthDateStr) {
      birthText = `ne(e) le ${birthDateStr}${birthPlaceStr ? ` a ${birthPlaceStr}` : ""}, `;
    }

    // En-tête dynamique officiel aux normes DGI / CNPS CI
    doc.setFillColor(30, 58, 95);
    doc.rect(14, 12, 182, 3, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(`${companyName} ${legalForm ? `(${legalForm})` : ""}`.toUpperCase(), 14, 23);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${companyName} • ${address} - ${city} • Tél: ${phone} • Email: ${email}`, 14, 28);
    doc.text(`N° CC : ${cc} • N° RCCM : ${rccm} • N° CNPS : ${cnps}`, 14, 33);
    doc.line(14, 36, 196, 36);

    if (docType === "contract") {
      doc.setFontSize(15);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRAT DE TRAVAIL OFFICIEL", 60, 48);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Entre les soussignes :`, 14, 60);
      doc.setFont("helvetica", "bold");
      doc.text(`1. La Societe ${companyName}, representee par la Direction Generale, ci-apres "l'Employeur".`, 14, 67);
      
      const line2Text = `2. ${civility} ${userName}, ${birthText}residant(e) a ${empAddress}, ci-apres "le Salarie".`;
      doc.text(line2Text, 14, 74, { maxWidth: 170 });

      doc.setFont("helvetica", "normal");
      doc.text("Il a ete convenu et arrete ce qui suit :", 14, 85);

      const contractBody = customBodyText ? cleanText(customBodyText) : `Article 1er : ${civility} ${userName} est engage(e) en qualite de ${jobTitle}.\n\nArticle 2 : Le present contrat est regi par le Code du Travail de Cote d'Ivoire.`;
      
      const finalY = renderParagraph(doc, contractBody, 14, 95, 170, 10, 6);

      const signY = Math.max(finalY + 15, 220);
      doc.setFontSize(9);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, signY);
      doc.setFont("helvetica", "bold");
      doc.text("LE SALARIE", 30, signY + 10);
      doc.text("POUR L'EMPLOYEUR", 130, signY + 10);

    } else if (docType === "attestation") {
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("ATTESTATION DE TRAVAIL", 65, 52);

      const bodyStr = customBodyText ? cleanText(customBodyText) : `Nous soussignes, la Direction Generale de ${companyName}, attestons par la presente que ${civility} ${userName} (Matricule ${empId}), ${birthText}est employe(e) au sein de notre entreprise en qualite de ${jobTitle} depuis le ${joiningStr}.\n\nCette attestation lui est delivree pour servir et valoir ce que de droit.`;

      renderParagraph(doc, bodyStr, 14, 75, 170, 10, 6);

      doc.setFontSize(9);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, 160);
      doc.setFont("helvetica", "bold");
      doc.text("LA DIRECTION GENERALE", 125, 170);

    } else if (docType === "certificat") {
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICAT DE TRAVAIL", 65, 52);

      const bodyStr = customBodyText ? cleanText(customBodyText) : `Nous soussignes, la Direction Generale de ${companyName}, certifions que ${civility} ${userName} (Matricule ${empId}), ${birthText}a ete employe(e) dans notre entreprise du ${joiningStr} au ${dateStr} en qualite de ${jobTitle}.\n\n${civility} ${userName} quitte notre societe libre de tout engagement.`;

      renderParagraph(doc, bodyStr, 14, 75, 170, 10, 6);

      doc.setFontSize(9);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, 160);
      doc.setFont("helvetica", "bold");
      doc.text("LA DIRECTION GENERALE", 125, 170);

    } else if (docType === "attestation_conge") {
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("ATTESTATION DE CONGE PAYE", 60, 52);

      const sDate = cleanText(startDate || dateStr);
      const eDate = cleanText(endDate || dateStr);
      const rDate = cleanText(returnDate || dateStr);

      const bodyStr = customBodyText ? cleanText(customBodyText) : `Nous soussignes, la Direction Generale de ${companyName}, attestons que ${civility} ${userName} (Matricule ${empId}), occupant le poste de ${jobTitle}, est autorise(e) a prendre ses conges payes du ${sDate} au ${eDate}.\n\nLa reprise du travail est fixee au ${rDate} a 08 heures 00.`;

      renderParagraph(doc, bodyStr, 14, 75, 170, 10, 6);

      doc.setFontSize(9);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, 160);
      doc.setFont("helvetica", "bold");
      doc.text("LA DIRECTION GENERALE", 125, 170);

    } else if (docType === "ordre_virement") {
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.setFont("helvetica", "bold");
      doc.text("A L'ATTENTION DE :", 120, 48);

      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`MONSIEUR LE DIRECTEUR DE LA BANQUE`, 120, 56);
      doc.text(cleanText(bankName || "SOCIETE GENERALE CI"), 120, 63);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${city}, le ${dateStr}`, 120, 76);
      doc.text(`N/Ref. : 001/LOG/SAL/${year || 2026}`, 14, 76);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Objet : Ordre de virement des salaires", 14, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Monsieur,", 14, 103);

      const mName = month ? cleanText(new Date(2026, month - 1).toLocaleString("fr-FR", { month: "long" })) : "du mois";
      const mainText = `Par la presente, nous vous prions de bien vouloir effectuer par le debit de notre compte le virement des salaires du mois de ${mName.toUpperCase()} ${year || 2026} pour un montant total de :`;
      doc.text(mainText, 14, 116, { maxWidth: 170 });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(245, 247, 250);
      doc.rect(14, 133, 182, 16, "F");
      doc.text(`MONTANT TOTAL A VIRER : ${fmtNum(totalAmount)} FCFA`, 20, 144);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("P.J. : Liste nominative des salaires a virer avec RIB.", 14, 165);
      doc.text("Vous en souhaitant bonne reception, veuillez agreer, Monsieur, nos sinceres salutations.", 14, 175, { maxWidth: 170 });

      doc.setFont("helvetica", "bold");
      doc.text("La Direction Generale", 130, 205);

    } else if (docType === "declaration_its") {
      doc.setFillColor(234, 88, 12);
      doc.rect(14, 45, 182, 12, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("DIRECTION GENERALE DES IMPOTS (DGI COTE D'IVOIRE)", 30, 53);

      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text("DECLARATION DES IMPOTS SUR LES TRAITEMENTS ET SALAIRES (ITS)", 22, 66);

      doc.setDrawColor(200, 200, 200);
      doc.rect(14, 72, 182, 30);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`CONTRIBUABLE : ${companyName}`, 18, 80);
      doc.text(`N° COMPTE CONTRIBUABLE (NCC) : ${cc}`, 120, 80);
      doc.text(`PERIODE D'IMPOSITION : ${month || 1}/${year || 2026}`, 18, 88);
      doc.text("REGIME : REEL NORMAL", 120, 88);

      const items = [
        ["Nombre de Salaries en Effectif", `${itsData?.totalEmployees || 0}`],
        ["Masse Salariale Brute Totale", `${fmtNum(itsData?.totalGrossSalary)} FCFA`],
        ["IS (Impôt sur Salaire 1.2%)", `${fmtNum(itsData?.totalITS)} FCFA`],
        ["IGR (Impôt General sur le Revenu)", `${fmtNum(itsData?.totalIGR)} FCFA`],
        ["Contribution Employeur CE (11.50%)", `${fmtNum(itsData?.totalCE)} FCFA`],
      ];

      autoTable(doc, {
        startY: 108,
        head: [["NATURE DES IMPOTS ET CONTRIBUTIONS FISCALES DGI", "MONTANT (FCFA)"]],
        body: items,
        theme: "striped",
        headStyles: { fillColor: [234, 88, 12] },
        styles: { fontSize: 9 },
      });

      const finalY = doc.lastAutoTable?.finalY || 170;

      doc.setFillColor(30, 58, 95);
      doc.rect(14, finalY + 8, 182, 18, "F");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL NET IMPOTS DGI A PAYER : ${fmtNum(itsData?.totalTaxToPay)} FCFA`, 20, finalY + 20);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, finalY + 38);
      doc.setFont("helvetica", "bold");
      doc.text("CACHE ET SIGNATURE DU CONTRIBUABLE", 110, finalY + 46);

    } else if (docType === "declaration_fdfp") {
      doc.setFillColor(16, 185, 129);
      doc.rect(14, 45, 182, 12, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("DECLARATION MENSUELLE FDFP (25-DECLARATION FDFP)", 30, 53);

      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text("TAXE DE FORMATION CONTINUE & APPRENTISSAGE (FDFP)", 20, 66);

      const gross = itsData?.totalGrossSalary || 0;
      const tfc = Math.round(gross * 0.012);
      const tap = Math.round(gross * 0.004);

      const fdfpItems = [
        ["Masse Salariale Brute Soumise a FDFP", `${fmtNum(gross)} FCFA`],
        ["Taxe de Formation Continue - TFC (1.20%)", `${fmtNum(tfc)} FCFA`],
        ["Taxe d'Apprentissage - TAP (0.40%)", `${fmtNum(tap)} FCFA`],
        ["TOTAL A PAYER FDFP (1.60%)", `${fmtNum(tfc + tap)} FCFA`],
      ];

      autoTable(doc, {
        startY: 80,
        head: [["RUBRIQUE TAXES ET CONTRIBUTIONS FDFP", "MONTANT (FCFA)"]],
        body: fdfpItems,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 },
      });

      const finalY = doc.lastAutoTable?.finalY || 140;
      doc.setFontSize(9);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, finalY + 20);

    } else if (docType === "declaration_cnps") {
      doc.setFillColor(14, 165, 233);
      doc.rect(14, 45, 182, 12, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("CNPS - APPEL DE COTISATION MENSUEL (27-DECLARATION CNPS)", 20, 53);

      const cnpsItems = [
        ["Nombre d'Assures en Effectif", `${cnpsData?.totalEmployees || 0}`],
        ["Salaires Soumis a Cotisations CNPS", `${fmtNum(cnpsData?.totalGrossSalary)} FCFA`],
        ["Cotisation Retraite Part Salariee (6.30%)", `${fmtNum(cnpsData?.cnpsEmployeeTotal)} FCFA`],
        ["Cotisation Retraite Part Patronale (7.70%)", `${fmtNum(cnpsData?.cnpsEmployerTotal)} FCFA`],
        ["Prestations Familiales PF (5.75%)", `${fmtNum((cnpsData?.totalGrossSalary || 0) * 0.0575)} FCFA`],
        ["Accidents du Travail AT (3.00%)", `${fmtNum((cnpsData?.totalGrossSalary || 0) * 0.03)} FCFA`],
      ];

      autoTable(doc, {
        startY: 70,
        head: [["COTISATIONS ET PRESTATIONS CNPS", "MONTANT (FCFA)"]],
        body: cnpsItems,
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 9 },
      });

      const finalY = doc.lastAutoTable?.finalY || 150;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL CHEQUE CNPS A VERSER : ${fmtNum(cnpsData?.totalCNPSToPay)} FCFA`, 14, finalY + 15);

    } else {
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("DOCUMENT RH OFFICIEL LOGIPAIE", 55, 52);

      const bodyStr = customBodyText ? cleanText(customBodyText) : `Document RH delivre pour ${civility} ${userName} en date du ${dateStr}.`;
      renderParagraph(doc, bodyStr, 14, 75, 170, 10, 6);
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `${docType}-${Date.now()}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Generate document error details:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate document",
      },
      { status: 500 }
    );
  }
}
