import { SettingsRepository } from "@/lib/infrastructure/repositories/settings-repository";
import { PayrollRatesConfig, DEFAULT_PAYROLL_RATES } from "./rates-config";

/**
 * Service Singleton de Gestion des Taux de Paie (avec Cache en Mémoire & Fallback)
 */
export class RateService {
  private static instance: RateService;
  private settingsRepo: SettingsRepository;
  private cachedRates: PayrollRatesConfig | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  private constructor() {
    this.settingsRepo = new SettingsRepository();
  }

  public static getInstance(): RateService {
    if (!RateService.instance) {
      RateService.instance = new RateService();
    }
    return RateService.instance;
  }

  /**
   * Récupère la configuration des taux (avec Cache 5 min & Fallback sécurisé)
   */
  public async getRates(): Promise<PayrollRatesConfig> {
    const now = Date.now();
    if (this.cachedRates && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedRates;
    }

    try {
      const val = await this.settingsRepo.getByKey<Partial<PayrollRatesConfig>>("payroll_rates");

      if (val) {
        this.cachedRates = {
          ...DEFAULT_PAYROLL_RATES,
          ...val,
        };
      } else {
        this.cachedRates = { ...DEFAULT_PAYROLL_RATES };
      }

      this.lastFetchTime = Date.now();
      return this.cachedRates;
    } catch (error) {
      console.error("RateService: Échec de lecture en base de données, utilisation du Fallback:", error);
      return this.cachedRates || { ...DEFAULT_PAYROLL_RATES };
    }
  }

  /**
   * Invalide le cache en mémoire pour forcer un rechargement immédiat
   */
  public invalidateCache(): void {
    this.cachedRates = null;
    this.lastFetchTime = 0;
  }

  /**
   * Mettre à jour les taux en BD + Invalidation du cache
   */
  public async updateRates(newRates: Partial<PayrollRatesConfig>): Promise<PayrollRatesConfig> {
    const currentRates = await this.getRates();
    const updatedRates: PayrollRatesConfig = {
      ...currentRates,
      ...newRates,
    };

    await this.settingsRepo.saveByKey("payroll_rates", updatedRates);

    this.invalidateCache();
    return updatedRates;
  }
}
