import { prisma } from "@/lib/db";
import { decryptData } from "@/lib/crypto";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import { DEFAULT_PAYSLIP_APPEARANCE, DEFAULT_PAYSLIP_LEGAL } from "@/lib/payslip-config";
import { RateService } from "@/lib/rate-service";
import { generatePayslipPdf } from "./builders/payslip-pdf-builder";

export interface GeneratePayslipParams {
  userId: string;
  month: number;
  year: number;
  companyId: string;
}

export interface GenerateBulkPayslipsParams {
  month: number;
  year: number;
  companyId: string;
}

interface CompanySettingsRecord {
  name?: string;
  companyName?: string;
  address?: string;
  rccm?: string;
  taxNumber?: string;
  cnpsNumber?: string;
}

function calculateConfiguredIts(gross: number, brackets: Array<{ min: number; max: number | null; rate: number }>): number {
  return brackets.reduce((tax, bracket) => {
    const upper = bracket.max ?? gross;
    const taxableSlice = Math.max(0, Math.min(gross, upper) - bracket.min + (bracket.min === 0 ? 0 : 1));
    return tax + Math.round(taxableSlice * (bracket.rate / 100));
  }, 0);
}

export class PayslipPdfService {
  private static instance: PayslipPdfService;

  public static getInstance(): PayslipPdfService {
    if (!PayslipPdfService.instance) {
      PayslipPdfService.instance = new PayslipPdfService();
    }
    return PayslipPdfService.instance;
  }

