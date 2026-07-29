import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { decryptData } from "@/lib/crypto";
import { RateService } from "@/lib/rate-service";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import { DEFAULT_PAYSLIP_APPEARANCE, DEFAULT_PAYSLIP_LEGAL } from "@/lib/payslip-config";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 187, g: 215, b: 149 }; // fallback vert LOGIPAIE
}

function cleanText(str: string): string {
  if (!str) return "";
  return str
    .replace(/—/g, "-")
    .replace(/’/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fmtNum(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "";
  if (num === 0) return "";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtNumZero(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

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
    currentY += 2;
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
    const [companyInfoDoc, companyDoc, ratesDoc, otherParamsDoc] = await Promise.all([
      prisma.settings.findUnique({ where: { key: "company_info" } }),
      prisma.settings.findUnique({ where: { key: "company" } }),
      prisma.settings.findUnique({ where: { key: "tax_rates" } }),
      prisma.settings.findUnique({ where: { key: "other_params" } }),
    ]);

    const compSettings = (companyInfoDoc?.value as any) || (companyDoc?.value as any) || {};
    const companyName = cleanText(compSettings.name || compSettings.companyName || "LOGIPAIE RH 21");
    const legalForm = cleanText(compSettings.legalForm || "SARL");
    const address = cleanText(compSettings.address || "BP 5115 ABIDJAN 01");
    const city = cleanText(compSettings.city || "ABIDJAN");
    const phone = cleanText(compSettings.phone || "0709470671");
    const email = cleanText(compSettings.email || "erickourai17@gmail.com");
    const rccm = cleanText(compSettings.rccm || "CI-ABJ-3000-A 451");
    const cc = cleanText(compSettings.taxNumber || "1234567 A");
    const cnps = cleanText(compSettings.cnpsNumber || "123456");

    const doc = new jsPDF() as any;
    const dateStr = cleanText(customDate || new Date().toLocaleDateString("fr-FR"));

    const targetUserId = typeof userId === "object" ? (userId?.id || userId?._id) : userId;
    const user = targetUserId ? await prisma.user.findUnique({ where: { id: targetUserId }, include: { department: true } }) : null;

    const civility = cleanText(user?.civility || "M.");
    const userName = cleanText(customName || user?.name || "KOUASSI Joseph Eric");
    const jobTitle = cleanText(customJobTitle || user?.jobTitle || "Comptable");
    const empId = cleanText(user?.employeeId || "001");
    const joiningStr = user?.joiningDate ? cleanText(new Date(user.joiningDate).toLocaleDateString("fr-FR")) : "01/02/2020";
    const birthDateStr = user?.birthDate ? cleanText(new Date(user.birthDate).toLocaleDateString("fr-FR")) : "";
    const birthPlaceStr = user?.birthPlace ? cleanText(user.birthPlace) : "";
    const empAddress = user?.address ? cleanText(user.address) : "BP 5115 ABIDJAN 01";

    let birthText = "";
    if (birthDateStr) {
      birthText = `ne(e) le ${birthDateStr}${birthPlaceStr ? ` a ${birthPlaceStr}` : ""}, `;
    }

    // SI DOCTYPE est PAYSLIP ou BULLETIN : GÉNÉRATION CONFORME À LA CAPTURE 1 LOGIPAIE RH
    if (docType === "payslip" || docType === "bulletin") {
      const pMonth = month || new Date().getMonth() + 1;
      const pYear = year || new Date().getFullYear();

      const payroll = targetUserId ? await prisma.payroll.findUnique({
        where: {
          userId_month_year: {
            userId: targetUserId,
            month: pMonth,
            year: pYear,
          },
        },
      }) : null;

      const monthName = cleanText(new Date(pYear, pMonth - 1).toLocaleString("fr-FR", { month: "long" }));
      
      const configService = PayslipConfigService.getInstance();
      let appearanceConfig = DEFAULT_PAYSLIP_APPEARANCE;
      let legalConfig = DEFAULT_PAYSLIP_LEGAL;
      let rates = await RateService.getInstance().getRates();

      if (payroll?.configSnapshotId) {
        const snapshotData = await configService.getConfigFromSnapshot(payroll.configSnapshotId);
        if (snapshotData) {
          appearanceConfig = snapshotData.appearance;
          legalConfig = snapshotData.legal;
          rates = snapshotData.rates;
        }
      } else {
        const [appConf, legConf] = await Promise.all([
          configService.getAppearance(),
          configService.getLegal(),
        ]);
        appearanceConfig = appConf;
        legalConfig = legConf;
      }

      const cnpsEmployeeRate = rates.cnpsEmployeeRetraite;
      const cnpsEmployerRetraiteRate = rates.cnpsEmployerRetraite;
      const tfcRate = rates.fdfpFPC;
      const tapRate = rates.fdfpTA;
      const transportExempt = rates.transportExemptAmount;
      const cmuTotal = rates.cmuBase;
      const cmuEmployeeVal = Math.round(cmuTotal * (rates.cmuEmployeeRate / 100));
      const cmuEmployerVal = Math.round(cmuTotal * (rates.cmuEmployerRate / 100));

      const rawCnps = user?.cnpsNumber ? decryptData(user.cnpsNumber) : "Exonéré";
      const empCnps = cleanText(rawCnps);
      const deptName = cleanText(user?.direction || user?.department?.name || "ADMINISTRATION");
      const serviceName = cleanText(user?.service || "SECRETARIAT EXECUTIF");
      const category = cleanText(user?.category || "1A");
      const partsIGR = user?.partsIGR || 4.5;

      let seniorityText = "4 ans";
      if (user?.joiningDate) {
        const jDate = new Date(user.joiningDate);
        const diffYears = Math.floor((new Date(pYear, pMonth - 1).getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        seniorityText = `${Math.max(0, diffYears)} ans`;
      }

      // Gestion du logo entreprise si défini
      let headerYOffset = 0;
      if (appearanceConfig.logoBase64) {
        try {
          doc.addImage(appearanceConfig.logoBase64, "PNG", 14, 6, 25, 9);
          headerYOffset = 5;
        } catch (err) {
          console.error("Échec de l'ajout du logo dans le PDF:", err);
        }
      }

      // En-tête Bulletin
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(companyName.toUpperCase(), 14, 14 + headerYOffset);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`${companyName}`, 14, 18 + headerYOffset);
      doc.text(`${address}`, 14, 22 + headerYOffset);
      doc.text(`N°RCCM : ${rccm}    N°CC : ${cc}`, 14, 26 + headerYOffset);
      doc.text(`N°CNPS : ${cnps}`, 14, 30 + headerYOffset);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(cleanText(appearanceConfig.headerTitle || "BULLETIN DE PAIE"), 125, 15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (appearanceConfig.headerSubtitle) {
        doc.text(cleanText(appearanceConfig.headerSubtitle), 125, 21);
      }
      doc.text(`${monthName.toUpperCase()} ${pYear}`, 165, 21);

      // Cadre Salarié à gauche
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`Matricule: ${empId}`, 18, 42);
      doc.text(`CNPS N°: ${empCnps}`, 18, 47);
      doc.text(`Direction: ${deptName}`, 18, 52);
      doc.text(`Service: ${serviceName}`, 18, 57);
      doc.text(`Emploi: ${jobTitle}`, 18, 62);
      doc.text(`Catégorie: ${category}`, 18, 67);
      doc.text(`Parts IGR: ${partsIGR}`, 18, 72);
      doc.text(`Date entré ${joiningStr}`, 18, 77);
      doc.text(`Ancienneté ${seniorityText}`, 18, 82);

      // Cadre d'apparence à droite
      const rgbColor = hexToRgb(appearanceConfig.primaryColor || "#BBD795");
      doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
      doc.rect(100, 38, 96, 48, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${civility} ${userName}`, 120, 56);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(empAddress, 120, 64);

      // Valeurs de paie
      const baseSalary = payroll?.basicSalary || user?.salary || 75000;
      const sursalaire = payroll?.sursalaire || 957504;
      const transport = payroll?.transportAllowance || transportExempt;
      const overtime = (payroll as any)?.overtimePay || 0;
      const bonuses = payroll?.bonuses || 0;
      const seniorityVal = (payroll as any)?.seniorityBonus || 75000;

      const totalBrut = baseSalary + sursalaire + overtime + bonuses + seniorityVal;
      const brutSocial = totalBrut;
      const brutFiscal = totalBrut;

      const itsTax = payroll?.itsTax || Math.round(brutFiscal * 0.012);
      const cnpsEmployee = payroll?.cnpsEmployee || Math.round(brutSocial * (cnpsEmployeeRate / 100));
      const cnpsEmployerRetraite = Math.round(brutSocial * (cnpsEmployerRetraiteRate / 100));
      const tfcVal = Math.round(brutSocial * (tfcRate / 100));
      const tapVal = Math.round(brutSocial * (tapRate / 100));
      const cnpsEmployerATVal = Math.round(brutSocial * 0.03);
      const cnpsEmployerPFVal = Math.round(brutSocial * 0.0575);

      const totalGains = totalBrut + transport;
      const totalRetenuesSal = itsTax + cnpsEmployee;
      const totalRetenuesPat = cnpsEmployerRetraite + tfcVal + tapVal + cnpsEmployerATVal + cnpsEmployerPFVal;

      const tableRows = [
        ["01", "Salaire Categoriel", fmtNum(baseSalary), "30,00", fmtNum(baseSalary), "", "", ""],
        ["02", "Sursalaire", fmtNum(sursalaire), "30,00", fmtNum(sursalaire), "", "", ""],
        ["03", "Prime d'Anciennete", fmtNum(baseSalary), "3,00", fmtNum(seniorityVal), "", "", ""],
        ["05", "", "", "", "", "", "", ""],
        ["06", "", "", "", "", "", "", ""],
        ["07", "", "", "", "", "", "", ""],
        ["08", "", "", "", "", "", "", ""],
        ["09", "", "", "", "", "", "", ""],
        ["10", "Heures Supplementaires", fmtNum(overtime), "", fmtNum(overtime), "", "", ""],
        ["15", "Conges", "", "", fmtNum(bonuses), "", "", ""],
        ["30", "Total brut", "", "", fmtNum(totalBrut), "", "", ""],
        ["31", "Brut fiscal employe", fmtNum(brutFiscal), "", "", "", "", ""],
        ["32", "Brut fiscal employeur", fmtNum(brutFiscal), "", "", "", "", ""],
        ["33", "Brut social", fmtNum(brutSocial), "", "", "", "", ""],
        ["34", "ITS. Imp. sur Trait. et Sal.", "", "", "", fmtNum(itsTax), "1.20", fmtNum(itsTax)],
        ["35", "CNPS. Regime de Retraite", fmtNum(brutSocial), "6.30", "", fmtNum(cnpsEmployee), "7.70", fmtNum(cnpsEmployerRetraite)],
        ["36", "CNPS. Accident Travail", "", "", "", "", "3.00", fmtNum(cnpsEmployerATVal)],
        ["37", "CNPS. Prest. Famil.", "", "", "", "", "5.75", fmtNum(cnpsEmployerPFVal)],
        ...(rates.showCMU !== false ? [
          ["37b", "CMU. Couverture Maladie Univ.", fmtNumZero(cmuTotal), `${rates.cmuEmployeeRate.toFixed(2)}%`, "", fmtNumZero(cmuEmployeeVal), `${rates.cmuEmployerRate.toFixed(2)}%`, fmtNumZero(cmuEmployerVal)]
        ] : []),
        ["38", "FDFR. Taxe Apprentissage", "", "", "", "", tapRate.toFixed(2), fmtNum(tapVal)],
        ["39", "FDFR. Taxe Form. Continue", "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["40", "FDFR. TFC a regulariser", "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["22", "Prime Transport non impos.", fmtNumZero(transportExempt), "30,00", fmtNumZero(transportExempt), "", "", ""],
        ["", "", "", "", fmtNumZero(totalGains), fmtNumZero(totalRetenuesSal + (rates.showCMU !== false ? cmuEmployeeVal : 0)), "", fmtNumZero(totalRetenuesPat + (rates.showCMU !== false ? cmuEmployerVal : 0))],
      ];

      autoTable(doc, {
        startY: 88,
        margin: { left: 14, right: 14 },
        head: [
          [
            { content: "N°", rowSpan: 2 },
            { content: "DESIGNATION", rowSpan: 2 },
            { content: "BASE", rowSpan: 2 },
            { content: "PART SALARIALE", colSpan: 3 },
            { content: "PART PATRONALE", colSpan: 2 }
          ],
          [
            "Nbre/taux", "GAINS", "RETENUES", "Nbre/taux", "RETENUES"
          ]
        ],
        body: tableRows,
        theme: "plain",
        styles: { cellPadding: 0.8, fontSize: 6.5, textColor: [30, 30, 30] },
        headStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontSize: 6.5, fontStyle: "bold", halign: "center" },
        bodyStyles: { textColor: [30, 30, 30] },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "left", cellWidth: 54 },
          2: { halign: "right", cellWidth: 20 },
          3: { halign: "right", cellWidth: 18 },
          4: { halign: "right", cellWidth: 20 },
          5: { halign: "right", cellWidth: 20 },
          6: { halign: "right", cellWidth: 18 },
          7: { halign: "right", cellWidth: 22 },
        },
        didDrawPage: function (data: any) {
          // Dessiner le cadre extérieur global et les lignes de colonnes verticales comme sur la capture 1 LOGIPAIE RH
          const table = data.table;
          const startY = table.pageStartY || 88;
          const finalY = data.cursor?.y || 195;
          const left = 14;
          const right = 196;

          doc.setLineWidth(0.3);
          doc.setDrawColor(100, 100, 100);

          // Cadre extérieur
          doc.rect(left, startY, right - left, finalY - startY);

          // Ligne sous le header (double niveau)
          const headerHeight = 8;
          doc.line(left, startY + headerHeight, right, startY + headerHeight);
          doc.line(left, startY + 13, right, startY + 13);
          doc.line(left, finalY - 4.5, right, finalY - 4.5); // Ligne au-dessus des totaux

          // Lignes verticales séparatrices de colonnes d'un seul trait haut en bas
          const colX = [
            14, // Gauche N°
            24, // Séparation N° / DESIGNATION
            78, // Séparation DESIGNATION / BASE
            98, // Séparation BASE / PART SALARIALE (Nbre/taux)
            116, // Séparation Nbre/taux / GAINS
            136, // Séparation GAINS / RETENUES
            156, // Séparation PART SALARIALE / PART PATRONALE (Nbre/taux)
            174, // Séparation Nbre/taux patronal / RETENUES patronal
            196 // Droite extrême
          ];

          for (let i = 1; i < colX.length - 1; i++) {
            const x = colX[i];
            const topY = (i === 4 || i === 5 || i === 7) ? startY + headerHeight : startY;
            doc.line(x, topY, x, finalY);
          }
        },
        didParseCell: function (data: any) {
          if (data.section === "body") {
            const rowData = data.row.raw;
            const designation = rowData[1] || "";
            if (
              designation.includes("Total brut") ||
              designation.includes("Brut fiscal") ||
              designation.includes("Brut social")
            ) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [0, 0, 0];
              if (data.column.index === 1) {
                data.cell.styles.halign = "right";
              }
            }
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [0, 0, 0];
            }
          }
        },
      });

      const finalTableY = (doc as any).lastAutoTable?.finalY || 195;
      const netSalaryVal = payroll?.netSalary || (totalGains - totalRetenuesSal - (rates.showCMU !== false ? cmuEmployeeVal : 0));

      // Bande Couleur Net à Payer (N° 50)
      doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
      doc.rect(14, finalTableY + 2, 182, 9, "F");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("50", 18, finalTableY + 7);
      doc.text("Arrondi:", 70, finalTableY + 7);
      doc.text("NET A PAYER :", 130, finalTableY + 7);
      doc.text(`${fmtNumZero(netSalaryVal)}`, 175, finalTableY + 7);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Periode: du 01/${pMonth < 10 ? "0" + pMonth : pMonth}/${pYear} au 30/${pMonth < 10 ? "0" + pMonth : pMonth}/${pYear}    Date de paie: 31/${pMonth < 10 ? "0" + pMonth : pMonth}/${pYear}    Mode de paie: Virement`, 20, finalTableY + 14);

      // Cumuls Footer Table (Format conforme à la capture Excel LOGIPAIE RH)
      const hoursPeriode = payroll?.presentDays ? (payroll.presentDays).toFixed(2).replace(".", ",") : "173,33";
      const hoursAnnee = payroll?.presentDays ? Math.round(payroll.presentDays * pMonth).toString() : "173";

      const cumulsRows = [
        ["Periode", hoursPeriode, "acquis", "pris", "a Prendre", `${fmtNumZero(brutSocial)}`, `${fmtNumZero(brutFiscal)}`, `${fmtNumZero(itsTax)}`, `${fmtNumZero(cnpsEmployee)}`, ""],
        ["Annee", hoursAnnee, "", "", "", `${fmtNumZero(brutSocial * pMonth)}`, `${fmtNumZero(brutFiscal * pMonth)}`, `${fmtNumZero(itsTax * pMonth)}`, `${fmtNumZero(cnpsEmployee * pMonth)}`, ""]
      ];

      autoTable(doc, {
        startY: finalTableY + 16,
        margin: { left: 14, right: 14 },
        head: [["CUMULS", "Heures", "Conges", "", "", "Brut social", "Brut fiscal", "ITS", "Retraite", "Emargement"]],
        body: cumulsRows,
        theme: "grid",
        styles: { cellPadding: 0.8, fontSize: 6, lineColor: [100, 100, 100], lineWidth: 0.2 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontSize: 6, halign: "center", lineColor: [100, 100, 100], lineWidth: 0.2 },
        bodyStyles: { fontSize: 6, halign: "center" },
      });

      const cumulsFinalY = (doc as any).lastAutoTable?.finalY || (finalTableY + 30);
      let finalFooterY = cumulsFinalY + 8;

      // Cases de signature si configurées
      if (legalConfig.showEmployerStamp || legalConfig.showEmployeeSignature) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);

        if (legalConfig.showEmployerStamp) {
          doc.text("Signature & Tampon Employeur", 14, finalFooterY);
          doc.rect(14, finalFooterY + 2, 60, 14);
        }

        if (legalConfig.showEmployeeSignature) {
          doc.text("Emargement Salarie", 136, finalFooterY);
          doc.rect(136, finalFooterY + 2, 60, 14);
        }

        finalFooterY += 20;
      }

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(cleanText(legalConfig.legalNotice), 105, finalFooterY, { align: "center" });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="bulletin-${empId}-${pMonth}-${pYear}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    }

    // AUTRES DOCUMENTS (Contrats, Attestations, Ordres de virement...)
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
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRAT DE TRAVAIL", 70, 50);

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
