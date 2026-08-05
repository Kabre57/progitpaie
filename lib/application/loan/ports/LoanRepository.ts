import { EmployeeLoan } from "@/lib/domain/loan/entities/EmployeeLoan";

export interface ListLoansQuery {
  companyId: string;
  userId?: string;
  type?: string;
  status?: string;
}

export interface LoanRepository {
  list(query: ListLoansQuery): Promise<readonly EmployeeLoan[]>;
  findByIdForTenant(companyId: string, id: string): Promise<EmployeeLoan | null>;
  save(loan: EmployeeLoan): Promise<EmployeeLoan>;
}
