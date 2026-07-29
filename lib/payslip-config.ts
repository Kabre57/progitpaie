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
export interface PayslipFullConfig {
  appearance: PayslipAppearanceConfig;
  legal: PayslipLegalConfig;
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
