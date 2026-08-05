import { LeaveType } from "../value-objects/LeaveType";
import { LeaveStatus } from "../value-objects/LeaveStatus";
import { LeavePeriod } from "../value-objects/LeavePeriod";
import { LeaveRequest } from "../entities/LeaveRequest";

describe("Domaine Leave — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée une demande de congé valide et calcule les jours ouvrés", () => {
    const startDate = new Date("2026-08-10T00:00:00.000Z"); // Lundi
    const endDate = new Date("2026-08-14T00:00:00.000Z");   // Vendredi (5 jours)
    const period = LeavePeriod.create(startDate, endDate);

    const leave = new LeaveRequest({
      companyId,
      userId,
      leaveType: LeaveType.annual(),
      period,
      reason: "Congés d'été",
      status: LeaveStatus.pending(),
    });

    expect(leave.period.totalDays).toBe(5);
    expect(leave.status.isPending()).toBe(true);
    expect(leave.leaveType.isPaid()).toBe(true);
  });

  it("permet à un administrateur d'approuver une demande en attente", () => {
    const period = LeavePeriod.create(new Date("2026-08-10"), new Date("2026-08-14"), 5);
    const leave = new LeaveRequest({
      companyId,
      userId,
      leaveType: LeaveType.annual(),
      period,
      reason: "Repos",
      status: LeaveStatus.pending(),
    });

    leave.approve("admin-789", "Accordé sans réserve");

    expect(leave.status.isApproved()).toBe(true);
    expect(leave.approvedById).toBe("admin-789");
    expect(leave.adminComment).toBe("Accordé sans réserve");
  });

  it("interdit de rejeter ou ré-approuver une demande déjà traitée", () => {
    const period = LeavePeriod.create(new Date("2026-08-10"), new Date("2026-08-14"), 5);
    const leave = new LeaveRequest({
      companyId,
      userId,
      leaveType: LeaveType.annual(),
      period,
      reason: "Repos",
      status: LeaveStatus.approved(),
    });

    expect(() => leave.reject("admin-789")).toThrow("Seule une demande de congé en attente peut être rejetée");
  });
});
