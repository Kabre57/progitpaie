# PROGITPAIE — Validation indépendante des corrections P0 v1.6.1

**Date :** 13 août 2026  
**Archive contrôlée :** `progitpaie.zip`  
**Empreinte SHA-256 :** `a1ce22d48d839b02c463eb4f9efb2511e251dd628474fb894d9193f4d2e5ddb4`  
**Périmètre :** vérification des corrections P0 annoncées, reproduction des validations TypeScript/Jest/E2E/build et mesure des écarts P1.  
**Conclusion :** les corrections de code P0.1 et P0.2 sont validées. P0.3 est reproduit avec succès à 8/8, mais son assertion E2E demeure volontairement large et doit être durcie ultérieurement. Le renouvellement des secrets est une action opérationnelle toujours obligatoire, car le ZIP contient encore `.env`.

## 1. Méthode et environnement de validation

L’archive a été contrôlée avant extraction : son intégrité ZIP est valide et aucun chemin absolu ou traversant (`..`) n’a été détecté. Elle a été extraite dans un répertoire d’analyse isolé. Les dépendances ont été installées avec :

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

Les validations exécutables ont été réalisées avec une base PostgreSQL et un Redis locaux fictifs, ainsi que des clés temporaires de validation. Aucun secret de `.env` n’a été utilisé volontairement dans les tests.

| Contrôle | Résultat |
|---|---:|
| Intégrité archive | Conforme |
| Génération Prisma | Conforme |
| TypeScript strict | Conforme — 0 erreur |
| Jest | Conforme — 70 suites, 312 tests réussis |
| Playwright `security-multitenant.spec.ts` | Conforme — 8/8 réussis |
| Build production Next.js | Conforme |
| Docker dynamique | Non exécuté — Docker n’est pas disponible dans l’environnement de validation |

## 2. Vérification des P0

### P0.1 — Déploiement local et migrations

La correction dans `deploy-local.sh` est **validée au niveau du code**.

| Contrôle | Résultat observé |
|---|---|
| Mot de passe `progitpaie_pass_2026` | Absent du script contrôlé |
| `prisma db push` | Absent du script contrôlé |
| `--accept-data-loss` | Absent du script contrôlé |
| Masquage d’échec `|| true` pour la migration | Absent du script contrôlé |
| Commande de migration | `pnpm prisma:deploy` à la ligne 54 |

Le script appelle donc désormais une étape de migration versionnée et échouera si cette étape échoue. Cela corrige le défaut majeur précédent qui pouvait masquer une erreur de schéma.

> La correction de code ne renouvelle pas les secrets déjà inclus dans une archive antérieure. Puisque cette nouvelle archive contient toujours `.env` avec des variables telles que `DATABASE_URL`, `DB_PASSWORD`, `JWT_SECRET` et `ENCRYPTION_KEY`, les valeurs réelles doivent être renouvelées si le ZIP a été partagé hors d’un canal strictement contrôlé.

### P0.2 — Script Prisma conforme à pnpm et aux migrations versionnées

La correction de `prisma/scripts/deploy.ts` est **validée**.

| Ancien comportement interdit | Nouveau comportement contrôlé |
|---|---|
| `npx prisma generate` | `pnpm exec prisma generate --schema=prisma/schema` |
| `npx prisma db push` | `pnpm exec prisma migrate deploy --schema=prisma/schema` |
| Risque de poursuite après erreur | `process.exit(1)` en cas d’exception |

Aucun appel exécutable à `npx`, `db push` ou `--accept-data-loss` n’a été relevé dans les fichiers P0 vérifiés. Les occurrences résiduelles de ces mots ne sont que des commentaires explicatifs.

### P0.3 — E2E-SEC-08 et gestion défensive de clé API

La route publique `GET /api/v2/public/payroll` est désormais appelée avec la méthode HTTP correcte dans le test. Le middleware API entoure `validateApiKey()` d’un `try/catch` et retourne un JSON `503` si le service d’authentification est indisponible. Une clé invalide produit un refus explicite `403` lorsque la vérification est disponible.

La suite ciblée Playwright a été reproduite contre une instance locale de l’application :

| Indicateur | Résultat observé |
|---|---:|
| Scénarios exécutés | 8 |
| Scénarios réussis | 8 |
| Échecs | 0 |
| Code de sortie Playwright | 0 |

La correction fonctionnelle est donc **confirmée**. Toutefois, le scénario conserve l’assertion :

```ts
expect([401, 403, 404, 503]).toContain(res.status());
```

Cette assertion a été choisie pour tolérer des serveurs non redémarrés exécutant l’ancien code. Elle ne constitue pas une preuve stricte que le serveur corrigé retourne toujours `401`, `403` ou `503`. Après stabilisation du déploiement, la suite CI doit être durcie : le serveur de test doit exécuter le code courant, et `404` doit être retiré des statuts acceptés pour E2E-SEC-08.

## 3. Validations techniques reproduites

| Commande / contrôle | Résultat indépendant |
|---|---|
| `pnpm prisma:generate` | Réussi |
| `pnpm exec tsc --noEmit` | Réussi, 0 erreur |
| `pnpm test` | 70/70 suites et 312/312 tests réussis |
| `pnpm exec playwright test tests/e2e/security-multitenant.spec.ts --reporter=line` | 8/8 réussis |
| `pnpm build` | Réussi |

Les résultats de recette fournis par le projet sont donc reproduits pour TypeScript, Jest, Playwright ciblé et le build.

