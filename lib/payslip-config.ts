/**
 * Configuration Visuelle & Légale du Bulletin de Paie (Côte d'Ivoire)
 * Séparé des taux métier (qui restent dans rates-config.ts / RateService)
 */

// ═══════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════

/**
 * Configuration d'apparence du bulletin (modification libre, risque faible)
 */
export interface PayslipAppearanceConfig {
  primaryColor: string;       // Couleur de la bande Net à Payer (hex)
  headerTitle: string;        // Titre principal du bulletin
  headerSubtitle: string;     // Sous-titre ou Régime
  logoBase64?: string;        // Logo entreprise encodé en Base64 (max 200KB)
}

/**
 * Configuration des mentions légales & pied de page (modification libre, risque faible)
 */
export interface PayslipLegalConfig {
  legalNotice: string;            // Texte de la mention légale de bas de page
  showEmployerStamp: boolean;     // Afficher la zone signature / tampon employeur
  showEmployeeSignature: boolean; // Afficher la zone d'émargement salarié
}

/**
 * Configuration complète du bulletin = Apparence + Légal
 * (Les taux métier CNPS/FDFP/ITS/CMU restent dans PayrollRatesConfig via RateService)
 */
export interface PayslipRubricConfig {
  code: string;
  label: string;
  type: "gain" | "retenue" | "base" | "information" | "total";
  visible: boolean;
  order: number;
  formula?: string;
}

export interface PayslipParametricConfig {
  company: {
    name: string;
    address: string;
    rccm: string;
    cc: string;
    cnps: string;
  };
  period: {
    start: string;
    end: string;
    paymentDate: string;
    paymentMethod: string;
  };
  currency: {
    code: string;
    symbol: string;
    locale: string;
    decimals: number;
  };
  contributions: {
    cnpsRetraiteEmployeeRate: number;
    cnpsRetraiteEmployerRate: number;
    cnpsATRate: number;
    cnpsPFRate: number;
    fdfpFormationRate: number;
    fdfpApprentissageRate: number;
    itsEmployerRate: number;
    cnpsRetraiteCeiling: number;
    cnpsATCeiling: number;
    cnpsPFCeiling: number;
  };
  taxBrackets: Array<{ min: number; max: number | null; rate: number }>;
  salaryGrid: Array<{ category: string; amount: number }>;
  jobTitles: string[];
  categories: string[];
  salaryScales: Array<{ name: string; base: number; sursalaire: number; prime: number }>;
  other: {
    seniorityRate: number;
    seniorityThresholds: Array<{ years: number; rate: number }>;
    overtimeRates: Array<{ label: string; rate: number }>;
    transportExemptionCeiling: number;
    bonusTypes: string[];
    deductionTypes: string[];
  };
  bank: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    ribKey: string;
    iban: string;
    bic: string;
  };
  geolocation: {
    country: string;
    region: string;
    city: string;
    timezone: string;
    locale: string;
  };
  layout: {
    pageWidth: number;
    pageHeight: number;
    orientation: "portrait" | "landscape";
    marginTop: number;
    marginLeft: number;
    marginRight: number;
    marginBottom: number;
    logoPosition: { x: number; y: number };
    logoSize: { width: number; height: number };
    fontFamily: string;
    fontSizes: { header: number; body: number; table: number; totals: number; signature: number };
    tableColumnWidths: number[];
    tableCellPadding: number;
    tableMinCellHeight: number;
    tableLineWidth: number;
    tableLineColor: string;
    tableHeaderBgColor: string;
    tableHeaderTextColor: string;
    tableBodyTextColor: string;
    cumulTableBgColor: string;
    signatureBoxSize: { width: number; height: number };
    signaturePosition: { x1: number; x2: number };
    showLogo: boolean;
    showSignatures: boolean;
    showCumuls: boolean;
    showLegalNotice: boolean;
    showFooter: boolean;
    showEmployeeFrame: boolean;
  };
  rubrics: PayslipRubricConfig[];
}

