-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "EmployeeCategory" AS ENUM ('cadre', 'maitrise', 'employe', 'ouvrier');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PRET', 'AVANCE');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TerminationType" AS ENUM ('licenciement', 'demission', 'retraite', 'fin_cdd', 'rupture_conventionnelle');

-- CreateEnum
CREATE TYPE "DeclarationType" AS ENUM ('ITS_MONTHLY', 'CNPS_MONTHLY', 'FDFP_ANNUAL', 'ETAT_301', 'DISA');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'CDI',
    "category" "EmployeeCategory" NOT NULL DEFAULT 'employe',
    "jobTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "probationPeriodMonths" INTEGER NOT NULL DEFAULT 0,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "sursalaire" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "housingAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtimes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "reason" TEXT NOT NULL,
    "status" "OvertimeStatus" NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LoanType" NOT NULL DEFAULT 'PRET',
    "amount" DOUBLE PRECISION NOT NULL,
    "monthlyDeduction" DOUBLE PRECISION NOT NULL,
    "totalRepaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_schedules" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "payrollId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "journalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pieceNumber" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "severances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "terminationType" "TerminationType" NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "seniorityYears" DOUBLE PRECISION NOT NULL,
    "noticeIndemnity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "severanceIndemnity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leaveCompensation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gratification13th" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetExit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "severances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cnpsEmployeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.063,
    "cnpsEmployerRate" DOUBLE PRECISION NOT NULL DEFAULT 0.077,
    "cnpsRetraiteCeiling" DOUBLE PRECISION NOT NULL DEFAULT 3375000,
    "cnpsPfCeiling" DOUBLE PRECISION NOT NULL DEFAULT 75000,
    "itsRate" DOUBLE PRECISION NOT NULL DEFAULT 0.012,
    "fdfpTfcRate" DOUBLE PRECISION NOT NULL DEFAULT 0.012,
    "fdfpTapRate" DOUBLE PRECISION NOT NULL DEFAULT 0.004,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_declarations" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "DeclarationType" NOT NULL,
    "totalGross" DOUBLE PRECISION NOT NULL,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "totalSocial" DOUBLE PRECISION NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_userId_idx" ON "contracts"("userId");

-- CreateIndex
CREATE INDEX "overtimes_userId_idx" ON "overtimes"("userId");

-- CreateIndex
CREATE INDEX "overtimes_status_idx" ON "overtimes"("status");

-- CreateIndex
CREATE INDEX "loans_userId_idx" ON "loans"("userId");

-- CreateIndex
CREATE INDEX "loan_schedules_loanId_idx" ON "loan_schedules"("loanId");

-- CreateIndex
CREATE INDEX "accounting_entries_payrollId_idx" ON "accounting_entries"("payrollId");

-- CreateIndex
CREATE INDEX "accounting_entries_period_idx" ON "accounting_entries"("period");

-- CreateIndex
CREATE INDEX "severances_userId_idx" ON "severances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_year_key" ON "tax_rates"("year");

-- CreateIndex
CREATE INDEX "tax_declarations_period_type_idx" ON "tax_declarations"("period", "type");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "severances" ADD CONSTRAINT "severances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "severances" ADD CONSTRAINT "severances_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
