# Architecture cible — Démo, Super-admin et entreprises clientes

## Principe

PROGITPAIE est une plateforme SaaS multi-tenant. Chaque entreprise cliente possède un `companyId` indépendant. Les données RH, de paie, de présence, de congé, de contrat, de déclaration et de document ne doivent jamais traverser cette frontière.

## Parcours Démo

Les boutons publics « S’inscrire » et « Continuer avec Google » sont réservés au parcours prospect. Ils créent un accès **Démo isolé** avec `isDemo=true`, `isMain=false`, le plan `FREE_TRIAL`, le statut `TRIALING` et une expiration de quatorze jours. Cet accès permet de tester l’application, mais ne crée pas une société principale ni un tenant de production validé.

À l’issue de la Démo, le Super-admin peut convertir le prospect en entreprise cliente, prolonger ou suspendre l’essai, vérifier les informations légales et créer ou confirmer l’administrateur de l’entreprise.

## Espace Super-admin

Le Super-admin contrôle la plateforme entière. Il peut créer les entreprises de production, consulter les tenants, gérer les statuts, administrer les plans et abonnements, traiter les vérifications KYB, consulter les audits, exporter les données globales selon les permissions et gérer les sauvegardes.

L’ancien indicateur `isMain` est conservé uniquement pour compatibilité avec l’historique. Il ne doit jamais être requis pour créer ou rattacher une entreprise.

## Espace Admin entreprise

L’admin d’entreprise gère uniquement son propre `companyId`. Il peut gérer les salariés, contrats, présences, congés, paie, déclarations, exports, paramètres RH et utilisateurs autorisés de sa société. Toute route doit obtenir le tenant depuis la session et appliquer le filtre `companyId` côté serveur.

## Contrôles obligatoires

| Contrôle | Règle |
|---|---|
| Création de production | Réservée au Super-admin via `/api/v2/admin/tenants` |
| Inscription publique | Crée uniquement un tenant Démo indépendant |
| Société principale | Ne doit jamais être créée automatiquement par `/api/auth/register` |
| Isolation | Toutes les requêtes métier filtrent par `companyId` |
| Expiration Démo | Le serveur doit refuser l’accès métier après `demoExpiresAt`, sauf action Super-admin |
| Conversion Démo | Réalisée par le Super-admin après validation, jamais par le prospect seul |
| Suppression | Interdite pour le tenant historique et contrôlée par confirmation pour les autres tenants |
