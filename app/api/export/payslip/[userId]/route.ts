import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { decryptData } from "@/lib/crypto";

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

// GET /api/export/payslip/[userId]?month=1&year=2026
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const isAdmin = user.role === "admin";
    if (userId !== user.userId && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez télécharger que vos propres bulletins de paie",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const [employee, payroll, companyInfoDoc, companyDoc, ratesDoc, otherParamsDoc] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { department: true },
      }),
      prisma.payroll.findUnique({
        where: {
          userId_month_year: {
            userId,
            month,
            year,
          },
        },
      }),
      prisma.settings.findUnique({ where: { key: "company_info" } }),
      prisma.settings.findUnique({ where: { key: "company" } }),
      prisma.settings.findUnique({ where: { key: "tax_rates" } }),
      prisma.settings.findUnique({ where: { key: "other_params" } }),
    ]);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé introuvable",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          error: "Bulletin de salaire introuvable pour ce mois",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Informations Entreprise depuis Settings
    const compSettings = (companyInfoDoc?.value as any) || (companyDoc?.value as any) || {};
    const companyName = cleanText(compSettings.name || compSettings.companyName || "LOGIPAIE RH 21");
    const companyAddress = cleanText(compSettings.address || "BP 5115 ABIDJAN 01");
    const companyRccm = cleanText(compSettings.rccm || "CI-ABJ-3000-A-451");
    const companyCc = cleanText(compSettings.taxNumber || "1234567 A");
    const companyCnps = cleanText(compSettings.cnpsNumber || "123456");

    // Informations Taux & Autres Paramètres
    const ratesSettings = (ratesDoc?.value as any) || {};
    const otherSettings = (otherParamsDoc?.value as any) || {};

    const cnpsEmployeeRate = ratesSettings.cnpsEmployeeRetraite || 6.3;
    const cnpsEmployerRetraiteRate = ratesSettings.cnpsEmployerRetraite || 7.7;
    const tfcRate = ratesSettings.fdfpFPC || 0.6;
    const tapRate = ratesSettings.fdfpTA || 0.4;
    const transportExempt = otherSettings.transportExemptAmount || 30000;

    // Informations Salarié
    const monthName = cleanText(new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" }));
    const empName = cleanText(employee.name || "KOUASSI Joseph Eric");
    const civility = cleanText(employee.civility || "M.");
    const empId = cleanText(employee.employeeId || "001");
    const deptName = cleanText(employee.direction || employee.department?.name || "ADMINISTRATION");
    const serviceName = cleanText(employee.service || "SECRETARIAT EXECUTIF");
    const jobTitle = cleanText(employee.jobTitle || "Comptable");
    const category = cleanText(employee.category || "1A");
    const partsIGR = employee.partsIGR || 4.5;

    const rawCnps = employee.cnpsNumber ? decryptData(employee.cnpsNumber) : "Exonéré";
    const empCnps = cleanText(rawCnps);
    const empAddress = cleanText(employee.address || "BP 5115 ABIDJAN 01");

    let seniorityText = "4 ans";
    if (employee.joiningDate) {
      const jDate = new Date(employee.joiningDate);
      const diffYears = Math.floor((new Date(year, month - 1).getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      seniorityText = `${Math.max(0, diffYears)} ans`;
    }
    const joiningDate = employee.joiningDate ? cleanText(new Date(employee.joiningDate).toLocaleDateString("fr-FR")) : "01/02/2020";

    const doc = new jsPDF() as any;

    // 1. HEADER (Format Officiel Capture 1 LOGIPAIE RH)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(companyName.toUpperCase(), 14, 15);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${companyName}`, 14, 19);
    doc.text(`${companyAddress}`, 14, 23);
    doc.text(`N°RCCM : ${companyRccm}    N°CC : ${companyCc}`, 14, 27);
    doc.text(`N°CNPS : ${companyCnps}`, 14, 31);

    // Titre Bulletin à droite (BULLETIN DE PAIE / SOLDE DE TOUT COMPTE)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("BULLETIN DE PAIE", 125, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${monthName.toUpperCase()} ${year}`, 165, 21);

    // 2. CADRE INFOS SALARIÉ À GAUCHE & CADRE VERT (#BBD795) À DROITE
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
    doc.text(`Date entré ${joiningDate}`, 18, 77);
    doc.text(`Ancienneté ${seniorityText}`, 18, 82);

    // Cadre vert salarié à droite (#BBD795) - Strictement identique à la Capture 1
    doc.setFillColor(187, 215, 149);
    doc.rect(100, 38, 96, 48, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`${civility} ${empName}`, 120, 56);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(empAddress, 120, 64);

    // 3. COMPOSANTES DE PAIE
    const baseSalary = payroll.basicSalary || 0;
    const sursalaire = payroll.sursalaire || 0;
    const transport = payroll.transportAllowance || transportExempt;
    const overtime = (payroll as any).overtimePay || 0;
    const bonuses = payroll.bonuses || 0;
    const seniorityVal = (payroll as any).seniorityBonus || 0;

    const totalBrut = baseSalary + sursalaire + overtime + bonuses + seniorityVal;
    const brutSocial = totalBrut;
    const brutFiscal = totalBrut;

    const itsTax = payroll.itsTax || Math.round(brutFiscal * 0.012);
    const cnpsEmployee = payroll.cnpsEmployee || Math.round(brutSocial * (cnpsEmployeeRate / 100));
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
      ["34", "ITS. Imp. sur Trait. et Sal.", fmtNum(brutFiscal), "", "", fmtNum(itsTax), "1.20", fmtNum(itsTax)],
      ["35", "CNPS. Regime de Retraite", fmtNum(brutSocial), "6.30", "", fmtNum(cnpsEmployee), "7.70", fmtNum(cnpsEmployerRetraite)],
      ["36", "CNPS. Accident Travail", fmtNum(brutSocial), "", "", "", "3.00", fmtNum(cnpsEmployerATVal)],
      ["37", "CNPS. Prest. Famil.", fmtNum(brutSocial), "", "", "", "5.75", fmtNum(cnpsEmployerPFVal)],
      ["38", "FDFR. Taxe Apprentissage", fmtNum(brutSocial), "", "", "", "0.40", fmtNum(tapVal)],
      ["39", "FDFR. Taxe Form. Continue", fmtNum(brutSocial), "", "", "", "0.60", fmtNum(tfcVal)],
      ["40", "FDFR. TFC a regulariser", fmtNum(brutSocial), "", "", "", "0.60", fmtNum(tfcVal)],
      ["22", "Prime Transport non impos.", "30 000", "30,00", "30 000", "", "", ""],
      ["", "", "", "", fmtNumZero(totalGains), fmtNumZero(totalRetenuesSal), "", fmtNumZero(totalRetenuesPat)],
    ];

    autoTable(doc, {
      startY: 92,
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
      theme: "grid",
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [30, 30, 30], 
        fontSize: 7, 
        fontStyle: "bold", 
        halign: "center" 
      },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "right", cellWidth: 20 },
        3: { halign: "right", cellWidth: 18 },
        4: { halign: "right", cellWidth: 22 },
        5: { halign: "right", cellWidth: 22 },
        6: { halign: "right", cellWidth: 18 },
        7: { halign: "right", cellWidth: 22 },
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
          // Dernière ligne des sous-totaux bas du tableau (Ligne N° 50)
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
      },
    });

    const finalTableY = (doc as any).lastAutoTable?.finalY || 205;

    // 4. BANDE VERTE NET À PAYER (Cadre Vert N° 50 - Conforme Capture 1)
    const netSalaryVal = payroll.netSalary || (totalGains - totalRetenuesSal);

    doc.setFillColor(187, 215, 149);
    doc.rect(14, finalTableY + 2, 182, 10, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("50", 18, finalTableY + 8);
    doc.text("Arrondi:", 70, finalTableY + 8);
    doc.text("NET A PAYER :", 130, finalTableY + 8);
    doc.text(`${fmtNumZero(netSalaryVal)}`, 175, finalTableY + 8);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Periode: du 01/${month < 10 ? "0" + month : month}/${year} au 30/${month < 10 ? "0" + month : month}/${year}    Date de paie: 31/${month < 10 ? "0" + month : month}/${year}    Mode de paie: Virement`, 20, finalTableY + 16);

    // 5. CUMULS TABLE FOOTER
    const cumulsRows = [
      ["Periode", `${payroll.presentDays || 173.33} h`, "acquis", "pris", "a Prendre", `${fmtNumZero(brutSocial)}`, `${fmtNumZero(brutFiscal)}`, `${fmtNumZero(itsTax)}`, `${fmtNumZero(cnpsEmployee)}`, ""],
      ["Annee", `${(payroll.presentDays || 173.33) * month} h`, "", "", "", `${fmtNumZero(brutSocial * month)}`, `${fmtNumZero(brutFiscal * month)}`, `${fmtNumZero(itsTax * month)}`, `${fmtNumZero(cnpsEmployee * month)}`, ""]
    ];

    autoTable(doc, {
      startY: finalTableY + 18,
      head: [["CUMULS", "Heures", "Conges", "", "", "Brut social", "Brut fiscal", "ITS", "Retraite", "Emargement"]],
      body: cumulsRows,
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontSize: 6.5, halign: "center" },
      bodyStyles: { fontSize: 6.5, halign: "center" },
    });

    const finalFooterY = (doc as any).lastAutoTable?.finalY || 250;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("Pour vous aider a faire valoir vos droits, conservez ce bulletin de paie sans limitation de duree.", 30, finalFooterY + 6);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bulletin-${empId}-${month}-${year}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export payslip error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Echec du telechargement du bulletin de salaire",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
