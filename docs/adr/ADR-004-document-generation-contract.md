# ADR-004 — Contrat unifié de génération PDF

- Statut : accepté
- Date : 2026-08-03

## Décision

La route `/api/documents/generate` conserve les noms utilisés par les clients
existants (`docType`, `userId`, données personnalisées) et les valide par une
union de types documentaires. Elle répond toujours avec `application/pdf` en cas
de succès et `Cache-Control: no-store, private`.

Les documents individuels exigent un salarié appartenant à la société de
l'administrateur. Les déclarations utilisent les données agrégées déjà produites
par les routes métier. Les alias historiques restent acceptés pendant la période
de migration afin d'éviter une nouvelle rupture du contrat.

## Conséquences

Le format HTTP est restauré sans exposer les modèles Prisma. Une version API
ultérieure pourra normaliser les noms une fois tous les consommateurs migrés et
les contrats versionnés.
