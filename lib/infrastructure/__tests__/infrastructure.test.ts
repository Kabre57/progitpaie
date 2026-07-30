/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Tests d'Infrastructure & Repositories
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EmployeeRepository } from "../repositories/employee-repository";
import { SettingsRepository } from "../repositories/settings-repository";
import { UnitOfWork } from "../unit-of-work";

describe("Infrastructure Repositories", () => {
  it("EmployeeRepository devrait être instanciable", () => {
    const repo = new EmployeeRepository();
    expect(repo).toBeDefined();
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.findAllActive).toBe("function");
  });

  it("SettingsRepository devrait être instanciable", () => {
    const repo = new SettingsRepository();
    expect(repo).toBeDefined();
    expect(typeof repo.getByKey).toBe("function");
    expect(typeof repo.getCompanyInfo).toBe("function");
  });

  it("UnitOfWork devrait être instanciable", () => {
    const uow = new UnitOfWork();
    expect(uow).toBeDefined();
    expect(typeof uow.executeTransaction).toBe("function");
  });
});
