/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Barrel Export Infrastructure
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Point d'accès unique pour les repositories et services d'infrastructure.
 */

export { EmployeeRepository, type IEmployeeRepository } from "./repositories/employee-repository";
export { PayslipRepository, type IPayslipRepository } from "./repositories/payslip-repository";
export { SettingsRepository, type ISettingsRepository } from "./repositories/settings-repository";
export { CompanyRepository, type ICompanyRepository, type CompanyData } from "./repositories/company-repository";
export { UnitOfWork, type IUnitOfWork } from "./unit-of-work";
