# Rapport de test fonctionnel complet — PROGITPAIE

**Version testée : 1.6.1**  
**Date : 12 août 2026**  
**Environnement : Node 22.13.0, pnpm 11.21.0, PostgreSQL 16 local, Redis 7 local**

## Synthèse

Le scénario de bout en bout a été exécuté avec un compte administrateur, une entreprise de test, quinze salariés présentant une ancienneté de 1 à 15 ans, des contrats CDI et CDD, des rémunérations différenciées, des présences régulières et irrégulières, des heures supplémentaires, une demande de congé, des bulletins de paie et des déclarations.

La génération de paie est opérationnelle pour les quinze salariés. Les bulletins contiennent les éléments de rémunération, les retenues CNPS/ITS/IGR/FDFP, les compteurs de présence et les montants nets. Un bulletin a été finalisé avec succès. Les exports XLSX, le PDF de bulletin, les déclarations et le journal comptable ont également été vérifiés.

## Données de test créées

| Élément | Résultat |
|---|---:|
| Entreprise principale | 1 |
| Compte administrateur | 1 |
| Département | Ressources Humaines |
| Horaire | Équipe Jour Test, 08:00–17:00 |
| Salariés | 15 |
| Anciennetés | 1, 2, 3, …, 15 ans |
| Contrats | 15, dont CDI et CDD |
| Pointages | 75 |
| Heures supplémentaires | 8 |
| Bulletins générés | 15 |
| Bulletin finalisé | 1 |
| Demandes de congé | 1 |
| Congé approuvé | 1 |

Les huit premiers salariés ont des présences régulières. Les sept suivants couvrent les cas de retard, d’absence, de demi-journée et d’exception GPS. La répartition vérifiée en base est de 40 présences, 14 retards, 7 absences et 14 demi-journées. L’ancienneté observée s’étend bien de 1 à 15 ans.

## Parcours fonctionnels vérifiés

| Parcours | Résultat | Détail |
|---|---|---|
| Inscription initiale | Réussi | HTTP 201, création du premier tenant et du compte admin |
| Connexion | Réussi | HTTP 200, session administrateur active |
| Liste salariés API | Réussi | 15 salariés retournés avec ancienneté calculée |
| Contrats | Réussi | 15 contrats retournés |
| Pointages | Réussi | 75 enregistrements créés et lisibles |
| Génération paie | Réussi | 15 bulletins générés en HTTP 201 |
| Lecture paie | Réussi | Bulletins août 2026 lisibles |
| Finalisation paie | Réussi | Passage de `draft` à `finalized` en HTTP 200 |
| Bulletin PDF | Réussi | HTTP 200, `application/pdf` |
| Congé | Réussi | Création HTTP 201, puis approbation PUT HTTP 200 |
| CNPS | Réussi | Déclaration v2 HTTP 200 |
| ITS | Réussi | Déclaration v2 HTTP 200 |
| Export salariés | Réussi | Fichier XLSX généré |
| Export présences | Réussi | Fichier XLSX généré |
| Journal comptable | Réussi | HTTP 200 avec données |
| Santé applicative | Réussi | `/api/health` HTTP 200 |

## Anomalies corrigées

### Inscription impossible sans société principale

L’API d’inscription appelait `getDefaultCompanyId()` avant qu’une entreprise n’existe. La première inscription retournait donc une erreur serveur indiquant qu’aucune société principale active n’était configurée. L’API crée maintenant la première société principale lorsque le premier compte est créé. Le formulaire accepte également le champ français **Nom de l’entreprise** et le transmet à l’API.

### Route `/register` affichant la connexion

Le composant `AuthUI` initialisait toujours son état en mode connexion. La page `/register` affiche maintenant directement le formulaire **Créer un compte** grâce à la propriété `initialMode="signup"`.

### Risque de fuite des identifiants par soumission GET

Les formulaires d’inscription et de connexion ont été sécurisés avec `method="post"`. En cas de problème d’hydratation JavaScript, les mots de passe ne sont plus ajoutés à l’URL sous forme de paramètres GET.

### Démarrage standalone

Le script `start` utilise désormais `node .next/standalone/server.js` au lieu de `next start`, qui est incompatible avec `output: "standalone"`.

## Validation technique finale

Les commandes suivantes ont été exécutées avec succès après les corrections :

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

La suite automatisée reste à **70 suites et 312 tests réussis**. Le lint ne remonte aucune erreur bloquante, mais conserve des avertissements préexistants qui devront être traités dans un chantier séparé.

## Limites constatées

La construction Docker complète n’a pas pu être exécutée dans l’environnement d’audit car Docker n’est pas installé. PostgreSQL et Redis ont donc été installés localement pour exécuter les fonctionnalités métier. Le navigateur de test a également rencontré un crash loop lors de la vérification séparée du serveur standalone ; cette limite du navigateur n’empêche pas la validation technique du build ni la validation API effectuée sur le serveur de développement.

Le registre salariés restait en chargement dans l’interface visualisée via le proxy de développement alors que son API retournait correctement les quinze salariés. Ce symptôme est compatible avec la limitation du proxy HMR utilisée pour la visualisation ; il doit être rejoué dans le navigateur local après extraction, avec `pnpm start`, pour une validation UI définitive.

## Rejouer le scénario

Après configuration de PostgreSQL et Redis, le jeu de données peut être recréé avec :

```bash
DATABASE_URL="postgresql://..." pnpm test:functional
```

La commande est idempotente pour les quinze salariés, les contrats et les pointages de test. Elle ne doit être exécutée que dans une base de démonstration et jamais dans une base de production.
