export interface SaaSMetricsDTO {
  mrrFCFA: number;
  arrFCFA: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  expiredSubscriptions: number;
  totalEmployeesInSaaS: number;
  planBreakdown: Array<{
    plan: string;
    count: number;
    totalRevenueFCFA: number;
  }>;
  quotaAlerts: Array<{
    companyId: string;
    companyName: string;
    plan: string;
    currentEmployees: number;
    maxAllowed: number;
    usagePercentage: number;
    isExceeded: boolean;
  }>;
  upcomingRenewals: Array<{
    companyId: string;
    companyName: string;
    plan: string;
    expiresAt: string | null;
    daysRemaining: number | null;
    monthlyPriceFCFA: number;
  }>;
}

export interface TenantSubscriptionSummaryDTO {
  id: string;
  name: string;
  plan: string;
  status: string;
  monthlyPriceFCFA: number;
  maxEmployeesAllowed: number;
  currentEmployees: number;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface UpdateSubscriptionInput {
  companyId: string;
  plan: "FREE_TRIAL" | "STARTER" | "BUSINESS" | "ENTERPRISE";
  subscriptionStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  monthlyPriceFCFA: number;
  maxEmployeesAllowed: number;
  subscriptionExpiresAt?: string | null;
}
