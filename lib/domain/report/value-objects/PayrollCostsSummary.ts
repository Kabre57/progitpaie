import { Money } from "@/lib/domain/payroll/money";

export class PayrollCostsSummary {
  constructor(
    public readonly totalGrossPayroll: Money,
    public readonly totalNetPayroll: Money,
    public readonly totalTaxSocialCost: Money
  ) {}

  public calculateTotalEmployerCost(): Money {
    return this.totalGrossPayroll.add(this.totalTaxSocialCost);
  }
}
