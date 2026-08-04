import { LeaveLedgerEntryType, PayrollEarningCategory, PayrollStatus, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, "docs/validation/evidence/payroll/reference-provisions-2026-template.xlsx");
const OUTPUT = path.join(ROOT, "docs/validation/evidence/payroll/reference-provisions-2026.xlsx");
const CHECKSUM = path.join(ROOT, "docs/validation/evidence/payroll/reference-provisions-2026.sha256");
const REFERENCE_DATE = new Date("2026-08-03T23:59:59.999Z");
const DATASET_ID = "STAGING-PROVISIONS-2026-R1";
const SOURCE_JSON = process.env.PROVISIONS_SOURCE_JSON;

type Worksheet = XLSX.WorkSheet;

function headers(sheet: Worksheet): Map<string, number> {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  const result = new Map<string, number>();
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const value = sheet[XLSX.utils.encode_cell({ r: 0, c: column })]?.v;
    if (typeof value === "string" && value.trim()) result.set(value.trim(), column);
  }
  return result;
}

function requireColumn(columns: Map<string, number>, name: string): number {
  const column = columns.get(name);
  if (column === undefined) throw new Error(`Colonne obligatoire absente : ${name}`);
  return column;
}

function rowForCase(sheet: Worksheet, caseColumn: number, caseId: string): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  for (let row = 1; row <= range.e.r; row += 1) {
    if (sheet[XLSX.utils.encode_cell({ r: row, c: caseColumn })]?.v === caseId) return row;
  }
  throw new Error(`Cas absent du modèle : ${caseId}`);
}

function setValue(sheet: Worksheet, row: number, column: number, value: string | number | Date): void {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  if (value instanceof Date) {
    const utcMidnight = Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    sheet[address] = { t: "n", v: utcMidnight / 86_400_000 + 25_569, z: "yyyy-mm-dd" };
  } else {
    sheet[address] = { t: typeof value === "number" ? "n" : "s", v: value };
  }
}

function setFormula(sheet: Worksheet, row: number, column: number, formula: string, format?: string): void {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  sheet[address] = { t: "n", f: formula, v: 0 };
  if (format) sheet[address].z = format;
}

function caseId(employeeId: string | null): string {
  const match = employeeId?.match(/^VAL26-[AB]-(C\d{2}|B\d{2})$/);
  if (!match) throw new Error(`Matricule de validation invalide : ${employeeId ?? "NULL"}`);
  return match[1];
}

async function loadEmployees() {
  return prisma.user.findMany({
    where: { employeeId: { startsWith: "VAL26-" } },
    select: {
      id: true,
      companyId: true,
      employeeId: true,
      joiningDate: true,
      jobTitle: true,
      contracts: {
        where: { status: "active" },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { id: true, baseSalary: true, sursalaire: true, probationPeriodMonths: true },
      },
      payrolls: {
        where: { year: 2026, month: { lte: 8 } },
        orderBy: { month: "asc" },
        select: {
          id: true,
          year: true,
          month: true,
          status: true,
          finalizedAt: true,
          earningLines: {
            where: { classificationSource: DATASET_ID },
            select: {
              id: true,
              category: true,
              amount: true,
              includedInLeaveBase: true,
              includedInTerminationBase: true,
              isExpenseReimbursement: true,
            },
          },
        },
      },
      leaveLedgerEntries: {
        where: { referencePeriod: "2026", effectiveDate: { lte: REFERENCE_DATE } },
        select: { id: true, entryType: true, days: true, ruleVersion: true },
      },
    },
    orderBy: { employeeId: "asc" },
  });
}

type Employees = Awaited<ReturnType<typeof loadEmployees>>;

