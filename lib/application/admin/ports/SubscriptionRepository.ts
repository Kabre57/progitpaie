import { SaaSMetricsDTO, TenantSubscriptionSummaryDTO, UpdateSubscriptionInput } from "../dto/SubscriptionMetricsDTO";

export interface SubscriptionListOptions {
  page?: number;
  limit?: number;
}

export interface SubscriptionRepository {
  getSaaSMetrics(): Promise<SaaSMetricsDTO>;
  getAllTenantSubscriptions(options?: SubscriptionListOptions): Promise<TenantSubscriptionSummaryDTO[]>;
  updateTenantSubscription(input: UpdateSubscriptionInput): Promise<TenantSubscriptionSummaryDTO>;
}
