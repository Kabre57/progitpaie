/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Repository Paramètres (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Encapsule l'accès à la table `Settings` pour la lecture et l'écriture des
 * configurations (taux, entreprise, apparence, juridique).
 *
 * ADR-002 : Repository Pattern pour éliminer le couplage direct à Prisma.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { GlobalSettingsRepository } from "@/lib/application/settings/ports/GlobalSettingsRepository";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface ISettingsRepository extends GlobalSettingsRepository {
  getCompanyInfo(): Promise<Record<string, unknown>>;
}

export class SettingsRepository implements ISettingsRepository {
  /**
   * Récupère une valeur de configuration par sa clé
   */
  public async getByKey<T = unknown>(key: string): Promise<T | null> {
    const doc = await prisma.settings.findUnique({
      where: { key },
    });
    if (!doc || !doc.value) return null;
    return doc.value as unknown as T;
  }

  /**
   * Sauvegarde ou met à jour une clé de configuration
   */
  public async saveByKey<T>(key: string, value: T): Promise<void> {
    const jsonValue = value as unknown as Prisma.InputJsonValue;
    await prisma.settings.upsert({
      where: { key },
      update: { value: jsonValue },
      create: { key, value: jsonValue },
    });
  }

  public async getCompanySetting<T = unknown>(companyId: string, key: string): Promise<T | null> {
    const doc = await prisma.companySettings.findUnique({ where: { companyId_key: { companyId, key } } });
    return doc?.value ? (doc.value as unknown as T) : null;
  }

  public async saveCompanySetting<T>(companyId: string, key: string, value: T): Promise<void> {
    const jsonValue = value as unknown as Prisma.InputJsonValue;
    await prisma.companySettings.upsert({
      where: { companyId_key: { companyId, key } },
      update: { value: jsonValue },
      create: { companyId, key, value: jsonValue },
    });
  }

  /**
   * Récupère les informations officielles de l'entreprise
   */
  public async getCompanyInfo(): Promise<Record<string, unknown>> {
    const [infoDoc, companyDoc] = await Promise.all([
      this.getByKey<Record<string, unknown>>("company_info"),
      this.getByKey<Record<string, unknown>>("company"),
    ]);

    return infoDoc || companyDoc || {};
  }

  /**
   * Récupère l'ID de l'entreprise d'un utilisateur
   */
  public async getUserCompanyId(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    return user ? user.companyId : null;
  }

  /**
   * Crée un snapshot immutable de configuration de bulletin de paie
   */
  public async createPayslipConfigSnapshot(data: {
    companyId: string;
    appearanceConfig: unknown;
    legalConfig: unknown;
    ratesConfig: unknown;
    parametricConfig?: unknown;
    createdById: string;
  }): Promise<string> {
    const snapshot = await prisma.payslipConfigSnapshot.create({
      data: {
        companyId: data.companyId,
        appearanceConfig: data.appearanceConfig as Prisma.InputJsonValue,
        legalConfig: data.legalConfig as Prisma.InputJsonValue,
        ratesConfig: data.ratesConfig as Prisma.InputJsonValue,
        ...(data.parametricConfig !== undefined ? { parametricConfig: data.parametricConfig as Prisma.InputJsonValue } : {}),
        createdById: data.createdById,
      },
    });
    return snapshot.id;
  }

  /**
   * Récupère un snapshot de configuration de bulletin par son ID
   */
  public async getPayslipConfigSnapshot(snapshotId: string): Promise<{
    appearanceConfig: unknown;
    legalConfig: unknown;
    ratesConfig: unknown;
    parametricConfig?: unknown;
  } | null> {
    const snapshot = await prisma.payslipConfigSnapshot.findUnique({
      where: { id: snapshotId },
    });
    if (!snapshot) return null;
    return {
      appearanceConfig: snapshot.appearanceConfig,
      legalConfig: snapshot.legalConfig,
      ratesConfig: snapshot.ratesConfig,
      parametricConfig: snapshot.parametricConfig,
    };
  }
}
