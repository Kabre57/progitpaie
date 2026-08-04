import { getSeniorityBonusDays, PROVISION_V2_RULE_SET } from "../ProvisionRuleSet";

describe("ProvisionRuleSet V2", () => {
  it("déclare le taux conventionnel de 2,2 jours ouvrables", () => {
    expect(PROVISION_V2_RULE_SET.leaveAccrualRate).toBe("2.2");
    expect(PROVISION_V2_RULE_SET.leaveDayUnit).toBe("WORKING_DAY");
  });

  it("utilise 26 jours ouvrables comme diviseur paramétré", () => {
    expect(PROVISION_V2_RULE_SET.dailyDivisor).toBe(26);
  });

  it("versionne le barème de licenciement", () => {
    expect(PROVISION_V2_RULE_SET.terminationTranches.map(({ rate }) => rate)).toEqual([
      "0.30",
      "0.35",
      "0.40",
    ]);
  });

  it.each([
    [0, 0],
    [4.99, 0],
    [5, 1],
    [10, 2],
    [15, 3],
    [20, 5],
    [25, 7],
    [30, 8],
    [42, 8],
  ])("retourne le bonus attendu à %s an(s)", (years, expected) => {
    expect(getSeniorityBonusDays(years)).toBe(expected);
  });

  it("refuse une ancienneté négative ou non finie", () => {
    expect(() => getSeniorityBonusDays(-1)).toThrow(RangeError);
    expect(() => getSeniorityBonusDays(Number.NaN)).toThrow(RangeError);
  });

  it("rend la configuration racine et les barèmes immuables", () => {
    expect(Object.isFrozen(PROVISION_V2_RULE_SET)).toBe(true);
    expect(Object.isFrozen(PROVISION_V2_RULE_SET.seniorityBonusSchedule)).toBe(true);
    expect(Object.isFrozen(PROVISION_V2_RULE_SET.terminationTranches)).toBe(true);
  });
});
