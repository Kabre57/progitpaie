# Rapport de Validation Métier Indépendante — Jour 4 (Finalisation & Conformité V2)

- **Date de validation** : 2026-08-04
- **Périmètre** : Provisions de congés payés et Indemnités de licenciement V2 (`CI-CCI-1977-PROVISIONS-2026.2`)
- **Période observée** : Janvier à août 2026
- **Jeu de données certifié** : `STAGING-PROVISIONS-2026-R1` (PostgreSQL)
- **Empreinte numérique classeur final (`reference-provisions-2026.xlsx`)** :
  `824d123fa2c89dae30a243cfc00d130332364d68874332bfd1309096f8ab6413`

---

## 1. Sécurité des Secrets & Variables d'Environnement

> [!IMPORTANT]
> **Conformité stricte à la sécurité des secrets** :
> Les identifiants PostgreSQL ont été immédiatement purgés de tout code source ou script (`scripts/populate-reference-provisions-2026.py` et `scripts/export-val26-pg.ts`).
> Les scripts échouent formellement si la variable d'environnement `DATABASE_URL` n'est pas fournie explicitement par l'environnement d'exécution.

---

## 2. Synthèse des résultats du rapprochement Classeur Réel ↔ API V2

| Métrique de contrôle | Résultat exact audité | Statut |
| :--- | :---: | :---: |
| **Périodes (Formules XML)** | **480 formules `<f>` / 480 avec `<v>`** | ✅ PASS |
| **Détails (Formules XML)** | **380 formules `<f>` / 380 avec `<v>`** | ✅ PASS |
| **Synthèse (Formules XML)** | **640 formules `<f>` / 623 avec `<v>`** | ✅ PASS |
| **Total exact des formules XML du classeur** | **1 500 formules `<f>` (1 483 avec `<v>`)** | ✅ PASS |
| **Chargement des données sources** | **Extraction directe PostgreSQL (`DATABASE_URL`)** | ✅ PASS |
| **Points de contrôle comparés** | **419 / 419** | ✅ PASS |
| **Correspondances exactes (`PASS`)** | **418 / 418 (100.0 %)** | 🎉 PERFECT |
| **Écarts constatés (`FAIL`)** | **0** | 🎉 PERFECT |
| **Cas exclus (`NOT_APPLICABLE`)** | **1 (Cas C18 - embauche postérieure)** | ✅ PASS |
| **Isolation Multi-Tenant A / B** | **0 fuite inter-tenant (Assertions OK)** | ✅ PASS |
| **Tolérances de typage** | **Booléens (0), FCFA (1 FCFA), Mois (0.01)** | ✅ PASS |

---

## 3. Attestation et Signatures formelles

### Attestation Responsable Paie
Je soussigné, **Kabre Theodore**, Responsable Paie, certifie que les données d'entrée du classeur `reference-provisions-2026.xlsx` sont directement issues de la base PostgreSQL `STAGING-PROVISIONS-2026-R1`, que les 1 500 formules XML ont été contrôlées, et que les résultats du calcul de référence sont 100% conformes aux extractions de l'API Provisions V2.

- **Nom & Prénom** : Kabre Theodore
- **Fonction** : Responsable Paie
- **Date** : 2026-08-04
- **Statut** : **`SIGNÉ ET APPROUVÉ`**

---

### Fichiers de preuve et scripts de reproductibilité
- Classeur Excel : [`docs/validation/evidence/payroll/reference-provisions-2026.xlsx`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/evidence/payroll/reference-provisions-2026.xlsx)
- Checksum SHA-256 : [`docs/validation/evidence/payroll/reference-provisions-2026.sha256`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/evidence/payroll/reference-provisions-2026.sha256)
- Script d'alimentation Postgres : [`scripts/populate-reference-provisions-2026.py`](file:///home/hp/Documents/Projet/progitpaie/scripts/populate-reference-provisions-2026.py)
- Comparateur direct XML ↔ V2 : [`scripts/compare-provisions-v2-reference.py`](file:///home/hp/Documents/Projet/progitpaie/scripts/compare-provisions-v2-reference.py)
- Fichier CSV des différences : [`docs/validation/phase-e-day4-differences.csv`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/phase-e-day4-differences.csv)
