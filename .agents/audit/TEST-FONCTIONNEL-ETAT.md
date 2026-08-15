# État du test fonctionnel de bout en bout

## 12 août 2026 — Authentification

L’URL `/register` rendait la page de connexion. La cause était le composant `AuthUI`, dont l’état initial était toujours `isSignIn = true`, indépendamment de la route.

Correction appliquée : ajout de la propriété `initialMode?: "signin" | "signup"` dans `AuthUI`, puis passage de `initialMode="signup"` par la page `/register`.

Le test doit être rejoué après recompilation ou rechargement du serveur pour confirmer l’affichage direct du formulaire « Créer un compte ».

Données de test prévues :

- Entreprise : PROGITPAIE Test Côte d’Ivoire
- Administrateur : admin.test@progitpaie.local
- Mot de passe : généré uniquement pour l’environnement de test local
- Employés : 15 employés avec anciennetés de 1 à 15 ans, statuts de présence régulière et irrégulière

## Mise à jour après démarrage PostgreSQL/Redis local

L’appel initial d’inscription échouait avec `Aucune société principale active n'est configurée`. L’API a été corrigée pour créer la première société principale lors de la première inscription, avec un champ `companyName` transmis par le formulaire.

Le compte de test a ensuite été créé avec succès par `POST /api/auth/register`, HTTP 201, rôle `admin`, société `PROGITPAIE Côte d’Ivoire — Environnement Test`.

Le serveur de test utilise PostgreSQL et Redis locaux. Le test composé `pnpm test -- --runInBand` est incorrect dans ce projet car le script `test` contient déjà `--runInBand`; il faut exécuter `pnpm test` seul.

## Salariés — premier affichage

Après création des quinze salariés, la page `/admin/employees` reste en état « Chargement… » et affiche temporairement « 0 salariés inscrits ». Ce comportement doit être corrélé avec les logs du serveur et l’API de liste salariés avant de poursuivre les autres modules.

## Paie — août 2026

La génération `POST /api/v2/payroll` a réussi en HTTP 201 avec `generated: 15`. La lecture `GET /api/v2/payroll?month=8&year=2026` retourne les bulletins des salariés avec salaires de base, indemnités, CNPS, ITS, IGR, FDFP, retenues, jours de présence et net à payer.

Les salariés réguliers ont cinq jours présents et des heures supplémentaires de test. Les salariés irréguliers ont des statuts absent, retard et demi-journée pour la période de test.

## Contrats, documents et endpoints RH

La liste des contrats retourne 15 contrats en HTTP 200. La génération d’un bulletin PDF fonctionne en HTTP 200 avec `docType: "payslip"` et `Content-Type: application/pdf`. Un premier appel de test avec `type` au lieu de `docType` a correctement retourné une erreur de validation HTTP 400; ce n’était pas une erreur applicative.

Les endpoints testés en lecture retournent HTTP 200 : contrats, présences août 2026, congés, déclarations CNPS, déclarations ITS et rapports analytiques. Le registre des congés est vide avant création d’une demande, ce qui est attendu.

## Congés et absences

Une demande de congé annuel du 20 au 22 août 2026 a été créée en HTTP 201 avec le statut `pending`. L’approbation a d’abord été tentée en POST, alors que la route définit PUT; après correction du scénario, l’approbation PUT a réussi en HTTP 200 et le statut est passé à `approved`.

## Déclarations, exports, comptabilité et finalisation

Les déclarations CNPS et ITS v2 retournent HTTP 200. Les exports salariés et présences génèrent respectivement des fichiers XLSX de 22 159 et 181 426 octets. Le journal comptable retourne HTTP 200 avec des données, et `/api/health` retourne HTTP 200.

Le premier bulletin a été finalisé avec succès par PATCH `/api/v2/payroll/[id]`; son statut est passé de `draft` à `finalized` avec une date de finalisation.

## Architecture Démo et Super-admin — correction du 12 août 2026

Le parcours public `/register` ne crée plus de société principale et ne peut plus initialiser un tenant de production. Il crée explicitement un espace prospect indépendant avec `isMain=false`, `isDemo=true`, le plan `FREE_TRIAL`, le statut `TRIALING` et une expiration à 14 jours. Les entreprises de production sont créées exclusivement par le Super-admin via `/api/v2/admin/tenants`.

L’espace Super-admin affiche maintenant l’étiquette `DÉMO`, la date d’expiration et une carte « Espaces Démo ». Le tenant historique `isMain` est présenté comme « SIÈGE HISTORIQUE » et ne constitue plus une condition de création ou de rattachement.

Le test API a créé `Entreprise Démo Prospect CI` avec `isMain=false`, `isDemo=true`, `subscriptionStatus=TRIALING`, expiration au 26 août 2026 et un administrateur dédié. Les données de ce tenant sont séparées de l’entreprise de test existante par son `companyId`.