export interface PayslipFullConfig {
  appearance: PayslipAppearanceConfig;
  legal: PayslipLegalConfig;
  parametric: PayslipParametricConfig;
}

// ═══════════════════════════════════════════════
// VALEURS PAR DÉFAUT SÉCURISÉES
// ═══════════════════════════════════════════════

export const DEFAULT_PAYSLIP_APPEARANCE: PayslipAppearanceConfig = {
  primaryColor: "#BBD795",        // Vert LOGIPAIE
  headerTitle: "BULLETIN DE PAIE",
  headerSubtitle: "",
};

export const DEFAULT_PAYSLIP_LEGAL: PayslipLegalConfig = {
  legalNotice:
    "Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. (L 3243-4 du Code du travail)",
  showEmployerStamp: true,
  showEmployeeSignature: true,
};

export const DEFAULT_PAYSLIP_PARAMETRIC: PayslipParametricConfig = {
  company: { name: "PROGITPAIE Capture Test", address: "BP 5115 ABIDJAN 01", rccm: "CI-ABJ-3000-A-451", cc: "1234567 A", cnps: "123456" },
  period: { start: "01/08/2024", end: "31/08/2024", paymentDate: "31/08/2024", paymentMethod: "Virement" },
  currency: { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals: 0 },
  contributions: {
    cnpsRetraiteEmployeeRate: 6.3, cnpsRetraiteEmployerRate: 7.7, cnpsATRate: 3, cnpsPFRate: 5.75,
    fdfpFormationRate: 0.6, fdfpApprentissageRate: 0.4, itsEmployerRate: 1.2,
    cnpsRetraiteCeiling: 3375000, cnpsATCeiling: 75000, cnpsPFCeiling: 75000,
  },
  taxBrackets: [
    { min: 0, max: 100000, rate: 0 }, { min: 100001, max: 200000, rate: 10 },
    { min: 200001, max: 300000, rate: 20 }, { min: 300001, max: 500000, rate: 30 },
    { min: 500001, max: 1000000, rate: 40 }, { min: 1000001, max: null, rate: 50 },
  ],
  salaryGrid: [], jobTitles: ["Comptable"], categories: ["1A"], salaryScales: [],
  other: {
    seniorityRate: 3, seniorityThresholds: [{ years: 1, rate: 3 }],
    overtimeRates: [{ label: "Heures supplémentaires", rate: 25 }, { label: "Nuit", rate: 50 }, { label: "Dimanche/jour férié", rate: 75 }],
    transportExemptionCeiling: 30000, bonusTypes: ["Prime de transport", "Gratification", "Prime de rendement"], deductionTypes: ["Acompte sur salaire", "Cotisation syndicale"],
  },
  bank: { bankName: "", bankCode: "", accountNumber: "", ribKey: "", iban: "", bic: "" },
  geolocation: { country: "Côte d'Ivoire", region: "Abidjan", city: "Abidjan", timezone: "Africa/Abidjan", locale: "fr" },
  layout: {
    pageWidth: 210, pageHeight: 297, orientation: "portrait", marginTop: 14, marginLeft: 14, marginRight: 14, marginBottom: 14,
    logoPosition: { x: 14, y: 6 }, logoSize: { width: 25, height: 9 }, fontFamily: "helvetica",
    fontSizes: { header: 13, body: 8, table: 6.1, totals: 8, signature: 7 }, tableColumnWidths: [9, 57, 20, 16, 19, 19, 15, 19], tableCellPadding: 0.35, tableMinCellHeight: 4.4,
    tableLineWidth: 0.12, tableLineColor: "#AAAAAA", tableHeaderBgColor: "#F5F5F5", tableHeaderTextColor: "#2D2D2D", tableBodyTextColor: "#2D2D2D", cumulTableBgColor: "#DCE0E6",
    signatureBoxSize: { width: 60, height: 10 }, signaturePosition: { x1: 20, x2: 130 }, showLogo: true, showSignatures: true, showCumuls: true, showLegalNotice: true, showFooter: true, showEmployeeFrame: true,
  },
  rubrics: [
    { code: "01", label: "SALAIRE CATEGORIEL", type: "gain", visible: true, order: 1 }, { code: "02", label: "SURSALAIRE", type: "gain", visible: true, order: 2 }, { code: "03", label: "PRIME D'ANCIENNETÉ", type: "gain", visible: true, order: 3 },
    { code: "15", label: "CONGÉS PAYÉS", type: "gain", visible: true, order: 15 }, { code: "16", label: "GRATIFICATION", type: "gain", visible: true, order: 16 }, { code: "17", label: "PRÉAVIS", type: "gain", visible: true, order: 17 }, { code: "18", label: "INDEMNITÉ DE LICENCIEMENT", type: "gain", visible: true, order: 18 }, { code: "19", label: "PRIME D'ANCIENNETÉ", type: "gain", visible: true, order: 19 }, { code: "20", label: "HEURES SUPPLÉMENTAIRES", type: "gain", visible: true, order: 20 }, { code: "21", label: "PRIME DE TRANSPORT", type: "gain", visible: true, order: 21 }, { code: "25", label: "PRIMES ET GRATIFICATIONS", type: "gain", visible: true, order: 25 },
    { code: "30", label: "TOTAL BRUT", type: "total", visible: true, order: 30 }, { code: "31", label: "BRUT FISCAL EMPLOYÉ", type: "base", visible: true, order: 31 }, { code: "32", label: "BRUT SOCIAL EMPLOYÉ", type: "base", visible: true, order: 32 }, { code: "34", label: "IMPÔT TRAITEMENT ET SALAIRES (ITS)", type: "retenue", visible: true, order: 34 }, { code: "35", label: "CNPS RETRAITE SALARIÉ", type: "retenue", visible: true, order: 35 }, { code: "36", label: "CNPS ACCIDENT DU TRAVAIL (AT)", type: "retenue", visible: true, order: 36 }, { code: "37", label: "CNPS PRESTATIONS FAMILIALES (PF)", type: "retenue", visible: true, order: 37 }, { code: "38", label: "FDFP TAXE FORMATION CONTINUE", type: "retenue", visible: true, order: 38 }, { code: "39", label: "FDFP TAXE D'APPRENTISSAGE", type: "retenue", visible: true, order: 39 }, { code: "40", label: "PRIME DE TRANSPORT EXONÉRÉE", type: "gain", visible: true, order: 40 },
  ],
};

