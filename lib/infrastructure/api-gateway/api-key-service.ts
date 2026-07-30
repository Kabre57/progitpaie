/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Service Clés API & API Gateway (Infrastructure 🔌)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Gère la génération, le hachage sécurisé SHA-256 et la validation des clés API
 * pour l'intégration des systèmes ERP (SAP, Sage, Odoo, QuickBooks, PowerBI).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from "crypto";
import { prisma } from "@/lib/db";

export interface ApiKeyCreateResult {
  id: string;
  name: string;
  rawKey: string; // Clé brute affichée une seule fois à l'administrateur
  keyPrefix: string;
}

export class ApiKeyService {
  /**
   * Hache une clé API brute avec l'algorithme SHA-256
   */
  private hashKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
  }

  /**
   * Génère une nouvelle clé API pour un ERP partenaire
   */
  public async createApiKey(name: string, permissions: string[] = ["read:all"]): Promise<ApiKeyCreateResult> {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `pk_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = this.hashKey(rawKey);

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        permissions: permissions as any,
        isActive: true,
      },
    });

    return {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      rawKey,
      keyPrefix,
    };
  }

  /**
   * Valide l'authenticité d'une clé API transmise dans les en-têtes HTTP (x-api-key ou Bearer)
   */
  public async validateApiKey(rawKey: string): Promise<boolean> {
    if (!rawKey || !rawKey.startsWith("pk_live_")) {
      return false;
    }

    const keyHash = this.hashKey(rawKey);
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!record || !record.isActive) {
      return false;
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return false;
    }

    // Mise à jour asynchrone du dernier horodatage d'utilisation
    await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  /**
   * Récupère la liste de toutes les clés API actives
   */
  public async listApiKeys() {
    return prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
