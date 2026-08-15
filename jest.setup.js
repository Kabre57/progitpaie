// Les tests unitaires peuvent importer Prisma sans nécessiter de secret ni de service distant.
// Les tests d’intégration qui accèdent réellement à PostgreSQL doivent toujours fournir
// leur propre DATABASE_URL via l’environnement ou la configuration CI.
process.env.DATABASE_URL ??= "postgresql://progitpaie_test:progitpaie_test@127.0.0.1:5432/progitpaie_test?schema=public";

require("@testing-library/jest-dom");
