import { calculateGrossFromNet, calculatePartsFromFamilyStatus } from "../calculator/reverse-payroll-calculator";

describe("ReversePayrollCalculator (Calcul à l'Envers)", () => {
  describe("calculatePartsFromFamilyStatus", () => {
    it("devrait retourner 1.0 part pour un célibataire sans enfant", () => {
      expect(calculatePartsFromFamilyStatus("Célibataire", 0)).toBe(1.0);
    });

    it("devrait retourner 1.5 part pour un célibataire avec 1 enfant", () => {
      expect(calculatePartsFromFamilyStatus("Célibataire", 1)).toBe(1.5);
    });

    it("devrait retourner 2.0 parts pour un marié sans enfant", () => {
      expect(calculatePartsFromFamilyStatus("Marié(e)", 0)).toBe(2.0);
    });

    it("devrait retourner 3.0 parts pour un marié avec 2 enfants", () => {
      expect(calculatePartsFromFamilyStatus("Marié(e)", 2)).toBe(3.0);
    });

    it("devrait plafonner à 5.0 parts maximum pour un marié avec 7 enfants", () => {
      expect(calculatePartsFromFamilyStatus("Marié(e)", 7)).toBe(5.0);
    });
  });

  describe("calculateGrossFromNet", () => {
    it("devrait recalculer le brut exact pour un Net cible de 500 000 FCFA", () => {
      const res = calculateGrossFromNet({
        targetNet: 500_000,
        maritalStatus: "Marié(e)",
        childrenCount: 2,
        transportAllowance: 30_000,
      });

      expect(res.partsIGR).toBe(3.0);
      expect(res.ricfAmount).toBe(22_000);
      expect(res.grossImposable).toBeGreaterThan(500_000);
      expect(Math.abs(res.netSalaryCalculated - 500_000)).toBeLessThan(2);
      expect(res.totalCompanyCost).toBeGreaterThan(res.grossImposable);
    });

    it("devrait basculer le surplus d'indemnité de transport > 30 000 FCFA dans le brut imposable", () => {
      const res = calculateGrossFromNet({
        targetNet: 400_000,
        transportAllowance: 50_000, // 20k surplus
      });

      expect(res.transportExempt).toBe(30_000);
      expect(res.transportTaxableSurplus).toBe(20_000);
    });

    it("devrait calculer les avantages en nature logement (15%) et véhicule (10%)", () => {
      const res = calculateGrossFromNet({
        targetNet: 1_000_000,
        housingBenefitPercent: 15,
        vehicleBenefitPercent: 10,
      });

      expect(res.housingBenefitVal).toBe(Math.round(res.grossImposable * 0.15));
      expect(res.vehicleBenefitVal).toBe(Math.round(res.grossImposable * 0.10));
    });
  });
});