## 4. Écarts P1 mesurés dans cette archive

### P1.1 — `any` et règles ESLint

Le lint retourne un code de sortie 0, mais il ne constitue pas une absence de dette de typage : `@typescript-eslint/no-explicit-any` est toujours configuré en avertissement. L’exécution globale a relevé **162 avertissements `Unexpected any`** et **439 avertissements ESLint**.

Dans le périmètre précis `lib/` + `app/api/`, un comptage syntaxique reproductible a trouvé **112 lignes** comportant un `any` explicite dans **68 fichiers**. Cet écart avec le référentiel annoncé de 108/66 s’explique probablement par une méthode de décompte différente ; le présent rapport fournit le périmètre et la méthode pour pouvoir comparer les versions suivantes.

```bash
find lib app/api -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
  | xargs -0 grep -nE '(:|<|\(|,|=) *any\b|\bas any\b'
```

Les zones sensibles toujours concernées incluent des routes API, `unit-of-work.ts`, `PrismaEmployeeRepository`, des builders PDF et le service de veille légale. La prochaine correction doit passer `no-explicit-any` à `error` au moins dans les modules sécurité, paie, déclarations, exports, use cases et repositories, puis remplacer les `any` progressivement par des types métier, des unions ou `unknown` validé.

### P1.2 — Accès Prisma directs dans les routes

Un balayage des `route.ts` dans `app/api` relève **34 routes** important directement `@/lib/db`, `@/lib/prisma` ou `PrismaClient`, sur 119 fichiers de route. Ce chiffre ne correspond pas exactement au référentiel de 31 car la méthode inclut les trois formes d’import ci-dessus. Il doit être conservé avec sa méthode de mesure, plutôt que comparé à un total dont le périmètre est différent.

La migration Clean Architecture doit continuer par lots : API publiques/API key, paie, déclarations, exports, administration globale et paramètres. Chaque migration doit déplacer la logique vers un use case, un port et un repository tenant-aware, avec validation Zod et tests d’autorisation.

### P1.3 — Dockerfile encore dépendant d’artefacts locaux

Le Dockerfile utilise Node 24.15-alpine, mais ne construit pas l’application dans l’image. Il copie directement depuis le contexte local :

- `node_modules` ;
- `.next/standalone` ;
- `.next/static` ;
- `.build/rotation/*`.

L’image dépend donc d’une machine ayant déjà exécuté l’installation, le build Next et la compilation de rotation. Elle n’est pas encore reproductible à partir d’une archive fraîche ou d’un CI propre. Docker n’étant pas disponible dans cet environnement, la validation dynamique n’a pas été exécutée.

La correction P1 attendue reste un build multi-stage autonome : installation explicite de pnpm, `pnpm install --frozen-lockfile`, génération Prisma, compilation Next et rotation dans l’étape builder, puis copie des seuls artefacts nécessaires dans l’image runner.

### P1.4 — Deux moteurs fiscaux confirmés

La coexistence de deux moteurs est **confirmée** :

| Usage | Fichier / fonction |
|---|---|
| Génération réelle de bulletins | `PayrollGenerationService` appelle `lib/payroll-tax.ts::calculatePayrollTaxes()` |
| Simulations et calcul inverse | `payslip-calculator.ts::calculatePayslip()` et `its-calculator.ts::calculateITS2024()` |

Cette différence est une dette fonctionnelle à traiter avec validation réglementaire ivoirienne avant tout changement de calcul de bulletin réel. Il ne faut pas faire une migration automatique de moteur sans jeux de cas approuvés, version de règles, comparaison historique et validation d’un expert paie/fiscalité.

### P1.5 — Audit de dépendances via registre officiel

Contrairement au blocage signalé avec le registre miroir, l’audit a fonctionné contre le registre npm officiel :

```bash
pnpm audit --prod --registry=https://registry.npmjs.org --json
```

Le résultat est en échec et relève :

| Sévérité | Nombre |
|---|---:|
| Critique | 0 |
| Haute | 18 |
| Modérée | 11 |
| Faible | 2 |

Les avis concernent notamment `next`, `xlsx`, `nodemailer`, `sharp` et `postcss`. Une mise à jour de dépendances contrôlée est donc requise avant de déclarer le P1 terminé. Les seuils correctifs les plus restrictifs retournés par l’audit incluent Next >= 16.2.11, PostCSS >= 8.5.23, xlsx >= 0.20.2, nodemailer >= 9.0.1 et sharp >= 0.35.0.

## 5. Verdict

| Élément | Verdict |
|---|---|
| P0.1 — script de déploiement | **Corrigé dans le code** ; rotation manuelle des secrets encore obligatoire si l’archive a été partagée. |
| P0.2 — script Prisma | **Corrigé et conforme à la règle pnpm**. |
| P0.3 — test E2E et middleware | **Corrigé et reproduit à 8/8** ; assertion à durcir ultérieurement en retirant `404`. |
| TypeScript / Jest / Build | **Reproduits avec succès**. |
| P1 typage / architecture / Docker / fiscalité / dépendances | **Restent ouverts**. |

Les P0 de code ne doivent plus bloquer la poursuite du projet. La prochaine phase recommandée est la correction P1 par lots, en commençant par l’audit des dépendances hautes et la suppression des `any` dans les zones sécurité/paie/déclarations. En parallèle, les secrets de toute archive partagée doivent être renouvelés, et les archives futures doivent exclure `.env`.
