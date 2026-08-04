#!/bin/bash
set -euo pipefail

MODE="pre-removal"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    *)
      echo "Option inconnue : $1"
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "pre-removal" && "$MODE" != "final" ]]; then
  echo "Mode invalide : $MODE (valeurs autorisées : pre-removal, final)"
  exit 1
fi

TOTAL=0
PASSED=0
FAILED=0

pass() {
  echo "PASS [$1]: $2"
  TOTAL=$((TOTAL + 1))
  PASSED=$((PASSED + 1))
}

fail() {
  echo "FAIL [$1]: $2"
  TOTAL=$((TOTAL + 1))
  FAILED=$((FAILED + 1))
}

echo "=== Gatekeeper Retrait API Historique Provisions ($MODE) ==="

check_env_bool() {
  local key="$1"
  local val="${!key:-false}"
  if [[ "$val" == "true" ]]; then
    pass "$key" "déclaré à true"
  else
    fail "$key" "la variable doit valoir true"
  fi
}

check_env_bool "LEGACY_REMOVAL_PAYROLL_SIGNED"
check_env_bool "LEGACY_REMOVAL_V2_DEPLOYED"
check_env_bool "LEGACY_REMOVAL_OBSERVATION_COMPLETE"
check_env_bool "LEGACY_REMOVAL_ZERO_CALLS"
check_env_bool "LEGACY_REMOVAL_ROLLBACK_READY"

REPORT_PATH="docs/validation/phase-e-day4-validation-report.md"

check_signature() {
  local role="$1"
  local tag="$2"
  if [[ ! -f "$REPORT_PATH" ]]; then
    fail "$tag" "rapport introuvable ($REPORT_PATH)"
    return
  fi

  local line
  line=$(grep -E "^- Responsable ${role} :" "$REPORT_PATH" || true)

  if [[ -z "$line" ]]; then
    fail "$tag" "ligne de signature introuvable pour $role"
    return
  fi

  local name_date
  name_date=$(echo "$line" | sed -E "s/^- Responsable ${role} : //")
  local name
  name=$(echo "$name_date" | awk -F '—' '{print $1}' | xargs || true)
  local date_part
  date_part=$(echo "$name_date" | grep -oE 'Date : [0-9]{4}-[0-9]{2}-[0-9]{2}' | awk '{print $3}' || true)

  if [[ -n "$name" && "$name" != "Nom réel" && -n "$date_part" ]]; then
    pass "$tag" "signé par $name le $date_part"
  else
    fail "$tag" "signature de Responsable $role non renseignée"
  fi
}

check_signature "paie" "SIGNATURE_METIER"
check_signature "technique" "SIGNATURE_TECHNIQUE"
check_signature "sécurité" "SIGNATURE_SECURITE"

FE_PROOF="docs/validation/evidence/deployment/frontend-v2.txt"
if [[ "${FRONTEND_V2_DEPLOYE:-false}" == "true" ]]; then
  pass "FRONTEND_V2_DEPLOYE" "déclaré via variable d'environnement"
elif [[ -f "$FE_PROOF" && -s "$FE_PROOF" ]]; then
  pass "FRONTEND_V2_DEPLOYE" "preuve de déploiement présente ($FE_PROOF)"
else
  fail "FRONTEND_V2_DEPLOYE" "définir FRONTEND_V2_DEPLOYE=true ou fournir $FE_PROOF"
fi

E2E_PROOF="docs/validation/evidence/e2e/provisions-last-run.txt"
E2E_FILE="tests/e2e/provisions.spec.ts"
if [[ -f "$E2E_PROOF" && -s "$E2E_PROOF" ]]; then
  pass "E2E_VALIDE" "preuve d'exécution E2E trouvée ($E2E_PROOF)"
elif [[ -f "$E2E_FILE" ]]; then
  file_age_days=$(( ($(date +%s) - $(stat -c %Y "$E2E_FILE")) / 86400 ))
  if [[ "$file_age_days" -le 7 ]]; then
    pass "E2E_VALIDE" "fichier de test E2E récent ($E2E_FILE)"
  else
    fail "E2E_VALIDE" "fichier de test E2E trop ancien ($file_age_days jours)"
  fi
else
  fail "E2E_VALIDE" "test ou preuve récente manquante : $E2E_PROOF"
fi

OBS_START="${OBSERVATION_STARTED_AT:-}"
if [[ -n "$OBS_START" ]]; then
  start_sec=$(date -d "$OBS_START" +%s 2>/dev/null || echo 0)
  now_sec=$(date +%s)
  elapsed_days=$(( (now_sec - start_sec) / 86400 ))
  if [[ "$start_sec" -gt 0 && "$elapsed_days" -ge 7 ]]; then
    pass "OBSERVATION_SEPT_JOURS" "période d'observation terminée ($elapsed_days jours)"
  else
    fail "OBSERVATION_SEPT_JOURS" "observation en cours ($elapsed_days/7 jours)"
  fi
else
  fail "OBSERVATION_SEPT_JOURS" "définir OBSERVATION_STARTED_AT=YYYY-MM-DD"
fi

LEGACY_LOG="${LEGACY_LOG_PATH:-}"
if [[ -n "$LEGACY_LOG" && -f "$LEGACY_LOG" ]]; then
  legacy_calls=$(grep -c "GET /api/payroll/provisions" "$LEGACY_LOG" || true)
  if [[ "$legacy_calls" -eq 0 ]]; then
    pass "ZERO_APPEL_LEGACY" "0 appel détecté dans $LEGACY_LOG"
  else
    fail "ZERO_APPEL_LEGACY" "$legacy_calls appel(s) legacy détecté(s) dans $LEGACY_LOG"
  fi
else
  fail "ZERO_APPEL_LEGACY" "définir LEGACY_LOG_PATH vers des logs existants"
fi

ROLLBACK_DOC="docs/rollback/provisions-legacy-rollback.md"
if [[ -f "$ROLLBACK_DOC" ]] && grep -q "Statut test : VALIDATED" "$ROLLBACK_DOC"; then
  pass "ROLLBACK_TESTE" "procédure validée ($ROLLBACK_DOC)"
else
  fail "ROLLBACK_TESTE" "preuve absente, incomplète ou non VALIDATED : $ROLLBACK_DOC"
fi

if [[ "$MODE" == "final" ]]; then
  DOC_FINAL="docs/architecture/implementation-status-report.md"
  if [[ -f "$DOC_FINAL" ]] && grep -q "Périmètre : Sprint 1 multi-tenant, Sprint 2 Provisions V2" "$DOC_FINAL"; then
    pass "DOCUMENTATION_FINALE" "rapport complet vérifié ($DOC_FINAL)"
  else
    fail "DOCUMENTATION_FINALE" "rapport incomplet ou introuvable : $DOC_FINAL"
  fi
fi

echo ""
echo "Résumé gatekeeper ($MODE) : $PASSED/$TOTAL conditions satisfaites, $FAILED échec(s)"

if [[ "$FAILED" -eq 0 ]]; then
  if [[ "$MODE" == "pre-removal" ]]; then
    echo "READY FOR LEGACY REMOVAL"
  else
    echo "READY FOR FINAL REVIEW"
  fi
  exit 0
else
  echo "DO NOT MERGE"
  exit 1
fi
