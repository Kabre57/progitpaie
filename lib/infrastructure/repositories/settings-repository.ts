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

import { prisma } from "@/lib/db";

export interface ISettingsRepository {
  getByKey<T = any>(key: string): Promise<T | null>;
  saveByKey<T = any>(key: string, value: T): Promise<void>;
  getCompanyInfo(): Promise<any>;
}

export class SettingsRepository implements ISettingsRepository {
  /**
   * Récupère une valeur de configuration par sa clé
   */
  public async getByKey<T = any>(key: string): Promise<T | null> {
    const doc = await prisma.settings.findUnique({
      where: { key },
    });
    if (!doc || !doc.value) return null;
    return doc.value as unknown as T;
  }

  /**
   * Sauvegarde ou met à jour une clé de configuration
   */
  public async saveByKey<T = any>(key: string, value: T): Promise<void> {
    await prisma.settings.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }

  /**
   * Récupère les informations officielles de l'entreprise
   */
  public async getCompanyInfo(): Promise<any> {
    const [infoDoc, companyDoc] = await Promise.all([
      this.getByKey("company_info"),
      this.getByKey("company"),
    ]);

    return infoDoc || companyDoc || {};
  }
}
