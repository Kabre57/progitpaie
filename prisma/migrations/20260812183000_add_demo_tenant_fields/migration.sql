-- Add explicit demo-tenant lifecycle fields.
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "demoExpiresAt" TIMESTAMP(3);
