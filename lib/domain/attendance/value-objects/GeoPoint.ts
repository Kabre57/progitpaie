/**
 * Value Object représentant des coordonnées GPS géofencées.
 */
export class GeoPoint {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly accuracyMeters?: number,
    public readonly distanceMeters?: number,
    public readonly isWithinFence: boolean = true
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Latitude invalide : ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Longitude invalide : ${longitude}`);
    }
  }

  public static create(
    latitude: number,
    longitude: number,
    accuracyMeters?: number,
    distanceMeters?: number,
    isWithinFence: boolean = true
  ): GeoPoint {
    return new GeoPoint(latitude, longitude, accuracyMeters, distanceMeters, isWithinFence);
  }
}
