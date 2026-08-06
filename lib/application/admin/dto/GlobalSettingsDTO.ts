// ─── Section 1 : Taux Légaux (Côte d'Ivoire) ──────────────────────────────

export interface GlobalCNPSRates {
  cnpsEmployeeRetraite: number;  // % cotisation salarié retraite (défaut 6.3)
  cnpsEmployerRetraite: number;  // % cotisation patronal retraite (défaut 7.7)
  cnpsEmployerAT: number;        // % Accidents du Travail patronal (défaut 3.0)
  cnpsEmployerPF: number;        // % Prestations Familiales patronal (défaut 5.75)
  cnpsCeilingRetraite: number;   // Plafond mensuel CNPS retraite en FCFA
  cnpsCeilingPF_AT: number;      // Plafond mensuel PF/AT en FCFA
  fdfpTA: number;                // % FDFP Taxe Apprentissage (défaut 0.4)
  fdfpFPC: number;               // % FDFP Formation Continue (défaut 0.6)
  itsRate: number;               // % ITS (défaut 1.2)
  cmuBase: number;               // CMU base en FCFA (défaut 1000)
  cmuEmployeeRate: number;       // % part salarié CMU (défaut 50)
  cmuEmployerRate: number;       // % part employeur CMU (défaut 50)
  transportExemptAmount: number; // FCFA exonéré de transport (défaut 30000)
  defaultHourlyBase: number;     // Heures mensuelles de base (défaut 173.33)
}

// ─── Section 2 : Politique de Congés Annuels ──────────────────────────────

export interface GlobalLeavePolicy {
  annualLeaveDays: number;       // Jours de congés annuels légaux (défaut 25)
  sickLeaveDays: number;         // Jours de maladie annuels (défaut 15)
  maternityLeaveDays: number;    // Jours de congé maternité (défaut 98)
  paternityLeaveDays: number;    // Jours de congé paternité (défaut 10)
}

// ─── Section 3 : Politique de Sécurité ────────────────────────────────────

export interface GlobalSecurityPolicy {
  jwtExpiresInMinutes: number;   // Durée session JWT en minutes (défaut 120)
  maxLoginAttempts: number;      // Tentatives de connexion max avant blocage (défaut 5)
  lockoutDurationMinutes: number;// Durée de blocage en minutes (défaut 15)
  requireMFA: boolean;           // MFA obligatoire (défaut false)
  minPasswordLength: number;     // Longueur minimale du mot de passe (défaut 8)
}

// ─── Aggregate DTO ─────────────────────────────────────────────────────────

export interface GlobalSettingsDTO {
  cnpsRates: GlobalCNPSRates;
  leavePolicy: GlobalLeavePolicy;
  securityPolicy: GlobalSecurityPolicy;
  lastUpdatedAt: string | null;
}
