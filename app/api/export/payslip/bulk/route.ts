import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
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
  if (isNaN(num)) return String(val);
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

// GET /api/export/payslip/bulk?month=1&year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const [payrolls, companyInfoDoc, companyDoc, ratesDoc, otherParamsDoc] = await Promise.all([
      prisma.payroll.findMany({
        where: { month, year },
        include: {
          user: {
            include: { department: true }
          },
        },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.settings.findUnique({ where: { key: "company_info" } }),
      prisma.settings.findUnique({ where: { key: "company" } }),
      prisma.settings.findUnique({ where: { key: "tax_rates" } }),
      prisma.settings.findUnique({ where: { key: "other_params" } }),
    ]);

    if (payrolls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun bulletin de salaire trouvé pour cette période",
        },
        { status: 404 }
      );
    }

    // Informations Entreprise depuis Settings
    const compSettings = (companyInfoDoc?.value as any) || (companyDoc?.value as any) || {};
    const companyName = cleanText(compSettings.name || compSettings.companyName || "PROGI PAIE");
    const companyAddress = cleanText(compSettings.address || "01 BP 1115 ABIDJAN 01");
    const companyRccm = cleanText(compSettings.rccm || "CI-ABJ-2000-A-451");
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

    const doc = new jsPDF() as any;

    payrolls.forEach((payroll, index) => {
      if (index > 0) {
        doc.addPage();
      }

      const employee = payroll.user;
      const monthName = cleanText(new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" }));
      const empName = cleanText(employee?.name || "SALARIE");
      const empId = cleanText(employee?.employeeId || "001");
      const deptName = cleanText(employee?.direction || employee?.department?.name || "ADMINISTRATION");
      const serviceName = cleanText(employee?.service || "SECRETARIAT EXECUTIF");
      const jobTitle = cleanText(employee?.jobTitle || "Comptable");
      const category = cleanText(employee?.category || "1A");
      const partsIGR = employee?.partsIGR || 1.0;
      
      const rawCnps = employee?.cnpsNumber ? decryptData(employee.cnpsNumber) : "Exonéré";
      const empCnps = cleanText(rawCnps);
      const empAddress = cleanText(employee?.address || companyAddress);

      let seniorityText = "0 an";
      if (employee?.joiningDate) {
        const jDate = new Date(employee.joiningDate);
        const diffYears = Math.floor((new Date(year, month - 1).getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        seniorityText = `${Math.max(0, diffYears)} ans`;
      }
      const joiningDate = employee?.joiningDate ? cleanText(new Date(employee.joiningDate).toLocaleDateString("fr-FR")) : "01/01/2025";

      // 1. TOP HEADER
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(companyName.toUpperCase(), 14, 15);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`${companyName} • ${companyAddress}`, 14, 19);
      doc.text(`N°RCCM : ${companyRccm}   N°CC : ${companyCc}   N°CNPS : ${companyCnps}`, 14, 23);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`BULLETIN DE PAIE de : ${empName.toUpperCase()}`, 110, 15);

      doc.setFontSize(10);
      doc.text(`${monthName.toUpperCase()} ${year}`, 155, 23);

      // 2. SALARIÉ INFO BOX & CADRE VERT
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, 28, 92, 45);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`Matricule: ${empId}`, 18, 34);
      doc.text(`CNPS N°: ${empCnps}`, 18, 39);
      doc.text(`Direction: ${deptName}`, 18, 44);
      doc.text(`Service: ${serviceName}`, 18, 49);
      doc.text(`Emploi: ${jobTitle}`, 18, 54);
      doc.text(`Catégorie: ${category}`, 18, 59);
      doc.text(`Parts IGR: ${partsIGR}`, 18, 64);
      doc.text(`Date entr.: ${joiningDate} (${seniorityText})`, 18, 69);

      doc.setFillColor(187, 215, 149);
      doc.rect(110, 28, 86, 45, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`M. / Mme ${empName}`, 116, 44);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(empAddress, 116, 52);

      // 3. TABLEAU DES COMPOSANTES DE PAIE
      const baseSalary = payroll.basicSalary || 0;
      const sursalaire = payroll.sursalaire || 0;
      const transport = payroll.transportAllowance || transportExempt;
      const overtime = (payroll as any).overtimePay || 0;
      const bonuses = payroll.bonuses || 0;

      const totalBrut = baseSalary + sursalaire + overtime + bonuses;
      const brutSocial = totalBrut;
      const brutFiscal = totalBrut;

      const itsTax = payroll.itsTax || Math.round(totalBrut * 0.012);
      const cnpsEmployee = payroll.cnpsEmployee || Math.round(totalBrut * (cnpsEmployeeRate / 100));
      const cnpsEmployerRetraite = Math.round(totalBrut * (cnpsEmployerRetraiteRate / 100));
      const tfcVal = Math.round(totalBrut * (tfcRate / 100));
      const tapVal = Math.round(totalBrut * (tapRate / 100));

      const tableRows = [
        ["01", "Salaire Categoriel", fmtNum(baseSalary), "30,00", fmtNum(baseSalary), "", "", ""],
        ["02", "Sursalaire", fmtNum(sursalaire), "30,00", fmtNum(sursalaire), "", "", ""],
        ["10", "Heures Supplementaires", fmtNum(overtime), "", fmtNum(overtime), "", "", ""],
        ["15", "Primes & Gratifications", fmtNum(bonuses), "", fmtNum(bonuses), "", "", ""],
        ["30", "Total brut", "", "", fmtNum(totalBrut), "", "", ""],
        ["31", "Brut fiscal employe", "", "", "", "", "", ""],
        ["32", "Brut fiscal employeur", "", "", "", "", "", ""],
        ["33", "Brut social", "", "", "", "", "", ""],
        ["34", "ITS, Imp. sur Trait. et Sal.", "", "", "", "", "1.20", fmtNum(itsTax)],
        ["35", `CNPS Retraite Salarie (${cnpsEmployeeRate}%)`, "", "", "", fmtNum(cnpsEmployee), "", ""],
        ["36", `CNPS Retraite Patronale (${cnpsEmployerRetraiteRate}%)`, "", "", "", "", cnpsEmployerRetraiteRate.toFixed(2), fmtNum(cnpsEmployerRetraite)],
        ["38", `FDFP Taxe Apprentissage`, "", "", "", "", tapRate.toFixed(2), fmtNum(tapVal)],
        ["39", `FDFP Taxe Forma. Continue`, "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["40", `FDFP TFC a regulariser`, "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["22", "Prime Transport non impos.", fmtNum(transport), "30,00", fmtNum(transport), "", "", ""],
      ];

      autoTable(doc, {
        startY: 78,
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
      });

      const finalTableY = (doc as any).lastAutoTable?.finalY || 190;

      // 4. BANDE VERTE NET À PAYER
      const netSalaryVal = payroll.netSalary || totalBrut;

      doc.setFillColor(187, 215, 149);
      doc.rect(14, finalTableY + 4, 182, 12, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("NET A PAYER :", 115, finalTableY + 12);
      doc.text(`${fmtNumZero(netSalaryVal)} FCFA`, 152, finalTableY + 12);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Periode: du 01/${month < 10 ? "0" + month : month}/${year} au 30/${month < 10 ? "0" + month : month}/${year}   Date de paie: 31/${month < 10 ? "0" + month : month}/${year}   Mode de paie: Virement`, 14, finalTableY + 22);

      // 5. CUMULS TABLE FOOTER
      const cumulsRows = [
        ["Periode", `${payroll.presentDays || 173} h`, "2.2", "0", "2.2", `${fmtNumZero(brutSocial)} F`, `${fmtNumZero(brutFiscal)} F`, `${fmtNumZero(itsTax)} F`, `${fmtNumZero(cnpsEmployee)} F`, ""],
        ["Annee", `${(payroll.presentDays || 173) * month} h`, `${(2.2 * month).toFixed(1)}`, "0", `${(2.2 * month).toFixed(1)}`, `${fmtNumZero(brutSocial * month)} F`, `${fmtNumZero(brutFiscal * month)} F`, `${fmtNumZero(itsTax * month)} F`, `${fmtNumZero(cnpsEmployee * month)} F`, ""]
      ];

      autoTable(doc, {
        startY: finalTableY + 26,
        head: [["CUMULS", "Heures", "Conges Acquis", "Pris", "a Prendre", "Brut Social", "Brut Fiscal", "ITS", "Retraite", "Emargement"]],
        body: cumulsRows,
        theme: "grid",
        headStyles: { fillColor: [230, 230, 230], textColor: [30, 30, 30], fontSize: 6.5, halign: "center" },
        bodyStyles: { fontSize: 6.5, halign: "center" },
      });

      const finalFooterY = (doc as any).lastAutoTable?.finalY || 250;
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("Pour vous aider a faire valoir vos droits, conservez ce bulletin de paie sans limitation de duree.", 30, finalFooterY + 8);
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bulletins-paie-${month}-${year}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export bulk payslips error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Echec du telechargement des bulletins de salaire",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
