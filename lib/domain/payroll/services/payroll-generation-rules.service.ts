import { PayrollGenerationRulesDTO } from "@/shared/validation/payroll-settings-v2.schema";

export interface PayrollGenerationCheckResult {
  isAllowed: boolean;
  requiresJustification: boolean;
  errorReason?: string;
  isEarly: boolean;
}

export class PayrollGenerationRulesService {
  public static checkGenerationAllowed(
    targetMonth: number,
    targetYear: number,
    rules: PayrollGenerationRulesDTO,
    justification?: string,
    currentDate: Date = new Date()
  ): PayrollGenerationCheckResult {
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

    // Régénération de mois passés : Toujours autorisée
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      return { isAllowed: true, requiresJustification: false, isEarly: false };
    }

    // Mois futur (ex: mars alors qu'on est en janvier)
    if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
      return {
        isAllowed: false,
        requiresJustification: false,
        isEarly: true,
        errorReason: `Impossible de générer la paie pour un mois futur (${targetMonth}/${targetYear}).`,
      };
    }

    // Mois en cours : Vérification du jour autorisée
    if (currentDay >= rules.startDayOfMonth) {
      return { isAllowed: true, requiresJustification: false, isEarly: false };
    }

    // Tentative de génération anticipée pour le mois en cours (ex: le 10 du mois au lieu du 25)
    if (rules.allowEarlyGenerationWithReason) {
      const cleanReason = (justification || "").trim();
      if (cleanReason.length >= rules.minJustificationLength) {
        return { isAllowed: true, requiresJustification: true, isEarly: true };
      }

      return {
        isAllowed: false,
        requiresJustification: true,
        isEarly: true,
        errorReason: `La génération de la paie pour le mois en cours n'est normalement autorisée qu'à partir du ${rules.startDayOfMonth} du mois. Une justification obligatoire (minimum ${rules.minJustificationLength} caractères) est requise pour débloquer la génération anticipée.`,
      };
    }

    return {
      isAllowed: false,
      requiresJustification: false,
      isEarly: true,
      errorReason: `La génération anticipée de la paie est désactivée. Vous devez attendre le ${rules.startDayOfMonth} du mois pour générer la paie.`,
    };
  }
}
