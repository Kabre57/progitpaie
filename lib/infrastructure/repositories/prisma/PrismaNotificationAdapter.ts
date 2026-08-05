import { NotificationPort } from "@/lib/application/payroll/ports/NotificationPort";
import { createNotification } from "@/lib/notifications";

export class PrismaNotificationAdapter implements NotificationPort {
  public async notifyPayslipFinalized(userId: string, month: number, year: number): Promise<void> {
    const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" });
    await createNotification({
      userId,
      title: "Fiche de paie disponible",
      message: `Votre fiche de paie de ${monthName} ${year} a été validée et est disponible au téléchargement.`,
      type: "success",
      link: "/employee/payslip",
    });
  }
}
