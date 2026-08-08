-- Add the password-reset fields used by the authentication routes.
-- IF NOT EXISTS makes this safe for the already-provisioned production schema.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3);

-- Prisma declares resetPasswordToken as unique. PostgreSQL unique indexes allow
-- multiple NULL values, which is required for users without an active reset.
CREATE UNIQUE INDEX IF NOT EXISTS "users_resetPasswordToken_key"
  ON "users" ("resetPasswordToken");
