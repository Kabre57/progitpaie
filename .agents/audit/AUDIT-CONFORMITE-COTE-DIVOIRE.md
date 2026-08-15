# Audit de conformité technique et réglementaire — PROGITPAIE

**Version :** 1.0.0  
**Date de l’audit :** 12 août 2026  
**Périmètre :** dépôt PROGITPAIE fourni dans l’environnement de travail  
**Type :** audit statique du code, exécution des contrôles disponibles et comparaison documentaire initiale avec des sources ivoiriennes

> **Avertissement professionnel.** Ce rapport est une analyse technique et documentaire produite par une IA. Il ne constitue pas un avis juridique, fiscal, social ou réglementaire. Les obligations ivoiriennes, les taux de paie, les déclarations et les formalités doivent être confirmés par un expert qualifié en Côte d’Ivoire et par les textes officiels en vigueur avant toute mise en production ou utilisation pour des déclarations réelles.

## 1. Résumé exécutif

Le projet présente une **base fonctionnelle et architecturale importante**, avec des modules RH et paie étendus, une Clean Architecture V2 partiellement matérialisée, des routes versionnées, des mécanismes d’authentification, des headers de sécurité, une logique multi-tenant et 70 fichiers de tests.

Il n’est toutefois **pas prêt à être déclaré conforme ni prêt pour une mise en production réglementaire sans remédiation**. L’audit a détecté plusieurs écarts techniques prioritaires : des occurrences de `any` malgré la règle « zéro `any` », des accès Prisma directs dans un nombre important de routes, des validations Zod peu homogènes, des fallbacks `companyId` codés en dur dans GraphQL, une route GraphQL insuffisamment cloisonnée et des échecs de tests d’intégration liés à Prisma non généré dans l’environnement d’audit.

Le contrôle npm a également signalé **10 vulnérabilités** dans les dépendances installées, dont 8 de niveau élevé. Ce résultat doit être détaillé avec `npm audit` et traité avant une décision de production.

Le statut global proposé est donc : **NON PRÊT pour une déclaration de conformité ou une mise en production paie sans plan de remédiation**. Le projet peut continuer en développement contrôlé, sous réserve de traiter en priorité les risques de sécurité, d’isolation tenant, de calcul paie et de validation réglementaire.

## 2. Périmètre et limites

L’audit a porté sur les fichiers TypeScript/TSX, les routes App Router, les modules `lib/domain`, `lib/application`, `lib/infrastructure`, les fichiers Prisma, les configurations, les tests et les documents `.agents/`. Les dépendances ont été installées avec `pnpm install --frozen-lockfile --ignore-scripts` afin d’exécuter le lint et les tests.

L’audit n’a pas pu confirmer l’exécution réelle contre une base PostgreSQL de test, ni vérifier des déclarations CNPS ou fiscales sur un portail de production. Les taux, plafonds, échéances, règles d’assiette et modalités déclaratives ivoiriennes ne sont pas considérés comme prouvés lorsque le texte officiel précis n’a pas été récupéré.

La référence DGI PDF initialement trouvée a retourné **404 Not Found**. La page d’accueil DGI mentionne des ressources 2026, mais le document précis contenant chaque taux ou formule doit encore être identifié et archivé depuis la source officielle.

## 3. Inventaire technique observé

| Domaine | Constat |
|---|---|
| Frontend et runtime | Next.js 16.2.1, React 19, App Router |
| Langage | TypeScript strict configuré dans `tsconfig.json` |
| Données | PostgreSQL/Prisma 6.19 |
| Validation | Zod présent, mais utilisation non homogène dans les routes auditées |
| Architecture | Dossiers Domain, Application et Infrastructure présents ; séparation partielle dans les routes |
| Authentification | JWT/cookie et helpers d’authentification présents |
| Autorisation | Contrôles de rôle dans le proxy et certains handlers |
| Multi-tenant | `companyId` présent dans de nombreux modèles, repositories et use cases |
| Paie/RH | Salariés, contrats, congés, présence, heures supplémentaires, paie, déclarations, comptabilité, prêts et solde de tout compte |
| Tests | 70 fichiers de tests détectés ; 70 suites exécutées lors du contrôle |
| Sécurité HTTP | Six appels de définition de headers observés dans `proxy.ts`, dont CSP, HSTS en production et protections anti-frame |

