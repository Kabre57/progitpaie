/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Shared Document Types 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type DocType =
  | "contract"
  | "attestation"
  | "certificat"
  | "payslip"
  | "attestation_conge"
  | "ordre_virement"
  | "declaration_its"
  | "declaration_fdfp"
  | "declaration_cnps"
  | "rns";

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
}

export interface PayslipAppearanceConfig {
  primaryColor?: string;
  headerTitle?: string;
  headerSubtitle?: string;
}

export interface PayslipLegalConfig {
  legalNotice?: string;
  showEmployerStamp?: boolean;
  showEmployeeSignature?: boolean;
}

export interface PayslipRatesConfig {
  cnpsEmployeeRetraite: number;
  cnpsEmployerRetraite: number;
  cnpsEmployerAT: number;
  cnpsEmployerPF: number;
  fdfpTA: number;
  fdfpFPC: number;
  itsRate: number;
  cmuBase: number;
  cmuEmployeeRate: number;
  cmuEmployerRate: number;
  transportExemptAmount: number;
  showCMU?: boolean;
}

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  defaultName?: string;
  defaultJobTitle?: string;
  defaultDepartment?: string;
  defaultSalary?: number;
  defaultSursalaire?: number;
  defaultTransport?: number;
  defaultCategory?: string;
  defaultJoiningDate?: string;
  defaultContractType?: string;
  defaultCddMonths?: number;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  docType: DocType;
  bankName?: string;
  totalAmount?: number;
  month?: number;
  year?: number;
  itsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    totalITS?: number;
    totalIGR?: number;
    totalCE?: number;
    totalTaxToPay?: number;
  };
  cnpsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    cnpsEmployeeTotal?: number;
    cnpsEmployerTotal?: number;
    totalCNPSToPay?: number;
    employeeDetails?: Array<{
      employeeId: string;
      name: string;
      grossSalary: number;
      cnpsEmployee: number;
      cnpsEmployer: number;
    }>;
  };
  rnsData?: Array<{
    year: number;
    monthsWorked: number;
    grossCnpsSalary: number;
  }>;
}
