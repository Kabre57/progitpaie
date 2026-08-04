-- Isolation multi-tenant complète des agrégats métier.
-- Cette migration est transactionnelle : tout échec d'audit annule le lot.

INSERT INTO "companies" ("id", "name", "isMain", "isActive", "createdAt", "updatedAt")
VALUES ('progitpaie-default-001', 'PROGITPAIE', TRUE, TRUE, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

UPDATE "users"
SET "companyId" = 'progitpaie-default-001'
WHERE "companyId" IS NULL;

UPDATE "payslip_config_snapshots"
SET "companyId" = 'progitpaie-default-001'
WHERE "companyId" IS NULL;

ALTER TABLE "attendances" ADD COLUMN "companyId" TEXT;
ALTER TABLE "departments" ADD COLUMN "companyId" TEXT;
ALTER TABLE "shifts" ADD COLUMN "companyId" TEXT;
ALTER TABLE "leaves" ADD COLUMN "companyId" TEXT;
ALTER TABLE "payrolls" ADD COLUMN "companyId" TEXT;
ALTER TABLE "contracts" ADD COLUMN "companyId" TEXT;
ALTER TABLE "overtimes" ADD COLUMN "companyId" TEXT;
ALTER TABLE "loans" ADD COLUMN "companyId" TEXT;
ALTER TABLE "loan_schedules" ADD COLUMN "companyId" TEXT;
ALTER TABLE "accounting_entries" ADD COLUMN "companyId" TEXT;
ALTER TABLE "severances" ADD COLUMN "companyId" TEXT;
ALTER TABLE "tax_declarations" ADD COLUMN "companyId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "companyId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "companyId" TEXT;
ALTER TABLE "api_keys" ADD COLUMN "companyId" TEXT;

UPDATE "attendances" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "leaves" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "payrolls" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "contracts" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "overtimes" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "loans" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "severances" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "notifications" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."userId" = parent.id AND child."companyId" IS NULL;
UPDATE "audit_logs" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child."performedById" = parent.id AND child."companyId" IS NULL;

UPDATE "loan_schedules" child SET "companyId" = parent."companyId"
FROM "loans" parent WHERE child."loanId" = parent.id AND child."companyId" IS NULL;
UPDATE "accounting_entries" child SET "companyId" = parent."companyId"
FROM "payrolls" parent WHERE child."payrollId" = parent.id AND child."companyId" IS NULL;

UPDATE "departments" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child.id = parent."departmentId" AND child."companyId" IS NULL;
UPDATE "shifts" child SET "companyId" = parent."companyId"
FROM "users" parent WHERE child.id = parent."shiftId" AND child."companyId" IS NULL;

-- Les référentiels non rattachés et les modèles sans propriétaire historique
-- appartiennent au tenant mono-société explicitement validé pour cette migration.
UPDATE "departments" SET "companyId" = 'progitpaie-default-001' WHERE "companyId" IS NULL;
UPDATE "shifts" SET "companyId" = 'progitpaie-default-001' WHERE "companyId" IS NULL;
UPDATE "tax_declarations" SET "companyId" = 'progitpaie-default-001' WHERE "companyId" IS NULL;
UPDATE "api_keys" SET "companyId" = 'progitpaie-default-001' WHERE "companyId" IS NULL;

DO $$
DECLARE
  tenant_table TEXT;
  missing_count BIGINT;
  tenant_tables CONSTANT TEXT[] := ARRAY[
    'users', 'attendances', 'departments', 'shifts', 'leaves',
    'payslip_config_snapshots', 'payrolls', 'contracts', 'overtimes',
    'loans', 'loan_schedules', 'accounting_entries', 'severances',
    'tax_declarations', 'notifications', 'audit_logs', 'company_settings',
    'api_keys'
  ];
BEGIN
  FOREACH tenant_table IN ARRAY tenant_tables LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE "companyId" IS NULL', tenant_table)
      INTO missing_count;
    IF missing_count > 0 THEN
      RAISE EXCEPTION '%: % lignes sans companyId', tenant_table, missing_count;
    END IF;
  END LOOP;
END $$;

ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "payslip_config_snapshots" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "attendances" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "departments" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "shifts" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "leaves" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "contracts" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "overtimes" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "loans" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "loan_schedules" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "accounting_entries" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "severances" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "tax_declarations" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loans" ADD CONSTRAINT "loans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "severances" ADD CONSTRAINT "severances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_declarations" ADD CONSTRAINT "tax_declarations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payslip_config_snapshots" ADD CONSTRAINT "payslip_config_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "attendances_companyId_idx" ON "attendances"("companyId");
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");
CREATE INDEX "shifts_companyId_idx" ON "shifts"("companyId");
CREATE INDEX "leaves_companyId_idx" ON "leaves"("companyId");
CREATE INDEX "payrolls_companyId_idx" ON "payrolls"("companyId");
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");
CREATE INDEX "overtimes_companyId_idx" ON "overtimes"("companyId");
CREATE INDEX "loans_companyId_idx" ON "loans"("companyId");
CREATE INDEX "loan_schedules_companyId_idx" ON "loan_schedules"("companyId");
CREATE INDEX "accounting_entries_companyId_idx" ON "accounting_entries"("companyId");
CREATE INDEX "severances_companyId_idx" ON "severances"("companyId");
CREATE INDEX "tax_declarations_companyId_idx" ON "tax_declarations"("companyId");
CREATE INDEX "notifications_companyId_idx" ON "notifications"("companyId");
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");
CREATE INDEX "api_keys_companyId_idx" ON "api_keys"("companyId");
DROP INDEX "departments_name_key";
DROP INDEX "shifts_name_key";
CREATE UNIQUE INDEX "departments_companyId_name_key" ON "departments"("companyId", "name");
CREATE UNIQUE INDEX "shifts_companyId_name_key" ON "shifts"("companyId", "name");
