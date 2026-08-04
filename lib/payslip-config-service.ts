import { prisma } from "@/lib/db";
import {
  PayslipAppearanceConfig,
  PayslipLegalConfig,
  DEFAULT_PAYSLIP_APPEARANCE,
  DEFAULT_PAYSLIP_LEGAL,
} from "./payslip-config";
import { RateService } from "./rate-service";
import { PayrollRatesConfig } from "./rates-config";

/**
 * Service Singleton de Gestion de la Configuration du Bulletin de Paie
 * (Apparence + Mentions Légales — les taux métier restent dans RateService)
 *
 * Fonctionnalités :
 * - Cache en mémoire avec TTL 5 min
 * - Fallback sécurisé vers les valeurs par défaut
 * - Création de snapshots immutables pour le versioning des bulletins
 * - Invalidation immédiate après écriture
 */
export class PayslipConfigService {
  private static instance: PayslipConfigService;

  private cachedAppearance: PayslipAppearanceConfig | null = null;
  private cachedLegal: PayslipLegalConfig | null = null;
  private lastFetchAppearance: number = 0;
  private lastFetchLegal: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  private constructor() {}

  public static getInstance(): PayslipConfigService {
    if (!PayslipConfigService.instance) {
      PayslipConfigService.instance = new PayslipConfigService();
    }
    return PayslipConfigService.instance;
  }

  // ═══════════════════════════════════════════════
  // LECTURE (avec Cache & Fallback)
  // ═══════════════════════════════════════════════

  /**
   * Récupère la configuration d'apparence (avec cache 5 min & fallback sécurisé)
   */
  public async getAppearance(): Promise<PayslipAppearanceConfig> {
    const now = Date.now();
    if (this.cachedAppearance && now - this.lastFetchAppearance < this.CACHE_TTL_MS) {
      return this.cachedAppearance;
    }

    try {
      const doc = await prisma.settings.findUnique({
        where: { key: "payslip_appearance" },
      });

      if (doc && doc.value) {
        const val = doc.value as unknown as Partial<PayslipAppearanceConfig>;
        // deepMerge avec les defaults (Réserve 3.2 — rétrocompatibilité)
        this.cachedAppearance = {
          ...DEFAULT_PAYSLIP_APPEARANCE,
          ...val,
        };
      } else {
        this.cachedAppearance = { ...DEFAULT_PAYSLIP_APPEARANCE };
      }

      this.lastFetchAppearance = Date.now();
      return this.cachedAppearance;
    } catch (error) {
      console.error("PayslipConfigService: Échec lecture appearance, fallback:", error);
      return this.cachedAppearance || { ...DEFAULT_PAYSLIP_APPEARANCE };
    }
  }

  /**
   * Récupère la configuration légale (avec cache 5 min & fallback sécurisé)
   */
  public async getLegal(): Promise<PayslipLegalConfig> {
    const now = Date.now();
    if (this.cachedLegal && now - this.lastFetchLegal < this.CACHE_TTL_MS) {
      return this.cachedLegal;
    }

    try {
      const doc = await prisma.settings.findUnique({
        where: { key: "payslip_legal" },
      });

      if (doc && doc.value) {
        const val = doc.value as unknown as Partial<PayslipLegalConfig>;
        // deepMerge avec les defaults (Réserve 3.2 — rétrocompatibilité)
        this.cachedLegal = {
          ...DEFAULT_PAYSLIP_LEGAL,
          ...val,
        };
      } else {
        this.cachedLegal = { ...DEFAULT_PAYSLIP_LEGAL };
      }

      this.lastFetchLegal = Date.now();
      return this.cachedLegal;
    } catch (error) {
      console.error("PayslipConfigService: Échec lecture legal, fallback:", error);
      return this.cachedLegal || { ...DEFAULT_PAYSLIP_LEGAL };
    }
  }

  // ═══════════════════════════════════════════════
  // ÉCRITURE (avec Invalidation immédiate du cache)
  // ═══════════════════════════════════════════════

  /**
   * Met à jour la configuration d'apparence + invalidation cache immédiate
   */
  public async updateAppearance(
    config: Partial<PayslipAppearanceConfig>
  ): Promise<PayslipAppearanceConfig> {
    const current = await this.getAppearance();
    const updated: PayslipAppearanceConfig = { ...current, ...config };

    await prisma.settings.upsert({
      where: { key: "payslip_appearance" },
      update: { value: updated as any },
      create: { key: "payslip_appearance", value: updated as any },
    });

    // Invalidation immédiate (Réserve 3.3 — cache & invalidation)
    this.cachedAppearance = updated;
    this.lastFetchAppearance = Date.now();
    return updated;
  }

