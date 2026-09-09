import { SubscriptionRepository } from "../ports/SubscriptionRepository";
import { UpdateSubscriptionInput, TenantSubscriptionSummaryDTO } from "../dto/SubscriptionMetricsDTO";

export class UpdateTenantSubscriptionUseCase {
  constructor(private readonly subRepo: SubscriptionRepository) {}

  async execute(input: UpdateSubscriptionInput): Promise<TenantSubscriptionSummaryDTO> {
    if (input.maxEmployeesAllowed <= 0) {
      throw new Error("Le quota maximal de salariés doit être supérieur à zéro");
    }
    if (input.monthlyPriceFCFA < 0) {
      throw new Error("Le tarif mensuel ne peut pas être négatif");
    }

    return this.subRepo.updateTenantSubscription(input);
  }
}
