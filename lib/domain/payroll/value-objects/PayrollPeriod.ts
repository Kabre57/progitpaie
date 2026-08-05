/**
 * Value Object représentant la période d'un bulletin de paie (Mois / Année).
 */
export class PayrollPeriod {
  private constructor(
    public readonly month: number,
    public readonly year: number
  ) {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`Mois invalide : ${month}. Doit être un entier entre 1 et 12.`);
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error(`Année invalide : ${year}. Doit être entre 2000 et 2100.`);
    }
  }

  public static create(month: number, year: number): PayrollPeriod {
    return new PayrollPeriod(month, year);
  }

  public startDate(): Date {
    return new Date(Date.UTC(this.year, this.month - 1, 1));
  }

  public endDate(): Date {
    return new Date(Date.UTC(this.year, this.month, 0, 23, 59, 59, 999));
  }

  public equals(other: PayrollPeriod): boolean {
    return this.month === other.month && this.year === other.year;
  }

  public toString(): string {
    return `${this.year}-${String(this.month).padStart(2, "0")}`;
  }
}
