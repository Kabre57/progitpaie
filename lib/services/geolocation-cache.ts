/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Cache In-Memory des Coordonnées GPS Entreprises (⚡)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Évite les requêtes répétitives vers la base de données lors des heures de pointe
 * de pointage (ex: 08h00 - 09h00).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";

export interface CachedCompanyGPS {
  companyId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timestamp: number;
}

export class GeolocationCache {
  private static instance: GeolocationCache;
  private cache = new Map<string, CachedCompanyGPS>();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 heure

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
        const company: any = await prisma.company.findUnique({
          where: { id: companyId },
        });

        if (company && company.latitude !== undefined && company.latitude !== null) {
          const coords = {
            latitude: parseFloat(company.latitude),
            longitude: parseFloat(company.longitude),
            radiusMeters: parseFloat(company.radiusMeters || 100.0),
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
      const globalSettings = await prisma.settings.findUnique({
        where: { key: "location" },
      });

      if (globalSettings && globalSettings.value) {
        const val = globalSettings.value as any;
        const coords = {
          latitude: parseFloat(val.latitude || val.officeLat || defaultCoords.latitude),
          longitude: parseFloat(val.longitude || val.officeLng || defaultCoords.longitude),
          radiusMeters: parseFloat(val.radiusMeters || defaultCoords.radiusMeters),
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
