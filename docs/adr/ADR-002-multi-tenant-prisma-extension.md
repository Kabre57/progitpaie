# ADR-002 — Isolation multi-tenant par client Prisma borné

- Statut : accepté
- Date : 2026-08-03

## Contexte

La clé de société est portée par `User.companyId`. La plupart des agrégats RH
sont reliés à un utilisateur mais ne possèdent pas encore leur propre
`companyId`. Un filtre manuel oublié peut exposer les données d'une autre société.

## Décision

Chaque route multi-tenant établit d'abord son contexte avec `requireTenant`, qui
relit l'utilisateur en base afin de prendre en compte immédiatement une
désactivation ou un changement de rôle. Elle utilise ensuite
`prismaWithTenant(companyId)` pour les modèles portant directement la clé.

Les agrégats enfants sont bornés par une relation `user.companyId`. Les lectures
par identifiant utilisent `findFirst` avec ce filtre, et non un `findUnique` non
borné. Les créations vérifient d'abord que le parent appartient au tenant.

## Limites et garde-fous

Une extension ne peut pas inventer un filtre sûr pour les modèles sans clé de
tenant ni relation directe. Le client Prisma racine reste réservé à
l'authentification et à l'établissement du contexte. Une future migration devra
ajouter `companyId` non nullable aux agrégats principaux et activer PostgreSQL
Row-Level Security pour une défense en profondeur.

## Validation

- tests unitaires de fusion des filtres ;
- tests d'intégration avec deux sociétés pour employés, paies, présences,
  congés et documents ;
- test négatif d'accès par identifiant appartenant à une autre société.
