/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Types de Domaine pour le Calcul de Paie
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Interfaces TypeScript strictes (zéro `any`) définissant les structures de
 * données du domaine de paie. Ces types sont la source de vérité pour tous
 * les modules de calcul, de génération PDF et de prévisualisation.
 *
 * ADR-001 : Toutes les interfaces sont immuables (readonly) pour garantir
 *           la pureté des fonctions de calcul.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── Données d'entrée ────────────────────────────────────────────────────────

/** Données du salarié nécessaires au calcul de paie */
export interface EmployeePayrollData {
  readonly id: string;
  readonly name: string;
  readonly employeeId: string;
  readonly baseSalary: number;
  readonly sursalaire: number;
  readonly transportAllowance: number;
  readonly category: string;
  readonly partsIGR: number;
  readonly cnpsNumber: string;
  readonly joiningDate: string;
  readonly contractType: "CDI" | "CDD" | "STAGE" | "INTERIM";
  readonly isExpatriate: boolean;
  readonly departmentName: string;
  readonly jobTitle: string;
}

/** Éléments variables du mois (primes, heures sup, absences) */
export interface MonthlyVariableElements {
  readonly overtimeHours: number;
  readonly overtimeRate: number;
  readonly bonuses: ReadonlyArray<{
    readonly label: string;
    readonly amount: number;
    readonly isTaxable: boolean;
  }>;
  readonly absenceDays: number;
  readonly loanDeduction: number;
}

/** Données d'entrée complètes pour le calcul d'un bulletin */
export interface PayslipCalculationInput {
  readonly employee: EmployeePayrollData;
  readonly month: number;
  readonly year: number;
  readonly variables: MonthlyVariableElements;
}

// ─── Configuration des taux et barèmes ───────────────────────────────────────

/** Configuration des taux de cotisation (Strategy Pattern) */
export interface TaxRatesConfig {
  // Cotisations salariales
  readonly cnpsRetirementEmployeeRate: number;    // ex: 6.3%
  readonly cmuEmployeeRate: number;                // ex: 1%
  // Cotisations patronales
  readonly cnpsRetirementEmployerRate: number;     // ex: 7.7%
  readonly cnpsFamilyRate: number;                 // ex: 5.75%
  readonly cnpsAccidentRate: number;               // ex: 2-5%
  readonly cmuEmployerRate: number;                // ex: 2%
  readonly fdfpTARate: number;                     // ex: 0.4%
  readonly fdfpTFCRate: number;                    // ex: 1.2%
  // Impôts
  readonly itsRate: number;                        // ex: 1.2%
  readonly ceRate: number;                         // ex: 11.5%
  readonly cnRate: number;                         // ex: 1.2%
  // Plafonds CNPS
  readonly cnpsMonthlyRetirementCeiling: number;   // ex: 2 421 250 FCFA
  readonly cnpsMonthlyCeiling70K: number;          // ex: 70 000 FCFA (PF/AT)
}

/** Tranche du barème progressif de l'IGR */
export interface IGRBracket {
  readonly min: number;
  readonly max: number;
  readonly rate: number;      // Taux marginal (ex: 0, 0.10, 0.15, etc.)
}

/** Barème complet de l'IGR (versioning immuable) */
export interface IGRSchedule {
  readonly validFrom: string;   // ex: "2024-01-01"
  readonly validTo: string;     // ex: "2099-12-31"
  readonly brackets: ReadonlyArray<IGRBracket>;
  readonly creditPerPart: number;  // Crédit d'impôt par part
}

// ─── Résultats de calcul ─────────────────────────────────────────────────────

/** Détail des cotisations salariales */
export interface EmployeeContributions {
  readonly cnpsRetirement: number;
  readonly cmu: number;
  readonly totalEmployee: number;
}

/** Détail des cotisations patronales */
export interface EmployerContributions {
  readonly cnpsRetirement: number;
  readonly cnpsFamily: number;
  readonly cnpsAccident: number;
  readonly cmu: number;
  readonly fdfpTA: number;
  readonly fdfpTFC: number;
  readonly totalEmployer: number;
}

/** Détail des impôts retenus sur salaire */
export interface TaxDeductions {
  readonly its: number;           // Impôt sur Traitements et Salaires
  readonly cn: number;            // Contribution Nationale
  readonly igr: number;           // Impôt Général sur le Revenu
  readonly ce: number;            // Contribution Employeur (à la charge de l'employeur)
  readonly totalTaxEmployee: number;  // IS + CN + IGR (retenu au salarié)
}

/** Résultat complet du calcul d'un bulletin de paie */
export interface PayslipResult {
  // Identification
  readonly employeeId: string;
  readonly employeeName: string;
  readonly month: number;
  readonly year: number;
  // Revenus
  readonly baseSalary: number;
  readonly sursalaire: number;
  readonly transportAllowance: number;
  readonly overtimePay: number;
  readonly totalBonuses: number;
  readonly grossSalary: number;
  // Cotisations
  readonly employeeContributions: EmployeeContributions;
  readonly employerContributions: EmployerContributions;
  // Impôts
  readonly taxDeductions: TaxDeductions;
  // Net
  readonly totalDeductions: number;
  readonly netSalary: number;
  readonly netToPay: number;         // Net à payer (après retenue prêt)
  // Métadonnées
  readonly calculatedAt: string;      // ISO date
  readonly formulaVersion: string;    // ex: "SYSCOHADA-CI-2024-v1"
}

// ─── Données de déclarations ─────────────────────────────────────────────────

/** Résultat agrégé pour la déclaration ITS (DGI) */
export interface ITSDeclarationData {
  readonly totalEmployees: number;
  readonly totalGrossSalary: number;
  readonly totalNetTaxable: number;
  readonly totalITS: number;
  readonly totalIGR: number;
  readonly totalCE: number;
  readonly totalCN: number;
  readonly totalTaxToPay: number;
}

/** Résultat agrégé pour la déclaration CNPS */
export interface CNPSDeclarationData {
  readonly totalEmployees: number;
  readonly totalGrossSalary: number;
  readonly cnpsEmployeeTotal: number;
  readonly cnpsEmployerTotal: number;
  readonly totalCNPSToPay: number;
  readonly employeeDetails: ReadonlyArray<{
    readonly employeeId: string;
    readonly name: string;
    readonly grossSalary: number;
    readonly cnpsEmployee: number;
    readonly cnpsEmployer: number;
  }>;
}

/** Résultat agrégé pour la déclaration FDFP */
export interface FDFPDeclarationData {
  readonly totalGrossSalary: number;
  readonly taAmount: number;       // Taxe d'Apprentissage
  readonly tfcAmount: number;      // Taxe Formation Continue
  readonly totalFDFP: number;
}

// ─── Événements de domaine ───────────────────────────────────────────────────

export type DomainEventType =
  | "PayslipCalculated"
  | "TaxRateUpdated"
  | "PayrollPeriodClosed"
  | "FormulaVersionCreated";

export interface DomainEvent {
  readonly type: DomainEventType;
  readonly timestamp: string;
  readonly payload: Record<string, unknown>;
}
