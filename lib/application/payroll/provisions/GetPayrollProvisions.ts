import { ProvisionCalculatorV2, type CompanyProvisionV2Result } from "@/lib/domain/payroll/provision/ProvisionCalculatorV2";
import { PrismaProvisionRepository } from "@/lib/infrastructure/repositories/prisma-provision.repository";
import type { ProvisionRepository } from "./ports";

export interface GetPayrollProvisionsQuery {
  readonly companyId: string;
  readonly referenceDate: Date;
}

export class GetPayrollProvisions {
  public constructor(
    private readonly repository: ProvisionRepository = new PrismaProvisionRepository(),
    private readonly calculator: ProvisionCalculatorV2 = new ProvisionCalculatorV2()
  ) {}

  public async execute(query: GetPayrollProvisionsQuery): Promise<CompanyProvisionV2Result> {
    const aggregates = await this.repository.loadProvisionData(query);
    return this.calculator.calculate(query.companyId, query.referenceDate, aggregates);
  }
}
