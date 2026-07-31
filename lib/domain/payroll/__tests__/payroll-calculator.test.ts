/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Tests Unitaires du Moteur de Calcul de Paie
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Snapshots de référence pour la validation de non-régression.
 *
 * Profils couverts :
 *   1. Salarié local (salaire minimum)
 *   2. Cadre moyen
 *   3. Cadre supérieur (salaire élevé)
 *   4. Avec primes multiples
 *   5. Cas limite (brut = 0)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { calculateITS, calculateCN, calculateCE, calculateIGR, calculateAllTaxDeductions, DEFAULT_IGR_SCHEDULE } from "../calculator/its-calculator";
import { calculateCNPSRetirementEmployee, calculateCNPSRetirementEmployer, calculateCNPSFamilyAllowance, calculateCNPSAccidentAtWork, calculateCMU, calculateCappedBase, calculateAllEmployeeContributions, calculateAllEmployerContributions } from "../calculator/cnps-calculator";
import { calculatePayslip, calculateSeniorityBonus, calculateOvertimePay, calculateSeniorityYears } from "../calculator/payslip-calculator";
import type { TaxRatesConfig, PayslipCalculationInput, EmployeePayrollData, MonthlyVariableElements } from "../types/payroll-types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Configuration de taux standard Côte d'Ivoire 2024 */
const STANDARD_RATES: TaxRatesConfig = {
  cnpsRetirementEmployeeRate: 6.3,
  cmuEmployeeRate: 1,
  cnpsRetirementEmployerRate: 7.7,
  cnpsFamilyRate: 5.75,
  cnpsAccidentRate: 3,
  cmuEmployerRate: 2,
  fdfpTARate: 0.4,
  fdfpTFCRate: 1.2,
  itsRate: 1.2,
  ceRate: 11.5,
  cnRate: 1.2,
  cnpsMonthlyRetirementCeiling: 2_421_250,
  cnpsMonthlyCeiling70K: 70_000,
};

/** Employé local (salaire minimum) */
const LOCAL_EMPLOYEE: EmployeePayrollData = {
  id: "emp-001",
  name: "KOUASSI Jean",
  employeeId: "001",
  baseSalary: 75_000,
  sursalaire: 0,
  transportAllowance: 30_000,
  category: "1A",
  partsIGR: 1,
  cnpsNumber: "123456",
  joiningDate: "2022-03-01",
  contractType: "CDI",
  isExpatriate: false,
  departmentName: "PRODUCTION",
  jobTitle: "Ouvrier",
};

/** Cadre moyen */
const CADRE_MOYEN: EmployeePayrollData = {
  id: "emp-002",
  name: "AKA DESQUITH AMBROISE",
  employeeId: "002",
  baseSalary: 350_000,
  sursalaire: 50_000,
  transportAllowance: 30_000,
  category: "6B",
  partsIGR: 4.5,
  cnpsNumber: "789012",
  joiningDate: "2018-06-15",
  contractType: "CDI",
  isExpatriate: false,
  departmentName: "ADMINISTRATION",
  jobTitle: "Comptable Senior",
};

/** Cadre supérieur (haut salaire) */
const CADRE_SUPERIEUR: EmployeePayrollData = {
  id: "emp-003",
  name: "DIALLO Fatimata",
  employeeId: "003",
  baseSalary: 1_200_000,
  sursalaire: 300_000,
  transportAllowance: 50_000,
  category: "9A",
  partsIGR: 2.5,
  cnpsNumber: "345678",
  joiningDate: "2010-01-01",
  contractType: "CDI",
  isExpatriate: false,
  departmentName: "DIRECTION",
  jobTitle: "Directrice Financière",
};

