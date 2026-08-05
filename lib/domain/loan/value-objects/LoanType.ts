export type LoanTypeEnum = "PRET" | "AVANCE";

export class LoanType {
  private constructor(public readonly value: LoanTypeEnum) {}

  public static pret(): LoanType {
    return new LoanType("PRET");
  }

  public static avance(): LoanType {
    return new LoanType("AVANCE");
  }

  public static fromString(raw: string): LoanType {
    const normalized = raw.toUpperCase();
    if (normalized === "AVANCE" || normalized === "ADVANCE") {
      return new LoanType("AVANCE");
    }
    return new LoanType("PRET");
  }

  public isAdvance(): boolean {
    return this.value === "AVANCE";
  }
}
