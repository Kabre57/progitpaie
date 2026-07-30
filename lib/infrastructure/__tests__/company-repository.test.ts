/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Tests Unitaires du CompanyRepository (Multicompany 🏢)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CompanyRepository } from "../repositories/company-repository";

describe("CompanyRepository (Multicompany)", () => {
  let repo: CompanyRepository;

  beforeEach(() => {
    repo = new CompanyRepository();
  });

  it("CompanyRepository devrait être instanciable", () => {
    expect(repo).toBeDefined();
    expect(typeof repo.findMainCompany).toBe("function");
    expect(typeof repo.findAll).toBe("function");
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.getCompanySetting).toBe("function");
  });
});