  /**
   * Met à jour la configuration légale + invalidation cache immédiate
   */
  public async updateLegal(
    config: Partial<PayslipLegalConfig>
  ): Promise<PayslipLegalConfig> {
    const current = await this.getLegal();
    const updated: PayslipLegalConfig = { ...current, ...config };

    await prisma.settings.upsert({
      where: { key: "payslip_legal" },
      update: { value: updated as any },
      create: { key: "payslip_legal", value: updated as any },
    });

    // Invalidation immédiate (Réserve 3.3)
    this.cachedLegal = updated;
    this.lastFetchLegal = Date.now();
    return updated;
  }

  // ═══════════════════════════════════════════════
  // SNAPSHOT IMMUTABLE (pour versioning des bulletins)
  // ═══════════════════════════════════════════════

  /**
   * Crée un snapshot immutable de la configuration complète à ce moment précis.
   * Appelé lors de chaque génération mensuelle de paie.
   *
   * Le snapshot fige : apparence + mentions légales + taux métier,
   * garantissant la non-rétroactivité des bulletins historiques.
   *
   * Note (Réserve 3.1) : Le logoBase64 est exclu du snapshot pour limiter
   * la taille JSON. Seule la référence "logoBase64 present" est stockée.
   */
  public async createSnapshot(adminId: string): Promise<string> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { companyId: true },
    });
    if (!admin) throw new Error("Administrateur introuvable");
    const appearance = await this.getAppearance();
    const legal = await this.getLegal();
    const rateService = RateService.getInstance();
    const rates = await rateService.getRates();

    // Réserve 3.1 : Exclure les données binaires volumineuses du snapshot
    // On stocke un flag indiquant la présence du logo, pas les données brutes
    const appearanceForSnapshot: Record<string, unknown> = {
      primaryColor: appearance.primaryColor,
      headerTitle: appearance.headerTitle,
      headerSubtitle: appearance.headerSubtitle,
      hasLogo: !!appearance.logoBase64,
    };

    const snapshot = await prisma.payslipConfigSnapshot.create({
      data: {
        companyId: admin.companyId,
        appearanceConfig: appearanceForSnapshot as any,
        legalConfig: legal as any,
        ratesConfig: rates as unknown as any,
        createdById: adminId,
      },
    });

    return snapshot.id;
  }

  /**
   * Récupère la configuration complète depuis un snapshot existant.
   * Utilisé pour la ré-impression de bulletins historiques.
   *
   * Réserve 3.2 : deepMerge avec les defaults pour les champs ajoutés
   * après la création du snapshot (rétrocompatibilité).
   */
  public async getConfigFromSnapshot(snapshotId: string): Promise<{
    appearance: PayslipAppearanceConfig;
    legal: PayslipLegalConfig;
    rates: PayrollRatesConfig;
  } | null> {
    try {
      const snapshot = await prisma.payslipConfigSnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot) return null;

      const { DEFAULT_PAYROLL_RATES } = await import("./rates-config");
      const globalAppearance = await this.getAppearance();
      const snapAppearance = snapshot.appearanceConfig as unknown as Partial<PayslipAppearanceConfig> & { hasLogo?: boolean };

      return {
        appearance: {
          ...DEFAULT_PAYSLIP_APPEARANCE,
          ...snapAppearance,
          logoBase64: snapAppearance.hasLogo ? globalAppearance.logoBase64 : undefined,
        },
        legal: {
          ...DEFAULT_PAYSLIP_LEGAL,
          ...(snapshot.legalConfig as unknown as Partial<PayslipLegalConfig>),
        },
        rates: {
          ...DEFAULT_PAYROLL_RATES,
          ...(snapshot.ratesConfig as unknown as Partial<PayrollRatesConfig>),
        },
      };
    } catch (error) {
      console.error("PayslipConfigService: Échec lecture snapshot:", error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════
  // INVALIDATION DU CACHE
  // ═══════════════════════════════════════════════

  /**
   * Invalide le cache complet pour forcer un rechargement immédiat
   */
  public invalidateCache(): void {
    this.cachedAppearance = null;
    this.cachedLegal = null;
    this.lastFetchAppearance = 0;
    this.lastFetchLegal = 0;
  }
}
