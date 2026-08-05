export type OvertimeStatusEnum = "pending" | "approved" | "rejected";

export class OvertimeStatus {
  private constructor(public readonly value: OvertimeStatusEnum) {}

  public static pending(): OvertimeStatus {
    return new OvertimeStatus("pending");
  }

  public static approved(): OvertimeStatus {
    return new OvertimeStatus("approved");
  }

  public static rejected(): OvertimeStatus {
    return new OvertimeStatus("rejected");
  }

  public static fromString(raw: string): OvertimeStatus {
    const normalized = raw.toLowerCase();
    if (["pending", "approved", "rejected"].includes(normalized)) {
      return new OvertimeStatus(normalized as OvertimeStatusEnum);
    }
    throw new Error(`Statut d'heures supplémentaires invalide : ${raw}`);
  }

  public isPending(): boolean {
    return this.value === "pending";
  }

  public isApproved(): boolean {
    return this.value === "approved";
  }
}
