import { Money } from "@/lib/domain/payroll/money";
import { Employee } from "@/lib/domain/employee/entities/Employee";
import { EmployeeId } from "@/lib/domain/employee/value-objects/EmployeeId";
import { EmployeeRepository } from "../ports/EmployeeRepository";
import { EmployeeDTO } from "../dto/EmployeeDTO";
import { toEmployeeDTO } from "../mappers/employee-dto.mapper";

export interface UpdateEmployeeCommand {
  companyId: string;
  id: string;
  name?: string;
  email?: string;
  role?: string;
  departmentId?: string | null;
  shiftId?: string | null;
  employeeId?: string | null;
  salary?: number;
  sursalaire?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  partsIGR?: number;
  cnpsNumber?: string | null;
  idCardNumber?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  paymentMethod?: string;
  joiningDate?: string | null;
}

export class UpdateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  public async execute(command: UpdateEmployeeCommand): Promise<EmployeeDTO> {
    const existing = await this.repository.findByIdForTenant(command.companyId, command.id);
    if (!existing) {
      throw new Error("Salarié non trouvé");
    }

    const updated = new Employee({
      id: existing.id,
      companyId: existing.companyId,
      employeeId: command.employeeId !== undefined
        ? (command.employeeId ? EmployeeId.create(command.employeeId) : null)
        : existing.employeeId,
      name: command.name !== undefined ? command.name : existing.name,
      email: command.email !== undefined ? command.email : existing.email,
      role: command.role !== undefined ? command.role : existing.role,
      departmentId: command.departmentId !== undefined ? command.departmentId : existing.departmentId,
      shiftId: command.shiftId !== undefined ? command.shiftId : existing.shiftId,
      salary: command.salary !== undefined ? Money.of(command.salary) : existing.salary,
      sursalaire: command.sursalaire !== undefined ? Money.of(command.sursalaire) : existing.sursalaire,
      transportAllowance: command.transportAllowance !== undefined ? Money.of(command.transportAllowance) : existing.transportAllowance,
      housingAllowance: command.housingAllowance !== undefined ? Money.of(command.housingAllowance) : existing.housingAllowance,
      partsIGR: command.partsIGR !== undefined ? command.partsIGR : existing.partsIGR,
      cnpsNumber: command.cnpsNumber !== undefined ? command.cnpsNumber : existing.cnpsNumber,
      idCardNumber: command.idCardNumber !== undefined ? command.idCardNumber : existing.idCardNumber,
      bankAccount: command.bankAccount !== undefined ? command.bankAccount : existing.bankAccount,
      bankName: command.bankName !== undefined ? command.bankName : existing.bankName,
      paymentMethod: command.paymentMethod !== undefined ? command.paymentMethod : existing.paymentMethod,
      joiningDate: command.joiningDate !== undefined ? (command.joiningDate ? new Date(command.joiningDate) : null) : existing.joiningDate,
      isActive: existing.isActive,
    });

    const saved = await this.repository.save(updated);
    return toEmployeeDTO(saved);
  }
}