// ═══════════════════════════════════════════════
// CONSTANTES DE VALIDATION (Upload Logo)
// ═══════════════════════════════════════════════

/** Taille maximale du logo en octets (200 KB) */
export const LOGO_MAX_SIZE_BYTES = 200 * 1024;

/** Types MIME autorisés pour l'upload de logo */
export const LOGO_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Dimensions maximales du logo pour le bulletin PDF (largeur x hauteur en px) */
export const LOGO_MAX_DIMENSIONS = { width: 300, height: 100 };

/**
 * Magic numbers (premiers octets) pour la validation des fichiers image
 * Permet de bloquer les fichiers malveillants renommés en .png/.jpg
 */
export const LOGO_MAGIC_NUMBERS: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],       // ‰PNG
  "image/jpeg": [0xff, 0xd8, 0xff],              // ÿØÿ
  "image/webp": [0x52, 0x49, 0x46, 0x46],        // RIFF
};

/**
 * Préréglages de couleurs pour le color picker
 */
export const COLOR_PRESETS = [
  { name: "Vert LOGIPAIE", value: "#BBD795" },
  { name: "Bleu Marine", value: "#1E3A8A" },
  { name: "Bordeaux", value: "#7F1D1D" },
  { name: "Anthracite", value: "#1F2937" },
  { name: "Émeraude", value: "#065F46" },
  { name: "Violet Royal", value: "#4C1D95" },
] as const;
