-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "permission_modules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'Shield',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "permission_definitions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'read',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "permission_modules_companyId_idx" ON "permission_modules"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permission_modules_companyId_code_key" ON "permission_modules"("companyId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "permission_definitions_companyId_moduleId_idx" ON "permission_definitions"("companyId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permission_definitions_companyId_code_key" ON "permission_definitions"("companyId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "roles_companyId_idx" ON "roles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_companyId_name_key" ON "roles"("companyId", "name");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_modules_companyId_fkey') THEN
    ALTER TABLE "permission_modules" ADD CONSTRAINT "permission_modules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_definitions_companyId_fkey') THEN
    ALTER TABLE "permission_definitions" ADD CONSTRAINT "permission_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_definitions_moduleId_fkey') THEN
    ALTER TABLE "permission_definitions" ADD CONSTRAINT "permission_definitions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "permission_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_companyId_fkey') THEN
    ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_roleId_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
