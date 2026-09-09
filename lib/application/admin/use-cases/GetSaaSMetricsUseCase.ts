import { SubscriptionRepository } from "../ports/SubscriptionRepository";
import { SaaSMetricsDTO, TenantSubscriptionSummaryDTO } from "../dto/SubscriptionMetricsDTO";

export class GetSaaSMetricsUseCase {
  constructor(private readonly subRepo: SubscriptionRepository) {}

  async execute(): Promise<{ metrics: SaaSMetricsDTO; tenants: TenantSubscriptionSummaryDTO[] }> {
    const [metrics, tenants] = await Promise.all([
      this.subRepo.getSaaSMetrics(),
      this.subRepo.getAllTenantSubscriptions(),
    ]);

    return { metrics, tenants };
  }
}
