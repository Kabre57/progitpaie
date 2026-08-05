export type LoanStatusEnum = "active" | "completed";

export class LoanStatus {
  private constructor(public readonly value: LoanStatusEnum) {}

  public static active(): LoanStatus {
    return new LoanStatus("active");
  }

  public static completed(): LoanStatus {
    return new LoanStatus("completed");
  }

  public static fromString(raw: string): LoanStatus {
    const normalized = raw.toLowerCase();
    if (normalized === "completed" || normalized === "solde") {
      return new LoanStatus("completed");
    }
    return new LoanStatus("active");
  }

  public isActive(): boolean {
    return this.value === "active";
  }

  public isCompleted(): boolean {
    return this.value === "completed";
  }
}
