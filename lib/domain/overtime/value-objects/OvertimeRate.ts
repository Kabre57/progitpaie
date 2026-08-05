/**
 * Value Object représentant le taux de majoration des heures supplémentaires.
 * Barème légal (Code du travail CI) :
 * - 1.15 : +15% (Heures de jour de 41h à 46h)
 * - 1.50 : +50% (Heures de jour au-delà de 46h ou de nuit)
 * - 1.75 : +75% (Heures de jour les dimanches et jours fériés)
 * - 2.00 : +100% (Heures de nuit les dimanches et jours fériés)
 */
export class OvertimeRate {
  private constructor(public readonly value: number) {
    if (![1.15, 1.5, 1.75, 2.0].includes(value)) {
      throw new Error(`Taux de majoration invalide : ${value}. Les taux valides sont 1.15, 1.50, 1.75, 2.00`);
    }
  }

  public static create(rate: number): OvertimeRate {
    return new OvertimeRate(rate);
  }

  public static standard15(): OvertimeRate {
    return new OvertimeRate(1.15);
  }

  public static standard50(): OvertimeRate {
    return new OvertimeRate(1.5);
  }

  public getMultiplier(): number {
    return this.value;
  }
}
