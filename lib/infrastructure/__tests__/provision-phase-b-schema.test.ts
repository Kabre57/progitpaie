import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readSchemaFiles = (dir: string): string => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.reduce((acc, entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return acc + "\n" + readSchemaFiles(fullPath);
    } else if (entry.name.endsWith(".prisma")) {
      return acc + "\n" + fs.readFileSync(fullPath, "utf8");
    }
    return acc;
  }, "");
};
const schema = readSchemaFiles(path.join(root, "prisma/schema"));
const migration = fs.readFileSync(
  path.join(
    root,
    "prisma/migrations/20260803172000_add_provision_ledger_and_snapshots/migration.sql"
  ),
  "utf8"
);

describe("Phase B provisions — contrats de persistance", () => {
  it.each([
    "model LeaveLedgerEntry",
    "model PayrollEarningLine",
    "model ProvisionCalculationSnapshot",
  ])("déclare %s dans Prisma", (model) => {
    expect(schema).toContain(model);
  });

  it("porte companyId et une relation restrictive dans chaque nouveau modèle", () => {
    for (const table of [
      "leave_ledger_entries",
      "payroll_earning_lines",
      "provision_calculation_snapshots",
    ]) {
      expect(migration).toContain(`ALTER TABLE "${table}"`);
      expect(migration).toContain(`REFERENCES "companies"("id") ON DELETE RESTRICT`);
    }
  });

  it("rend les écritures issues d'une source idempotentes", () => {
    expect(schema).toContain("@@unique([companyId, sourceType, sourceId, entryType])");
  });

  it("rend les lignes de paie uniques par code", () => {
    expect(schema).toContain("@@unique([payrollId, code])");
  });

  it("interdit qu'un remboursement entre dans une assiette de provision", () => {
    expect(migration).toContain("payroll_earning_lines_expense_check");
    expect(migration).toContain('NOT "includedInLeaveBase" AND NOT "includedInTerminationBase"');
  });

  it("préserve le solde historique lors du rejeu des congés approuvés", () => {
    expect(migration).toContain('u."leaveBalanceAnnual" + COALESCE(c.days, 0)');
    expect(migration).toContain("'LEAVE_CONSUMED'");
  });

  it("marque les classifications historiques ambiguës comme estimées", () => {
    expect(migration).toContain("LEGACY_AGGREGATE_ESTIMATE");
    expect(migration).toContain("LEGACY_DEFAULT_EXPENSE");
  });

  it("stocke les montants et jours en Decimal PostgreSQL", () => {
    expect(schema).toContain("@db.Decimal(10, 4)");
    expect(migration.match(/Decimal\(18,\s*2\)/gi)?.length).toBeGreaterThanOrEqual(4);
  });

  it("audite l'isolation tenant avant de valider la transaction", () => {
    expect(migration).toContain("Isolation tenant");
    expect(migration).toContain("RAISE EXCEPTION");
  });
});