function numeric(value: { toNumber(): number } | string | number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

async function main(): Promise<void> {
  let employees: Employees;
  if (SOURCE_JSON) {
    const parsed = JSON.parse(await readFile(SOURCE_JSON, "utf8")) as { datasetId?: string; employees?: unknown };
    if (parsed.datasetId !== DATASET_ID || !Array.isArray(parsed.employees)) {
      throw new Error("Export source invalide ou jeu de données incorrect");
    }
    employees = parsed.employees as Employees;
  } else {
    employees = await loadEmployees();
  }

  if (employees.length !== 20) throw new Error(`20 cas attendus, ${employees.length} trouvés`);
  const workbook = XLSX.read(await readFile(TEMPLATE), { type: "buffer", cellFormula: true, cellDates: true });
  const periods = workbook.Sheets["Périodes"];
  const details = workbook.Sheets["Détails"];
  const instructions = workbook.Sheets["Instructions"];
  const controls = workbook.Sheets["Contrôles"];
  if (!periods || !details || !instructions || !controls) throw new Error("Le modèle ne contient pas les onglets obligatoires");

  const periodColumns = headers(periods);
  const detailColumns = headers(details);
  const periodCase = requireColumn(periodColumns, "Cas");
  const periodMonth = requireColumn(periodColumns, "Mois");
  const detailCase = requireColumn(detailColumns, "Cas");

  const periodInput = {
    status: requireColumn(periodColumns, "Statut paie"),
    base: requireColumn(periodColumns, "Salaire base"),
    extra: requireColumn(periodColumns, "Sursalaire"),
    bonus: requireColumn(periodColumns, "Primes éligibles"),
    other: requireColumn(periodColumns, "Autres éléments éligibles"),
    expense: requireColumn(periodColumns, "Remboursements frais"),
    leaveEligible: requireColumn(periodColumns, "Rémunération éligible congés"),
    terminationEligible: requireColumn(periodColumns, "Rémunération éligible licenciement"),
    source: requireColumn(periodColumns, "Source/justificatif"),
    comment: requireColumn(periodColumns, "Commentaire"),
  };
  const detailInput = {
    employeeId: requireColumn(detailColumns, "Matricule validation"),
    joiningDate: requireColumn(detailColumns, "Date embauche"),
    referenceDate: requireColumn(detailColumns, "Date référence"),
    seniority: requireColumn(detailColumns, "Ancienneté mois"),
    service: requireColumn(detailColumns, "Mois service effectif"),
    contractBase: requireColumn(detailColumns, "Salaire contractuel"),
    contractExtra: requireColumn(detailColumns, "Sursalaire contractuel"),
    opening: requireColumn(detailColumns, "Solde ouverture"),
    carried: requireColumn(detailColumns, "Jours reportés"),
    consumed: requireColumn(detailColumns, "Congés consommés"),
    compensated: requireColumn(detailColumns, "Congés compensés/payés"),
    status: requireColumn(detailColumns, "Statut attendu"),
    warning: requireColumn(detailColumns, "Warning/réserve"),
    source: requireColumn(detailColumns, "Source des données"),
  };

  const sourceAmount = (lines: typeof employees[number]["payrolls"][number]["earningLines"], category: PayrollEarningCategory) =>
    lines.filter((line) => line.category === category).reduce((sum, line) => sum + numeric(line.amount), 0);
  const ledgerDays = (entries: typeof employees[number]["leaveLedgerEntries"], type: LeaveLedgerEntryType) =>
    entries.filter((entry) => entry.entryType === type).reduce((sum, entry) => sum + numeric(entry.days), 0);

  for (const employee of employees) {
    const id = caseId(employee.employeeId);
    const contract = employee.contracts[0];
    if (!contract) throw new Error(`Contrat actif absent pour ${id}`);

    const detailRow = rowForCase(details, detailCase, id);
    setValue(details, detailRow, detailInput.employeeId, employee.employeeId ?? "");
    const joiningDate = new Date(employee.joiningDate);
    setValue(details, detailRow, detailInput.joiningDate, joiningDate);
    setValue(details, detailRow, detailInput.referenceDate, REFERENCE_DATE);
    const excelRow = detailRow + 1;
    const joiningAddress = XLSX.utils.encode_cell({ r: detailRow, c: detailInput.joiningDate });
    const referenceAddress = XLSX.utils.encode_cell({ r: detailRow, c: detailInput.referenceDate });
    setFormula(details, detailRow, detailInput.seniority, `IF(${joiningAddress}>${referenceAddress},0,DATEDIF(${joiningAddress},${referenceAddress},"m"))`, "0.00");
    setFormula(details, detailRow, detailInput.service, `IF(${joiningAddress}>${referenceAddress},0,ROUND(((${referenceAddress}-MAX(${joiningAddress},DATE(YEAR(${referenceAddress}),1,1)))+1)/30,4))`, "0.0000");
    setValue(details, detailRow, detailInput.contractBase, contract.baseSalary);
    setValue(details, detailRow, detailInput.contractExtra, contract.sursalaire);
    setValue(details, detailRow, detailInput.opening, ledgerDays(employee.leaveLedgerEntries, LeaveLedgerEntryType.OPENING_BALANCE));
    setValue(details, detailRow, detailInput.carried, ledgerDays(employee.leaveLedgerEntries, LeaveLedgerEntryType.CARRY_FORWARD));
    setValue(details, detailRow, detailInput.consumed, ledgerDays(employee.leaveLedgerEntries, LeaveLedgerEntryType.LEAVE_CONSUMED));
    setValue(details, detailRow, detailInput.compensated, ledgerDays(employee.leaveLedgerEntries, LeaveLedgerEntryType.LEAVE_COMPENSATED));
    setValue(details, detailRow, detailInput.status, id === "C18" ? "NOT_APPLICABLE" : "À VALIDER");
    const warning = id === "C13"
      ? "Historique incomplet : 4 paies finalisées"
      : id === "C14"
        ? "Aucune paie finalisée : fallback contractuel"
        : id === "C18"
          ? "Exclu : embauche postérieure à la date de référence"
          : "";
    setValue(details, detailRow, detailInput.warning, warning);
    setValue(details, detailRow, detailInput.source, `DB:${employee.id};CONTRACT:${contract.id};LEDGER:${employee.leaveLedgerEntries.map(({ id: ledgerId }) => ledgerId).join("|") || "NONE"}`);

    for (let row = 1; row <= XLSX.utils.decode_range(periods["!ref"] ?? "A1:A1").e.r; row += 1) {
      if (periods[XLSX.utils.encode_cell({ r: row, c: periodCase })]?.v !== id) continue;
      const month = Number(periods[XLSX.utils.encode_cell({ r: row, c: periodMonth })]?.v);
      const payroll = employee.payrolls.find((item) => item.month === month);
      if (id === "C18" || month > 8) {
        setValue(periods, row, periodInput.status, "NOT_APPLICABLE");
        setValue(
          periods,
          row,
          periodInput.comment,
          id === "C18"
            ? "Employé exclu : embauche postérieure à la référence"
            : "Hors période de validation janvier-août 2026"
        );
        continue;
      }
      if (!payroll) {
        setValue(periods, row, periodInput.status, "NO_PAYROLL");
        setValue(periods, row, periodInput.comment, id === "C14" ? "Fallback contractuel" : "Aucune paie source pour ce mois");
        continue;
      }
      const lines = payroll.earningLines;
      const isAdmissible = payroll.status === PayrollStatus.finalized
        && payroll.finalizedAt !== null
        && new Date(payroll.finalizedAt) <= REFERENCE_DATE;
      if (lines.length === 0) {
        if (isAdmissible) throw new Error(`Ventilation absente pour la paie finalisée ${id}/${month}`);
        setValue(periods, row, periodInput.status, "DRAFT");
        setValue(periods, row, periodInput.source, `DB:${payroll.id};LINES:NONE`);
        setValue(periods, row, periodInput.comment, "Paie brouillon sans ventilation, exclue des assiettes");
        continue;
      }
      const base = sourceAmount(lines, PayrollEarningCategory.BASE_SALARY);
      const extra = sourceAmount(lines, PayrollEarningCategory.SURSALAIRE);
      const bonus = sourceAmount(lines, PayrollEarningCategory.BONUS);
      const expense = lines.filter(({ isExpenseReimbursement }) => isExpenseReimbursement).reduce((sum, line) => sum + numeric(line.amount), 0);
      const knownCategories = new Set([PayrollEarningCategory.BASE_SALARY, PayrollEarningCategory.SURSALAIRE, PayrollEarningCategory.BONUS]);
      const other = lines.filter((line) => !line.isExpenseReimbursement && !knownCategories.has(line.category)).reduce((sum, line) => sum + numeric(line.amount), 0);
      setValue(periods, row, periodInput.status, isAdmissible ? "FINALIZED" : "DRAFT");
      setValue(periods, row, periodInput.base, base);
      setValue(periods, row, periodInput.extra, extra);
      setValue(periods, row, periodInput.bonus, bonus);
      setValue(periods, row, periodInput.other, other);
      setValue(periods, row, periodInput.expense, expense);
      const excelPeriodRow = row + 1;
      const status = XLSX.utils.encode_cell({ r: row, c: periodInput.status });
      const baseCell = XLSX.utils.encode_cell({ r: row, c: periodInput.base });
      const extraCell = XLSX.utils.encode_cell({ r: row, c: periodInput.extra });
      const bonusCell = XLSX.utils.encode_cell({ r: row, c: periodInput.bonus });
      const otherCell = XLSX.utils.encode_cell({ r: row, c: periodInput.other });
      setFormula(periods, row, periodInput.leaveEligible, `IF(${status}="FINALIZED",ROUND(${baseCell}+${extraCell}+${bonusCell}+${otherCell},0),0)`, "#,##0");
      setFormula(periods, row, periodInput.terminationEligible, `IF(${status}="FINALIZED",ROUND(${baseCell}+${extraCell}+${bonusCell}+${otherCell},0),0)`, "#,##0");
      setValue(periods, row, periodInput.source, `DB:${payroll.id};LINES:${lines.map(({ id: lineId }) => lineId).join("|")}`);
      setValue(
        periods,
        row,
        periodInput.comment,
        isAdmissible
          ? `Paie finalisée source — ligne ${excelPeriodRow}`
          : `Paie brouillon exclue des assiettes — ligne ${excelPeriodRow}`
      );
    }
  }

  // La signature reste volontairement vide. Le responsable paie la renseigne après contrôle.
  const instructionRows = XLSX.utils.sheet_to_json<(string | number)[]>(instructions, { header: 1, raw: true });
  for (let index = 0; index < instructionRows.length; index += 1) {
    const label = instructionRows[index]?.[0];
    if (["Nom et prénom", "Fonction", "Date de préparation", "Date d'approbation", "Signature/paraphe", "Réserves"].includes(String(label))) {
      setValue(instructions, index, 1, "À COMPLÉTER MANUELLEMENT");
    }
  }
  const controlRows = XLSX.utils.sheet_to_json<(string | number)[]>(controls, { header: 1, raw: true });
  for (let index = 1; index < controlRows.length; index += 1) {
    setValue(controls, index, 1, "À VALIDER");
  }

  workbook.CalcPr = { calcMode: "auto", fullCalcOnLoad: true, forceFullCalc: true };
  XLSX.writeFile(workbook, OUTPUT, { compression: true });
  const digest = createHash("sha256").update(await readFile(OUTPUT)).digest("hex");
  await writeFile(CHECKSUM, `${digest}  reference-provisions-2026.xlsx\n`, "utf8");
  process.stdout.write(JSON.stringify({
    status: "GENERATED_UNSIGNED",
    source: DATASET_ID,
    cases: employees.length,
    output: OUTPUT,
    sha256: digest,
  }, null, 2) + "\n");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Erreur inconnue");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
