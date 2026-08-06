-- ════════════════════════════════════════════════════════════════════════
-- PROGITPAIE — Migration : Ajout colonne mustChangePassword sur users
-- Correction urgente : champ présent dans le schéma Prisma mais absent en BDD
-- ════════════════════════════════════════════════════════════════════════

-- Ajout de la colonne mustChangePassword avec valeur par défaut false
-- (false = les utilisateurs existants n'ont pas besoin de changer leur mot de passe)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
