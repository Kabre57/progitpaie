-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_companyId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "provision_snapshots_companyId_referenceDate_ruleVersion_inputHa";

-- DropIndex
DROP INDEX IF EXISTS "users_employeeId_key";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "childrenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "housingBenefit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maritalStatus" TEXT DEFAULT 'Célibataire',
ADD COLUMN IF NOT EXISTS "partsIGR" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS "ricfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "vehicleBenefit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payrolls" ALTER COLUMN "generatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payslip_config_snapshots" ADD COLUMN IF NOT EXISTS "parametricConfig" JSONB;

-- AlterTable
ALTER TABLE "provision_calculation_snapshots" DROP COLUMN IF EXISTS "calculatedAt",
DROP COLUMN IF EXISTS "finalizedAt",
DROP COLUMN IF EXISTS "totalExposure",
DROP COLUMN IF EXISTS "totalLeaveProvision",
DROP COLUMN IF EXISTS "totalTerminationExposure",
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "mustChangePassword" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_companyId_employeeId_key" ON "users"("companyId", "employeeId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_companyId_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
