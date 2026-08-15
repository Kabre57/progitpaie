# Tests reproductibles PROGITPAIE

## Pré-requis

Utiliser Node.js compatible avec le projet, installer les dépendances avec `pnpm install --frozen-lockfile`, puis fournir une variable `DATABASE_URL`. Ne jamais committer un fichier `.env` réel ni un secret de base de données.

## Tests unitaires et de contrats

```bash
pnpm install --frozen-lockfile
DATABASE_URL='postgresql://audit:unused@localhost:5432/audit' pnpm prisma:generate
ppnpm test -- --runInBand
```

La génération Prisma est obligatoire avant les suites qui importent `@prisma/client`.

## Environnement PostgreSQL isolé

Le fichier `docker-compose.isolated.yml` fournit PostgreSQL et Redis éphémères. Dans un environnement Docker autorisé :

```bash
docker compose -f docker-compose.isolated.yml up --build --abort-on-container-exit migrate_isolated
TEST_DATABASE_URL='postgresql://progitpaie:secret_isolated@localhost:5435/progitpaie_isolated?schema=public' \
DATABASE_URL="$TEST_DATABASE_URL" pnpm prisma:generate
DATABASE_URL="$TEST_DATABASE_URL" ppnpm test -- --runInBand
docker compose -f docker-compose.isolated.yml down --volumes --remove-orphans
```

Les identifiants ci-dessus sont des identifiants de test local uniquement. Ils ne doivent jamais être utilisés en production.

## CI

La CI doit exécuter dans cet ordre : `pnpm install --frozen-lockfile`, `pnpm prisma:generate:ci`, `pnpm lint`, `pnpm exec tsc --noEmit`, puis `ppnpm test -- --runInBand`. Les suites nécessitant une base doivent recevoir une base PostgreSQL dédiée, isolée par job.

## Critère de sortie

Une livraison ne doit pas être déclarée validée si le client Prisma n’a pas été généré, si une suite échoue, si le lint contient une erreur ou si le typecheck échoue. Les warnings doivent être suivis dans un ticket ; les warnings `no-explicit-any` des zones sécurité, paie, déclarations et GraphQL sont prioritaires.
