# Procédure de Rollback — Module Payroll (API V1 / V2)

- **Module** : `/api/payroll` → `/api/v2/payroll`
- **Statut Procédure** : `VALIDATED`
- **Date de Validation** : 2026-08-05

---

## 1. Contexte & Mécanisme de Reversibilité

Le basculement du frontend et des clients API repose sur le Feature Flag :
`NEXT_PUBLIC_PAYROLL_API_VERSION`

- **Mode V2 (Par défaut post-déploiement)** : `NEXT_PUBLIC_PAYROLL_API_VERSION=v2`
- **Mode Rétrocompatible V1 (Rollback instantané)** : `NEXT_PUBLIC_PAYROLL_API_VERSION=v1`

---

## 2. Procédure Globale de Rollback (Temps d'exécution : < 2 minutes)

En cas d'anomalie critique observée sur `/api/v2/payroll` pendant la période d'observation :

### Étape A : Basculement d'Urgence Frontend
1. Sur le VPS (`/etc/progitpaie/production.env`), définir :
   ```env
   NEXT_PUBLIC_PAYROLL_API_VERSION=v1
   ```
2. Redémarrer le conteneur applicatif :
   ```bash
   sudo docker compose --env-file /etc/progitpaie/production.env up -d app
   ```

### Étape B : Validation de la Prise en Compte
Vérifier avec `curl` que les requêtes vers `/api/payroll` utilisent l'adaptateur V1 rétrocompatible :
```bash
curl -i https://progitpaie.online/api/payroll
```

---

## 3. Statut du Test de Rollback

- **Statut test** : `VALIDATED`
- **Testé par** : Équipe Tech & DevOps PROGITPAIE
- **Conclusion** : Basculement réversible instantané sans altération de la base de données.
