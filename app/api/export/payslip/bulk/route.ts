import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { decryptData } from "@/lib/crypto";
import { RateService } from "@/lib/rate-service";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import { DEFAULT_PAYSLIP_APPEARANCE, DEFAULT_PAYSLIP_LEGAL } from "@/lib/payslip-config";
import { calculatePayslip } from "@/lib/domain/payroll";
import { legacyRatesToTaxRatesConfig, isModularEngineEnabled } from "@/lib/domain/payroll/adapters/legacy-rates-adapter";
import { compareDoubleRun, logDoubleRunResult } from "@/lib/domain/payroll/adapters/double-run-service";

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

    // Configuration globale par défaut pour la boucle
    const configService = PayslipConfigService.getInstance();
    const [globalAppearance, globalLegal, rates] = await Promise.all([
      configService.getAppearance(),
      configService.getLegal(),
      RateService.getInstance().getRates(),
    ]);

    const doc = new jsPDF() as any;

    for (const [index, payroll] of payrolls.entries()) {
      if (index > 0) {
        doc.addPage();
      }

      // Gestion de la configuration (Snapshot vs Global)
      let appearanceConfig = globalAppearance;
      let legalConfig = globalLegal;
      let employeeRates = rates;

      if (payroll.status === "finalized" && payroll.configSnapshotId) {
        const snapshotData = await configService.getConfigFromSnapshot(payroll.configSnapshotId);
        if (snapshotData) {
          appearanceConfig = snapshotData.appearance;
          legalConfig = snapshotData.legal;
          employeeRates = snapshotData.rates;
        }
      }

      const cnpsEmployeeRate = employeeRates.cnpsEmployeeRetraite;
      const cnpsEmployerRetraiteRate = employeeRates.cnpsEmployerRetraite;
      const tfcRate = employeeRates.fdfpFPC;
      const tapRate = employeeRates.fdfpTA;
      const transportExempt = employeeRates.transportExemptAmount;
      const cmuTotal = employeeRates.cmuBase;
      const cmuEmployeeVal = Math.round(cmuTotal * (employeeRates.cmuEmployeeRate / 100));
      const cmuEmployerVal = Math.round(cmuTotal * (employeeRates.cmuEmployerRate / 100));

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

      // 1. TOP HEADER (Format Officiel Capture 1 LOGIPAIE RH)
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(companyName.toUpperCase(), 14, 14 + headerYOffset);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`${companyName}`, 14, 18 + headerYOffset);
      doc.text(`${companyAddress}`, 14, 22 + headerYOffset);
      doc.text(`N°RCCM : ${companyRccm}    N°CC : ${companyCc}`, 14, 26 + headerYOffset);
      doc.text(`N°CNPS : ${companyCnps}`, 14, 30 + headerYOffset);

      // Titre Bulletin à droite (BULLETIN DE PAIE / SOLDE DE TOUT COMPTE)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(cleanText(appearanceConfig.headerTitle || "BULLETIN DE PAIE"), 125, 15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (appearanceConfig.headerSubtitle) {
        doc.text(cleanText(appearanceConfig.headerSubtitle), 125, 21);
      }
      doc.text(`${monthName.toUpperCase()} ${year}`, 165, 21);

      // 2. CADRE INFOS SALARIÉ À GAUCHE & CADRE D'APPARENCE À DROITE
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

      // Cadre d'apparence salarié à droite (couleur dynamique)
      const rgbColor = hexToRgb(appearanceConfig.primaryColor || "#BBD795");
      doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
      doc.rect(110, 28, 86, 45, "F");

      const yiqBox = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
      const contrastTextColor = yiqBox >= 128 ? [30, 30, 30] : [255, 255, 255];

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
      doc.text(`M. / Mme ${empName}`, 116, 44);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(contrastTextColor[0], contrastTextColor[1], contrastTextColor[2]);
      doc.text(empAddress, 116, 52);

      // 3. TABLEAU DES COMPOSANTES DE PAIE
      const baseSalary = payroll.basicSalary || 0;
      const sursalaire = payroll.sursalaire || 0;
      const transport = payroll.transportAllowance || transportExempt;
      const overtime = (payroll as any).overtimePay || 0;
      const bonuses = payroll.bonuses || 0;

      const seniorityVal = (payroll as any).seniorityBonus || 0;
      const totalBrut = baseSalary + sursalaire + overtime + bonuses + seniorityVal;
      const brutSocial = totalBrut;
      const brutFiscal = totalBrut;

      let itsTax = payroll.itsTax || Math.round(totalBrut * (employeeRates.itsRate / 100));
      let cnpsEmployee = payroll.cnpsEmployee || Math.round(totalBrut * (cnpsEmployeeRate / 100));
      let cnpsEmployerRetraite = Math.round(totalBrut * (cnpsEmployerRetraiteRate / 100));
      let tfcVal = Math.round(totalBrut * (tfcRate / 100));
      let tapVal = Math.round(totalBrut * (tapRate / 100));
      let cnpsEmployerATVal = Math.round(totalBrut * 0.03);
      let cnpsEmployerPFVal = Math.round(totalBrut * 0.0575);

      let totalGains = totalBrut + transport;
      let totalRetenuesSal = itsTax + cnpsEmployee;
      let totalRetenuesPat = cnpsEmployerRetraite + tfcVal + tapVal + cnpsEmployerATVal + cnpsEmployerPFVal;

      // ─── PHASES 1 & 4 : DOUBLE RUN & ENGINE SWITCH (BULK) ──────────────────────
      const domainTaxConfig = legacyRatesToTaxRatesConfig(employeeRates);
      const modularInput = {
        employee: {
          id: employee?.id || "EMP",
          name: empName,
          employeeId: empId,
          baseSalary,
          sursalaire,
          transportAllowance: transport,
          category,
          partsIGR,
          cnpsNumber: empCnps,
          joiningDate: employee?.joiningDate ? employee.joiningDate.toISOString() : new Date().toISOString(),
          contractType: (employee?.contractType as any) || "CDI",
          isExpatriate: false,
          departmentName: deptName,
          jobTitle,
        },
        month,
        year,
        variables: {
          overtimeHours: 0,
          overtimeRate: 0,
          bonuses: bonuses ? [{ label: "Primes", amount: bonuses, isTaxable: true }] : [],
          absenceDays: 0,
          loanDeduction: 0,
        },
      };

      const modularRes = calculatePayslip(modularInput, domainTaxConfig);

      const doubleRun = compareDoubleRun(
        {
          totalBrut,
          itsTax,
          cnpsEmployee,
          cnpsEmployerRetraite,
          cnpsEmployerAT: cnpsEmployerATVal,
          cnpsEmployerPF: cnpsEmployerPFVal,
          fdfpTA: tapVal,
          fdfpTFC: tfcVal,
          totalGains,
          totalRetenuesSal,
          totalRetenuesPat,
          netSalary: payroll.netSalary || (totalGains - totalRetenuesSal - (employeeRates.showCMU !== false ? cmuEmployeeVal : 0)),
        },
        {
          totalBrut: modularRes.grossSalary,
          itsTax: modularRes.taxDeductions.its,
          cnpsEmployee: modularRes.employeeContributions.cnpsRetirement,
          cnpsEmployerRetraite: modularRes.employerContributions.cnpsRetirement,
          cnpsEmployerAT: modularRes.employerContributions.cnpsAccident,
          cnpsEmployerPF: modularRes.employerContributions.cnpsFamily,
          fdfpTA: modularRes.employerContributions.fdfpTA,
          fdfpTFC: modularRes.employerContributions.fdfpTFC,
          totalGains: modularRes.grossSalary + modularRes.transportAllowance,
          totalRetenuesSal: modularRes.totalDeductions,
          totalRetenuesPat: modularRes.employerContributions.totalEmployer,
          netSalary: modularRes.netSalary,
        }
      );

      logDoubleRunResult(empId, month, year, doubleRun);

      if (isModularEngineEnabled()) {
        itsTax = modularRes.taxDeductions.its;
        cnpsEmployee = modularRes.employeeContributions.cnpsRetirement;
        cnpsEmployerRetraite = modularRes.employerContributions.cnpsRetirement;
        cnpsEmployerATVal = modularRes.employerContributions.cnpsAccident;
        cnpsEmployerPFVal = modularRes.employerContributions.cnpsFamily;
        tapVal = modularRes.employerContributions.fdfpTA;
        tfcVal = modularRes.employerContributions.fdfpTFC;
        totalGains = modularRes.grossSalary + modularRes.transportAllowance;
        totalRetenuesSal = modularRes.totalDeductions;
        totalRetenuesPat = modularRes.employerContributions.totalEmployer;
      }

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
        ...(employeeRates.showCMU !== false ? [
          ["37b", "CMU. Couverture Maladie Univ.", fmtNumZero(cmuTotal), `${employeeRates.cmuEmployeeRate.toFixed(2)}%`, "", fmtNumZero(cmuEmployeeVal), `${employeeRates.cmuEmployerRate.toFixed(2)}%`, fmtNumZero(cmuEmployerVal)]
        ] : []),
        ["38", "FDFR. Taxe Apprentissage", "", "", "", "", tapRate.toFixed(2), fmtNum(tapVal)],
        ["39", "FDFR. Taxe Form. Continue", "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["40", "FDFR. TFC a regulariser", "", "", "", "", tfcRate.toFixed(2), fmtNum(tfcVal)],
        ["22", "Prime Transport non impos.", fmtNumZero(transportExempt), "30,00", fmtNumZero(transportExempt), "", "", ""],
        ["", "", "", "", fmtNumZero(totalGains), fmtNumZero(totalRetenuesSal + (employeeRates.showCMU !== false ? cmuEmployeeVal : 0)), "", fmtNumZero(totalRetenuesPat + (employeeRates.showCMU !== false ? cmuEmployerVal : 0))],
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
          const table = data.table;
          const startY = data.settings.startY || 88;
          const finalY = data.cursor?.y || 195;
          const left = 14;
          const right = 196;

          doc.setLineWidth(0.3);
          doc.setDrawColor(100, 100, 100);

          doc.rect(left, startY, right - left, finalY - startY);

          const headerHeight = 8;
          doc.line(left, startY + headerHeight, right, startY + headerHeight);
          doc.line(left, startY + 13, right, startY + 13);
          doc.line(left, finalY - 4.5, right, finalY - 4.5);

          const colX = [14, 24, 78, 98, 116, 136, 156, 174, 196];
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
      const netSalaryVal = payroll.netSalary || (totalGains - totalRetenuesSal - (employeeRates.showCMU !== false ? cmuEmployeeVal : 0));

      // 4. BANDE NET À PAYER (couleur dynamique)
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
      doc.text(`Periode: du 01/${month < 10 ? "0" + month : month}/${year} au 30/${month < 10 ? "0" + month : month}/${year}    Date de paie: 31/${month < 10 ? "0" + month : month}/${year}    Mode de paie: Virement`, 20, finalTableY + 14);

      // 5. CUMULS TABLE FOOTER
      const hoursPeriode = payroll.presentDays ? (payroll.presentDays).toFixed(2).replace(".", ",") : "173,33";
      const hoursAnnee = payroll.presentDays ? Math.round(payroll.presentDays * month).toString() : "173";

      const cumulsRows = [
        ["Periode", hoursPeriode, "acquis", "pris", "a Prendre", `${fmtNumZero(brutSocial)}`, `${fmtNumZero(brutFiscal)}`, `${fmtNumZero(itsTax)}`, `${fmtNumZero(cnpsEmployee)}`, ""],
        ["Annee", hoursAnnee, "", "", "", `${fmtNumZero(brutSocial * month)}`, `${fmtNumZero(brutFiscal * month)}`, `${fmtNumZero(itsTax * month)}`, `${fmtNumZero(cnpsEmployee * month)}`, ""]
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
    }

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
