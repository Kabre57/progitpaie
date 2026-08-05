/**
 * Value Object gérant le temps de travail et le calcul des minutes.
 */
export class WorkDuration {
  private constructor(
    public readonly hoursWorked: number,
    public readonly workingMinutes: number,
    public readonly overtimeMinutes: number = 0,
    public readonly overtimeRate: number = 1.15
  ) {
    if (hoursWorked < 0) throw new Error("Les heures travaillées ne peuvent pas être négatives");
    if (workingMinutes < 0) throw new Error("Les minutes travaillées ne peuvent pas être négatives");
  }

  public static create(
    hoursWorked: number,
    workingMinutes: number,
    overtimeMinutes: number = 0,
    overtimeRate: number = 1.15
  ): WorkDuration {
    return new WorkDuration(hoursWorked, workingMinutes, overtimeMinutes, overtimeRate);
  }

  public static zero(): WorkDuration {
    return new WorkDuration(0, 0, 0, 1.15);
  }

  public static calculateFromTimes(checkIn: Date, checkOut?: Date | null): WorkDuration {
    if (!checkOut) return WorkDuration.zero();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    if (diffMs <= 0) return WorkDuration.zero();

    const workingMinutes = Math.floor(diffMs / (1000 * 60));
    const hoursWorked = parseFloat((workingMinutes / 60).toFixed(2));
    
    // Heures supplémentaires au-delà de 8h (480 min)
    const overtimeMinutes = Math.max(0, workingMinutes - 480);

    return new WorkDuration(hoursWorked, workingMinutes, overtimeMinutes, 1.15);
  }
}
