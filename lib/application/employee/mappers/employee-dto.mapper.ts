import { Employee } from "@/lib/domain/employee/entities/Employee";
import { EmployeeDTO } from "../dto/EmployeeDTO";

export function toEmployeeDTO(
  employee: Employee,
  departmentName?: string | null,
  shiftName?: string | null
): EmployeeDTO {
  const seniority = employee.calculateSeniority();
  return {
    id: employee.id,
    companyId: employee.companyId,
    employeeId: employee.employeeId ? employee.employeeId.value : null,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    departmentId: employee.departmentId || null,
    departmentName: departmentName || null,
    shiftId: employee.shiftId || null,
    shiftName: shiftName || null,
    salary: employee.salary.toNumber(),
    sursalaire: employee.sursalaire.toNumber(),
    transportAllowance: employee.transportAllowance.toNumber(),
    housingAllowance: employee.housingAllowance.toNumber(),
    partsIGR: employee.partsIGR,
    cnpsNumber: employee.cnpsNumber || null,
    idCardNumber: employee.idCardNumber || null,
    bankAccount: employee.bankAccount || null,
    bankName: employee.bankName || null,
    paymentMethod: employee.paymentMethod,
    joiningDate: employee.joiningDate ? employee.joiningDate.toISOString() : null,
    jobTitle: employee.jobTitle || null,
    category: employee.category || null,
    direction: employee.direction || null,
    service: employee.service || null,
    contractType: employee.contractType || null,
    seniorityMonths: seniority.totalMonths,
    seniorityYears: seniority.totalYears,
    isActive: employee.isActive,
    createdAt: employee.createdAt ? employee.createdAt.toISOString() : undefined,
    updatedAt: employee.updatedAt ? employee.updatedAt.toISOString() : undefined,
  };
}
