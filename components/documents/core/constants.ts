/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Document Constants & Presets 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { DocType } from "./types";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  contract: "Contrat de Travail",
  attestation: "Attestation de Travail",
  certificat: "Certificat de Travail",
  payslip: "Bulletin de Paie",
  attestation_conge: "Attestation de Congé Payé",
  ordre_virement: "Ordre de Virement",
  declaration_its: "Déclaration ITS DGI",
  declaration_fdfp: "Déclaration FDFP",
  declaration_cnps: "Déclaration CNPS",
  rns: "Relevé Nominatif des Salaires",
};

export const EDITABLE_DOC_TYPES: DocType[] = [
  "contract",
  "attestation",
  "certificat",
  "payslip",
  "attestation_conge",
];

export const DEFAULT_COMPANY_NAME = "LOGIPAIE RH 21 (SARL)";
export const DEFAULT_COMPANY_ADDRESS = "ABIDJAN COCODY, 01 BP 5115 ABIDJAN 01";
export const DEFAULT_REPRESENTATIVE = "la Direction Générale";
