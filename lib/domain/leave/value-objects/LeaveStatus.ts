export type LeaveStatusEnum = "pending" | "approved" | "rejected";

export class LeaveStatus {
  private constructor(public readonly value: LeaveStatusEnum) {}

  public static pending(): LeaveStatus {
    return new LeaveStatus("pending");
  }

  public static approved(): LeaveStatus {
    return new LeaveStatus("approved");
  }

  public static rejected(): LeaveStatus {
    return new LeaveStatus("rejected");
  }

  public static fromString(raw: string): LeaveStatus {
    const normalized = raw.toLowerCase();
    if (["pending", "approved", "rejected"].includes(normalized)) {
      return new LeaveStatus(normalized as LeaveStatusEnum);
    }
    throw new Error(`Statut de congé invalide : ${raw}`);
  }

  public isPending(): boolean {
    return this.value === "pending";
  }

  public isApproved(): boolean {
    return this.value === "approved";
  }

  public isRejected(): boolean {
    return this.value === "rejected";
  }
}
