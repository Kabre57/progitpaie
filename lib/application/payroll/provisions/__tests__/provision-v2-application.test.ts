import { Money } from "@/lib/domain/payroll/money";
import { ProvisionCalculatorV2 } from "@/lib/domain/payroll/provision/ProvisionCalculatorV2";
import type { ProvisionEmployeeAggregate } from "@/lib/domain/payroll/provision/data";
import { provisionV2QuerySchema } from "@/shared/validation/provision.schema";
import { GetPayrollProvisions } from "../GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "../provision.mapper";
import { resolveProvisionReferenceDate } from "../reference-date";
import type { ProvisionRepository } from "../ports";

const referenceDate = new Date("2025-12-31T23:59:59.999Z");

function aggregate(): ProvisionEmployeeAggregate {
  return {
    employee: {
      id: "employee-a",
      companyId: "company-a",
      name: "Awa Koné",
      employeeId: "EMP-001",
      joiningDate: new Date("2020-01-01T00:00:00.000Z"),
      exitDate: null,
      currentBaseSalary: Money.of(300_000),
      currentSursalaire: Money.of(50_000),
      probationMonths: 0,
    },
    payrolls: [],
    leaveLedger: [],
  };
}

describe("GetPayrollProvisions", () => {
  it("orchestre le repository puis le calculateur V2", async () => {
    const repository: ProvisionRepository = {
      loadProvisionData: jest.fn().mockResolvedValue([aggregate()]),
    };
    const result = await new GetPayrollProvisions(repository).execute({
      companyId: "company-a",
      referenceDate,
    });
    expect(repository.loadProvisionData).toHaveBeenCalledWith({ companyId: "company-a", referenceDate });
    expect(result.companyId).toBe("company-a");
    expect(result.employees).toHaveLength(1);
  });
});

describe("Mapper ProvisionResponseV2", () => {
  const domainResult = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]);
  const dto = mapProvisionResultToV2DTO(
    domainResult,
    new Date("2026-01-01T00:00:00.000Z")
  );

  it("produit le contrat V2 sans vocabulaire retraite", () => {
    expect(dto.terminationBenefits).toHaveLength(1);
    expect(dto).not.toHaveProperty("retirementProvisions");
    expect(dto).not.toHaveProperty("totalRetirementProvision");
  });

  it("convertit Money uniquement à la frontière DTO", () => {
    expect(typeof dto.totalExposure).toBe("number");
    expect(typeof dto.leaveProvisions[0].provisionAmount).toBe("number");
    expect(typeof dto.terminationBenefits[0].theoreticalExposure).toBe("number");
  });

  it("expose les détails de calcul et la version des règles", () => {
    expect(dto.ruleVersion).toBe("CI-CCI-1977-PROVISIONS-2026.2");
    expect(dto.leaveProvisions[0]).toEqual(
      expect.objectContaining({
        dailyDivisorUsed: 26,
        baseAccruedDays: 26.4,
        seniorityBonusDays: 1,
        selectedMethod: expect.stringMatching(/TENTH|SALARY_MAINTENANCE/),
      })
    );
  });

  it("synthétise la qualité des données", () => {
    expect(dto.dataQuality.contractFallbacks).toBe(1);
    expect(dto.dataQuality.completeSalaryHistories).toBe(0);
    expect(dto.employeesWithWarnings).toBe(1);
  });
});

describe("Validation et date de référence V2", () => {
  const now = new Date("2026-08-03T12:00:00.000Z");

  it("accepte soit year, soit asOf", () => {
    expect(provisionV2QuerySchema.safeParse({ year: "2025" }).success).toBe(true);
    expect(provisionV2QuerySchema.safeParse({ asOf: "2026-08-03" }).success).toBe(true);
  });

  it("refuse year et asOf simultanément", () => {
    expect(provisionV2QuerySchema.safeParse({ year: "2025", asOf: "2025-12-31" }).success).toBe(false);
  });

  it("refuse une date calendaire impossible et les champs inconnus", () => {
    expect(provisionV2QuerySchema.safeParse({ asOf: "2026-02-30" }).success).toBe(false);
    expect(provisionV2QuerySchema.safeParse({ year: "2025", tenantId: "company-b" }).success).toBe(false);
  });

  it("résout une année passée à la clôture UTC", () => {
    expect(resolveProvisionReferenceDate({ year: 2025 }, now).toISOString()).toBe(
      "2025-12-31T23:59:59.999Z"
    );
  });

  it("borne l'année courante à la journée courante", () => {
    expect(resolveProvisionReferenceDate({ year: 2026 }, now).toISOString()).toBe(
      "2026-08-03T23:59:59.999Z"
    );
  });

  it("refuse une année ou une date future", () => {
    expect(() => resolveProvisionReferenceDate({ year: 2027 }, now)).toThrow(RangeError);
    expect(() => resolveProvisionReferenceDate({ asOf: "2026-08-04" }, now)).toThrow(RangeError);
  });
});
