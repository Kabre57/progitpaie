# Audit des dépendances

**Date :** 12 août 2026  
**Commande :** `pnpm audit --prod` après `pnpm audit --fix` non forcé

## Résultat

Le correctif automatique non destructif a été appliqué. Le projet conserve **5 vulnérabilités élevées** : `next`, `postcss`, `sharp`, `nodemailer` et `xlsx`.

| Paquet | Gravité | Situation | Décision recommandée |
|---|---|---|---|
| `next@16.2.1` | Haute | Correction disponible en `16.3.0` | Tester puis mettre à jour vers la version compatible approuvée |
| `postcss` | Haute | Transitive de Next | Résoudre via mise à jour Next et revalider le build |
| `sharp` | Haute | Transitive de Next | Résoudre via mise à jour Next et tester l’optimisation d’image |
| `nodemailer@8.x` | Haute | Correction annoncée en `9.0.5`, changement majeur | Vérifier l’API d’envoi, les templates et les tests avant migration |
| `xlsx@0.18.5` | Haute | Aucun correctif npm disponible | Évaluer le remplacement par une bibliothèque maintenue ou isoler/valider strictement les fichiers importés |

## Règle de déploiement

Ne pas exécuter `pnpm audit --fix` automatiquement. Toute mise à jour majeure doit être faite sur une branche dédiée, suivie de `pnpm install --frozen-lockfile`, `pnpm prisma:generate:ci`, `pnpm lint`, `pnpm exec tsc --noEmit`, `ppnpm test:reproducible`, des tests E2E et d’une revue de sécurité.

Le résultat actuel est documenté comme **non résolu mais suivi**. Une mise en production ne doit pas ignorer les paquets `next`, `nodemailer` et `xlsx` sans décision formelle du responsable sécurité.
