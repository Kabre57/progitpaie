-- Phase B — Registre de congés, ventilation des rémunérations et snapshots.
-- Cette migration est transactionnelle et conserve les agrégats historiques.

CREATE TYPE "LeaveLedgerEntryType" AS ENUM (
  'OPENING_BALANCE', 'ACCRUAL', 'SENIORITY_BONUS', 'LEAVE_CONSUMED',
  'LEAVE_COMPENSATED', 'CARRY_FORWARD', 'EXPIRATION', 'MANUAL_ADJUSTMENT'
);

CREATE TYPE "LeaveLedgerSourceType" AS ENUM (
  'MIGRATION', 'LEAVE_REQUEST', 'PAYROLL', 'SEVERANCE', 'ANNUAL_CLOSING', 'MANUAL'
);

CREATE TYPE "PayrollEarningCategory" AS ENUM (
  'BASE_SALARY', 'SURSALAIRE', 'BONUS', 'ALLOWANCE', 'OVERTIME', 'EXPENSE_REIMBURSEMENT'
);

CREATE TYPE "ProvisionSnapshotStatus" AS ENUM ('DRAFT', 'FINALIZED');

CREATE TABLE "leave_ledger_entries" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "referencePeriod" TEXT NOT NULL,
  "entryType" "LeaveLedgerEntryType" NOT NULL,
  "days" DECIMAL(10,4) NOT NULL,
  "sourceType" "LeaveLedgerSourceType" NOT NULL,
  "sourceId" TEXT,
  "ruleVersion" TEXT NOT NULL,
  "createdById" TEXT,
  "reason" TEXT,
  "isEstimated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leave_ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "leave_ledger_entries_days_check" CHECK ("days" >= 0)
);

CREATE TABLE "payroll_earning_lines" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "payrollId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "category" "PayrollEarningCategory" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "includedInLeaveBase" BOOLEAN NOT NULL,
  "includedInTerminationBase" BOOLEAN NOT NULL,
  "isExpenseReimbursement" BOOLEAN NOT NULL DEFAULT false,
  "classificationSource" TEXT NOT NULL,
  "isEstimated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payroll_earning_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_earning_lines_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "payroll_earning_lines_expense_check" CHECK (
    NOT "isExpenseReimbursement"
    OR (NOT "includedInLeaveBase" AND NOT "includedInTerminationBase")
  )
);

CREATE TABLE "provision_calculation_snapshots" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "referenceDate" TIMESTAMP(3) NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "resultJson" JSONB NOT NULL,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "status" "ProvisionSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
  "totalLeaveProvision" DECIMAL(18,2) NOT NULL,
  "totalTerminationExposure" DECIMAL(18,2) NOT NULL,
  "totalExposure" DECIMAL(18,2) NOT NULL,
  "calculatedById" TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizedAt" TIMESTAMP(3),
  CONSTRAINT "provision_calculation_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provision_snapshots_warning_count_check" CHECK ("warningCount" >= 0),
  CONSTRAINT "provision_snapshots_totals_check" CHECK (
    "totalLeaveProvision" >= 0
    AND "totalTerminationExposure" >= 0
    AND "totalExposure" >= 0
  )
);

CREATE UNIQUE INDEX "leave_ledger_entries_companyId_sourceType_sourceId_entryType_key"
  ON "leave_ledger_entries"("companyId", "sourceType", "sourceId", "entryType");
CREATE INDEX "leave_ledger_entries_companyId_userId_effectiveDate_idx"
  ON "leave_ledger_entries"("companyId", "userId", "effectiveDate");
CREATE INDEX "leave_ledger_entries_companyId_referencePeriod_idx"
  ON "leave_ledger_entries"("companyId", "referencePeriod");

CREATE UNIQUE INDEX "payroll_earning_lines_payrollId_code_key"
  ON "payroll_earning_lines"("payrollId", "code");
CREATE INDEX "payroll_earning_lines_companyId_payrollId_idx"
  ON "payroll_earning_lines"("companyId", "payrollId");
CREATE INDEX "payroll_earning_lines_companyId_category_idx"
  ON "payroll_earning_lines"("companyId", "category");

CREATE UNIQUE INDEX "provision_snapshots_companyId_referenceDate_ruleVersion_inputHash_key"
  ON "provision_calculation_snapshots"("companyId", "referenceDate", "ruleVersion", "inputHash");
CREATE INDEX "provision_calculation_snapshots_companyId_referenceDate_idx"
  ON "provision_calculation_snapshots"("companyId", "referenceDate");
CREATE INDEX "provision_calculation_snapshots_companyId_status_idx"
  ON "provision_calculation_snapshots"("companyId", "status");

