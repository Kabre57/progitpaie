-- Synchronise le schéma PostgreSQL existant avec prisma/schema.prisma.
-- Cette migration est additive : elle ne supprime ni tables ni données.

CREATE TYPE "WorkType" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');
CREATE TYPE "LegalAlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "LegalAlertStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'APPLIED');

ALTER TABLE "attendances"
  ADD COLUMN "accuracyMeters" DOUBLE PRECISION,
  ADD COLUMN "distanceMeters" DOUBLE PRECISION,
  ADD COLUMN "exceptionReason" TEXT,
  ADD COLUMN "exceptionStatus" TEXT,
  ADD COLUMN "exceptionType" TEXT,
  ADD COLUMN "isWithinFence" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "payrolls"
  ADD COLUMN "configSnapshotId" TEXT;

ALTER TABLE "users"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "bankAccount" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "birthPlace" TEXT,
  ADD COLUMN "category" TEXT DEFAULT '1A',
  ADD COLUMN "cddDurationMonths" INTEGER,
  ADD COLUMN "childrenCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "civility" TEXT DEFAULT 'M.',
  ADD COLUMN "cnpsExempt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cnpsNumber" TEXT,
  ADD COLUMN "companyId" TEXT,
  ADD COLUMN "contractSignDate" TIMESTAMP(3),
  ADD COLUMN "contractType" TEXT DEFAULT 'CDI',
  ADD COLUMN "direction" TEXT,
  ADD COLUMN "exitDate" TIMESTAMP(3),
  ADD COLUMN "gender" TEXT DEFAULT 'M',
  ADD COLUMN "idCardNumber" TEXT,
  ADD COLUMN "idCardType" TEXT DEFAULT 'CNI',
  ADD COLUMN "jobCode" TEXT,
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "maritalStatus" TEXT DEFAULT 'Célibataire',
  ADD COLUMN "nationality" TEXT DEFAULT 'IVOIRIENNE',
  ADD COLUMN "paymentMethod" TEXT DEFAULT 'Virement',
  ADD COLUMN "paymentType" TEXT DEFAULT 'Mensuel',
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "regime" TEXT DEFAULT 'Général',
  ADD COLUMN "service" TEXT,
  ADD COLUMN "workType" "WorkType" NOT NULL DEFAULT 'ONSITE';

CREATE TABLE "payslip_config_snapshots" (
  "id" TEXT NOT NULL,
  "appearanceConfig" JSONB NOT NULL,
  "legalConfig" JSONB NOT NULL,
  "ratesConfig" JSONB NOT NULL,
  "companyId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payslip_config_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "companies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "taxNumber" TEXT,
  "cnpsNumber" TEXT,
  "rccm" TEXT,
  "address" TEXT,
  "city" TEXT DEFAULT 'Abidjan',
  "country" TEXT DEFAULT 'Côte d''Ivoire',
  "phone" TEXT,
  "email" TEXT,
  "latitude" DOUBLE PRECISION DEFAULT 5.3484,
  "longitude" DOUBLE PRECISION DEFAULT -4.0305,
  "radiusMeters" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  "isMain" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_settings" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_alerts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "officialText" TEXT,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "severity" "LegalAlertSeverity" NOT NULL DEFAULT 'HIGH',
  "status" "LegalAlertStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "proposedRates" JSONB,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legal_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "permissions" JSONB,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payslip_config_snapshots_companyId_idx" ON "payslip_config_snapshots"("companyId");
CREATE INDEX "payslip_config_snapshots_createdAt_idx" ON "payslip_config_snapshots"("createdAt" DESC);
CREATE UNIQUE INDEX "company_settings_companyId_key_key" ON "company_settings"("companyId", "key");
CREATE INDEX "legal_alerts_status_severity_idx" ON "legal_alerts"("status", "severity");
CREATE INDEX "legal_alerts_effectiveDate_idx" ON "legal_alerts"("effectiveDate");
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

ALTER TABLE "users"
  ADD CONSTRAINT "users_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payrolls"
  ADD CONSTRAINT "payrolls_configSnapshotId_fkey"
  FOREIGN KEY ("configSnapshotId") REFERENCES "payslip_config_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_settings"
  ADD CONSTRAINT "company_settings_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
