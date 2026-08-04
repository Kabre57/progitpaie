import type { LeaveLedgerMovement } from "@/lib/domain/payroll/provision/data";
import type { LeaveLedgerEntry } from "@prisma/client";
import { TenantDataMismatchError } from "./payroll-compensation.mapper";

export function mapLeaveLedgerEntry(
  entry: LeaveLedgerEntry,
  companyId: string
): LeaveLedgerMovement {
  if (entry.companyId !== companyId) {
    throw new TenantDataMismatchError(`L'écriture de congés ${entry.id} n'appartient pas au tenant demandé`);
  }
  return {
    id: entry.id,
    companyId: entry.companyId,
    userId: entry.userId,
    effectiveDate: entry.effectiveDate,
    referencePeriod: entry.referencePeriod,
    entryType: entry.entryType,
    days: entry.days.toFixed(4),
    sourceType: entry.sourceType,
    sourceId: entry.sourceId,
    ruleVersion: entry.ruleVersion,
    isEstimated: entry.isEstimated,
  };
}
