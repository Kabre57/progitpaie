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

echo "=== Gatekeeper Retrait API Historique Payroll ($MODE) ==="

check_env_bool() {
  local key="$1"
  local val="${!key:-false}"
  if [[ "$val" == "true" ]]; then
    pass "$key" "déclaré à true"
  else
    fail "$key" "la variable doit valoir true"
  fi
}

check_env_bool "PAYROLL_LEGACY_REMOVAL_SIGNED"
check_env_bool "PAYROLL_LEGACY_REMOVAL_V2_DEPLOYED"
check_env_bool "PAYROLL_LEGACY_REMOVAL_OBSERVATION_COMPLETE"
check_env_bool "PAYROLL_LEGACY_REMOVAL_ZERO_CALLS"
check_env_bool "PAYROLL_LEGACY_REMOVAL_ROLLBACK_READY"

REPORT_PATH="docs/adr/ADR-007-payroll-api-v2-clean-architecture.md"

if [[ -f "$REPORT_PATH" ]]; then
  pass "ADR_007" "ADR-007 présent ($REPORT_PATH)"
else
  fail "ADR_007" "ADR-007 introuvable ($REPORT_PATH)"
fi

FE_PROOF="lib/config/payroll-api-version.ts"
if [[ -f "$FE_PROOF" && -s "$FE_PROOF" ]]; then
  pass "FRONTEND_PAYROLL_V2_CONFIG" "config Feature Flag présente ($FE_PROOF)"
else
  fail "FRONTEND_PAYROLL_V2_CONFIG" "fichier de configuration $FE_PROOF introuvable"
fi

E2E_FILE="tests/e2e/payroll-v2.spec.ts"
if [[ -f "$E2E_FILE" ]]; then
  pass "E2E_PAYROLL_V2" "suite E2E présente ($E2E_FILE)"
else
  fail "E2E_PAYROLL_V2" "suite E2E introuvable : $E2E_FILE"
fi

OBS_START="${PAYROLL_OBSERVATION_STARTED_AT:-}"
if [[ -n "$OBS_START" ]]; then
  start_sec=$(date -d "$OBS_START" +%s 2>/dev/null || echo 0)
  now_sec=$(date +%s)
  elapsed_days=$(( (now_sec - start_sec) / 86400 ))
  if [[ "$start_sec" -gt 0 && "$elapsed_days" -ge 7 ]]; then
    pass "PAYROLL_OBSERVATION_SEPT_JOURS" "période d'observation terminée ($elapsed_days jours)"
  else
    fail "PAYROLL_OBSERVATION_SEPT_JOURS" "observation en cours ($elapsed_days/7 jours)"
  fi
else
  fail "PAYROLL_OBSERVATION_SEPT_JOURS" "définir PAYROLL_OBSERVATION_STARTED_AT=YYYY-MM-DD"
fi

LEGACY_LOG="${PAYROLL_LEGACY_LOG_PATH:-}"
if [[ -n "$LEGACY_LOG" && -f "$LEGACY_LOG" ]]; then
  legacy_calls=$(grep -E "(GET|POST|PUT|PATCH|DELETE) /api/payroll" "$LEGACY_LOG" | grep -v "/api/v2/payroll" | wc -l || true)
  if [[ "$legacy_calls" -eq 0 ]]; then
    pass "PAYROLL_ZERO_APPEL_LEGACY" "0 appel legacy détecté dans $LEGACY_LOG"
  else
    fail "PAYROLL_ZERO_APPEL_LEGACY" "$legacy_calls appel(s) legacy détecté(s) dans $LEGACY_LOG"
  fi
else
  fail "PAYROLL_ZERO_APPEL_LEGACY" "définir PAYROLL_LEGACY_LOG_PATH vers des logs existants"
fi

ROLLBACK_DOC="docs/rollback/payroll-legacy-rollback.md"
if [[ -f "$ROLLBACK_DOC" ]]; then
  pass "PAYROLL_ROLLBACK_DOC" "procédure de rollback documentée ($ROLLBACK_DOC)"
else
  fail "PAYROLL_ROLLBACK_DOC" "document $ROLLBACK_DOC introuvable"
fi

if [[ "$MODE" == "final" ]]; then
  DOC_FINAL="docs/architecture/api-v1-v2-architecture-and-migration-report.md"
  if [[ -f "$DOC_FINAL" ]]; then
    pass "DOCUMENTATION_PAYROLL_FINALE" "rapport de migration vérifié ($DOC_FINAL)"
  else
    fail "DOCUMENTATION_PAYROLL_FINALE" "rapport incomplet ou introuvable : $DOC_FINAL"
  fi
fi

echo ""
echo "Résumé gatekeeper Payroll ($MODE) : $PASSED/$TOTAL conditions satisfaites, $FAILED échec(s)"

if [[ "$FAILED" -eq 0 ]]; then
  if [[ "$MODE" == "pre-removal" ]]; then
    echo "READY FOR PAYROLL LEGACY REMOVAL"
  else
    echo "READY FOR FINAL PAYROLL REVIEW"
  fi
  exit 0
else
  echo "DO NOT MERGE"
  exit 1
fi
