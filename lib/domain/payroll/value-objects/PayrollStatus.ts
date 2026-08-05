export type PayrollStatusType = "draft" | "finalized";

/**
 * Value Object gérant le statut d'un bulletin de paie et ses règles d'immuabilité.
 */
export class PayrollStatus {
  private constructor(public readonly value: PayrollStatusType) {}

  public static draft(): PayrollStatus {
    return new PayrollStatus("draft");
  }

  public static finalized(): PayrollStatus {
    return new PayrollStatus("finalized");
  }

  public static fromString(raw: string): PayrollStatus {
    if (raw === "draft" || raw === "finalized") {
      return new PayrollStatus(raw);
    }
    throw new Error(`Statut de paie invalide : ${raw}`);
  }

  public isDraft(): boolean {
    return this.value === "draft";
  }

  public isFinalized(): boolean {
    return this.value === "finalized";
  }

  public canEdit(): boolean {
    return this.isDraft();
  }

  public canFinalize(): boolean {
    return this.isDraft();
  }
}
