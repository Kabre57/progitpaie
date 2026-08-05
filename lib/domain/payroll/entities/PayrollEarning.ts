import { Money } from "../money";

export interface PayrollEarningProps {
  basicSalary: Money;
  sursalaire: Money;
  transportAllowance: Money;
  housingAllowance: Money;
  overtimePay: Money;
  bonuses: Money;
}

/**
 * Entité/Value Object représentant le détail des gains d'un bulletin.
 */
export class PayrollEarning {
  public readonly basicSalary: Money;
  public readonly sursalaire: Money;
  public readonly transportAllowance: Money;
  public readonly housingAllowance: Money;
  public readonly overtimePay: Money;
  public readonly bonuses: Money;

  constructor(props: PayrollEarningProps) {
    this.basicSalary = props.basicSalary;
    this.sursalaire = props.sursalaire;
    this.transportAllowance = props.transportAllowance;
    this.housingAllowance = props.housingAllowance;
    this.overtimePay = props.overtimePay;
    this.bonuses = props.bonuses;
  }

  public withBonuses(newBonuses: Money): PayrollEarning {
    return new PayrollEarning({
      ...this,
      bonuses: newBonuses,
    });
  }

  public totalBrutWithoutDeductions(): Money {
    return this.basicSalary
      .add(this.sursalaire)
      .add(this.transportAllowance)
      .add(this.housingAllowance)
      .add(this.overtimePay)
      .add(this.bonuses);
  }
}
