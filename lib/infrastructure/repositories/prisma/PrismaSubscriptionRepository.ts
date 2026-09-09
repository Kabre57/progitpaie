import { prisma } from "@/lib/db";
import { SubscriptionRepository, SubscriptionListOptions } from "@/lib/application/admin/ports/SubscriptionRepository";
import { SaaSMetricsDTO, TenantSubscriptionSummaryDTO, UpdateSubscriptionInput } from "@/lib/application/admin/dto/SubscriptionMetricsDTO";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async getSaaSMetrics(): Promise<SaaSMetricsDTO> {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ── Agrégations SQL parallèles ──────────────────────────────────────────
    const [
      statusGroups,
      planGroups,
      employeeTotals,
      quotaCandidates,
      renewalCandidates,
    ] = await Promise.all([
      // 1. Comptes par statut d'abonnement
      prisma.company.groupBy({
        by: ["subscriptionStatus"],
        _count: { id: true },
        _sum: { monthlyPriceFCFA: true },
      }),

      // 2. Répartition par plan avec revenus
      prisma.company.groupBy({
        by: ["plan"],
        _count: { id: true },
        _sum: { monthlyPriceFCFA: true },
      }),

      // 3. Total des employés dans le SaaS
      prisma.user.aggregate({
        _count: { id: true },
      }),

      // 4. Entreprises potentiellement en dépassement de quota (≥ 80%)
      // Chargement ciblé : on ne charge que les champs nécessaires au calcul
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          maxEmployeesAllowed: true,
          _count: { select: { employees: true } },
        },
        where: {
          maxEmployeesAllowed: { gt: 0 },
        },
      }),

      // 5. Entreprises avec renouvellement dans les 30 prochains jours
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionExpiresAt: true,
          monthlyPriceFCFA: true,
        },
        where: {
          subscriptionExpiresAt: {
            gte: now,
            lte: in30Days,
          },
        },
        orderBy: { subscriptionExpiresAt: "asc" },
      }),
    ]);

    // ── Calcul des indicateurs financiers depuis les groupBy ────────────────
    let mrrFCFA = 0;
    let activeSubscriptions = 0;
    let trialingSubscriptions = 0;
    let expiredSubscriptions = 0;
    let totalSubscriptions = 0;

    for (const g of statusGroups) {
      const count = g._count.id;
      const revenue = g._sum.monthlyPriceFCFA ?? 0;
      totalSubscriptions += count;

      switch (g.subscriptionStatus) {
        case "ACTIVE":
          activeSubscriptions += count;
          mrrFCFA += revenue;
          break;
        case "TRIALING":
          trialingSubscriptions += count;
          break;
        case "EXPIRED":
        case "PAST_DUE":
          expiredSubscriptions += count;
          break;
      }
    }

    // ── Plan breakdown ──────────────────────────────────────────────────────
    const planBreakdown: SaaSMetricsDTO["planBreakdown"] = planGroups.map((g) => ({
      plan: g.plan,
      count: g._count.id,
      totalRevenueFCFA: g._sum.monthlyPriceFCFA ?? 0,
    }));

    // ── Alertes quota (calcul JS sur le sous-ensemble ciblé) ────────────────
    const quotaAlerts: SaaSMetricsDTO["quotaAlerts"] = quotaCandidates
      .map((c) => {
        const currentEmployees = c._count.employees;
        const maxAllowed = c.maxEmployeesAllowed;
        const usagePercentage = Math.round((currentEmployees / maxAllowed) * 100);
        return { companyId: c.id, companyName: c.name, plan: c.plan, currentEmployees, maxAllowed, usagePercentage, isExceeded: currentEmployees > maxAllowed };
      })
      .filter((a) => a.usagePercentage >= 80)
      .sort((a, b) => b.usagePercentage - a.usagePercentage);

    // ── Renouvellements proches ─────────────────────────────────────────────
    const upcomingRenewals: SaaSMetricsDTO["upcomingRenewals"] = renewalCandidates.map((c) => {
      const daysRemaining = c.subscriptionExpiresAt
        ? Math.ceil((c.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        companyId: c.id,
        companyName: c.name,
        plan: c.plan,
        expiresAt: c.subscriptionExpiresAt ? c.subscriptionExpiresAt.toISOString() : null,
        daysRemaining,
        monthlyPriceFCFA: c.monthlyPriceFCFA,
      };
    });

    return {
      mrrFCFA,
      arrFCFA: mrrFCFA * 12,
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      expiredSubscriptions,
      totalEmployeesInSaaS: employeeTotals._count.id,
      planBreakdown,
      quotaAlerts,
      upcomingRenewals,
    };
  }

  async getAllTenantSubscriptions(options?: SubscriptionListOptions): Promise<TenantSubscriptionSummaryDTO[]> {
    const { page = 1, limit } = options ?? {};
    const skip = limit ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        monthlyPriceFCFA: true,
        maxEmployeesAllowed: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      plan: c.plan,
      status: c.subscriptionStatus,
      monthlyPriceFCFA: c.monthlyPriceFCFA,
      maxEmployeesAllowed: c.maxEmployeesAllowed,
      currentEmployees: c._count.employees,
      subscriptionExpiresAt: c.subscriptionExpiresAt ? c.subscriptionExpiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async updateTenantSubscription(input: UpdateSubscriptionInput): Promise<TenantSubscriptionSummaryDTO> {
    const updated = await prisma.company.update({
      where: { id: input.companyId },
      data: {
        plan: input.plan as SubscriptionPlan,
        subscriptionStatus: input.subscriptionStatus as SubscriptionStatus,
        monthlyPriceFCFA: input.monthlyPriceFCFA,
        maxEmployeesAllowed: input.maxEmployeesAllowed,
        subscriptionExpiresAt: input.subscriptionExpiresAt ? new Date(input.subscriptionExpiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        monthlyPriceFCFA: true,
        maxEmployeesAllowed: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      plan: updated.plan,
      status: updated.subscriptionStatus,
      monthlyPriceFCFA: updated.monthlyPriceFCFA,
      maxEmployeesAllowed: updated.maxEmployeesAllowed,
      currentEmployees: updated._count.employees,
      subscriptionExpiresAt: updated.subscriptionExpiresAt ? updated.subscriptionExpiresAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
