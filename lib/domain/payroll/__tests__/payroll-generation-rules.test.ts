import { PayrollGenerationRulesService } from "../services/payroll-generation-rules.service";
import { PayrollGenerationRulesDTO } from "@/shared/validation/payroll-settings-v2.schema";

describe("PayrollGenerationRulesService", () => {
  const defaultRules: PayrollGenerationRulesDTO = {
    startDayOfMonth: 25,
    allowEarlyGenerationWithReason: true,
    minJustificationLength: 10,
  };

  it("should allow past months generation without justification", () => {
    const currentDate = new Date(2026, 1, 10); // 10 fevrier 2026
    const res = PayrollGenerationRulesService.checkGenerationAllowed(1, 2026, defaultRules, undefined, currentDate);
    expect(res.isAllowed).toBe(true);
    expect(res.requiresJustification).toBe(false);
  });

  it("should allow current month generation on or after startDayOfMonth", () => {
    const currentDate = new Date(2026, 1, 25); // 25 fevrier 2026
    const res = PayrollGenerationRulesService.checkGenerationAllowed(2, 2026, defaultRules, undefined, currentDate);
    expect(res.isAllowed).toBe(true);
    expect(res.requiresJustification).toBe(false);
  });

  it("should block early generation when before startDayOfMonth without justification", () => {
    const currentDate = new Date(2026, 1, 10); // 10 fevrier 2026
    const res = PayrollGenerationRulesService.checkGenerationAllowed(2, 2026, defaultRules, undefined, currentDate);
    expect(res.isAllowed).toBe(false);
    expect(res.requiresJustification).toBe(true);
    expect(res.errorReason).toContain("n'est normalement autorisée qu'à partir du 25");
  });

  it("should allow early generation when valid justification is provided", () => {
    const currentDate = new Date(2026, 1, 10); // 10 fevrier 2026
    const res = PayrollGenerationRulesService.checkGenerationAllowed(
      2,
      2026,
      defaultRules,
      "Fermeture annuelle anticipée de l'entreprise",
      currentDate
    );
    expect(res.isAllowed).toBe(true);
    expect(res.requiresJustification).toBe(true);
  });

  it("should reject early generation if justification is too short", () => {
    const currentDate = new Date(2026, 1, 10); // 10 fevrier 2026
    const res = PayrollGenerationRulesService.checkGenerationAllowed(
      2,
      2026,
      defaultRules,
      "court",
      currentDate
    );
    expect(res.isAllowed).toBe(false);
    expect(res.requiresJustification).toBe(true);
  });
});
