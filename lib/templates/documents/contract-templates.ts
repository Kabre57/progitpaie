/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Modèles HTML/CSS Contrats de Travail (CDI / CDD / Stage) 📜
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface ContractDocumentData {
  companyName: string;
  companyAddress: string;
  companyTaxNumber?: string;
  employeeName: string;
  employeeAddress: string;
  employeeNationality?: string;
  jobTitle: string;
  contractType: "CDI" | "CDD" | "STAGE" | string;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  signatureDataUrl?: string;
}

export function generateContractHTML(data: ContractDocumentData): string {
  const isCDD = data.contractType === "CDD";
  const formattedSalary = new Intl.NumberFormat("fr-FR").format(data.baseSalary);
  const formattedTransport = new Intl.NumberFormat("fr-FR").format(data.transportAllowance || 30000);
  const formattedHousing = new Intl.NumberFormat("fr-FR").format(data.housingAllowance || 0);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Contrat de Travail - ${data.employeeName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .subtitle { font-size: 13px; color: #64748b; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
        .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
        .sig-box { width: 45%; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CONTRAT DE TRAVAIL A DUREE ${isCDD ? "DETERMINEE (CDD)" : "INDETERMINEE (CDI)"}</div>
        <div class="subtitle">Conforme au Code du Travail de Côte d'Ivoire (Loi N° 2015-532)</div>
      </div>

      <div class="section">
        <p><strong>ENTRE LES SOUSSIGNES :</strong></p>
        <p>La société <strong>${data.companyName}</strong>, sise à ${data.companyAddress}, ci-après désignée "L'Employeur",</p>
        <p><strong>ET :</strong></p>
        <p>Monsieur/Madame <strong>${data.employeeName}</strong>, résidant à ${data.employeeAddress}, nationalité ${data.employeeNationality || "Ivoirienne"}, ci-après désigné(e) "Le Salarié".</p>
      </div>

      <div class="section">
        <div class="section-title">ARTICLE 1 : ENGAGEMENT ET FONCTION</div>
        <p>L'Employeur engage le Salarié en qualité de <strong>${data.jobTitle}</strong> à compter du <strong>${data.startDate}</strong>${isCDD && data.endDate ? ` jusqu'au <strong>${data.endDate}</strong>` : ""}.</p>
      </div>

      <div class="section">
        <div class="section-title">ARTICLE 2 : REMUNERATION</div>
        <p>En contrepartie de ses services, le Salarié percevra un salaire mensuel de base de <strong>${formattedSalary} FCFA</strong>, auquel s'ajoutent l'indemnité de transport légale de <strong>${formattedTransport} FCFA</strong> et l'indemnité de logement de <strong>${formattedHousing} FCFA</strong>.</p>
      </div>

      <div class="section">
        <div class="section-title">ARTICLE 3 : OBLIGATIONS ET CONFIDENTIALITE</div>
        <p>Le Salarié s'engage à exécuter ses tâches avec loyauté et professionnalisme et à respecter la confidentialité absolue des informations de l'entreprise.</p>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <p><strong>Pour l'Employeur</strong></p>
          <p style="margin-top: 40px;">(Signature et Cachet)</p>
        </div>
        <div class="sig-box">
          <p><strong>Le Salarié</strong></p>
          ${data.signatureDataUrl ? `<img src="${data.signatureDataUrl}" style="height: 50px; margin: 5px auto;" /><p style="font-size: 9px; color: #64748b;">Signé numériquement le ${new Date().toLocaleDateString("fr-FR")}</p>` : `<p style="margin-top: 40px;">(Lu et approuvé)</p>`}
        </div>
      </div>
    </body>
    </html>
  `;
}
