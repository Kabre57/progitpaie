import { prisma } from "@/lib/db";
import { ProvisionTenantRepository } from "@/lib/application/admin/ports/ProvisionTenantRepository";
import { ProvisionTenantInput, ProvisionTenantResultDTO } from "@/lib/application/admin/dto/ProvisionTenantDTO";
import { SubscriptionPlan, UserRole } from "@prisma/client";

/**
 * Implémentation Prisma pour le provisioning d'une nouvelle entreprise cliente.
 * Crée l'entité juridique, les départements réglementaires ivoiriens et le compte administrateur.
 */
export class PrismaProvisionTenantRepository implements ProvisionTenantRepository {
  async isEmailTaken(email: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
    });
    return !!user;
  }

  async provisionTenant(input: ProvisionTenantInput, hashedPassword: string): Promise<ProvisionTenantResultDTO> {
    return prisma.$transaction(async (tx) => {
      // 1. Création de l'entreprise
      const company = await tx.company.create({
        data: {
          name: input.name,
          taxNumber: input.taxNumber || null,
          cnpsNumber: input.cnpsNumber || null,
          rccm: input.rccm || null,
          address: input.address || null,
          city: input.city || "Abidjan",
          country: "Côte d'Ivoire",
          phone: input.phone || null,
          email: input.email || input.adminEmail,
          isDemo: false,
          demoExpiresAt: null,
          plan: (input.plan || "STARTER") as SubscriptionPlan,
          subscriptionStatus: "ACTIVE",
          maxEmployeesAllowed: 25,
          monthlyPriceFCFA: 50000,
        },
      });

      // 2. Création des 5 départements standards
      const departmentNames = [
        "Direction Générale",
        "Ressources Humaines",
        "Finance & Comptabilité",
        "Opérations & Logistique",
        "Commercial & Marketing",
      ];

      const createdDepts = await Promise.all(
        departmentNames.map((name) =>
          tx.department.create({
            data: {
              companyId: company.id,
              name,
              description: `Département ${name}`,
            },
          })
        )
      );

      const rhDept = createdDepts.find((d) => d.name === "Ressources Humaines") || createdDepts[0];

      // 3. Création du compte administrateur de l'entreprise
      const adminUser = await tx.user.create({
        data: {
          companyId: company.id,
          name: input.adminName,
          email: input.adminEmail.trim().toLowerCase(),
          password: hashedPassword,
          role: UserRole.admin,
          employeeId: "EMP-001",
          departmentId: rhDept?.id,
          mustChangePassword: false,
          isActive: true,
          leaveBalanceAnnual: 30,
          leaveBalanceSick: 15,
          leaveBalanceCasual: 10,
        },
      });

      // 4. Enregistrement du journal d'audit de sécurité
      await tx.auditLog.create({
        data: {
          performedById: adminUser.id,
          companyId: company.id,
          action: "COMPANY_PROVISIONED",
          targetModel: "Company",
          targetId: company.id,
          newValues: {
            name: company.name,
            departmentsCount: createdDepts.length,
            plan: company.plan,
          },
        },
      });

      return {
        company: {
          id: company.id,
          name: company.name,
          isDemo: false,
          plan: company.plan,
          city: company.city || "Abidjan",
        },
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
        },
        departmentsCreated: createdDepts.length,
        sampleEmployeesCreated: 0,
      };
    });
  }
}
