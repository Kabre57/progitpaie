-- Bring the production companies table in line with the SaaS/KYB Company model.
-- The guarded enum creation and IF NOT EXISTS clauses make this safe on an
-- already-provisioned database.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
    CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INCOMPLETE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE_TRIAL', 'STARTER', 'BUSINESS', 'ENTERPRISE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
  END IF;
END
$$;

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE_TRIAL',
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "monthlyPriceFCFA" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxEmployeesAllowed" INTEGER NOT NULL DEFAULT 10;