ALTER TABLE "leave_ledger_entries"
  ADD CONSTRAINT "leave_ledger_entries_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_ledger_entries"
  ADD CONSTRAINT "leave_ledger_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_ledger_entries"
  ADD CONSTRAINT "leave_ledger_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_earning_lines"
  ADD CONSTRAINT "payroll_earning_lines_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_earning_lines"
  ADD CONSTRAINT "payroll_earning_lines_payrollId_fkey"
  FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provision_calculation_snapshots"
  ADD CONSTRAINT "provision_calculation_snapshots_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provision_calculation_snapshots"
  ADD CONSTRAINT "provision_calculation_snapshots_calculatedById_fkey"
  FOREIGN KEY ("calculatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Le solde d'ouverture reconstruit inclut les congés historiques consommés :
-- leur écriture LEAVE_CONSUMED ramène ainsi le ledger au solde User existant.
WITH consumed AS (
  SELECT "companyId", "userId", COALESCE(SUM("totalDays"), 0)::DECIMAL(10,4) AS days
  FROM "leaves"
  WHERE "leaveType" = 'annual' AND status = 'approved'
  GROUP BY "companyId", "userId"
)
INSERT INTO "leave_ledger_entries" (
  "id", "companyId", "userId", "effectiveDate", "referencePeriod", "entryType",
  "days", "sourceType", "sourceId", "ruleVersion", "reason", "isEstimated"
)
SELECT
  'mig-opening-' || md5(u.id),
  u."companyId",
  u.id,
  u."joiningDate",
  'MIGRATION-2026',
  'OPENING_BALANCE',
  (u."leaveBalanceAnnual" + COALESCE(c.days, 0))::DECIMAL(10,4),
  'MIGRATION',
  u.id,
  'LEGACY-BALANCE-MIGRATION-2026.1',
  'Solde reconstitué pour préserver le solde annuel historique après rejeu des congés approuvés',
  true
FROM "users" u
LEFT JOIN consumed c ON c."companyId" = u."companyId" AND c."userId" = u.id;

INSERT INTO "leave_ledger_entries" (
  "id", "companyId", "userId", "effectiveDate", "referencePeriod", "entryType",
  "days", "sourceType", "sourceId", "ruleVersion", "reason", "isEstimated"
)
SELECT
  'mig-leave-' || md5(l.id),
  l."companyId",
  l."userId",
  l."endDate",
  EXTRACT(YEAR FROM l."endDate")::TEXT,
  'LEAVE_CONSUMED',
  l."totalDays"::DECIMAL(10,4),
  'LEAVE_REQUEST',
  l.id,
  'LEGACY-LEAVE-MIGRATION-2026.1',
  'Congé annuel approuvé migré depuis la table leaves',
  false
FROM "leaves" l
WHERE l."leaveType" = 'annual' AND l.status = 'approved';

-- Ventilation des paies historiques. Les primes agrégées et le transport
-- restent marqués estimés jusqu'à leur rapprochement métier.
INSERT INTO "payroll_earning_lines" (
  "id", "companyId", "payrollId", "code", "label", "category", "amount",
  "includedInLeaveBase", "includedInTerminationBase", "isExpenseReimbursement",
  "classificationSource", "isEstimated", "updatedAt"
)
SELECT
  'mig-earning-' || md5(p.id || '-' || line.code),
  p."companyId",
  p.id,
  line.code,
  line.label,
  line.category::"PayrollEarningCategory",
  line.amount::DECIMAL(18,2),
  line.leave_base,
  line.termination_base,
  line.expense,
  line.classification_source,
  line.estimated,
  CURRENT_TIMESTAMP
FROM "payrolls" p
CROSS JOIN LATERAL (
  VALUES
    ('BASE_SALARY', 'Salaire de base', 'BASE_SALARY', p."basicSalary", true, true, false, 'LEGACY_EXPLICIT_FIELD', false),
    ('SURSALAIRE', 'Sursalaire', 'SURSALAIRE', p."sursalaire", true, true, false, 'LEGACY_EXPLICIT_FIELD', false),
    ('BONUSES_AGGREGATED', 'Primes agrégées', 'BONUS', p."bonuses", true, true, false, 'LEGACY_AGGREGATE_ESTIMATE', true),
    ('HOUSING_ALLOWANCE', 'Indemnité de logement', 'ALLOWANCE', p."housingAllowance", true, true, false, 'LEGACY_EXPLICIT_FIELD', false),
    ('OVERTIME_PAY', 'Rémunération des heures supplémentaires', 'OVERTIME', p."overtimePay", true, true, false, 'LEGACY_EXPLICIT_FIELD', false),
    ('TRANSPORT_REIMBURSEMENT', 'Indemnité de transport', 'EXPENSE_REIMBURSEMENT', p."transportAllowance", false, false, true, 'LEGACY_DEFAULT_EXPENSE', true)
) AS line(code, label, category, amount, leave_base, termination_base, expense, classification_source, estimated);

-- Audit transactionnel : toute divergence annule la migration.
DO $$
DECLARE
  expected_count INTEGER;
  actual_count INTEGER;
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expected_count FROM "users";
  SELECT COUNT(*) INTO actual_count FROM "leave_ledger_entries" WHERE "entryType" = 'OPENING_BALANCE';
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'Ledger: % soldes d''ouverture pour % utilisateurs', actual_count, expected_count;
  END IF;

  SELECT COUNT(*) INTO expected_count FROM "leaves" WHERE "leaveType" = 'annual' AND status = 'approved';
  SELECT COUNT(*) INTO actual_count FROM "leave_ledger_entries" WHERE "entryType" = 'LEAVE_CONSUMED';
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'Ledger: % consommations pour % congés approuvés', actual_count, expected_count;
  END IF;

  SELECT COUNT(*) * 6 INTO expected_count FROM "payrolls";
  SELECT COUNT(*) INTO actual_count FROM "payroll_earning_lines";
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'Rémunérations: % lignes pour % attendues', actual_count, expected_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "payroll_earning_lines" e
  JOIN "payrolls" p ON p.id = e."payrollId"
  WHERE e."companyId" <> p."companyId";
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Isolation tenant: % lignes de rémunération incohérentes', mismatch_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "leave_ledger_entries" e
  JOIN "users" u ON u.id = e."userId"
  WHERE e."companyId" <> u."companyId";
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Isolation tenant: % écritures de congés incohérentes', mismatch_count;
  END IF;
END $$;
