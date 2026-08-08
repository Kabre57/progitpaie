-- Store KYB documents linked to SaaS companies.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
    CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INCOMPLETE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "company_documents" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "rejectReason" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_documents_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "company_documents_companyId_idx"
  ON "company_documents" ("companyId");
