/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Service Double Run (Validation de Non-Régression)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Exécute les deux moteurs (ancien + nouveau) en parallèle et compare
 * les résultats. Journalise les écarts pour détecter les régressions.
 *
 * Seuils d'alerte (Runbook V3) :
 *   > 1 FCFA  → ⚠️ Warning (investigation)
 *   > 5 FCFA  → 🔴 Critique (rollback automatique)
 *   > 100 FCFA → 🚨 Urgence (notification équipe)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface DoubleRunResult {
  readonly legacyValues: {
    readonly totalBrut: number;
    readonly itsTax: number;
    readonly cnpsEmployee: number;
    readonly cnpsEmployerRetraite: number;
    readonly cnpsEmployerAT: number;
    readonly cnpsEmployerPF: number;
    readonly fdfpTA: number;
    readonly fdfpTFC: number;
    readonly totalGains: number;
    readonly totalRetenuesSal: number;
    readonly totalRetenuesPat: number;
    readonly netSalary: number;
  };
  readonly modularValues: {
    readonly totalBrut: number;
    readonly itsTax: number;
    readonly cnpsEmployee: number;
    readonly cnpsEmployerRetraite: number;
    readonly cnpsEmployerAT: number;
    readonly cnpsEmployerPF: number;
    readonly fdfpTA: number;
    readonly fdfpTFC: number;
    readonly totalGains: number;
    readonly totalRetenuesSal: number;
    readonly totalRetenuesPat: number;
    readonly netSalary: number;
  };
  readonly discrepancies: ReadonlyArray<{
    readonly field: string;
    readonly legacy: number;
    readonly modular: number;
    readonly diff: number;
    readonly severity: "OK" | "WARNING" | "CRITICAL" | "EMERGENCY";
  }>;
  readonly overallStatus: "OK" | "WARNING" | "CRITICAL" | "EMERGENCY";
}

/**
 * Détermine la sévérité d'un écart selon le Runbook V3
 */
function getSeverity(diff: number): "OK" | "WARNING" | "CRITICAL" | "EMERGENCY" {
  const absDiff = Math.abs(diff);
  if (absDiff <= 1) return "OK";
  if (absDiff <= 5) return "WARNING";
  if (absDiff <= 100) return "CRITICAL";
  return "EMERGENCY";
}

/**
 * Compare les valeurs calculées par les deux moteurs
 *
 * @param legacyValues  - Résultat de l'ancien moteur (code intriqué dans la route)
 * @param modularValues - Résultat du nouveau moteur (lib/domain/payroll)
 * @returns Le résultat de la comparaison avec les écarts détaillés
 */
export function compareDoubleRun(
  legacyValues: DoubleRunResult["legacyValues"],
  modularValues: DoubleRunResult["modularValues"]
): DoubleRunResult {
  const fields: Array<keyof typeof legacyValues> = [
    "totalBrut",
    "itsTax",
    "cnpsEmployee",
    "cnpsEmployerRetraite",
    "cnpsEmployerAT",
    "cnpsEmployerPF",
    "fdfpTA",
    "fdfpTFC",
    "totalGains",
    "totalRetenuesSal",
    "totalRetenuesPat",
    "netSalary",
  ];

  const discrepancies = fields.map((field) => {
    const legacy = legacyValues[field];
    const modular = modularValues[field];
    const diff = modular - legacy;
    return { field, legacy, modular, diff, severity: getSeverity(diff) };
  });

  // Le statut global est la sévérité maximale
  const severityOrder: Record<string, number> = { OK: 0, WARNING: 1, CRITICAL: 2, EMERGENCY: 3 };
  const maxSeverity = discrepancies.reduce((max, d) => {
    return severityOrder[d.severity] > severityOrder[max] ? d.severity : max;
  }, "OK" as DoubleRunResult["overallStatus"]);

  return {
    legacyValues,
    modularValues,
    discrepancies,
    overallStatus: maxSeverity,
  };
}

/**
 * Journalise le résultat du Double Run dans la console
 */
export function logDoubleRunResult(
  employeeId: string,
  month: number,
  year: number,
  result: DoubleRunResult
): void {
  const statusEmoji =
    result.overallStatus === "OK" ? "✅" :
    result.overallStatus === "WARNING" ? "⚠️" :
    result.overallStatus === "CRITICAL" ? "🔴" : "🚨";

  console.log(
    `[DOUBLE-RUN] ${statusEmoji} ${result.overallStatus} | Employee: ${employeeId} | Period: ${month}/${year}`
  );

  const nonOk = result.discrepancies.filter((d) => d.severity !== "OK");
  if (nonOk.length > 0) {
    console.warn("[DOUBLE-RUN] Écarts détectés :");
    for (const d of nonOk) {
      console.warn(
        `  ${d.severity} | ${d.field}: legacy=${d.legacy}, modular=${d.modular}, diff=${d.diff}`
      );
    }
  }
}
