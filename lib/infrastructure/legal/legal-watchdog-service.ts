/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Service d'Intelligence Légale (Infrastructure ⚖️)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Surveille et gère les évolutions réglementaires et fiscales (Côte d'Ivoire).
 * Permet l'analyse, la validation et l'application automatique ou contrôlée
 * des nouveaux taux et barèmes dans le moteur de paie.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";
import { SettingsRepository } from "@/lib/infrastructure/repositories/settings-repository";

export interface LegalAlertItem {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string;
  officialText?: string | null;
  effectiveDate: Date;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "APPLIED";
  proposedRates?: any;
}

export class LegalWatchdogService {
  private settingsRepo = new SettingsRepository();

  /**
   * Récupère la liste de toutes les alertes légales
   */
  public async getAlerts(): Promise<ReadonlyArray<LegalAlertItem>> {
    const alerts = await prisma.legalAlert.findMany({
      orderBy: { effectiveDate: "desc" },
    });

    if (alerts.length === 0) {
      // Semences d'initialisation des premières alertes légales de démonstration
      await this.seedInitialLegalAlerts();
      return prisma.legalAlert.findMany({ orderBy: { effectiveDate: "desc" } });
    }

    return alerts;
  }

  /**
   * Applique les taux proposés d'une alerte validée dans la configuration officielle
   */
  public async applyAlertRates(alertId: string, reviewerId: string): Promise<boolean> {
    const alert = await prisma.legalAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert || !alert.proposedRates) {
      throw new Error("Alerte introuvable ou ne contenant pas de proposition de taux.");
    }

    // 1. Récupération des taux de paie actuels
    const currentRates = (await this.settingsRepo.getByKey("tax_rates")) || {};

    // 2. Fusion des nouveaux taux applicables
    const proposedObj = (alert.proposedRates && typeof alert.proposedRates === "object") ? alert.proposedRates as Record<string, any> : {};
    const updatedRates = {
      ...currentRates,
      ...proposedObj,
      lastUpdatedByAlert: alert.id,
      lastUpdatedAt: new Date().toISOString(),
    };

    // 3. Mise à jour de la configuration de paie officielle
    await this.settingsRepo.saveByKey("tax_rates", updatedRates);

    // 4. Passage du statut de l'alerte à APPLIED
    await prisma.legalAlert.update({
      where: { id: alertId },
      data: {
        status: "APPLIED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Initialise les alertes de démonstration réglementaire (ex: Décret SMIC / Plafond CNPS)
   */
  private async seedInitialLegalAlerts(): Promise<void> {
    await prisma.legalAlert.createMany({
      data: [
        {
          title: "Révision du Plafond Annuel CNPS Régime Retraite",
          source: "Caisse Nationale de Prévoyance Sociale (CNPS CI)",
          category: "CNPS",
          summary: "Rehaussement du plafond mensuel de cotisation retraite de 1 647 315 FCFA à 3 375 000 FCFA.",
          officialText: "Circulaire d'information N° 2026/CNPS/DG — Fixation des plafonds de cotisation.",
          effectiveDate: new Date("2026-01-01"),
          severity: "CRITICAL",
          status: "PENDING_REVIEW",
          proposedRates: {
            cnpsCeilingRetraite: 3375000,
          },
        },
        {
          title: "Ajustement de la Contribution Nationale (CN) & ITS",
          source: "Direction Générale des Impôts (DGI CI)",
          category: "ITS",
          summary: "Mise à jour des règles d'exonération de l'indemnité de transport non imposable à 30 000 FCFA.",
          officialText: "Code Général des Impôts Côte d'Ivoire — Article 45 et suivants.",
          effectiveDate: new Date("2026-02-01"),
          severity: "HIGH",
          status: "APPLIED",
          proposedRates: {
            transportExemptAmount: 30000,
            itsRate: 1.2,
          },
        },
      ],
    });
  }
}
