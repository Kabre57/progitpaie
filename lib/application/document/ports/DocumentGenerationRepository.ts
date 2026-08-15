export interface DocumentCompanyProfile {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  cnpsNumber: string | null;
}

export interface DocumentEmployeeProfile {
  id: string;
  name: string;
  jobTitle: string | null;
  joiningDate: Date;
  address: string | null;
  nationality: string | null;
  contractType: string | null;
  salary: number;
  transportAllowance: number;
  housingAllowance: number;
  company: DocumentCompanyProfile | null;
}

export interface DocumentPayslipSource {
  employeeName: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

export interface DocumentGenerationRepository {
  getCompany(companyId: string): Promise<DocumentCompanyProfile | null>;
  getEmployee(companyId: string, userId: string | undefined): Promise<DocumentEmployeeProfile | null>;
  getPayslip(companyId: string, userId: string | undefined, month: number | undefined, year: number | undefined): Promise<DocumentPayslipSource | null>;
}
