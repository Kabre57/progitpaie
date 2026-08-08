export interface CompanyAnnualCumulDTO {
  totalPayrollsProcessed?: number;
  cumulGrossSalary?: number;
  cumulNetSalary?: number;
  cumulItsTax?: number;
  cumulIgrTax?: number;
  cumulCnpsEmployee?: number;
  cumulCnpsEmployer?: number;
  cumulFdfpTax?: number;
}

export interface MonthlyCumulDTO {
  month: number;
  monthName: string;
  totalEmployees?: number;
  payrollCount?: number;
  totalGrossSalary?: number;
  totalNetSalary?: number;
  totalItsTax?: number;
  totalCnpsEmployee?: number;
  totalCnpsEmployer?: number;
  totalFdfpTax?: number;
  grossSalary?: number;
  netSalary?: number;
  itsTax?: number;
  cnpsEmployee?: number;
  cnpsEmployer?: number;
  fdfpTax?: number;
}

export interface EmployeeAnnualCumulDTO {
  userId?: string;
  employeeId?: string;
  name?: string;
  employeeName?: string;
  department?: string;
  departmentName?: string;
  jobTitle?: string;
  monthsPaid?: number;
  payrollsCount?: number;
  payrollCount?: number;
  cumulGrossSalary?: number;
  cumulDeductions?: number;
  cumulNetSalary?: number;
  totalGrossSalary?: number;
  totalNetSalary?: number;
  totalDeductions?: number;
  grossSalary?: number;
  netSalary?: number;
  itsTax?: number;
  cnpsEmployee?: number;
  cnpsEmployer?: number;
}

export interface CumulsResponseDTO {
  companyAnnualCumul: CompanyAnnualCumulDTO;
  monthlyCumuls: MonthlyCumulDTO[];
  employeeAnnualCumuls: EmployeeAnnualCumulDTO[];
}
