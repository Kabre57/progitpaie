import { Money } from "@/lib/domain/payroll/money";
import { Employee } from "@/lib/domain/employee/entities/Employee";
import { EmployeeId } from "@/lib/domain/employee/value-objects/EmployeeId";
import { EmployeeRepository } from "../ports/EmployeeRepository";
import { EmployeeDTO } from "../dto/EmployeeDTO";
import { toEmployeeDTO } from "../mappers/employee-dto.mapper";

export interface CreateEmployeeCommand {
  companyId: string;
  name: string;
  email: string;
  role?: string;
  departmentId?: string;
  shiftId?: string;
  employeeId?: string;
  salary?: number;
  sursalaire?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  partsIGR?: number;
  cnpsNumber?: string;
  idCardNumber?: string;
  bankAccount?: string;
  bankName?: string;
  paymentMethod?: string;
  joiningDate?: string;
}

export class CreateEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  public async execute(command: CreateEmployeeCommand): Promise<EmployeeDTO> {
    const existing = await this.repository.findByEmail(command.email);
    if (existing) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    if (command.employeeId) {
      const existingMatricule = await this.repository.findByEmployeeId(command.companyId, command.employeeId);
      if (existingMatricule) {
        throw new Error("Un salarié avec ce matricule existe déjà dans l'entreprise");
      }
    }

    const employee = new Employee({
      id: "", // Généré par l'infra
      companyId: command.companyId,
      employeeId: command.employeeId ? EmployeeId.create(command.employeeId) : null,
      name: command.name,
      email: command.email,
      role: command.role || "employee",
      departmentId: command.departmentId || null,
      shiftId: command.shiftId || null,
      salary: Money.of(command.salary || 0),
      sursalaire: Money.of(command.sursalaire || 0),
      transportAllowance: Money.of(command.transportAllowance || 0),
      housingAllowance: Money.of(command.housingAllowance || 0),
      partsIGR: command.partsIGR || 1.0,
      cnpsNumber: command.cnpsNumber || null,
      idCardNumber: command.idCardNumber || null,
      bankAccount: command.bankAccount || null,
      bankName: command.bankName || null,
      paymentMethod: command.paymentMethod || "CASH",
      joiningDate: command.joiningDate ? new Date(command.joiningDate) : null,
      isActive: true,
    });

    const saved = await this.repository.save(employee);
    return toEmployeeDTO(saved);
  }
}
