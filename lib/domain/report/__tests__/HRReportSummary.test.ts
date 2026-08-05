import { Money } from "@/lib/domain/payroll/money";
import { ContractDistribution } from "../value-objects/ContractDistribution";
import { PayrollCostsSummary } from "../value-objects/PayrollCostsSummary";
import { HRReportSummary } from "../entities/HRReportSummary";

describe("Domaine Report — Tests Unitaires Purs", () => {
  const companyId = "company-123";

  it("crée un rapport RH et calcule les employés inactifs et coûts globaux", () => {
    const contracts = new ContractDistribution(10, 3, 2, 0);
    const costs = new PayrollCostsSummary(
      Money.of(10000000),
      Money.of(8000000),
      Money.of(2500000)
    );

    const report = new HRReportSummary({
      companyId,
      totalEmployees: 20,
      activeEmployees: 15,
      departmentBreakdown: [
        { name: "Informatique", count: 8 },
        { name: "Comptabilité", count: 7 },
      ],
      contractTypes: contracts,
      lastMonthCosts: costs,
    });

    expect(report.inactiveEmployees).toBe(5);
    expect(report.lastMonthCosts.calculateTotalEmployerCost().equals(Money.of(12500000))).toBe(true);
  });
});
