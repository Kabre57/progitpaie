/*
  Warnings:

  - You are about to drop the column `calculatedAt` on the `provision_calculation_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedAt` on the `provision_calculation_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `totalExposure` on the `provision_calculation_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `totalLeaveProvision` on the `provision_calculation_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `totalTerminationExposure` on the `provision_calculation_snapshots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,employeeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `provision_calculation_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropIndex
DROP INDEX "provision_snapshots_companyId_referenceDate_ruleVersion_inputHa";

-- DropIndex
DROP INDEX "users_employeeId_key";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "childrenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "housingBenefit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maritalStatus" TEXT DEFAULT 'Célibataire',
ADD COLUMN     "partsIGR" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "ricfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleBenefit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payrolls" ALTER COLUMN "generatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payslip_config_snapshots" ADD COLUMN     "parametricConfig" JSONB;

-- AlterTable
ALTER TABLE "provision_calculation_snapshots" DROP COLUMN "calculatedAt",
DROP COLUMN "finalizedAt",
DROP COLUMN "totalExposure",
DROP COLUMN "totalLeaveProvision",
DROP COLUMN "totalTerminationExposure",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "mustChangePassword" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "users_companyId_employeeId_key" ON "users"("companyId", "employeeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "leave_ledger_entries_companyId_sourceType_sourceId_entryType_ke" RENAME TO "leave_ledger_entries_companyId_sourceType_sourceId_entryTyp_key";
