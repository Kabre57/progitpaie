import type { IGRSchedule, TaxRatesConfig } from "../types/payroll-types";

/**
 * Règle fiscale ivoirienne applicable aux salaires à compter du 1er janvier 2024.
 *
 * Source : ordonnance n° 2023-719 et communication de la Direction générale du
 * Trésor du 31 octobre 2023. La réforme fusionne IS, CN salariale et IGR/Salaires
 * en un ITS unique et remplace le quotient familial par la RICF.
 */
export const CI_ITS_2024_RULE = {
  id: "CI-ITS-2024-v1",
  country: "CI",
  validFrom: "2024-01-01",
  validTo: "2099-12-31",
  sourceUrl: "https://tresor.gouv.ci/tres/traitements-salaires-pensions-et-rentes-viageres-voici-ce-qui-attend-travailleurs-et-retraites-a-partir-du-1er-janvier-2024/",
  sourceLabel: "Direction générale du Trésor — Réforme des impôts sur traitements et salaires",
  approvedForProduction: false,
} as const;

/** Barème mensuel ITS unique et RICF configurables, versionnés avec la règle. */
export const CI_ITS_2024_SCHEDULE: IGRSchedule = {
  validFrom: CI_ITS_2024_RULE.validFrom,
  validTo: CI_ITS_2024_RULE.validTo,
  creditPerPart: 0,
  brackets: [
    { min: 0, max: 75_000, rate: 0, quickDeduction: 0 },
    { min: 75_001, max: 240_000, rate: 0.16, quickDeduction: 12_000 },
    { min: 240_001, max: 800_000, rate: 0.21, quickDeduction: 24_000 },
    { min: 800_001, max: 2_400_000, rate: 0.24, quickDeduction: 48_000 },
    { min: 2_400_001, max: 8_000_000, rate: 0.28, quickDeduction: 144_000 },
    { min: 8_000_001, max: Infinity, rate: 0.32, quickDeduction: 464_000 },
  ],
  ricfTable: {
    1.0: 0,
    1.5: 5_500,
    2.0: 11_000,
    2.5: 16_500,
    3.0: 22_000,
    3.5: 27_500,
    4.0: 33_000,
    4.5: 38_500,
    5.0: 44_000,
  },
};

/**
 * Valeurs CNPS intégrées à la règle, à confirmer périodiquement par un expert local.
 * Le plafond retraite de 3 375 000 FCFA résulte du décret n° 2022-986, effectif au
 * 1er janvier 2023. Le plafond PF/AT retenu par la configuration existante est 70 000 FCFA.
 */
export const CI_ITS_2024_DEFAULT_RATES: TaxRatesConfig = {
  cnpsRetirementEmployeeRate: 6.3,
  cmuEmployeeRate: 50,
  cnpsRetirementEmployerRate: 7.7,
  cnpsFamilyRate: 5.75,
  cnpsAccidentRate: 3,
  cmuEmployerRate: 50,
  fdfpTARate: 0.4,
  fdfpTFCRate: 0.6,
  itsRate: 0,
  ceRate: 0,
  cnRate: 0,
  transportExemptAmount: 30_000,
  ruleVersion: CI_ITS_2024_RULE.id,
  cnpsMonthlyRetirementCeiling: 3_375_000,
  cnpsMonthlyCeiling70K: 70_000,
  cmuBase: 1_000,
};
