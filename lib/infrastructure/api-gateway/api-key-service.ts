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
import { Prisma } from "@prisma/client";
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
  public async createApiKey(companyId: string, name: string, permissions: string[] = ["read:all"]): Promise<ApiKeyCreateResult> {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `pk_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = this.hashKey(rawKey);

    const permissionPayload: Prisma.InputJsonValue = permissions;
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        companyId,
        name,
        keyHash,
        keyPrefix,
        permissions: permissionPayload,
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
   * Retourne l'enregistrement de la clé si valide, null sinon.
   */
  public async validateApiKey(rawKey: string): Promise<{ id: string; companyId: string } | null> {
    if (!rawKey || !rawKey.startsWith("pk_live_")) {
      return null;
    }

    const keyHash = this.hashKey(rawKey);
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, isActive: true, expiresAt: true, companyId: true },
    });

    if (!record || !record.isActive) {
      return null;
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return null;
    }

    // Mise à jour asynchrone du dernier horodatage d'utilisation
    await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return { id: record.id, companyId: record.companyId };
  }

  /**
   * Récupère la liste de toutes les clés API actives
   */
  public async listApiKeys(companyId: string) {
    return prisma.apiKey.findMany({
      where: { companyId },
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