/** Variables sans éléments variables */
const NO_VARIABLES: MonthlyVariableElements = {
  overtimeHours: 0,
  overtimeRate: 0,
  bonuses: [],
  absenceDays: 0,
  loanDeduction: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS ITS / CN / CE
// ═══════════════════════════════════════════════════════════════════════════════

describe("ITS Calculator", () => {
  describe("calculateITS", () => {
    it("devrait calculer l'ITS à 1.2% du brut fiscal", () => {
      expect(calculateITS(350_000, 1.2)).toBe(4_200);
    });

    it("devrait retourner 0 pour un brut fiscal négatif", () => {
      expect(calculateITS(-100_000, 1.2)).toBe(0);
    });

    it("devrait retourner 0 pour un taux nul", () => {
      expect(calculateITS(350_000, 0)).toBe(0);
    });

    it("devrait arrondir le résultat", () => {
      expect(calculateITS(333_333, 1.2)).toBe(4_000);
    });
  });

  describe("calculateCN", () => {
    it("devrait calculer la CN à 1.2% du brut fiscal", () => {
      expect(calculateCN(350_000, 1.2)).toBe(4_200);
    });
  });

  describe("calculateCE", () => {
    it("devrait calculer la CE à 11.5% du brut fiscal", () => {
      expect(calculateCE(350_000, 11.5)).toBe(40_250);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS IGR
// ═══════════════════════════════════════════════════════════════════════════════

describe("IGR Calculator", () => {
  it("devrait retourner 0 pour un revenu dans la tranche exonérée", () => {
    // Brut annuel de 200 000 FCFA → tout dans la tranche 0%
    const igr = calculateIGR(200_000, 1, 0, 0, DEFAULT_IGR_SCHEDULE);
    expect(igr).toBe(0);
  });

  it("devrait retourner 0 pour un brut annuel négatif", () => {
    expect(calculateIGR(-100_000, 1, 0, 0, DEFAULT_IGR_SCHEDULE)).toBe(0);
  });

  it("devrait appliquer le barème progressif correctement", () => {
    // Brut annuel de 6 000 000 FCFA, 1 part, ITS = 72 000, CN = 72 000
    // Revenu net imposable = 6 000 000 - 72 000 - 72 000 = 5 856 000
    // Quotient familial = 5 856 000 / 1 = 5 856 000
    const igr = calculateIGR(6_000_000, 1, 72_000, 72_000, DEFAULT_IGR_SCHEDULE);
    expect(igr).toBeGreaterThan(0);
  });

  it("devrait réduire l'IGR avec plus de parts", () => {
    const igr1part = calculateIGR(6_000_000, 1, 72_000, 72_000, DEFAULT_IGR_SCHEDULE);
    const igr4parts = calculateIGR(6_000_000, 4, 72_000, 72_000, DEFAULT_IGR_SCHEDULE);
    expect(igr4parts).toBeLessThan(igr1part);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS CNPS
// ═══════════════════════════════════════════════════════════════════════════════

describe("CNPS Calculator", () => {
  describe("calculateCappedBase", () => {
    it("devrait plafonner le brut social au plafond retraite", () => {
      expect(calculateCappedBase(3_000_000, 2_421_250)).toBe(2_421_250);
    });

    it("devrait retourner le brut social si inférieur au plafond", () => {
      expect(calculateCappedBase(350_000, 2_421_250)).toBe(350_000);
    });
  });

  describe("calculateCNPSRetirementEmployee", () => {
    it("devrait calculer la cotisation retraite salarié à 6.3%", () => {
      const result = calculateCNPSRetirementEmployee(350_000, 6.3, 2_421_250);
      expect(result).toBe(22_050);
    });

    it("devrait plafonner au plafond retraite", () => {
      const result = calculateCNPSRetirementEmployee(3_000_000, 6.3, 2_421_250);
      expect(result).toBe(Math.round(2_421_250 * 0.063));
    });
  });

  describe("calculateCNPSFamilyAllowance", () => {
    it("devrait plafonner au plafond 70K", () => {
      const result = calculateCNPSFamilyAllowance(350_000, 5.75, 70_000);
      expect(result).toBe(Math.round(70_000 * 0.0575));
    });
  });

  describe("calculateCMU", () => {
    it("devrait calculer les cotisations CMU", () => {
      const result = calculateCMU(5_000, 1, 2);
      expect(result.employee).toBe(50);
      expect(result.employer).toBe(100);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS ANCIENNETÉ ET HEURES SUP
// ═══════════════════════════════════════════════════════════════════════════════

describe("Seniority and Overtime", () => {
  describe("calculateSeniorityBonus", () => {
    it("devrait retourner 0 si < 2 ans", () => {
      expect(calculateSeniorityBonus(350_000, 1)).toBe(0);
    });

    it("devrait appliquer 2% pour 2-5 ans", () => {
      expect(calculateSeniorityBonus(350_000, 3)).toBe(7_000);
    });

    it("devrait appliquer 3% pour 6-10 ans", () => {
      expect(calculateSeniorityBonus(350_000, 8)).toBe(10_500);
    });

    it("devrait appliquer 10% pour 21-25 ans", () => {
      expect(calculateSeniorityBonus(350_000, 22)).toBe(35_000);
    });
  });

  describe("calculateSeniorityYears", () => {
    it("devrait calculer correctement les années d'ancienneté", () => {
      const years = calculateSeniorityYears("2020-01-01", 7, 2026);
      expect(years).toBe(6);
    });

    it("devrait retourner 0 si date dans le futur", () => {
      const years = calculateSeniorityYears("2030-01-01", 7, 2026);
      expect(years).toBe(0);
    });
  });

  describe("calculateOvertimePay", () => {
    it("devrait calculer les heures sup", () => {
      expect(calculateOvertimePay(10, 2_500)).toBe(25_000);
    });

    it("devrait retourner 0 si heures = 0", () => {
      expect(calculateOvertimePay(0, 2_500)).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS D'INTÉGRATION : CALCUL COMPLET DU BULLETIN
// ═══════════════════════════════════════════════════════════════════════════════

describe("PayslipCalculator — Calcul Complet", () => {
  it("devrait calculer un bulletin complet pour un salarié local", () => {
    const input: PayslipCalculationInput = {
      employee: LOCAL_EMPLOYEE,
      month: 7,
      year: 2026,
      variables: NO_VARIABLES,
    };

    const result = calculatePayslip(input, STANDARD_RATES, DEFAULT_IGR_SCHEDULE, false);

    // Vérifications structurelles
    expect(result.employeeId).toBe("001");
    expect(result.employeeName).toBe("KOUASSI Jean");
    expect(result.month).toBe(7);
    expect(result.year).toBe(2026);

    // Revenus
    expect(result.baseSalary).toBe(75_000);
    expect(result.grossSalary).toBe(75_000);
    expect(result.transportAllowance).toBe(30_000);

    // Le net doit être inférieur au brut + transport
    expect(result.netSalary).toBeLessThan(75_000 + 30_000);
    expect(result.netSalary).toBeGreaterThan(0);

    // Métadonnées
    expect(result.formulaVersion).toContain(" -CI");
    expect(result.calculatedAt).toBeTruthy();
  });

  it("devrait calculer un bulletin complet pour un cadre moyen", () => {
    const input: PayslipCalculationInput = {
      employee: CADRE_MOYEN,
      month: 7,
      year: 2026,
      variables: NO_VARIABLES,
    };

    const result = calculatePayslip(input, STANDARD_RATES);

    // Brut = 350 000 + 50 000 = 400 000
    expect(result.grossSalary).toBe(400_000);

    // Les cotisations salariales doivent être raisonnables
    expect(result.employeeContributions.cnpsRetirement).toBe(Math.round(400_000 * 0.063));
    expect(result.taxDeductions.its).toBe(Math.round(400_000 * 0.012));

    // Le net doit être dans une fourchette réaliste
    expect(result.netSalary).toBeGreaterThan(300_000);
    expect(result.netSalary).toBeLessThan(430_000);
  });

  it("devrait calculer un bulletin avec heures sup et primes", () => {
    const variables: MonthlyVariableElements = {
      overtimeHours: 20,
      overtimeRate: 2_500,
      bonuses: [
        { label: "Prime de rendement", amount: 50_000, isTaxable: true },
        { label: "Prime de logement", amount: 30_000, isTaxable: true },
      ],
      absenceDays: 0,
      loanDeduction: 25_000,
    };

    const input: PayslipCalculationInput = {
      employee: CADRE_MOYEN,
      month: 7,
      year: 2026,
      variables,
    };

    const result = calculatePayslip(input, STANDARD_RATES);

    // Heures sup = 20 × 2500 = 50 000
    expect(result.overtimePay).toBe(50_000);
    // Primes = 50 000 + 30 000 = 80 000
    expect(result.totalBonuses).toBe(80_000);
    // Brut = 350 000 + 50 000 (sursalaire) + 50 000 (HS) + 80 000 (primes) = 530 000
    expect(result.grossSalary).toBe(530_000);
    // Net à payer = net - 25 000 (retenue prêt)
    expect(result.netToPay).toBe(result.netSalary - 25_000);
  });

  it("devrait gérer le cas limite brut = 0", () => {
    const zeroEmployee: EmployeePayrollData = {
      ...LOCAL_EMPLOYEE,
      baseSalary: 0,
      sursalaire: 0,
      transportAllowance: 0,
    };

    const input: PayslipCalculationInput = {
      employee: zeroEmployee,
      month: 7,
      year: 2026,
      variables: NO_VARIABLES,
    };

    const result = calculatePayslip(input, STANDARD_RATES);

    expect(result.grossSalary).toBe(0);
    expect(result.taxDeductions.its).toBe(0);
    expect(result.employeeContributions.cnpsRetirement).toBe(0);
    expect(result.netSalary).toBe(0);
  });

  it("devrait plafonner la cotisation retraite CNPS pour les hauts salaires", () => {
    const input: PayslipCalculationInput = {
      employee: CADRE_SUPERIEUR,
      month: 7,
      year: 2026,
      variables: NO_VARIABLES,
    };

    const result = calculatePayslip(input, STANDARD_RATES);

    // Brut = 1 200 000 + 300 000 = 1 500 000
    expect(result.grossSalary).toBe(1_500_000);

    // La retraite salarié ne doit pas dépasser le plafond × taux
    const maxRetirement = Math.round(STANDARD_RATES.cnpsMonthlyRetirementCeiling * 0.063);
    expect(result.employeeContributions.cnpsRetirement).toBeLessThanOrEqual(maxRetirement);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOTS DE CALCUL DE RÉFÉRENCE (10 premiers profils)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Snapshots de Référence — Non-Régression", () => {
  const profiles: Array<{ name: string; input: PayslipCalculationInput; expectedGross: number }> = [
    {
      name: "Profil #1 — SMIC local",
      input: { employee: LOCAL_EMPLOYEE, month: 7, year: 2026, variables: NO_VARIABLES },
      expectedGross: 75_000,
    },
    {
      name: "Profil #2 — Cadre moyen",
      input: { employee: CADRE_MOYEN, month: 7, year: 2026, variables: NO_VARIABLES },
      expectedGross: 400_000,
    },
    {
      name: "Profil #3 — Cadre supérieur",
      input: { employee: CADRE_SUPERIEUR, month: 7, year: 2026, variables: NO_VARIABLES },
      expectedGross: 1_500_000,
    },
    {
      name: "Profil #4 — Cadre avec primes",
      input: {
        employee: CADRE_MOYEN,
        month: 12,
        year: 2026,
        variables: {
          overtimeHours: 10,
          overtimeRate: 3_000,
          bonuses: [{ label: "13ème mois", amount: 400_000, isTaxable: true }],
          absenceDays: 0,
          loanDeduction: 0,
        },
      },
      expectedGross: 830_000, // 350k + 50k + 30k (HS) + 400k (prime)
    },
  ];

  profiles.forEach(({ name, input, expectedGross }) => {
    it(`${name} — brut = ${expectedGross.toLocaleString()} FCFA`, () => {
      const result = calculatePayslip(input, STANDARD_RATES, DEFAULT_IGR_SCHEDULE, false);
      expect(result.grossSalary).toBe(expectedGross);
      expect(result.netSalary).toBeLessThan(result.grossSalary + result.transportAllowance);
      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.totalDeductions).toBeGreaterThan(0);
    });
  });
});
