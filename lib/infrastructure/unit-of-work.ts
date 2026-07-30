/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Unit of Work (Infrastructure)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Pattern Unit of Work encapsulant les transactions Prisma.
 * Assure la cohérence atomique des opérations de paie complexes
 * (ex: génération groupée de bulletins + enregistrement d'audit).
 *
 * ADR-002 : Tout traitement de paie multi-enregistrements DOIT passer
 *           par le UnitOfWork pour éviter les écritures partielles.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { prisma } from "@/lib/db";

export interface IUnitOfWork {
  executeTransaction<T>(work: (tx: any) => Promise<T>): Promise<T>;
}

export class UnitOfWork implements IUnitOfWork {
  /**
   * Exécute un bloc de travail au sein d'une transaction Prisma atomique.
   * En cas d'erreur ou d'exception, toute la transaction est annulée (rollback).
   *
   * @param work - Fonction asynchrone recevant l'instance de transaction `tx`
   * @returns Le résultat du bloc de travail
   */
  public async executeTransaction<T>(work: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      return await work(tx);
    }, {
      maxWait: 10000, // Attente max verrou : 10 sec
      timeout: 30000, // Time-out transaction : 30 sec
    });
  }
}
