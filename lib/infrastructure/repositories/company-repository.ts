/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Repository Entreprise / Multicompany (Infrastructure 🏢)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Encapsule l'accès aux tables `Company` et `CompanySettings`.
 * Fournit l'isolation multi-tenant pour les entités juridiques.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";

export interface CompanyData {
  id: string;
  name: string;
  taxNumber?: string | null;
  cnpsNumber?: string | null;
  rccm?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  isMain: boolean;
  isActive: boolean;
}

export interface ICompanyRepository {
  findMainCompany(): Promise<CompanyData>;
  findById(id: string): Promise<CompanyData | null>;
  findAll(): Promise<ReadonlyArray<CompanyData>>;
  create(data: Partial<CompanyData>): Promise<CompanyData>;
  update(id: string, data: Partial<CompanyData>): Promise<CompanyData>;
  getCompanySetting<T = any>(companyId: string, key: string): Promise<T | null>;
  saveCompanySetting<T = any>(companyId: string, key: string, value: T): Promise<void>;
}

export class CompanyRepository implements ICompanyRepository {
  /**
   * Récupère l'entreprise principale. Crée l'entreprise par défaut si aucune n'existe.
   */
  public async findMainCompany(): Promise<CompanyData> {
    let company = await prisma.company.findFirst({
      where: { isMain: true, isActive: true },
    });

    if (!company) {
      // Si aucune entreprise principale n'existe, on cherche n'importe quelle entreprise active
      company = await prisma.company.findFirst({
        where: { isActive: true },
      });
    }

    if (!company) {
      // Création automatique de l'entreprise par défaut si base neuve
      company = await prisma.company.create({
        data: {
          name: "PROGITPAIE RH 21 (Siège)",
          taxNumber: "1234567 A",
          cnpsNumber: "123456",
          rccm: "CI-ABJ-3000-A-451",
          address: "BP 5115 ABIDJAN 01",
          city: "Abidjan",
          country: "Côte d'Ivoire",
          email: "contact@progitpaie.ci",
          isMain: true,
          isActive: true,
        },
      });
    }

    return company;
  }

  /**
   * Récupère une entreprise par son ID
   */
  public async findById(id: string): Promise<CompanyData | null> {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  /**
   * Récupère la liste de toutes les entreprises
   */
  public async findAll(): Promise<ReadonlyArray<CompanyData>> {
    return prisma.company.findMany({
      where: { isActive: true },
      orderBy: { isMain: "desc" },
    });
  }

  /**
   * Crée une nouvelle entreprise
   */
  public async create(data: Partial<CompanyData>): Promise<CompanyData> {
    return prisma.company.create({
      data: {
        name: data.name || "Nouvelle Entité",
        taxNumber: data.taxNumber,
        cnpsNumber: data.cnpsNumber,
        rccm: data.rccm,
        address: data.address,
        city: data.city || "Abidjan",
        country: data.country || "Côte d'Ivoire",
        phone: data.phone,
        email: data.email,
        isMain: data.isMain || false,
        isActive: true,
      },
    });
  }

  /**
   * Met à jour une entreprise existante
   */
  public async update(id: string, data: Partial<CompanyData>): Promise<CompanyData> {
    return prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        taxNumber: data.taxNumber,
        cnpsNumber: data.cnpsNumber,
        rccm: data.rccm,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email,
        isMain: data.isMain,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Récupère un paramètre spécifique à une entreprise (avec fallback vers Settings global)
   */
  public async getCompanySetting<T = any>(companyId: string, key: string): Promise<T | null> {
    const setting = await prisma.companySettings.findUnique({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
    });

    if (setting && setting.value) {
      return setting.value as unknown as T;
    }

    // Fallback vers les paramètres globaux de l'application
    const globalSetting = await prisma.settings.findUnique({
      where: { key },
    });

    if (globalSetting && globalSetting.value) {
      return globalSetting.value as unknown as T;
    }

    return null;
  }

  /**
   * Sauvegarde un paramètre spécifique pour une entreprise
   */
  public async saveCompanySetting<T = any>(companyId: string, key: string, value: T): Promise<void> {
    await prisma.companySettings.upsert({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
      update: { value: value as any },
      create: { companyId, key, value: value as any },
    });
  }
}
