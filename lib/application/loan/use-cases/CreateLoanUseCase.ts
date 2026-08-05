import { Money } from "@/lib/domain/payroll/money";
import { LoanType } from "@/lib/domain/loan/value-objects/LoanType";
import { EmployeeLoan } from "@/lib/domain/loan/entities/EmployeeLoan";
import { LoanRepository } from "../ports/LoanRepository";
import { LoanDTO } from "../dto/LoanDTO";
import { toLoanDTO } from "../mappers/loan-dto.mapper";

export interface CreateLoanCommand {
  companyId: string;
  userId: string;
  type?: string;
  amount: number;
  monthlyDeduction: number;
  startDate: string;
}

export class CreateLoanUseCase {
  constructor(private readonly repository: LoanRepository) {}

  public async execute(command: CreateLoanCommand): Promise<LoanDTO> {
    const type = LoanType.fromString(command.type || "PRET");
    const startDate = new Date(command.startDate);

    const loan = new EmployeeLoan({
      companyId: command.companyId,
      userId: command.userId,
      type,
      amount: Money.of(command.amount),
      monthlyDeduction: Money.of(command.monthlyDeduction),
      startDate,
    });

    const saved = await this.repository.save(loan);
    return toLoanDTO(saved);
  }
}
