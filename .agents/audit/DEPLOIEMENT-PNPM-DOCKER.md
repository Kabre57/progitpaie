# Déploiement PROGITPAIE avec pnpm et Docker

## Cause de l’erreur

L’archive ne contient volontairement pas de dépôt `.git` ni de `package-lock.json`. L’ancien Dockerfile exécutait `npm ci`, qui exige un verrouillage npm. La construction échouait donc avant le lancement de l’application.

## Correctif appliqué

Le Dockerfile utilise maintenant **Node 24.15 Alpine**, requis par `pnpm 11.21.0`, copie `package.json`, `pnpm-lock.yaml` et `pnpm-workspace.yaml`, installe avec `pnpm install --frozen-lockfile`, génère Prisma avec `pnpm exec prisma` et construit Next.js avec `pnpm build`. Les deux fichiers Compose utilisent également `pnpm exec prisma` pour les migrations.

Le Dockerfile n’utilise plus `corepack prepare`, qui pouvait échouer avec `Internal Error: Cannot find matching keyid`. Il installe directement pnpm 11.21.0 avec l’installeur officiel pnpm. Le fichier `pnpm-workspace.yaml` autorise explicitement les scripts de build nécessaires à Prisma, Sharp, `core-js` et `unrs-resolver`; cela évite `ERR_PNPM_IGNORED_BUILDS` sans autoriser globalement tous les scripts de dépendances.

Le script `deploy-local.sh` démarre par défaut en mode local et ne tente plus de faire `git pull` dans une archive ZIP. Le mode production est explicite :

```bash
DEPLOY_MODE=production ./deploy-local.sh
```

Même en mode production, le script vérifie la présence d’un dépôt Git avant de lancer `git pull`.

## Installation locale

À la racine du projet, créer `.env` à partir de `.env.example`, renseigner les secrets réels puis exécuter. La génération Prisma dispose d’une URL locale de repli pour fonctionner même avant la création de `.env`; les commandes de migration et le démarrage Docker nécessitent toutefois `DATABASE_URL` et les autres secrets réels :

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
DEPLOY_MODE=local ./deploy-local.sh
```

Le déploiement local nécessite Docker et Docker Compose. Le script construit les images, démarre PostgreSQL et Redis, exécute la migration et lance l’application.

## Utilisation de l’archive ZIP

L’archive doit être extraite dans un dossier de travail. Elle n’est pas un dépôt Git ; il ne faut donc pas exécuter `git pull` avant d’avoir initialisé ou cloné un dépôt. Pour une utilisation locale, garder `DEPLOY_MODE=local` ou ne pas définir la variable.

## Contrôles réalisés

La syntaxe de `deploy-local.sh` est valide. `pnpm-lock.yaml` est présent et `package-lock.json` absent. Les commandes opérationnelles utilisent pnpm exclusivement. Le journal fourni a confirmé que Node 20 était incompatible avec pnpm 11.21.0 (`node:sqlite`) et que Corepack échouait sur la vérification de signature; l’image Docker utilise maintenant Node 24.15 Alpine et l’installeur officiel pnpm. La génération Prisma, le build Next.js et les 70 suites de tests (312 tests) ont été validés localement. La construction Docker n’a pas pu être exécutée dans l’environnement d’audit car la commande Docker n’y est pas installée ; elle doit être vérifiée sur la machine de déploiement avec :

```bash
docker compose config
docker compose build --no-cache
docker compose up -d
```
