/**
 * Structure de configuration universelle des taux et barèmes de paie (Côte d'Ivoire)
 */
export interface PayrollRatesConfig {
  // CNPS (Cotisations Sociales)
  cnpsEmployeeRetraite: number; // 6.30%
  cnpsEmployerRetraite: number; // 7.70%
  cnpsEmployerAT: number;       // 3.00%
  cnpsEmployerPF: number;       // 5.75%
  cnpsCeilingRetraite: number;  // 3 375 000 FCFA (décret n° 2022-986, effectif le 01/01/2023)
  cnpsCeilingPF_AT: number;     // 70 000 FCFA ou 75 000 FCFA

  // FDFP (Formation Professionnelle)
  fdfpTA: number;               // 0.40% (Taxe d'Apprentissage)
  fdfpFPC: number;              // 0.60% (Taxe Formation Continue)

  // ITS (Impôt sur Traitement et Salaire)
  itsRate: number;              // 1.20%

  // CMU (Couverture Maladie Universelle)
  cmuBase: number;              // 1 000 FCFA
  cmuEmployeeRate: number;      // 50.00% (soit 500 FCFA)
  cmuEmployerRate: number;      // 50.00% (soit 500 FCFA)

  // Primes, Exonérations & Base Horaire
  transportExemptAmount: number;// 30 000 FCFA
  seniorityRatePerYear: number; // 1.00% par an (ou 3.00%)
  defaultHourlyBase: number;    // 173.33 heures

  // Toggle d'affichage
  showCMU?: boolean;            // Afficher/Masquer la ligne CMU sur le bulletin (défaut: true)
}

/**
 * Valeurs par défaut sécurisées du barème officiel légal ivoirien
 */
export const DEFAULT_PAYROLL_RATES: PayrollRatesConfig = {
  cnpsEmployeeRetraite: 6.3,
  cnpsEmployerRetraite: 7.7,
  cnpsEmployerAT: 3.0,
  cnpsEmployerPF: 5.75,
  cnpsCeilingRetraite: 3375000,
  cnpsCeilingPF_AT: 70000,

  fdfpTA: 0.4,
  fdfpFPC: 0.6,

  itsRate: 1.2,

  cmuBase: 1000,
  cmuEmployeeRate: 50,
  cmuEmployerRate: 50,

  transportExemptAmount: 30000,
  seniorityRatePerYear: 1.0,
  defaultHourlyBase: 173.33,

  showCMU: true,
};
