/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Modèle Reçu pour Solde de Tout Compte (STC) 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface SeveranceData {
  companyName: string;
  employeeName: string;
  jobTitle: string;
  leaveBalanceAmount: number;
  noticeAllowance: number;
  severancePay: number;
  totalAmount: number;
}

export function generateSeveranceHTML(data: SeveranceData): string {
  const formattedTotal = new Intl.NumberFormat("fr-FR").format(data.totalAmount);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Solde de Tout Compte - ${data.employeeName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        .table th { bg-color: #f1f5f9; font-weight: bold; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${data.companyName}</h2>
        <h3>RECU POUR SOLDE DE TOUT COMPTE</h3>
      </div>

      <p>Je soussigné(e) <strong>${data.employeeName}</strong> (${data.jobTitle}), reconnais avoir reçu de la société <strong>${data.companyName}</strong> la somme totale de :</p>
      
      <div class="total">${formattedTotal} FCFA</div>

      <table class="table">
        <thead>
          <tr>
            <th>Rubrique Solde Tout Compte</th>
            <th style="text-align: right;">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Indemnité de Congés Payés Reliquats</td>
            <td style="text-align: right;">${new Intl.NumberFormat("fr-FR").format(data.leaveBalanceAmount)}</td>
          </tr>
          <tr>
            <td>Indemnité de Préavis</td>
            <td style="text-align: right;">${new Intl.NumberFormat("fr-FR").format(data.noticeAllowance)}</td>
          </tr>
          <tr>
            <td>Indemnité de Licenciement / Départ</td>
            <td style="text-align: right;">${new Intl.NumberFormat("fr-FR").format(data.severancePay)}</td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top: 30px;">Ce versement est fait pour solde de tout compte et règlement définitif de tous salaires, indemnités et sommes quelconques qui m'étaient dus au titre de l'exécution et de la résiliation de mon contrat de travail.</p>

      <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div>Fait à Abidjan, le ${new Date().toLocaleDateString("fr-FR")}</div>
        <div><strong>Signature du Salarié</strong><br/>(Précédée de la mention "Lu et approuvé")</div>
      </div>
    </body>
    </html>
  `;
}
