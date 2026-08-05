# Guide de Migration vers PROGITPAIE V2 Clean Architecture

## 📋 Contexte & Objectifs
La version V2 introduit la Clean Architecture, le découplage DDD, la validation Zod stricte et la sécurisation 100% multi-tenant.

## 🔄 Historique et Retrait des API V1 Internes
- Les endpoints internes dépréciés `/api/[module]` ont été désactivés et supprimés au profit de `/api/v2/[module]`.
- Les API Gateway publiques (ex: `/api/v1/employees`, `/api/v1/payroll`) avec authentification par Clé API restent en place et inchangées pour les intégrations tierces.

## ⚙️ Feature Flags
L'application bascule automatiquement vers les routes V2 (`get*Endpoint()`). En cas d'exigence de test spécifique, positionner `NEXT_PUBLIC_*_API_VERSION=v2`.
