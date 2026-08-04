import { Money } from "../../money";
import { LeaveEntitlement } from "../LeaveEntitlement";
import type { LeaveEntitlementInput } from "../types";

const BASE_INPUT: LeaveEntitlementInput = {
  userId: "employee-1",
  employeeName: "Awa Koné",
  companyId: "company-1",
  referenceDate: new Date("2026-12-31T00:00:00.000Z"),
  serviceMonths: 12,
};

describe("LeaveEntitlement", () => {
  it("acquiert 2,2 jours par mois effectif", () => {
    const result = LeaveEntitlement.createFrom(BASE_INPUT);
    expect(result.baseAccruedDays).toBe(26.4);
    expect(result.accruedDays).toBe(27);
  });

  it("soustrait les jours consommés", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, consumedDays: 5 });
    expect(result.closingBalance).toBe(22);
  });

  it("soustrait les jours déjà payés", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, paidDays: "4.5" });
    expect(result.closingBalance).toBe(22.5);
  });

  it("ajoute les reports au solde d'ouverture", () => {
    const result = LeaveEntitlement.createFrom({
      ...BASE_INPUT,
      openingBalance: 2,
      carriedDays: 3,
    });
    expect(result.openingBalance).toBe(2);
    expect(result.carriedDays).toBe(3);
    expect(result.closingBalance).toBe(32);
  });

  it("exclut les absences injustifiées du service effectif", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, unjustifiedAbsenceDays: 30 });
    expect(result.serviceMonths).toBe(11);
    expect(result.baseAccruedDays).toBe(24.2);
    expect(result.accruedDays).toBe(25);
  });

  it("exclut la période d'essai", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, probationMonths: 3 });
    expect(result.serviceMonths).toBe(9);
    expect(result.baseAccruedDays).toBe(19.8);
    expect(result.accruedDays).toBe(20);
  });

  it("ne produit pas de service effectif négatif", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, probationMonths: 18 });
    expect(result.serviceMonths).toBe(0);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "NO_EFFECTIVE_SERVICE" }));
  });

  it("signale un solde final négatif", () => {
    const result = LeaveEntitlement.createFrom({ ...BASE_INPUT, consumedDays: 30 });
    expect(result.closingBalance).toBe(-3);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "NEGATIVE_LEAVE_BALANCE" }));
  });

  it("retient la méthode du dixième lorsqu'elle est plus favorable", () => {
    const result = LeaveEntitlement.createFrom(BASE_INPUT).getProvision(Money.of(300_000));
    expect(result.method).toBe("TENTH");
    expect(result.amount.toNumber()).toBe(360_000);
  });

  it("retourne une provision nulle sans droits disponibles", () => {
    const entitlement = LeaveEntitlement.createFrom({ ...BASE_INPUT, serviceMonths: 0 });
    expect(entitlement.getProvisionAmount(Money.of(300_000)).toNumber()).toBe(0);
  });

  it("refuse les valeurs négatives", () => {
    expect(() => LeaveEntitlement.createFrom({ ...BASE_INPUT, consumedDays: -1 })).toThrow(RangeError);
  });

  it.each([
    [59, 0],
    [60, 1],
    [120, 2],
    [180, 3],
    [240, 5],
    [300, 7],
    [360, 8],
  ])("applique le palier d'ancienneté à %s mois", (seniorityMonths, expected) => {
    expect(LeaveEntitlement.createFrom({ ...BASE_INPUT, seniorityMonths }).seniorityBonusDays).toBe(expected);
  });
});