## 4. Résultats des contrôles exécutés

| Contrôle | Résultat | Interprétation |
|---|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | Réussi | 838 paquets installés ; 10 vulnérabilités signalées par npm |
| `pnpm lint` | Réussi avec avertissements | 558 avertissements, dont de nombreux `any` explicites |
| `ppnpm test -- --runInBand` | Échec partiel | 52 suites réussies, 18 échouées ; 255 tests réussis |
| Prisma généré pour les tests | Non disponible dans l’environnement | De nombreuses suites échouent sur `Cannot find module '.prisma/client/default'` |
| E2E Playwright | Non exécuté | À exécuter dans un environnement avec application, navigateur et données de test |

Les échecs de tests d’intégration ne prouvent pas tous un défaut fonctionnel du code : une partie est liée à l’absence du client Prisma généré. Ils constituent néanmoins un **blocage de vérification** qui doit être résolu avant de pouvoir conclure sur l’isolation tenant et les repositories.

## 5. Matrice de conformité interne PROGITPAIE

| Domaine | Statut | Preuves observées | Risque |
|---|---|---|---|
| TypeScript strict | Partiel | `strict: true` dans `tsconfig.json`, mais 245 occurrences de `any` détectées dans `app` et `lib` | Contrats faibles, erreurs masquées et non-respect des règles internes |
| Clean Architecture | Partiel à non conforme | Dossiers `lib/domain`, `lib/application`, `lib/infrastructure` présents ; 106 références `prisma.` détectées dans `app/api` par recherche statique | Couplage, difficulté de test et contournement des ports |
| Validation Zod | Partiel | Zod est installé mais seulement 2 routes API contiennent un import direct `from "zod"` selon le scan utilisé | Entrées HTTP potentiellement acceptées sans validation structurée |
| Multi-tenant | Risque élevé / à vérifier | Nombreux `companyId`, mais 9 fallbacks ou valeurs par défaut détectés ; GraphQL utilise `progitpaie-default-001` | Fuite inter-tenant ou accès à un tenant par défaut |
| RBAC | Partiel | Proxy protège `/admin`, `/super-admin` et `/employee`; certains handlers utilisent `requireTenant` | Incohérences possibles entre proxy, route et cas d’utilisation |
| Headers de sécurité | Partiel | CSP, HSTS production, `X-Frame-Options`, `X-Content-Type-Options`, Referrer-Policy et Permissions-Policy présents | CSP autorise `unsafe-eval` et `unsafe-inline`, ce qui réduit la protection XSS |
| Money | Partiel | `lib/domain/payroll/money.ts` existe et est utilisé dans le domaine | Des opérations monétaires hors domaine doivent être recherchées et couvertes |
| Tests | Non conforme pour livraison | 70 suites, mais 18 échouées lors du contrôle | Impossible de certifier les régressions sans environnement Prisma fonctionnel |
| Dépendances | Risque élevé | `pnpm install --frozen-lockfile` signale 10 vulnérabilités, dont 8 élevées | Risque supply-chain et exposition de composants vulnérables |

## 6. Findings prioritaires

### SEC-001 — Fallback de tenant dans GraphQL

**Gravité : Critique.** Dans `app/api/graphql/route.ts`, les lignes 19 et 63 utilisent `progitpaie-default-001` lorsque `variables.id` ou `user.companyId` ne sont pas présents. Une donnée d’entreprise ne doit jamais être résolue vers un tenant par défaut sans contexte authentifié et autorisé.

