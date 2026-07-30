/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Calculateur de Distance GPS & Formule de Haversine (📍)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Calcule la distance orthodromique exacte en mètres entre 2 coordonnées GPS
 * (Latitude / Longitude) sur la surface de la Terre.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface GeofenceCheckInput {
  userLat: number;
  userLng: number;
  accuracyMeters?: number; // Précision estimée par le navigateur HTML5 (en mètres)
  officeLat: number;
  officeLng: number;
  radiusMeters: number; // Rayon officiel d'autorisation (ex: 100m)
}

export interface GeofenceCheckResult {
  isWithinFence: boolean;
  distanceMeters: number;
  effectiveDistanceMeters: number; // Distance ajustée avec le seuil de tolérance GPS
  accuracyMeters: number;
  message: string;
}

/**
 * Calcule la distance en mètres entre deux points GPS via la formule d'Haversine
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Rayon moyen de la Terre en mètres

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance);
}

/**
 * Vérifie si une position GPS est dans le périmètre autorisé avec tolérance de précision
 */
export function verifyGeofenceFence(input: GeofenceCheckInput): GeofenceCheckResult {
  const { userLat, userLng, accuracyMeters = 15, officeLat, officeLng, radiusMeters } = input;

  const rawDistance = calculateHaversineDistance(userLat, userLng, officeLat, officeLng);
  
  // Prise en compte de la tolérance de précision de l'appareil (Recommandation 2.2)
  const effectiveDistance = Math.max(0, rawDistance - Math.min(accuracyMeters, 30));
  const isWithinFence = effectiveDistance <= radiusMeters;

  let message = "";
  if (isWithinFence) {
    message = `Présence au bureau confirmée (à ${rawDistance}m des locaux, précision ±${Math.round(accuracyMeters)}m).`;
  } else {
    message = `Pointage hors zone : vous êtes à ${rawDistance}m des locaux de l'entreprise (rayon autorisé : ${radiusMeters}m).`;
  }

  return {
    isWithinFence,
    distanceMeters: rawDistance,
    effectiveDistanceMeters: effectiveDistance,
    accuracyMeters,
    message,
  };
}
