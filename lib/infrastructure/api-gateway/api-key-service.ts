/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Service Clés API & API Gateway (Infrastructure 🔌)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Gère la génération, le hachage sécurisé SHA-256, la validation des scopes,
 * la révocation et la rotation des clés API pour ERP (SAP, Sage, Odoo, etc.).
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
  permissions: string[];
  expiresAt: Date | null;
}

export interface ValidatedApiKeyContext {
  id: string;
  companyId: string;
  permissions: string[];
}

export class ApiKeyService {
  /**
   * Hache une clé API brute avec l'algorithme SHA-256
   */
  private hashKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
  }

  /**
   * Génère une nouvelle clé API pour un ERP partenaire avec portée (scopes) et expiration optionnelle
   */
  public async createApiKey(
    companyId: string,
    name: string,
    permissions: string[] = ["read:employees", "read:payroll"],
    expiresInDays?: number | null
  ): Promise<ApiKeyCreateResult> {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `pk_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = this.hashKey(rawKey);

    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const permissionPayload: Prisma.InputJsonValue = permissions;
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        companyId,
        name,
        keyHash,
        keyPrefix,
        permissions: permissionPayload,
        expiresAt,
        isActive: true,
      },
    });

    return {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      rawKey,
      keyPrefix,
      permissions,
      expiresAt: apiKeyRecord.expiresAt,
    };
  }

  /**
   * Valide l'authenticité et retourne l'identifiant, le tenant et les permissions d'une clé API.
   */
  public async validateApiKey(rawKey: string): Promise<ValidatedApiKeyContext | null> {
    if (!rawKey || !rawKey.startsWith("pk_live_")) {
      return null;
    }

    const keyHash = this.hashKey(rawKey);
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, isActive: true, expiresAt: true, companyId: true, permissions: true },
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

    let permissions: string[] = [];
    if (Array.isArray(record.permissions)) {
      permissions = record.permissions as string[];
    } else if (record.permissions && typeof record.permissions === "object") {
      permissions = Object.keys(record.permissions);
    }

    return {
      id: record.id,
      companyId: record.companyId,
      permissions,
    };
  }

  /**
   * Révoque immédiatement une clé API (desactivation irréversible)
   */
  public async revokeApiKey(companyId: string, id: string): Promise<boolean> {
    const result = await prisma.apiKey.updateMany({
      where: { id, companyId, isActive: true },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  /**
   * Effectue la rotation d'une clé API : révoque l'ancienne clé et en crée une nouvelle avec les mêmes scopes
   */
  public async rotateApiKey(companyId: string, id: string): Promise<ApiKeyCreateResult> {
    const oldKey = await prisma.apiKey.findFirst({
      where: { id, companyId },
    });

    if (!oldKey) {
      throw new Error("Clé API non trouvée");
    }

    // 1. Désactiver l'ancienne clé
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    // 2. Extraire les permissions existantes
    let existingPermissions: string[] = ["read:employees", "read:payroll"];
    if (Array.isArray(oldKey.permissions)) {
      existingPermissions = oldKey.permissions as string[];
    }

    // 3. Créer une nouvelle clé
    return this.createApiKey(
      companyId,
      `${oldKey.name} (Rotated)`,
      existingPermissions,
      undefined
    );
  }

  /**
   * Récupère la liste de toutes les clés API (actives et révoquées) d'une entreprise
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
