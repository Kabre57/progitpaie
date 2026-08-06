-- ════════════════════════════════════════════════════════════════════════
-- PROGITPAIE — Migration SQL Avancée : Full-Text Search & Vues Matérialisées
-- ════════════════════════════════════════════════════════════════════════

-- 1. Activation de l'extension pg_trgm pour la recherche floue
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Index GIN Trigrammes pour la recherche instantanée sur les salariés
CREATE INDEX IF NOT EXISTS idx_users_search_trgm ON users USING gin (
  (COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE("employeeId", '') || ' ' || COALESCE("jobTitle", '')) gin_trgm_ops
);

-- 3. Vue Matérialisée de Synthèse Mensuelle de la Paie
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_payroll_summary AS
SELECT
  "companyId",
  year,
  month,
  COUNT(id)::int AS "totalEmployees",
  COALESCE(SUM("basicSalary"), 0)::float AS "totalBasicSalary",
  COALESCE(SUM(sursalaire), 0)::float AS "totalSursalaire",
  COALESCE(SUM("grossSalary"), 0)::float AS "totalGrossSalary",
  COALESCE(SUM("itsTax"), 0)::float AS "totalItsTax",
  COALESCE(SUM("igrTax"), 0)::float AS "totalIgrTax",
  COALESCE(SUM("cnpsEmployee"), 0)::float AS "totalCnpsEmployee",
  COALESCE(SUM("cnpsEmployer"), 0)::float AS "totalCnpsEmployer",
  COALESCE(SUM("fdfpTax"), 0)::float AS "totalFdfpTax",
  COALESCE(SUM("netSalary"), 0)::float AS "totalNetSalary"
FROM payrolls
WHERE status = 'finalized'
GROUP BY "companyId", year, month;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payroll_summary ON mv_monthly_payroll_summary ("companyId", year, month);

-- 4. Vue Matérialisée des Statistiques d'Assiduité par Employé
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_attendance_stats AS
SELECT
  "companyId",
  "userId",
  COUNT(id)::int AS "totalRecords",
  COUNT(CASE WHEN status = 'present' THEN 1 END)::int AS "presentCount",
  COUNT(CASE WHEN status = 'late' THEN 1 END)::int AS "lateCount",
  COUNT(CASE WHEN status = 'absent' THEN 1 END)::int AS "absentCount",
  COALESCE(SUM("hoursWorked"), 0)::float AS "totalHoursWorked",
  COALESCE(SUM("overtimeMinutes"), 0)::int AS "totalOvertimeMinutes"
FROM attendances
GROUP BY "companyId", "userId";

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_attendance_stats ON mv_employee_attendance_stats ("companyId", "userId");

-- 5. Fonction de Rafraîchissement Concurrentiel des Vues Matérialisées
CREATE OR REPLACE FUNCTION refresh_payroll_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_payroll_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_attendance_stats;
END;
$$ LANGUAGE plpgsql;
