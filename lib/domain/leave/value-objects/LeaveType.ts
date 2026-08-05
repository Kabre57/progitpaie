export type LeaveTypeEnum = "annual" | "sick" | "casual" | "unpaid" | "maternity" | "paternity";

export class LeaveType {
  private constructor(public readonly value: LeaveTypeEnum) {}

  public static annual(): LeaveType {
    return new LeaveType("annual");
  }

  public static sick(): LeaveType {
    return new LeaveType("sick");
  }

  public static casual(): LeaveType {
    return new LeaveType("casual");
  }

  public static unpaid(): LeaveType {
    return new LeaveType("unpaid");
  }

  public static fromString(raw: string): LeaveType {
    const normalized = raw.toLowerCase();
    if (["annual", "sick", "casual", "unpaid", "maternity", "paternity"].includes(normalized)) {
      return new LeaveType(normalized as LeaveTypeEnum);
    }
    return new LeaveType("annual");
  }

  public isPaid(): boolean {
    return this.value !== "unpaid";
  }
}
