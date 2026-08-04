#!/usr/bin/env bash
set -u

# Gatekeeper de suppression de l'API Provisions legacy.
# Modes :
#   --mode pre-removal : preuves opérationnelles uniquement ; le legacy doit encore être présent.
#   --mode final       : preuves opérationnelles + suppression structurelle + documentation finale.
# Sans paramètre, le mode final est conservé pour compatibilité.
#
# Variables déclaratives historiques (toutes doivent valoir "true") :
#   LEGACY_REMOVAL_PAYROLL_SIGNED
#   LEGACY_REMOVAL_V2_DEPLOYED
#   LEGACY_REMOVAL_OBSERVATION_COMPLETE
#   LEGACY_REMOVAL_ZERO_CALLS
#   LEGACY_REMOVAL_ROLLBACK_READY
#
# Nouvelles preuves configurables :
#   FRONTEND_V2_DEPLOYE=true
#     ou FRONTEND_V2_EVIDENCE_FILE=/chemin/preuve.txt
#     La preuve doit contenir status=DEPLOYED et api_version=v2.
#   PROVISIONS_E2E_EVIDENCE_FILE=/chemin/preuve-e2e.txt
#     Défaut : docs/validation/evidence/e2e/provisions-last-run.txt
#     Format : status=PASS et executed_at=YYYY-MM-DD ou ISO-8601.
#   E2E_MAX_AGE_DAYS=7
#   OBSERVATION_STARTED_AT=YYYY-MM-DD
#   OBSERVATION_MIN_DAYS=7
#   LEGACY_LOG_PATH=/chemin/fichier-ou-dossier-de-logs
#   ROLLBACK_EVIDENCE_FILE=docs/rollback/provisions-legacy-rollback.md

legacy_route="app/api/payroll/provisions/route.ts"
legacy_mapper="lib/application/payroll/provisions/legacy-provision.mapper.ts"
flag_file="lib/config/provision-api-version.ts"
signature_file="docs/validation/phase-e-day4-validation-report.md"
migration_guide="docs/migrations/provisions-api-v2.md"
e2e_test_file="tests/e2e/provisions.spec.ts"
e2e_evidence_file="${PROVISIONS_E2E_EVIDENCE_FILE:-docs/validation/evidence/e2e/provisions-last-run.txt}"
frontend_evidence_file="${FRONTEND_V2_EVIDENCE_FILE:-docs/validation/evidence/deployment/frontend-v2.txt}"
rollback_file="${ROLLBACK_EVIDENCE_FILE:-docs/rollback/provisions-legacy-rollback.md}"
e2e_max_age_days="${E2E_MAX_AGE_DAYS:-7}"
observation_min_days="${OBSERVATION_MIN_DAYS:-7}"
mode="final"

if [[ "${1:-}" == "--mode" ]]; then
  mode="${2:-}"
  shift 2 || true
elif [[ "${1:-}" == --mode=* ]]; then
  mode="${1#--mode=}"
  shift || true
fi

if [[ "$mode" != "pre-removal" && "$mode" != "final" ]]; then
  echo "Usage: $0 [--mode pre-removal|final]" >&2
  exit 2
