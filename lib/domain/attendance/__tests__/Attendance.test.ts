import { AttendanceStatus } from "../value-objects/AttendanceStatus";
import { GeoPoint } from "../value-objects/GeoPoint";
import { WorkDuration } from "../value-objects/WorkDuration";
import { AttendanceCalculatorService } from "../services/AttendanceCalculatorService";

describe("Domaine Attendance — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée un pointage à l'heure", () => {
    const service = new AttendanceCalculatorService();
    const checkInTime = new Date("2026-08-05T07:55:00.000Z");

    const attendance = service.createCheckIn({
      companyId,
      userId,
      checkInTime,
      expectedStartTime: "08:00",
    });

    expect(attendance.companyId).toBe(companyId);
    expect(attendance.userId).toBe(userId);
    expect(attendance.status.isPresent()).toBe(true);
    expect(attendance.status.isLate()).toBe(false);
  });

  it("détecte un retard au-delà de 15 minutes de grâce", () => {
    const service = new AttendanceCalculatorService();
    const checkInTime = new Date("2026-08-05T08:20:00.000Z");

    const attendance = service.createCheckIn({
      companyId,
      userId,
      checkInTime,
      expectedStartTime: "08:00",
    });

    expect(attendance.status.isLate()).toBe(true);
  });

  it("calcule la durée du travail lors de la sortie (Check-Out)", () => {
    const service = new AttendanceCalculatorService();
    const checkInTime = new Date("2026-08-05T08:00:00.000Z");
    const attendance = service.createCheckIn({ companyId, userId, checkInTime });

    const checkOutTime = new Date("2026-08-05T17:00:00.000Z"); // 9 heures
    attendance.processCheckOut(checkOutTime);

    expect(attendance.checkOut).toEqual(checkOutTime);
    expect(attendance.workDuration.hoursWorked).toBe(9);
    expect(attendance.workDuration.workingMinutes).toBe(540);
    expect(attendance.workDuration.overtimeMinutes).toBe(60); // 1 heure supp (au-delà de 8h)
  });

  it("permet à l'administrateur de surcharger le statut", () => {
    const service = new AttendanceCalculatorService();
    const checkInTime = new Date("2026-08-05T08:00:00.000Z");
    const attendance = service.createCheckIn({ companyId, userId, checkInTime });

    attendance.overrideStatus(AttendanceStatus.halfDay(), "admin-789", "Maladie l'après-midi");

    expect(attendance.status.value).toBe("half_day");
    expect(attendance.overriddenById).toBe("admin-789");
    expect(attendance.notes).toContain("Admin: Maladie l'après-midi");
  });
});
