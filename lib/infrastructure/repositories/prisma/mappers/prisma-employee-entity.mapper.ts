import { User as PrismaUser } from "@prisma/client";
import { Employee } from "@/lib/domain/employee/entities/Employee";
import { EmployeeId } from "@/lib/domain/employee/value-objects/EmployeeId";
import { Money } from "@/lib/domain/payroll/money";

export function mapPrismaToDomainEmployee(user: PrismaUser): Employee {
  return new Employee({
    id: user.id,
    companyId: user.companyId || "",
    employeeId: user.employeeId ? EmployeeId.create(user.employeeId) : null,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    shiftId: user.shiftId,
    salary: Money.of(user.salary || 0),
    sursalaire: Money.of(user.sursalaire || 0),
    transportAllowance: Money.of(user.transportAllowance || 0),
    housingAllowance: Money.of(user.housingAllowance || 0),
    partsIGR: user.partsIGR || 1.0,
    cnpsNumber: user.cnpsNumber,
    idCardNumber: user.idCardNumber,
    bankAccount: user.bankAccount,
    bankName: user.bankName,
    paymentMethod: user.paymentMethod || "CASH",
    joiningDate: user.joiningDate,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
