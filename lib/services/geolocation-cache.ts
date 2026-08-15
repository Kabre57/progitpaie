/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Cache In-Memory des Coordonnées GPS Entreprises (⚡)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Évite les requêtes répétitives vers la base de données lors des heures de pointe
 * de pointage (ex: 08h00 - 09h00).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PrismaCompanySettingsRepository } from "@/lib/infrastructure/repositories/prisma/PrismaCompanySettingsRepository";
import { SettingsRepository } from "@/lib/infrastructure/repositories/settings-repository";

export interface CachedCompanyGPS {
  companyId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timestamp: number;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toCoordinate(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number" || typeof value === "string"
      ? Number.parseFloat(String(value))
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class GeolocationCache {
  private static instance: GeolocationCache;
  private cache = new Map<string, CachedCompanyGPS>();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 heure
  private companySettingsRepo: PrismaCompanySettingsRepository;
  private globalSettingsRepo: SettingsRepository;

  private constructor() {
    this.companySettingsRepo = new PrismaCompanySettingsRepository();
    this.globalSettingsRepo = new SettingsRepository();
  }

  public static getInstance(): GeolocationCache {
    if (!GeolocationCache.instance) {
      GeolocationCache.instance = new GeolocationCache();
    }
    return GeolocationCache.instance;
  }

  /**
   * Récupère les coordonnées GPS d'une entreprise depuis le cache, la société ou les paramètres globaux
   */
  public async getCompanyGPS(companyId?: string | null): Promise<{ latitude: number; longitude: number; radiusMeters: number }> {
    const defaultCoords = { latitude: 5.3484, longitude: -4.0305, radiusMeters: 100.0 }; // Abidjan Plateau par défaut

    const cacheKey = companyId || "global_main";

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TTL_MS) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        radiusMeters: cached.radiusMeters,
      };
    }

    // 1. Recherche entreprise (récupération sécurisée)
    if (companyId) {
      try {
        const company = await this.companySettingsRepo.getCompanyGPS(companyId);

        if (company && company.latitude !== undefined && company.latitude !== null) {
          const coords = {
            latitude: toCoordinate(company.latitude, defaultCoords.latitude),
            longitude: toCoordinate(company.longitude, defaultCoords.longitude),
            radiusMeters: toCoordinate(company.radiusMeters, defaultCoords.radiusMeters),
          };
          this.cache.set(cacheKey, { companyId: cacheKey, ...coords, timestamp: Date.now() });
          return coords;
        }
      } catch (err) {
        console.error("Company GPS fetch error:", err);
      }
    }

    // 2. Recherche configuration globale Settings
    try {
      const globalSettings = await this.globalSettingsRepo.getByKey<Record<string, unknown>>("location");

      if (globalSettings) {
        const val = toRecord(globalSettings);
        const coords = {
          latitude: toCoordinate(val.latitude ?? val.officeLat, defaultCoords.latitude),
          longitude: toCoordinate(val.longitude ?? val.officeLng, defaultCoords.longitude),
          radiusMeters: toCoordinate(val.radiusMeters, defaultCoords.radiusMeters),
        };
        this.cache.set(cacheKey, { companyId: cacheKey, ...coords, timestamp: Date.now() });
        return coords;
      }
    } catch (err) {
      console.error("Global Settings GPS fetch error:", err);
    }

    return defaultCoords;
  }

  /**
   * Invalide le cache pour une entreprise modifiée
   */
  public invalidateCache(companyId?: string): void {
    if (companyId) {
      this.cache.delete(companyId);
    }
    this.cache.delete("global_main");
  }
}
