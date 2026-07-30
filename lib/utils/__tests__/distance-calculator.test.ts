/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Tests Unitaires Calculateur Haversine & Geofencing GPS 📍
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { calculateHaversineDistance, verifyGeofenceFence } from "../distance-calculator";

describe("Distance Calculator (Formule d'Haversine)", () => {
  const officeLat = 5.3484; // Siège Abidjan Plateau
  const officeLng = -4.0305;

  it("devrait retourner 0 mètre pour deux positions GPS identiques", () => {
    const dist = calculateHaversineDistance(officeLat, officeLng, officeLat, officeLng);
    expect(dist).toBe(0);
  });

  it("devrait valider une position située à l'intérieur du rayon de 100 mètres", () => {
    // Coordonnées situées à environ 30m du bureau
    const userLat = 5.3486;
    const userLng = -4.0305;

    const result = verifyGeofenceFence({
      userLat,
      userLng,
      accuracyMeters: 10,
      officeLat,
      officeLng,
      radiusMeters: 100,
    });

    expect(result.isWithinFence).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(100);
  });

  it("devrait rejeter un pointage situé hors zone (> 100 mètres)", () => {
    // Coordonnées situées à environ 1.5km du bureau (ex: Cocody)
    const userLat = 5.3600;
    const userLng = -4.0100;

    const result = verifyGeofenceFence({
      userLat,
      userLng,
      accuracyMeters: 10,
      officeLat,
      officeLng,
      radiusMeters: 100,
    });

    expect(result.isWithinFence).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(100);
  });

  it("devrait appliquer le seuil de tolérance de précision GPS de l'appareil (Recommandation 2.2)", () => {
    // Coordonnées à 110 mètres mais avec une imprécision GPS de 20 mètres
    const userLat = 5.3494;
    const userLng = -4.0305;

    const result = verifyGeofenceFence({
      userLat,
      userLng,
      accuracyMeters: 20,
      officeLat,
      officeLng,
      radiusMeters: 100,
    });

    expect(result.effectiveDistanceMeters).toBeLessThanOrEqual(100);
    expect(result.isWithinFence).toBe(true);
  });
});
