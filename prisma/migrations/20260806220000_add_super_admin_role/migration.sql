-- Align the production PostgreSQL enum with the Prisma UserRole enum.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'super_admin';
