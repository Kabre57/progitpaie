import { ImpersonateTenantUseCase } from "../use-cases/ImpersonateTenantUseCase";
import { ExitImpersonationUseCase } from "../use-cases/ExitImpersonationUseCase";
import { GetSaaSMetricsUseCase } from "../use-cases/GetSaaSMetricsUseCase";
import { UpdateTenantSubscriptionUseCase } from "../use-cases/UpdateTenantSubscriptionUseCase";
import { GetSystemHealthUseCase } from "../use-cases/GetSystemHealthUseCase";
import { ProvisionTenantWithTemplateUseCase } from "../use-cases/ProvisionTenantWithTemplateUseCase";
import { ManageSuperAdminTeamUseCase } from "../use-cases/ManageSuperAdminTeamUseCase";
import { ImpersonationAuditPort } from "../ports/ImpersonationAuditPort";
import { SubscriptionRepository } from "../ports/SubscriptionRepository";
import { SystemHealthRepository } from "../ports/SystemHealthRepository";
import { ProvisionTenantRepository } from "../ports/ProvisionTenantRepository";
import { SuperAdminTeamRepository } from "../ports/SuperAdminTeamRepository";

describe("Cas d'Utilisation Métier — Les 5 Axes Super Admin", () => {
  // ── Axe 1 : Mode Support & Impersonation ──────────────────────────────────
  describe("Axe 1 — Mode Support & Impersonation Sécurisée", () => {
    let mockAuditRepo: jest.Mocked<ImpersonationAuditPort>;

    beforeEach(() => {
      mockAuditRepo = {
        getUserDetails: jest.fn(),
        getCompanyDetails: jest.fn(),
        logImpersonationStart: jest.fn(),
        logImpersonationExit: jest.fn(),
      };
    });

    it("doit activer avec succès une session de support pour un Super Administrateur", async () => {
      mockAuditRepo.getUserDetails.mockResolvedValue({
        id: "sa-1",
        name: "Super Administrateur",
        email: "superadmin@progitpaie.online",
        role: "super_admin",
      });
      mockAuditRepo.getCompanyDetails.mockResolvedValue({
        id: "company-1",
        name: "Entreprise Cliente SARL",
      });

      const useCase = new ImpersonateTenantUseCase(mockAuditRepo);
      const result = await useCase.execute({ superAdminId: "sa-1", companyId: "company-1" });

      expect(result.isImpersonating).toBe(true);
      expect(result.targetCompanyId).toBe("company-1");
      expect(result.targetCompanyName).toBe("Entreprise Cliente SARL");
      expect(mockAuditRepo.logImpersonationStart).toHaveBeenCalledWith("sa-1", "company-1", "Entreprise Cliente SARL");
    });

    it("doit refuser l'impersonation si l'utilisateur n'est pas super_admin", async () => {
      mockAuditRepo.getUserDetails.mockResolvedValue({
        id: "user-1",
        name: "Admin Simple",
        email: "admin@client.ci",
        role: "admin",
      });

      const useCase = new ImpersonateTenantUseCase(mockAuditRepo);
      await expect(
        useCase.execute({ superAdminId: "user-1", companyId: "company-1" })
      ).rejects.toThrow("super_admin");
    });

    it("doit clôturer la session de support et inscrire l'événement au journal d'audit", async () => {
      const exitUseCase = new ExitImpersonationUseCase(mockAuditRepo);
      await exitUseCase.execute("sa-1", "company-1");
      expect(mockAuditRepo.logImpersonationExit).toHaveBeenCalledWith("sa-1", "company-1");
    });
  });

  // ── Axe 2 : Abonnements SaaS, Plans & Quotas ──────────────────────────────
  describe("Axe 2 — Abonnements SaaS, Plans & Quotas d'Effectifs", () => {
    let mockSubRepo: jest.Mocked<SubscriptionRepository>;

    beforeEach(() => {
      mockSubRepo = {
        getSaaSMetrics: jest.fn(),
        getAllTenantSubscriptions: jest.fn(),
        updateTenantSubscription: jest.fn(),
      };
    });

    it("doit retourner les indicateurs financiers MRR / ARR et les quotas SaaS", async () => {
      mockSubRepo.getSaaSMetrics.mockResolvedValue({
        mrrFCFA: 500000,
        arrFCFA: 6000000,
        totalSubscriptions: 5,
        activeSubscriptions: 4,
        trialingSubscriptions: 1,
        expiredSubscriptions: 0,
        totalEmployeesInSaaS: 42,
        planBreakdown: [{ plan: "STARTER", count: 4, totalRevenueFCFA: 500000 }],
        quotaAlerts: [],
        upcomingRenewals: [],
      });
      mockSubRepo.getAllTenantSubscriptions.mockResolvedValue([]);

      const useCase = new GetSaaSMetricsUseCase(mockSubRepo);
      const result = await useCase.execute();

      expect(result.metrics.mrrFCFA).toBe(500000);
      expect(result.metrics.activeSubscriptions).toBe(4);
    });

    it("doit valider et mettre à jour le plan et le quota d'une entreprise", async () => {
      mockSubRepo.updateTenantSubscription.mockResolvedValue({
        id: "comp-1",
        name: "Entreprise SARL",
        plan: "BUSINESS",
        status: "ACTIVE",
        monthlyPriceFCFA: 100000,
        maxEmployeesAllowed: 50,
        currentEmployees: 12,
        subscriptionExpiresAt: null,
        createdAt: new Date().toISOString(),
      });

      const useCase = new UpdateTenantSubscriptionUseCase(mockSubRepo);
      const res = await useCase.execute({
        companyId: "comp-1",
        plan: "BUSINESS",
        subscriptionStatus: "ACTIVE",
        monthlyPriceFCFA: 100000,
        maxEmployeesAllowed: 50,
      });

      expect(res.plan).toBe("BUSINESS");
      expect(res.maxEmployeesAllowed).toBe(50);
    });

    it("doit rejeter les tarifs négatifs ou les quotas invalides", async () => {
      const useCase = new UpdateTenantSubscriptionUseCase(mockSubRepo);
      await expect(
        useCase.execute({
          companyId: "comp-1",
          plan: "BUSINESS",
          subscriptionStatus: "ACTIVE",
          monthlyPriceFCFA: -500,
          maxEmployeesAllowed: 10,
        })
      ).rejects.toThrow("tarif mensuel");

      await expect(
        useCase.execute({
          companyId: "comp-1",
          plan: "BUSINESS",
          subscriptionStatus: "ACTIVE",
          monthlyPriceFCFA: 50000,
          maxEmployeesAllowed: 0,
        })
      ).rejects.toThrow("quota maximal");
    });
  });

  // ── Axe 3 : Surveillance Infrastructure & Diagnostic ─────────────────────
  describe("Axe 3 — Monitoring Infrastructure & Santé Système", () => {
    it("doit retourner l'état de santé complet du système", async () => {
      const mockHealthRepo: SystemHealthRepository = {
        getSystemHealth: jest.fn().mockResolvedValue({
          status: "HEALTHY",
          timestamp: new Date().toISOString(),
          uptimeSeconds: 1200,
          environment: "production",
          nodeVersion: "v20.0.0",
          process: { heapUsedMB: 50, heapTotalMB: 100, rssMB: 80, memoryUsagePercentage: 50 },
          serverOS: {
            platform: "linux",
            arch: "x64",
            totalMemMB: 4000,
            freeMemMB: 2000,
            usedMemMB: 2000,
            osMemoryUsagePercentage: 50,
            loadAverage: [0.5, 0.4, 0.3],
          },
          database: { status: "CONNECTED", latencyMs: 2, sizePretty: "15 MB", activeConnections: 3, version: "PostgreSQL 16" },
          redis: { status: "CONNECTED", latencyMs: 1 },
          security: { failedAudits24h: 0, totalAudits24h: 15 },
        }),
      };

      const useCase = new GetSystemHealthUseCase(mockHealthRepo);
      const res = await useCase.execute();

      expect(res.status).toBe("HEALTHY");
      expect(res.database.status).toBe("CONNECTED");
    });
  });

  // ── Axe 4 : Onboarding & Provisioning d'Entreprise ────────────────────────
  describe("Axe 4 — Création & Provisioning d'Entreprise", () => {
    let mockProvisionRepo: jest.Mocked<ProvisionTenantRepository>;
    const mockHash = jest.fn().mockResolvedValue("hashed_secret");

    beforeEach(() => {
      mockProvisionRepo = {
        isEmailTaken: jest.fn(),
        provisionTenant: jest.fn(),
      };
    });

    it("doit créer une nouvelle entreprise avec ses départements et son administrateur", async () => {
      mockProvisionRepo.isEmailTaken.mockResolvedValue(false);
      mockProvisionRepo.provisionTenant.mockResolvedValue({
        company: { id: "new-comp", name: "Nouvelle Entreprise SARL", isDemo: false, plan: "STARTER", city: "Abidjan" },
        adminUser: { id: "admin-1", email: "admin@nouvelle.ci", name: "Administrateur Principal" },
        departmentsCreated: 5,
        sampleEmployeesCreated: 0,
      });

      const useCase = new ProvisionTenantWithTemplateUseCase(mockProvisionRepo, mockHash);
      const res = await useCase.execute({
        name: "Nouvelle Entreprise SARL",
        adminName: "Administrateur Principal",
        adminEmail: "admin@nouvelle.ci",
        adminPassword: "PasswordSecurise123!",
      });

      expect(res.company.name).toBe("Nouvelle Entreprise SARL");
      expect(res.departmentsCreated).toBe(5);
      expect(mockHash).toHaveBeenCalled();
    });

    it("doit refuser la création si l'email administrateur est déjà enregistré", async () => {
      mockProvisionRepo.isEmailTaken.mockResolvedValue(true);

      const useCase = new ProvisionTenantWithTemplateUseCase(mockProvisionRepo, mockHash);
      await expect(
        useCase.execute({
          name: "Nouvelle Entreprise SARL",
          adminName: "Administrateur Principal",
          adminEmail: "existant@progitpaie.ci",
          adminPassword: "PasswordSecurise123!",
        })
      ).rejects.toThrow("déjà utilisé");
    });
  });

  // ── Axe 5 : Gestion de l'Équipe Super Admin ───────────────────────────────
  describe("Axe 5 — Gestion de l'Équipe Super Admin", () => {
    let mockTeamRepo: jest.Mocked<SuperAdminTeamRepository>;
    const mockHash = jest.fn().mockResolvedValue("hashed_super_secret");

    beforeEach(() => {
      mockTeamRepo = {
        listSuperAdmins: jest.fn(),
        createSuperAdmin: jest.fn(),
        updateSuperAdmin: jest.fn(),
        deleteSuperAdmin: jest.fn(),
        countSuperAdmins: jest.fn(),
        findByEmail: jest.fn(),
      };
    });

    it("doit inviter un nouveau membre avec le rôle super_admin", async () => {
      mockTeamRepo.findByEmail.mockResolvedValue(null);
      mockTeamRepo.createSuperAdmin.mockResolvedValue({
        id: "sa-2",
        name: "Second Administrateur",
        email: "admin2@progitpaie.online",
        role: "super_admin",
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      const useCase = new ManageSuperAdminTeamUseCase(mockTeamRepo, mockHash);
      const res = await useCase.inviteMember({
        name: "Second Administrateur",
        email: "admin2@progitpaie.online",
        password: "MotDePasseTresSecurise2026!",
      });

      expect(res.name).toBe("Second Administrateur");
      expect(res.role).toBe("super_admin");
    });

    it("doit empêcher la révocation de son propre compte Super Admin", async () => {
      const useCase = new ManageSuperAdminTeamUseCase(mockTeamRepo, mockHash);
      await expect(useCase.revokeMember("sa-1", "sa-1")).rejects.toThrow("votre propre compte");
    });

    it("doit interdire la suppression du dernier Super Administrateur actif", async () => {
      mockTeamRepo.countSuperAdmins.mockResolvedValue(1);
      const useCase = new ManageSuperAdminTeamUseCase(mockTeamRepo, mockHash);
      await expect(useCase.revokeMember("sa-1", "sa-2")).rejects.toThrow("dernier Super Administrateur");
    });
  });
});
