import { prisma } from "@/lib/db";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import {
  UpdateSubscriptionInput,
  CompanyKybDetailsDTO,
} from "../dto/CompanyKybSubscriptionDTO";
import { ManageCompanyKybUseCase } from "./ManageCompanyKybUseCase";

const kybUC = new ManageCompanyKybUseCase();

export class ManageSubscriptionUseCase {
  /** Update subscription plan, status, FCFA price, employee limit and expiration date */
  public async updateSubscription(
    input: UpdateSubscriptionInput,
    updatedById: string
  ): Promise<CompanyKybDetailsDTO> {
    const dataToUpdate: any = {};

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

    await prisma.company.update({
      where: { id: input.companyId },
      data: dataToUpdate,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        performedById: updatedById,
        action: "UPDATE_COMPANY_SUBSCRIPTION",
        targetModel: "Company",
        targetId: input.companyId,
        newValues: dataToUpdate,
      },
    });

    return kybUC.getKybDetails(input.companyId);
  }
}
