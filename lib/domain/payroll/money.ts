import Decimal from "decimal.js";

export const MONEY_CURRENCY = "XOF" as const;
export type MoneyCurrency = typeof MONEY_CURRENCY;
export type MoneyInput = Money | Decimal.Value;

const FinancialDecimal = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 30,
});

/**
 * Objet-valeur monétaire immuable pour les calculs financiers en FCFA.
 *
 * Les opérations conservent toute leur précision. L'arrondi à l'unité monétaire
 * n'intervient qu'aux frontières via `toNumber`, `toString` ou `toJSON`.
 */
export class Money {
  private constructor(private readonly amount: Decimal) {}

  public static of(value: MoneyInput): Money {
    if (value instanceof Money) return value;

    const amount = new FinancialDecimal(value);
    if (!amount.isFinite()) {
      throw new RangeError("Un montant monétaire doit être un nombre fini");
    }

    return new Money(amount);
  }

  public static zero(): Money {
    return Money.of(0);
  }

  public add(value: MoneyInput): Money {
    return Money.of(this.amount.plus(Money.decimal(value)));
  }

  public subtract(value: MoneyInput): Money {
    return Money.of(this.amount.minus(Money.decimal(value)));
  }

  public multiply(factor: Decimal.Value): Money {
    return Money.of(this.amount.times(new FinancialDecimal(factor)));
  }

  public divide(divisor: Decimal.Value): Money {
    const decimalDivisor = new FinancialDecimal(divisor);
    if (decimalDivisor.isZero()) throw new RangeError("Division monétaire par zéro");
    return Money.of(this.amount.dividedBy(decimalDivisor));
  }

  public percentage(rate: Decimal.Value): Money {
    return this.multiply(rate).divide(100);
  }

  public negate(): Money {
    return Money.of(this.amount.negated());
  }

  public abs(): Money {
    return Money.of(this.amount.abs());
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  public isNegative(): boolean {
    return this.amount.isNegative();
  }

  public equals(value: MoneyInput): boolean {
    return this.amount.equals(Money.decimal(value));
  }

  public greaterThan(value: MoneyInput): boolean {
    return this.amount.greaterThan(Money.decimal(value));
  }

  public toNumber(): number {
    return this.rounded().toNumber();
  }

  public toString(): string {
    return this.rounded().toFixed(0);
  }

  public toJSON(): number {
    return this.toNumber();
  }

  public format(locale = "fr-FR"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: MONEY_CURRENCY,
      maximumFractionDigits: 0,
    }).format(this.toNumber());
  }

  private rounded(): Decimal {
    return this.amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  private static decimal(value: MoneyInput): Decimal {
    return value instanceof Money ? value.amount : new FinancialDecimal(value);
  }
}
