/**
 * Value Object représentant la période temporelle d'une demande de congé.
 */
export class LeavePeriod {
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly totalDays: number
  ) {
    if (startDate > endDate) {
      throw new Error("La date de début ne peut pas être postérieure à la date de fin");
    }
    if (totalDays <= 0) {
      throw new Error("Le nombre de jours de congé doit être supérieur à zéro");
    }
  }

  public static create(startDate: Date, endDate: Date, explicitDays?: number): LeavePeriod {
    if (startDate > endDate) {
      throw new Error("La date de début ne peut pas être postérieure à la date de fin");
    }

    let calculatedDays = explicitDays;
    if (!calculatedDays || calculatedDays <= 0) {
      let count = 0;
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const dayOfWeek = cur.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Hors Samedi (6) et Dimanche (0)
          count++;
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      calculatedDays = Math.max(1, count);
    }

    return new LeavePeriod(startDate, endDate, calculatedDays);
  }
}