**Action immédiate :** supprimer les fallbacks, exiger une session valide et un `companyId` issu du serveur, appliquer une permission par opération et ajouter des tests non authentifié, tenant absent et tentative d’accès à une autre entreprise.

### SEC-002 — Mutation GraphQL sans contrôle visible de rôle

**Gravité : Critique.** La mutation `refreshMaterializedViews` est exposée par l’exécuteur GraphQL à la ligne 40 sans contrôle de rôle visible dans la route. Le resolver doit être inspecté et protégé explicitement côté serveur.

**Action immédiate :** restreindre la mutation à un rôle ou une permission précise, vérifier l’audit et ajouter un test de refus pour un salarié et un administrateur non autorisé.

### ARCH-001 — Accès Prisma directs dans les routes

**Gravité : Haute.** Le scan détecte 106 références `prisma.` dans `app/api`. Ce résultat doit être revu fichier par fichier, car certaines occurrences peuvent être légitimes dans des adaptateurs ; néanmoins, il contredit la règle interne interdisant l’accès direct à Prisma dans les routes lorsque la logique passe par l’Infrastructure.

**Action :** classer les routes par priorité, déplacer les accès de persistance vers des repositories/services Infrastructure et faire appeler les cas d’utilisation depuis la Presentation.

### TYPE-001 — Présence massive de `any`

**Gravité : Haute.** 245 occurrences du mot-clé `any` ont été détectées dans `app` et `lib`, dont 115 dans `app/api`. Le lint compte 558 avertissements, plusieurs étant liés à `@typescript-eslint/no-explicit-any`.

**Action :** interdire progressivement `any` en erreur dans les zones sensibles, commencer par les routes paie, déclarations, GraphQL et sécurité, remplacer par `unknown` puis valider avec Zod ou des types discriminés.

### API-001 — Validation d’entrée non homogène

**Gravité : Haute.** Les routes de déclaration CNPS lisent `month` et `year` avec `parseInt` et ne contrôlent pas visiblement les bornes, la période ou les valeurs invalides avant l’appel du use case. La route renvoie également une erreur `error: any`.

**Action :** créer un schéma Zod pour les paramètres, imposer des bornes de mois/année, traiter les erreurs comme `unknown` et ne pas retourner `error.message` brut au client.

### TEST-001 — Suites d’intégration non exécutables dans l’environnement contrôlé

**Gravité : Haute.** 18 suites échouent sur `Cannot find module '.prisma/client/default'`, ce qui indique que le client Prisma n’a pas été généré ou que la configuration de génération n’est pas disponible dans l’environnement.

**Action :** documenter la séquence `pnpm prisma:generate`, préparer une base de test isolée et rendre les tests d’intégration reproductibles en CI.

### DEP-001 — Vulnérabilités npm

**Gravité : Haute à confirmer.** `pnpm install --frozen-lockfile` a signalé 10 vulnérabilités : 1 basse, 1 modérée et 8 élevées. Le détail par paquet n’a pas été intégré automatiquement à ce rapport.

**Action :** exécuter `pnpm audit --prod`, analyser chaque advisory, mettre à jour sans casser les versions compatibles et ajouter une vérification de dépendances en CI. Ne pas utiliser `pnpm audit --fix` sans revue.

### SEC-003 — CSP permissive

**Gravité : Moyenne à Haute.** `proxy.ts` définit `script-src 'unsafe-eval' 'unsafe-inline'` et `style-src 'unsafe-inline'`. Ces directives peuvent être nécessaires temporairement à certains composants, mais elles réduisent la protection contre XSS.

**Action :** inventorier les besoins réels, supprimer progressivement `unsafe-eval`, utiliser des nonces ou hashes pour les scripts si nécessaire et documenter les exceptions.

## 7. Comparaison initiale avec les exigences ivoiriennes

Cette section ne déclare pas la conformité juridique. Elle indique les capacités à prouver dans le logiciel et les sources à confirmer.

