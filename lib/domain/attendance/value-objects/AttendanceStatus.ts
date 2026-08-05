export type AttendanceStatusType = "present" | "late" | "absent" | "half_day" | "on_leave";

/**
 * Value Object représentant le statut d'un pointage.
 */
export class AttendanceStatus {
  private constructor(public readonly value: AttendanceStatusType) {}

  public static present(): AttendanceStatus {
    return new AttendanceStatus("present");
  }

  public static late(): AttendanceStatus {
    return new AttendanceStatus("late");
  }

  public static absent(): AttendanceStatus {
    return new AttendanceStatus("absent");
  }

  public static halfDay(): AttendanceStatus {
    return new AttendanceStatus("half_day");
  }

  public static onLeave(): AttendanceStatus {
    return new AttendanceStatus("on_leave");
  }

  public static fromString(raw: string): AttendanceStatus {
    const normalized = raw === "half-day" ? "half_day" : raw === "on-leave" ? "on_leave" : raw;
    if (["present", "late", "absent", "half_day", "on_leave"].includes(normalized)) {
      return new AttendanceStatus(normalized as AttendanceStatusType);
    }
    throw new Error(`Statut de pointage invalide : ${raw}`);
  }

  public isPresent(): boolean {
    return this.value === "present" || this.value === "late";
  }

  public isLate(): boolean {
    return this.value === "late";
  }

  public isAbsent(): boolean {
    return this.value === "absent";
  }
}
