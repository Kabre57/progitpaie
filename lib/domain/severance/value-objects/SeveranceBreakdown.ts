import { Money } from "@/lib/domain/payroll/money";

export class SeveranceBreakdown {
  constructor(
    public readonly noticeIndemnity: Money,
    public readonly severanceIndemnity: Money,
    public readonly leaveCompensation: Money,
    public readonly gratification13th: Money
  ) {}

  public calculateTotalNetExit(): Money {
    return this.noticeIndemnity
      .add(this.severanceIndemnity)
      .add(this.leaveCompensation)
      .add(this.gratification13th);
  }
}