| Domaine ivoirien | Source consultée | Ce que le logiciel doit démontrer | Statut actuel |
|---|---|---|---|
| CNPS employeur | Page officielle CNPS Employeur [1] | procédures, cotisations, régularisation annuelle, contrôle, contentieux et accès e-CNPS | Partiel / preuve fonctionnelle à compléter |
| Immatriculation employeur/salarié | Portail officiel Service Public [2] | données d’immatriculation, embauches, départs, preuves et statuts de déclaration | Non vérifiable complètement |
| Données personnelles RH | Autorité de protection, loi n° 2013-450 [3] | base légale, information, droits, sécurité, conservation, sous-traitance et transferts | Non vérifiable juridiquement ; contrôle technique partiel |
| Impôt sur les salaires | Portail DGI officiel [4] | source de taux/barèmes, période de validité, assiette, retenue, preuve de calcul et version réglementaire | Non vérifiable tant que le document fiscal précis n’est pas archivé |
| Droit du travail et contrats | Code du travail à confirmer dans la source officielle compétente | contrats, avenants, états, dates, historique et règles de validation | Partiel techniquement ; validation juridique requise |

### Constats réglementaires

Le projet contient des modules `declarations/cnps`, `declarations/its`, contrats, salariés, absences, présence, heures supplémentaires et paie. Cette couverture fonctionnelle est pertinente, mais la présence d’un module ne prouve pas que les formules, taux, périodes, pièces et échéances correspondent aux textes ivoiriens en vigueur.

Les sources consultées confirment les domaines à gérer, mais elles ne suffisent pas à valider chaque taux ou formule. En particulier, l’URL PDF DGI initialement trouvée a retourné 404 ; le Code général des impôts 2026 doit être récupéré depuis le portail DGI et lié à chaque règle codée.

## 8. Plan de remédiation priorisé

| Priorité | Action | Critère de sortie |
|---:|---|---|
| P0 | Supprimer les fallbacks tenant GraphQL et sécuriser les mutations | Tests d’accès refusé, tenant obligatoire et permission validés |
| P0 | Vérifier toutes les routes GraphQL, exports et déclarations | Matrice route/rôle/companyId sans accès non autorisé |
| P0 | Générer Prisma et rendre les tests d’intégration reproductibles | Suites actuellement bloquées exécutées en CI et local |
| P1 | Corriger les `any` des routes sensibles et traiter les warnings critiques | Zéro `any` dans sécurité, paie, déclarations et GraphQL |
| P1 | Déplacer les accès Prisma directs hors des routes | Revue des 106 occurrences et architecture conforme |
| P1 | Ajouter Zod aux paramètres/body/query/headers externes | Contrats testés et erreurs contrôlées |
| P1 | Analyser les 10 vulnérabilités des dépendances | Chaque advisory acceptée, corrigée ou documentée |
| P1 | Versionner les règles de paie et leurs sources officielles | Chaque taux/formule possède une source et une période |
| P2 | Durcir CSP et documenter les exceptions | Réduction de `unsafe-eval`/`unsafe-inline` sans régression |
| P2 | Compléter le registre de protection des données RH | Finalité, base, conservation, accès, sous-traitants et transferts documentés |
| P2 | Faire auditer les contrats et déclarations par un expert ivoirien | Validation formelle des règles locales et des échéances |

## 9. Décisions à faire valider par des experts ivoiriens

Un expert local doit confirmer les taux et plafonds CNPS, les règles ITS et autres retenues, les échéances et formats de déclaration, les obligations d’immatriculation et de signalement, les exigences relatives aux contrats et avenants, ainsi que les formalités de protection des données auprès de l’autorité compétente.

Le rapport technique ne doit pas transformer ces points en règles codées tant que la version du texte, sa date d’effet et son périmètre ne sont pas confirmés.

## 10. Conclusion

PROGITPAIE dispose d’une couverture fonctionnelle ambitieuse et de bases solides : architecture par couches, modules RH/paie, isolation tenant partiellement structurée, headers de sécurité et suites de tests nombreuses.

