/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Modèles Attestation de Travail & Congés 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface AttestationData {
  companyName: string;
  companyAddress: string;
  employeeName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  leaveType?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
}

export function generateWorkAttestationHTML(data: AttestationData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Attestation de Travail - ${data.employeeName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .content { margin: 30px 0; text-align: justify; }
        .footer { margin-top: 60px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${data.companyName}</h2>
        <p>${data.companyAddress}</p>
        <br/><br/>
        <div class="title">ATTESTATION DE TRAVAIL</div>
      </div>

      <div class="content">
        <p>Nous soussignés, <strong>${data.companyName}</strong>, attestons par la présente que :</p>
        <p style="font-size: 15px; margin: 20px 0;">Monsieur / Madame <strong>${data.employeeName}</strong></p>
        <p>est employé(e) au sein de notre entreprise en qualité de <strong>${data.jobTitle}</strong> depuis le <strong>${data.startDate}</strong>${data.endDate ? ` jusqu'au <strong>${data.endDate}</strong>` : " et est toujours en fonction à ce jour"}.</p>
        <p>Cette attestation lui est délivrée sur sa demande pour servir et valoir ce que de droit.</p>
      </div>

      <div class="footer">
        <p>Fait à Abidjan, le ${new Date().toLocaleDateString("fr-FR")}</p>
        <p style="margin-top: 50px;"><strong>La Direction des Ressources Humaines</strong></p>
      </div>
    </body>
    </html>
  `;
}
