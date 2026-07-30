/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Moteur de Simulation Salariale & Budgétaire (Infrastructure 🎯)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Exécute des simulations "What-If" dynamiques en utilisant le moteur de calcul
 * modulaire pure (`calculatePayslip`) sans altérer les données réelles en BDD.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EmployeeRepository, SettingsRepository } from "@/lib/infrastructure";
import { legacyRatesToTaxRatesConfig } from "@/lib/domain/payroll/adapters/legacy-rates-adapter";
import { calculatePayslip } from "@/lib/domain/payroll";
import { DEFAULT_PAYROLL_RATES } from "@/lib/rates-config";

export interface SimulationScenarioParams {
  type: "SALARY_INCREASE" | "RECRUITMENT" | "RATE_CHANGE";
  percentageIncrease?: number; // Pourcentage d'augmentation (ex: 5%)
  newRecruits?: Array<{
    name: string;
    baseSalary: number;
    sursalaire?: number;
    partsIGR?: number;
  }>;
  customRates?: Record<string, number>; // Taux modifiés pour simulation
}

export interface SimulationResultData {
  scenarioType: string;
  baseline: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalEmployerCost: number;
    totalNetSalary: number;
  };
  simulated: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalEmployerCost: number;
    totalNetSalary: number;
  };
  variance: {
    grossSalaryDiff: number;
    employerCostDiff: number;
    percentageChange: number;
  };
}

export class SimulationService {
  private employeeRepo = new EmployeeRepository();
  private settingsRepo = new SettingsRepository();

  /**
   * Exécute une simulation budgétaire selon le scénario sélectionné
   */
  public async runSimulation(params: SimulationScenarioParams): Promise<SimulationResultData> {
    // 1. Récupération des employés actifs réels
    const employees = await this.employeeRepo.findAllActive();
    const dbRates = (await this.settingsRepo.getByKey("tax_rates")) || DEFAULT_PAYROLL_RATES;

    const baseTaxConfig = legacyRatesToTaxRatesConfig(dbRates);

    // 2. Calcul du Baseline (Situation actuelle réévaluée par le moteur modulaire)
    let baselineGross = 0;
    let baselineEmployerCost = 0;
    let baselineNet = 0;

    const emptyVariables = {
      overtimeHours: 0,
      overtimeRate: 0,
      bonuses: [],
      absenceDays: 0,
      loanDeduction: 0,
    };

    for (const emp of employees) {
      const res = calculatePayslip({ employee: emp, month: 7, year: 2026, variables: emptyVariables }, baseTaxConfig);
      baselineGross += res.grossSalary;
      baselineEmployerCost += (res.grossSalary + res.employerContributions.totalEmployer);
      baselineNet += res.netSalary;
    }

    // 3. Application des modifications du scénario
    let simulatedGross = 0;
    let simulatedEmployerCost = 0;
    let simulatedNet = 0;
    let simulatedEmployeesCount = employees.length;

    const simRates = params.customRates ? { ...dbRates, ...params.customRates } : dbRates;
    const simTaxConfig = legacyRatesToTaxRatesConfig(simRates);

    // Simulation Augmentation Salariale (%)
    const multiplier = 1 + ((params.percentageIncrease || 0) / 100);

    for (const emp of employees) {
      const simEmp = {
        ...emp,
        baseSalary: Math.round(emp.baseSalary * multiplier),
        sursalaire: Math.round(emp.sursalaire * multiplier),
      };

      const res = calculatePayslip({ employee: simEmp, month: 7, year: 2026, variables: emptyVariables }, simTaxConfig);
      simulatedGross += res.grossSalary;
      simulatedEmployerCost += (res.grossSalary + res.employerContributions.totalEmployer);
      simulatedNet += res.netSalary;
    }

    // Simulation Nouveaux Recrutements
    if (params.newRecruits && params.newRecruits.length > 0) {
      simulatedEmployeesCount += params.newRecruits.length;
      for (const recruit of params.newRecruits) {
        const dummyEmp = {
          id: `SIM-${Math.random()}`,
          name: recruit.name || "Nouveau Recruté",
          employeeId: "SIM-000",
          baseSalary: recruit.baseSalary || 250000,
          sursalaire: recruit.sursalaire || 0,
          transportAllowance: 30000,
          category: "1A",
          partsIGR: recruit.partsIGR || 1.0,
          cnpsNumber: "Exonéré",
          joiningDate: new Date().toISOString(),
          contractType: "CDI" as const,
          isExpatriate: false,
          departmentName: "RECRUTEMENT SIMULÉ",
          jobTitle: "Profil Simulé",
        };

        const res = calculatePayslip({ employee: dummyEmp, month: 7, year: 2026, variables: emptyVariables }, simTaxConfig);
        simulatedGross += res.grossSalary;
        simulatedEmployerCost += (res.grossSalary + res.employerContributions.totalEmployer);
        simulatedNet += res.netSalary;
      }
    }

    const grossSalaryDiff = simulatedGross - baselineGross;
    const employerCostDiff = simulatedEmployerCost - baselineEmployerCost;
    const percentageChange = baselineEmployerCost > 0 ? parseFloat(((employerCostDiff / baselineEmployerCost) * 100).toFixed(2)) : 0;

    return {
      scenarioType: params.type,
      baseline: {
        totalEmployees: employees.length,
        totalGrossSalary: baselineGross,
        totalEmployerCost: baselineEmployerCost,
        totalNetSalary: baselineNet,
      },
      simulated: {
        totalEmployees: simulatedEmployeesCount,
        totalGrossSalary: simulatedGross,
        totalEmployerCost: simulatedEmployerCost,
        totalNetSalary: simulatedNet,
      },
      variance: {
        grossSalaryDiff,
        employerCostDiff,
        percentageChange,
      },
    };
  }
}
