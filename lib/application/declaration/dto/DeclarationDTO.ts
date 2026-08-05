export interface DeclarationDTO {
  period: string;
  country?: string;
  authority: string;
  formName: string;
  totalEmployees: number;
  totalGrossSalary: number;
  cnpsEmployeeTotal?: number;
  cnpsEmployerTotal?: number;
  totalCNPSToPay?: number;
  totalITS?: number;
  totalIGR?: number;
  totalTaxToPay?: number;
  employeeDetails?: Array<{
    employeeId: string;
    name: string;
    grossSalary: number;
    cnpsEmployee?: number;
    cnpsEmployer?: number;
  }>;
}
