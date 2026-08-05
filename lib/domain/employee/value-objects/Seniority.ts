/**
 * Value Object représentant l'ancienneté d'un salarié.
 */
export class Seniority {
  private constructor(
    public readonly totalMonths: number,
    public readonly totalYears: number
  ) {
    if (totalMonths < 0) throw new Error("L'ancienneté ne peut pas être négative");
  }

  public static create(totalMonths: number): Seniority {
    const years = parseFloat((totalMonths / 12).toFixed(1));
    return new Seniority(totalMonths, years);
  }

  public static calculateFromDate(joiningDate: Date, referenceDate: Date = new Date()): Seniority {
    if (joiningDate > referenceDate) return new Seniority(0, 0);

    const yearDiff = referenceDate.getUTCFullYear() - joiningDate.getUTCFullYear();
    const monthDiff = referenceDate.getUTCMonth() - joiningDate.getUTCMonth();
    const dayDiff = referenceDate.getUTCDate() - joiningDate.getUTCDate();

    let totalMonths = yearDiff * 12 + monthDiff;
    if (dayDiff < 0) {
      totalMonths = Math.max(0, totalMonths - 1);
    }

    const totalYears = parseFloat((totalMonths / 12).toFixed(1));
    return new Seniority(totalMonths, totalYears);
  }
}