fi
if (( $# > 0 )); then
  echo "Argument inattendu : $1" >&2
  echo "Usage: $0 [--mode pre-removal|final]" >&2
  exit 2
fi

total=0
passed=0
failed=0

pass() {
  local label="$1"
  local message="$2"
  total=$((total + 1))
  passed=$((passed + 1))
  echo "PASS [$label]: $message"
}

fail() {
  local label="$1"
  local message="$2"
  total=$((total + 1))
  failed=$((failed + 1))
  echo "FAIL [$label]: $message"
}

check_absent() {
  local label="$1"
  local target="$2"
  if [[ -e "$target" ]]; then
    fail "$label" "$target existe encore"
  else
    pass "$label" "$target est absent"
  fi
}

valid_date() {
  local value="$1"
  [[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}([Tt][0-9]{2}:[0-9]{2}:[0-9]{2}([Zz]|[+-][0-9]{2}:[0-9]{2})?)?$ ]] \
    && date -u -d "$value" +%s >/dev/null 2>&1
}

check_signature() {
  local label="$1"
  local role="$2"
  if [[ ! -f "$signature_file" ]]; then
    fail "$label" "rapport absent : $signature_file"
    return
  fi
  local line
  line="$(rg -m 1 "^- ${role} :" "$signature_file" || true)"
  if [[ -z "$line" || "$line" =~ _{2,} ]]; then
    fail "$label" "signature de ${role} non renseignée"
    return
  fi
  if [[ ! "$line" =~ Date[[:space:]]*:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    fail "$label" "date de signature de ${role} absente ou invalide"
    return
  fi
  local signed_at="${BASH_REMATCH[1]}"
  if ! valid_date "$signed_at"; then
    fail "$label" "date de signature de ${role} impossible : $signed_at"
    return
  fi
  pass "$label" "${role} a signé le ${signed_at}"
}

# Les contrôles structurels ne deviennent applicables qu'après la suppression effective.
if [[ "$mode" == "final" ]]; then
  check_absent "LEGACY_ROUTE_ABSENTE" "$legacy_route"
  check_absent "LEGACY_MAPPER_ABSENT" "$legacy_mapper"
  check_absent "FEATURE_FLAG_ABSENT" "$flag_file"

  if rg -n '/api/payroll/provisions|legacy-provision\.mapper|NEXT_PUBLIC_PROVISIONS_API_VERSION' \
    app components lib shared .env.example --glob '!**/__tests__/**' >/dev/null; then
    fail "REFERENCES_LEGACY_ABSENTES" "références legacy détectées dans le code exécutable"
  else
    pass "REFERENCES_LEGACY_ABSENTES" "aucune référence legacy dans le code exécutable"
  fi
fi

required_legacy_gates=(
  LEGACY_REMOVAL_PAYROLL_SIGNED
  LEGACY_REMOVAL_V2_DEPLOYED
  LEGACY_REMOVAL_OBSERVATION_COMPLETE
  LEGACY_REMOVAL_ZERO_CALLS
  LEGACY_REMOVAL_ROLLBACK_READY
)

for gate in "${required_legacy_gates[@]}"; do
  if [[ "${!gate:-}" == "true" ]]; then
    pass "$gate" "confirmation déclarative présente"
  else
    fail "$gate" "la variable doit valoir true"
  fi
done

# 1–3. Signatures documentaires explicites.
check_signature "SIGNATURE_METIER" "Responsable paie"
check_signature "SIGNATURE_TECHNIQUE" "Responsable technique"
check_signature "SIGNATURE_SECURITE" "Responsable sécurité"

# La date de suppression n'existe légitimement qu'en mode final.
if [[ "$mode" == "final" ]]; then
  documentation_complete=true
  if [[ ! -f "$migration_guide" ]]; then
    documentation_complete=false
  else
    required_sections=("## Correspondance des contrats" "## Activation frontend" "## Rollback avant suppression" "## Date de suppression")
    for section in "${required_sections[@]}"; do
      if ! rg -F "$section" "$migration_guide" >/dev/null; then documentation_complete=false; fi
    done
  fi
  removal_date=""
  if [[ -f "$migration_guide" ]]; then
    removal_date="$(sed -nE 's/^- Date de suppression : ([0-9]{4}-[0-9]{2}-[0-9]{2})$/\1/p' "$migration_guide" | head -n 1)"
  fi
  if [[ "$documentation_complete" == "true" && -n "$removal_date" ]] && valid_date "$removal_date"; then
    pass "DOCUMENTATION_FINALE" "guide complet, suppression planifiée le $removal_date"
  else
    fail "DOCUMENTATION_FINALE" "guide incomplet ou ligne '- Date de suppression : YYYY-MM-DD' absente"
  fi
fi

# 5. Frontend V2 réellement déployé : confirmation manuelle ou preuve de déploiement.
if [[ "${FRONTEND_V2_DEPLOYE:-}" == "true" ]]; then
  pass "FRONTEND_V2_DEPLOYE" "confirmation opérateur présente"
elif [[ -f "$frontend_evidence_file" ]] \
  && rg -q '^status=DEPLOYED$' "$frontend_evidence_file" \
  && rg -q '^api_version=v2$' "$frontend_evidence_file"; then
  pass "FRONTEND_V2_DEPLOYE" "preuve valide : $frontend_evidence_file"
else
  fail "FRONTEND_V2_DEPLOYE" "définir FRONTEND_V2_DEPLOYE=true ou fournir $frontend_evidence_file"
fi

# 6. Test E2E présent et preuve PASS récente.
e2e_ok=false
e2e_executed_at=""
if [[ -f "$e2e_test_file" && -f "$e2e_evidence_file" ]] \
  && rg -q '^status=PASS$' "$e2e_evidence_file"; then
  e2e_executed_at="$(sed -nE 's/^executed_at=(.+)$/\1/p' "$e2e_evidence_file" | head -n 1)"
  if valid_date "$e2e_executed_at"; then
    now_epoch="$(date -u +%s)"
    e2e_epoch="$(date -u -d "$e2e_executed_at" +%s)"
    max_age_seconds=$((e2e_max_age_days * 86400))
    if (( e2e_epoch <= now_epoch && now_epoch - e2e_epoch <= max_age_seconds )); then e2e_ok=true; fi
  fi
fi
if [[ "$e2e_ok" == "true" ]]; then
  pass "E2E_VALIDE" "PASS du $e2e_executed_at, âge maximal ${e2e_max_age_days} jours"
else
  fail "E2E_VALIDE" "test ou preuve récente manquante : $e2e_evidence_file"
fi

# 7. Sept jours calendaires révolus depuis le début déclaré.
observation_started_at="${OBSERVATION_STARTED_AT:-}"
if valid_date "$observation_started_at"; then
  observation_start_epoch="$(date -u -d "$observation_started_at" +%s)"
  observation_now_epoch="$(date -u +%s)"
  observation_days=$(((observation_now_epoch - observation_start_epoch) / 86400))
  if (( observation_start_epoch <= observation_now_epoch && observation_days >= observation_min_days )); then
    pass "OBSERVATION_SEPT_JOURS" "${observation_days} jours écoulés depuis $observation_started_at"
  else
    fail "OBSERVATION_SEPT_JOURS" "${observation_days} jours écoulés, minimum ${observation_min_days}"
  fi
else
  fail "OBSERVATION_SEPT_JOURS" "définir OBSERVATION_STARTED_AT=YYYY-MM-DD"
fi

# 8. Aucun appel legacy dans le fichier ou dossier de logs configuré.
legacy_log_path="${LEGACY_LOG_PATH:-}"
if [[ -z "$legacy_log_path" || ! -e "$legacy_log_path" ]]; then
  fail "ZERO_APPEL_LEGACY" "définir LEGACY_LOG_PATH vers des logs existants"
elif rg -n '/api/payroll/provisions([?[:space:]"\x27]|$)' "$legacy_log_path" >/dev/null; then
  fail "ZERO_APPEL_LEGACY" "au moins un appel legacy est présent dans $legacy_log_path"
else
  pass "ZERO_APPEL_LEGACY" "aucun appel legacy dans $legacy_log_path"
fi

# 9. Procédure de rollback documentée et test attesté.
rollback_complete=false
if [[ -f "$rollback_file" ]] \
  && rg -q '^Status: VALIDATED$' "$rollback_file" \
  && rg -q '^Tested-At: [0-9]{4}-[0-9]{2}-[0-9]{2}$' "$rollback_file" \
  && rg -q '^## Déclencheurs$' "$rollback_file" \
  && rg -q '^## Procédure$' "$rollback_file" \
  && rg -q '^## Vérifications post-rollback$' "$rollback_file" \
  && rg -q '^## Preuve du test$' "$rollback_file"; then
  rollback_complete=true
fi
if [[ "$rollback_complete" == "true" ]]; then
  pass "ROLLBACK_TESTE" "procédure validée : $rollback_file"
else
  fail "ROLLBACK_TESTE" "preuve absente, incomplète ou non VALIDATED : $rollback_file"
fi

echo
echo "Résumé gatekeeper ($mode) : $passed/$total conditions satisfaites, $failed échec(s)"
if (( failed > 0 )); then
  echo "DO NOT MERGE"
  exit 1
fi

if [[ "$mode" == "pre-removal" ]]; then
  echo "READY FOR LEGACY REMOVAL"
else
  echo "READY FOR FINAL REVIEW"
fi
exit 0
