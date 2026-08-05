import { AttendanceStatus } from "../value-objects/AttendanceStatus";
import { GeoPoint } from "../value-objects/GeoPoint";
import { WorkDuration } from "../value-objects/WorkDuration";
import { Attendance } from "../entities/Attendance";

export interface CheckInInput {
  companyId: string;
  userId: string;
  checkInTime: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    distanceMeters?: number;
    isWithinFence?: boolean;
  };
  notes?: string;
  expectedStartTime?: string; // Ex: "08:00"
}

export class AttendanceCalculatorService {
  /**
   * Crée une nouvelle entité de pointage lors d'un Check-In en déterminant si le salarié est à l'heure ou en retard.
   */
  public createCheckIn(input: CheckInInput): Attendance {
    const dateStr = input.checkInTime.toISOString().split("T")[0];

    // Détermination du statut (retard si > expectedStartTime + 15 min de grâce)
    let status = AttendanceStatus.present();
    if (input.expectedStartTime) {
      const [expHours, expMins] = input.expectedStartTime.split(":").map((n) => parseInt(n, 10));
      const expDate = new Date(input.checkInTime);
      expDate.setHours(expHours, expMins + 15, 0, 0); // 15 min de grâce

      if (input.checkInTime > expDate) {
        status = AttendanceStatus.late();
      }
    }

    const geo = input.location
      ? GeoPoint.create(
          input.location.latitude,
          input.location.longitude,
          input.location.accuracyMeters,
          input.location.distanceMeters,
          input.location.isWithinFence
        )
      : null;

    return new Attendance({
      companyId: input.companyId,
      userId: input.userId,
      date: dateStr,
      checkIn: input.checkInTime,
      status,
      workDuration: WorkDuration.zero(),
      location: geo,
      notes: input.notes,
    });
  }
}
