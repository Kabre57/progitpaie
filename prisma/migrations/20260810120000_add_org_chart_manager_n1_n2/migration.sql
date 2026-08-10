-- 1. Ajout des nouveaux statuts de congé N1/N2
ALTER TYPE "LeaveStatus" ADD VALUE IF NOT EXISTS 'pending_n1';
ALTER TYPE "LeaveStatus" ADD VALUE IF NOT EXISTS 'pending_n2';

-- 2. Ajout de la colonne managerId sur users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managerId" TEXT;

-- 3. Ajout des colonnes de double validation sur leaves
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "approvedByN1Id" TEXT;
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "approvedByN1At" TIMESTAMP(3);
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "approvedByN2Id" TEXT;
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "approvedByN2At" TIMESTAMP(3);

-- 4. Ajout des clés étrangères
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_managerId_fkey'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leaves_approvedByN1Id_fkey'
    ) THEN
        ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approvedByN1Id_fkey" FOREIGN KEY ("approvedByN1Id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leaves_approvedByN2Id_fkey'
    ) THEN
        ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approvedByN2Id_fkey" FOREIGN KEY ("approvedByN2Id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
