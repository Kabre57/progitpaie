# Plan d'Exécution Opérationnel — Finalisation & Retrait API Legacy Provisions V2

- **Date d'initialisation** : 2026-08-05
- **Auteur** : Équipe d'Ingénierie PROGITPAIE
- **Statut Gatekeeper initial** : `6/13 pre-removal` (Preuves physiques & signatures validées)
- **Objectif final** : `13/13 pre-removal` (J+7) puis `18/18 final` (Retrait du code legacy)

---

## ÉTAPE 1 : Démarrage de l'Observation de 7 jours (Aujourd'hui — 2026-08-05)

### 1. Commandes à exécuter sur le VPS
Activer la capture des logs Nginx / Docker et enregistrer l'horodatage d'initialisation :

```bash
# Sur le VPS theo_pbl@vps117662
mkdir -p ~/apps/progitpaie/logs/observation-2026-08

# Création du fichier d'initialisation d'observation
cat << 'EOF' > ~/apps/progitpaie/logs/observation-2026-08/observation-init.env
OBSERVATION_STARTED_AT=2026-08-05T12:30:00Z
OBSERVATION_LOG_DIR=/home/theo_pbl/apps/progitpaie/logs/observation-2026-08
EOF

# Redirection continue des logs du conteneur app vers le fichier de suivi
sudo docker compose --env-file /etc/progitpaie/production.env logs -f app > ~/apps/progitpaie/logs/observation-2026-08/production-app.log 2>&1 &
```

### 2. Preuves à créer (sur la machine locale)
Consigner la preuve du démarrage officiel de la période d'observation dans le dépôt Git.

Fichier : `docs/validation/evidence/observation/observation-init.txt`
```properties
status=RUNNING
started_at=2026-08-05T12:30:00Z
expected_end_at=2026-08-12T12:30:00Z
min_observation_hours=168
monitored_route=/api/payroll/provisions
verified_by=Kabre Theodore
```

### 3. Critères de validation & Vérifications
- `OBSERVATION_STARTED_AT` est un timestamp UTC ISO-8601 valide.
- Les logs du conteneur `progitpaie-app` sont enregistrés sans interruption.

---

## ÉTAPE 2 : Suivi & Collecte Quotidienne des Logs (Du 2026-08-06 au 2026-08-11)

### 1. Commandes à exécuter quotidiennement (sur le VPS)
Vérifier l'absence d'appels à la route historique et l'absence d'erreurs serveur :

```bash
# 1. Contrôler si la route legacy a été appelée (doit retourner 0)
grep -c "GET /api/payroll/provisions" ~/apps/progitpaie/logs/observation-2026-08/production-app.log || true

# 2. Analyser le fichier avec le script d'audit
node scripts/analyze-provisions-observation.mjs ~/apps/progitpaie/logs/observation-2026-08/production-app.log
```

### 2. Preuves & Journal Quotidien
Consigner les vérifications dans `docs/validation/evidence/observation/daily-log.md` :

| Jour | Date | Total Appels V2 | Appels Legacy (doit être 0) | Erreurs 500 | Statut |
|---|---|---|---|---|---|
| J+1 | 2026-08-06 | ... | 0 | 0 | ✅ PASS |
| J+2 | 2026-08-07 | ... | 0 | 0 | ✅ PASS |
| J+3 | 2026-08-08 | ... | 0 | 0 | ✅ PASS |
| J+4 | 2026-08-09 | ... | 0 | 0 | ✅ PASS |
| J+5 | 2026-08-10 | ... | 0 | 0 | ✅ PASS |
| J+6 | 2026-08-11 | ... | 0 | 0 | ✅ PASS |
| J+7 | 2026-08-12 | ... | 0 | 0 | ✅ PASS |

---

## ÉTAPE 3 : Validation Pre-Removal 13/13 (À J+7 — 2026-08-12T12:30:00Z)

### 1. Commandes sur le VPS
Calculer l'empreinte SHA-256 du fichier complet de logs et récupérer les logs bruts.

```bash
# Calcul de l'empreinte SHA-256 du corpus de logs
sha256sum ~/apps/progitpaie/logs/observation-2026-08/production-app.log
```

### 2. Preuves à créer (sur la machine locale)
Fichier : `docs/validation/evidence/observation/provisions-observation.txt`
```properties
status=PASS
started_at=2026-08-05T12:30:00Z
ended_at=2026-08-12T12:30:00Z
elapsed_hours=168
legacy_calls=0
tenant_incidents=0
critical_errors=0
p95_ms=115.0
logs_sha256=<EMPREINTE_SHA256_RÉELLE>
verified_by=Kabre Theodore
```

### 3. Exécution du Gatekeeper Pre-Removal 13/13
Sur la machine locale ou le VPS :

```bash
OBSERVATION_STARTED_AT="2026-08-05T12:30:00Z" \
LEGACY_LOG_PATH="logs/production-app.log" \
LEGACY_REMOVAL_PAYROLL_SIGNED=true \
LEGACY_REMOVAL_V2_DEPLOYED=true \
LEGACY_REMOVAL_OBSERVATION_COMPLETE=true \
LEGACY_REMOVAL_ZERO_CALLS=true \
LEGACY_REMOVAL_ROLLBACK_READY=true \
bash scripts/check-provisions-legacy-removal-readiness.sh --mode pre-removal
```

**Résultat attendu** : `13/13 — READY FOR LEGACY REMOVAL`.

---

## ÉTAPE 4 : Retrait du Code Legacy & Validation Finale 18/18

### 1. Commandes Git (sur la machine locale)
```bash
# 1. Créer la branche de suppression
git checkout -b chore/remove-provisions-legacy

# 2. Supprimer la route API historique, le mapper et le resolver
git rm app/api/payroll/provisions/route.ts
git rm lib/application/payroll/provisions/legacy-provision.mapper.ts
git rm lib/config/provision-api-version.ts

# 3. Supprimer toute référence aux variables d'environnement de versioning legacy dans .env.example
```

### 2. Exécution du Gatekeeper Final 18/18
```bash
OBSERVATION_STARTED_AT="2026-08-05T12:30:00Z" \
LEGACY_LOG_PATH="logs/production-app.log" \
LEGACY_REMOVAL_PAYROLL_SIGNED=true \
LEGACY_REMOVAL_V2_DEPLOYED=true \
LEGACY_REMOVAL_OBSERVATION_COMPLETE=true \
LEGACY_REMOVAL_ZERO_CALLS=true \
LEGACY_REMOVAL_ROLLBACK_READY=true \
bash scripts/check-provisions-legacy-removal-readiness.sh --mode final
```

**Résultat attendu** : `18/18 — READY FOR FINAL REVIEW`.

### 3. Commit, Push & Fusion
```bash
git commit -m "chore(payroll): remove legacy provisions API, mapper, and versioning feature flags"
git push origin chore/remove-provisions-legacy
```
