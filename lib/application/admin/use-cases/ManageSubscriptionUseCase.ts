import { SubscriptionStatus } from "@prisma/client";
import {
  UpdateSubscriptionInput,
  CompanyKybDetailsDTO,
} from "../dto/CompanyKybSubscriptionDTO";
import { ManageCompanyKybUseCase } from "./ManageCompanyKybUseCase";
import { SuperAdminRepository } from "../ports/SuperAdminRepository";
import { PrismaSuperAdminRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminRepository";

export class ManageSubscriptionUseCase {
  constructor(
    private readonly superAdminRepo: SuperAdminRepository = new PrismaSuperAdminRepository(),
    private readonly kybUC: ManageCompanyKybUseCase = new ManageCompanyKybUseCase(superAdminRepo)
  ) {}

  /** Update subscription plan, status, FCFA price, employee limit and expiration date */
  public async updateSubscription(
    input: UpdateSubscriptionInput,
    updatedById: string
  ): Promise<CompanyKybDetailsDTO> {
    const dataToUpdate: Record<string, unknown> = {};

    if (input.plan) dataToUpdate.plan = input.plan;
    if (input.subscriptionStatus) dataToUpdate.subscriptionStatus = input.subscriptionStatus;
    if (input.monthlyPriceFCFA !== undefined) dataToUpdate.monthlyPriceFCFA = input.monthlyPriceFCFA;
    if (input.maxEmployeesAllowed !== undefined) dataToUpdate.maxEmployeesAllowed = input.maxEmployeesAllowed;
    if (input.subscriptionExpiresAt !== undefined) {
      dataToUpdate.subscriptionExpiresAt = input.subscriptionExpiresAt
        ? new Date(input.subscriptionExpiresAt)
        : null;
    }

    // Auto-toggle isActive if subscription is EXPIRED or CANCELED
    if (
      input.subscriptionStatus === SubscriptionStatus.EXPIRED ||
      input.subscriptionStatus === SubscriptionStatus.CANCELED
    ) {
      dataToUpdate.isActive = false;
    } else if (input.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      dataToUpdate.isActive = true;
    }

    await this.superAdminRepo.updateCompanySubscription(input.companyId, dataToUpdate);

    // Audit log
    await this.superAdminRepo.createAuditLog({
      companyId: input.companyId,
      performedById: updatedById,
      action: "UPDATE_COMPANY_SUBSCRIPTION",
      targetModel: "Company",
      targetId: input.companyId,
      newValues: dataToUpdate,
    });

    return this.kybUC.getKybDetails(input.companyId);
  }
}
