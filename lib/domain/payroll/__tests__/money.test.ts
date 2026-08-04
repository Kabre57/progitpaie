import { Money, MONEY_CURRENCY } from "../money";

describe("Money", () => {
  it("évite les erreurs binaires de JavaScript", () => {
    expect(Money.of("0.1").add("0.2").equals("0.3")).toBe(true);
  });

  it("enchaîne les opérations sans arrondi intermédiaire", () => {
    const result = Money.of("1000.25").multiply("3").subtract("0.75");
    expect(result.toNumber()).toBe(3000);
  });

  it("calcule un pourcentage exact", () => {
    expect(Money.of(333_333).percentage("1.2").toNumber()).toBe(4_000);
  });

  it("arrondit le FCFA à l'unité avec ROUND_HALF_UP", () => {
    expect(Money.of("100.49").toNumber()).toBe(100);
    expect(Money.of("100.50").toNumber()).toBe(101);
    expect(Money.of("-100.50").toNumber()).toBe(-101);
  });

  it("sérialise un montant en nombre entier", () => {
    expect(JSON.stringify({ amount: Money.of("1250.5") })).toBe('{"amount":1251}');
  });

  it("prend en charge les montants négatifs et la valeur absolue", () => {
    const adjustment = Money.of(500).subtract(750);
    expect(adjustment.isNegative()).toBe(true);
    expect(adjustment.abs().toNumber()).toBe(250);
  });

  it("refuse les montants non finis", () => {
    expect(() => Money.of(Number.NaN)).toThrow(RangeError);
    expect(() => Money.of(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("refuse une division par zéro", () => {
    expect(() => Money.of(1_000).divide(0)).toThrow("Division monétaire par zéro");
  });

  it("expose explicitement la devise XOF", () => {
    expect(MONEY_CURRENCY).toBe("XOF");
  });
});
