import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { decryptData } from "@/lib/crypto";
import { RateService } from "@/lib/rate-service";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import { DEFAULT_PAYSLIP_APPEARANCE, DEFAULT_PAYSLIP_LEGAL } from "@/lib/payslip-config";
import { PDFDocumentFactory } from "@/lib/infrastructure/pdf/pdf-document-factory";
import { isModularPDFEnabled } from "@/lib/domain/payroll/adapters/legacy-rates-adapter";

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
      rnsData,
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
    // Chargement des images de logos officiels
    const dgiPath = path.join(process.cwd(), "public", "dgi.png");
    let dgiBase64 = "";
    try {
      if (fs.existsSync(dgiPath)) {
        const fileBuffer = fs.readFileSync(dgiPath);
        dgiBase64 = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Failed to load dgi.png:", err);
    }

    const cnpsPath = path.join(process.cwd(), "public", "cnps.jpeg");
    let cnpsBase64 = "";
    try {
      if (fs.existsSync(cnpsPath)) {
        const fileBuffer = fs.readFileSync(cnpsPath);
        cnpsBase64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Failed to load cnps.jpeg:", err);
    }

    // ─── PHASE 3 : MODULAR PDF BUILDER FACTORY ───────────────────────────────
    if (isModularPDFEnabled() && ["declaration_its", "declaration_cnps", "declaration_fdfp", "rns"].includes(docType)) {
      try {
        const pdfBuffer = PDFDocumentFactory.createDocument({
          docType,
          month: month || new Date().getMonth() + 1,
          year: year || new Date().getFullYear(),
          companyName,
          companyAddress: address,
          taxNumber: cc,
          cnpsNumber: cnps,
          dgiLogoBase64: dgiBase64,
          cnpsLogoBase64: cnpsBase64,
          itsData,
          cnpsData,
        });

        return new Response(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${docType}-${month || 1}-${year || 2026}.pdf"`,
            "Content-Length": pdfBuffer.length.toString(),
          },
        });
      } catch (factoryErr) {
        console.error("PDFDocumentFactory failed, falling back to legacy builder:", factoryErr);
      }
    }

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

      if (payroll && payroll.status === "finalized" && payroll.configSnapshotId) {
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

      const yiqBox = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
      const contrastTextColor = yiqBox >= 128 ? [30, 30, 30] : [255, 255, 255];

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
      doc.text(`${civility} ${userName}`, 120, 56);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
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
      doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
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
      // ═══════════════════════════════════════════════════════════════
      // 24-DÉCLARATION ITS (DGI) — FORMULAIRE OFFICIEL COMPLET (Capture 3)
      // ═══════════════════════════════════════════════════════════════
      
      // Dessin du logo DGI officiel si présent
      if (dgiBase64) {
        doc.addImage(dgiBase64, "PNG", 14, 11, 20, 20);
      }

      // En-tête officiel DGI Côte d'Ivoire
      const headerX = dgiBase64 ? 38 : 14;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("REPUBLIQUE DE COTE D'IVOIRE", headerX, 15);
      doc.setFont("helvetica", "normal");
      doc.text("Union - Discipline - Travail", headerX, 19);
      doc.text("------", headerX, 23);
      doc.setFont("helvetica", "bold");
      doc.text("MINISTERE DE L'ECONOMIE ET DES FINANCES", headerX, 27);
      doc.text("DIRECTION GENERALE DES IMPOTS", headerX, 31);

      // Titre du document officiel
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("DECLARATION DES IMPOTS SUR LES TRAITEMENTS,", 196, 15, { align: "right" });
      doc.text("SALAIRES, PENSIONS ET RENTES VIAGERES", 196, 19, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("(Article 115 et suivants du CGI)", 196, 23, { align: "right" });

      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.4);
      doc.line(14, 35, 196, 35);

      // Période et Service d'assiette
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Periode d'imposition : ${month || 1}/${year || 2026}`, 14, 40);
      doc.text(`Service d'assiette des impots : ABIDJAN A`, 120, 40);

      // Section 1: Identification du Contribuable
      doc.setFillColor(234, 88, 12);
      doc.rect(14, 43, 182, 5, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("01 IDENTIFICATION DU CONTRIBUABLE", 16, 47);

      doc.setDrawColor(180, 180, 180);
      doc.rect(14, 48, 182, 22);
      doc.line(110, 48, 110, 70);

      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.text(`Raison sociale : ${companyName}`, 18, 53);
      doc.text(`NCC : ${cc}`, 18, 58);
      doc.text(`Adresse : ${address}`, 18, 63);
      doc.text(`Objet ou activite : Logiciel de paie`, 18, 68);

      doc.text(`Localisation : ${city}`, 113, 53);
      doc.text(`Telephone : ${phone || "0709670671"}`, 113, 58);
      doc.text(`Ville : ${city}`, 113, 63);
      doc.text(`Sigle : ${companyName}`, 113, 68);

      // Section 2: Détermination de l'Assiette
      doc.setFillColor(234, 88, 12);
      doc.rect(14, 73, 182, 5, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("02 DETERMINATION DE L'ASSIETTE", 16, 77);

      // C. Traitements, Salaires, Contribution Employeur
      doc.setFillColor(16, 185, 129);
      doc.rect(14, 78, 182, 5, "F");
      doc.setFontSize(7.5);
      doc.text("C. TRAITEMENTS, SALAIRES, CONTRIBUTION EMPLOYEUR", 16, 82);

      const totalEmployees = itsData?.totalEmployees || 0;
      const totalGross = itsData?.totalGrossSalary || 0;
      const netTaxable = Math.round(totalGross * 0.8); // 20% abattement standard
      const netImposable = totalGross - netTaxable; // le total taxable net réel

      const salariesRows = [
        ["5. Remunerations versees (Brut)", totalEmployees.toString(), fmtNum(totalGross)],
        ["6. Avantages en nature", "0", "0"],
        ["7. Autres (a preciser)", "0", "0"],
        ["MONTANT TOTAL BRUT", totalEmployees.toString(), fmtNum(totalGross)]
      ];

      autoTable(doc, {
        startY: 83,
        margin: { left: 14, right: 14 },
        head: [["N° / REVENUS BRUTS", "EFFECTIF", "MONTANT BRUT (FCFA)"]],
        body: salariesRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 90, halign: "left" },
          1: { cellWidth: 32, halign: "center" },
          2: { cellWidth: 60, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 3) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const salariesFinalY = (doc as any).lastAutoTable?.finalY || 110;

      // Déduction et Net Imposable
      const deductRows = [
        ["9. Salaires (inferieurs au minimum) non declares", "0", "0", "0"],
        ["10. Indemnites non imposables", "0", "0", "0"],
        ["11. Montant brut imposable [[5]+[6]+[7]-[10]]", totalEmployees.toString(), fmtNum(totalGross), fmtNum(totalGross)],
        ["12. Revenu net imposable [[11] * 80%]", totalEmployees.toString(), fmtNum(netTaxable), fmtNum(netTaxable)],
        ["13. TOTAL MONTANT NET IMPOSABLE [[11]-[12]+[9]]", totalEmployees.toString(), fmtNum(netImposable), fmtNum(netImposable)]
      ];

      autoTable(doc, {
        startY: salariesFinalY + 2,
        margin: { left: 14, right: 14 },
        head: [["N° / REVENUS NON IMPOSABLES", "EFFECTIF", "MONTANT ITS", "CONTRIBUTION EMPLOYEUR"]],
        body: deductRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 90, halign: "left" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 36, halign: "right" },
          3: { cellWidth: 36, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 4) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const deductFinalY = (doc as any).lastAutoTable?.finalY || 140;

      // Section 3: Détermination de l'impôt
      doc.setFillColor(234, 88, 12);
      doc.rect(14, deductFinalY + 3, 182, 5, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("03 DETERMINATION DE L'IMPOT", 16, deductFinalY + 7);

      // D3.1 Impôts retenus aux salariés
      doc.setFillColor(16, 185, 129);
      doc.rect(14, deductFinalY + 8, 182, 5, "F");
      doc.setFontSize(7.5);
      doc.text("D3.1 IMPOTS RETENUS AUX SALARIES", 16, deductFinalY + 12);

      const totalITS = itsData?.totalITS || Math.round(totalGross * 0.012);
      const totalIGR = itsData?.totalIGR || 0;

      const impotsRetenusRows = [
        ["14. Impot sur traitements, salaires, pensions, rentes viageres (ITS)", fmtNum(totalGross), "1.20%", fmtNum(totalITS)],
        ["15. Impot General sur le Revenu (IGR) retenu sur salaires", fmtNum(netImposable), "Taux Variable", fmtNum(totalIGR)],
        ["TOTAL DES IMPOTS RETENUS AUX SALARIES", "", "", fmtNum(totalITS + totalIGR)]
      ];

      autoTable(doc, {
        startY: deductFinalY + 13,
        margin: { left: 14, right: 14 },
        head: [["NATURE DES IMPOTS", "BASE IMPOSABLE", "TAUX", "MONTANT RETENU (FCFA)"]],
        body: impotsRetenusRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 90, halign: "left" },
          1: { cellWidth: 32, halign: "right" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 40, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 2) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const impotsFinalY = (doc as any).lastAutoTable?.finalY || 165;

      // D3.2 Contributions à la charge de l'employeur
      doc.setFillColor(16, 185, 129);
      doc.rect(14, impotsFinalY + 2, 182, 5, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("D3.2 CONTRIBUTIONS A LA CHARGE DE L'EMPLOYEUR", 16, impotsFinalY + 6);

      const totalCE = itsData?.totalCE || Math.round(totalGross * 0.115);
      const totalCN = Math.round(totalGross * 0.012); // Taux CN employeur standard

      const contributionRows = [
        ["17. Contribution Employeur (CE) - Personnel local", totalEmployees.toString(), fmtNum(totalGross), "11.50%", fmtNum(totalCE)],
        ["18. Personnel expatrie (CE)", "0", "0", "11.50%", "0"],
        ["20. Contribution Nationale (CN) - Personnel local", totalEmployees.toString(), fmtNum(totalGross), "1.20%", fmtNum(totalCN)],
        ["TOTAL DES CONTRIBUTIONS EMPLOYEUR", totalEmployees.toString(), "", "", fmtNum(totalCE + totalCN)]
      ];

      autoTable(doc, {
        startY: impotsFinalY + 7,
        margin: { left: 14, right: 14 },
        head: [["NATURE DES CONTRIBUTIONS", "EFFECTIF", "REVENUS NET IMPOSABLES", "TAUX", "MONTANT DU (FCFA)"]],
        body: contributionRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 80, halign: "left" },
          1: { cellWidth: 16, halign: "center" },
          2: { cellWidth: 36, halign: "right" },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 32, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 3) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const contrFinalY = (doc as any).lastAutoTable?.finalY || 195;

      // Section 5: Recapitulation & Total à payer
      doc.setFillColor(234, 88, 12);
      doc.rect(14, contrFinalY + 3, 182, 5, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("05 RECAPITULATION DES IMPOTS A PAYER", 16, contrFinalY + 7);

      const grandTotalTax = totalITS + totalIGR + totalCE + totalCN;

      const recapRows = [
        ["24. Impots sur Traitements et Salaires (IS)", fmtNum(totalITS)],
        ["26. Impot General sur le Revenu (IGR) retenu aux salaries", fmtNum(totalIGR)],
        ["28. Contribution Employeur (CE) a la charge de l'employeur", fmtNum(totalCE)],
        ["29. Contribution Nationale (CN) a la charge de l'employeur", fmtNum(totalCN)],
        ["MONTANT TOTAL A PAYER A LA DGI", fmtNum(grandTotalTax)]
      ];

      autoTable(doc, {
        startY: contrFinalY + 8,
        margin: { left: 14, right: 14 },
        head: [["RUBRIQUE DE RECAPITULATION", "MONTANT RECAPITULE (FCFA)"]],
        body: recapRows,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 120, halign: "left" },
          1: { cellWidth: 62, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 4) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const recapFinalY = (doc as any).lastAutoTable?.finalY || 225;

      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, recapFinalY + 8);
      doc.setFont("helvetica", "bold");
      doc.text("CACHE ET SIGNATURE DU CONTRIBUABLE", 110, recapFinalY + 13);
      doc.rect(110, recapFinalY + 16, 75, 15);

    } else if (docType === "declaration_fdfp") {
      // ═══════════════════════════════════════════════════════════════
      // 25-DÉCLARATION FDFP (TA & TFC) — FORMULAIRE OFFICIEL DGI
      // ═══════════════════════════════════════════════════════════════
      
      // Dessin du logo DGI officiel si présent
      if (dgiBase64) {
        doc.addImage(dgiBase64, "PNG", 14, 11, 20, 20);
      }

      // En-tête officiel DGI Côte d'Ivoire
      const headerX = dgiBase64 ? 38 : 14;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("REPUBLIQUE DE COTE D'IVOIRE", headerX, 15);
      doc.setFont("helvetica", "normal");
      doc.text("Union - Discipline - Travail", headerX, 19);
      doc.text("------", headerX, 23);
      doc.setFont("helvetica", "bold");
      doc.text("MINISTERE DE L'ECONOMIE ET DES FINANCES", headerX, 27);
      doc.text("DIRECTION GENERALE DES IMPOTS", headerX, 31);

      doc.setFont("helvetica", "bold");
      doc.text("TAXE D'APPRENTISSAGE ET TAXE", 130, 15, { align: "right" });
      doc.text("ADDITIONNELLE A LA FORMATION CONTINUE", 130, 19, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text("(Articles 143 et suivants du CGI)", 130, 23, { align: "right" });

      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.4);
      doc.line(14, 35, 196, 35);

      // Titre principal
      doc.setFillColor(16, 185, 129);
      doc.rect(14, 38, 182, 11, "F");
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("DÉCLARATION MENSUELLE DES TAXES FDFP (TA & TFC)", 105, 45, { align: "center" });

      // Identification du Contribuable
      doc.setDrawColor(180, 180, 180);
      doc.rect(14, 53, 182, 32);
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("01 - IDENTIFICATION DU CONTRIBUABLE", 18, 59);
      doc.setFont("helvetica", "normal");
      doc.text(`Raison sociale : ${companyName}`, 18, 65);
      doc.text(`N° Compte Contribuable (NCC) : ${cc}`, 18, 71);
      doc.text(`Adresse : ${address}`, 18, 77);
      doc.text(`Période d'imposition : ${month}/${year}`, 120, 65);
      doc.text(`Ville / Commune : ${city}`, 120, 71);
      doc.text("Régime : Réel Normal", 120, 77);

      // Détermination des Taxes
      const gross = itsData?.totalGrossSalary || 0;
      const tfc = Math.round(gross * 0.012);
      const tap = Math.round(gross * 0.004);
      const totalFdfp = tfc + tap;

      const fdfpItems = [
        ["2.1 TAXE D'APPRENTISSAGE (TA) (0.40%)", fmtNum(gross), "0.40%", fmtNum(tap)],
        ["2.2 TAXE ADDITIONNELLE A LA FORMATION CONTINUE (TFC) (1.20%)", fmtNum(gross), "1.20%", fmtNum(tfc)],
        ["TOTAL A PAYER FDFP (1.60%)", fmtNum(gross), "1.60%", fmtNum(totalFdfp)]
      ];

      autoTable(doc, {
        startY: 90,
        margin: { left: 14, right: 14 },
        head: [["NATURE DES TAXES", "REMUNERATIONS BRUTES TOTALES", "TAUX", "MONTANT A PAYER (FCFA)"]],
        body: fdfpItems,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        styles: { fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 42, halign: "right" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 40, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 2) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;

      // Mentions de signature
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Fait a ${city}, le ${dateStr}`, 130, finalY + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Cachet et Signature du Contribuable", 110, finalY + 18);
      doc.rect(110, finalY + 21, 75, 20);

    } else if (docType === "declaration_cnps") {
      // ═══════════════════════════════════════════════════════════════
      // 27-DÉCLARATION CNPS — APPEL DE COTISATION MENSUEL (Capture 1)
      // ═══════════════════════════════════════════════════════════════
      
      // Cadre d'en-tête principal
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.5);
      doc.rect(14, 15, 182, 22);
      doc.line(75, 15, 75, 37);
      doc.line(155, 15, 155, 37);

      // À gauche: CNPS (avec logo officiel)
      if (cnpsBase64) {
        doc.addImage(cnpsBase64, "JPEG", 16, 17, 12, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("CNPS", 30, 24);
        doc.setFontSize(5);
        doc.text("CAISSE NATIONALE DE PREVOYANCE SOCIALE", 30, 28);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("CNPS", 20, 24);
        doc.setFontSize(6);
        doc.text("CAISSE NATIONALE DE PREVOYANCE SOCIALE", 17, 28);
      }

      // Au milieu: Titre
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("ENREGISTREMENT", 115, 20, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("APPEL DE COTISATION MENSUEL", 115, 27, { align: "center" });

      // À droite: Références
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Ref. : EN-GDREC-01", 158, 20);
      doc.text("Version: 03", 158, 25);
      doc.text("Page: 1/1", 158, 30);

      // Identification de l'Employeur
      doc.rect(14, 40, 182, 25);
      doc.line(55, 40, 55, 65);
      doc.line(110, 40, 110, 65);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("N° Employeur", 18, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(cnps || "123456", 18, 52);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Periode", 18, 58);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`${year}/${String(month).padStart(2, "0")}`, 18, 63);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Raison sociale", 58, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(companyName, 58, 50);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Adresse", 58, 56);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(address, 58, 61);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Telephone", 113, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(phone || "0709670671", 113, 50);

      // Calcul dynamique des catégories de salaire CNPS
      let countCat3 = 0, sumRetCat3 = 0, sumPfCat3 = 0;
      let countCat4 = 0, sumRetCat4 = 0, sumPfCat4 = 0;
      let countCat5 = 0, sumRetCat5 = 0, sumPfCat5 = 0;

      const details = cnpsData?.employeeDetails || [];
      details.forEach((emp: any) => {
        const brut = emp.grossSalary || 0;
        if (brut <= 75000) {
          countCat3++;
          sumRetCat3 += brut;
          sumPfCat3 += brut;
        } else if (brut <= 3375000) {
          countCat4++;
          sumRetCat4 += brut;
          sumPfCat4 += 75000;
        } else {
          countCat5++;
          sumRetCat5 += 3375000;
          sumPfCat5 += 75000;
        }
      });

      const totalEmployees = details.length;
      const totalRetraite = sumRetCat3 + sumRetCat4 + sumRetCat5;
      const totalPfAt = sumPfCat3 + sumPfCat4 + sumPfCat5;

      const matVal = Math.round(totalPfAt * 0.0075);
      const pfVal = Math.round(totalPfAt * 0.05);
      const atVal = Math.round(totalPfAt * 0.03);
      const retVal = Math.round(totalRetraite * 0.14);
      const grandTotalCNPS = matVal + pfVal + atVal + retVal;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL SALAIRES BRUTS PAYES AU COURS DE LA PERIODE :   ${fmtNum(cnpsData?.totalGrossSalary || 0)} F`, 14, 72);

      // Tableau Catégories de salaires
      const catRows = [
        ["Horaires, journaliers et occasionnels inferieurs ou egaux a 3462 F par jour.", "0", "0", "0"],
        ["Horaires, journaliers et occasionnels superieurs ou egaux a 3462 F par jour.", "0", "0", "0"],
        ["Mensuels inferieurs ou egaux a 75.000 F par mois.", countCat3.toString(), fmtNum(sumRetCat3), fmtNum(sumPfCat3)],
        ["Mensuels superieurs a 75.000 F par mois et inferieurs ou egaux a 3.375.000 F par mois.", countCat4.toString(), fmtNum(sumRetCat4), fmtNum(sumPfCat4)],
        ["Mensuels superieurs a 3.375.000 F par mois.", countCat5.toString(), fmtNum(sumRetCat5), fmtNum(sumPfCat5)],
        ["TOTAL", totalEmployees.toString(), fmtNum(totalRetraite), fmtNum(totalPfAt)]
      ];

      autoTable(doc, {
        startY: 76,
        margin: { left: 14, right: 14 },
        head: [
          [
            { content: "CATEGORIES DE SALAIRES", rowSpan: 2 },
            { content: "NOMBRE DE SALARIES", rowSpan: 2 },
            { content: "SALAIRES BRUTS SOUMIS A COTISATIONS", colSpan: 2 }
          ],
          [
            "REGIME DE RETRAITE (Plafond=3.375.000 F/mois)", "REGIMES PF ET ACCIDENTS DU TRAVAIL"
          ]
        ],
        body: catRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 80, halign: "left" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 42, halign: "right" },
          3: { cellWidth: 40, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 5) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const catFinalY = (doc as any).lastAutoTable?.finalY || 120;

      // Décompte des Cotisations Dues
      const decRows = [
        ["Assurance Maternite", fmtNum(totalPfAt), "0.75%", fmtNum(matVal)],
        ["Prestations Familiales", fmtNum(totalPfAt), "5.00%", fmtNum(pfVal)],
        ["Accidents du Travail", fmtNum(totalPfAt), "3.00%", fmtNum(atVal)],
        ["Regime de Retraite", fmtNum(totalRetraite), "14.00%", fmtNum(retVal)],
        ["TOTAL COTISATIONS A PAYER", "", "", fmtNum(grandTotalCNPS)]
      ];

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("DECOMPTE DES COTISATIONS DUES", 14, catFinalY + 8);

      autoTable(doc, {
        startY: catFinalY + 11,
        margin: { left: 14, right: 14 },
        head: [["Rubriques", "SALAIRES SOUMIS A COTISATION", "TAUX", "MONTANTS (Francs CFA)"]],
        body: decRows,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 1.2 },
        headStyles: { fillColor: [230, 230, 230], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 60, halign: "left" },
          1: { cellWidth: 50, halign: "right" },
          2: { cellWidth: 22, halign: "center" },
          3: { cellWidth: 50, halign: "right" }
        },
        didParseCell: function(data) {
          if (data.row.index === 4) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      const decFinalY = (doc as any).lastAutoTable?.finalY || 185;

      // Mentions Légales CNPS & Signature
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("Bordereau certifie exact,", 140, decFinalY + 8);
      doc.setFont("helvetica", "normal");
      doc.text(`A ABIDJAN le ${dateStr}`, 140, decFinalY + 13);
      doc.setFont("helvetica", "bold");
      doc.text("Signature et cachet", 140, decFinalY + 18);
      doc.rect(140, decFinalY + 21, 45, 12);

      // Cadre attention à gauche
      doc.setFontSize(6);
      doc.rect(14, decFinalY + 8, 115, 25);
      doc.text("ATTENTION", 18, decFinalY + 12);
      doc.setFont("helvetica", "normal");
      const attentionLines = [
        "Il est vivement conseille d'annexer a la presente declaration votre titre de paiement faute de quoi vous",
        "serez responsable du retard des pertes et des erreurs de comptabilisation.",
        "Le titre de paiement doit etre libelle a l'ordre de la Direction Financiere et Comptable de la CNPS."
      ];
      attentionLines.forEach((l, idx) => {
        doc.text(l, 18, decFinalY + 16 + (idx * 3.5));
      });

      // Cadre réservé CNPS
      doc.rect(14, decFinalY + 38, 182, 13);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("CADRE RESERVE A LA C.N.P.S. (ne rien inscrire S.V.P.)", 18, decFinalY + 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text("Code oper.   |   Date de journee   |   N° Piece   |   Periode   |   Code Virement   |   Banque   |   Montant", 18, decFinalY + 48);

    } else if (docType === "rns") {
      // ═══════════════════════════════════════════════════════════════
      // 17-RNS — RELEVÉ NOMINATIF DES SALAIRES (Capture 2)
      // ═══════════════════════════════════════════════════════════════
      
      // Cadre principal
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.4);
      doc.rect(14, 15, 182, 25);
      doc.line(100, 15, 100, 40);

      // À gauche: CNPS (avec logo officiel)
      if (cnpsBase64) {
        doc.addImage(cnpsBase64, "JPEG", 16, 17, 12, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("CNPS", 30, 24);
        doc.setFontSize(5.5);
        doc.text("CAISSE NATIONALE DE PREVOYANCE SOCIALE", 30, 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(4.5);
        doc.text("24, Avenue Lamblin Plateau - 01 B.P. 317 Abidjan 01 - Cote d'Ivoire", 30, 32);
        doc.text("Tel.:(225) 20 252 100  -  Fax: (225) 327 994  -  E-mail: info@cnps.ci", 30, 36);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("CNPS", 20, 24);
        doc.setFontSize(6.5);
        doc.text("CAISSE NATIONALE DE PREVOYANCE SOCIALE", 20, 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5);
        doc.text("24, Avenue Lamblin Plateau - 01 B.P. 317 Abidjan 01 - Cote d'Ivoire", 20, 32);
        doc.text("Tel.:(225) 20 252 100  -  Fax: (225) 327 994  -  E-mail: info@cnps.ci", 20, 36);
      }

      // À droite: Titre du document
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("RELEVE NOMINATIF DES SALAIRES", 148, 24, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("SERVANT DE BASE AUX CALCULS", 148, 29, { align: "center" });
      doc.text("DES COTISATIONS", 148, 33, { align: "center" });

      // Tableau d'identification
      doc.rect(14, 43, 182, 34);
      doc.line(100, 43, 100, 77);
      doc.line(14, 60, 196, 60);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("NOM ET ADRESSE DE L'EMPLOYEUR", 18, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(companyName, 18, 54);
      doc.setFontSize(7.5);
      doc.text(address, 18, 58);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("N° EMPLOYEUR", 104, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(cnps || "123456", 104, 55);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("NOM ET PRENOMS DU SALARIE", 18, 65);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(userName.toUpperCase(), 18, 72);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("DATE ET LIEU D'ETABLISSEMENT DU DOCUMENT", 104, 65);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`A ${city}, le ${dateStr}`, 104, 72);

      // Détails du salarié
      doc.rect(14, 80, 182, 28);
      doc.line(65, 80, 65, 108);
      doc.line(130, 80, 130, 108);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("Matricule Salarie(e) :", 18, 86);
      doc.setFont("helvetica", "normal");
      doc.text(empId, 18, 91);

      doc.setFont("helvetica", "bold");
      doc.text("Date d'embauche :", 18, 97);
      doc.setFont("helvetica", "normal");
      doc.text(joiningStr, 18, 102);

      doc.setFont("helvetica", "bold");
      doc.text("Date de cessation :", 69, 86);
      doc.setFont("helvetica", "normal");
      doc.text(user?.exitDate ? cleanText(new Date(user.exitDate).toLocaleDateString("fr-FR")) : "Neant", 69, 91);

      doc.setFont("helvetica", "bold");
      doc.text("Periode de cotisations :", 69, 97);
      doc.setFont("helvetica", "normal");
      doc.text(`Du ${joiningStr} Au ${dateStr}`, 69, 102);

      doc.setFont("helvetica", "bold");
      doc.text("Observations :", 134, 86);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("CONGE ANNUEL COMPRIS", 134, 92);

      // Historique des Salaires (Données RNS)
      const rnsRows = (rnsData || []).map((item: any) => [
        item.year.toString(),
        fmtNumZero(item.grossCnpsSalary),
        item.monthsWorked.toString(),
        "N/A"
      ]);

      autoTable(doc, {
        startY: 112,
        margin: { left: 14, right: 14 },
        head: [["ANNEES", "SALAIRES BRUTS ANNUELS SOUMIS A COTISATIONS C.N.P.S", "NOMBRE DE MOIS DE TRAVAIL DANS L'ANNEE", "OBSERVATIONS"]],
        body: rnsRows.length > 0 ? rnsRows : [["N/A", "0", "0", "Aucun historique"]],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, halign: "center" },
        headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold", fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 70, halign: "right" },
          2: { cellWidth: 47 },
          3: { cellWidth: 40, halign: "left" }
        }
      });

      const rnsFinalY = (doc as any).lastAutoTable?.finalY || 160;

      // Bas de page Signature
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("NOM - SIGNATURE - CACHET", 14, rnsFinalY + 15);
      doc.text("QUALITE DU SIGNATAIRE", 14, rnsFinalY + 20);
      doc.rect(14, rnsFinalY + 23, 70, 16);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("N.B : FOURNIR LES ELEMENTS DE RENSEIGNEMENTS DEMANDES OBLIGATOIREMENT.", 14, rnsFinalY + 45);

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
