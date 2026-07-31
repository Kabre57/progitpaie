import nodemailer from "nodemailer";

export interface AlertNotification {
  level: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  timestamp: string;
}

export async function sendSystemAlert(alert: AlertNotification) {
  console.log(`🚨 [ALERT ${alert.level}] ${alert.title}: ${alert.message}`);

  // Envoi d'email automatique pour les alertes critiques
  if (alert.level === "CRITICAL" && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: '"PROGITPAIE Monitoring" <alerts@progitpaie.online>',
        to: process.env.ADMIN_ALERT_EMAIL || "admin@progitpaie.online",
        subject: `[ALERTE ${alert.level}] ${alert.title}`,
        text: `${alert.message}\n\nHorodatage: ${alert.timestamp}`,
      });
      console.log("📧 Email d'alerte envoyé avec succès à l'administrateur.");
    } catch (err) {
      console.error("❌ Échec envoi email d'alerte:", err);
    }
  }
}
