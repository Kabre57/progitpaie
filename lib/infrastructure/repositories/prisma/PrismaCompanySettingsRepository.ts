import type {
  CompanyLocationUpdate,
  CompanyProfileUpdate,
  CompanySettingsRepository,
  CompanySettingsSnapshot,
} from "@/lib/application/settings/ports/CompanySettingsRepository";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return null;
}

/**
 * Adaptateur Prisma des paramètres multi-tenant. Chaque méthode exige companyId
 * afin qu’aucune route ne puisse lire ou écrire les paramètres d’un autre tenant.
 */
export class PrismaCompanySettingsRepository implements CompanySettingsRepository {
  public async getSnapshot(companyId: string, administratorId: string): Promise<CompanySettingsSnapshot> {
    const [settings, company, administrator] = await Promise.all([
      prisma.companySettings.findMany({
        where: { companyId },
        select: { key: true, value: true },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          taxNumber: true,
          cnpsNumber: true,
          rccm: true,
          address: true,
          phone: true,
          email: true,
          city: true,
          latitude: true,
          longitude: true,
          radiusMeters: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: administratorId },
        select: { name: true, role: true },
      }),
    ]);

    return {
      settings: settings.map((setting) => ({ key: setting.key, value: setting.value })),
      company: company
        ? {
            name: company.name,
            taxNumber: company.taxNumber,
            cnpsNumber: company.cnpsNumber,
            rccm: company.rccm,
            address: company.address,
            phone: company.phone,
            email: company.email,
            city: company.city,
            latitude: toNumberOrNull(company.latitude),
            longitude: toNumberOrNull(company.longitude),
            radiusMeters: toNumberOrNull(company.radiusMeters),
          }
        : null,
      administrator: administrator ? { name: administrator.name, role: administrator.role } : null,
    };
  }

  public async saveSetting(companyId: string, key: string, value: unknown): Promise<unknown> {
    const setting = await prisma.companySettings.upsert({
      where: { companyId_key: { companyId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: { companyId, key, value: value as Prisma.InputJsonValue },
      select: { value: true },
    });
    return setting.value;
  }

  public async updateCompanyProfile(companyId: string, input: CompanyProfileUpdate): Promise<void> {
    if (Object.keys(input).length === 0) return;
    await prisma.company.update({ where: { id: companyId }, data: input });
  }

  public async updateCompanyLocation(companyId: string, input: CompanyLocationUpdate): Promise<void> {
    if (Object.keys(input).length === 0) return;
    await prisma.company.update({ where: { id: companyId }, data: input });
  }

  public async getCompanyGPS(companyId: string): Promise<{ latitude: number | null; longitude: number | null; radiusMeters: number | null } | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { latitude: true, longitude: true, radiusMeters: true },
    });
    if (!company) return null;
    return {
      latitude: toNumberOrNull(company.latitude),
      longitude: toNumberOrNull(company.longitude),
      radiusMeters: toNumberOrNull(company.radiusMeters),
    };
  }
}