  public async generatePayslipBuffer(params: GeneratePayslipParams): Promise<{ buffer: Buffer; filename: string }> {
    const { userId, month, year, companyId } = params;

    const [employee, payroll, companyDoc, companyInfoDoc, prevPayrollsThisYear] = await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, companyId },
        include: { department: true },
      }),
      prisma.payroll.findFirst({
        where: { userId, month, year, companyId },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
      }),
      prisma.settings.findUnique({
        where: { key: "company" },
      }),
      prisma.payroll.findMany({
        where: { userId, year, companyId, month: { lte: month } },
      }),
    ]);

    if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");
    if (!payroll) throw new Error("PAYROLL_NOT_FOUND");

    const compSettings = ((companyInfoDoc?.value as CompanySettingsRecord | undefined) ||
      (companyDoc as unknown as CompanySettingsRecord | undefined)) || {};
    const companyName = compSettings.name || compSettings.companyName || "LOGIPAIE RH 21";
    const companyAddress = compSettings.address || "BP 5115 ABIDJAN 01";
    const companyRccm = compSettings.rccm || "CI-ABJ-3000-A-451";
    const companyCc = compSettings.taxNumber || "1234567 A";
    const companyCnps = compSettings.cnpsNumber || "123456";

    const configService = PayslipConfigService.getInstance();
    let appearanceConfig = DEFAULT_PAYSLIP_APPEARANCE;
    let legalConfig = DEFAULT_PAYSLIP_LEGAL;
    let rates = await RateService.getInstance().getRates();
    const parametricConfig = await configService.getParametric(companyId);

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

    const configuredContributions = parametricConfig.contributions;
    const cnpsEmployeeRate = configuredContributions.cnpsRetraiteEmployeeRate ?? rates.cnpsEmployeeRetraite;
    const cnpsEmployerRetraiteRate = configuredContributions.cnpsRetraiteEmployerRate ?? rates.cnpsEmployerRetraite;
    const tfcRate = configuredContributions.fdfpFormationRate ?? rates.fdfpFPC;
    const tapRate = configuredContributions.fdfpApprentissageRate ?? rates.fdfpTA;
    const transportExempt = parametricConfig.other.transportExemptionCeiling ?? rates.transportExemptAmount;
    const showCMU = rates.showCMU !== false;
    const cmuBase = rates.cmuBase ?? 1000;
    const cmuEmployee = showCMU ? Math.round(cmuBase * ((rates.cmuEmployeeRate ?? 50) / 100)) : 0;
    const cmuEmployer = showCMU ? Math.round(cmuBase * ((rates.cmuEmployerRate ?? 50) / 100)) : 0;

    const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" });
    const empName = employee.name || "Collaborateur";
    const civility = employee.civility || "M.";
    const empId = employee.employeeId || "001";
    const deptName = employee.direction || employee.department?.name || "ADMINISTRATION";
    const serviceName = employee.service || "SECRETARIAT EXECUTIF";
    const jobTitle = employee.jobTitle || "Comptable";
    const category = employee.category || "1A";
    const partsIGR = employee.partsIGR || 4.5;

    const rawCnps = employee.cnpsNumber ? decryptData(employee.cnpsNumber) : "Exonéré";
    const empCnps = rawCnps;
    const empAddress = employee.address || "BP 5115 ABIDJAN 01";

    let seniorityText = "4 ans";
    if (employee.joiningDate) {
      const jDate = new Date(employee.joiningDate);
      const diffYears = Math.floor((new Date(year, month - 1).getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      seniorityText = `${Math.max(0, diffYears)} ans`;
    }
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("fr-FR") : "01/02/2020";

    const baseSalary = payroll.basicSalary || 0;
    const sursalaire = payroll.sursalaire || 0;
    const transport = payroll.transportAllowance || transportExempt;

    const payrollRecord = payroll as unknown as Record<string, number | undefined>;
    const overtime = payrollRecord.overtimePay || 0;
    const bonuses = payroll.bonuses || 0;
    const seniorityVal = payrollRecord.seniorityBonus || 0;

    const totalBrut = baseSalary + sursalaire + overtime + bonuses + seniorityVal;
    const brutSocial = totalBrut;

    const itsTax = payroll.itsTax || calculateConfiguredIts(totalBrut, parametricConfig.taxBrackets);
    const cnpsEmployee = payroll.cnpsEmployee || Math.round(brutSocial * (cnpsEmployeeRate / 100));
    const cnpsEmployerRetraite = Math.round(brutSocial * (cnpsEmployerRetraiteRate / 100));
    const tfcVal = Math.round(brutSocial * (tfcRate / 100));
    const tapVal = Math.round(brutSocial * (tapRate / 100));
    const cnpsEmployerATVal = Math.round(brutSocial * 0.03);
    const cnpsEmployerPFVal = Math.round(brutSocial * 0.0575);

    const cumulativeGrossThisYear = prevPayrollsThisYear.reduce((acc, p) => acc + (p.grossSalary || 0), 0);
    const cumulativeNetThisYear = prevPayrollsThisYear.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const cumulativeItsThisYear = prevPayrollsThisYear.reduce((acc, p) => acc + (p.itsTax || 0), 0);
    const cumulativeCnpsThisYear = prevPayrollsThisYear.reduce((acc, p) => acc + (p.cnpsEmployee || 0), 0);

    const buffer = generatePayslipPdf({
      companyName,
      companyAddress,
      companyRccm,
      companyCc,
      companyCnps,
      appearanceConfig,
      legalConfig,
      monthName,
      year,
      empId,
      empCnps,
      deptName,
      serviceName,
      jobTitle,
      category,
      partsIGR,
      joiningDate,
      seniorityText,
      civility,
      empName,
      empAddress,
      parametricConfig,
      baseSalary,
      sursalaire,
      transport,
      overtime,
      bonuses,
      seniorityVal,
      itsTax,
      cnpsEmployee,
      cmuBase,
      cmuEmployee,
      cmuEmployer,
      showCMU,
      cnpsEmployerRetraite,
      tfcVal,
      tapVal,
      cnpsEmployerATVal,
      cnpsEmployerPFVal,
      cumulativeGrossThisYear,
      cumulativeNetThisYear,
      cumulativeItsThisYear,
      cumulativeCnpsThisYear,
    });

    const safeEmpName = empName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Bulletin_${safeEmpName}_${month}_${year}.pdf`;

    return { buffer, filename };
  }

  public async generateBulkPayslipsBuffer(params: GenerateBulkPayslipsParams): Promise<{ buffer: Buffer; filename: string; count: number }> {
    const { month, year, companyId } = params;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year, companyId },
      select: { userId: true },
      orderBy: { user: { name: "asc" } },
    });

    if (payrolls.length === 0) {
      throw new Error("NO_PAYROLLS_FOUND");
    }

    const buffers: Buffer[] = [];
    for (const p of payrolls) {
      const { buffer } = await this.generatePayslipBuffer({
        userId: p.userId,
        month,
        year,
        companyId,
      });
      buffers.push(buffer);
    }

    const combinedBuffer = Buffer.concat(buffers);
    const filename = `Bulletins_Paie_Global_${month}_${year}.pdf`;

    return { buffer: combinedBuffer, filename, count: payrolls.length };
  }
}
