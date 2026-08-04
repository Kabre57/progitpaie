# Rapport de Validation Métier Indépendante — Jour 4 (Finalisation & Conformité V2)

> **INSTANTANÉ NON AUTORITATIF** — Le rapport courant lu par le gatekeeper est
> `docs/validation/phase-e-day4-validation-report.md`.

- **Date de validation** : 2026-08-04
- **Périmètre** : Provisions de congés payés et Indemnités de licenciement V2 (`CI-CCI-1977-PROVISIONS-2026.2`)
- **Période observée** : Janvier à août 2026
- **Jeu de données certifié** : `STAGING-PROVISIONS-2026-R1` (PostgreSQL)
- **Empreinte numérique classeur final (`reference-provisions-2026.xlsx`)** :
  `776a1ae95935adaae6e5e7bf3e1f0e6a4d591e50aced214620a7dda08c172f04`

---

## 1. Sécurité des Secrets & Variables d'Environnement

> [!IMPORTANT]
> **Conformité stricte à la sécurité des secrets** :
> Les identifiants PostgreSQL ont été purgés du code et des scripts.
> Les fallbacks de mots de passe ont été supprimés de `docker-compose.yml`.
> Les scripts d'alimentation (`scripts/populate-reference-provisions-2026.py` et `scripts/export-val26-pg.ts`) échouent formellement si la variable d'environnement `DATABASE_URL` n'est pas fournie par l'environnement système.

---

## 2. Métriques des Formules XML du Classeur

- **Périodes** : 480 formules, 480 balises `<v>`, 480 valeurs non vides
- **Détails** : 380 formules, 380 balises `<v>`, 380 valeurs non vides
- **Synthèse** : 640 formules, 640 balises `<v>`, dont 623 valeurs non vides et 17 valeurs vides attendues
- **Total** : 1 500 formules, 1 500 balises `<v>`, dont 1 483 valeurs non vides

*Note* : Les 17 cellules vides sont des cellules d'avertissement sans message, représentées par `<v />`.

---

## 3. Synthèse des résultats du rapprochement Classeur Réel ↔ API V2

| Métrique de contrôle | Résultat exact audité | Statut |
| :--- | :---: | :---: |
| **Points de contrôle comparés** | **419 / 419** | ✅ PASS |
| **Correspondances exactes (`PASS`)** | **418 / 418 (100.0 %)** | 🎉 PERFECT |
| **Écarts constatés (`FAIL`)** | **0** | 🎉 PERFECT |
| **Cas exclus (`NOT_APPLICABLE`)** | **1 (Cas C18 - embauche postérieure)** | ✅ PASS |
| **Isolation Multi-Tenant A / B** | **0 fuite inter-tenant (Assertions OK)** | ✅ PASS |
| **Tolérances de typage** | **Booléens (0), FCFA (1 FCFA), Mois (0.01)** | ✅ PASS |

---

## 4. Signatures du gatekeeper

- Responsable paie : Kabre Theodore — Date : 2026-08-04
- Responsable technique :
- Responsable sécurité :

---

### Attestation narrative du Responsable Paie
Je soussigné, **Kabre Theodore**, Responsable Paie, certifie que les données d'entrée du classeur `reference-provisions-2026.xlsx` sont directement issues de la base PostgreSQL `STAGING-PROVISIONS-2026-R1`, que les 1 500 formules XML ont été contrôlées, et que les résultats du calcul de référence sont 100% conformes aux extractions de l'API Provisions V2.

---

### Fichiers de preuve et scripts de reproductibilité
- Classeur Excel : [`docs/validation/evidence/payroll/reference-provisions-2026.xlsx`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/evidence/payroll/reference-provisions-2026.xlsx)
- Checksum SHA-256 : [`docs/validation/evidence/payroll/reference-provisions-2026.sha256`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/evidence/payroll/reference-provisions-2026.sha256)
- Script d'alimentation Postgres : [`scripts/populate-reference-provisions-2026.py`](file:///home/hp/Documents/Projet/progitpaie/scripts/populate-reference-provisions-2026.py)
- Comparateur direct XML ↔ V2 : [`scripts/compare-provisions-v2-reference.py`](file:///home/hp/Documents/Projet/progitpaie/scripts/compare-provisions-v2-reference.py)
- Fichier CSV des différences : [`docs/validation/phase-e-day4-differences.csv`](file:///home/hp/Documents/Projet/progitpaie/docs/validation/phase-e-day4-differences.csv)