La conformité n’est cependant pas démontrée. Les risques les plus urgents concernent le tenant par défaut dans GraphQL, le contrôle des mutations GraphQL, les accès Prisma directs, l’usage massif de `any`, la validation d’entrée, la reproductibilité des tests d’intégration et les vulnérabilités de dépendances.

**Statut global : NON PRÊT pour une déclaration de conformité ivoirienne ou une mise en production paie sans remédiation et validation locale.**

## Sources

[1]: https://www.cnps.ci/employeur/ "CNPS — Employeur"
[2]: https://servicepublic.gouv.ci/accueil/detaildemarcheparticulier/2/446/10 "Service Public de Côte d’Ivoire — Immatriculation d’un employeur et d’un salarié à la CNPS"
[3]: https://www.autoritedeprotection.ci/lois/ "Autorité de protection — Loi n° 2013-450 du 19 juin 2013"
[4]: https://www.dgi.gouv.ci/ "Direction Générale des Impôts — Portail officiel et ressources documentaires 2026"


## 11. Mise à jour après remédiation — 12 août 2026

Les corrections suivantes ont été appliquées dans le dépôt :

| Correction | Résultat |
|---|---|
| GraphQL : suppression des tenants par défaut | Les resolvers utilisent exclusivement le `companyId` de la session authentifiée |
| GraphQL : contrôle admin/super-admin | Les queries sensibles et `refreshMaterializedViews` passent par un contrôle de rôle serveur |
| GraphQL : types et validation | `any` supprimés de la route/resolvers ; variables validées par Zod |
| Déclarations CNPS/ITS | Mois et année validés par Zod ; erreurs traitées comme `unknown` |
| Export multi-entreprise | Authentification super-admin conservée ; body borné et validé par Zod ; résumé retiré du header HTTP |
| Payroll V2 | Plusieurs casts `any` remplacés par l’enum Prisma et une validation des règles JSON |
| Synthèses paie | Collections bancaires, cumuls et RNS typées explicitement |
| CSP | `unsafe-eval` supprimé ; `unsafe-inline` reste à réduire lors d’une migration nonce/hash |
| Prisma/tests | Scripts `test:reproducible` et `prisma:generate:ci` ajoutés ; procédure documentée |
| Règles locales | Registre des règles et dossier de validation locale ajoutés, sans inventer de taux |

### Résultats finaux

| Contrôle | Résultat |
|---|---|
| Génération Prisma | Réussie |
| `pnpm exec tsc --noEmit` | Réussi |
| `pnpm lint` | Réussi, 528 avertissements, 0 erreur |
| Tests Jest | 70 suites réussies, 312 tests réussis |
| `unsafe-eval` | 0 occurrence dans les zones scannées |
| `any` dans les zones sensibles scannées | 0 occurrence dans paie, déclarations, GraphQL et routes payroll V2 |
| `pnpm audit --prod` | 5 vulnérabilités élevées restantes : Next.js, PostCSS, sharp, Nodemailer et xlsx |

### Limites restantes

La séparation Clean Architecture n’est pas achevée : des accès Prisma directs subsistent dans plusieurs routes et doivent être migrés par lots vers des ports et repositories. Le lint reste techniquement vert mais ses 528 avertissements doivent être réduits, notamment dans les autres zones de l’application.

La validation locale ivoirienne n’est pas juridiquement achevée. Les taux, plafonds, assiettes et échéances CNPS/ITS doivent être renseignés dans le registre à partir de textes officiels précis, puis approuvés par un expert ivoirien. Les cinq vulnérabilités des dépendances restantes doivent également faire l’objet d’une décision formelle avant production.

**Nouveau statut :** remédiation technique P0 validée par les contrôles disponibles ; conformité réglementaire ivoirienne encore `À VALIDER` ; mise en production conditionnée à la résolution des vulnérabilités, à la revue architecture restante et à la validation locale signée.
